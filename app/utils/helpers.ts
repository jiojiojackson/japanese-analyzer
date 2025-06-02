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
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '朗读请求失败');
    }
    
    const { audioData } = await response.json();
    
    if (audioData) {
      // 创建Audio元素并播放
      const audio = new Audio(`data:audio/wav;base64,${audioData}`);
      await audio.play();
    } else {
      throw new Error('未获取到音频数据');
    }
  } catch (error) {
    console.error('TTS播放错误:', error);
    // 如果TTS API失败，回退到浏览器内置TTS（仅作为后备）
    speakJapanese(text);
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