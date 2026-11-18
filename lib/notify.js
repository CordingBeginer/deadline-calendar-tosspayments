import nodemailer from 'nodemailer';
import axios from 'axios';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

let mailTransporter = null;
if (EMAIL_USER && EMAIL_PASS) {
  mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
} else {
  console.log('[이메일] EMAIL_USER / EMAIL_PASS 미설정 - 이메일 발송은 콘솔 로그로 대체됩니다.');
}

export async function notifyDiscord({ title, description, color = 0x5865f2, fields = [] }) {
  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes('xxxx')) {
    console.log(`[디스코드 알림 생략 - URL 미설정] ${title}: ${description}`);
    return;
  }
  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      embeds: [{ title, description, color, fields, timestamp: new Date().toISOString() }],
    });
  } catch (err) {
    console.error('[디스코드 알림 전송 실패]', err.message);
  }
}

export async function sendEmail({ to, subject, html }) {
  if (!mailTransporter) {
    console.log(`[이메일 발송 생략 - 미설정] to=${to}, subject=${subject}`);
    return;
  }
  try {
    await mailTransporter.sendMail({ from: EMAIL_USER, to, subject, html });
    console.log(`[이메일 발송 완료] to=${to}, subject=${subject}`);
  } catch (err) {
    console.error('[이메일 발송 실패]', err.message);
  }
}

export function deadlineEmailHtml({ courseName, title, dueDate, daysLeft }) {
  const urgent = daysLeft <= 1;
  return `
  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
    <div style="background:${urgent ? '#f91f15' : '#3182f6'};color:#fff;padding:20px;text-align:center">
      <div style="font-size:14px;opacity:.85">마감 임박 알림</div>
      <div style="font-size:28px;font-weight:700;margin-top:4px">D-${daysLeft}</div>
    </div>
    <div style="padding:20px">
      <div style="color:#888;font-size:13px">${courseName || '과목 일정'}</div>
      <div style="font-size:18px;font-weight:700;margin:6px 0">${title}</div>
      <div style="color:#333;font-size:14px">마감일: ${dueDate}</div>
    </div>
  </div>`;
}
