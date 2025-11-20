# AI 추천 조합을 저장하고 관리하는 방법: Pocket Closet Phase 3 [3-3]

## 개요

**Pocket Closet**의 조합 저장 기능을 구현했습니다. 사용자가 AI의 추천 조합을 저장하고, 저장된 조합을 관리할 수 있는 완전한 시스템입니다.

### 주요 기능

- 🎨 AI 추천 조합 저장 (중복 제거)
- 📋 저장된 조합 목록 조회 (필터링 + 페이지네이션)
- ⭐ 조합 평가 시스템 (1-5점)
- 🗑️ 조합 삭제

---

## 기술 스택

### Backend
- **Node.js + Express** - REST API
- **Prisma ORM** - DB 관리
- **PostgreSQL** - 데이터 저장
- **Google Gemini AI** - 추천 생성

### Frontend
- **React 19 + TypeScript** - UI
- **Tailwind CSS** - 스타일링
- **Zustand** - 상태 관리

---

## 핵심 알고리즘

### 1️⃣ 중복 조합 제거

같은 의류의 조합이 이미 저장되어 있으면 저장하지 않습니다.

```typescript
// 조합 정규화 (순서 무관)
normalizeCombination([C, A, B]) → "A,B,C"

// 예: 다음 두 조합은 같은 것으로 판단
["검은 후드", "청바지", "스니커즈"]
["스니커즈", "청바지", "검은 후드"]
```

**구현 방식**
1. 의류 ID를 정렬
2. 쉼표로 연결하여 문자열 생성
3. Set에 저장하여 O(1) 검색

### 2️⃣ AI 추천 생성 전 필터링

매번 다른 추천을 받기 위해, **저장된 조합을 AI 프롬프트에 포함**합니다.

```typescript
// Flow
저장된 조합 조회
  ↓
AI 프롬프트에 "이미 저장된 조합" 섹션 추가
  ↓
AI가 해당 조합을 피하고 다른 조합 생성
  ↓
최종 필터링 (이중 안전 장치)
```

**프롬프트 예시**
```
【이미 저장된 조합 (피해야 함)】
1. 검은 후드집업 + 청 바지 + 검정 스니커즈
2. 하양 셔츠 + 검정 슬랙스 + 검정 구두

⚠️ 위의 저장된 조합과 동일한 의류 조합은 추천하지 마세요!
```

---

## API 엔드포인트

### 1. 조합 저장
```http
POST /api/recommendations/save

{
  "recommendationRank": 1,
  "recommendationScore": 9.5,
  "combinationItems": [
    { "clothingId": "uuid1", "layer": 1 },
    { "clothingId": "uuid2", "layer": 2 },
    { "clothingId": "uuid3", "layer": 3 }
  ],
  "occasion": "일상",
  "season": "봄"
}
```

### 2. 저장된 조합 목록 조회
```http
GET /api/combinations?isAiRecommended=true&occasion=일상&season=봄&limit=12&offset=0

Response:
{
  "data": [
    {
      "id": "uuid",
      "name": "캐주얼 일상복",
      "occasion": "일상",
      "season": "봄",
      "rating": 4,
      "items": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 25,
    "pages": 3,
    "hasNextPage": true
  }
}
```

### 3. 조합 평가
```http
PATCH /api/combinations/:id/rate

{
  "rating": 5,
  "feedback": "정말 좋은 조합입니다!"
}
```

### 4. 조합 삭제
```http
DELETE /api/combinations/:id
```

---

## Frontend 구현

### SavedCombinationsPage

저장된 조합을 관리하는 페이지입니다.

```typescript
// 주요 기능
1. 그리드 레이아웃 (3열)
2. 필터링 (유형, 용도, 계절)
3. 페이지네이션 (이전/다음)
4. 평가 시스템 (별점 + 피드백)
5. 삭제 (확인 대화)
```

**필터링 예시**
```tsx
<select onChange={(e) => setFilters({...filters, occasion: e.target.value})}>
  <option value="">모든 용도</option>
  <option value="일상">일상</option>
  <option value="출근">출근</option>
  <option value="데이트">데이트</option>
</select>
```

### RecommendationsPage 개선

AI 추천 이유를 배열로 표시하여 가독성을 개선했습니다.

