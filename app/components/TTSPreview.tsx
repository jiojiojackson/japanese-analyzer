'use client';

import React, { useState } from 'react';
import { playJapaneseTTS } from '../utils/helpers';

export default function TTSPreview() {
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
    <div className="p-4 bg-white rounded-md shadow-sm">
      <h3 className="text-lg font-medium mb-2">TTS 测试</h3>
      <div className="mb-3">
        <textarea
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          rows={2}
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
  );
} 