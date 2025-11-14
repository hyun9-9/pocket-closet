# Pocket Closet - 개발 환경 세팅 및 기술 스택 완벽 가이드

> **작성일**: 2024년 11월 14일
> **주제**: Pocket Closet 프로젝트의 개발 환경 설정 및 기술 스택 이해
> **난이도**: 초급 - 중급
> **소요 시간**: 약 30분

---

## 📌 개요

Pocket Closet은 **풀스택 웹 애플리케이션**입니다.

**핵심 기능:**
- 👔 사용자 옷장 관리
- 🤖 Google Gemini AI로 의류 자동 분석
- 👕 스타일 조합 추천
- 📸 이미지 업로드 및 처리

이 가이드에서는:
1. ✅ 현재 설정 상태 확인
2. ✅ 필요한 기술 스택 이해
3. ✅ 로컬 개발 환경 구축
4. ✅ 각 서비스 시작/중지 방법

---

## 🏛️ **전체 아키텍처**

### 시스템 구성도

```
┌─────────────────────────────────────────────────────┐
│                  사용자 브라우저                      │
│            (React 19 + Vite + Zustand)              │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓ HTTP/CORS
┌────────────────────────────────────────────────────┐
│              백엔드 API 서버                         │
│          (Express.js + TypeScript)                 │
│  http://localhost:3001/api/*                       │
├────────────────────────────────────────────────────┤
│  ├─ Routes (라우팅)                                │
│  ├─ Controllers (요청 처리)                        │
│  ├─ Services (비즈니스 로직)                       │
│  ├─ Middleware (인증, 에러)                        │
│  └─ Utils (헬퍼 함수)                              │
└────────┬────────────────────────┬──────────────────┘
         │                        │
         ↓                        ↓
┌─────────────────────┐  ┌──────────────────────┐
│  데이터베이스        │  │  외부 API & 서비스    │
│  PostgreSQL         │  │                      │
│  (Docker)           │  │ ├─ Google Gemini AI  │
│                     │  │ ├─ File Upload      │
│  - Users            │  │ └─ Image Processing │
│  - Clothing         │  │                      │
│  - Combinations     │  │ (Sharp, Multer)     │
│  - Metadata         │  │                      │
└─────────────────────┘  └──────────────────────┘
```

---

## 🛠️ **기술 스택 상세 분석**

### 1️⃣ **백엔드 기술 스택**

#### Framework & Runtime

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|---------|
| **Node.js** | 18+ | JavaScript 런타임 | 가볍고 빠른 I/O |
| **Express.js** | 5.1.0 | HTTP 서버 프레임워크 | 간단하고 확장성 좋음 |
| **TypeScript** | 5.9.3 | 정적 타입 언어 | 개발 중 버그 방지 |

```typescript
// Express 서버 예시
import express from 'express';

const app = express();

// 라우트 정의
app.post('/api/auth/register', (req, res) => {
  // 처리 로직
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

#### 데이터베이스 및 ORM

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|---------|
| **PostgreSQL** | 16 | 관계형 데이터베이스 | 신뢰성, 확장성 |
| **Docker** | 28+ | 데이터베이스 컨테이너화 | 일관된 개발 환경 |
| **Prisma** | 6.19.0 | ORM (객체 관계 매핑) | 타입 안전, 자동 마이그레이션 |

```typescript
// Prisma 사용 예시
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' }
});

const newUser = await prisma.user.create({
  data: {
    email: 'new@example.com',
    password: 'hashed_password',
    name: 'New User'
  }
});
```

#### 인증 및 보안

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|---------|
| **JWT (jsonwebtoken)** | 9.0.2 | 토큰 기반 인증 | 상태 비저장, 확장성 |
| **Bcrypt** | 6.0.0 | 비밀번호 암호화 | 안전한 해싱 알고리즘 |

```typescript
// 회원가입: 비밀번호 암호화
const hashedPassword = await bcrypt.hash(password, 10);

// 로그인: 비밀번호 검증
const isValid = await bcrypt.compare(inputPassword, hashedPassword);

