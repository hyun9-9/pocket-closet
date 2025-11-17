# Pocket Closet - Phase 2 [2-2]: Clothing Upload & AI Analysis 완벽 가이드

> **작성일**: 2024년 11월 17일
> **주제**: Multer, Sharp, Google Gemini AI를 활용한 의류 업로드 및 자동 분석
> **난이도**: 중급 - 고급
> **소요 시간**: 약 2-3시간

---

## 📌 개요

Phase 2 [2-2]에서는 **사용자가 의류 이미지를 업로드하면 자동으로 분석**하는 시스템을 구현했습니다.

**핵심 기술:**
- 📸 **Multer** - 파일 업로드 처리
- 🖼️ **Sharp** - 이미지 최적화 (리사이징, 포맷 변환)
- 🤖 **Google Gemini AI** - 의류 자동 분석 (색상, 패턴, 재질, 스타일)
- 💾 **Prisma ORM** - AI 분석 결과 데이터베이스 저장

---

## 🎯 목표

Phase 2 [2-2]에서 달성한 목표:
1. ✅ Multer로 파일 업로드 처리
2. ✅ Sharp로 이미지 최적화
3. ✅ Google Gemini AI로 의류 자동 분석
4. ✅ 분석 결과를 데이터베이스에 저장
5. ✅ 의류 목록/상세 조회 및 삭제 API
6. ✅ 모든 API Postman 테스트 완료

---

## 🔄 **전체 흐름**

```
[사용자]
  ↓
[프론트엔드]
  이미지 파일 선택
  이름, 브랜드, 카테고리 입력
  ↓
[FormData로 전송]
  POST /api/clothing/upload
  multipart/form-data
  ├─ image (파일)
  ├─ name (텍스트)
  ├─ categoryId (텍스트)
  └─ brand (텍스트, 선택)
  ↓
[Multer 미들웨어]
  파일 수신
  메모리에 저장
  MIME Type 검증
  ↓
[Clothing Controller]
  요청 데이터 추출
  필수 필드 검증
  ↓
[Clothing Service]
  ├─ 파일 크기/형식 검증 (validateFile)
  ├─ 이미지 처리 (processImage with Sharp)
  │  ├─ 1024x1024 리사이징
  │  ├─ JPG로 포맷 변환
  │  └─ 품질 80%로 압축
  ├─ Base64 인코딩
  ├─ Google Gemini AI 분석 (analyzeClothingWithAI)
  │  ├─ 색상 추출
  │  ├─ 패턴 감지
  │  ├─ 재질 분석
  │  ├─ 스타일 분류
  │  └─ 착용 occasion 추천
  └─ 데이터베이스 저장 (Prisma)
     ├─ MyClothing 테이블
     └─ AI 분석 결과 저장
  ↓
[응답]
HTTP 201 Created
{
  "success": true,
  "data": {
    "id": "clothing-uuid",
    "name": "카라 반팔티",
    "primaryColor": "블루 그레이",
    "metadata": { ... }
  }
}
```

---

## 🛠️ **핵심 기술 4가지**

### 1️⃣ **Multer: 파일 업로드 처리**

#### 개념

**Multer**는 Express.js 미들웨어로, 파일 업로드를 처리합니다.

```typescript
import multer from 'multer';

// Multer 설정
const upload = multer({
  storage: multer.memoryStorage(),  // 메모리에 저장
  limits: {
    fileSize: 10 * 1024 * 1024  // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('JPG, PNG, WebP만 지원합니다'));
    }
  }
});

// 라우트에서 사용
router.post(
  '/upload',
  authenticateToken,        // JWT 검증
  upload.single('image'),   // 파일 처리
  controller.uploadClothing // 컨트롤러
);
```

#### 파일이 메모리에 저장되는 과정

```
사용자 브라우저
  ↓ FormData 전송
multipart/form-data
  ↓
Multer 미들웨어
  ├─ Content-Type 확인
  ├─ MIME Type 검증
  ├─ 파일 크기 확인
  └─ 메모리에 저장
  ↓
req.file 객체 생성
{
  fieldname: 'image',
  originalname: 'hoodie.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: <Buffer ...>,  // ← 파일 바이너리
  size: 204800
}
```

#### Controller에서 파일 접근

