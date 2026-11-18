// app/api/payment/webhook/route.js
// 토스페이먼츠 웹훅 수신 (결제 취소, 가상계좌 입금완료/만료 등 비동기 이벤트)
import { NextResponse } from 'next/server';
import { notifyDiscord } from '../../../../lib/notify';
import { setPremium, getUserIdByOrder } from '../../../../lib/store';

const DEMO_USER_ID = 'demo-user';
const receivedEventIds = new Set(); // 중복 수신 방지 (데모용, 실서비스는 DB로)

export async function POST(req) {
  const body = await req.json();
  const { eventType, data } = body;

  const eventId = req.headers.get('tosspayments-webhook-transmission-id') || `${eventType}-${data?.orderId}-${Date.now()}`;
  if (receivedEventIds.has(eventId)) {
    console.log('[웹훅] 중복 이벤트 무시', eventId);
    return NextResponse.json({ received: true, duplicate: true });
  }
  receivedEventIds.add(eventId);

  // 취소 여부와 상관없이 모든 웹훅 수신은 터미널에 먼저 찍힌다.
  console.log('[웹훅 수신]', eventType, data?.orderId, data?.status);

  switch (eventType) {
    case 'PAYMENT_STATUS_CHANGED':
      if (data.status === 'CANCELED' || data.status === 'PARTIAL_CANCELED') {
        // 결제 취소 전용 로그 (요청하신 "취소 로그")
        console.log('[결제 취소]', '주문번호:', data.orderId, '상태:', data.status);

        const userId = getUserIdByOrder(data.orderId);
        setPremium(userId, false); // 프리미엄 해제
        console.log('[프리미엄 해제]', '유저:', userId, '-> premium:false');

        await notifyDiscord({
          title: '↩️ 결제 취소',
          description: `주문 ${data.orderId} 결제가 취소되어 프리미엄 혜택이 해제되었습니다.`,
          color: 0xed4245,
          fields: [
            { name: '주문번호', value: data.orderId, inline: true },
            { name: '상태', value: data.status, inline: true },
          ],
        });
      }
      break;
    case 'DEPOSIT_CALLBACK':
      if (data.status === 'EXPIRED') {
        await notifyDiscord({
          title: '⏰ 가상계좌 입금 기한 만료',
          description: `주문 ${data.orderId} 입금이 이루어지지 않아 만료되었습니다.`,
          color: 0xfaa61a,
        });
      } else if (data.status === 'DONE') {
        setPremium(DEMO_USER_ID, true);
        await notifyDiscord({
          title: '💰 가상계좌 입금 완료',
          description: `주문 ${data.orderId} 입금이 확인되어 프리미엄 전환되었습니다.`,
          color: 0x57f287,
        });
      }
      break;
    default:
      console.log('[웹훅] 처리 대상 아닌 이벤트:', eventType);
  }

  return NextResponse.json({ received: true });
}