// JWT 토큰 생성
const token = jwt.sign(
  { id: userId, email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

#### 파일 처리 및 이미지 분석

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|---------|
| **Multer** | 2.0.2 | 파일 업로드 처리 | Express 미들웨어 표준 |
| **Sharp** | 0.34.5 | 이미지 처리 (리사이징, 포맷) | 빠르고 강력한 이미지 처리 |
| **Google Generative AI** | 0.24.1 | Gemini AI 통합 | 이미지 분석, 코드 생성 |

```typescript
// Multer: 파일 업로드
import multer from 'multer';

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.post('/api/clothing/upload', upload.single('image'), handler);

// Sharp: 이미지 처리
import sharp from 'sharp';

const processedImage = await sharp(buffer)
  .resize(1024, 1024, { fit: 'inside' })
  .jpeg({ quality: 80 })
  .toBuffer();

// Google Gemini: AI 분석
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const result = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  .generateContent(prompt);
```

#### 개발 도구

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|---------|
| **Nodemon** | 3.1.11 | 파일 변경 시 자동 재시작 | 개발 생산성 향상 |
| **ts-node** | 10.9.2 | TypeScript 직접 실행 | 컴파일 과정 생략 |
| **Morgan** | 1.10.1 | HTTP 요청 로깅 | 디버깅 용이 |
| **CORS** | 2.8.5 | 크로스 도메인 요청 | 프론트엔드 <-> 백엔드 통신 |

```typescript
// Morgan 로깅
import morgan from 'morgan';

app.use(morgan('dev'));
// GET /api/auth/login 200 45.123 ms - 1234

// CORS 설정
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### 2️⃣ **프론트엔드 기술 스택**

#### Framework & Build Tool

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|---------|
| **React** | 19 | UI 라이브러리 | 컴포넌트 기반, 풍부한 생태계 |
| **TypeScript** | 5.9.3 | 정적 타입 언어 | 개발 중 버그 방지 |
| **Vite** | 5+ | 빌드 도구 | 번개 같은 개발 서버 (HMR) |

```typescript
// React 컴포넌트 예시
import { useState } from 'react';

export function LoginPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}
```

#### 상태 관리

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|---------|
| **Zustand** | - | 전역 상태 관리 | 간단하고 가벼움 |

```typescript
// Zustand 스토어 예시
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  login: async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const { token, user } = await response.json();
    set({ token, user });
    localStorage.setItem('token', token);
  }
}));

// 컴포넌트에서 사용
export function MyComponent() {
  const { user, login } = useAuthStore();
  return <div>{user?.email}</div>;
}
```

#### HTTP 클라이언트

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|---------|
| **Axios** | - | HTTP 요청 라이브러리 | 인터셉터 지원, Promise 기반 |

```typescript
// Axios 인스턴스 설정
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api'
});

// 인터셉터: 모든 요청에 토큰 추가
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 사용
const response = await apiClient.post('/auth/login', {
  email, password
});
```

#### 스타일링

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|---------|
| **Tailwind CSS** | - | 유틸리티 CSS 프레임워크 | 빠른 UI 개발 |
| **PostCSS** | - | CSS 후처리기 | 브라우저 호환성 |

```html
<!-- Tailwind 클래스 예시 -->
<div class="flex items-center justify-between p-4 bg-blue-500 rounded-lg">
  <h1 class="text-2xl font-bold text-white">Pocket Closet</h1>
  <button class="bg-white text-blue-500 px-4 py-2 rounded hover:bg-gray-100">
    Login
  </button>
</div>
```

---

## 🔧 **로컬 개발 환경 설정**

### 1️⃣ **사전 요구사항**

```
✅ Windows 10/11 (또는 macOS, Linux)
✅ Node.js 18+ (LTS)
✅ npm 9+ (Node.js와 함께 설치됨)
✅ Git
✅ Docker Desktop (PostgreSQL 실행용)
✅ 텍스트 에디터 (VS Code 권장)
```

### 2️⃣ **Node.js 설치 확인**

PowerShell에서:

```powershell
node --version      # v18.0.0 이상
npm --version       # 9.0.0 이상
npx --version       # npm과 함께 자동 설치됨
```

### 3️⃣ **프로젝트 클론 및 설정**

```powershell
# 1. 프로젝트 디렉토리로 이동
cd C:\Users\{username}\pocket-closet