```typescript
static async uploadClothing(req, res, next) {
  // req.file: Multer가 생성한 파일 객체
  if (!req.file) {
    return res.status(400).json({
      error: '이미지 파일이 필요합니다'
    });
  }

  // 파일 데이터 추출
  const fileBuffer = req.file.buffer;        // 파일 바이너리
  const fileName = req.file.originalname;    // 원본 파일명
  const mimeType = req.file.mimetype;        // 파일 타입

  // Service에 전달
  const result = await ClothingService.uploadClothing({
    fileBuffer,
    fileName,
    mimeType,
    // ... 다른 데이터
  });
}
```

#### 장단점

| 장점 | 단점 |
|------|------|
| 간단한 설정 | 메모리 사용 (큰 파일 × ) |
| Express 친화적 | 동시 다중 업로드 제한 |
| 빠른 처리 | 디스크 저장 필요 |

---

### 2️⃣ **Sharp: 이미지 처리**

#### 개념

**Sharp**는 Node.js 이미지 처리 라이브러리입니다. 빠르고 강력합니다.

```typescript
import sharp from 'sharp';

// 이미지 처리
const processedImage = await sharp(buffer)
  .resize(1024, 1024, {
    fit: 'inside',              // 원본 비율 유지
    withoutEnlargement: true    // 작은 이미지는 확대 안 함
  })
  .jpeg({ quality: 80 })        // JPG로 변환, 품질 80%
  .toBuffer();
```

#### 처리 과정

```
원본 이미지 (버퍼)
  ↓
Sharp 파이프라인
  ├─ resize(1024x1024)
  │  └─ 이미지를 1024x1024 범위 내로 조정
  │     원본 비율 유지
  │
  ├─ jpeg({ quality: 80 })
  │  ├─ 포맷을 JPG로 변환
  │  └─ 품질 80%로 압축 (파일 크기 감소)
  │
  └─ toBuffer()
     └─ 처리된 이미지를 버퍼로 반환
  ↓
처리된 이미지 (버퍼)
  ├─ 파일 크기 감소 (원본의 20-30%)
  ├─ 일관된 크기 (1024x1024)
  └─ JPG 포맷 (호환성 좋음)
```

#### 실제 예시

```typescript
private static async processImage(buffer: Buffer): Promise<Buffer> {
  try {
    const processed = await sharp(buffer)
      .resize(1024, 1024, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    return processed;
  } catch (error) {
    throw new CustomError('이미지 처리 중 오류가 발생했습니다', 500);
  }
}

// 사용
const fileBuffer = req.file.buffer;  // Multer에서 받은 파일
const processedImage = await this.processImage(fileBuffer);
// processedImage는 처리되고 압축된 이미지 버퍼
```

#### 주요 메서드

```typescript
// 1. resize: 이미지 크기 조정
.resize(width, height, options)
// fit: 'inside' (원본 비율 유지)
// fit: 'cover' (범위를 채우되 일부 자를 수 있음)
// fit: 'contain' (여백 추가)

// 2. jpeg: JPG 포맷 변환
.jpeg({ quality: 80 })
// quality: 0-100 (낮을수록 파일 작음)

// 3. png: PNG 포맷 변환
.png()

// 4. webp: WebP 포맷 변환
.webp()

// 5. toBuffer: 버퍼로 반환
.toBuffer()

// 6. toFile: 파일로 저장
.toFile('/path/to/file.jpg')

// 7. metadata: 이미지 정보 조회
const info = await sharp(buffer).metadata();
// { width, height, format, space, channels, ... }
```

---

### 3️⃣ **Google Gemini AI: 의류 자동 분석**

#### 개념

**Google Gemini AI**는 이미지를 분석하고 텍스트를 생성하는 AI 모델입니다.

우리는 **@google/genai** 패키지를 사용합니다.

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});
// API_KEY는 환경 변수 GEMINI_API_KEY에서 자동 읽음
```

#### 의류 분석 프롬프트

```typescript
const prompt = `
당신은 패션 전문가입니다. 이 옷 사진을 분석하고 다음 정보를 JSON으로 추출하세요:

{
  "primaryColor": "색상명",
  "colorHex": "HEX 코드",
  "pattern": "무지|스트라이프|체크|도트|플로럴",
  "material": "코튼|폴리에스터|데님|니트|실크",
  "style": ["캐주얼", "미니멀", ...],
  "season": ["봄", "여름", "가을", "겨울"],
  "occasion": ["일상", "출근", "데이트", "파티"],
  "formality": 1~10,
  "description": "설명"
}
`;

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    {
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image  // ← Base64로 인코딩된 이미지
          }
        },
        { text: prompt }
      ]
    }
  ],
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'OBJECT',
      properties: {
        primaryColor: { type: 'STRING' },
        // ... 다른 필드
      }
    }
  }
});