```typescript
// Before: 한 줄로 표시
"reason": "검정과 흰색의 모노톤 조합으로 세련된 분위기를 연출하며, 캐주얼한 스타일로..."

// After: 배열로 분리
"reason": [
  "색상 조화: 검정과 흰색의 모노톤 조합으로 세련된 분위기",
  "스타일 통일: 캐주얼한 상의와 하의의 완벽한 조화",
  "패턴 균형: 무지 패턴으로 깔끔한 룩 완성"
]
```

**UI 렌더링**
```tsx
{Array.isArray(rec.reason) ? (
  <div className="space-y-2">
    {rec.reason.map((reason, idx) => (
      <div key={idx} className="flex gap-2">
        <span className="text-blue-500 font-bold">•</span>
        <p className="text-gray-700 text-sm">{reason}</p>
      </div>
    ))}
  </div>
) : (
  <p>{rec.reason}</p>
)}
```

---

## 데이터베이스 스키마

### StyleCombination 모델

```prisma
model StyleCombination {
  id                        String   @id @default(cuid())
  userId                    String
  name                      String
  description               String?
  occasion                  String
  season                    String?
  isAiRecommended           Boolean  @default(false)
  savedAt                   DateTime?        // 저장 시간
  originalRecommendationRank Int?            // 원본 추천 순위
  rating                    Int?
  feedback                  String?
  usedCount                 Int      @default(0)
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  // 관계
  user                      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  items                     CombinationItem[]

  // 인덱스
  @@index([userId, isAiRecommended])
  @@index([userId, savedAt])
}
```

**중요 필드**
- `savedAt`: 저장된 조합만 조회할 때 필터링에 사용
- `originalRecommendationRank`: AI 추천의 순위 추적
- 인덱스: 빠른 조회를 위해 userId + 다른 필드 조합

---

## 성능 최적화

### 1. 인덱싱
```sql
CREATE INDEX "style_combinations_userId_isAiRecommended_idx"
  ON "style_combinations"("userId", "isAiRecommended");

CREATE INDEX "style_combinations_userId_savedAt_idx"
  ON "style_combinations"("userId", "savedAt");
```

**효과**: 사용자별 조합 조회가 O(1)에 가까운 속도로 실행

### 2. 중복 체크 최적화
```typescript
// O(n) 배열 순회 대신 Set 사용
const savedCombinations = new Set([...saved]);
const isDuplicate = savedCombinations.has(normalized);  // O(1)
```

### 3. AI 프롬프트 필터링
```typescript
// DB 조회 1회로 통일
const savedCombinations = await CombinationService.getUniqueCombinations(userId);
// 저장된 조합을 재사용하여 중복 조회 방지
```

---

## 에러 처리

### 중복 저장
```http
400 Bad Request

{
  "success": false,
  "message": "이미 저장된 조합입니다",
  "code": "COMBINATION_ALREADY_SAVED"
}
```

### 빈 결과
```http
200 OK (4개 항목 모두 정상)

{
  "data": [],
  "total": 0,
  "pagination": {
    "page": 1,
    "pages": 1,
    "hasNextPage": false
  }
}
```

→ **404가 아닌 200 반환**: 사용자가 아직 조합을 저장하지 않은 상태는 정상입니다.

---

## 테스트 시나리오

### 시나리오 1: 조합 저장 → 중복 차단
```
1. AI 추천: [상의, 하의, 신발]
2. 사용자가 저장
3. 다시 추천 요청
4. 동일한 조합은 추천되지 않음 ✅
```

### 시나리오 2: 필터링
```
1. 5개 조합 저장 (일상 3개, 출근 2개)
2. 필터: occasion = "출근"
3. 2개만 표시 ✅
```

### 시나리오 3: 페이지네이션
```
1. 25개 조합 저장 (limit=12)
2. Page 1: 12개 표시, hasNextPage=true
3. Page 2: 12개 표시, hasNextPage=true
4. Page 3: 1개 표시, hasNextPage=false ✅
```

---

## 결론

이 기능으로 사용자는:
- ✅ AI 추천을 저장하고 나중에 참고
- ✅ 저장된 조합을 검색 및 필터링
- ✅ 자신의 피드백을 저장하여 스타일 학습에 활용

개발자는:
- ✅ 중복 제거 알고리즘 학습
- ✅ API 설계 및 구현 학습
- ✅ DB 최적화 전략 학습

---

**다음 단계**: Phase 3 [3-4] - 조합 상세 페이지 및 공유 기능

