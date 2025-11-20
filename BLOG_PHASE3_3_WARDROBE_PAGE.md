# Phase 3 [3-3] 필터링이 있는 옷장 표시 (WardrobePage) - 완벽한 이해와 구현

## 📚 학습 목표

이번 Phase에서는 **복잡한 필터링 로직**, **상태 관리**, **모달 상호작용**을 다루는 완전한 페이지 구현을 통해 다음을 배울 수 있습니다:

1. **다중 필터 조합 로직** - AND/OR 조건 구현
2. **동적 필터 옵션 생성** - 로드된 데이터에서 동적으로 필터 값 추출
3. **페이지네이션 구현** - 오프셋 기반 페이징
4. **복잡한 React 상태 관리** - 여러 상태의 조화로운 관리
5. **모달 시스템** - 다중 모달 동시 관리 (상세보기, 삭제 확인)
6. **반응형 디자인** - Tailwind CSS 그리드 활용
7. **Error Handling** - 네트워크 에러 및 사용자 피드백

---

## 🎯 핵심 개념

### 1. 필터 로직의 이해

**문제**: "사용자가 여러 필터를 동시에 적용했을 때, 어떤 의류를 보여줄 것인가?"

**해결책**:

```
검색어 (Search) → 재질 (Material) → 색상 (Color) → 스타일 (Style) → 용도 (Occasion)

각 단계에서:
- 검색어: "셔츠" 포함하는 아이템만
- 재질: 선택된 재질 중 하나 (cotton OR polyester)
- 색상: 선택된 색상 중 하나 (white OR blue)
- 스타일: 선택된 스타일 중 하나 (casual OR minimalist)
- 용도: 선택된 용도 중 하나 (daily OR office)

최종: (검색어) AND (재질 OR) AND (색상 OR) AND (스타일 OR) AND (용도 OR)
```

**코드 구현**:
```typescript
// 1단계: 검색으로 필터링
let result = clothes.filter(item =>
  item.name.toLowerCase().includes(searchQuery.toLowerCase())
);

// 2단계: 재질로 필터링 (선택된 재질이 있으면)
if (selectedMaterials.length > 0) {
  result = result.filter(item =>
    selectedMaterials.includes(item.material)
  );
}

// 3단계: 색상으로 필터링 (선택된 색상이 있으면)
if (selectedColors.length > 0) {
  result = result.filter(item =>
    selectedColors.includes(item.primaryColor)
  );
}

// 4단계: 스타일로 필터링 (배열 교집합)
if (selectedStyles.length > 0) {
  result = result.filter(item =>
    item.style.some(s => selectedStyles.includes(s))
  );
}

// 5단계: 용도로 필터링 (배열 교집합)
if (selectedOccasions.length > 0) {
  result = result.filter(item =>
    item.occasion.some(o => selectedOccasions.includes(o))
  );
}
```

### 2. 동적 필터 옵션 생성

**문제**: "색상, 재질, 스타일, 용도의 옵션들을 어디서 가져올까?"

**해결책**: 로드된 의류 데이터에서 동적으로 추출!

```typescript
// 색상 옵션 추출
const materialOptions = useMemo(() => {
  const materials = new Set(clothes.map(c => c.material));
  return Array.from(materials).sort();
}, [clothes]);

// 스타일 옵션 추출 (배열이므로 flatMap 필요)
const styleOptions = useMemo(() => {
  const styles = new Set(clothes.flatMap(c => c.style));
  return Array.from(styles).sort();
}, [clothes]);
```

**장점**:
- 하드코딩된 옵션 불필요
- 데이터가 변하면 자동으로 업데이트
- 존재하는 옵션만 표시

### 3. 페이지네이션의 이해

**문제**: "12개씩 여러 페이지로 나누려면?"

**해결책**:
```typescript
// 페이지 크기와 현재 페이지로 시작/종료 인덱스 계산
const pageSize = 12;
const startIndex = (currentPage - 1) * pageSize;
const endIndex = startIndex + pageSize;

// 필터링된 의류 중 현재 페이지에 해당하는 부분만 추출
const paginatedClothes = useMemo(() => {
  return filteredClothes.slice(startIndex, endIndex);
}, [filteredClothes, currentPage, pageSize]);

// 전체 페이지 수 계산
const totalPages = Math.ceil(filteredClothes.length / pageSize);
```

**주의점**:
- 필터링 후에 페이지네이션 (filteredClothes를 기준)
- 새로운 필터 적용 시 페이지 1로 리셋 필요

