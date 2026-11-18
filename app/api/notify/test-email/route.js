// app/api/notify/test-email/route.js
// 발표 시연용: 버튼 누르면 즉시 마감 임박 메일 1건 발송
import { NextResponse } from 'next/server';
import { sendEmail, deadlineEmailHtml } from '../../../../lib/notify';

export async function POST(req) {
  const { to, courseName = '시스템보안', title = '기말고사', dueDate = '2026-12-10', daysLeft = 1 } = await req.json();
  const target = to || process.env.DEMO_NOTIFY_EMAIL;
  if (!target) {
    return NextResponse.json({ success: false, message: '받는 이메일(to 또는 DEMO_NOTIFY_EMAIL)이 없습니다.' }, { status: 400 });
  }
  await sendEmail({
    to: target,
    subject: `[마감 D-${daysLeft}] ${courseName} - ${title}`,
    html: deadlineEmailHtml({ courseName, title, dueDate, daysLeft }),
  });
  return NextResponse.json({ success: true, to: target });
}
