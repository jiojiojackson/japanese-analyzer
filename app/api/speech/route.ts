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

    // Define headers that mimic Chrome browser
    const browserHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Upgrade-Insecure-Requests': '1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
    };

    // Step 1: Visit the main page to get cookies
    const mainPageResponse = await fetch('https://speechactors.com/', {
      method: 'GET',
      headers: browserHeaders
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
    } else {
      console.log('Cookies received successfully');
    }

    // Extract CSRF token from cookies if present
    let csrfToken = '';
    if (cookies) {
      const match = cookies.match(/csrf_cookie_name=([^;]+)/);
      if (match && match[1]) {
        csrfToken = match[1];
        console.log('CSRF token extracted successfully');
      }
    }

    // Step 2: Create form data for the API request
    const formData = new URLSearchParams();
    formData.append('locale', 'ja-JP');
    formData.append('text', text);
    formData.append('voice', 'ja-JP-NanamiNeural');
    formData.append('style', 'default');
    
    // Add CSRF token if found
    if (csrfToken) {
      formData.append('csrf_token', csrfToken);
    }

    // API request headers
    const apiHeaders: HeadersInit = {
      ...browserHeaders,
      'Accept': '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': 'https://speechactors.com',
      'Referer': 'https://speechactors.com/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // Add cookies if available
    if (cookies) {
      apiHeaders['Cookie'] = cookies;
    }
    
    // Add CSRF token as header if available
    if (csrfToken) {
      apiHeaders['X-CSRF-TOKEN'] = csrfToken;
    }

    console.log('Sending TTS API request...');
    
    // Step 3: Send request to generate speech
    const apiResponse = await fetch('https://speechactors.com/open-tool/generate', {
      method: 'POST',
      headers: apiHeaders,
      body: formData.toString()
    });

    // Get content type of response
    const contentType = apiResponse.headers.get('content-type') || '';
    console.log(`TTS API response status: ${apiResponse.status}, Content-Type: ${contentType}`);

    if (!apiResponse.ok) {
      // Get error response as text for debugging
      const errorText = await apiResponse.text();
      const isHtml = errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html');
      
      console.error(`API request failed with status ${apiResponse.status}`);
      console.error(`Response is HTML: ${isHtml}`);
      console.error(`First 200 chars: ${errorText.substring(0, 200)}`);
      
      return Response.json(
        { 
          error: `API request failed: ${apiResponse.status}`,
          isHtmlResponse: isHtml,
          responsePreview: errorText.substring(0, 500)
        },
        { status: 502 }
      );
    }

    // Check if it's a JSON response
    if (!contentType.includes('json')) {
      const responseText = await apiResponse.text();
      console.error('Unexpected response format (not JSON)');
      console.error(`First 200 chars: ${responseText.substring(0, 200)}`);
      
      return Response.json(
        { 
          error: 'Unexpected response format',
          contentType,
          responsePreview: responseText.substring(0, 500)
        },
        { status: 502 }
      );
    }

    // Parse JSON response
    let result;
    try {
      result = await apiResponse.json();
    } catch (_error) {
      const responseText = await apiResponse.text();
      console.error('Failed to parse JSON response');
      console.error(`First 200 chars: ${responseText.substring(0, 200)}`);
      
      return Response.json(
        { 
          error: 'Failed to parse JSON response',
          responsePreview: responseText.substring(0, 500)
        },
        { status: 502 }
      );
    }

    // Check if the API request was successful
    if (result.status === 'success' && result.stream) {
      console.log('Successfully generated audio');
      return Response.json({ audioData: result.stream });
    } else {
      console.error('API returned error response:', result);
      return Response.json(
        { error: 'Failed to generate speech', apiResponse: result },
        { status: 502 }
      );
    }
  } catch (_error: unknown) {
    console.error('Unexpected error:', _error);
    return Response.json(
      { error: _error instanceof Error ? _error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 