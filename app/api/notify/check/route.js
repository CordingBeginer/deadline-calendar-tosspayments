import { NextResponse } from 'next/server';
import { users } from '../../../../lib/store';
import { sendEmail, deadlineEmailHtml } from '../../../../lib/notify';

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

export async function POST() {
  let checked = 0;
  let sent = 0;

  try {
    for (const [userId, user] of users.entries()) {
      if (!user.premium || !user.email) continue;
      for (const ev of user.events || []) {
        checked += 1;
        const d = daysUntil(ev.dueDate);
        if (d === 3 || d === 1) {
          await sendEmail({
            to: user.email,
            subject: `[마감 D-${d}] ${ev.courseName} - ${ev.title}`,
            html: deadlineEmailHtml({
              courseName: ev.courseName,
              title: ev.title,
              dueDate: ev.dueDate,
              daysLeft: d,
            }),
          });
          sent += 1;
        }
      }
    }
    return NextResponse.json({ success: true, checked, sent });
  } catch (err) {
    console.error('[마감 체크 오류]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
