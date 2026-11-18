import Link from 'next/link';

export default function Home() {
  const cardStyle = {
    display: 'block', padding: '20px', borderRadius: 16, background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,.06)', textDecoration: 'none', color: '#111',
    marginBottom: 14,
  };
  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f91f15', margin: '0 auto 12px' }} />
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>마감 알리미</h1>
        <p style={{ color: '#888', fontSize: 14 }}>공지·강의계획서 → 일정 추출 → .ics 저장</p>
      </div>

      <Link href="/workspace/offline" style={cardStyle}>
        <b>✨ 일정 뽑기 (오프라인 분석)</b>
        <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>서버 분석 없이 바로 체험</div>
      </Link>
      <Link href="/workspace/gemini" style={cardStyle}>
        <b>✨ 일정 뽑기 (AI 분석)</b>
        <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>더 정교한 추출 (서버 API 경유)</div>
      </Link>
      <Link href="/checkout" style={{ ...cardStyle, background: '#3182f6', color: '#fff' }}>
        <b>💳 프리미엄 결제 (학기 4,900원)</b>
      </Link>
    </main>
  );
}
