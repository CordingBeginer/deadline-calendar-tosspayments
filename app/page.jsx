import Link from 'next/link';

export default function Home() {
  const cardStyle = {
    display: 'block',
    padding: '20px 24px',
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 2px 10px rgba(0,0,0,.04)',
    textDecoration: 'none',
    color: '#111',
    marginBottom: 14,
    border: '1px solid #eee',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '48px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f91f15', margin: '0 auto 14px' }} />
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.3px' }}>마감 알리미</h1>
        <p style={{ color: '#888', fontSize: 14, margin: 0 }}>공지·강의계획서 → 일정 추출 → .ics 저장</p>
      </div>

      <Link href="/workspace/offline" style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>✨ 일정 뽑기 (오프라인 분석)</div>
        <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>서버/API 없이 정규식으로 바로 분석</div>
      </Link>

      <Link href="/workspace/gemini" style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>✨ 일정 뽑기 (AI 분석)</div>
        <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Gemini 1.5 Flash로 더 정교한 일정 추출</div>
      </Link>

      <Link href="/checkout" style={{ ...cardStyle, background: '#3182f6', color: '#fff', borderColor: '#3182f6', marginTop: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>💳 프리미엄 결제 (학기 4,900원)</div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 }}>무제한 추출 + D-day 마감 임박 알림</div>
      </Link>
    </main>
  );
}
