# 마감 알리미 (Next.js 버전)

공지·강의계획서에서 과제·시험 마감을 추출해 `.ics`로 저장하는 서비스. 기존 HTML+Express 버전을 Next.js(App Router)로 통합.

## 실행
```bash
npm install
cp .env.example .env   # 값 채우기
npm run dev
```
http://localhost:3000

## 구조
- `/` — 홈 (오프라인/AI 분석/결제 진입)
- `/workspace/offline` — 정규식 기반 추출 (API 불필요, 기존 workspace-mockup-norman.html 포팅)
- `/workspace/gemini` — Gemini 기반 추출. **API 키는 서버 라우트(`/api/extract`)에서만 사용**해 브라우저에 노출 안 됨
- `/checkout` — 토스페이먼츠 카드 전용 결제 (4,900원, 학기 단위)
- `/payment/success`, `/payment/fail` — 결제 리다이렉트 처리
- `/api/payment/confirm` — 서버 측 최종 승인 + 디스코드 알림
- `/api/payment/webhook` — 토스 웹훅 수신 (취소/가상계좌 상태)
- `/api/notify/test-email`, `/api/notify/check-now` — 마감 D-1/D-3 이메일 알림 시연용

## 기존 HTML 버전과 차이
- Gemini API 키가 더 이상 브라우저 JS에 들어가지 않고 서버 라우트 뒤로 숨겨짐 (보안 개선)
- 결제/웹훅/이메일 로직이 Express `server.js` 대신 Next.js Route Handler로 이동 — 별도 서버 없이 Vercel 등에 바로 배포 가능
- 인메모리 저장(`lib/store.js`)은 데모용. 실제 서비스 전환 시 DB(Prisma 등)로 교체 필요
