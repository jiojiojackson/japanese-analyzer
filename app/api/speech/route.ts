// Server-side solution for speech generation
// Based on the Python implementation but optimized for Next.js

export async function POST(req: Request) {
  try {
    // Parse the request body
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return Response.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Speech API: Processing text: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`);

    // Define headers that mimic Chrome incognito mode
    const browserHeaders = {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'DNT': '1',
      'Origin': 'https://speechactors.com',
      'Pragma': 'no-cache',
      'Referer': 'https://speechactors.com/',
      'Sec-CH-UA': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // Step 1: Visit the main page to get cookies with specific headers for main page
    console.log('Speech API: Fetching main page to get cookies...');
    const mainPageHeaders = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'DNT': '1',
      'Pragma': 'no-cache',
      'Sec-CH-UA': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    };

    const mainPageResponse = await fetch('https://speechactors.com/', {
      method: 'GET',
      headers: mainPageHeaders
    });

    if (!mainPageResponse.ok) {
      console.error(`Failed to access main page: ${mainPageResponse.status}`);
      return Response.json(
        { error: `Failed to access main page: ${mainPageResponse.status}` },
        { status: 502 }
      );
    }

    // Extract cookies from the response
    const cookies = mainPageResponse.headers.get('set-cookie');
    if (!cookies) {
      console.error('No cookies received from main page');
      return Response.json(
        { error: 'No cookies received from main page' },
        { status: 502 }
      );
    }
    console.log('Cookies received successfully');
    
    // Parse all the cookies into an object
    const cookiesInfo: Record<string, string> = {};
    const cookiePairs = cookies.split(';').map(pair => pair.trim());
    for (const pair of cookiePairs) {
      const [name, ...rest] = pair.split('=');
      const value = rest.join('=');
      if (name && value) {
        // Extract just the cookie name without attributes
        const cleanName = name.split(',').pop()?.trim() || name;
        cookiesInfo[cleanName] = value;
      }
    }

    // Get the CSRF token from cookies
    const csrfToken = cookiesInfo['csrf_cookie_name'];
    if (!csrfToken) {
      console.error('No CSRF token found in cookies');
      return Response.json(
        { error: 'No CSRF token found in cookies' },
        { status: 502 }
      );
    }
    console.log('CSRF token extracted successfully');

    // Step 2: Create a multipart form data boundary, similar to Python's files parameter
    // This is critical as the Python implementation uses files parameter which creates a specific format
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    
    // Prepare form data parts manually to match Python requests.post(files=files) format
    let formDataParts = '';
    
    // Add form fields in the exact same format as Python's requests
    formDataParts += `--${boundary}\r\n`;
    formDataParts += 'Content-Disposition: form-data; name="locale"\r\n\r\n';
    formDataParts += 'ja-JP\r\n';
    
    formDataParts += `--${boundary}\r\n`;
    formDataParts += 'Content-Disposition: form-data; name="text"\r\n\r\n';
    formDataParts += `${text}\r\n`;
    
    formDataParts += `--${boundary}\r\n`;
    formDataParts += 'Content-Disposition: form-data; name="voice"\r\n\r\n';
    formDataParts += 'ja-JP-NanamiNeural\r\n';
    
    formDataParts += `--${boundary}\r\n`;
    formDataParts += 'Content-Disposition: form-data; name="style"\r\n\r\n';
    formDataParts += 'default\r\n';
    
    if (csrfToken) {
      formDataParts += `--${boundary}\r\n`;
      formDataParts += 'Content-Disposition: form-data; name="csrf_token"\r\n\r\n';
      formDataParts += `${csrfToken}\r\n`;
    }
    
    // Close the form data
    formDataParts += `--${boundary}--\r\n`;

    // API request headers
    const apiHeaders: HeadersInit = {
      ...browserHeaders,
      'Cookie': cookies,
      'X-CSRF-TOKEN': csrfToken,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    };

    console.log('Sending TTS API request...');
    
    // Step 3: Send request to generate speech
    const apiResponse = await fetch('https://speechactors.com/open-tool/generate', {
      method: 'POST',
      headers: apiHeaders,
      body: formDataParts
    });

    // Get content type of response
    const contentType = apiResponse.headers.get('content-type') || '';
    console.log(`TTS API response status: ${apiResponse.status}, Content-Type: ${contentType}`);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`API request failed with status ${apiResponse.status}`);
      console.error(`Response content: ${errorText.substring(0, 200)}`);
      
      return Response.json(
        { error: `API request failed: ${apiResponse.status}`, details: errorText },
        { status: 502 }
      );
    }

    // Handle both JSON and direct audio data responses
    const responseData = await apiResponse.text();
    let result;
    
    try {
      result = JSON.parse(responseData);
      if (result.status === 'success' && result.stream) {
        console.log('Successfully generated audio');
        return Response.json({ audioData: result.stream });
      }
    } catch {
      // If response is not JSON, check if it's direct audio data
      if (responseData.length > 1000) { // Audio files are typically large
        console.log('Received direct audio data');
        return Response.json({ audioData: responseData });
      }
    }

    console.error('Invalid response format from API');
    return Response.json(
      { error: 'Invalid response format from API' },
      { status: 502 }
    );

  } catch (error) {
    console.error('Speech generation error:', error);
    return Response.json(
      { error: 'Internal server error during speech generation' },
      { status: 500 }
    );
  }
} 