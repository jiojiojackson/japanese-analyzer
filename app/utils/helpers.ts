// 工具函数

// 检查字符串是否包含汉字
export function containsKanji(text: string): boolean {
  const kanjiRegex = /[\u4E00-\u9FAF\u3400-\u4DBF]/;
  return kanjiRegex.test(text);
}

// 获取词性对应的CSS类名
export function getPosClass(pos: string): string {
  const basePos = pos.split('-')[0];
  const knownPos = ["名詞", "動詞", "形容詞", "副詞", "助詞", "助動詞", "接続詞", "感動詞", "連体詞", "代名詞", "形状詞", "記号", "接頭辞", "接尾辞", "フィラー", "その他"];
  if (knownPos.includes(basePos)) {
    return `pos-${basePos}`;
  }
  return 'pos-default';
}

// 词性中日对照表
export const posChineseMap: Record<string, string> = {
  "名詞": "名词", "動詞": "动词", "形容詞": "形容词", "副詞": "副词",
  "助詞": "助词", "助動詞": "助动词", "接続詞": "接续词", "感動詞": "感动词",
  "連体詞": "连体词", "代名詞": "代名词", "形状詞": "形容动词", "記号": "符号",
  "接頭辞": "接头辞", "接尾辞": "接尾辞", "フィラー": "填充词", "その他": "其他",
  "default": "未知词性"
};

// 朗读日语文本
export function speakJapanese(text: string): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn('浏览器不支持语音朗读功能');
  }
}

// 使用自定义TTS API朗读日语文本
export async function playJapaneseTTS(text: string): Promise<void> {
  try {
    console.log("正在生成语音...");
    
    // 客户端直接调用语音API（避免服务端代理问题）
    const audioData = await generateSpeechIncognito(text);
    
    if (audioData) {
      // 创建Audio元素并播放
      const audio = new Audio(`data:audio/wav;base64,${audioData}`);
      await audio.play();
      console.log("语音播放成功");
    } else {
      throw new Error('未获取到音频数据');
    }
  } catch (error) {
    console.error('TTS播放错误:', error);
    // 如果TTS API失败，回退到浏览器内置TTS（仅作为后备）
    console.log("使用浏览器内置TTS作为后备...");
    speakJapanese(text);
  }
}

/**
 * 模拟Chrome无痕模式，直接调用语音生成API
 * 基于Python实现但优化为浏览器环境
 */
async function generateSpeechIncognito(
  text: string, 
  locale: string = "ja-JP", 
  voice: string = "ja-JP-NanamiNeural", 
  style: string = "default"
): Promise<string | null> {
  // 定义无痕模式请求头
  const incognitoHeaders = {
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'DNT': '1',
    'Origin': 'https://speechactors.com',
    'Pragma': 'no-cache',
    'Referer': 'https://speechactors.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'X-Requested-With': 'XMLHttpRequest'
  };

  // 第一步：访问主页获取必要的cookies
  console.log("访问主页获取cookies...");
  
  // 定义访问主页的请求头
  const mainPageHeaders = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'DNT': '1',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  };

  try {
    // 使用fetch API访问主页
    const mainPageResponse = await fetch('https://speechactors.com/', {
      method: 'GET',
      headers: mainPageHeaders,
      credentials: 'include' // 重要：保存cookies
    });

    if (!mainPageResponse.ok) {
      console.error(`访问主页失败: ${mainPageResponse.status}`);
      return null;
    }

    console.log("成功访问主页");

    // 获取CSRF token（通过document cookie或页面内容）
    let csrfToken = '';
    
    // 通过document.cookie获取CSRF token
    const cookies = document.cookie;
    const csrfMatch = cookies.match(/csrf_cookie_name=([^;]+)/);
    if (csrfMatch && csrfMatch[1]) {
      csrfToken = csrfMatch[1];
      console.log("从cookies中获取CSRF token成功");
    } else {
      // 如果cookie中没有，尝试从页面内容提取
      const pageContent = await mainPageResponse.text();
      const metaMatch = pageContent.match(/<meta name="csrf-token" content="([^"]+)"/);
      if (metaMatch && metaMatch[1]) {
        csrfToken = metaMatch[1];
        console.log("从页面内容获取CSRF token成功");
      }
    }

    if (!csrfToken) {
      console.error("未能获取CSRF token");
      return null;
    }

    // 第二步：准备FormData（模拟Python requests的files参数）
    const formData = new FormData();
    formData.append('locale', locale);
    formData.append('text', text);
    formData.append('voice', voice);
    formData.append('style', style);
    if (csrfToken) {
      formData.append('csrf_token', csrfToken);
    }

    // 发起API请求
    console.log("发送TTS API请求...");
    const apiResponse = await fetch('https://speechactors.com/open-tool/generate', {
      method: 'POST',
      headers: {
        ...incognitoHeaders,
        'X-CSRF-TOKEN': csrfToken
      },
      credentials: 'include', // 重要：包含cookies
      body: formData
    });

    console.log(`API响应状态: ${apiResponse.status}`);

    if (!apiResponse.ok) {
      console.error(`API请求失败: ${apiResponse.status}`);
      return null;
    }

    // 处理响应
    const contentType = apiResponse.headers.get('content-type') || '';
    
    if (contentType.includes('json')) {
      try {
        const result = await apiResponse.json();
        console.log(`JSON响应状态: ${result.status}`);
        
        if (result.status === 'success') {
          const audioBase64 = result.stream;
          if (audioBase64) {
            console.log(`成功获取音频数据`);
            return audioBase64;
          }
        } else {
          console.error(`API错误: ${JSON.stringify(result)}`);
        }
      } catch (e) {
        console.error('JSON解析失败');
      }
    } else {
      // 检查是否直接返回音频数据
      const responseData = await apiResponse.text();
      if (responseData.length > 1000) { // 音频文件通常比较大
        console.log(`可能收到直接音频数据: ${responseData.length} bytes`);
        return responseData;
      }
      console.error(`收到非预期的响应`);
    }

    return null;
  } catch (error) {
    console.error('语音生成请求失败:', error);
    return null;
  }
}

// 默认API URL
const DEFAULT_API_URL = 
  // Avoid using process.env directly
  (typeof window !== 'undefined' && (window as Window & { env?: { API_URL?: string } }).env?.API_URL) || 
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// 保存API设置到localStorage
export function saveApiSettings(apiKey: string, apiUrl: string): void {
  if (typeof window !== 'undefined') {
    if (apiKey) {
      localStorage.setItem('userGeminiApiKey', apiKey);
    } else {
      localStorage.removeItem('userGeminiApiKey');
    }
    
    if (apiUrl && apiUrl !== DEFAULT_API_URL) {
      localStorage.setItem('userGeminiApiUrl', apiUrl);
    } else {
      localStorage.removeItem('userGeminiApiUrl');
    }
  }
}

// 从localStorage获取API设置
export function getApiSettings(): { apiKey: string, apiUrl: string } {
  if (typeof window !== 'undefined') {
    // 尝试从localStorage读取
    const savedApiKey = localStorage.getItem('userGeminiApiKey') || '';
    const savedApiUrl = localStorage.getItem('userGeminiApiUrl') || DEFAULT_API_URL;
    
    // 使用默认值或本地存储值
    const apiKey = savedApiKey || '';
    const apiUrl = savedApiUrl;
    
    return { apiKey, apiUrl };
  }
  return { 
    apiKey: '', 
    apiUrl: DEFAULT_API_URL 
  };
} 