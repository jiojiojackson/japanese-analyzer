import { NextRequest, NextResponse } from "next/server";

async function generateSpeech(text: string, locale: string = "ja-JP", voice: string = "ja-JP-NanamiNeural", style: string = "default") {
  // Create a fresh session for each request
  try {
    // First step: Visit the main page to get necessary cookies
    const session = await fetch("https://speechactors.com/", {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
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
      }
    });
    
    if (!session.ok) {
      throw new Error(`Failed to access main page: ${session.status}`);
    }
    
    // Extract cookies from the session
    const cookies = session.headers.getSetCookie();
    const csrfCookie = cookies.find(cookie => cookie.includes('csrf_cookie_name='));
    let csrfToken = '';
    
    if (csrfCookie) {
      const match = csrfCookie.match(/csrf_cookie_name=([^;]+)/);
      if (match && match[1]) {
        csrfToken = match[1];
      }
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append('locale', locale);
    formData.append('text', text);
    formData.append('voice', voice);
    formData.append('style', style);
    
    if (csrfToken) {
      formData.append('csrf_token', csrfToken);
    }
    
    // Make the API request to generate speech
    const response = await fetch("https://speechactors.com/open-tool/generate", {
      method: 'POST',
      headers: {
        'Accept': '*/*',
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
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {})
      },
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('json')) {
      const result = await response.json();
      
      if (result.status === "success") {
        const audioBase64 = result.stream;
        if (audioBase64) {
          // Return the base64 audio data
          return audioBase64;
        } else {
          throw new Error("No audio data in response");
        }
      } else {
        throw new Error(`API error: ${JSON.stringify(result)}`);
      }
    } else {
      // Handle direct audio response
      const audioData = await response.arrayBuffer();
      if (audioData.byteLength > 1000) {
        // Use ArrayBuffer to base64 conversion without Buffer
        const uint8Array = new Uint8Array(audioData);
        let binary = '';
        for (let i = 0; i < uint8Array.byteLength; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        return btoa(binary);
      } else {
        throw new Error("Unexpected response format");
      }
    }
  } catch (error) {
    console.error("TTS API error:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, locale, voice, style } = body;
    
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    
    const audioBase64 = await generateSpeech(
      text,
      locale || "ja-JP", 
      voice || "ja-JP-NanamiNeural", 
      style || "default"
    );
    
    return NextResponse.json({ audioData: audioBase64 });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 