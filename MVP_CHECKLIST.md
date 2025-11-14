# MVP 개발 체크리스트

## 🎯 MVP 핵심 유저 여정

```
1. 회원가입/로그인
   ↓
2. 옷 사진 업로드
   ↓
3. Gemini가 자동 분석 + 배경 제거
   ↓
4. DB에 저장 (메타데이터 포함)
   ↓
5. 저장된 옷 목록 조회
   ↓
6. 스타일 추천 요청 (간단한 텍스트 필터링)
   ↓
7. 추천 코디 표시
```

---

## ✅ 완료된 작업

### 기술 스택 최적화
- [x] Redis 제거 (MVP에 불필요)
- [x] Helmet 제거 (간소화)
- [x] Zod 검증 제거 (기본 에러 처리만)
- [x] React Query 이미 제거됨
- [x] Zustand만 상태관리 유지

### 백엔드 구조
- [x] server.ts 간소화
- [x] 에러 미들웨어 생성
- [x] 인증 미들웨어 생성
- [x] 타입 정의 (types/index.ts)
- [x] Gemini 서비스 (gemini.service.ts)
- [x] 기본 라우트 구조

### 프론트엔드 구조
- [x] Zustand 스토어 (authStore, clothingStore)
- [x] API 클라이언트 (axios + 인터셉터)
- [x] 환경 변수 설정

### Supabase 준비
- [x] Supabase 마이그레이션 가이드 작성
- [x] 환경 변수 예제 생성

---

## 🔨 구현 필요 사항

### 1단계: 인증 (1-2시간)

**파일**: `backend/src/routes/auth.routes.ts`

```typescript
// POST /api/auth/register
// - 이메일, 비밀번호 받기
// - 비밀번호 해싱 (bcrypt)
// - DB에 저장
// - JWT 토큰 반환

// POST /api/auth/login
// - 이메일, 비밀번호 검증
// - JWT 토큰 반환
```

**프론트엔드**: `frontend/src/pages/LoginPage.tsx`
```tsx
// 로그인/회원가입 폼
// apiClient.login() 호출
// useAuthStore.login() 저장
```

---

### 2단계: 옷 업로드 + Gemini 분석 (2-3시간)

**파일**: `backend/src/routes/clothing.routes.ts`

```typescript
// POST /api/clothing/upload (multipart/form-data)
// - Multer로 이미지 파일 받기
// - Supabase Storage에 저장
// - Gemini 분석 (GeminiService.analyzeClothing)
// - 배경 제거 (GeminiService.removeBackground)
// - DB에 저장 (metadata 포함)
// - 저장된 clothing 반환

// GET /api/clothing
// - 현재 사용자의 옷 목록 반환

// DELETE /api/clothing/:id
// - 옷 삭제 + Supabase 파일 삭제
```

**프론트엔드**: `frontend/src/pages/UploadPage.tsx`
```tsx
// react-dropzone으로 이미지 드래그&드롭
// FormData 생성 + apiClient.uploadClothing() 호출
// 성공 후 clothingStore.addItem() 저장
// 로딩 상태 표시
```

---

### 3단계: 옷 목록 조회 (1시간)

**파일**: `backend/src/routes/clothing.routes.ts`

```typescript
// GET /api/clothing
// - authenticateToken 미들웨어
// - 현재 사용자의 옷 목록 반환
// - 메타데이터 포함
```

**프론트엔드**: `frontend/src/pages/ClothingListPage.tsx`
```tsx
// 마운트 시 apiClient.getClothing() 호출
// 썸네일 그리드 표시
// 삭제 버튼 포함
```

---

### 4단계: 스타일 추천 (2단계 필터링) (2-3시간)

**파일**: `backend/src/routes/recommendation.routes.ts`

```typescript
// POST /api/recommendations/style
// - occasion 파라미터 받기 (e.g., "casual", "work", "date")
// - DB에서 사용자의 모든 옷 조회
// - GeminiService.filterClothingForRecommendation()
//   → 1단계: 텍스트만으로 20-30개 필터링 ($0.001)
// - GeminiService.generateCombinations()
//   → 2단계: 선별된 옷으로 3개 코디 생성 ($0.039)
// - 조합 반환
```

**프론트엔드**: `frontend/src/pages/RecommendationPage.tsx`
```tsx
// occasion 선택 (casual, work, date, party 등)
// apiClient.getRecommendations(occasion) 호출
// 추천된 3개 조합 카드로 표시
// 각 조합: 색상 조화도, 스타일 통일성, 팁
```

---

### 5단계: UI 기본 구조 (3-4시간)

**파일 구조**:
```
frontend/src/
├── pages/
│   ├── LoginPage.tsx      (로그인/회원가입)
│   ├── UploadPage.tsx     (옷 업로드)
│   ├── ClothingListPage.tsx (옷 목록)
│   └── RecommendationPage.tsx (추천)
├── components/
│   ├── Header.tsx
│   ├── ProtectedRoute.tsx
│   └── LoadingSpinner.tsx
├── App.tsx                (라우터 설정)
└── main.tsx
```

---

## 🚀 구현 순서 (권장)

### Day 1-2: 기초 설정
1. Supabase 프로젝트 생성 + 환경 변수 설정
2. Prisma 마이그레이션 (DB 테이블 생성)
3. 인증 엔드포인트 구현

### Day 3-4: 핵심 기능
1. 옷 업로드 + Gemini 분석 구현
2. 옷 목록 조회
3. 간단한 프론트엔드 폼

### Day 5-6: 추천 시스템
1. 스타일 추천 엔드포인트
2. 프론트엔드 추천 페이지

### Day 7: 정리 + 테스트
1. 에러 처리 보완
2. 기본 테스트 실행
3. 배포 준비

---

## 📝 테스트 명령어

```bash
# 백엔드 서버 시작
cd backend
npm run dev

# 프론트엔드 개발 서버 시작
cd frontend
npm run dev

# 건강 체크
curl http://localhost:3001/api/health
```

---

## 🔍 현재 기술 스택 (최적화 완료)

| 영역 | 스택 | 이유 |
|------|------|------|
| 백엔드 | Express + TypeScript | 가볍고 빠름 |
| DB | Supabase + PostgreSQL | 관리 불필요, 자동 백업 |
| ORM | Prisma | 타입 안전성, 마이그레이션 자동화 |
| 파일 저장소 | Supabase Storage | 통합 관리 |
| AI | Gemini 2.5 Flash | 이미지 분석, 생성, 편집 모두 가능 |
| 상태관리 | Zustand | 간단하고 빠름 |
| 스타일 | Tailwind CSS | 유틸리티 CSS, 빠른 UI 개발 |
| 인증 | JWT + Bcrypt | 상태 비저장, 확장성 좋음 |

---

## ⚠️ 지연된 기능 (Phase 2+)

- [ ] Redis 캐싱
- [ ] 여러 각도 이미지
- [ ] 아바타 피팅
- [ ] 실시간 편집
- [ ] 사용자 피드백 학습
- [ ] 날씨 연동
- [ ] 3D 아바타

---

## 📊 예상 비용 (월)

**사용자 1명**:
- 옷 등록 3회: $0.12
- 스타일 추천 8회: $1.26
- 총: ~$1.50/월

**Supabase 무료 티어**: 충분함
- 데이터베이스: 500MB
- 스토리지: 1GB
- 함수: 50,000 호출

---

## 🎉 목표

**7일 이내 MVP 출시** ✨
- 회원가입/로그인 ✅
- 옷 업로드 + AI 분석 ✅
- 옷 목록 조회 ✅
- 기본 추천 시스템 ✅