### 4. React 상태 관리 전략

```typescript
// 📍 데이터 상태
const [clothes, setClothes] = useState<Clothing[]>([]);          // 로드된 전체 데이터
const [filteredClothes, setFilteredClothes] = useState<Clothing[]>([]);  // 필터 적용 후

// 📍 필터 상태
const [searchQuery, setSearchQuery] = useState('');              // 검색어
const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
const [selectedColors, setSelectedColors] = useState<string[]>([]);
const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);

// 📍 페이지네이션 상태
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(12);

// 📍 모달 상태
const [selectedClothing, setSelectedClothing] = useState<Clothing | null>(null);
const [showDetailModal, setShowDetailModal] = useState(false);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

// 📍 로딩/에러 상태
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**상태 흐름**:
```
초기 로드
  ↓
clothes 업데이트 → filteredClothes 자동 업데이트 (useEffect)
  ↓
필터 상태 변경 → filteredClothes 자동 업데이트 (useEffect)
  ↓
filteredClothes → paginatedClothes (useMemo)
  ↓
화면 렌더링
```

### 5. 모달 시스템 관리

**상세 모달**:
```typescript
const handleSelectClothing = (item: Clothing) => {
  setSelectedClothing(item);
  setShowDetailModal(true);
};

const closeDetailModal = () => {
  setShowDetailModal(false);
  setSelectedClothing(null);
};
```

**삭제 확인 모달**:
```typescript
const handleDeleteClick = () => {
  setShowDeleteConfirm(true);
};

const handleConfirmDelete = async () => {
  if (!selectedClothing) return;

  try {
    await apiClient.deleteClothing(selectedClothing.id);
    setClothes(clothes.filter(c => c.id !== selectedClothing.id));
    setShowDeleteConfirm(false);
    setShowDetailModal(false);
  } catch (error) {
    setError('삭제 실패');
  }
};
```

---

## 🔍 실제 구현 흐름

### 1단계: 초기화 및 데이터 로드

```typescript
useEffect(() => {
  loadClothes();
}, []); // 마운트 시 한 번만 실행