# 2. 백엔드 의존성 설치
cd backend
npm install

# 3. 프론트엔드 의존성 설치
cd ../frontend
npm install

# 4. 루트로 돌아가기
cd ..
```

### 4️⃣ **환경 변수 설정**

#### 백엔드 (.env 파일)

`backend/.env` 생성:

```env
# Database (Docker PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pocket_closet?schema=public"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR="./uploads"

# Server
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

#### 프론트엔드 (.env.local 파일)

`frontend/.env.local` 생성:

```env
VITE_API_URL="http://localhost:3001/api"
```

### 5️⃣ **Google Gemini API 키 얻기**

```
1. https://ai.google.dev/ 방문
2. "Get API Key" 클릭
3. 새 프로젝트 생성
4. API 키 복사
5. backend/.env에 설정:
   GEMINI_API_KEY="your-key-here"
```

---

## 🚀 **로컬 서비스 시작**

### 1️⃣ **PostgreSQL 시작 (Docker)**

PowerShell:

```powershell
cd C:\Users\bss\pocket-closet

# Docker Compose로 PostgreSQL 실행
docker-compose up -d

# 확인
docker ps
# CONTAINER ID   IMAGE              STATUS
# abc123         postgres:16        Up 2 seconds
```

### 2️⃣ **데이터베이스 마이그레이션**

PowerShell:

```powershell
cd backend

# Prisma 클라이언트 생성
npx prisma generate

# 마이그레이션 실행
npx prisma migrate dev

# 샘플 데이터 시딩 (선택사항)
npm run prisma:seed
```

### 3️⃣ **백엔드 서버 시작**

PowerShell (터미널 1):

```powershell
cd backend
npm run dev

# 출력:
# ✅ Database connected
# 🚀 Server running on http://localhost:3001
```

### 4️⃣ **프론트엔드 서버 시작**

PowerShell (터미널 2):

```powershell
cd frontend
npm run dev

# 출력:
# VITE v5.0.0 ready in 234 ms
# ➜  Local:   http://localhost:5173/
# ➜  Press h to show help
```

### 5️⃣ **브라우저에서 확인**

```
브라우저: http://localhost:5173
백엔드 헬스 체크: http://localhost:3001/api/health
```

---

## 📊 **개발 환경 구성도**

```
┌──────────────────────────────────────────────────────┐
│                  개발 환경 구성                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Terminal 1              Terminal 2      Terminal 3  │
│  ┌─────────────┐      ┌─────────────┐  ┌──────────┐ │
│  │  Backend    │      │  Frontend   │  │ Database │ │
│  │             │      │             │  │          │ │
│  │ npm run dev │      │ npm run dev │  │ docker   │ │
│  │             │      │             │  │ compose  │ │
│  │ :3001       │      │ :5173       │  │ :5432    │ │
│  └─────────────┘      └─────────────┘  └──────────┘ │
│        ↑                    ↑                 ↑       │
│        │                    │                 │       │
│        └────────┬───────────┘                 │       │
│                 │ API Call                    │       │
│                 │ http://localhost:3001/api   │       │
│                 │                             │       │
│                 └─────────────┬────────────────┘       │
│                               │ Prisma ORM            │
│                               │ SQL Query             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🧪 **개발 중 자주 사용하는 명령어**

### 백엔드

```bash
# 개발 서버 시작
npm run dev

# 타입스크립트 컴파일
npm run build

# 프로덕션 빌드 실행
npm start

# Prisma 클라이언트 재생성
npm run prisma:generate

# 마이그레이션 실행
npm run prisma:migrate

# Prisma Studio (UI로 DB 확인)
npm run prisma:studio

# 데이터베이스 리셋 (⚠️ 모든 데이터 삭제!)
npm run prisma:reset

# 샘플 데이터 입력
npm run prisma:seed
```

### 프론트엔드

```bash
# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# Linting 체크
npm run lint

# Linting 자동 수정
npm run lint:fix
```

### Docker

```bash
# PostgreSQL 시작
docker-compose up -d

# PostgreSQL 중지
docker-compose down

# 컨테이너 상태 확인
docker ps

# PostgreSQL 로그 보기
docker logs pocket-closet-db

