# 🎯 추천 조합 저장 기능 - 설계 요약

> **Status**: ✅ 설계 완료
> **연관 Linear**: POC-75 (Epic)
> **예상 개발 기간**: 3-4주

---

## 🎨 기능 한눈에 보기

```
[추천 페이지]                      [저장된 조합 페이지]
┌─────────────────────┐            ┌──────────────────┐
│ 추천 조합 #1         │  저장       │ 저장된 조합 목록  │
│ [이미지들]          │ ────────→  │ [조합1]          │
│ ⭐ 별점            │            │ [조합2]          │
│ 💾 저장하기         │            │ [조합3]          │
│                     │            │ 필터/정렬        │
│ 추천 조합 #2         │            │ 삭제/평가        │
│ ...                │            │                 │
└─────────────────────┘            └──────────────────┘
        ↓
    [다시 추천]
        ↓
   저장된 조합은 제외!
```

---

## 📊 시스템 아키텍처 (간단 버전)

```
Frontend                Backend                 Database
├─ RecommendationsPage   ├─ RecommendationService  ├─ MyClothing
│  ├─ 저장 버튼          │  ├─ generateRecos()     ├─ StyleCombination
│  └─ 저장된 배지        │  │  └─ 중복 제거 로직   └─ CombinationItem
│                        │  └─ saveRecso()
├─ SavedCombinationsPage │
│  ├─ 목록 표시          ├─ CombinationService
│  ├─ 필터/정렬          │  ├─ getCombinations()
│  ├─ 삭제               │  ├─ saveCombination()
│  └─ 평가               │  ├─ deleteCombination()
│                        │  └─ updateRating()
└─ API 클라이언트        │
   ├─ saveRecso()        ├─ CombinationController
   ├─ getCombos()        └─ RecommendationController
   └─ deleteCombos()
```

---

## 💾 데이터베이스 변경사항

### **StyleCombination 모델 - 추가 필드**

```diff
model StyleCombination {
  // 기존 필드들...
  id: String @id
  userId: String
  name: String
  description: String?
  isAiRecommended: Boolean @default(false)
  rating: Float?
  feedback: String?

+ // 🔥 새로운 필드
+ savedAt: DateTime?              // 저장한 시간
+ originalRecommendationRank: Int? // 원래 추천 순위 (1,2,3...)

  // 인덱스 추가
  @@index([userId, isAiRecommended])
  @@index([userId, savedAt])
}
```

---

## 🔌 API 설계 (4가지)

### **1️⃣ 조합 저장**

```
POST /api/recommendations/save

요청:
{
  "recommendationRank": 1,
  "recommendationScore": 9.5,
  "combinationItems": [
    {"clothingId": "shirt-1", "layer": 1},
    {"clothingId": "pants-2", "layer": 2},
    {"clothingId": "shoes-3", "layer": 3}
  ],
  "occasion": "데이트",
  "season": "봄",
  "name": "로맨틱 룩"
}

응답 (201):
{
  "success": true,
  "data": {
    "id": "combo-xyz",
    "savedAt": "2025-11-20T10:30:00Z",
    "isAiRecommended": true
  }
}
```

### **2️⃣ 조합 목록 조회**

```
GET /api/combinations?limit=12&offset=0&sort=savedAt&order=desc

응답 (200):
{
  "success": true,
  "data": [
    {
      "id": "combo-1",
      "name": "로맨틱 룩",
      "occasion": "데이트",
      "isAiRecommended": true,
      "savedAt": "2025-11-20T10:30:00Z",
      "rating": null,
      "items": [...]
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 5,
    "pages": 1,
    "hasNextPage": false
  }
}
```

### **3️⃣ 조합 평가**

```
PATCH /api/combinations/{combinationId}/rate

요청:
{
  "rating": 4.5,
  "feedback": "정말 좋았어요!"
}

응답 (200):
{
  "success": true,
  "data": {
    "id": "combo-xyz",
    "rating": 4.5,
    "feedback": "정말 좋았어요!"
  }
}
```

