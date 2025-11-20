# 🎨 추천 조합 저장 기능 설계 문서

> **작성일**: 2025년 11월 20일
> **버전**: 1.0.0
> **상태**: 설계 완료 ✅
> **관련 Linear Issue**: POC-75, POC-76, POC-77

---

## 📋 목차

1. [기능 개요](#기능-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [데이터베이스 스키마](#데이터베이스-스키마)
4. [API 설계](#api-설계)
5. [중복 제거 로직](#중복-제거-로직)
6. [프론트엔드 UI](#프론트엔드-ui)
7. [구현 순서](#구현-순서)

---

## 🎯 기능 개요

### **요구사항**

```
1️⃣ 사용자가 AI 추천 조합을 저장할 수 있다
2️⃣ 이미 저장된 조합은 다시 추천되지 않는다
3️⃣ 저장된 조합 목록을 조회할 수 있다
4️⃣ 저장된 조합을 삭제할 수 있다
5️⃣ 저장된 조합을 평가할 수 있다
```

### **사용자 흐름**

```
1️⃣ 스타일 추천 페이지 방문
        ↓
2️⃣ AI가 5개 조합 추천
        ↓
3️⃣ 마음에 드는 조합 → "저장하기" 버튼 클릭
        ↓
4️⃣ 저장 완료 알림 표시
        ↓
5️⃣ "저장된 조합" 페이지에서 조회 가능
        ↓
6️⃣ 다시 추천받을 때 저장된 조합은 제외
```

---

## 🏗️ 시스템 아키텍처

### **개요**

```
프론트엔드
├─ RecommendationsPage
│  └─ [저장하기 버튼] → POST /api/recommendations/save
│
├─ SavedCombinationsPage (새로운 페이지)
│  └─ 저장된 조합 목록 조회 → GET /api/combinations
│
백엔드
├─ RecommendationController
│  ├─ saveRecommendation()
│  └─ getRecommendationStatus()
│
├─ CombinationController
│  ├─ getCombinations()
│  ├─ deleteCombination()
│  └─ updateCombination()
│
├─ RecommendationService
│  ├─ generateRecommendations() [개선]
│  │  └─ 저장된 조합 필터링
│  └─ saveRecommendation() [새로운 메서드]
│
├─ CombinationService [새로운 서비스]
│  ├─ getCombinations()
│  ├─ deleteCombination()
│  ├─ updateRating()
│  └─ getUniqueCombinations()
│
데이터베이스
├─ StyleCombination 테이블 [수정]
│  └─ isAiRecommended 필드 추가
│
└─ CombinationItem [기존]
   └─ 의류 조합 저장
```

---

## 💾 데이터베이스 스키마

### **현재 상태**

```prisma
model StyleCombination {
  id                  String   @id @default(uuid())
  userId              String
  user                User     @relation(...)

  name                String
  description         String?
  occasion            String
  season              String?

  visualizationImage  String?

  isAiRecommended     Boolean @default(false)  // ← 이미 있음! ✅

  rating              Float?
  feedback            String?

  usedCount           Int @default(0)
  lastUsedAt          DateTime?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  items               CombinationItem[]

  @@map("style_combinations")
}
```

### **필요한 추가 필드**

```prisma
model StyleCombination {
  // ... 기존 필드들

  // 🔥 추가 필드
  savedAt             DateTime?  // 저장된 시간 (AI 추천에서 저장으로 전환)
  originalRecommendationRank Int? // 원래 추천 순위 (1,2,3,4,5 등)

  @@index([userId, isAiRecommended])  // 조회 성능 최적화
  @@index([userId, savedAt])          // 저장된 조합 조회
}
```

### **마이그레이션 SQL**

```sql
-- 필드 추가
ALTER TABLE "style_combinations"
ADD COLUMN "savedAt" TIMESTAMP,
ADD COLUMN "originalRecommendationRank" INTEGER;

-- 인덱스 추가
CREATE INDEX "idx_style_combinations_user_ai"
ON "style_combinations"(userId, isAiRecommended);

CREATE INDEX "idx_style_combinations_user_saved"
ON "style_combinations"(userId, savedAt);
```

---

## 🔌 API 설계

### **1️⃣ 추천 조합 저장**

```http
POST /api/recommendations/save
Content-Type: application/json
Authorization: Bearer {token}

{
  "recommendationRank": 1,
  "recommendationScore": 9.5,
  "combinationItems": [
    { "clothingId": "clothing-1", "layer": 1 },
    { "clothingId": "clothing-2", "layer": 2 },
    { "clothingId": "clothing-3", "layer": 3 }
  ],
  "occasion": "데이트",
  "season": "봄",
  "name": "로맨틱 봄 데이트 룩"  // 선택
}
```

**응답 (201 Created)**:

```json
{
  "success": true,
  "message": "조합이 저장되었습니다",
  "data": {
    "id": "combination-xyz",
    "userId": "user-123",
    "name": "로맨틱 봄 데이트 룩",
    "isAiRecommended": true,
    "savedAt": "2025-11-20T10:30:00Z",
    "originalRecommendationRank": 1,
    "rating": null,
    "items": [
      {
        "clothingId": "clothing-1",
        "name": "분홍색 셔츠",
        "layer": 1
      },
      // ...
    ]
  }
}
```

**에러 응답**:

```json
{
  "success": false,
  "message": "조합이 이미 저장되어 있습니다",
  "code": "COMBINATION_ALREADY_SAVED"
}
```

---

### **2️⃣ 저장된 조합 목록 조회**

```http
GET /api/combinations?limit=12&offset=0&sort=savedAt&order=desc
Authorization: Bearer {token}
```

**응답 (200 OK)**:

```json
{
  "success": true,
  "message": "조합 목록 조회 성공",
  "data": [
    {
      "id": "combination-1",
      "name": "로맨틱 봄 데이트 룩",
      "occasion": "데이트",
      "season": "봄",
      "isAiRecommended": true,
      "savedAt": "2025-11-20T10:30:00Z",
      "originalRecommendationRank": 1,
      "rating": null,
      "usedCount": 0,
      "items": [
        {
          "clothingId": "clothing-1",
          "name": "분홍색 셔츠",
          "primaryColor": "#FF69B4",
          "layer": 1
        },
        // ...
      ]
    },
    // ... 더 많은 조합
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 5,
    "pages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### **3️⃣ 조합 평가**

```http
PATCH /api/combinations/{combinationId}/rate
Content-Type: application/json
Authorization: Bearer {token}

{
  "rating": 4.5,
  "feedback": "정말 마음에 들었어요! 다만 색감이 좀 더 밝으면..."
}
```

**응답**:

```json
{
  "success": true,
  "message": "평가가 저장되었습니다",
  "data": {
    "id": "combination-xyz",
    "rating": 4.5,
    "feedback": "정말 마음에 들었어요!..."
  }
}
```

---

### **4️⃣ 조합 삭제**

```http
DELETE /api/combinations/{combinationId}
Authorization: Bearer {token}
```

**응답**:

```json
{
  "success": true,
  "message": "조합이 삭제되었습니다"
}
```

---

## 🔍 중복 제거 로직

### **핵심 알고리즘**

#### **문제**: AI가 같은 조합을 다시 추천하는 경우

```
사용자 옷장: [셔츠A, 바지B, 신발C, ...]

1️⃣ 첫 번째 추천
   - 조합 1: [셔츠A + 바지B + 신발C] ← 사용자가 저장함

2️⃣ 두 번째 추천 (다시 생성)
   - 조합 1: [셔츠A + 바지B + 신발C] ← 같은 조합! 😞
   - 조합 2: [셔츠D + 바지E + 신발F]
   - ...

해결책 필요!
```

### **해결 방안: 조합 정규화 및 비교**

```typescript
// 1️⃣ 조합을 정규화 (순서 상관없이 비교)
function normalizeCombination(clothingIds: string[]): string {
  // 정렬 후 JSON 문자열로 변환
  // [C, A, B] → "ABC"
  return clothingIds.sort().join(',');
}

// 2️⃣ 저장된 조합 조회
const savedCombinations = await db.StyleCombination.findMany({
  where: {
    userId: userId,
    isAiRecommended: true,
    savedAt: { not: null }  // 저장된 것만
  },
  select: {
    id: true,
    items: {
      select: { clothingId: true }
    }
  }
});

// 3️⃣ 정규화된 조합 집합 생성
const savedCombinationHashes = new Set(
  savedCombinations.map(combo =>
    normalizeCombination(combo.items.map(item => item.clothingId))
  )
);

// 4️⃣ AI 추천에서 저장된 조합 필터링
const recommendations = getAiRecommendations();

const filteredRecommendations = recommendations.filter(rec => {
  const hash = normalizeCombination(rec.combinationIds);
  return !savedCombinationHashes.has(hash);
});

// 5️⃣ 결과 반환
return filteredRecommendations;
```

### **성능 최적화**

#### **문제**: 매번 모든 저장된 조합을 로드하면 느림

```
저장된 조합: 100개
추천할 때마다: 100개 다 로드 + 비교 = 느림! ❌
```

#### **해결책 1: 캐싱**

```typescript
// 캐시 키: `combinations:user:{userId}`
// TTL: 5분 (이 시간 내 저장된 조합은 리플레시)

const cacheKey = `combinations:user:${userId}`;
let savedCombinationHashes = cache.get(cacheKey);

if (!savedCombinationHashes) {
  const combinations = await db.query(...);
  savedCombinationHashes = new Set(...);
  cache.set(cacheKey, savedCombinationHashes, 300); // 5분
}

// 저장 시 캐시 무효화
async function saveRecommendation(userId, ...) {
  // 저장 로직
  cache.invalidate(`combinations:user:${userId}`);
}
```

#### **해결책 2: 데이터베이스 인덱싱**

```sql
-- 저장된 조합만 빠르게 조회
CREATE INDEX "idx_saved_combinations"
ON "style_combinations"(userId, savedAt DESC)
WHERE "isAiRecommended" = true AND "savedAt" IS NOT NULL;

-- 쿼리 최적화
SELECT id, items FROM style_combinations
WHERE userId = $1
  AND isAiRecommended = true
  AND savedAt IS NOT NULL
ORDER BY savedAt DESC;
```

---

## 🎨 프론트엔드 UI

### **1️⃣ RecommendationsPage 수정**

#### **Before**

```typescript
// 각 추천 조합 카드
<div key={recIndex}>
  <h2>추천 조합 #{rec.rank}</h2>
  <p>점수: {rec.score}/10</p>
  <div>의류들 표시</div>
  {/* 평가 섹션 */}
</div>
```

#### **After**

```typescript
// 각 추천 조합 카드
<div key={recIndex} className="recommendation-card">
  <h2>추천 조합 #{rec.rank}</h2>
  <p>점수: {rec.score}/10</p>
  <div>의류들 표시</div>

  {/* 🔥 새로운: 저장 섹션 */}
  <div className="save-section">
    {rec.isSaved ? (
      <div className="saved-badge">✅ 저장됨</div>
    ) : (
      <button
        onClick={() => saveRecommendation(rec)}
        className="btn btn-primary"
      >
        💾 저장하기
      </button>
    )}
  </div>

  {/* 평가 섹션 */}
  <div className="rating-section">
    <p>이 조합은 어떤가요?</p>
    <StarRating onRate={(rating) => rateRecommendation(rec, rating)} />
  </div>
</div>
```

### **2️⃣ SavedCombinationsPage (새로운 페이지)**

```typescript
// /combinations 라우트

function SavedCombinationsPage() {
  const [combinations, setCombinations] = useState([]);
  const [filter, setFilter] = useState('all'); // all, ai, manual
  const [sort, setSort] = useState('savedAt'); // savedAt, rating, name

  useEffect(() => {
    loadCombinations();
  }, [filter, sort]);

  const loadCombinations = async () => {
    const response = await apiClient.getCombinations({
      isAiRecommended: filter === 'ai' ? true : filter === 'manual' ? false : null,
      sort,
      limit: 12
    });
    setCombinations(response.data);
  };

  return (
    <div className="saved-combinations-page">
      <h1>저장된 조합</h1>

      {/* 필터 */}
      <div className="filters">
        <button onClick={() => setFilter('all')}>
          전체 ({totalCount})
        </button>
        <button onClick={() => setFilter('ai')}>
          AI 추천 ({aiCount})
        </button>
        <button onClick={() => setFilter('manual')}>
          직접 생성 ({manualCount})
        </button>
      </div>

      {/* 정렬 */}
      <div className="sort">
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="savedAt">최신순</option>
          <option value="rating">평점순</option>
          <option value="usedCount">착용순</option>
        </select>
      </div>

      {/* 조합 그리드 */}
      <div className="combinations-grid">
        {combinations.map(combo => (
          <CombinationCard
            key={combo.id}
            combination={combo}
            onDelete={() => deleteCombination(combo.id)}
            onRate={(rating) => rateReombination(combo.id, rating)}
          />
        ))}
      </div>

      {/* 페이지네이션 */}
      <Pagination {...pagination} />
    </div>
  );
}
```

### **3️⃣ CombinationCard 컴포넌트**

```typescript
function CombinationCard({ combination, onDelete, onRate }) {
  return (
    <div className="combination-card">
      {/* 헤더 */}
      <div className="card-header">
        <h3>{combination.name || `${combination.occasion} 룩`}</h3>
        {combination.isAiRecommended && (
          <badge className="ai-badge">🤖 AI 추천</badge>
        )}
      </div>

      {/* 의류 그리드 */}
      <div className="clothing-grid">
        {combination.items.map(item => (
          <ClothingItem key={item.clothingId} item={item} />
        ))}
      </div>

      {/* 정보 */}
      <div className="info">
        <span>📍 {combination.occasion}</span>
        <span>🌸 {combination.season}</span>
        {combination.rating && (
          <span>⭐ {combination.rating}/5</span>
        )}
      </div>

      {/* 액션 */}
      <div className="actions">
        <button onClick={() => onRate()}>⭐ 평가</button>
        <button onClick={() => onDelete()}>🗑️ 삭제</button>
      </div>
    </div>
  );
}
```

---

## 📊 데이터 흐름 다이어그램

### **저장 흐름**

```
사용자가 "저장하기" 클릭
      ↓
POST /api/recommendations/save
{
  clothingIds: [C1, C2, C3],
  occasion: "데이트"
}
      ↓
백엔드: RecommendationController.saveRecommendation()
      ↓
1️⃣ 유효성 검증 (의류가 존재하는지)
2️⃣ 중복 체크 (이미 저장된 조합인지)
3️⃣ StyleCombination 레코드 생성
   - isAiRecommended: true
   - savedAt: now()
4️⃣ CombinationItem 레코드들 생성
5️⃣ 캐시 무효화
      ↓
응답 반환 (201 Created)
      ↓
프론트: 토스트 메시지 표시 "✅ 조합이 저장되었습니다"
      ↓
RecommendationsPage 새로고침 (저장된 조합 배지 표시)
```

### **필터링 흐름**

```
사용자가 추천 요청
      ↓
GET /api/recommendations/style?count=5
      ↓
백엔드: RecommendationService.generateRecommendations()
      ↓
1️⃣ 사용자 옷장 조회
2️⃣ AI가 추천할 조합 생성
      ↓
3️⃣ 저장된 조합 조회
   SELECT id, items FROM style_combinations
   WHERE userId = $1 AND savedAt IS NOT NULL
      ↓
4️⃣ AI 추천 조합과 저장된 조합 비교
   - 정규화: [C1, C2, C3] → "C1,C2,C3"
   - Set에서 중복 체크
      ↓
5️⃣ 중복 제거된 추천 반환
   (새로운 조합들만 → count개)
      ↓
프론트: 새로운 5개 조합 표시
        (이전에 저장한 조합은 없음)
```

---

## 🔧 구현 순서

### **Phase 1: 데이터베이스 (1-2일)**

- [ ] Prisma schema 업데이트 (savedAt, originalRecommendationRank)
- [ ] 마이그레이션 스크립트 작성
- [ ] 인덱스 추가
- [ ] `npm run prisma:migrate` 실행

### **Phase 2: 백엔드 API (3-4일)**

**Step 1: 서비스 레이어**
- [ ] CombinationService 생성 (새로운 파일)
  - `getCombinations(userId, filters)`
  - `saveRecommendation(userId, items, metadata)`
  - `deleteCombination(combinationId, userId)`
  - `updateRating(combinationId, rating, feedback)`
  - `getUniqueCombinations(userId)` (저장된 조합 정규화 조회)

**Step 2: 중복 제거 로직**
- [ ] `normalizeCombination()` 함수 작성
- [ ] `filterSavedCombinations()` 함수 작성
- [ ] RecommendationService.generateRecommendations() 수정
  - 저장된 조합 필터링 추가

**Step 3: 컨트롤러 & 라우트**
- [ ] RecommendationController.saveRecommendation() 추가
- [ ] CombinationController 생성
  - `getCombinations()`
  - `deleteCombination()`
  - `updateRating()`
- [ ] 라우트 등록
  - POST /api/recommendations/save
  - GET /api/combinations
  - DELETE /api/combinations/:id
  - PATCH /api/combinations/:id/rate

**Step 4: 테스트**
- [ ] 단위 테스트 (normalizeCombination, filterSavedCombinations)
- [ ] API 통합 테스트 (Postman/Thunder Client)

### **Phase 3: 프론트엔드 (2-3일)**

**Step 1: RecommendationsPage 수정**
- [ ] "저장하기" 버튼 추가
- [ ] saveRecommendation() 함수 구현
- [ ] 저장 완료 토스트 메시지
- [ ] 저장 상태 배지 (✅ 저장됨)

**Step 2: SavedCombinationsPage 생성**
- [ ] 새로운 페이지 컴포넌트 작성
- [ ] CombinationCard 컴포넌트 작성
- [ ] 조합 목록 조회 로직
- [ ] 필터링 (AI 추천 vs 직접 생성)
- [ ] 정렬 (최신순, 평점순, 착용순)
- [ ] 삭제 기능
- [ ] 평가 기능

**Step 3: 라우팅**
- [ ] /combinations 라우트 추가
- [ ] 네비게이션 바에 링크 추가

**Step 4: 테스트**
- [ ] 저장 기능 테스트
- [ ] 목록 조회 테스트
- [ ] 필터링/정렬 테스트
- [ ] 중복 제거 동작 확인

### **Phase 4: 통합 & 최적화 (1-2일)**

- [ ] E2E 테스트 (추천 → 저장 → 조회 → 제외)
- [ ] 성능 측정 (쿼리 속도, 캐시 히트율)
- [ ] 캐시 구현 (Redis 또는 메모리)
- [ ] 버그 수정

---

## 📈 성능 목표

| 항목 | 목표 | 측정 방법 |
|------|------|---------|
| 저장 API 응답 시간 | < 500ms | Postman 응답 시간 |
| 조합 목록 조회 | < 300ms | Database query 프로파일링 |
| 중복 제거 로직 | < 50ms | 저장된 조합 1000개 기준 |
| 캐시 히트율 | > 80% | 로그 분석 |

---

## 🧪 테스트 시나리오

### **Scenario 1: 조합 저장 및 조회**

```
1. 사용자가 추천 조합 1번 저장
   POST /api/recommendations/save
   → 응답: {id: "combination-1", savedAt: "..."}

2. 저장된 조합 조회
   GET /api/combinations
   → 응답: [{id: "combination-1", ...}]

3. 다시 추천 요청
   GET /api/recommendations/style?count=5
   → 응답: 5개의 NEW 조합 (combination-1 제외)
```

### **Scenario 2: 중복 방지**

```
1. 저장된 조합: [셔츠A, 바지B, 신발C]
2. 다시 추천받음
3. AI가 [셔츠A, 바지B, 신발C] 추천 시도
   → 필터링됨 (제외)
4. 다른 조합 추천됨
```

### **Scenario 3: 평가 및 삭제**

```
1. 저장된 조합 평가
   PATCH /api/combinations/{id}/rate
   {rating: 4.5, feedback: "..."}
   → DB 업데이트

2. 저장된 조합 삭제
   DELETE /api/combinations/{id}
   → DB에서 삭제 (soft delete 고려)
```

---

## 📝 구현 체크리스트

### **데이터베이스**
- [ ] schema.prisma 수정
- [ ] 마이그레이션 파일 생성
- [ ] 인덱스 생성 SQL 실행

### **백엔드 - 서비스**
- [ ] CombinationService.ts 생성
- [ ] normalizeCombination() 함수
- [ ] filterSavedCombinations() 함수
- [ ] RecommendationService 수정

### **백엔드 - 컨트롤러**
- [ ] RecommendationController.saveRecommendation() 추가
- [ ] CombinationController.ts 생성
- [ ] 에러 처리 추가

### **백엔드 - 라우트**
- [ ] 라우트 등록
- [ ] 미들웨어 적용 (인증)

### **프론트엔드 - RecommendationsPage**
- [ ] 저장 버튼 UI
- [ ] API 연동
- [ ] 토스트 메시지
- [ ] 저장 상태 표시

### **프론트엔드 - SavedCombinationsPage**
- [ ] 페이지 컴포넌트 작성
- [ ] CombinationCard 컴포넌트
- [ ] 목록 조회
- [ ] 필터링/정렬
- [ ] 삭제/평가 기능

### **테스트**
- [ ] 단위 테스트
- [ ] API 테스트
- [ ] E2E 테스트
- [ ] 성능 테스트

---

## 🚀 향후 고도화 (Phase 2+)

### **1️⃣ 자동 공유**
```
사용자가 조합을 저장하면 → 자동으로 추천 피드에 공유
(다른 사용자들에게 인기 조합 추천)
```

### **2️⃣ 소셜 기능**
```
저장된 조합 공유 → 링크로 친구들과 공유
```

### **3️⃣ ML 학습**
```
사용자가 저장한 조합 패턴 → AI 추천 개선
(이 사용자는 어떤 색상 조합을 좋아하나?)
```

### **4️⃣ Webhooks**
```
조합 저장 시 → 외부 서비스에 알림
(예: 쇼핑 앱, SNS 연동)
```

---

**작성자**: Pocket Closet 팀
**검토자**: (TBD)
**마지막 수정**: 2025년 11월 20일
**상태**: ✅ 설계 완료, 구현 준비 완료
