import requests
import base64
import json

def generate_speech_incognito(text, locale="ja-JP", voice="ja-JP-NanamiNeural", style="default"):
    """
    模拟Chrome无痕模式的请求
    """
    # 为每次请求创建新的session（模拟无痕模式不保存状态）
    session = requests.Session()
    
    # Chrome无痕模式的特征请求头
    incognito_headers = {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'DNT': '1',  # Do Not Track - 无痕模式通常启用
        'Origin': 'https://speechactors.com',
        'Pragma': 'no-cache',  # 无痕模式不使用缓存
        'Referer': 'https://speechactors.com/',
        'Sec-CH-UA': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
    }
    
    # 设置session请求头
    session.headers.update(incognito_headers)
    
    # 第一步：访问主页面获取必要的cookies（即使是无痕模式也需要会话cookies）
    try:
        print("🕵️ 无痕模式：访问主页面...")
        
        # 无痕模式访问主页的特殊头部
        main_page_headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
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
        
        response = session.get("https://speechactors.com/", headers=main_page_headers)
        print(f"✅ 主页访问状态: {response.status_code}")
        
        # 获取cookies信息
        cookies_info = {}
        for cookie in session.cookies:
            cookies_info[cookie.name] = cookie.value
        print(f"🍪 获取的会话cookies: {list(cookies_info.keys())}")
        
    except Exception as e:
        print(f"❌ 访问主页失败: {e}")
        return None
    
    # 第二步：发送API请求
    try:
        print("🚀 无痕模式：发送API请求...")
        
        # 准备表单数据
        files = {
            'locale': (None, locale),
            'text': (None, text),
            'voice': (None, voice),
            'style': (None, style)
        }
        
        # 获取CSRF token
        csrf_token = cookies_info.get('csrf_cookie_name')
        if csrf_token:
            files['csrf_token'] = (None, csrf_token)
            # 无痕模式也会发送CSRF token
            session.headers['X-CSRF-TOKEN'] = csrf_token
            print(f"🔐 使用CSRF token: {csrf_token[:20]}...")
        
        # 发送请求
        response = session.post(
            "https://speechactors.com/open-tool/generate",
            files=files
        )
        
        print(f"📡 API响应状态: {response.status_code}")
        print(f"📄 响应Content-Type: {response.headers.get('content-type')}")
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            
            if 'json' in content_type:
                try:
                    result = response.json()
                    print(f"📋 JSON响应状态: {result.get('status')}")
                    
                    if result.get("status") == "success":
                        audio_base64 = result.get("stream", "")
                        if audio_base64:
                            audio_data = base64.b64decode(audio_base64)
                            print(f"🎵 成功获取音频数据: {len(audio_data)} bytes")
                            return audio_data
                    else:
                        print(f"❌ API错误: {result}")
                except json.JSONDecodeError:
                    print("❌ JSON解析失败")
            else:
                # 检查是否直接返回音频数据
                if len(response.content) > 1000:  # 音频文件通常比较大
                    print(f"🎵 可能收到直接音频数据: {len(response.content)} bytes")
                    return response.content
                else:
                    print(f"❌ 收到意外响应: {response.text[:200]}")
        
        return None
        
    except Exception as e:
        print(f"❌ API请求失败: {e}")
        return None
    
    finally:
        # 无痕模式：清理session（模拟关闭无痕窗口）
        session.close()
        print("🧹 无痕模式：已清理会话数据")

class IncognitoSpeechClient:
    """
    无痕模式语音生成客户端
    每次请求都创建全新的会话，不保存任何状态
    """
    
    @staticmethod
    def generate_speech(text, locale="ja-JP", voice="ja-JP-NanamiNeural", style="default"):
        """生成语音 - 无痕模式"""
        return generate_speech_incognito(text, locale, voice, style)
    
    @staticmethod
    def batch_generate_incognito(texts, output_dir="incognito_audio"):
        """批量生成 - 每个请求都是独立的无痕会话"""
        import os
        from pathlib import Path
        
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        results = []
        total = len(texts)
        
        for i, text in enumerate(texts, 1):
            print(f"\n🔄 处理第 {i}/{total} 个文本（无痕模式）...")
            print(f"📝 文本预览: {text[:50]}{'...' if len(text) > 50 else ''}")
            
            # 每次都创建全新的无痕会话
            audio_data = IncognitoSpeechClient.generate_speech(text)
            
            if audio_data:
                filename = output_path / f"incognito_audio_{i:03d}.wav"
                with open(filename, 'wb') as f:
                    f.write(audio_data)
                results.append(str(filename))
                print(f"✅ 保存成功: {filename}")
            else:
                results.append(None)
                print(f"❌ 第 {i} 个文本处理失败")
            
            # 无痕模式：每次请求间添加小延迟（模拟人工操作）
            import time
            time.sleep(1)
        
        success_count = len([r for r in results if r is not None])
        print(f"\n📊 批量处理完成: {success_count}/{total} 成功")
        return results

# 使用示例
def main():
    print("🎭 Chrome无痕模式语音生成器")
    print("=" * 50)
    
    text = "一方で、医師の働き方改革はまったなし、患者数の減少などで経営難に陥る病院もあとを絶たないといった葛藤も。"
    
    # 单个文本测试
    print("🔹 单个文本测试:")
    audio_data = IncognitoSpeechClient.generate_speech(text)
    
    if audio_data:
        with open("incognito_output.wav", "wb") as f:
            f.write(audio_data)
        print("🎉 无痕模式语音生成成功！文件已保存为 incognito_output.wav")
    else:
        print("💥 无痕模式语音生成失败")
    
    # 批量测试（可选）
    print("\n🔹 批量测试示例:")
    test_texts = [
        "こんにちは、世界！",
        "今日は良い天気ですね。",
        "ありがとうございました。"
    ]
    
    # 取消注释以进行批量测试
    # results = IncognitoSpeechClient.batch_generate_incognito(test_texts)
    # print(f"批量结果: {results}")

if __name__ == "__main__":
    main()