// 응답 파싱
const responseText = response.text;
const metadata = JSON.parse(responseText);
```

#### API 호출 과정

```
1. Base64 인코딩된 이미지 준비
   원본 이미지 → Sharp 처리 → Base64 인코딩

2. Gemini AI에 요청
   POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
   ├─ Authorization: Bearer {API_KEY}
   ├─ contents: [이미지 + 프롬프트]
   ├─ generationConfig: {스키마 정의}
   └─ timeout: 30초

3. AI가 이미지 분석
   ├─ 시각적 특징 추출
   ├─ 색상 분석
   ├─ 패턴 인식
   ├─ 재질 추론
   └─ 스타일 분류

4. JSON 응답 반환
   {
     "primaryColor": "블루 그레이",
     "pattern": "무지",
     "material": "코튼",
     "style": ["캐주얼", "미니멀"],
     ...
   }

5. 응답 파싱 및 데이터베이스 저장
   마크다운 제거 → JSON 파싱 → Prisma 저장
```

#### 응답 형식 (스키마 기반)

```typescript
generationConfig: {
  responseMimeType: 'application/json',  // JSON 응답 강제
  responseSchema: {
    type: 'OBJECT',
    properties: {
      primaryColor: { type: 'STRING' },
      colorHex: { type: 'STRING' },
      pattern: { type: 'STRING' },
      material: { type: 'STRING' },
      style: {
        type: 'ARRAY',
        items: { type: 'STRING' }
      },
      season: {
        type: 'ARRAY',
        items: { type: 'STRING' }
      },
      occasion: {
        type: 'ARRAY',
        items: { type: 'STRING' }
      },
      formality: { type: 'INTEGER' }
    },
    required: [
      'primaryColor',
      'colorHex',
      'pattern',
      'material',
      'style',
      'season',
      'occasion',
      'formality'
    ]
  }
}
```

**이 스키마는:**
- ✅ AI가 반드시 JSON을 반환하도록 강제
- ✅ 응답 필드를 사전 정의
- ✅ 필수 필드 검증
- ✅ 데이터 타입 보장

---

### 4️⃣ **Base64 인코딩: 이미지를 텍스트로 변환**

#### 개념

이미지(바이너리)를 **텍스트로 변환**해서 JSON에 포함할 수 있게 합니다.

```typescript
// Sharp로 처리한 이미지 버퍼
const processedImage = await sharp(buffer).jpeg(...).toBuffer();

// Base64로 인코딩
const base64Image = processedImage.toString('base64');
// 결과: "iVBORw0KGgoAAAANSUhEUgAAAAUA..."

// Gemini AI에 전송
const response = await ai.models.generateContent({
  contents: [
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image  // ← Base64 문자열
      }
    }
  ]
});
```

#### 인코딩 프로세스

```
이미지 파일 (바이너리)
  ↓
버퍼로 로드
  [바이트 0] [바이트 1] [바이트 2] ...

  ↓
Base64 인코딩
  8비트씩 끊음 → 6비트씩 재편성 → 64진법 문자로 변환

  ↓
Base64 문자열 (텍스트)
  "iVBORw0KGgoAAAANSUhEUgAAAAUA..."

  ↓
JSON에 포함 가능!
  {
    "image": "iVBORw0KGgoAAAANSUhEUgAAAAUA..."
  }
```

---

## 📊 **구현 파일 구조**

```
backend/src/
├── routes/
│   ├── clothing.routes.ts        ✨ NEW
│   └── index.ts                  (수정)
│
├── controllers/
│   └── clothing.controller.ts    ✨ NEW
│       ├── uploadClothing()      - 업로드
│       ├── getClothing()         - 목록 조회
│       ├── getClothingById()     - 상세 조회
│       └── deleteClothing()      - 삭제
│
└── services/
    └── clothing.service.ts       ✨ NEW
        ├── uploadClothing()      - 전체 프로세스
        ├── validateFile()        - 파일 검증
        ├── processImage()        - 이미지 처리 (Sharp)
        ├── analyzeClothingWithAI() - AI 분석 (Gemini)
        ├── getClothingByUserId() - 목록 조회
        ├── getClothingById()     - 상세 조회
        └── deleteClothing()      - 삭제
```

---

## 🧪 **API 테스트**

### Test 1: 의류 업로드

**Postman 설정:**

```
POST http://localhost:3001/api/clothing/upload

