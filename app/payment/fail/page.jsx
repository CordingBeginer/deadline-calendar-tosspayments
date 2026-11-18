'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function FailContent() {
  const params = useSearchParams();
  const message = params.get('message') || '결제가 취소되었거나 실패했습니다.';
  const code = params.get('code') || '';

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,.06)', border: '1px solid #eee' }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginTop: 8, color: '#f59e0b' }}>결제 취소 / 실패</h1>
        <p style={{ color: '#666', marginTop: 8, fontSize: 13.5, lineHeight: 1.5 }}>
          {message} {code && <span style={{ color: '#999', fontSize: 12 }}>({code})</span>}
        </p>

        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <Link
            href="/checkout"
            style={{ flex: 1, padding: '12px 0', background: '#3182f6', color: '#fff', textDecoration: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14 }}
          >
            다시 결제하기
          </Link>
          <Link
            href="/"
            style={{ flex: 1, padding: '12px 0', background: '#f4f4f5', color: '#333', textDecoration: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14 }}
          >
            홈으로 가기
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function FailPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 60 }}>로딩 중...</div>}>
      <FailContent />
    </Suspense>
  );
}
