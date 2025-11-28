# Jacal - README

## 프로젝트 개요

**Jacal**은 일정, 할일, 캘린더, 습관, 집중 타이머, 협업을 하나로 합친 통합 생산성 플랫폼입니다.

### 핵심 기능

- 🗣️ **자연어 입력**: 한 줄로 일정/할일 자동 분류
- 🤖 **AI 파싱**: OpenAI를 활용한 스마트 파싱
- 📅 **이벤트 관리**: 시작/종료 시간, 위치 포함
- ✅ **할일 관리**: 우선순위, 예상 소요 시간, 상태 관리
- 🔐 **인증**: JWT 기반 안전한 인증 시스템

## 기술 스택

### Backend

- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- OpenAI API (자연어 처리)
- JWT (인증)
- bcrypt (암호화)

### Frontend

- React + TypeScript + Vite
- TanStack Query (상태 관리)
- Axios (API 통신)
- Modern CSS (변수 기반 디자인 시스템)

## 시작하기

### Prerequisites

- Node.js v18+
- PostgreSQL
- OpenAI API Key

### 설치

1. 레포지토리 클론

```bash
git clone <repo-url>
cd jacal
```

2. 의존성 설치

```bash
npm install
```

3. PostgreSQL 데이터베이스 생성

```sql
CREATE DATABASE jacal;
```

4. 백엔드 환경 변수 설정 (`apps/api/.env`)

```env
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/jacal?schema=public"
JWT_SECRET=your-secret-key-change-in-production
OPENAI_API_KEY=your-openai-api-key-here
```

5. Prisma 마이그레이션 실행

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
```

6. 백엔드 서버 실행

```bash
cd apps/api
npm run dev
```

7. 프론트엔드 서버 실행 (새 터미널)

```bash
cd apps/web
npm run dev
```

## 사용 예시

### 자연어 입력 예시

- "내일 오전 9시 미팅 1시간, 준비 30분 포함"
- "이번 주 금요일까지 보고서 작성"
- "매주 월요일 오전 10시 팀 회의"

### API 엔드포인트

**인증**

- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

**할일**

- `GET /api/tasks` - 할일 목록
- `POST /api/tasks` - 할일 생성
- `PUT /api/tasks/:id` - 할일 수정
- `DELETE /api/tasks/:id` - 할일 삭제

**이벤트**

- `GET /api/events` - 이벤트 목록
- `POST /api/events` - 이벤트 생성
- `PUT /api/events/:id` - 이벤트 수정
- `DELETE /api/events/:id` - 이벤트 삭제

**자연어 처리**

- `POST /api/nlu/parse` - 자연어 파싱 및 자동 생성

## 프로젝트 구조

```
jacal/
├── apps/
│   ├── api/          # 백엔드 (Express + Prisma)
│   │   ├── src/
│   │   │   ├── routes/      # API 라우트
│   │   │   ├── services/    # 비즈니스 로직
│   │   │   ├── middleware/  # 미들웨어
│   │   │   └── lib/         # 유틸리티
│   │   └── prisma/          # DB 스키마
│   └── web/          # 프론트엔드 (React + Vite)
│       └── src/
│           ├── lib/         # API 클라이언트
│           └── App.tsx      # 메인 컴포넌트
└── package.json
```

## 로드맵

### ✅ MVP (완료)

- [x] 프로젝트 구조 초기화
- [x] PostgreSQL + Prisma 설정
- [x] JWT 인증 시스템
- [x] 할일/이벤트 CRUD
- [x] 자연어 처리 (OpenAI)
- [x] 리액트 UI

### 🚧 다음 단계

- [ ] Google Calendar 연동
- [ ] 스마트 스케줄링 알고리즘
- [ ] 푸시 알림
- [ ] 반복 일정/습관
- [ ] 생산성 대시보드
- [ ] 협업 기능

## License

MIT
