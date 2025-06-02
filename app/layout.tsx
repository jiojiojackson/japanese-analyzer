import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Script from "next/script";

// 使用Inter字体
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// 使用Noto Sans JP字体
const notoSansJP = Noto_Sans_JP({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
});

export const metadata: Metadata = {
  title: "日语文本分析工具 - Japanese Text Analyzer",
  description: "分析日语文本语法、词性和发音，帮助日语学习",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <head>
        {/* 预连接谷歌字体CDN以提高加载速度 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Safari输入修复脚本 */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if (isSafari) {
              document.documentElement.classList.add('safari');
              // 修复Safari中的输入问题
              document.addEventListener('DOMContentLoaded', function() {
                var inputs = document.querySelectorAll('input, textarea');
                inputs.forEach(function(input) {
                  input.style.webkitTextFillColor = 'black';
                  input.style.opacity = '1';
                });
              });
            }
          })();
        `}} />
        {/* 添加Font Awesome图标 */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={`${inter.className} ${notoSansJP.className} antialiased`}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/js/all.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
