export const metadata = {
  title: '마감 알리미',
  description: '공지·강의계획서에서 과제·시험 마감을 뽑아 캘린더로 저장',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <script src="https://js.tosspayments.com/v1/payment" async></script>
      </head>
      <body style={{ margin: 0, fontFamily: '-apple-system, "Apple SD Gothic Neo", sans-serif', background: '#f7f7f8' }}>
        {children}
      </body>
    </html>
  );
}