[Headers]
Authorization: Bearer {로그인 토큰}

[Body - form-data]
image: (이미지 파일)
name: "카라 반팔티"
categoryId: "{상의 카테고리 ID}"
brand: "Nike"
```

**응답 (201 Created):**

```json
{
  "success": true,
  "message": "의류 업로드 및 분석 완료",
  "data": {
    "id": "6e9cb0f9-b113-476f-bdc4-3167b161e632",
    "name": "카라 반팔티",
    "primaryColor": "블루 그레이",
    "metadata": {
      "pattern": "무지",
      "material": "코튼",
      "style": ["캐주얼", "미니멀", "댄디"],
      "season": ["봄", "여름", "가을"],
      "occasion": ["일상", "출근", "데이트"]
    }
  }
}
```

### Test 2: 의류 목록 조회

```
GET http://localhost:3001/api/clothing

[Headers]
Authorization: Bearer {토큰}
```

**응답 (200 OK):**

```json
{
  "success": true,
  "message": "의류 목록 조회 성공",
  "data": [
    {
      "id": "6e9cb0f9-...",
      "name": "카라 반팔티",
      "brand": "Nike",
      "primaryColor": "블루 그레이",
      "pattern": "무지",
      "material": "코튼",
      "style": ["캐주얼", "미니멀", "댄디"],
      "season": ["봄", "여름", "가을"],
      "occasion": ["일상", "출근", "데이트"],
      "createdAt": "2024-11-17T04:07:08.000Z"
    }
  ]
}
```

### Test 3: 의류 상세 조회

```
GET http://localhost:3001/api/clothing/{clothingId}

[Headers]
Authorization: Bearer {토큰}
```

**응답 (200 OK):**

```json
{
  "success": true,
  "message": "의류 상세 조회 성공",
  "data": {
    "id": "6e9cb0f9-...",
    "userId": "user-uuid",
    "categoryId": "category-uuid",
    "name": "카라 반팔티",
    "brand": "Nike",
    "primaryColor": "블루 그레이",
    "colorHex": "#A0B0C0",
    "pattern": "무지",
    "material": "코튼",
    "style": ["캐주얼", "미니멀", "댄디"],
    "season": ["봄", "여름", "가을"],
    "occasion": ["일상", "출근", "데이트"],
    "formality": 3,
    "originalImage": "data:image/jpeg;base64,iVBORw0K...",
    "measurements": {},
    "matchingRules": {},
    "createdAt": "2024-11-17T04:07:08.000Z",
    "updatedAt": "2024-11-17T04:07:08.000Z"
  }
}
```

### Test 4: 의류 삭제

```
DELETE http://localhost:3001/api/clothing/{clothingId}

[Headers]
Authorization: Bearer {토큰}
```

**응답 (200 OK):**

```json
{
  "success": true,
  "message": "의류 삭제 완료"
}
```

---

## 🔐 **보안 고려사항**

### 1️⃣ 파일 검증

```typescript
private static validateFile(buffer: Buffer, mimeType: string): void {
  // 파일 크기 제한 (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (buffer.length > maxSize) {
    throw new CustomError('파일 크기가 너무 큽니다', 400);
  }

  // MIME Type 검증
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(mimeType)) {
    throw new CustomError('JPG, PNG, WebP만 지원합니다', 400);
  }
}
```

### 2️⃣ 인증 필수

```typescript
// 모든 clothing 라우트에 authenticateToken 미들웨어 필수
router.post('/upload', authenticateToken, upload.single('image'), controller.uploadClothing);
router.get('/', authenticateToken, controller.getClothing);
router.get('/:id', authenticateToken, controller.getClothingById);
router.delete('/:id', authenticateToken, controller.deleteClothing);
```

### 3️⃣ 데이터 소유권 검증

```typescript
// 자신의 옷만 조회/삭제 가능
const clothing = await prisma.myClothing.findFirst({
  where: {
    id: clothingId,
    userId: userId  // ← 사용자 검증
  }
});

if (!clothing) {
  throw new CustomError('의류를 찾을 수 없습니다', 404);
}
```

### 4️⃣ Multer 필터링

```typescript
fileFilter: (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('JPG, PNG, WebP만 지원합니다'));
  }
}
```

---

## 📈 **성능 최적화**

### 1️⃣ 이미지 압축

```typescript
.jpeg({ quality: 80 })
// quality: 100 → 원본 (파일 크기 큼)
// quality: 80  → 균형 (권장)
// quality: 50  → 압축 (품질 손실)

