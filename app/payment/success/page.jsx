'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState('confirming');
  const [payment, setPayment] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const calledRef = useRef(false); // React 18 StrictMode 중복 호출 방지

  useEffect(() => {
    if (calledRef.current) return; // 이미 호출했으면 즉시 중단
    calledRef.current = true;

    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amount = params.get('amount');

    if (!paymentKey || !orderId || !amount) {
      setStatus('failed');
      setErrorMsg('필수 파라미터가 누락되었습니다.');
      return;
    }

    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus('done');
          setPayment(data.payment);
          localStorage.setItem('user_tier', 'PREMIUM');
        } else {
          setStatus('failed');
          setErrorMsg(data.message || '승인 실패');
        }
      })
      .catch((err) => {
        setStatus('failed');
        setErrorMsg(err.message);
      });
  }, [params]);

  const isVA = payment?.method === '가상계좌' || payment?.status === 'WAITING_FOR_DEPOSIT';
  const va = payment?.virtualAccount || {};

  return (
    <main style={{ maxWidth: 440, margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
      {status === 'confirming' && (
        <div style={{ padding: 40 }}>
          <div style={{ fontSize: 40, animation: 'pulse 1s infinite' }}>⏳</div>
          <h2 style={{ fontSize: 18, marginTop: 12 }}>결제 승인 확인 중...</h2>
          <p style={{ color: '#888', fontSize: 13 }}>잠시만 기다려주세요.</p>
        </div>
      )}

      {status === 'done' && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,.06)', border: '1px solid #eee' }}>
          <div style={{ fontSize: 48 }}>{isVA ? '🏦' : '🎉'}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>
            {isVA ? '가상계좌가 발급되었습니다' : '프리미엄 전환 완료!'}
          </h1>
          <p style={{ color: '#888', marginTop: 6, fontSize: 13.5 }}>
            {isVA ? '아래 계좌로 입금하시면 프리미엄이 활성화됩니다.' : '무제한 추출과 마감 임박 알림을 이제 쓸 수 있어요.'}
          </p>

          {isVA && (
            <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: 14, margin: '18px 0', textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 700 }}>입금 전용 계좌 ({va.bank || '가상계좌'})</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a' }}>{va.accountNumber || '계좌번호 생성됨'}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(va.accountNumber || '');
                    alert('계좌번호가 복사되었습니다!');
                  }}
                  style={{ background: '#0064ff', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  복사
                </button>
              </div>
            </div>
          )}

          <div style={{ background: '#f9fafb', borderRadius: 12, padding: 14, margin: '20px 0', textAlign: 'left', fontSize: 13, border: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#888' }}>주문번호</span>
              <span style={{ fontWeight: 700 }}>{payment?.orderId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#888' }}>결제금액</span>
              <span style={{ fontWeight: 700, color: '#0064ff' }}>{Number(payment?.totalAmount || 4900).toLocaleString()}원</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#888' }}>결제수단</span>
              <span style={{ fontWeight: 700 }}>{payment?.method}</span>
            </div>
          </div>

          <Link
            href="/"
            style={{ display: 'block', width: '100%', padding: '14px 0', background: '#3182f6', color: '#fff', textDecoration: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15 }}
          >
            홈으로 돌아가기
          </Link>
        </div>
      )}

      {status === 'failed' && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,.06)', border: '1px solid #eee' }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginTop: 8, color: '#ef4444' }}>결제 승인에 실패했습니다</h1>
          <p style={{ color: '#888', marginTop: 8, fontSize: 13.5 }}>{errorMsg || '승인 처리 중 오류가 발생했습니다.'}</p>
          <Link
            href="/checkout"
            style={{ display: 'inline-block', marginTop: 20, padding: '12px 24px', background: '#18181b', color: '#fff', textDecoration: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14 }}
          >
            다시 시도하기
          </Link>
        </div>
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
