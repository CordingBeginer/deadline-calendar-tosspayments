'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CheckoutPage() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('카드');

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

    const clientKey =
      process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ||
      'test_ck_c19xVe5yjC0Fj7PkiRuh3WypIGOJgNYQUC';

    try {
      // 결제 직전 DOM에 script 태그 존재 보장 (토스 SDK 내부 검증)
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
    <main style={{ maxWidth: 440, margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
      <div style={{ marginBottom: 20, textAlign: 'left' }}>
        <Link
          href="/"
          style={{
            color: '#71717a',
            fontSize: 13,
            textDecoration: 'none',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← 홈으로 돌아가기
        </Link>
      </div>

      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '28px 24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #ececee',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            background: '#eff6ff',
            color: '#2563eb',
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 6,
            marginBottom: 10,
          }}
        >
          1학기 올패스 특별 혜택
        </span>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: '#18181b' }}>
          프리미엄 플랜
        </h1>
        <p style={{ color: '#71717a', margin: '0 0 20px', fontSize: 14 }}>
          개강부터 종강까지 4개월 무제한 일정 관리
        </p>

        <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', marginBottom: 20 }}>
          4,900 <span style={{ fontSize: 15, fontWeight: 500, color: '#71717a' }}>원 / 학기</span>
        </div>

        <div style={{ fontSize: 13, color: '#71717a', marginBottom: 10, fontWeight: 700 }}>
          결제 수단 선택
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
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
                padding: '12px 0',
                borderRadius: 10,
                border: '1.5px solid ' + (method === opt.id ? '#2563eb' : '#e4e4e7'),
                background: method === opt.id ? '#eff6ff' : '#ffffff',
                color: method === opt.id ? '#2563eb' : '#52525b',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {method === '가상계좌' && (
          <div
            style={{
              marginBottom: 16,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 12,
              color: '#475569',
              lineHeight: 1.45,
            }}
          >
            💡 <strong>가상계좌:</strong> 결제 요청 시 입금 전용 가상계좌 번호가 즉시 발급됩니다.
          </div>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={!ready || loading}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 14,
            border: 'none',
            background: '#2563eb',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 16,
            cursor: ready && !loading ? 'pointer' : 'not-allowed',
            opacity: ready && !loading ? 1 : 0.6,
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
            transition: 'background 0.15s ease',
          }}
        >
          {loading ? '결제창 여는 중...' : '4,900원 결제하기'}
        </button>

        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 14, marginBottom: 0, lineHeight: 1.5 }}>
          토스페이먼츠 보안 결제창이 열립니다.<br />
          테스트 결제 모드로 실제 금액은 청구되지 않습니다.
        </p>
      </div>
    </main>
  );
}
