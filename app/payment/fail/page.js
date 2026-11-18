'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FailContent() {
  const params = useSearchParams();
  const message = params.get('message') || '결제가 취소되었거나 실패했습니다.';
  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>결제 실패</h1>
      <p style={{ color: '#888', marginTop: 8 }}>{message}</p>
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
