# Phase 3 [3-4] 스타일 추천 표시 페이지 - 완벽한 이해와 구현

## 📚 학습 목표

이번 Phase에서는 **AI 생성 데이터 활용**, **다중 API 호출 조율**, **비동기 데이터 로딩**을 배우며 실무 수준의 React 패턴을 익힐 수 있습니다:

1. **API 계약 검증** - 백엔드 API 문서 읽기 및 구현 일치 확인
2. **데이터 보강** - 부족한 정보를 추가 API 호출로 채우기
3. **병렬 처리** - 여러 의류의 상세 정보를 효율적으로 로드
4. **상태 관리 복잡도** - 중첩된 데이터 구조 처리
5. **UI 시각화** - 복잡한 데이터를 이해하기 쉽게 표시
6. **평가 시스템** - 사용자 피드백 수집 및 관리
7. **에러 처리** - 다양한 실패 시나리오 대응

---

## 🎯 핵심 개념

### 1. API 계약 분석 및 불일치 해결

**상황**: 기존 코드는 POST 메서드를 사용했지만, 백엔드는 GET 사용

```typescript
// ❌ 잘못된 이해
async getRecommendations(occasion: string) {
  const res = await this.client.post('/recommendations/style', { occasion });
  return res.data;
}

// ✅ 올바른 구현
async getRecommendations(count: number = 1) {
  const queryString = count > 1 ? `?count=${count}` : '';
  const res = await this.client.get(`/recommendations/style${queryString}`);
  return res.data;
}
```

**배운 점**:
- API 문서를 정확히 읽어야 함
- 요청 방식 (GET/POST), 파라미터 위치 (쿼리/바디) 확인 필수
- 테스트로 검증하기

### 2. 데이터 보강 전략

**문제**: API 응답에는 의류 ID와 이름만 있고, 이미지와 색상 정보가 없음

```
API 응답:
{
  combination: [
    { id: "uuid-1", name: "검정 후드티", color: "검정", pattern: "무지", style: ["캐주얼"] }
  ]
}

문제:
- 이미지 없음 → 화면에 표시 불가
- 상세한 색상 정보(colorHex) 없음 → 색상 원형 표시 불가
- 시즌, 용도 정보 없음 → 추가 정보 제공 불가

해결책: 각 의류 ID에 대해 getClothingById() 호출!
```

**구현**:
```typescript
// 1️⃣ 조합에서 의류 ID 추출
const clothingIds = new Set<string>();
recs.forEach((rec: Recommendation) => {
  rec.combination.forEach((item: ClothingItem) => {
    if (item.id) clothingIds.add(item.id);
  });
});

// 2️⃣ 각 ID에 대해 상세 정보 조회
const clothingDetails: ClothingMap = {};
for (const clothingId of clothingIds) {
  try {
    const clothingResponse = await apiClient.getClothingById(clothingId);
    if (clothingResponse.data) {
      clothingDetails[clothingId] = clothingResponse.data;
    }
  } catch (err) {
    console.error(`의류 ${clothingId} 조회 실패:`, err);
  }
}

// 3️⃣ clothingMap에 저장
setClothingMap(clothingDetails);
```

**장점**:
- 각 의류의 완전한 정보 활용 가능
- 이미지, 색상, 상세 설명 모두 표시
- 실패해도 부분적으로 작동

**단점**:
- API 호출 증가 (N개 의류 × M개 추천 = N×M 호출)
- 응답 시간 증가
- 향후 최적화 필요 (캐싱, 배치 요청 등)

### 3. 상태 구조 설계

```typescript
// 📍 다양한 상태들을 명확히 분리
interface ComponentState {
  // 데이터
  recommendations: Recommendation[];        // AI 추천 데이터
  clothingMap: ClothingMap;                 // 의류 상세 정보 (ID → 데이터)

  // UI 제어
  loading: boolean;                         // 로딩 중인가?
  error: string | null;                     // 에러 메시지
  recommendationCount: number;              // 사용자가 선택한 추천 개수
  ratings: { [key: number]: number };       // 각 추천의 평점
}
```

**상태 흐름**:
```
초기화
  ↓ (useEffect)
loading = true
  ↓
API 호출: getRecommendations()
  ↓
recommendations 업데이트
  ↓
각 의류 ID에 대해 getClothingById()
  ↓
clothingMap 업데이트
  ↓
loading = false
  ↓
화면 렌더링
```