### **4️⃣ 조합 삭제**

```
DELETE /api/combinations/{combinationId}

응답 (200):
{
  "success": true,
  "message": "조합이 삭제되었습니다"
}
```

---

## 🔍 중복 제거 로직 (핵심!)

### **문제**
```
AI가 이미 저장한 조합을 또 추천함
→ 사용자 경험 악화
```

### **해결책**

```typescript
// 1️⃣ 조합을 "정규화" (순서 무관)
function normalizeCombination(clothingIds: string[]): string {
  return clothingIds.sort().join(',');
  // [C, A, B] → "A,B,C"
  // [A, B, C] → "A,B,C" (같음!)
}

// 2️⃣ 저장된 조합들의 정규화된 버전 가져오기
const savedHashes = new Set(
  savedCombinations.map(c => normalizeCombination(c.clothingIds))
);

// 3️⃣ AI 추천 중 저장된 것 제외
const filtered = recommendations.filter(rec =>
  !savedHashes.has(normalizeCombination(rec.clothingIds))
);
```

### **성능 최적화**

```
❌ 매번 DB 조회: 느림
✅ 캐시 사용: 빠름

캐시 전략:
- 키: `combos:user:{userId}`
- TTL: 5분
- 저장 시 캐시 무효화
```

---

## 🎨 UI 변경사항

### **RecommendationsPage**
```
before:                    after:
┌──────────────┐          ┌──────────────┐
│ 추천 조합 #1  │          │ 추천 조합 #1  │
│ [이미지]    │          │ [이미지]    │
│              │    →     │              │
│ ⭐ 별점     │          │ ⭐ 별점     │
│              │          │ 💾 저장하기  │ ← 새로운 버튼
└──────────────┘          └──────────────┘
                           ✅ 저장됨 (저장 후)
```

### **SavedCombinationsPage (새로운 페이지)**
```
/combinations

┌─────────────────────────────────┐
│ 저장된 조합 (5개)               │
├─────────────────────────────────┤
│ [필터] AI추천 | 직접생성        │
│ [정렬] 최신순 | 평점순 | 착용순 │
├─────────────────────────────────┤
│ ┌─────────┐  ┌─────────┐       │
│ │ 조합 #1 │  │ 조합 #2 │       │
│ │ 데이트  │  │ 출근    │       │
│ │ ⭐⭐⭐⭐  │  │ ⭐⭐⭐   │       │
│ │ [평가]  │  │ [평가]  │       │
│ │ [삭제]  │  │ [삭제]  │       │
│ └─────────┘  └─────────┘       │
│ ... 더 많음                     │
└─────────────────────────────────┘
```

---

## 🛠️ 백엔드 구현 계획

### **서비스 레이어 (CombinationService)**

```typescript
class CombinationService {
  // 저장된 조합 조회
  static async getCombinations(userId, filters) {}

  // 조합 저장 (AI 추천에서 사용자 저장으로)
  static async saveRecommendation(userId, items, metadata) {}

  // 조합 삭제
  static async deleteCombination(combinationId, userId) {}

  // 평가 저장
  static async updateRating(combinationId, rating, feedback) {}

  // 저장된 조합 정규화 조회 (필터링용)
  static async getUniqueCombinations(userId) {}
}
```

### **컨트롤러 추가**

```typescript
// CombinationController.ts (새로운 파일)
class CombinationController {
  static async getCombinations() {}    // GET /api/combinations
  static async deleteCombination() {}  // DELETE /api/combinations/:id
  static async updateRating() {}       // PATCH /api/combinations/:id/rate
}

// RecommendationController.ts (수정)
// saveRecommendation() 메서드 추가
static async saveRecommendation() {}   // POST /api/recommendations/save
```

### **중복 제거 로직**

