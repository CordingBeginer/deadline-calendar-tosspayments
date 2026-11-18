import Script from 'next/script';

export const metadata = {
  title: '마감 알리미',
  description: '공지·강의계획서에서 과제·시험 마감을 뽑아 캘린더로 저장',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              * {
                box-sizing: border-box;
              }
              body, button, input, textarea, select {
                font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
                letter-spacing: -0.3px;
              }
              body {
                margin: 0;
                background: #f7f7f8;
                color: #18181b;
                -webkit-font-smoothing: antialiased;
              }
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Script
          src="https://js.tosspayments.com/v1/payment"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}