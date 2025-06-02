import { NextRequest, NextResponse } from "next/server";

// Server-side function to generate speech
async function generateSpeech(text: string, locale: string = "ja-JP", voice: string = "ja-JP-NanamiNeural", style: string = "default") {
  try {
    // Create a fresh session for each request
    // First step: Visit the main page to get necessary cookies
    const mainPageResponse = await fetch("https://speechactors.com/", {
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
    
    if (!mainPageResponse.ok) {
      throw new Error(`Failed to access main page: ${mainPageResponse.status}`);
    }
    
    // Get cookies from response
    const setCookieHeader = mainPageResponse.headers.get('set-cookie');
    if (!setCookieHeader) {
      throw new Error("No cookies received from main page");
    }
    
    // Extract CSRF token from cookies
    const cookies = setCookieHeader.split(', ');
    const csrfCookie = cookies.find(cookie => cookie.includes('csrf_cookie_name='));
    let csrfToken = '';
    
    if (csrfCookie) {
      const match = csrfCookie.match(/csrf_cookie_name=([^;]+)/);
      if (match && match[1]) {
        csrfToken = match[1];
      }
    }
    
    if (!csrfToken) {
      console.warn("No CSRF token found in cookies");
    }
    
    // Create a new URLSearchParams object to simulate form data
    const formData = new URLSearchParams();
    formData.append('locale', locale);
    formData.append('text', text);
    formData.append('voice', voice);
    formData.append('style', style);
    
    if (csrfToken) {
      formData.append('csrf_token', csrfToken);
    }
    
    // Make API request with all cookies from the main page
    const apiResponse = await fetch("https://speechactors.com/open-tool/generate", {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded',
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
        'Cookie': setCookieHeader,
        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {})
      },
      body: formData.toString()
    });
    
    if (!apiResponse.ok) {
      throw new Error(`API request failed: ${apiResponse.status}`);
    }
    
    // Process response based on content type
    const contentType = apiResponse.headers.get('content-type');
    
    if (contentType && contentType.includes('json')) {
      const result = await apiResponse.json();
      
      if (result.status === "success") {
        const audioBase64 = result.stream;
        if (audioBase64) {
          return audioBase64;
        } else {
          throw new Error("No audio data in response");
        }
      } else {
        throw new Error(`API error: ${JSON.stringify(result)}`);
      }
    } else {
      // For direct audio response
      const audioData = await apiResponse.arrayBuffer();
      if (audioData.byteLength > 1000) {
        // Convert ArrayBuffer to base64 without using Buffer
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