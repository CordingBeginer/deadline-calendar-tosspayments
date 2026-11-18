'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CheckoutPage() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('카드');

  useEffect(() => {
    // 토스 SDK 로드 확인 (layout.jsx의 script 태그 또는 동적 로드)
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

    const clientKey =
      process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ||
      'test_ck_YOUR_CLIENT_KEY';

    try {
      // 결제 직전 DOM에 script 태그 존재 보장 (토스 SDK 보안 검증)
      if (!document.querySelector('script[src*="js.tosspayments.com"]')) {
        const s = document.createElement('script');
        s.src = 'https://js.tosspayments.com/v1/payment';
        s.async = true;
        document.head.appendChild(s);
      }

      const tossPayments = window.TossPayments(clientKey);
      const orderId =
        'order-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

      const params = {
        amount: 4900,
        orderId,
        orderName: '프리미엄 플랜 (1학기)',
        customerName: '홍길동',
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      };

      if (method === '가상계좌') {
        params.validHours = 72;
      }

      tossPayments.requestPayment(method, params).catch((err) => {
        console.error(err);
        setLoading(false);
        if (err.code !== 'USER_CANCEL') {
          alert('결제 오류: ' + (err.message || err.code));
        }
      });
    } catch (e) {
      console.error(e);
      alert('토스 SDK 초기화 실패: ' + e.message);
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>
          ← 홈으로 돌아가기
        </Link>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#3182f6', margin: '0 0 6px' }}>프리미엄 플랜</h1>
      <p style={{ color: '#888', margin: '0 0 28px', fontSize: 14 }}>한 학기 4,900원 · 무제한 추출, 마감 임박 알림</p>

      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 2px 10px rgba(0,0,0,.06)',
          marginBottom: 20,
          textAlign: 'left',
          border: '1px solid #eee',
        }}
      >
        <div style={{ fontSize: 13, color: '#888', marginBottom: 10, fontWeight: 700 }}>결제수단 선택</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: '카드', label: '신용·체크카드' },
            { id: '가상계좌', label: '가상계좌' },
            { id: '계좌이체', label: '계좌이체' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMethod(opt.id)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 10,
                border: '1.5px solid ' + (method === opt.id ? '#3182f6' : '#e5e7eb'),
                background: method === opt.id ? '#eff6ff' : '#fff',
                color: method === opt.id ? '#3182f6' : '#6b7280',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {method === '가상계좌' && (
          <div
            style={{
              marginTop: 12,
              background: '#f9fafb',
              border: '1px solid #e5e8eb',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 12,
              color: '#6b7280',
              lineHeight: 1.4,
            }}
          >
            💡 가상계좌 발급 후 입금하시면 프리미엄이 활성화됩니다.
          </div>
        )}
      </div>

      <button
        onClick={handlePay}
        disabled={!ready || loading}
        style={{
          width: '100%',
          padding: '16px 0',
          borderRadius: 12,
          border: 'none',
          background: '#3182f6',
          color: '#fff',
          fontWeight: 700,
          fontSize: 16,
          cursor: ready && !loading ? 'pointer' : 'not-allowed',
          opacity: ready && !loading ? 1 : 0.6,
          boxShadow: '0 4px 12px rgba(49, 130, 246, 0.25)',
        }}
      >
        {loading ? '결제창 여는 중...' : '4,900원 결제하기'}
      </button>

      <p style={{ fontSize: 12, color: '#999', marginTop: 14 }}>
        테스트 결제 모드로 실제 금액은 청구되지 않습니다.
      </p>
    </main>
  );
}
