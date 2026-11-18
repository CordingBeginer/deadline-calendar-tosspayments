# 🎓 마감 알리미 (Next.js 14 App Router 풀스택)

> 공지 글, 강의계획서 PDF/텍스트를 올리면 **오프라인 패턴 매칭** 또는 **AI(Gemini 1.5 Flash)**가 과제·시험 마감을 뽑아주고, 원문 대조 후 **.ics 캘린더 파일**로 저장하며, **토스페이먼츠 결제** 및 **디스코드/이메일 D-day 알림**까지 제공하는 대학생 특화 풀스택 서비스입니다.

---

## 📂 프로젝트 구조

```text
├── app/
│   ├── layout.jsx                  # 루트 레이아웃
│   ├── page.jsx                    # 메인 홈 화면 (오프라인 / AI / 결제 링크)
│   ├── checkout/page.jsx           # 토스 결제창 호출 페이지
│   ├── payment/
│   │   ├── success/page.jsx        # 결제 승인 확인 및 가상계좌 영수증 페이지
│   │   └── fail/page.jsx           # 결제 실패/취소 안내 페이지
│   ├── workspace/
│   │   ├── offline/page.jsx        # 정규식 기반 오프라인 일정 추출 워크스페이스
│   │   └── gemini/page.jsx         # Gemini 1.5 Flash AI 일정 추출 워크스페이스
│   └── api/
│       ├── payment/confirm/route.js # 토스 결제 승인 API
│       ├── webhook/toss/route.js    # 가상계좌 입금/취소 웹훅 수신
│       ├── extract/route.js         # Gemini AI 일정 추출 백엔드 API
│       └── notify/
│           ├── check/route.js       # D-3, D-1 마감 임박 체크 API
│           └── test-email/route.js  # 테스트 이메일 즉시 발송 API
├── lib/
│   ├── notify.js                   # 디스코드 웹훅 & Nodemailer 이메일 발송 유틸
│   ├── store.js                    # 인메모리 유저/결제 저장소
│   └── ics.js                      # 표준 iCalendar (.ics) 파일 생성 & 다운로드
└── .env                            # 토스 키, 이메일, 디스코드 웹훅 환경변수
```

---

## 🚀 실행 방법

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 **`http://localhost:8080`** 접속!

### 주요 페이지 안내
- **메인 홈**: [http://localhost:8080](http://localhost:8080)
- **오프라인 추출**: [http://localhost:8080/workspace/offline](http://localhost:8080/workspace/offline) (API 키 없이 즉시 동작)
- **AI 일정 추출**: [http://localhost:8080/workspace/gemini](http://localhost:8080/workspace/gemini) (Gemini 1.5 Flash)
- **프리미엄 결제**: [http://localhost:8080/checkout](http://localhost:8080/checkout) (토스페이먼츠 연동)
