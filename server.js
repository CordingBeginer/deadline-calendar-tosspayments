/**
 * 과제·시험 마감 추출 서비스 - 결제(토스페이먼츠) + 알림(디스코드/이메일) 서버
 * Node.js + Express
 *
 * 포함 기능
 *  1. 토스페이먼츠 결제 승인 API   - 프론트 fetch 및 successUrl 리다이렉트 서버 직접 승인
 *  2. 가상계좌 발급 및 모의 입금   - 가상계좌 상세 영수증, 계좌번호 복사, 데모 시연용 즉시 입금 처리
 *  3. 웹훅 수신 & 서명 검증        - HMAC-SHA256 위변조 방지, 입금확인(DEPOSIT_CALLBACK), 만료(EXPIRED), 취소(CANCELED)
 *  4. 디스코드 실시간 알림         - 결제 완료 / 가상계좌 발급 / 취소 시 디스코드 채널로 실시간 Embed 알림 전송
 *  5. 이메일(Nodemailer) 알림      - D-3, D-1 마감 임박 이메일 자동 발송 (Gmail 앱 비밀번호 연동)
 *  6. 마감 체크 스케줄러 (Cron)    - 매일 오전 9시 프리미엄 유저 대상 마감 임박 체크 및 즉시 트리거 API
 *  7. 에브리타임 메인 작업 화면 서빙 - static hosting 및 프론트 설정 API (/api/config)
 */

require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const axios = require('axios');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const app = express();

// 웹훅 서명 검증을 위해 원문 바디(rawBody) 보관
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (public 폴더: index.html, checkout-popup.html 등)
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 8080;

// ===== 토스페이먼츠 설정 =====
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';
const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY || '';
const TOSS_API_URL = 'https://api.tosspayments.com/v1/payments/confirm';
const BASIC_AUTH = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');

// ===== 디스코드 웹훅 설정 =====
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

// ===== 이메일(Nodemailer) 설정 =====
// Gmail 기준: 구글 계정 "앱 비밀번호" 발급해서 사용 (일반 로그인 비번 X)
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

let mailTransporter = null;
if (EMAIL_USER && EMAIL_PASS) {
  mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
} else {
  console.log('[이메일] EMAIL_USER / EMAIL_PASS가 설정되지 않아, 이메일 발송은 콘솔 로그로만 대체됩니다.');
}

// ===== 데모용 인메모리 저장소 =====
const users = new Map(); // key: userId, value: { email, premium, schedules: [...] }
const payments = new Map(); // key: orderId, value: { status, amount, ... }
const receivedEventIds = new Set(); // 웹훅 중복 처리 방지

// 데모용 유저 미리 등록 (시연용)
users.set('demo-user', {
  email: process.env.DEMO_NOTIFY_EMAIL || 'student@univ.ac.kr',
  premium: false,
  schedules: [
    { title: '중간고사 (디지털신호처리)', dueDate: '2026-11-20', course: '디지털신호처리' },
    { title: '과제 2 제출 (MATLAB 필터)', dueDate: '2026-11-25', course: '디지털신호처리' },
  ],
});

// =========================================================
// 1. 디스코드 알림 함수
// =========================================================
async function notifyDiscord(title, description, color = 0x3182f6, fields = []) {
  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes('xxxx')) {
    console.log(`[디스코드 알림 생략 - URL 미설정] ${title}: ${description}`);
    return;
  }
  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      embeds: [
        {
          title,
          description,
          color,
          fields,
          timestamp: new Date().toISOString(),
          footer: { text: '마감일 캘린더 결제 & 알림 시스템' },
        },
      ],
    });
    console.log(`[디스코드 알림 전송 완료] ${title}`);
  } catch (err) {
    console.error('[디스코드 알림 전송 실패]', err.response?.data || err.message);
  }
}

