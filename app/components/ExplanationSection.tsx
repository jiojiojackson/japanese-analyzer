'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamExplanation } from '../services/api';

interface ExplanationSectionProps {
  japaneseText: string;
  userApiKey?: string;
  userApiUrl?: string;
  useStream?: boolean;
  trigger?: number;
}

export default function ExplanationSection({
  japaneseText,
  userApiKey,
  userApiUrl,
  useStream = true,
  trigger
}: ExplanationSectionProps) {
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleExplain = async () => {
    if (!japaneseText) {
      alert('请先输入或分析日语句子！');
      return;
    }

    setIsLoading(true);
    setIsVisible(true);
    setExplanation('');

    try {
      if (useStream) {
        streamExplanation(
          japaneseText,
          (chunk, isDone) => {
            setExplanation(chunk);
            if (isDone) {
              setIsLoading(false);
            }
          },
          (error) => {
            console.error('Error during streaming explanation:', error);
            setExplanation(`解释时发生错误: ${error.message || '未知错误'}。`);
            setIsLoading(false);
          },
          userApiKey,
          userApiUrl
        );
      } else {
        // For now, we only support streaming for explanations.
        // You could implement a non-streaming version if needed.
        setExplanation('目前仅支持流式解释。');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error during explanation:', error);
      setExplanation(`解释时发生错误: ${error instanceof Error ? error.message : '未知错误'}。`);
      setIsLoading(false);
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  useEffect(() => {
    if (trigger && japaneseText) {
      handleExplain();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <>
      <div className="mt-6 flex flex-col sm:flex-row sm:justify-center space-y-3 sm:space-y-0 sm:space-x-4">
        <button 
          id="explainSentenceButton"
          className="premium-button premium-button-primary w-full sm:w-auto"
          onClick={handleExplain}
          disabled={isLoading}
        >
          {!isLoading && <span className="button-text">单词和语法</span>}
          <div className="loading-spinner" style={{ display: isLoading ? 'inline-block' : 'none' }}></div>
          {isLoading && <span className="button-text">解释中...</span>}
        </button>
      </div>

      {(isLoading || explanation) && (
        <div id="explanationCard" className="premium-card mt-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-semibold text-gray-700" style={{ marginBottom: isVisible ? '0.75rem' : '0' }}>单词和语法</h2>
            <button 
              id="toggleExplanationButton"
              className="premium-button premium-button-outlined text-sm px-3 py-1"
              onClick={toggleVisibility}
            >
              {isVisible ? '隐藏' : '显示'}
            </button>
          </div>
          
          {isVisible && (
            <div id="explanationOutput" className="prose dark:prose-invert max-w-none text-gray-800 p-3 bg-gray-50 rounded-lg min-h-[50px]">
              {isLoading && !explanation ? (
                <div className="flex items-center justify-center py-4">
                  <div className="loading-spinner"></div>
                  <span className="ml-2 text-gray-500">正在解释，请稍候...</span>
                </div>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {explanation}
                </ReactMarkdown>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}