'use client';
import { useEffect, useState } from 'react';

// 토스페이먼츠 결제창(카드 전용) - 팝업/일반 결제창 방식
export default function CheckoutPage() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.TossPayments) {
      setReady(true);
      return;
    }
    let script = document.querySelector('script[src*="js.tosspayments.com"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://js.tosspayments.com/v1/payment';
      script.async = true;
      document.head.appendChild(script);
    }
    script.onload = () => setReady(true);
  }, []);

  const handlePay = () => {
    if (!ready || loading) return;
    setLoading(true);
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    const tossPayments = window.TossPayments(clientKey);
    const orderId = 'order-' + Date.now();

    tossPayments.requestPayment('카드', {
      amount: 4900,
      orderId,
      orderName: '프리미엄 플랜 (1학기)',
      customerName: '홍길동',
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`,
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  };

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#3182f6' }}>프리미엄 플랜</h1>
      <p style={{ color: '#888', margin: '8px 0 28px' }}>한 학기 4,900원 · 무제한 추출, 마감 임박 알림</p>

      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,.06)', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>결제수단</div>
        <div style={{ fontWeight: 700 }}>신용·체크카드</div>
      </div>

      <button
        onClick={handlePay}
        disabled={!ready || loading}
        style={{
          width: '100%', padding: '16px 0', borderRadius: 12, border: 'none',
          background: '#3182f6', color: '#fff', fontWeight: 700, fontSize: 16,
          cursor: ready ? 'pointer' : 'not-allowed', opacity: ready ? 1 : 0.6,
        }}
      >
        {loading ? '결제창 여는 중...' : '4,900원 결제하기'}
      </button>
    </main>
  );
}
