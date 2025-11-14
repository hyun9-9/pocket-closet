# Pocket Closet - MVP 개발 가이드

> AI 기반 개인 옷장 관리 웹앱 (단일 사용자 MVP)

## 🎯 프로젝트 개요

**Pocket Closet**은 Gemini 2.5 Flash Image를 활용한 AI 스타일링 앱입니다.

### MVP 핵심 기능
- 📸 **옷 사진 업로드** → AI 자동 분석
- 🤖 **Gemini가 옷 속성 추출** (색상, 패턴, 재질, 스타일 등)
- 👔 **스타일 추천** (텍스트 기반 필터링)
- 💾 **옷장 관리** (저장, 조회, 삭제)

---

## 📋 기술 스택 (최적화 완료)

### 백엔드
```
Express.js + TypeScript
├─ Prisma ORM (PostgreSQL)
├─ Multer (파일 업로드)
├─ Sharp (이미지 처리)
├─ Google Generative AI (Gemini)
└─ JWT 인증 (Bcrypt)
```

### 프론트엔드
```
React 19 + TypeScript + Vite
├─ Zustand (상태관리)
├─ Tailwind CSS (스타일)
├─ Axios (API 클라이언트)
└─ React Router (네비게이션)
```

### 인프라
```
Supabase (PostgreSQL + Storage)
├─ 자동 DB 관리
├─ 파일 스토리지 (1GB 무료)
└─ 자동 백업
```

### 제거된 것 (MVP에 불필요)
- ❌ Redis (캐싱 - Phase 2)
- ❌ React Query (Zustand으로 충분)
- ❌ Helmet (보안 헤더 - 나중에)
- ❌ Zod (검증 - 기본만 사용)

---

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 1-1. 백엔드 환경 변수
cd backend
cp .env.example .env
# .env 파일 편집:
# - DATABASE_URL (Supabase)
# - GOOGLE_AI_API_KEY (Gemini)
# - JWT_SECRET (자신의 비밀키)

# 1-2. 프론트엔드 환경 변수
cd ../frontend
cp .env.example .env.local
# VITE_API_URL은 기본값 유지
```

### 2. 의존성 설치

```bash
# 백엔드
cd backend
npm install

# 프론트엔드
cd frontend
npm install
```

### 3. 데이터베이스 설정

```bash
cd backend

# Prisma 마이그레이션 (Supabase PostgreSQL에 테이블 생성)
npx prisma migrate dev --name init

# (선택) Prisma Studio로 확인
npx prisma studio
```

### 4. 개발 서버 실행

```bash
# 터미널 1: 백엔드
cd backend
npm run dev
# http://localhost:3001/api/health 확인

# 터미널 2: 프론트엔드
cd frontend
npm run dev
# http://localhost:5173 방문
```

---

## 📁 폴더 구조

```
pocket-closet/
├── backend/
│   ├── src/
│   │   ├── server.ts              (Express 앱 진입점)
│   │   ├── config/
│   │   │   └── database.ts        (Prisma 설정)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts (JWT 인증)
│   │   │   └── error.middleware.ts (에러 처리)
│   │   ├── routes/
│   │   │   └── index.ts           (라우트 정의)
│   │   ├── services/
│   │   │   ├── gemini.service.ts  (AI 분석)
│   │   │   └── storage.service.ts (Supabase 파일)
│   │   └── types/
│   │       └── index.ts           (TypeScript 타입)
│   ├── prisma/
│   │   ├── schema.prisma          (DB 스키마)
│   │   └── migrations/            (마이그레이션)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/                 (페이지 컴포넌트)
│   │   ├── components/            (UI 컴포넌트)
│   │   ├── store/                 (Zustand 스토어)
│   │   ├── services/
│   │   │   └── api.ts             (API 클라이언트)
│   │   ├── App.tsx                (라우터)
│   │   └── main.tsx               (진입점)
│   └── package.json
│
├── CLAUDE.md                       (프로젝트 문서)
├── SUPABASE_SETUP.md              (Supabase 가이드)
├── MVP_CHECKLIST.md               (구현 체크리스트)
└── README_MVP.md                  (이 파일)
```

---

## 🔌 API 엔드포인트

### 인증
```
POST /api/auth/register
POST /api/auth/login
```

### 옷
```
POST /api/clothing/upload        (multipart/form-data)
GET /api/clothing                (인증 필요)
GET /api/clothing/:id
DELETE /api/clothing/:id
```

### 추천
```
POST /api/recommendations/style  (occasion 파라미터)
```

---

## 🛠️ 개발 명령어

### 백엔드

```bash
cd backend

# 개발 (nodemon 자동 재시작)
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start

# Prisma
npm run prisma:generate   # 클라이언트 재생성
npm run prisma:migrate    # 마이그레이션 실행
npm run prisma:studio     # UI 데이터베이스 브라우저
```

### 프론트엔드

```bash
cd frontend

# 개발 (Vite HMR)
npm run dev

# 빌드 (타입 체크 + 번들링)
npm run build

# 프로덕션 빌드 미리보기
npm run preview