// 결과:
// 원본: 5MB → 처리됨: 500KB (90% 감소!)
```

### 2️⃣ 메모리 저장소 (Multer)

```typescript
storage: multer.memoryStorage()
// vs.
storage: multer.diskStorage({ destination: './uploads' })

// 메모리: 빠름, 동시 업로드 제한
// 디스크: 느림, 병렬 처리 가능
```

### 3️⃣ 비동기 처리

```typescript
// 병렬 처리 가능
Promise.all([
  processImage(buffer1),
  processImage(buffer2),
  processImage(buffer3)
])

// 순차 처리 (현재)
await processImage(buffer);
```

---

## ⚠️ **트러블슈팅**

### 문제 1: "MIME Type 검증 실패"

**원인**: 지원하지 않는 이미지 형식

**해결**:
```typescript
// 지원 형식 확인
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

// HEIC, TIFF 등은 먼저 변환 필요
```

### 문제 2: "AI 분석에서 마크다운 응답"

**원인**: AI가 ```json``` 마크다운 포함해서 반환

**해결**:
```typescript
let responseText = response.text;
responseText = responseText
  .replace(/```json\n?/g, '')
  .replace(/```\n?/g, '')
  .trim();

const metadata = JSON.parse(responseText);
```

### 문제 3: "메모리 부족"

**원인**: 큰 파일이 메모리에 쌓임

**해결**:
```typescript
// 1. 파일 크기 제한 (이미 적용)
limits: { fileSize: 10 * 1024 * 1024 }

// 2. 디스크 저장소로 변경
storage: multer.diskStorage({ destination: './uploads' })

// 3. 이미지 압축률 높이기
.jpeg({ quality: 50 })
```

### 문제 4: "API 키 관련 오류"

**원인**: GEMINI_API_KEY 환경 변수 미설정

**해결**:
```bash
# backend/.env에 설정
GEMINI_API_KEY="your-actual-key"

# 확인
echo $GEMINI_API_KEY
```

---

## 📚 **핵심 용어 정리**

| 용어 | 설명 |
|------|------|
| **Multer** | Express 파일 업로드 미들웨어 |
| **Sharp** | 이미지 처리 라이브러리 (리사이징, 포맷 변환) |
| **Base64** | 바이너리 → 텍스트 인코딩 |
| **MIME Type** | 파일 종류 식별 (image/jpeg 등) |
| **FormData** | 파일 + 텍스트를 함께 보내는 형식 |
| **Gemini AI** | Google의 텍스트/이미지 분석 AI |
| **JSON Schema** | API 응답 형식을 정의하는 스키마 |
| **메타데이터** | AI가 추출한 의류 정보 (색상, 패턴, 재질 등) |

---

## ✅ **Phase 2 [2-2] 완료 체크리스트**

- ✅ Multer로 파일 업로드 처리
- ✅ Sharp로 이미지 최적화 (리사이징, 압축)
- ✅ Google Gemini AI로 의류 자동 분석
- ✅ Base64 인코딩
- ✅ JSON 스키마 기반 응답
- ✅ 마크다운 제거 및 JSON 파싱
- ✅ 데이터베이스 저장 (Prisma)
- ✅ 의류 목록/상세 조회 API
- ✅ 의류 삭제 API
- ✅ 모든 API Postman 테스트 완료

---

## 🚀 **다음 단계**

### Phase 2 [2-3]: Wardrobe Management CRUD
- 이미 구현된 GET/DELETE API 테스트
- 프론트엔드와 통합
- 의류 편집(PATCH) 기능 추가

### Phase 2 [2-4]: AI-Powered Recommendations
- 사용자의 의류 컬렉션 분석
- Gemini AI로 코디 조합 생성
- 추천 결과 반환

---

## 🎓 **학습 포인트**

이 과정에서 배운 것:

1. **Multer**: 파일 업로드 처리의 기초
2. **Sharp**: 이미지 처리 및 최적화 방법
3. **Base64**: 바이너리 데이터 텍스트 변환
4. **Google Gemini API**: AI 모델 활용
5. **JSON Schema**: API 응답 형식 정의
6. **에러 처리**: 파일 검증 및 AI 에러 핸들링
7. **마크다운 파싱**: 응답 데이터 정제

---

**작성자**: Pocket Closet Dev Team
**마지막 업데이트**: 2024년 11월 17일
**테스트 완료**: ✅ 모든 API 작동 확인