### 4. 데이터 타입 정의

```typescript
// 백엔드 응답 데이터
interface ClothingItem {
  id: string;
  name: string;
  color: string;
  pattern: string;
  style: string[];
}

interface Recommendation {
  rank: number;           // 순위: 1, 2, 3...
  score: number;          // AI 평가 점수: 0-10
  reason: string;         // 추천 이유 (AI가 생성한 설명)
  combination: ClothingItem[];  // 조합된 의류들
}

// 의류 상세 정보 (추가 로드)
interface ClothingDetail {
  originalImage: string;  // Base64 또는 URL
  primaryColor: string;
  colorHex: string;       // #FFFFFF 형식
  pattern: string;
  material: string;
  style: string[];
  season: string[];
  occasion: string[];
}

// 조회 맵
type ClothingMap = {
  [clothingId: string]: ClothingDetail;
};
```

### 5. 별점 평가 시스템

```typescript
// 상태: 각 추천(rank)별로 1-5점 기록
const [ratings, setRatings] = useState<{ [key: number]: number }>({});

// 평점 설정
const handleRating = (rankIndex: number, rating: number) => {
  setRatings({
    ...ratings,
    [rankIndex]: rating,
  });
  // TODO: 서버에 저장
};

// UI: 별 렌더링
const renderStars = (rankIndex: number) => {
  const currentRating = ratings[rankIndex] || 0;

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRating(rankIndex, star)}
          className={`text-2xl transition ${
            star <= currentRating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
};
```

**설명**:
- ratings는 `{ 0: 5, 1: 4, 2: 3 }` 형태
- 인덱스(rankIndex)는 0부터 시작
- 별을 클릭하면 해당 점수로 업데이트
- 현재 점수보다 작거나 같은 별은 노란색, 나머지는 회색

---

## 🔍 실제 구현 흐름

### 1단계: 컴포넌트 마운트

```typescript
useEffect(() => {
  loadRecommendations();
}, []);  // 빈 배열 = 마운트 시 한 번만 실행
```

**동작**:
1. 컴포넌트 렌더링
2. useEffect 실행
3. loadRecommendations() 호출 (기본값 count=1)

### 2단계: 추천 데이터 로드

```typescript
const loadRecommendations = async (count: number = recommendationCount) => {
  try {
    setLoading(true);
    setError(null);

    // API 호출
    const response = await apiClient.getRecommendations(count);

    if (response.data && response.data.recommendations) {
      const recs = response.data.recommendations;
      setRecommendations(recs);  // ← 화면에 표시될 데이터

      // 이후 의류 상세 정보 로드...
    }
  } catch (err) {
    // 에러 처리
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

**API 응답 예시**:
```json
{
  "success": true,
  "data": {
    "totalClothes": 10,
    "requestedCount": 1,
    "recommendations": [
      {
        "rank": 1,
        "score": 9.5,
        "reason": "모노톤 조합으로 세련되고 캐주얼 스타일이 통일...",
        "combination": [
          {
            "id": "uuid-1",
            "name": "검정 후드티",
            "color": "검정",
            "pattern": "무지",
            "style": ["캐주얼"]
          }
        ]
      }
    ]
  }
}
```

### 3단계: 의류 상세 정보 로드

```typescript
// 조합에서 의류 ID 수집
const clothingIds = new Set<string>();
recs.forEach((rec: Recommendation) => {
  rec.combination.forEach((item: ClothingItem) => {
    if (item.id) clothingIds.add(item.id);
  });
});

// 예시: clothingIds = { "uuid-1", "uuid-2", "uuid-3" }

// 각 ID의 상세 정보 조회
const clothingDetails: ClothingMap = {};
for (const clothingId of clothingIds) {
  try {
    const clothingResponse = await apiClient.getClothingById(clothingId);
    if (clothingResponse.data) {
      clothingDetails[clothingId] = clothingResponse.data;
      // clothingDetails["uuid-1"] = { originalImage, colorHex, ... }
    }
  } catch (err) {
    console.error(`의류 ${clothingId} 조회 실패:`, err);
  }
}

setClothingMap(clothingDetails);
```

**결과**:
```javascript
clothingMap = {
  "uuid-1": {
    originalImage: "data:image/jpeg;base64,...",
    colorHex: "#000000",
    pattern: "무지",
    style: ["캐주얼"],
    // ... 더 많은 필드
  },
  "uuid-2": { ... },
  "uuid-3": { ... }
}
```

### 4단계: 화면 렌더링

```tsx
// 로딩 중이면 스피너 표시
if (loading && recommendations.length === 0) {
  return <LoadingSpinner />;
}

// 에러 발생하면 에러 메시지
if (error) {
  return <ErrorMessage error={error} />;
}

// 추천들 표시
return (
  <div>
    {/* 제어 패널 */}
    <ControlPanel
      count={recommendationCount}
      onCountChange={handleCountChange}
      onRegenerate={handleRegenerate}
      loading={loading}
    />

    {/* 각 추천 카드 */}
    {recommendations.map((rec, recIndex) => (
      <RecommendationCard
        key={recIndex}
        recommendation={rec}
        clothingMap={clothingMap}
        rating={ratings[recIndex]}
        onRate={(rating) => handleRating(recIndex, rating)}
      />
    ))}
  </div>
);
```

### 5단계: 사용자 상호작용

```typescript
// 추천 개수 변경
const handleCountChange = async (count: number) => {
  setRecommendationCount(count);
  await loadRecommendations(count);
  // 새로운 개수로 추천 재생성
};

// 다시 생성
const handleRegenerate = async () => {
  await loadRecommendations(recommendationCount);
  // 현재 선택된 개수로 새로운 추천 생성
};

// 별점 평가
const handleRating = (rankIndex: number, rating: number) => {
  setRatings({ ...ratings, [rankIndex]: rating });
  // TODO: 나중에 서버에 저장할 때 구현
};
```

---

## 🧠 핵심 학습 포인트

### 1. API 계약의 중요성

```typescript
// ❌ 문서를 읽지 않고 추측
async getRecommendations(occasion) {
  return this.client.post('/recommendations/style', { occasion });
  // 문제: POST가 아니라 GET, occasion이 아니라 count 파라미터
}

// ✅ 문서를 읽고 정확히 구현
async getRecommendations(count = 1) {
  const queryString = count > 1 ? `?count=${count}` : '';
  return this.client.get(`/recommendations/style${queryString}`);
  // 올바름: GET, 쿼리 파라미터
}
```

**배운 점**: 백엔드 API 문서/코드를 정확히 이해하는 것이 가장 중요

### 2. 데이터 부족 대응

```typescript
// ❌ API 응답만 믿고 사용
const clothingCard = (item) => (
  <img src={item.originalImage} />  // undefined!
);

// ✅ 부족한 정보는 추가 API 호출로 보충
const loadRecommendations = async () => {
  const response = await getRecommendations();
  const clothingIds = extractIds(response);
  const details = await Promise.all(
    clothingIds.map(id => getClothingById(id))
  );
  // 이제 이미지, 색상 등 모든 정보 있음
};
```

**배운 점**: 첫 API 호출로 부족하면 추가 호출로 보충

### 3. 복잡한 중첩 데이터 관리

```typescript
// 데이터 구조
recommendations = [
  {
    rank: 1,
    combination: [
      { id: "uuid-1", name: "..." },
      { id: "uuid-2", name: "..." }
    ]
  }
]

clothingMap = {
  "uuid-1": { originalImage, colorHex, ... },
  "uuid-2": { originalImage, colorHex, ... }
}

// 렌더링할 때는 두 데이터를 조합
const clothing = clothingMap[item.id];  // O(1) 조회
```

**배운 점**: 데이터를 Map 구조로 정규화하면 조회가 빠름

### 4. 에러 처리 전략

```typescript
// 전체 실패가 아닌 부분 실패 허용
for (const clothingId of clothingIds) {
  try {
    const response = await getClothingById(clothingId);
    clothingMap[clothingId] = response.data;
  } catch (err) {
    console.error(`${clothingId} 실패:`, err);
    // 계속 진행! (전체 실패하지 않음)
  }
}
```

**배운 점**: 하나의 요청이 실패해도 전체가 실패하지 않도록 설계

---

## 🚀 실제 문제 해결

### 문제 1: API 메서드 불일치로 인한 400 에러
**증상**: getRecommendations() 호출 후 404 또는 405 에러
**원인**: POST 메서드 사용하지만 백엔드는 GET 요구
**해결**: api.ts 수정 - GET으로 변경, count를 쿼리 파라미터로 전달

### 문제 2: 이미지가 표시되지 않음
**증상**: 의류 카드에 이미지 대신 "이미지 없음" 텍스트
**원인**: combination 응답에는 id만 있고 originalImage 필드 없음
**해결**: 각 id에 대해 getClothingById() 호출해서 clothingMap 채우기

### 문제 3: 의류가 3개 미만일 때 에러 메시지
**증상**: error 상태에 "최소 3개 이상의 옷이 필요합니다" 메시지
**원인**: 옷장에 의류가 부족
**해결**: 에러 메시지를 읽기 쉽게 표시, 안내문 추가

---

## 📋 개발 체크리스트

- [x] 백엔드 API 분석
  - [x] 엔드포인트: GET /api/recommendations/style
  - [x] 쿼리 파라미터: count (1-10)
  - [x] 응답 구조: recommendations[].rank, score, reason, combination[]

- [x] 프론트엔드 구현
  - [x] API 클라이언트 수정 (POST → GET)
  - [x] RecommendationsPage 컴포넌트 생성
  - [x] 상태 관리 설계 및 구현
  - [x] 데이터 로드 (useEffect)
  - [x] 데이터 보강 (clothingMap)

- [x] UI 구현
  - [x] 제어 패널 (추천 개수 선택, 다시 생성)
  - [x] 추천 카드 (순위, 점수, 설명)
  - [x] 의류 그리드 (이미지, 색상, 스타일)
  - [x] 별점 평가 시스템
  - [x] 로딩 스피너
  - [x] 에러 메시지

- [x] 라우트 등록
  - [x] App.tsx에 /recommendations 추가
  - [x] ProtectedRoute 적용

---

## 🎓 추가 학습 자료

### 병렬 처리 최적화 (향후)
```typescript
// 현재: 순차 처리 (느림)
for (const clothingId of clothingIds) {
  const response = await getClothingById(clothingId);  // 차례로 대기
}

// 개선: 병렬 처리 (빠름)
const details = await Promise.all(
  Array.from(clothingIds).map(id => getClothingById(id))
);
// 모든 요청을 동시에 보냄
```

### 캐싱으로 성능 개선 (향후)
```typescript
// 의류 캐시
const clothingCache = useRef<ClothingMap>({});

const getClothingDetail = async (id: string) => {
  // 캐시에 있으면 캐시에서 반환
  if (clothingCache.current[id]) {
    return clothingCache.current[id];
  }

  // 없으면 API 호출
  const response = await apiClient.getClothingById(id);
  clothingCache.current[id] = response.data;
  return response.data;
};
```

---

## 🔗 관련 코드 위치

**백엔드**:
- `backend/src/controllers/recommendation.controller.ts` - getStyleRecommendations 엔드포인트
- `backend/src/services/recommendation.service.ts` - 추천 생성 로직, AI 호출
- `backend/src/routes/recommendation.routes.ts` - API 라우트 및 상세 문서화

**프론트엔드**:
- `frontend/src/services/api.ts:117-120` - getRecommendations() 메서드
- `frontend/src/pages/RecommendationsPage.tsx` - 메인 컴포넌트 (400+ 줄)
  - 상태 관리
  - loadRecommendations() 함수
  - renderClothingItem() 함수
  - renderStars() 함수
- `frontend/src/App.tsx:8, 102-109` - 라우트 등록

**네비게이션**:
- `frontend/src/pages/DashboardPage.tsx:118` - "스타일 추천" 카드 → /recommendations

---

## 결론

Phase 3 [3-4] "스타일 추천 표시 페이지"를 통해 배운 것:

### 핵심 스킬
1. **API 계약 검증** - 문서와 실제 구현 일치 확인
2. **데이터 보강** - 부족한 정보를 추가 API로 채우기
3. **복잡한 상태 관리** - 중첩된 데이터 구조 다루기
4. **비동기 처리** - 여러 API 호출 조율
5. **에러 처리** - 다양한 실패 시나리오 대응

### 실무 패턴
- API 호출 후 데이터 검증
- 데이터 정규화 (Map 구조 활용)
- 부분 실패 허용 (graceful degradation)
- 사용자 피드백 수집 시스템

### 다음 단계
- **Phase 3 [3-5]**: 평가 데이터 저장 (POST /api/recommendations/rating)
- **Phase 4**: 평가 이력 조회, 즐겨찾기, 공유 기능

이러한 패턴들은 향후 더 복잡한 기능을 구현할 때 든든한 기반이 될 것입니다!

