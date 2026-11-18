import { NextResponse } from 'next/server';
import { notifyDiscord } from '../../../../lib/notify';
import { setPremium, getUserIdByOrder } from '../../../../lib/store';

const receivedEventIds = new Set(); // 중복 수신 방지 (데모용, 실서비스는 DB로)

export async function POST(req) {
  try {
    const body = await req.json();
    const { eventType, data } = body;

    const eventId =
      req.headers.get('tosspayments-webhook-transmission-id') ||
      `${eventType}-${data?.orderId}-${Date.now()}`;
    if (receivedEventIds.has(eventId)) {
      console.log('[웹훅] 중복 이벤트 무시', eventId);
      return NextResponse.json({ received: true, duplicate: true });
    }
    receivedEventIds.add(eventId);

    console.log('[웹훅 수신]', eventType, data?.orderId, data?.status);

    switch (eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        if (data?.status === 'CANCELED' || data?.status === 'PARTIAL_CANCELED') {
          const userId = getUserIdByOrder(data?.orderId); // orderId로 해당 유저 찾기
          setPremium(userId, false);
          await notifyDiscord({
            title: '↩️ 결제 취소',
            description: `주문 ${data?.orderId} 결제가 취소되어 프리미엄이 해제되었습니다.`,
            color: 0xed4245,
          });
        }
        break;
      case 'DEPOSIT_CALLBACK':
        if (data?.status === 'EXPIRED') {
          await notifyDiscord({
            title: '⏰ 가상계좌 입금 기한 만료',
            description: `주문 ${data?.orderId} 입금이 이루어지지 않아 만료되었습니다.`,
            color: 0xfaa61a,
          });
        } else if (data?.status === 'DONE') {
          const userId = getUserIdByOrder(data?.orderId);
          setPremium(userId, true);
          await notifyDiscord({
            title: '💰 가상계좌 입금 완료',
            description: `주문 ${data?.orderId} 입금이 확인되어 프리미엄 전환되었습니다.`,
            color: 0x57f287,
          });
        }
        break;
      default:
        console.log('[웹훅] 처리 대상 아닌 이벤트:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[웹훅 처리 중 오류]', err);
    return NextResponse.json({ received: false, error: err.message }, { status: 500 });
  }
}
