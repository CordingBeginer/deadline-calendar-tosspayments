export const metadata = {
  title: '마감 알리미',
  description: '공지·강의계획서에서 과제·시험 마감을 뽑아 캘린더로 저장',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://js.tosspayments.com/v1/payment" async></script>
        <style>{`
          @keyframes modalFadeIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(8px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>
      </head>
      <body style={{ margin: 0, fontFamily: '-apple-system, "Apple SD Gothic Neo", "Pretendard", sans-serif', background: '#f7f7f8' }}>
        {children}
      </body>
    </html>
  );
}
