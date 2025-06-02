// Server-side proxy for TTS API
// This approach avoids CORS issues since server-to-server requests don't have CORS restrictions

export async function POST(request: Request) {
  try {
    // Get text from request
    const { text } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log("TTS API: Received request for", text.substring(0, 30) + (text.length > 30 ? "..." : ""));

    // Step 1: Get cookies from the main site
    console.log("TTS API: Fetching main page...");
    const mainResponse = await fetch("https://speechactors.com/", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      }
    });

    if (!mainResponse.ok) {
      console.log(`TTS API: Main page fetch failed with status ${mainResponse.status}`);
      return new Response(
        JSON.stringify({ error: `Failed to access main site: ${mainResponse.status}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }

    // Extract cookies
    const cookies = mainResponse.headers.get('set-cookie');
    console.log(`TTS API: Got cookies: ${cookies ? 'yes' : 'no'}`);

    // Step 2: Create a unique boundary for multipart/form-data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);

    // Prepare form data with proper boundary
    const formBody = new FormData();
    formBody.append('locale', 'ja-JP');
    formBody.append('text', text);
    formBody.append('voice', 'ja-JP-NanamiNeural');
    formBody.append('style', 'default');
    
    console.log("TTS API: Sending generate request...");
    const apiResponse = await fetch("https://speechactors.com/open-tool/generate", {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://speechactors.com',
        'Referer': 'https://speechactors.com/',
        // Don't set Content-Type, let the browser set it with the correct boundary
        'Cookie': cookies || '',
      },
      body: formBody
    });

    console.log(`TTS API: Generate response status: ${apiResponse.status}`);
    const contentType = apiResponse.headers.get('content-type');
    console.log(`TTS API: Response content type: ${contentType}`);

    if (!apiResponse.ok) {
      // Try to get response text for debugging
      const responseText = await apiResponse.text();
      console.log(`TTS API: Error response body (first 200 chars): ${responseText.substring(0, 200)}`);
      
      return new Response(
        JSON.stringify({ 
          error: `TTS API request failed: ${apiResponse.status}`,
          details: responseText.substring(0, 500) 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }

    // Check if response is likely HTML instead of JSON
    const responseText = await apiResponse.text();
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.log(`TTS API: Received HTML response instead of JSON`);
      return new Response(
        JSON.stringify({ 
          error: "Received HTML instead of JSON response", 
          details: responseText.substring(0, 500) 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }

    // Try to parse JSON response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.log(`TTS API: JSON parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      console.log(`TTS API: Response text (first 200 chars): ${responseText.substring(0, 200)}`);
      return new Response(
        JSON.stringify({ 
          error: `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          responsePreview: responseText.substring(0, 500) 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }
    
    if (result.status === "success" && result.stream) {
      console.log("TTS API: Successfully generated audio");
      return new Response(
        JSON.stringify({ audioData: result.stream }),
        { status: 200, headers: { 'Content-Type': 'application/json' }}
      );
    } else {
      console.log(`TTS API: API returned error: ${JSON.stringify(result)}`);
      return new Response(
        JSON.stringify({ error: "Failed to generate speech", apiResponse: result }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }
  } catch (error: unknown) {
    console.error("TTS API error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' }}
    );
  }
} 