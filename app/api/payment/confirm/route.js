// app/api/payment/confirm/route.js
// 토스 결제창에서 돌아온 뒤, 서버가 최종 승인(confirm)하는 라우트.
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
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const data = await res.json();

    if (!res.ok) {
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

    // 이 주문이 어느 유저 것인지 기록해둔다. (나중에 취소 웹훅이 올 때 이 매핑으로 유저를 찾음)
    linkOrder(data.orderId, DEMO_USER_ID);
    setPremium(DEMO_USER_ID, true);

    await notifyDiscord({
      title: '✅ 결제 승인 완료',
      description: `${data.orderName} 결제가 완료되었습니다.`,
      color: 0x57f287,
      fields: [
        { name: '주문번호', value: data.orderId, inline: true },
        { name: '금액', value: `${data.totalAmount.toLocaleString()}원`, inline: true },
        { name: '결제수단', value: data.method, inline: true },
      ],
    });

    return NextResponse.json({ success: true, payment: data });
  } catch (err) {
    console.error('[결제 승인 중 오류]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
