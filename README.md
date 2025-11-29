# Jacal

## 프로젝트 개요

**Jacal**은 일정, 할일, 습관 추적, 팀 협업, 생산성 분석을 하나로 통합한 올인원 생산성 플랫폼입니다.

### 핵심 기능

- 🗣️ **자연어 입력**: 한 줄로 일정/할일 자동 분류 및 생성
- 🤖 **AI 파싱**: OpenAI/Ollama를 활용한 스마트 자연어 처리
- 📅 **캘린더 뷰**: 월간/주간 캘린더 보기 지원
- ✅ **할일 관리**: 우선순위, 예상 소요 시간, 상태 관리
- 🎯 **습관 추적**: 일일/주간 습관 관리 및 완료 기록
- 👥 **팀 협업**: 팀별 공유 일정 및 댓글 기능
- ⚡ **집중 타이머**: 포모도로 타이머로 집중력 향상
- 📊 **생산성 분석**: 일일 생산성 추적 및 시각화
- 🔐 **보안 인증**: JWT 기반 안전한 인증 시스템
- 🌐 **다국어 지원**: 한국어/영어 지원 (i18next)
- ⌨️ **키보드 단축키**: 마우스 없이 빠른 작업 (Ctrl+K 등)
- 📧 **이메일 통합**: POP3를 통한 이메일 자동 파싱
- 🔗 **웹훅 시스템**: 외부 시스템 연동
- 🛠️ **관리자 패널**: 전체 시스템 관리 및 모니터링

## 기술 스택

### Backend

- **Runtime**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **AI/NLP**: OpenAI API, Ollama (선택적)
- **Authentication**: JWT + bcrypt
- **Email**: POP3 (node-pop3), Nodemailer
- **Schedule**: node-cron
- **Validation**: Zod
- **Calendar**: Google Calendar API

### Frontend

- **Framework**: React 19 + TypeScript + Vite
- **State**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **i18n**: i18next, react-i18next
- **Charts**: Recharts
- **Styling**: Modern CSS (CSS Variables)

### Infrastructure

- **Container**: Docker Compose
- **Database**: PostgreSQL 15 Alpine

## 시작하기

### Prerequisites

- Node.js v18 이상
- Docker & Docker Compose (권장)
- OpenAI API Key (선택적 - Ollama 사용 가능)

### 설치 및 실행

#### 방법 1: Docker Compose (권장)

1. **레포지토리 클론**

```bash
git clone <repo-url>
cd jacal
```

2. **PostgreSQL 실행**

```bash
docker-compose up -d
```

3. **의존성 설치**

```bash
npm install
```

4. **환경 변수 설정**

`apps/api/.env` 파일 생성:

```env
PORT=3000
DATABASE_URL="postgresql://jacal:jacal123@localhost:5432/jacal?schema=public"
JWT_SECRET=your-super-secret-key-change-in-production
OPENAI_API_KEY=your-openai-api-key-here  # 선택적
```

5. **데이터베이스 마이그레이션**

```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
```

6. **관리자 계정 생성** (선택적)

```bash
npm run create-admin
```

7. **백엔드 서버 실행**

```bash
npm run dev
```

8. **프론트엔드 실행** (새 터미널)

```bash
cd apps/web
npm run dev
```

9. **브라우저에서 접속**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

#### 방법 2: 로컬 PostgreSQL 사용

위 과정에서 2번 대신 로컬 PostgreSQL을 사용하고, `DATABASE_URL`을 적절히 수정하세요.

## 주요 기능 상세

### 1. 자연어 처리 (NLU)

한 줄의 자연어 입력으로 이벤트나 할일을 자동 생성합니다.

**예시:**

- "내일 오후 3시 팀 미팅 2시간"
- "다음 주 금요일까지 보고서 작성"
- "매일 아침 9시 운동하기"

**엔드포인트:** `POST /api/nlu/parse`

### 2. 캘린더 뷰

- **월간 보기**: 월 전체의 일정 한눈에 파악
- **주간 보기**: 시간대별 상세 일정 확인
- **관리자 모드**: 전체 사용자의 일정 조회 가능

### 3. 습관 추적

- 일일/주간 습관 생성 및 관리
- 완료 기록 및 달성률 확인
- 색상/아이콘으로 시각적 구분

