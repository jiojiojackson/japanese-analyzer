'use client';

import { useState } from 'react';
import { playJapaneseTTS } from '../utils/helpers';

export default function TTSTestPage() {
  const [text, setText] = useState('こんにちは、世界！');
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState('准备就绪');

  const handlePlay = async () => {
    if (!text.trim()) return;
    
    setIsPlaying(true);
    setStatus('生成语音中...');
    
    try {
      await playJapaneseTTS(text);
      setStatus('播放成功');
    } catch (error) {
      console.error('TTS错误:', error);
      setStatus(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">TTS 测试页面</h1>
      
      <div className="p-4 bg-white rounded-md shadow-sm">
        <div className="mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            rows={4}
            placeholder="输入日语文本..."
          />
        </div>
        <div className="flex items-center">
          <button
            onClick={handlePlay}
            disabled={isPlaying || !text.trim()}
            className={`px-4 py-2 rounded ${
              isPlaying ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isPlaying ? '生成中...' : '朗读'}
          </button>
          <div className="ml-3 text-sm text-gray-600">
            {status}
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-medium mb-2">测试说明</h3>
        <p className="text-sm">
          此页面使用客户端直接调用TTS API，避免服务端403错误问题。
          通过模拟Chrome无痕模式的浏览器行为，直接从客户端发送请求到语音服务。
        </p>
      </div>
      
      <div className="mt-4">
        <a href="/" className="text-blue-600 hover:underline">
          返回主页
        </a>
      </div>
    </main>
  );
} 