# PostgreSQL 접속
docker exec -it pocket-closet-db psql -U postgres -d pocket_closet
```

---

## 🔍 **트러블슈팅**

### 문제 1: "Cannot find module '@prisma/client'"

**원인**: Prisma 클라이언트가 생성되지 않음

**해결**:
```bash
npm install
npx prisma generate
npm run dev
```

### 문제 2: "PostgreSQL 연결 실패"

**원인**: Docker 컨테이너가 실행 중이 아님

**해결**:
```bash
docker-compose up -d
docker ps  # 확인
```

### 문제 3: "포트 3001/5173이 이미 사용 중"

**원인**: 다른 프로세스가 포트 사용

**해결**:
```bash
# Windows에서 포트 사용 프로세스 찾기
netstat -ano | findstr :3001

# 프로세스 종료 (PID 대신 실제 번호)
taskkill /PID {PID} /F
```

### 문제 4: "VITE_API_URL이 정의되지 않았습니다"

**원인**: `.env.local` 파일이 없거나 프론트엔드 재시작 필요

**해결**:
```bash
# 1. frontend/.env.local 확인
# 2. 프론트엔드 서버 재시작
# Ctrl+C로 중지 후 npm run dev 실행
```

---

## 💡 **개발 Workflow**

```
1️⃣ 작업 시작
   └─ docker-compose up -d (PostgreSQL 시작)
   └─ cd backend && npm run dev (백엔드 시작)
   └─ cd frontend && npm run dev (프론트엔드 시작)

2️⃣ 개발
   └─ 코드 수정 (Nodemon이 자동 재로드)
   └─ 브라우저에서 http://localhost:5173 확인

3️⃣ 데이터베이스 변경 시
   └─ schema.prisma 수정
   └─ npx prisma migrate dev --name {description}

4️⃣ 작업 완료
   └─ Ctrl+C로 서버 중지
   └─ docker-compose down (PostgreSQL 중지)
```

---

## 📚 **관련 가이드**

1. **Phase 1**: `BLOG_PHASE1_SETUP.md` - Docker & PostgreSQL 설정
2. **Phase 2 [2-1]**: `BLOG_PHASE2_AUTH_API.md` - 인증 API 구현
3. **이 가이드**: 개발 환경 및 기술 스택

---

## 🎓 **기술 스택 선택 이유**

### "왜 이 기술들을 선택했나?"

| 기술 | 대안 | 선택 이유 |
|------|------|---------|
| Express | Django, FastAPI | 가볍고 빠르며 Node.js 생태계 |
| PostgreSQL | MySQL, MongoDB | 관계형 데이터베이스의 신뢰성 |
| Prisma | TypeORM, Sequelize | 타입 안전성과 자동 마이그레이션 |
| React | Vue, Angular | 가장 큰 커뮤니티와 풍부한 라이브러리 |
| Zustand | Redux, Context API | 간단하고 보일러플레이트 적음 |
| Tailwind | Bootstrap, Material UI | 유틸리티 CSS로 빠른 개발 |
| JWT | Session-based auth | 상태 비저장, 확장성 좋음 |

---

## ✅ **설정 완료 체크리스트**

- [ ] Node.js 18+ 설치
- [ ] 프로젝트 클론
- [ ] `npm install` 완료 (백엔드, 프론트엔드)
- [ ] `.env` 파일 생성 (백엔드)
- [ ] `.env.local` 파일 생성 (프론트엔드)
- [ ] Google Gemini API 키 설정
- [ ] Docker Compose로 PostgreSQL 시작
- [ ] Prisma 마이그레이션 실행
- [ ] `npm run dev` 백엔드 & 프론트엔드 시작
- [ ] http://localhost:5173 접속 확인

---

## 🚀 **다음 단계**

```
✅ 개발 환경 설정 완료
   ↓
📝 Phase 2 [2-2]: Clothing Upload & AI Analysis
   └─ 이미지 업로드 처리 (Multer)
   └─ 이미지 처리 (Sharp)
   └─ Google Gemini AI로 의류 분석
   └─ 메타데이터 추출 및 저장
```

---

**작성자**: Pocket Closet Dev Team
**마지막 업데이트**: 2024년 11월 14일
**난이도**: 초급 - 중급