**API:**

- `GET /api/habits` - 습관 목록
- `POST /api/habits` - 습관 생성
- `POST /api/habits/:id/log` - 완료 기록
- `GET /api/habits/:id/stats` - 통계 조회

### 4. 팀 협업

- 팀 생성 및 멤버 관리 (Owner/Admin/Member 역할)
- 공유 이벤트 생성 및 댓글
- 팀원 간 일정 조율

**API:**

- `GET /api/teams` - 팀 목록
- `POST /api/teams` - 팀 생성
- `POST /api/teams/:id/events` - 공유 이벤트 생성
- `POST /api/teams/events/:id/comments` - 댓글 작성

### 5. 생산성 분석

- 일일 집중 시간 추적
- 완료한 할일 통계
- 미팅 시간 분석
- 생산성 점수 계산

**API:**

- `GET /api/analytics/dashboard` - 대시보드 데이터
- `GET /api/analytics/productivity` - 생산성 추이

### 6. 관리자 패널

관리자 사용자는 다음 기능에 접근 가능:

- **시스템 통계**: 사용자/이벤트/할일 집계
- **사용자 관리**: 전체 사용자 조회/수정/삭제, POP3 설정
- **콘텐츠 관리**: 전체 할일/이벤트/습관/팀 관리
- **데이터베이스**: 통계 및 백업 관리
- **설정**: 사이트 이름, URL, 언어, 가입 허용 등
- **웹훅 관리**: 웹훅 CRUD
- **통합 관리**: 외부 서비스 연동
- **이메일 설정**: SMTP 설정

### 7. 사용자 설정

각 사용자는 개인 설정 가능:

- **Ollama 설정**: OpenAI 대신 로컬 LLM 사용
- **POP3 설정**: 이메일 자동 파싱 (제목/본문에서 할일 생성)
- **웹훅 설정**: 개인 웹훅 URL 및 컬럼 매핑

### 8. 키보드 단축키

- `Ctrl+K`: 명령 팔레트 (빠른 작업)
- `N`: 새 이벤트
- `T`: 새 할일
- `D`: 대시보드
- `C`: 캘린더
- `H`: 습관 추적
- `M`: 팀 뷰
- `S`: 설정
- `?`: 단축키 도움말

## API 엔드포인트

### 인증

- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 할일 (Tasks)

- `GET /api/tasks` - 할일 목록
- `POST /api/tasks` - 할일 생성
- `PUT /api/tasks/:id` - 할일 수정
- `DELETE /api/tasks/:id` - 할일 삭제

### 이벤트 (Events)

- `GET /api/events` - 이벤트 목록
- `GET /api/events/all` - 전체 이벤트 (관리자)
- `POST /api/events` - 이벤트 생성
- `PUT /api/events/:id` - 이벤트 수정
- `DELETE /api/events/:id` - 이벤트 삭제

### 습관 (Habits)

- `GET /api/habits` - 습관 목록
- `POST /api/habits` - 습관 생성
- `PUT /api/habits/:id` - 습관 수정
- `DELETE /api/habits/:id` - 습관 삭제
- `POST /api/habits/:id/log` - 완료 기록
- `GET /api/habits/:id/stats` - 통계

### 팀 (Teams)

- `GET /api/teams` - 내 팀 목록
- `POST /api/teams` - 팀 생성
- `PUT /api/teams/:id` - 팀 수정
- `DELETE /api/teams/:id` - 팀 삭제
- `POST /api/teams/:id/members` - 멤버 추가
- `DELETE /api/teams/:id/members/:userId` - 멤버 제거
- `GET /api/teams/:id/events` - 공유 이벤트 목록
- `POST /api/teams/:id/events` - 공유 이벤트 생성
- `POST /api/teams/events/:id/comments` - 댓글 작성

### 분석 (Analytics)

- `GET /api/analytics/dashboard` - 대시보드
- `GET /api/analytics/productivity` - 생산성 추이

### 설정 (Settings)

- `GET /api/settings` - 내 설정
- `PUT /api/settings` - 설정 업데이트

### 캘린더

- `GET /api/calendar` - 캘린더 이벤트

### 집중 타이머

- `POST /api/focus/session` - 집중 세션 기록

