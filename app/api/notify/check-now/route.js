// app/api/notify/check-now/route.js
// 전체 유저의 마감 D-3/D-1 즉시 점검 (cron 대신 수동 트리거, 시연용)
import { NextResponse } from 'next/server';
import { users } from '../../../../lib/store';
import { sendEmail, deadlineEmailHtml } from '../../../../lib/notify';

function daysUntil(dateStr) {
  const today = new Date();
  const due = new Date(dateStr);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

export async function POST() {
  let checked = 0;
  let sent = 0;
  for (const [userId, user] of users.entries()) {
    if (!user.premium || !user.email) continue;
    for (const ev of user.events || []) {
      checked += 1;
      const d = daysUntil(ev.dueDate);
      if (d === 3 || d === 1) {
        await sendEmail({
          to: user.email,
          subject: `[마감 D-${d}] ${ev.courseName} - ${ev.title}`,
          html: deadlineEmailHtml({ courseName: ev.courseName, title: ev.title, dueDate: ev.dueDate, daysLeft: d }),
        });
        sent += 1;
      }
    }
  }
  return NextResponse.json({ success: true, checked, sent });
}