// =========================================================
// 2. 이메일 발송 함수 & 템플릿
// =========================================================
async function sendEmail(to, subject, html) {
  if (!mailTransporter) {
    console.log(`[이메일 발송 생략 - 미설정] to=${to}, subject=${subject}`);
    return;
  }
  try {
    await mailTransporter.sendMail({
      from: `"마감 알리미" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[이메일 발송 완료] to=${to}, subject=${subject}`);
  } catch (err) {
    console.error('[이메일 발송 실패]', err.message);
  }
}

function buildDeadlineEmailHtml(schedule, daysLeft) {
  const urgencyColor = daysLeft <= 1 ? '#f91f15' : '#ff9f1c';
  return `
    <div style="font-family: 'Apple SD Gothic Neo', -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 16px; background:#fff;">
      <div style="display:inline-block; background:${urgencyColor}; color:#fff; padding:5px 14px; border-radius:999px; font-size:13px; font-weight:bold;">
        D-${daysLeft}
      </div>
      <h2 style="margin:16px 0 6px; color:#18181b;">${schedule.title}</h2>
      <p style="color:#71717a; margin:0 0 16px; font-size:14px;">${schedule.course || '과목 일정'}</p>
      <div style="background:#f7f7f8; padding:14px; border-radius:10px; font-size:14px; margin-bottom:16px;">
        📅 마감일: <b>${schedule.dueDate}</b>
      </div>
      <p style="font-size:12.5px; color:#a1a1aa; margin:0;">
        ✨ 프리미엄 마감 알림 서비스에서 자동 발송되었습니다.
      </p>
    </div>
  `;
}

// =========================================================
// 3. 마감 임박 체크 스케줄러 (매일 오전 9시, 프리미엄 유저만)
// =========================================================
function getDaysLeft(dueDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diffMs = due - today;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

async function checkDeadlinesAndNotify() {
  console.log('[스케줄러] 마감 임박 체크 시작:', new Date().toLocaleString());
  for (const [userId, user] of users.entries()) {
    if (!user.premium) continue; // 무료 플랜은 알림 제외 (프리미엄 전용 기능)

    for (const schedule of user.schedules) {
      const daysLeft = getDaysLeft(schedule.dueDate);
      if (daysLeft === 3 || daysLeft === 1) {
        await sendEmail(
          user.email,
          `[마감 D-${daysLeft}] ${schedule.title}`,
          buildDeadlineEmailHtml(schedule, daysLeft)
        );
      }
    }
  }
}

// 매일 오전 9시 실행
cron.schedule('0 9 * * *', checkDeadlinesAndNotify);

// 시연/테스트용: 수동으로 즉시 체크 트리거
app.post('/notify/check-now', async (req, res) => {
  await checkDeadlinesAndNotify();
  res.json({ message: '마감 체크를 실행했습니다. 서버 로그와 이메일을 확인하세요.' });
});

// 시연/테스트용: 특정 유저에게 즉시 샘플 마감 알림 발송
app.post('/notify/test-email', async (req, res) => {
  const { userId = 'demo-user', daysLeft = 1 } = req.body;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });

  const sampleSchedule = {
    title: '디지털신호처리 중간고사',
    course: '디지털신호처리 (공학관 401호)',
    dueDate: new Date(Date.now() + daysLeft * 86400000).toISOString().slice(0, 10),
  };

  await sendEmail(
    user.email,
    `[마감 D-${daysLeft}] ${sampleSchedule.title}`,
    buildDeadlineEmailHtml(sampleSchedule, daysLeft)
  );

  res.json({ message: `${user.email}로 테스트 이메일 발송을 시도했습니다. (미설정 시 콘솔 로그만 남습니다)` });
});

// =========================================================
// 0. 프론트 연동 API (설정 조회 및 주문 사전 등록)
// =========================================================
app.get('/api/config', (req, res) => {
  res.json({ clientKey: TOSS_CLIENT_KEY });
});

app.post('/api/payments/create-order', (req, res) => {
  const { orderId, amount, orderName } = req.body;
  if (!orderId || !amount) {
    return res.status(400).json({ error: 'orderId와 amount는 필수입니다.' });
  }

  payments.set(orderId, {
    orderId,
    amount: Number(amount),
    orderName: orderName || '프리미엄 플랜 (1학기)',
    status: 'READY',
    createdAt: new Date().toISOString(),
  });

  return res.json({ ok: true, orderId, amount });
});