# 린팅
npm run lint
npm run lint:fix
```

---

## 🤖 Gemini AI 활용

### 1단계: 옷 이미지 분석
```typescript
GeminiService.analyzeClothing(imageBase64)
// → 색상, 패턴, 재질, 스타일, 조합 규칙 추출
// 비용: $0.039 (1회)
```

### 2단계: 배경 제거
```typescript
GeminiService.removeBackground(imageBase64)
// → 투명 PNG로 변환
// 비용: 포함됨 (위의 분석 비용)
```

### 3단계: 스타일 추천 (텍스트 필터링)
```typescript
GeminiService.filterClothingForRecommendation(clothingData, occasion)
// → 텍스트만으로 20-30개 필터링
// 비용: $0.001
```

### 4단계: 코디 생성
```typescript
GeminiService.generateCombinations(selectedClothing, occasion)
// → 3개 최적 코디 조합 생성
// 비용: $0.039
```

---

## 📊 월간 비용 예상 (사용자 1명)

| 항목 | 횟수/월 | 단가 | 합계 |
|------|---------|------|------|
| 옷 등록 | 3회 | $0.039 | $0.12 |
| 스타일 추천 | 8회 | $0.157 | $1.26 |
| **합계** | - | - | **$1.38** |

**Supabase**: 무료 (500MB DB, 1GB 스토리지)

---

## 🔐 환경 변수 설정

### backend/.env

```env
# Supabase (필수)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"
SUPABASE_BUCKET_NAME="clothing-images"

# Gemini (필수)
GOOGLE_AI_API_KEY="your-api-key"

# JWT (필수)
JWT_SECRET="change-me-in-production"

# 설정
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

### frontend/.env.local

```env
VITE_API_URL="http://localhost:3001/api"
```

---

## 📝 개발 체크리스트

### Phase 1: MVP (7-10일)

- [ ] Supabase 프로젝트 생성 + DB 마이그레이션
- [ ] 인증 엔드포인트 (회원가입, 로그인)
- [ ] 옷 업로드 + Gemini 분석 엔드포인트
- [ ] 옷 목록 조회 / 삭제 엔드포인트
- [ ] 기본 추천 엔드포인트 (텍스트 필터링)
- [ ] 프론트엔드 5개 페이지
  - 로그인/회원가입
  - 옷 업로드
  - 옷 목록
  - 추천
  - 프로필 (선택)

### Phase 2: 고도화 (2-3주)

- [ ] 이미지 기반 정밀 추천
- [ ] 아바타 피팅
- [ ] 여러 각도 사진
- [ ] Redis 캐싱
- [ ] 사용자 피드백 시스템

### Phase 3: 확장 (나중)

- [ ] 3D 아바타 (Three.js)
- [ ] 소셜 기능
- [ ] 모바일 앱
- [ ] 쇼핑몰 연동

---

## 🐛 트러블슈팅

### 데이터베이스 연결 오류

```bash
# 1. .env 파일 확인
cat .env | grep DATABASE_URL

# 2. 연결 테스트
npx prisma db execute --stdin
SELECT 1;

# 3. 마이그레이션 재시도
npx prisma migrate resolve
npx prisma migrate dev --name init
```

### Gemini API 오류

```
Error: "Invalid API Key"
→ .env의 GOOGLE_AI_API_KEY 확인

Error: "Rate limit exceeded"
→ MVP에서는 거의 발생하지 않음. Phase 2에서 캐싱 추가
```

### 파일 업로드 실패

```
Error: "Storage bucket not found"
→ Supabase 대시보드의 Storage에서 "clothing-images" 버킷 확인

Error: "Permission denied"
→ Storage → Policies에서 권한 확인
```

---

## 📚 추가 문서

- **[CLAUDE.md](./CLAUDE.md)** - 프로젝트 전체 개요
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Supabase 상세 가이드
- **[MVP_CHECKLIST.md](./MVP_CHECKLIST.md)** - 구현 항목별 체크리스트

---

## 🎯 핵심 가치 제안

1. **간단함**: 프로젝트 복잡도를 MVP에 맞게 최소화
2. **빠름**: 1인 개발자가 7-10일 내 출시 가능
3. **비용 효율**: 월 $2 미만의 AI 비용
4. **확장성**: Phase 2, 3으로 점진적 확장 가능
5. **학습 가치**: 모던 웹 스택 학습 가능

---

## 💡 팁

### 로컬 테스트
```bash
# 헬스 체크
curl http://localhost:3001/api/health

# 사용자 등록 (예시)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 프론트엔드 API 테스트
```typescript
// console에서
import { apiClient } from './services/api'
apiClient.getClothing().then(console.log)
```

### 프로덕션 체크리스트
- [ ] JWT_SECRET 변경
- [ ] DATABASE_URL Supabase로 설정
- [ ] CORS origin 설정
- [ ] 환경 변수 .env 파일 제외 (git ignore)
- [ ] Supabase Storage 권한 검토

---

## 🤝 피드백

이슈나 개선 사항은 언제든 PR을 열어주세요!

---

**Happy coding! 🚀**

> Pocket Closet MVP - AI로 시작하는 개인 스타일링 혁명
