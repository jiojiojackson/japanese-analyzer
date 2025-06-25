import { NextRequest, NextResponse } from 'next/server';

// API密钥从环境变量获取，不暴露给前端
const API_KEY = process.env.API_KEY || '';
const API_URL = process.env.API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const MODEL_NAME = "gemini-2.5-flash-preview-05-20";

export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const { text, model = MODEL_NAME, apiUrl, stream = false } = await req.json();
    
    // 从请求头中获取用户提供的API密钥（如果有）
    const authHeader = req.headers.get('Authorization');
    const userApiKey = authHeader ? authHeader.replace('Bearer ', '') : '';
    
    // 优先使用用户API密钥，如果没有则使用环境变量中的密钥
    const effectiveApiKey = userApiKey || API_KEY;
    
    // 优先使用用户提供的API URL，否则使用环境变量中的URL
    const effectiveApiUrl = apiUrl || API_URL;
    
    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: { message: '未提供API密钥，请在设置中配置API密钥或联系管理员配置服务器密钥' } },
        { status: 500 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: { message: '缺少必要的文本内容' } },
        { status: 400 }
      );
    }

    // 构建翻译请求
    const translationPrompt = `请将以下日语句子翻译成简体中文，并对其中涉及的主要语法点和关键词汇进行详细解释。\n\n"${text}"\n\n输出要求：\n1. 使用 Markdown 格式。\n2. 先给出翻译内容，放在一个段落中。\n3. 然后使用二级标题 “## 语法解析” 罗列本句中出现的重要语法点，每一点使用无序列表说明。\n4. 再使用二级标题 “## 词汇表” 以 Markdown 表格形式列出需要说明的词汇，表头包含“单词 | 词性/角色 | 释义”。\n5. 仅返回 Markdown 内容，不要包含多余说明。`
    const payload = {
      model: model,
      reasoning_effort: "none",
      messages: [{ role: "user", content: translationPrompt }],
      stream: stream
    };

    // 发送到实际的AI API
    const response = await fetch(effectiveApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveApiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('AI API error (Translation):', data);
      return NextResponse.json(
        { error: data.error || { message: '翻译请求时出错' } },
        { status: response.status }
      );
    }

    // 如果是流式输出
    if (stream) {
      // 将流式响应传回客户端
      const readableStream = response.body;
      if (!readableStream) {
        return NextResponse.json(
          { error: { message: '流式响应创建失败' } },
          { status: 500 }
        );
      }

      // 创建一个新的流式响应
      return new NextResponse(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } else {
      // 非流式输出，按原来方式处理
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Server error (Translation):', error);
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : '服务器错误' } },
      { status: 500 }
    );
  }
} 