const loadClothes = async () => {
  try {
    setLoading(true);
    const response = await apiClient.getClothing();
    setClothes(response.data);
    setError(null);
  } catch (error) {
    setError('의류 로드 실패');
  } finally {
    setLoading(false);
  }
};
```

**동작**:
1. 컴포넌트 마운트
2. loadClothes() 호출
3. API 요청 (GET /api/clothing)
4. 응답 받아 clothes 상태 업데이트
5. 자동으로 필터 useEffect 트리거

### 2단계: 필터링 로직 실행

```typescript
useEffect(() => {
  let result = clothes;

  // 검색 필터
  if (searchQuery) {
    result = result.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // 재질 필터
  if (selectedMaterials.length > 0) {
    result = result.filter(item =>
      selectedMaterials.includes(item.material)
    );
  }

  // 색상 필터
  if (selectedColors.length > 0) {
    result = result.filter(item =>
      selectedColors.includes(item.primaryColor)
    );
  }

  // 스타일 필터
  if (selectedStyles.length > 0) {
    result = result.filter(item =>
      item.style.some(s => selectedStyles.includes(s))
    );
  }

  // 용도 필터
  if (selectedOccasions.length > 0) {
    result = result.filter(item =>
      item.occasion.some(o => selectedOccasions.includes(o))
    );
  }

  setFilteredClothes(result);
  setCurrentPage(1); // 새로운 필터 적용 시 페이지 1로 리셋
}, [clothes, searchQuery, selectedMaterials, selectedColors, selectedStyles, selectedOccasions]);
```

**주의점**:
- 모든 필터 변경이 의존성 배열에 포함됨
- 필터 적용 후 currentPage를 1로 리셋하는 이유: 이전 페이지가 존재하지 않을 수 있음

### 3단계: 페이지네이션 계산

```typescript
const paginatedClothes = useMemo(() => {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return filteredClothes.slice(startIndex, endIndex);
}, [filteredClothes, currentPage, pageSize]);

const totalPages = Math.ceil(filteredClothes.length / pageSize);
```

### 4단계: 화면 렌더링

**그리드 레이아웃**:
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {paginatedClothes.map(item => (
    <div
      key={item.id}
      className="bg-white rounded-lg shadow cursor-pointer hover:shadow-lg transition"
      onClick={() => handleSelectClothing(item)}
    >
      <img src={item.originalImage} alt={item.name} className="w-full h-40 object-cover rounded-t-lg" />
      <div className="p-3">
        <h3 className="font-semibold text-sm">{item.name}</h3>
        <div className="w-6 h-6 rounded-full mt-2" style={{backgroundColor: item.colorHex}}></div>
      </div>
    </div>
  ))}
</div>
```

**필터 UI**:
```tsx
<div className="bg-white p-4 rounded-lg shadow">
  {/* 검색 */}
  <input
    type="text"
    placeholder="의류 검색..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full p-2 border rounded mb-4"
  />

  {/* 재질 필터 */}
  <div className="mb-4">
    <h3 className="font-semibold mb-2">재질</h3>
    {materialOptions.map(material => (
      <label key={material} className="flex items-center">
        <input
          type="checkbox"
          checked={selectedMaterials.includes(material)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedMaterials([...selectedMaterials, material]);
            } else {
              setSelectedMaterials(selectedMaterials.filter(m => m !== material));
            }
          }}
        />
        <span className="ml-2">{material}</span>
      </label>
    ))}
  </div>

  {/* 초기화 버튼 */}
  <button
    onClick={() => {
      setSearchQuery('');
      setSelectedMaterials([]);
      setSelectedColors([]);
      setSelectedStyles([]);
      setSelectedOccasions([]);
    }}
    className="w-full bg-gray-300 text-black px-4 py-2 rounded"
  >
    필터 초기화
  </button>
</div>
```

### 5단계: 상세 모달

```tsx
{showDetailModal && selectedClothing && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <img src={selectedClothing.originalImage} alt={selectedClothing.name} />

      <h2 className="text-lg font-bold mt-4">{selectedClothing.name}</h2>
      <p className="text-gray-600">{selectedClothing.brand}</p>

      {/* 메타데이터 표시 */}
      <div className="mt-4">
        <p><strong>색상:</strong> {selectedClothing.primaryColor}</p>
        <p><strong>재질:</strong> {selectedClothing.material}</p>
        <p><strong>패턴:</strong> {selectedClothing.pattern}</p>

        {/* 배열 표시 (태그) */}
        <div className="mt-2">
          <strong>스타일:</strong>
          {selectedClothing.style.map(s => (
            <span key={s} className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded mr-2 ml-2">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* 버튼 */}
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="w-full bg-red-500 text-white px-4 py-2 rounded mt-4"
      >
        삭제
      </button>
      <button
        onClick={() => setShowDetailModal(false)}
        className="w-full bg-gray-300 text-black px-4 py-2 rounded mt-2"
      >
        닫기
      </button>
    </div>
  </div>
)}
```

### 6단계: 페이지네이션 컨트롤

```tsx
<div className="flex items-center justify-between mt-4">
  <button
    onClick={() => setCurrentPage(currentPage - 1)}
    disabled={currentPage === 1}
    className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
  >
    이전
  </button>

  <span className="mx-4">
    {currentPage} / {totalPages}
  </span>

  <button
    onClick={() => setCurrentPage(currentPage + 1)}
    disabled={currentPage === totalPages}
    className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
  >
    다음
  </button>
</div>
```

---

## 🧠 핵심 학습 포인트

### 1. useEffect의 의존성 배열 이해

```typescript
// ❌ 잘못된 예: 무한 루프
useEffect(() => {
  setFilteredClothes(clothes); // clothes 업데이트
}, [clothes]); // 매번 clothes가 변함

// ✅ 올바른 예: 필터 변경 시에만 실행
useEffect(() => {
  // 필터링 로직
  setFilteredClothes(result);
}, [clothes, searchQuery, selectedMaterials, ...]);
```

### 2. useMemo를 통한 성능 최적화

```typescript
// 필터링된 의류의 페이지네이션된 버전을 매번 다시 계산하지 않음
const paginatedClothes = useMemo(() => {
  return filteredClothes.slice(startIndex, endIndex);
}, [filteredClothes, currentPage]);
```

### 3. 배열 필터링 방법 비교

```typescript
// 문자열 포함 여부
item.material === selectedMaterial  // 정확히 일치

// 배열에 포함 여부
selectedMaterials.includes(item.material)  // 배열에 있으면 true

// 배열 교집합 (배열 안의 요소 중 하나라도 일치)
item.style.some(s => selectedStyles.includes(s))  // style 배열과 selectedStyles 교집합 확인
```

### 4. 모달 상태 관리

```typescript
// ❌ 잘못된 예: 같은 상태로 두 모달을 구분할 수 없음
const [isOpen, setIsOpen] = useState(false);

// ✅ 올바른 예: 각 모달에 고유 상태
const [showDetailModal, setShowDetailModal] = useState(false);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
```

### 5. 조건부 필터링

```typescript
// 필터가 선택되지 않으면 필터링하지 않기
if (selectedMaterials.length > 0) {
  result = result.filter(...);
}
// 선택되지 않으면 모든 아이템이 통과
```

---

## 🚀 실제 문제 해결

### 문제 1: 필터 적용 후 빈 페이지 표시
**원인**: 새로운 필터로 2~3개만 남았는데 페이지 3을 보고 있음

**해결**: 필터 변경 시 항상 페이지 1로 리셋
```typescript
setFilteredClothes(result);
setCurrentPage(1); // 이 줄 추가
```

### 문제 2: 스타일/용도 필터가 작동 안 함
**원인**: 배열 타입의 필터를 잘못 처리
```typescript
// ❌ 잘못된 예
result = result.filter(item => item.style === selectedStyles[0]);

// ✅ 올바른 예
result = result.filter(item =>
  item.style.some(s => selectedStyles.includes(s))
);
```

### 문제 3: 색상 필터 옵션이 중복됨
**원인**: Set을 사용하지 않아 중복 제거 안 됨

**해결**:
```typescript
// ❌ 잘못된 예
const colors = clothes.map(c => c.primaryColor);

// ✅ 올바른 예
const colors = [...new Set(clothes.map(c => c.primaryColor))];
```

---

## 📋 개발 체크리스트

- [ ] 상태 구조 설계
- [ ] 초기 데이터 로드 useEffect 작성
- [ ] 필터링 로직 useEffect 작성
- [ ] 페이지네이션 계산 useMemo 작성
- [ ] 동적 필터 옵션 추출 (색상, 재질, 스타일, 용도)
- [ ] 그리드 UI 구현
- [ ] 필터 UI 구현 (검색, 체크박스)
- [ ] 의류 아이템 카드 구현
- [ ] 상세 모달 구현
- [ ] 삭제 기능 구현
- [ ] 페이지네이션 버튼 구현
- [ ] 에러 처리
- [ ] 로딩 상태 표시
- [ ] 반응형 디자인 적용
- [ ] 테스트 (각 시나리오)

---

## 🎓 추가 학습 자료

### 필터링 최적화
- 클라이언트 필터링: 데이터 작을 때 (< 1000개)
- 서버 필터링: 데이터 클 때 (> 1000개)
- 혼합: 페이지네이션 + 서버 필터링

### 성능 개선
```typescript
// 무한 스크롤 구현 (페이지네이션 대체)
const [limit, setLimit] = useState(12);

useEffect(() => {
  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      setLimit(limit + 12);
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [limit]);

const visibleClothes = filteredClothes.slice(0, limit);
```

### Debouncing 검색
```typescript
import { useEffect, useState } from 'react';

// 검색어 입력 후 300ms 대기 후 필터링 시작
const [searchInput, setSearchInput] = useState('');
const [searchQuery, setSearchQuery] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setSearchQuery(searchInput);
  }, 300);

  return () => clearTimeout(timer);
}, [searchInput]);
```

---

## 🔗 관련 코드 위치

**백엔드**:
- `backend/src/controllers/clothing.controller.ts:84-147` - getClothing 엔드포인트
- `backend/src/services/clothing.service.ts:233-341` - 필터링 로직

**프론트엔드**:
- `frontend/src/pages/WardrobePage.tsx` - 전체 구현 (608줄)
- `frontend/src/services/api.ts:69-93` - API 클라이언트

**문서**:
- `BLOG_POC24_WARDROBE_DESIGN.md` - 설계 문서
- `TEST_PLAN_POC24.md` - 테스트 계획

---

## 결론

Phase 3 [3-3]에서는 **복잡한 필터링 로직**과 **상태 관리**를 다루는 실무적인 React 패턴을 배웠습니다.

핵심은 다음과 같습니다:

1. **데이터 흐름**: 로드 → 필터링 → 페이지네이션 → 렌더링
2. **상태 관리**: 각 단계의 상태를 명확히 분리
3. **useEffect/useMemo**: 의존성을 정확히 이해하고 사용
4. **모달 시스템**: 다중 모달을 효율적으로 관리
5. **에러 처리**: 사용자 경험을 고려한 에러 메시지

이러한 패턴은 향후 더 복잡한 기능을 구현할 때 견고한 기반이 될 것입니다!