```typescript
// RecommendationService.ts (수정)
// generateRecommendations() 함수 개선

// 기존
const recs = await generateWithAI();
return recs;

// 개선
const recs = await generateWithAI();
const savedCombos = await CombinationService.getUniqueCombinations(userId);
const filtered = filterSavedCombinations(recs, savedCombos);
return filtered;
```

---

## 🎯 프론트엔드 구현 계획

### **수정 파일**

1. **RecommendationsPage.tsx**
   - "저장하기" 버튼 추가
   - 저장된 조합 배지 (✅ 저장됨)
   - API 연동

2. **App.tsx**
   - `/combinations` 라우트 추가

### **새로운 파일**

1. **SavedCombinationsPage.tsx**
   - 저장된 조합 목록 표시
   - 필터링 (AI vs 직접)
   - 정렬 (최신, 평점, 착용)

2. **CombinationCard.tsx**
   - 조합 카드 컴포넌트
   - 삭제/평가 버튼

### **API 클라이언트 추가**

```typescript
// services/api.ts 에 추가

saveRecommendation(items, metadata)  // POST /api/recommendations/save
getCombinations(filters)              // GET /api/combinations
deleteCombination(id)                 // DELETE /api/combinations/:id
updateCombinationRating(id, rating)  // PATCH /api/combinations/:id/rate
```

---

## 📋 구현 체크리스트

### **Phase 1: DB (1-2일)**
- [ ] schema.prisma 수정
- [ ] 마이그레이션 생성 및 실행
- [ ] 인덱스 추가

### **Phase 2: 백엔드 API (3-4일)**
- [ ] CombinationService 생성
- [ ] 중복 제거 함수 구현
- [ ] RecommendationService 수정
- [ ] CombinationController 생성
- [ ] 라우트 등록
- [ ] 테스트 작성

### **Phase 3: 프론트엔드 (2-3일)**
- [ ] RecommendationsPage 수정
- [ ] SavedCombinationsPage 생성
- [ ] CombinationCard 컴포넌트
- [ ] 라우팅 추가
- [ ] API 연동
- [ ] 테스트

### **Phase 4: 통합 (1-2일)**
- [ ] E2E 테스트
- [ ] 성능 측정
- [ ] 버그 수정

---

## 🧪 테스트 시나리오

### **시나리오 1: 저장 및 조회**
1. 추천받기 → 조합 저장 → 저장된 조합 목록에 표시 ✅

### **시나리오 2: 중복 제거**
1. 조합 저장
2. 다시 추천받기
3. 저장한 조합은 제외됨 ✅

### **시나리오 3: 평가 및 삭제**
1. 저장된 조합 평가
2. 저장된 조합 삭제
3. 목록에서 제거됨 ✅

---

## 📈 성능 목표

| 항목 | 목표 |
|------|------|
| 저장 API 응답 | < 500ms |
| 목록 조회 | < 300ms |
| 중복 제거 로직 | < 50ms |
| 캐시 히트율 | > 80% |

---

## 🚀 향후 확장 (Phase 2+)

1. **소셜 공유**: 조합 공유 링크
2. **ML 학습**: 사용자 선호도 학습
3. **자동 추천**: 저장 패턴 기반 추천
4. **인기도**: 많이 저장된 조합 순위

---

## 📞 연관 Issues

| Issue | 제목 |
|-------|------|
| POC-75 | Epic: AI 추천 조합 저장 및 중복 제거 |
| POC-76 | DB 스키마 설계 |
| POC-77 | 중복 제거 로직 |
| POC-78 | 저장 API (백엔드) |
| POC-79 | 목록 조회 API |
| POC-80 | 저장 버튼 UI |
| POC-81 | 저장된 조합 페이지 |
| POC-82 | 통합 테스트 |

---

**작성**: Claude Code
**날짜**: 2025년 11월 20일
**상태**: ✅ 설계 완료
