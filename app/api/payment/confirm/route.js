import { NextResponse } from 'next/server';
import { notifyDiscord } from '../../../../lib/notify';
import { setPremium, linkOrder } from '../../../../lib/store';

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';
const DEMO_USER_ID = 'demo-user';

export async function POST(req) {
  const { paymentKey, orderId, amount } = await req.json();
  console.log('[결제 승인 요청]', { paymentKey, orderId, amount });

  try {
    const basicAuth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');
    const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    });
    const data = await res.json();

    if (!res.ok) {
      // 이미 승인된 결제건(새로고침 / 재호출)인 경우 정상 처리 간주
      if (data.code === 'ALREADY_PROCESSED_PAYMENT') {
        console.log('[결제 재확인: 이미 승인 완료된 주문]', orderId);
        linkOrder(orderId, DEMO_USER_ID);
        setPremium(DEMO_USER_ID, true);
        return NextResponse.json({
          success: true,
          payment: { orderId, totalAmount: Number(amount), method: '카드', status: 'DONE' },
          alreadyProcessed: true,
        });
      }

      console.error('[결제 승인 실패]', data);
      await notifyDiscord({
        title: '❌ 결제 승인 실패',
        description: data.message || '알 수 없는 오류',
        color: 0xed4245,
        fields: [{ name: '주문번호', value: orderId }],
      });
      return NextResponse.json({ success: false, message: data.message }, { status: 400 });
    }

    console.log('[결제 승인 완료]', data.status, data.orderId, data.totalAmount);
    linkOrder(data.orderId, DEMO_USER_ID); // 이 주문이 누구 것인지 기록 (취소/입금 시 역추적용)

    const isVA = data.method === '가상계좌' || data.status === 'WAITING_FOR_DEPOSIT';
    if (!isVA) {
      setPremium(DEMO_USER_ID, true);
    }

    await notifyDiscord({
      title: isVA ? '🏦 가상계좌 발급 완료' : '✅ 결제 승인 완료',
      description: `${data.orderName || orderId} 결제가 ${isVA ? '가상계좌 발급(입금 대기)' : '완료'}되었습니다.`,
      color: isVA ? 0x3182f6 : 0x57f287,
      fields: [
        { name: '주문번호', value: data.orderId, inline: true },
        { name: '금액', value: `${Number(data.totalAmount || amount).toLocaleString()}원`, inline: true },
        { name: '결제수단', value: data.method, inline: true },
      ],
    });

    return NextResponse.json({ success: true, payment: data });
  } catch (err) {
    console.error('[결제 승인 중 오류]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
