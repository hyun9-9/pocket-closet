# Phase 2 [2-3] Wardrobe Management CRUD

> 의류 관리 시스템의 완전한 CRUD(Create, Read, Update, Delete) 기능 구현

## 📚 목차
1. [개요](#개요)
2. [기능 설명](#기능-설명)
3. [API 엔드포인트](#api-엔드포인트)
4. [코드 아키텍처](#코드-아키텍처)
5. [테스트 가이드](#테스트-가이드)
6. [에러 처리](#에러-처리)
7. [학습 포인트](#학습-포인트)

---

## 개요

Phase 2 [2-3]에서는 Phase 2 [2-2]에서 구현한 의류 업로드 기능을 기반으로, **완전한 의류 관리 시스템**을 만듭니다. 사용자가 자신의 옷 정보를 조회, 수정, 삭제할 수 있는 CRUD 기능을 제공합니다.

### 🎯 주요 목표
- **Create (생성)**: 의류 이미지 업로드 및 AI 분석 ✅ (Phase 2-2에서 완료)
- **Read (읽기)**: 전체 목록 조회, 개별 상세 조회
- **Update (수정)**: 의류 정보 부분 수정 (PATCH)
- **Delete (삭제)**: 의류 항목 삭제

### 📊 기술 스택
- **Backend**: Express.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **인증**: JWT 토큰 기반 사용자 인증
- **에러 처리**: CustomError 클래스

---

## 기능 설명

### 1️⃣ CREATE - 의류 업로드 (Phase 2-2)

**이미지 업로드 → 이미지 처리 → AI 분석 → 데이터베이스 저장**

```
사용자 이미지 업로드
        ↓
    [Multer] 파일 수신 (메모리 저장)
        ↓
    [Sharp] 이미지 최적화 (리사이징, 압축)
        ↓
    [Base64] 인코딩
        ↓
    [Google Gemini AI] 분석 (색상, 패턴, 재질 등)
        ↓
    [Prisma] PostgreSQL에 저장
        ↓
    응답 반환
```

**특징**:
- 최대 10MB 파일 크기 제한
- JPEG, PNG, WebP 형식 지원
- 자동으로 메타데이터 추출 (색상, 패턴, 재질, 스타일 등)
- 원본 이미지 Base64로 저장

### 2️⃣ READ - 의류 목록 조회

#### 2-1. 전체 목록 조회 (`GET /api/clothing`)

사용자의 모든 의류 항목을 최신순으로 조회합니다.

**반환 필드**:
```json
{
  "id": "UUID",
  "name": "의류 이름",
  "brand": "브랜드명",
  "primaryColor": "주색상",
  "pattern": "패턴",
  "material": "재질",
  "style": ["스타일 배열"],
  "season": ["시즌 배열"],
  "occasion": ["용도 배열"],
  "originalImage": "이미지 (Base64)",
  "createdAt": "생성일"
}
```

**사용 사례**:
- 사용자 워드로브 전체 보기
- 의류 카드 목록 표시
- 의류 선택 화면

#### 2-2. 상세 정보 조회 (`GET /api/clothing/:id`)

특정 의류의 모든 정보를 상세히 조회합니다.

**반환 필드** (전체 필드):
```json
{
  "id": "UUID",
  "userId": "사용자ID",
  "categoryId": "카테고리ID",
  "name": "의류 이름",
  "brand": "브랜드명",
  "purchaseDate": "구매일",
  "purchasePrice": "구매가격",
  "purchaseUrl": "구매처URL",
  "originalImage": "원본 이미지",
  "processedImage": "배경제거 이미지",
  "primaryColor": "주색상",
  "secondaryColor": "보조색상",
  "colorHex": "HEX코드",
  "pattern": "패턴",
  "texture": "텍스처",
  "material": "재질",
  "formality": "격식도(1-10)",
  "style": ["스타일"],
  "mood": ["무드"],
  "season": ["시즌"],
  "occasion": ["용도"],
  "matchingRules": "조합규칙(JSON)",
  "measurements": "치수정보(JSON)",
  "wearCount": "착용횟수",
  "lastWornDate": "마지막착용일",
  "rating": "사용자평점",
  "tags": ["사용자태그"],
  "createdAt": "생성일",
  "updatedAt": "수정일"
}
```

**사용 사례**:
- 의류 상세 페이지 표시
- 의류 수정 폼에 데이터 미리 채우기
- 추천 알고리즘에 필요한 데이터 조회

### 3️⃣ UPDATE - 의류 정보 수정 (`PATCH /api/clothing/:id`)

**특징**:
- **부분 수정 (Partial Update)**: 필요한 필드만 수정 가능
- **필드 검증**: 허용된 필드만 업데이트 (보안)
- **소유자 검증**: 자신의 옷만 수정 가능
- **자동 타임스탬프**: `updatedAt` 자동 갱신

**수정 가능한 필드**:
```json
{
  "name": "새로운 이름",
  "brand": "브랜드",
  "purchaseDate": "2024-01-15",
  "purchasePrice": 50000,
  "purchaseUrl": "https://...",
  "primaryColor": "색상명",
  "secondaryColor": "보조색상",
  "colorHex": "#RRGGBB",
  "pattern": "무지|스트라이프|체크|...",
  "texture": "부드러움|거침|광택",
  "silhouette": "슬림핏|레귤러핏|...",
  "details": ["후드", "지퍼", "포켓"],
  "material": "코튼|폴리에스터|...",
  "materialWeight": "두꺼움|보통|얇음",
  "stretch": "신축성 높음|보통|없음",
  "transparency": "불투명|약간 비침|...",
  "formality": 3,
  "style": ["캐주얼", "미니멀"],
  "mood": ["편안한", "세련된"],
  "season": ["봄", "여름"],
  "occasion": ["일상", "출근"],
  "wearCount": 5,
  "lastWornDate": "2024-11-14",
  "rating": 4.5,
  "tags": ["즐겨찾기", "봄옷"]
}
```

**업데이트 로직**:
```typescript
// 1. 의류 존재 여부 확인
// 2. 소유자 검증 (userId 일치)
// 3. 허용된 필드만 필터링
// 4. 데이터베이스 업데이트
// 5. 수정된 정보 반환
```

**사용 사례**:
- 의류 정보 수정 폼 제출
- 착용 횟수 증가
- 마지막 착용일 업데이트
- 사용자 평점 추가
- 태그 추가/수정

### 4️⃣ DELETE - 의류 삭제 (`DELETE /api/clothing/:id`)

**특징**:
- **소유자 검증**: 자신의 옷만 삭제 가능
- **영구 삭제**: 데이터베이스에서 완전히 제거
- **캐스케이드 삭제**: 관련 데이터도 자동 삭제

**삭제되는 데이터**:
- MyClothing 레코드
- 관련된 CombinationItem 레코드 (옷이 포함된 조합)
- 관련된 ClothingPair 레코드 (짝지어진 옷)

**사용 사례**:
- 워드로브에서 옷 제거
- 버린 옷 제거
- 데이터 정리

---

## API 엔드포인트

### 전체 API 요약

| HTTP | 엔드포인트 | 설명 | 인증 | 요청본문 |
|------|----------|------|------|---------|
| POST | `/api/clothing/upload` | 의류 업로드 | ✅ | FormData (이미지 포함) |
| GET | `/api/clothing` | 목록 조회 | ✅ | 없음 |
| GET | `/api/clothing/:id` | 상세 조회 | ✅ | 없음 |
| PATCH | `/api/clothing/:id` | 정보 수정 | ✅ | JSON |
| DELETE | `/api/clothing/:id` | 삭제 | ✅ | 없음 |

### 상세 API 명세

#### 1. POST /api/clothing/upload - 의류 업로드

```bash
curl -X POST http://localhost:3001/api/clothing/upload \
  -H "Authorization: Bearer {token}" \
  -F "image=@shirt.jpg" \
  -F "name=검정 후드티" \
  -F "brand=Nike" \
  -F "categoryId=cat-123"
```

**요청**:
- **Headers**: `Authorization: Bearer {JWT_TOKEN}`
- **Body** (multipart/form-data):
  - `image` (File, 필수): 의류 이미지
  - `name` (String, 필수): 의류 이름
  - `brand` (String, 선택): 브랜드명
  - `categoryId` (String, 필수): 카테고리 ID

**응답** (201 Created):
```json
{
  "success": true,
  "message": "의류 업로드 및 분석 완료",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "검정 후드티",
    "primaryColor": "검정",
    "metadata": {
      "pattern": "무지",
      "material": "코튼",
      "style": ["캐주얼"],
      "season": ["봄", "가을", "겨울"],
      "occasion": ["일상", "출근"]
    }
  }
}
```

---

#### 2. GET /api/clothing - 의류 목록 조회

```bash
curl -X GET http://localhost:3001/api/clothing \
  -H "Authorization: Bearer {token}"
```

**요청**:
- **Headers**: `Authorization: Bearer {JWT_TOKEN}`
- **Query Parameters**: 없음

**응답** (200 OK):
```json
{
  "success": true,
  "message": "의류 목록 조회 성공",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "검정 후드티",
      "brand": "Nike",
      "primaryColor": "검정",
      "pattern": "무지",
      "material": "코튼",
      "style": ["캐주얼"],
      "season": ["봄", "가을", "겨울"],
      "occasion": ["일상"],
      "originalImage": "data:image/jpeg;base64,...",
      "createdAt": "2024-11-14T10:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "흰색 셔츠",
      "brand": "Uniqlo",
      "primaryColor": "흰색",
      "pattern": "무지",
      "material": "코튼",
      "style": ["캐주얼", "포멀"],
      "season": ["사계절"],
      "occasion": ["출근", "데이트"],
      "originalImage": "data:image/jpeg;base64,...",
      "createdAt": "2024-11-13T15:45:00Z"
    }
  ]
}
```

---

#### 3. GET /api/clothing/:id - 의류 상세 조회

```bash
curl -X GET http://localhost:3001/api/clothing/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer {token}"
```

**요청**:
- **Headers**: `Authorization: Bearer {JWT_TOKEN}`
- **URL Parameters**:
  - `id` (String, 필수): 의류 ID

**응답** (200 OK):
```json
{
  "success": true,
  "message": "의류 상세 조회 성공",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "categoryId": "cat-123",
    "name": "검정 후드티",
    "brand": "Nike",
    "purchaseDate": "2024-01-15",
    "purchasePrice": 79000,
    "purchaseUrl": "https://nike.com/product/123",
    "originalImage": "data:image/jpeg;base64,...",
    "primaryColor": "검정",
    "secondaryColor": null,
    "colorHex": "#000000",
    "pattern": "무지",
    "texture": "부드러움",
    "material": "코튼",
    "formality": 2,
    "style": ["캐주얼"],
    "mood": ["편안한"],
    "season": ["봄", "가을", "겨울"],
    "occasion": ["일상", "출근"],
    "matchingRules": {
      "goodWith": {
        "colors": ["흰색", "회색", "베이지"],
        "patterns": ["무지", "스트라이프"],
        "styles": ["캐주얼", "미니멀"]
      }
    },
    "measurements": {
      "chest": 100,
      "length": 70
    },
    "wearCount": 15,
    "lastWornDate": "2024-11-14",
    "rating": 4.5,
    "tags": ["즐겨찾기", "출근룩"],
    "createdAt": "2024-11-14T10:30:00Z",
    "updatedAt": "2024-11-17T08:15:00Z"
  }
}
```

---

#### 4. PATCH /api/clothing/:id - 의류 정보 수정

```bash
curl -X PATCH http://localhost:3001/api/clothing/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "wearCount": 16,
    "lastWornDate": "2024-11-17",
    "rating": 5,
    "tags": ["즐겨찾기", "출근룩", "가을"]
  }'
```

**요청**:
- **Headers**:
  - `Authorization: Bearer {JWT_TOKEN}`
  - `Content-Type: application/json`
- **URL Parameters**: `id` (String, 필수)
- **Body** (JSON, 모두 선택):
  모든 필드가 선택사항이며, 필요한 필드만 포함하면 됩니다.

**응답** (200 OK):
```json
{
  "success": true,
  "message": "의류 정보 수정 완료",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "검정 후드티",
    "brand": "Nike",
    "primaryColor": "검정",
    "metadata": {
      "pattern": "무지",
      "material": "코튼",
      "style": ["캐주얼"],
      "season": ["봄", "가을", "겨울"],
      "occasion": ["일상", "출근"]
    },
    "updatedAt": "2024-11-17T10:45:00Z"
  }
}
```

---

#### 5. DELETE /api/clothing/:id - 의류 삭제

```bash
curl -X DELETE http://localhost:3001/api/clothing/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer {token}"
```

**요청**:
- **Headers**: `Authorization: Bearer {JWT_TOKEN}`
- **URL Parameters**: `id` (String, 필수)

**응답** (200 OK):
```json
{
  "success": true,
  "message": "의류 삭제 완료"
}
```

---

## 코드 아키텍처

### 디렉토리 구조

```
backend/src/
├── routes/
│   ├── clothing.routes.ts      ← 라우트 정의
│   └── index.ts                ← 라우트 등록
├── controllers/
│   └── clothing.controller.ts   ← 요청 처리
├── services/
│   └── clothing.service.ts      ← 비즈니스 로직
├── middleware/
│   ├── auth.middleware.ts       ← JWT 검증
│   └── error.middleware.ts      ← 에러 처리
└── types/
    └── (타입 정의)
```

### 계층 구조 (Layered Architecture)

```
요청 (HTTP Request)
    ↓
[Route] clothing.routes.ts
    ↓ (라우팅)
[Controller] clothing.controller.ts (요청 처리, 검증)
    ↓ (위임)
[Service] clothing.service.ts (비즈니스 로직, DB 쿼리)
    ↓ (실행)
[Database] PostgreSQL (데이터 저장)
    ↓
응답 (HTTP Response)
```

### clothing.service.ts

비즈니스 로직을 담당하는 서비스 레이어입니다.

**주요 메서드**:

```typescript
// 1. 의류 업로드
static async uploadClothing(payload: UploadClothingPayload): Promise<any>

// 2. 목록 조회
static async getClothingByUserId(userId: string): Promise<any[]>

// 3. 상세 조회
static async getClothingById(clothingId: string, userId: string): Promise<any>

// 4. 정보 수정
static async updateClothing(
  clothingId: string,
  userId: string,
  updates: any
): Promise<any>

// 5. 삭제
static async deleteClothing(clothingId: string, userId: string): Promise<void>

// 보조 메서드
private static validateFile(buffer: Buffer, mimeType: string): void
private static async processImage(buffer: Buffer): Promise<Buffer>
private static async analyzeClothingWithAI(base64Image: string): Promise<any>
```

### clothing.controller.ts

HTTP 요청을 처리하고 서비스에 위임하는 컨트롤러입니다.

```typescript
export class ClothingController {
  // POST /api/clothing/upload
  static async uploadClothing(req, res, next)

  // GET /api/clothing
  static async getClothing(req, res, next)

  // GET /api/clothing/:id
  static async getClothingById(req, res, next)

  // PATCH /api/clothing/:id
  static async updateClothing(req, res, next)

  // DELETE /api/clothing/:id
  static async deleteClothing(req, res, next)
}
```

### clothing.routes.ts

라우트를 정의하고 미들웨어를 연결합니다.

```typescript
router.post('/upload', authenticateToken, upload.single('image'), uploadClothing);
router.get('/', authenticateToken, getClothing);
router.get('/:id', authenticateToken, getClothingById);
router.patch('/:id', authenticateToken, updateClothing);
router.delete('/:id', authenticateToken, deleteClothing);
```

---

## 테스트 가이드

### 준비 사항

1. **백엔드 시작**:
```bash
cd backend
npm install
npm run dev
```

2. **데이터베이스 마이그레이션**:
```bash
npm run prisma:migrate
```

3. **JWT 토큰 획득**:
```bash
# 회원가입
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "테스트유저"
  }'

# 로그인하여 토큰 획득
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

응답에서 `token`을 복사하여 아래 `{TOKEN}`에 대입합니다.

### 테스트 시나리오

#### 1️⃣ CREATE 테스트 - 의류 업로드

```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3001/api/clothing/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/shirt.jpg" \
  -F "name=검정 후드티" \
  -F "brand=Nike" \
  -F "categoryId=cat-123"
```

**예상 응답** (201 Created):
```json
{
  "success": true,
  "message": "의류 업로드 및 분석 완료",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "검정 후드티",
    "primaryColor": "검정",
    "metadata": {
      "pattern": "무지",
      "material": "코튼",
      "style": ["캐주얼"],
      "season": ["봄", "가을", "겨울"],
      "occasion": ["일상", "출근"]
    }
  }
}
```

**응답에서 ID 저장** (다음 테스트에서 사용):
```bash
CLOTHING_ID="550e8400-e29b-41d4-a716-446655440000"
```

---

#### 2️⃣ READ 테스트 - 목록 조회

```bash
curl -X GET http://localhost:3001/api/clothing \
  -H "Authorization: Bearer $TOKEN"
```

**예상 응답** (200 OK):
```json
{
  "success": true,
  "message": "의류 목록 조회 성공",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "검정 후드티",
      "brand": "Nike",
      "primaryColor": "검정",
      "pattern": "무지",
      "material": "코튼",
      "style": ["캐주얼"],
      "season": ["봄", "가을", "겨울"],
      "occasion": ["일상"],
      "originalImage": "data:image/jpeg;base64,...",
      "createdAt": "2024-11-17T10:30:00Z"
    }
  ]
}
```

---

#### 3️⃣ READ 테스트 - 상세 조회

```bash
curl -X GET "http://localhost:3001/api/clothing/$CLOTHING_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**예상 응답** (200 OK):
```json
{
  "success": true,
  "message": "의류 상세 조회 성공",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "name": "검정 후드티",
    "brand": "Nike",
    "primaryColor": "검정",
    "colorHex": "#000000",
    "pattern": "무지",
    "material": "코튼",
    "formality": 2,
    "style": ["캐주얼"],
    "season": ["봄", "가을", "겨울"],
    "occasion": ["일상", "출근"],
    "wearCount": 0,
    "rating": null,
    "tags": [],
    "createdAt": "2024-11-17T10:30:00Z",
    "updatedAt": "2024-11-17T10:30:00Z"
  }
}
```

---

#### 4️⃣ UPDATE 테스트 - 정보 수정

```bash
curl -X PATCH "http://localhost:3001/api/clothing/$CLOTHING_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wearCount": 5,
    "lastWornDate": "2024-11-17",
    "rating": 4.5,
    "tags": ["즐겨찾기", "출근룩"]
  }'
```

**예상 응답** (200 OK):
```json
{
  "success": true,
  "message": "의류 정보 수정 완료",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "검정 후드티",
    "brand": "Nike",
    "primaryColor": "검정",
    "metadata": {
      "pattern": "무지",
      "material": "코튼",
      "style": ["캐주얼"],
      "season": ["봄", "가을", "겨울"],
      "occasion": ["일상", "출근"]
    },
    "updatedAt": "2024-11-17T11:00:00Z"
  }
}
```

**변경 사항 확인** (상세 조회로 재확인):
```bash
curl -X GET "http://localhost:3001/api/clothing/$CLOTHING_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

#### 5️⃣ DELETE 테스트 - 의류 삭제

```bash
curl -X DELETE "http://localhost:3001/api/clothing/$CLOTHING_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**예상 응답** (200 OK):
```json
{
  "success": true,
  "message": "의류 삭제 완료"
}
```

**삭제 확인** (상세 조회로 확인 - 404 에러 발생):
```bash
curl -X GET "http://localhost:3001/api/clothing/$CLOTHING_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**예상 응답** (404 Not Found):
```json
{
  "success": false,
  "message": "의류를 찾을 수 없습니다"
}
```

---

### 테스트 체크리스트

- [ ] **CREATE**: 이미지 업로드 성공 (201)
- [ ] **CREATE**: 파일 크기 초과 시 에러 (400)
- [ ] **CREATE**: 지원하지 않는 형식 시 에러 (400)
- [ ] **CREATE**: 필수 필드 누락 시 에러 (400)
- [ ] **READ**: 목록 조회 성공 (200)
- [ ] **READ**: 상세 조회 성공 (200)
- [ ] **READ**: 존재하지 않는 ID 조회 시 에러 (404)
- [ ] **UPDATE**: 정보 수정 성공 (200)
- [ ] **UPDATE**: 일부 필드만 수정 가능
- [ ] **UPDATE**: 다른 사용자 옷 수정 불가 (404)
- [ ] **UPDATE**: 빈 요청본문 시 에러 (400)
- [ ] **DELETE**: 의류 삭제 성공 (200)
- [ ] **DELETE**: 다른 사용자 옷 삭제 불가 (404)
- [ ] **인증**: 토큰 없이 요청 시 에러 (401)
- [ ] **인증**: 잘못된 토큰 시 에러 (401)

---

## 에러 처리

### 에러 응답 형식

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "success": false,
  "message": "에러 메시지",
  "statusCode": 400
}
```

### 일반적인 에러 코드

| HTTP Status | 상황 | 메시지 |
|------------|------|--------|
| 400 | 유효하지 않은 요청 | 파일 크기가 너무 큽니다 |
| 400 | 지원하지 않는 형식 | JPG, PNG, WebP 형식만 지원합니다 |
| 400 | 필수 필드 누락 | 이름과 카테고리는 필수입니다 |
| 400 | 수정할 정보 없음 | 수정할 정보가 없습니다 |
| 401 | 토큰 없음/만료됨 | 인증이 필요합니다 |
| 404 | 리소스 없음 | 의류를 찾을 수 없습니다 |
| 500 | 서버 오류 | 의류 업로드 중 오류가 발생했습니다 |

### 에러 핸들링 예제

```typescript
// 에러 발생 시 서비스에서
throw new CustomError('의류를 찾을 수 없습니다', 404);

// 컨트롤러에서 catch
catch (error) {
  next(error); // 에러 미들웨어로 전달
}

// 에러 미들웨어에서 처리
app.use(errorHandler);
// → 일관된 형식의 JSON 응답 반환
```

---

## 학습 포인트

### 1️⃣ REST API 설계 원칙

**자원(Resource)을 중심으로 설계**:
```
POST   /api/clothing        ← 새로운 의류 생성 (업로드)
GET    /api/clothing        ← 의류 목록 조회
GET    /api/clothing/:id    ← 특정 의류 조회
PATCH  /api/clothing/:id    ← 의류 정보 수정
DELETE /api/clothing/:id    ← 의류 삭제
```

**올바른 HTTP 메서드 사용**:
- **POST**: 새로운 자원 생성
- **GET**: 자원 조회 (부작용 없음)
- **PATCH**: 자원의 일부 수정
- **DELETE**: 자원 삭제

### 2️⃣ 부분 업데이트 (PARTIAL UPDATE)

**문제**: PUT은 전체 자원을 교체하므로 필드를 누락하면 삭제됨

```javascript
// 잘못된 방식 (PUT)
PUT /api/clothing/123
{ "name": "새이름" }
// → 다른 필드들이 모두 null로 변함!
```

**해결책**: PATCH로 필요한 필드만 수정

```javascript
// 올바른 방식 (PATCH)
PATCH /api/clothing/123
{ "name": "새이름" }
// → name만 수정되고 다른 필드는 유지
```

### 3️⃣ 필드 검증과 보안

**허용된 필드만 업데이트하기**:

```typescript
const allowedFields = [
  'name', 'brand', 'pattern', 'material',
  'style', 'season', 'occasion', 'wearCount', 'rating', 'tags'
];

const filteredUpdates = {};
Object.entries(updates).forEach(([key, value]) => {
  if (allowedFields.includes(key)) {
    filteredUpdates[key] = value;
  }
});

// userId, categoryId, originalImage 등은 수정 불가
```

**왜 필요한가?**
- 사용자가 실수로 중요한 필드를 변경하지 않도록 보호
- 악의적인 필드 주입 방지 (보안)
- 비즈니스 로직 보호

### 4️⃣ 소유자 검증 (Authorization)

**자신의 데이터만 수정/삭제 가능하도록 보장**:

```typescript
const clothing = await prisma.myClothing.findFirst({
  where: {
    id: clothingId,
    userId  // ← 현재 사용자만 소유한 의류 조회
  }
});

if (!clothing) {
  throw new CustomError('의류를 찾을 수 없습니다', 404);
}
```

**보안 효과**:
- 다른 사용자의 데이터 접근 방지
- 404 에러로 리소스 존재 여부 노출 방지

### 5️⃣ 트랜잭션과 데이터 일관성

**관련 데이터 자동 삭제 (CASCADE DELETE)**:

```prisma
model MyClothing {
  id String @id @default(uuid())
  userId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  combinationItems CombinationItem[]  // ← 자동 삭제
  pairings1 ClothingPair[] @relation("clothing1")  // ← 자동 삭제
}
```

**이점**:
- 고아 레코드(Orphan Records) 방지
- 데이터 일관성 유지
- 수동 정리 불필요

### 6️⃣ 계층화 아키텍처의 이점

```
Route → Controller → Service → Database
```

**각 계층의 책임**:

1. **Route**: 요청 라우팅, 미들웨어 연결
2. **Controller**: HTTP 요청/응답 처리, 기본 검증
3. **Service**: 비즈니스 로직, DB 쿼리
4. **Database**: 데이터 저장/조회

**장점**:
- 코드 재사용성 증가
- 테스트 용이성
- 유지보수 편의성
- 책임 분리

### 7️⃣ 자동 타임스탐프

```prisma
model MyClothing {
  createdAt DateTime @default(now())    // ← 생성 시 자동 설정
  updatedAt DateTime @updatedAt          // ← 수정 시 자동 업데이트
}
```

**활용**:
- 데이터 생성/수정 시간 자동 기록
- 수동 설정 불필요
- 감시/감사(Audit Trail) 기능

---

## 다음 단계

Phase 2 [2-3] 완료 후 다음 진행할 내용:

### Phase 2 [2-4]: AI-Powered Recommendations

의류 데이터를 바탕으로 **AI가 추천하는 스타일링**을 제공합니다.

**기능**:
- 사용자의 옷장 분석
- 어울리는 색상 조합 추천
- 스타일 추천
- 계절별 추천
- 날씨별 추천

**기술**:
- Google Gemini AI를 활용한 스타일 분석
- 머신러닝 기반 추천 알고리즘

---

## 마무리

Phase 2 [2-3]을 통해 다음을 배웠습니다:

✅ REST API 설계 원칙 (CRUD)
✅ 부분 업데이트 (PATCH) 구현
✅ 소유자 검증 (Authorization)
✅ 필드 검증과 보안
✅ 에러 처리
✅ 계층화 아키텍처

**핵심 개념**: 보안, 검증, 데이터 일관성을 갖춘 완전한 API 설계

🧠 **Happy Coding!**