### 자연어 처리 (NLU)

- `POST /api/nlu/parse` - 자연어 파싱 및 자동 생성

### 관리자 API

- `GET /api/admin/stats` - 시스템 통계
- `GET /api/admin/users` - 사용자 목록
- `PUT /api/admin/users/:id` - 사용자 수정
- `DELETE /api/admin/users/:id` - 사용자 삭제
- `PUT /api/admin/users/:id/settings` - 사용자 설정 수정
- `GET /api/admin/content/tasks` - 전체 할일
- `GET /api/admin/content/habits` - 전체 습관
- `GET /api/admin/content/teams` - 전체 팀
- `DELETE /api/admin/content/:type/:id` - 콘텐츠 삭제
- `GET /api/admin/database/stats` - 데이터베이스 통계
- `POST /api/admin/database/backup` - 백업 생성
- `GET /api/admin/database/backups` - 백업 목록
- `GET /api/admin/settings` - 앱 설정
- `PUT /api/admin/settings` - 앱 설정 업데이트
- `GET /api/admin/webhooks` - 웹훅 목록
- `POST /api/admin/webhooks` - 웹훅 생성
- `PUT /api/admin/webhooks/:id` - 웹훅 수정
- `DELETE /api/admin/webhooks/:id` - 웹훅 삭제
- `GET /api/admin/integrations` - 통합 목록
- `PUT /api/admin/integrations/:name` - 통합 업데이트
- `GET /api/admin/email` - 이메일 설정
- `PUT /api/admin/email` - 이메일 설정 업데이트

## 프로젝트 구조

```
jacal/
├── apps/
│   ├── api/                          # 백엔드
│   │   ├── src/
│   │   │   ├── routes/               # API 라우트
│   │   │   │   ├── admin/            # 관리자 라우트
│   │   │   │   ├── auth.ts           # 인증
│   │   │   │   ├── tasks.ts          # 할일
│   │   │   │   ├── events.ts         # 이벤트
│   │   │   │   ├── habits.ts         # 습관
│   │   │   │   ├── teams.ts          # 팀
│   │   │   │   ├── analytics.ts      # 분석
│   │   │   │   ├── settings.ts       # 설정
│   │   │   │   ├── calendar.ts       # 캘린더
│   │   │   │   ├── focus.ts          # 집중 타이머
│   │   │   │   └── nlu.ts            # 자연어 처리
│   │   │   ├── services/             # 비즈니스 로직
│   │   │   │   ├── nlu.service.ts    # NLU 서비스
│   │   │   │   ├── webhook.service.ts # 웹훅 서비스
│   │   │   │   └── email.service.ts  # 이메일 서비스
│   │   │   ├── middleware/           # 미들웨어
│   │   │   │   ├── auth.ts           # 인증 미들웨어
│   │   │   │   └── admin.ts          # 관리자 미들웨어
│   │   │   ├── lib/                  # 유틸리티
│   │   │   └── index.ts              # 엔트리 포인트
│   │   ├── prisma/
│   │   │   └── schema.prisma         # 데이터베이스 스키마
│   │   ├── scripts/
│   │   │   └── create-admin.ts       # 관리자 생성 스크립트
│   │   └── package.json
│   └── web/                          # 프론트엔드
│       ├── src/
│       │   ├── components/           # React 컴포넌트
│       │   │   ├── admin/            # 관리자 컴포넌트
│       │   │   ├── settings/         # 설정 컴포넌트
│       │   │   ├── Dashboard.tsx     # 대시보드
│       │   │   ├── Calendar.tsx      # 캘린더
│       │   │   ├── HabitTracker.tsx  # 습관 추적
│       │   │   ├── TeamView.tsx      # 팀 뷰
│       │   │   └── ...
│       │   ├── lib/                  # API 클라이언트
│       │   │   ├── api.ts            # 기본 API
│       │   │   ├── habitApi.ts       # 습관 API
│       │   │   ├── teamApi.ts        # 팀 API
│       │   │   ├── analyticsApi.ts   # 분석 API
│       │   │   └── adminApi.ts       # 관리자 API
│       │   ├── i18n/                 # 다국어
│       │   │   ├── i18n.ts           # i18next 설정
│       │   │   ├── ko.json           # 한국어
│       │   │   └── en.json           # 영어
│       │   ├── App.tsx               # 메인 컴포넌트
│       │   ├── index.css             # 글로벌 스타일
│       │   └── main.tsx              # 엔트리 포인트
│       └── package.json
├── docker-compose.yml                # Docker 설정
├── package.json                      # 루트 패키지
└── README.md
```

