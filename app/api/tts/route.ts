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

    // Step 1: Get cookies from the main site
    const mainResponse = await fetch("https://speechactors.com/", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      }
    });

    if (!mainResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to access main site: ${mainResponse.status}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }

    // Extract cookies
    const cookies = mainResponse.headers.get('set-cookie');

    // Step 2: Send request to generate audio
    const formData = new FormData();
    formData.append('locale', 'ja-JP');
    formData.append('text', text);
    formData.append('voice', 'ja-JP-NanamiNeural');
    formData.append('style', 'default');

    // Create URL-encoded body from FormData
    const formBody = new URLSearchParams();
    formBody.append('locale', 'ja-JP');
    formBody.append('text', text);
    formBody.append('voice', 'ja-JP-NanamiNeural');
    formBody.append('style', 'default');

    const apiResponse = await fetch("https://speechactors.com/open-tool/generate", {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://speechactors.com',
        'Referer': 'https://speechactors.com/',
        'Cookie': cookies || '',
      },
      body: formBody.toString()
    });

    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: `TTS API request failed: ${apiResponse.status}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }

    // Process the response
    const result = await apiResponse.json();
    
    if (result.status === "success" && result.stream) {
      return new Response(
        JSON.stringify({ audioData: result.stream }),
        { status: 200, headers: { 'Content-Type': 'application/json' }}
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Failed to generate speech" }),
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