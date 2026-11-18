'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState('confirming'); // confirming | done | failed
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amount = params.get('amount');
    if (!paymentKey) { setStatus('failed'); return; }

    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
      .then((r) => r.json())
      .then((data) => setStatus(data.success ? 'done' : 'failed'))
      .catch(() => setStatus('failed'));
  }, [params]);

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
      {status === 'confirming' && <p>결제 승인 확인 중...</p>}
      {status === 'done' && (
        <>
          <div style={{ fontSize: 48 }}>🎉</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>프리미엄 전환 완료!</h1>
          <p style={{ color: '#888', marginTop: 8 }}>무제한 추출과 마감 알림을 이제 쓸 수 있어요.</p>
        </>
      )}
      {status === 'failed' && (
        <>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>결제 승인에 실패했습니다</h1>
        </>
      )}
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 60 }}>로딩 중...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