## 데이터베이스 모델

주요 모델:

- **User**: 사용자 (인증, 권한)
- **Task**: 할일
- **Event**: 이벤트
- **Habit**: 습관
- **HabitLog**: 습관 완료 기록
- **Team**: 팀
- **TeamMember**: 팀 멤버
- **SharedEvent**: 공유 이벤트
- **Comment**: 댓글
- **Tag**: 태그
- **Analytics**: 생산성 분석 데이터
- **UserSettings**: 사용자 설정 (Ollama, POP3)
- **WebhookConfig**: 웹훅 설정
- **ConnectedAccount**: 외부 계정 연동 (Google Calendar 등)
- **RecurringRule**: 반복 규칙
- **Reminder**: 알림
- **ProcessedEmail**: 처리된 이메일 기록
- **AppSettings**: 앱 전역 설정
- **Webhook**: 관리자 웹훅
- **Integration**: 통합 설정
- **EmailSettings**: 이메일 설정
- **BackupRecord**: 백업 기록

## 개발 및 배포

### 개발 모드

```bash
# 백엔드 개발 서버 (hot reload)
cd apps/api
npm run dev

# 프론트엔드 개발 서버 (hot reload)
cd apps/web
npm run dev
```

### 프로덕션 빌드

```bash
# 백엔드 빌드
cd apps/api
npm run build
npm start

# 프론트엔드 빌드
cd apps/web
npm run build
npm run preview
```

### 데이터베이스 관리

```bash
# 마이그레이션 생성
npx prisma migrate dev --name migration_name

# Prisma 클라이언트 재생성
npx prisma generate

# Prisma Studio (GUI)
npx prisma studio

# 관리자 계정 생성
npm run create-admin
```

## 환경 변수

### Backend (`apps/api/.env`)

```env
# 서버 설정
PORT=3000
NODE_ENV=development

# 데이터베이스
DATABASE_URL="postgresql://jacal:jacal123@localhost:5432/jacal?schema=public"

# JWT 인증
JWT_SECRET=your-super-secret-key-change-in-production

# OpenAI (선택적)
OPENAI_API_KEY=sk-...

# Google Calendar (선택적)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# SMTP (선택적 - 이메일 발송용)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 기능 로드맵

### ✅ 완료된 기능

- [x] 프로젝트 초기 설정
- [x] PostgreSQL + Prisma 설정
- [x] JWT 인증 및 권한 관리
- [x] 할일 CRUD
- [x] 이벤트 CRUD
- [x] 자연어 처리 (OpenAI/Ollama)
- [x] 리액트 UI 구현
- [x] 습관 추적 시스템
- [x] 팀 협업 기능
- [x] 캘린더 뷰 (월간/주간)
- [x] 생산성 분석 대시보드
- [x] 집중 타이머
- [x] 관리자 패널 (전체 관리)
- [x] 다국어 지원 (i18n)
- [x] 키보드 단축키
- [x] POP3 이메일 통합
- [x] 웹훅 시스템
- [x] 사용자 설정
- [x] Docker Compose 설정
- [x] 태그 시스템
- [x] 반복 일정 지원
- [x] 댓글 기능

### 🚧 진행 중 / 계획된 기능

- [ ] Google Calendar 양방향 동기화
- [ ] Outlook Calendar 연동
- [ ] CalDAV 지원
- [ ] 푸시 알림 (웹/모바일)
- [ ] 이메일 알림
- [ ] SMS 알림
- [ ] 스마트 스케줄링 알고리즘
- [ ] AI 기반 시간 추천
- [ ] 모바일 앱 (React Native)
- [ ] 파일 첨부 기능
- [ ] 팀 캘린더 통합 뷰
- [ ] 비디오 회의 통합 (Zoom, Meet)
- [ ] 고급 분석 및 리포트
- [ ] 공유 링크 생성
- [ ] 이메일 초대 시스템

## 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

MIT License

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.