// 토스 결제 승인 API 공통 호출 함수
async function confirmPaymentApi({ paymentKey, orderId, amount }) {
  if (!TOSS_SECRET_KEY || TOSS_SECRET_KEY.includes('YOUR_SECRET_KEY')) {
    return {
      ok: false,
      status: 500,
      data: { message: '.env 파일에 올바른 TOSS_SECRET_KEY(test_sk_...)를 입력해주세요.' },
    };
  }

  try {
    const response = await axios.post(
      TOSS_API_URL,
      { paymentKey, orderId, amount: Number(amount) },
      {
        headers: {
          Authorization: `Basic ${BASIC_AUTH}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return { ok: true, status: response.status, data: response.data };
  } catch (err) {
    console.error('[confirm error]', err.response?.data || err.message);
    return {
      ok: false,
      status: err.response?.status || 500,
      data: err.response?.data || { message: '결제 승인 처리 중 오류가 발생했습니다.' },
    };
  }
}

// =========================================================
// 1. 프론트 직접 호출용 승인 엔드포인트
// =========================================================
app.post('/api/payments/confirm', async (req, res) => {
  const { paymentKey, orderId, amount } = req.body;
  if (!paymentKey || !orderId || !amount) {
    return res.status(400).json({ error: 'paymentKey, orderId, amount는 필수입니다.' });
  }

  const result = await confirmPaymentApi({ paymentKey, orderId, amount });
  if (!result.ok) {
    await notifyDiscord(
      '❌ 결제 승인 실패',
      `주문번호: ${orderId}`,
      0xef4444,
      [{ name: '사유', value: result.data?.message || '알 수 없는 오류' }]
    );
    return res.status(result.status).json(result.data);
  }

  const paymentData = result.data;
  const isVA = paymentData.method === '가상계좌' || paymentData.status === 'WAITING_FOR_DEPOSIT';
  payments.set(orderId, { ...paymentData });

  if (!isVA) {
    const user = users.get('demo-user');
    if (user) user.premium = true;
  }

  await notifyDiscord(
    isVA ? '🏦 가상계좌 발급 완료' : '✅ 결제 승인 완료',
    `주문번호: ${orderId}`,
    isVA ? 0x3182f6 : 0x16a34a,
    [
      { name: '금액', value: `${Number(amount).toLocaleString()}원`, inline: true },
      { name: '결제수단', value: paymentData.method || '-', inline: true },
    ]
  );

  return res.status(200).json(paymentData);
});

// =========================================================
// 4. 결제 승인 (successUrl 리다이렉트 처리)
// =========================================================
app.get('/payment/success', async (req, res) => {
  const { paymentKey, orderId, amount } = req.query;
  console.log('[결제 승인 요청 수신]', { paymentKey, orderId, amount });

  if (!paymentKey || !orderId || !amount) {
    return res.status(400).send('필수 파라미터가 누락됐습니다.');
  }

  const result = await confirmPaymentApi({ paymentKey, orderId, amount: Number(amount) });

  if (!result.ok) {
    console.log('[결제 승인 실패]', result.data);
    payments.set(orderId, { status: 'FAILED', reason: result.data?.message });

    await notifyDiscord(
      '❌ 결제 승인 실패',
      `주문번호: ${orderId}`,
      0xef4444,
      [{ name: '사유', value: result.data?.message || '알 수 없는 오류' }]
    );

    return res.status(result.status).send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head><meta charset="UTF-8"><title>결제 승인 실패</title>
      <style>body{font-family:sans-serif; text-align:center; padding:60px 20px; background:#f5f6f8;} .card{background:#fff; border-radius:18px; padding:32px; max-width:400px; margin:0 auto; box-shadow:0 4px 16px rgba(0,0,0,0.06);}</style>
      </head>
      <body>
        <div class="card">
          <h2 style="color:#ef4444;">결제 승인 실패</h2>
          <p>${result.data?.message || '알 수 없는 오류'}</p>
          <a href="/" style="display:inline-block; margin-top:20px; padding:12px 24px; background:#292929; color:#fff; text-decoration:none; border-radius:10px; font-weight:bold;">메인 화면으로 돌아가기</a>
        </div>
      </body>
      </html>
    `);
  }

  const paymentData = result.data;
  payments.set(orderId, { ...paymentData });

  const isVA = paymentData.method === '가상계좌' || paymentData.status === 'WAITING_FOR_DEPOSIT';
  const va = paymentData.virtualAccount || {};
  const bankName = va.bank || va.bankCode || '가상계좌';
  const accountNum = va.accountNumber || '계좌번호 발급 완료';
  const dueDate = va.dueDate ? new Date(va.dueDate).toLocaleString('ko-KR') : '발급 후 72시간 이내';

  if (!isVA) {
    const user = users.get('demo-user');
    if (user) user.premium = true;
  }

  console.log('[결제 승인 완료]', paymentData.method, paymentData.totalAmount);

  await notifyDiscord(
    isVA ? '🏦 가상계좌 발급 완료' : '✅ 결제 승인 완료',
    `주문번호: ${paymentData.orderId}`,
    isVA ? 0x3182f6 : 0x16a34a,
    [
      { name: '금액', value: `${Number(paymentData.totalAmount).toLocaleString()}원`, inline: true },
      { name: '결제수단', value: paymentData.method || '카드', inline: true },
      ...(isVA
        ? [
            { name: '가상계좌', value: `${bankName} ${accountNum}`, inline: false },
            { name: '입금마감', value: dueDate, inline: false },
          ]
        : []),
    ]
  );

  // 토스 브랜드 스타일의 세련된 결과 화면 서빙
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${isVA ? '가상계좌 발급 완료' : '프리미엄 전환 완료'} - 마감일 캘린더</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: "Pretendard", -apple-system, sans-serif; background: #f5f6f8; margin: 0; padding: 24px; display: flex; justify-content: center; align-items: center; min-height: 100vh; color: #191f28; }
        .card { background: #fff; border-radius: 20px; padding: 32px 24px; max-width: 440px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.06); text-align: center; }
        .icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 16px; }
        .icon.done { background: #e8f8ee; color: #1a9e52; }
        .icon.va { background: #eff6ff; color: #0064ff; }
        h2 { font-size: 22px; font-weight: 800; margin: 0 0 6px; }
        p.sub { font-size: 13.5px; color: #8b95a1; margin: 0 0 20px; line-height: 1.5; }
        .receipt { background: #f9fafb; border-radius: 14px; padding: 16px 18px; margin-bottom: 20px; text-align: left; border: 1px solid #e5e8eb; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13.5px; border-bottom: 1px solid #f2f4f6; }
        .row:last-child { border-bottom: none; }
        .label { color: #8b95a1; }
        .val { font-weight: 700; color: #333d4b; }
        .va-box { background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 12px; padding: 14px; margin-bottom: 16px; text-align: left; }
        .va-num { font-size: 19px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
        .btn-copy { background: #0064ff; color: #fff; border: none; padding: 5px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 700; cursor: pointer; }
        .btn-main { display: block; width: 100%; padding: 15px; background: #0064ff; color: #fff; border: none; border-radius: 12px; font-size: 15.5px; font-weight: 700; text-decoration: none; cursor: pointer; transition: background 0.15s; }
        .btn-main:hover { background: #0052cc; }
        .btn-sim { display: block; width: 100%; padding: 12px; background: #fff; color: #f59e0b; border: 1.5px solid #f59e0b; border-radius: 12px; font-size: 13.5px; font-weight: 700; cursor: pointer; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon ${isVA ? 'va' : 'done'}">${isVA ? '🏦' : '🎉'}</div>
        <h2>${isVA ? '가상계좌가 발급되었습니다' : '프리미엄 전환 완료!'}</h2>
        <p class="sub">${isVA ? '아래 계좌로 입금하시면 프리미엄이 즉시 활성화됩니다.' : '이제 무제한 일정 추출과 마감 임박 이메일 알림을 이용하실 수 있어요.'}</p>

        ${
          isVA
            ? `
          <div class="va-box">
            <div style="font-size:12px; color:#1e40af; font-weight:700;">입금 전용 계좌 (${bankName})</div>
            <div class="va-num">
              <span>${accountNum}</span>
              <button class="btn-copy" onclick="copyAcc('${accountNum}')">복사</button>
            </div>
          </div>
        `
            : ''
        }

        <div class="receipt">
          <div class="row"><span class="label">상품명</span><span class="val">${paymentData.orderName || '프리미엄 플랜 (1학기)'}</span></div>
          <div class="row"><span class="label">결제 금액</span><span class="val" style="color:#0064ff;">${Number(paymentData.totalAmount).toLocaleString()}원</span></div>
          <div class="row"><span class="label">결제 수단</span><span class="val">${paymentData.method}</span></div>
          ${isVA ? `<div class="row"><span class="label">입금 마감</span><span class="val">${dueDate}</span></div>` : ''}
          <div class="row"><span class="label">주문번호</span><span class="val" style="font-size:12px;">${orderId}</span></div>
        </div>

        <a href="/?premium=true" class="btn-main" onclick="savePremium()">마감일 캘린더 작업 화면으로 가기</a>

        ${
          isVA
            ? `
          <button class="btn-sim" onclick="simulateDeposit('${orderId}')">
            ⚡ [시연용] 모의 입금 완료 처리하기
          </button>
        `
            : ''
        }
      </div>

      <script>
        function savePremium() {
          localStorage.setItem("user_tier", "PREMIUM");
        }
        ${!isVA ? 'savePremium();' : ''}

        function copyAcc(num) {
          navigator.clipboard.writeText(num).then(() => alert("계좌번호가 복사되었습니다: " + num));
        }

        async function simulateDeposit(oId) {
          try {
            const res = await fetch("/api/simulate-deposit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: oId }),
            });
            const data = await res.json();
            if (data.ok) {
              alert("🎉 [시연용] 입금이 확인되었습니다! 프리미엄이 활성화됩니다.");
              window.location.href = "/?premium=true";
            }
          } catch (e) {
            alert("모의 입금 실패: " + e.message);
          }
        }
      </script>
    </body>
    </html>
  `);
});

// =========================================================
// 5. 결제 실패/취소 (failUrl 리다이렉트 처리)
// =========================================================
app.get('/payment/fail', async (req, res) => {
  const { code, message, orderId } = req.query;
  console.log('[결제 실패/취소]', { code, message, orderId });

  await notifyDiscord(
    '⚠️ 결제 취소/실패',
    `주문번호: ${orderId || '-'}`,
    0xf39c12,
    [
      { name: '에러코드', value: code || '-', inline: true },
      { name: '사유', value: message || '-', inline: true },
    ]
  );

  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head><meta charset="UTF-8"><title>결제 실패</title>
    <style>body{font-family:sans-serif; text-align:center; padding:40px; background:#f5f6f8;} .box{background:#fff; padding:30px; border-radius:16px; max-width:400px; margin:0 auto; box-shadow:0 2px 10px rgba(0,0,0,0.05);}</style>
    </head>
    <body>
      <div class="box">
        <h2 style="color:#f39c12;">결제가 취소되었습니다</h2>
        <p>${message || '결제창을 닫았거나 결제가 취소되었습니다.'} (code: ${code || '-'})</p>
        <a href="/" style="display:inline-block; margin-top:16px; padding:10px 20px; background:#292929; color:#fff; border-radius:8px; text-decoration:none;">메인 화면으로 돌아가기</a>
      </div>
    </body>
    </html>
  `);
});

// =========================================================
// 6. 토스 웹훅 수신 (서명 검증 포함)
// =========================================================
function verifyTossSignature({ rawBody, transmissionTime, signatureHeader, secretKey }) {
  const signatures = signatureHeader
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('v1:'))
    .map((s) => s.slice(3));

  const payload = `${rawBody}:${transmissionTime}`;
  const expected = crypto.createHmac('sha256', secretKey).update(payload).digest('base64');

  return signatures.some((sig) => {
    try {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

app.post('/webhook/toss', async (req, res) => {
  const signatureHeader = req.get('tosspayments-webhook-signature');
  const transmissionTime = req.get('tosspayments-webhook-transmission-time');

  // 서명 헤더가 있는 경우 HMAC-SHA256 검증 수행
  if (signatureHeader && transmissionTime && TOSS_SECRET_KEY) {
    const isValid = verifyTossSignature({
      rawBody: req.rawBody,
      transmissionTime,
      signatureHeader,
      secretKey: TOSS_SECRET_KEY,
    });
    if (!isValid) {
      console.warn('[웹훅] 서명 검증 실패 - 요청 거부');
      return res.status(401).send('invalid signature');
    }
  }

  const event = req.body;
  const eventId = event.eventId || `${event.createdAt}-${event.data?.orderId}`;

  if (receivedEventIds.has(eventId)) {
    console.log('[웹훅] 중복 이벤트 무시:', eventId);
    return res.status(200).send('duplicate ignored');
  }
  receivedEventIds.add(eventId);

  console.log('[웹훅 수신]', event.eventType, event.data?.orderId);

  res.status(200).send('ok'); // 10초 제한 대응 즉시 응답

  switch (event.eventType) {
    case 'DEPOSIT_CALLBACK': {
      const { orderId, status } = event.data || {};
      if (status === 'EXPIRED') {
        await notifyDiscord('⏰ 가상계좌 입금 기한 만료', `주문번호: ${orderId}`, 0xf39c12);
        payments.set(orderId, { status: 'EXPIRED' });
      } else if (status === 'DONE') {
        payments.set(orderId, { status: 'DONE', ...event.data });
        const user = users.get('demo-user');
        if (user) user.premium = true;
        await notifyDiscord(
          '💰 가상계좌 입금 완료',
          `주문번호: ${orderId}`,
          0x16a34a,
          [{ name: '금액', value: `${Number(event.data?.totalAmount || 4900).toLocaleString()}원`, inline: true }]
        );
      }
      break;
    }
    case 'PAYMENT_STATUS_CHANGED': {
      const { orderId, status } = event.data || {};
      if (status === 'CANCELED' || status === 'PARTIAL_CANCELED') {
        await notifyDiscord('↩️ 결제 취소(웹훅)', `주문번호: ${orderId}`, 0xe74c3c);
        const prev = payments.get(orderId) || {};
        payments.set(orderId, { ...prev, status });
        const user = users.get('demo-user');
        if (user) user.premium = false; // 프리미엄 혜택 회수
      }
      break;
    }
    default:
      console.log('[웹훅] 처리하지 않는 이벤트 타입:', event.eventType);
  }
});

// =========================================================
// 7. 가상계좌 모의 입금 시뮬레이션 API (데모/시연용)
// =========================================================
app.post('/api/simulate-deposit', async (req, res) => {
  const { orderId } = req.body;
  const order = payments.get(orderId) || { orderId, amount: 4900 };

  order.status = 'DONE';
  order.paidAt = new Date().toISOString();
  payments.set(orderId, order);

  const user = users.get('demo-user');
  if (user) user.premium = true;

  console.log(`[모의 입금 완료] orderId: ${orderId}`);

  await notifyDiscord(
    '💰 [시연] 가상계좌 입금 완료',
    `주문번호: ${orderId}`,
    0x16a34a,
    [{ name: '금액', value: `${Number(order.totalAmount || order.amount || 4900).toLocaleString()}원`, inline: true }]
  );

  return res.json({ ok: true, order });
});

// 메인 페이지 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =========================================================
// 서버 시작
// =========================================================
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  console.log(`👉 메인 작업 화면: http://localhost:${PORT}`);
  console.log(`👉 디스코드 알림: ${DISCORD_WEBHOOK_URL ? '설정됨 ✅' : '미설정 (콘솔 로그만) ℹ️'}`);
  console.log(`👉 이메일 알림: ${mailTransporter ? '설정됨 ✅' : '미설정 (콘솔 로그만) ℹ️'}`);
});
