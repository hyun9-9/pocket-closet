# POC-24 [3-1-8] 필터링이 있는 옷장 표시 - 설계 및 API 분석

## 📋 수락 기준 분석

### 1. 이미지가 있는 의류 아이템의 그리드 표시
```
필요 데이터:
- id: 의류 ID
- name: 의류 이름
- originalImage 또는 thumbnailImage: 이미지 URL
- primaryColor: 주요 색상

그리드 레이아웃:
- 모바일: 2열
- 태블릿: 3열
- 데스크탑: 4열

각 아이템:
[이미지]
이름
색상 표시
```

### 2. 색상, 소재, 스타일, 용도의 필터 버튼
```
필터 옵션:
- 색상 필터 (dropdown 또는 색상 버튼)
- 소재 필터 (체크박스)
- 스타일 필터 (체크박스)
- 용도/occasion 필터 (체크박스)

필터링 로직:
- AND 조건: 모든 선택된 필터 만족
- OR 조건 (같은 카테고리 내): 하나 이상 만족
```

### 3. 아이템 이름으로 검색 기능
```
검색:
- 실시간 검색 (input 변경 시)
- 부분 검색 지원
- 대소문자 구분 안 함

구현:
- 백엔드: LIKE 또는 문자열 필터
- 프론트엔드: 로컬 필터링 또는 백엔드 요청
```

### 4. 클릭하여 상세 아이템 정보 보기
```
상세 모달:
- 큰 이미지
- 모든 메타데이터 표시
- 색상, 재질, 패턴, 스타일, 시즌, 용도
- 브랜드, 가격, 구매일
- 착용 횟수, 평점, 태그
```

### 5. 확인 모달이 있는 삭제 버튼
```
삭제 플로우:
1. 삭제 버튼 클릭
2. 확인 모달 표시
3. 사용자 확인
4. DELETE /api/clothing/:id 요청
5. 목록에서 제거
```

### 6. 큰 옷장을 위한 페이지네이션
```
페이지네이션:
- 페이지 크기: 12 또는 20
- 다음/이전 버튼
- 페이지 번호 표시
- 또는 "더보기" 버튼 (무한 스크롤)

백엔드:
- limit, offset 파라미터
- 또는 커서 기반 페이지네이션
```

### 7. 모바일을 위한 반응형 디자인
```
반응형:
- 모바일 (< 640px): 2열
- 태블릿 (640px - 1024px): 3열
- 데스크탑 (> 1024px): 4열

필터 UI:
- 모바일: 접을 수 있는 필터 패널
- 데스크탑: 고정 사이드바
```

---

## 🔧 필요한 백엔드 API

### 현재 API
```
GET /api/clothing - 사용자의 모든 의류 조회
```

### 필요한 확장
```
GET /api/clothing?category=top
GET /api/clothing?color=blue
GET /api/clothing?material=cotton
GET /api/clothing?style=casual
GET /api/clothing?occasion=daily
GET /api/clothing?search=청바지
GET /api/clothing?limit=12&offset=0

조합:
GET /api/clothing?style=casual&season=spring&limit=12&offset=0
```

### 응답 형식
```json
{
  "success": true,
  "message": "의류 목록 조회 성공",
  "data": [
    {
      "id": "...",
      "name": "청바지",
      "primaryColor": "블루",
      "colorHex": "#0000FF",
      "pattern": "무지",
      "material": "데님",
      "style": ["캐주얼", "스트릿"],
      "season": ["봄", "여름", "가을", "겨울"],
      "occasion": ["일상", "데이트"],
      "originalImage": "https://...",
      "thumbnailImage": "https://...",
      "brand": "Levi's",
      "createdAt": "2025-11-18T..."
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 12,
    "pages": 5
  }
}
```

---

## 📐 프론트엔드 구조

### WardrobePage.tsx 구조
```
WardrobePage
├─ FilterPanel (필터 UI)
│  ├─ SearchInput
│  ├─ ColorFilter
│  ├─ MaterialFilter
│  ├─ StyleFilter
│  └─ OccasionFilter
├─ ClothingGrid (의류 그리드)
│  ├─ ClothingCard × N
│  │  ├─ Image
│  │  ├─ Name
│  │  └─ Color Badge
│  └─ Pagination
└─ DetailModal (상세 보기)
   ├─ LargeImage
   ├─ Metadata Display
   ├─ DeleteButton
   └─ CloseButton
```

### 상태 관리
```typescript
const [clothes, setClothes] = useState<Clothing[]>([]);
const [filteredClothes, setFilteredClothes] = useState<Clothing[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

// 필터
const [searchQuery, setSearchQuery] = useState('');
const [selectedColors, setSelectedColors] = useState<string[]>([]);
const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);

// 페이지네이션
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(12);

// 모달
const [selectedClothing, setSelectedClothing] = useState<Clothing | null>(null);
const [showDetailModal, setShowDetailModal] = useState(false);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
```

### 필터링 로직
```typescript
useEffect(() => {
  let filtered = clothes;

  // 검색
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(query)
    );
  }

  // 색상 필터 (OR)
  if (selectedColors.length > 0) {
    filtered = filtered.filter(c =>
      selectedColors.includes(c.primaryColor)
    );
  }

  // 소재 필터 (OR)
  if (selectedMaterials.length > 0) {
    filtered = filtered.filter(c =>
      selectedMaterials.includes(c.material)
    );
  }

  // 스타일 필터 (OR - 하나 이상)
  if (selectedStyles.length > 0) {
    filtered = filtered.filter(c =>
      c.style.some(s => selectedStyles.includes(s))
    );
  }

  // 용도 필터 (OR - 하나 이상)
  if (selectedOccasions.length > 0) {
    filtered = filtered.filter(c =>
      c.occasion.some(o => selectedOccasions.includes(o))
    );
  }

  setFilteredClothes(filtered);
  setCurrentPage(1); // 필터 변경 시 첫 페이지로
}, [clothes, searchQuery, selectedColors, selectedMaterials, selectedStyles, selectedOccasions]);
```

### 페이지네이션
```typescript
const paginatedClothes = useMemo(() => {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return filteredClothes.slice(startIndex, endIndex);
}, [filteredClothes, currentPage, pageSize]);

const totalPages = Math.ceil(filteredClothes.length / pageSize);
```

---

## 🎨 UI 컴포넌트

### FilterPanel
```tsx
<div className="bg-white p-4 rounded-lg shadow mb-6">
  {/* 검색 */}
  <input
    type="text"
    placeholder="의류 이름으로 검색..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
  />

  {/* 필터 버튼 그룹 */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {/* 색상 필터 */}
    <FilterGroup
      title="색상"
      options={colors}
      selected={selectedColors}
      onChange={setSelectedColors}
    />
    {/* 소재 필터 */}
    {/* 스타일 필터 */}
    {/* 용도 필터 */}
  </div>

  {/* 필터 초기화 */}
  <button onClick={resetFilters} className="mt-4">
    필터 초기화
  </button>
</div>
```

### ClothingGrid
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {paginatedClothes.map(clothing => (
    <div
      key={clothing.id}
      onClick={() => {
        setSelectedClothing(clothing);
        setShowDetailModal(true);
      }}
      className="cursor-pointer hover:shadow-lg transition"
    >
      <img
        src={clothing.thumbnailImage || clothing.originalImage}
        alt={clothing.name}
        className="w-full h-48 object-cover rounded-lg"
      />
      <div className="mt-2">
        <p className="font-semibold truncate">{clothing.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <div
            className="w-4 h-4 rounded-full border"
            style={{ backgroundColor: clothing.colorHex }}
          />
          <span className="text-sm text-gray-600">{clothing.primaryColor}</span>
        </div>
      </div>
    </div>
  ))}
</div>
```

### 페이지네이션
```tsx
{totalPages > 1 && (
  <div className="flex justify-center items-center gap-2 mt-8">
    <button
      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
      disabled={currentPage === 1}
    >
      이전
    </button>
    {Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i + 1}
        onClick={() => setCurrentPage(i + 1)}
        className={currentPage === i + 1 ? 'font-bold' : ''}
      >
        {i + 1}
      </button>
    ))}
    <button
      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
      disabled={currentPage === totalPages}
    >
      다음
    </button>
  </div>
)}
```

### DetailModal
```tsx
{showDetailModal && selectedClothing && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        {/* 큰 이미지 */}
        <img
          src={selectedClothing.originalImage}
          alt={selectedClothing.name}
          className="w-full h-96 object-cover rounded-lg mb-4"
        />

        {/* 메타데이터 */}
        <h2 className="text-2xl font-bold mb-4">{selectedClothing.name}</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-600 text-sm">색상</p>
            <p className="font-semibold">{selectedClothing.primaryColor}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">소재</p>
            <p className="font-semibold">{selectedClothing.material}</p>
          </div>
          {/* 더 많은 메타데이터 */}
        </div>

        {/* 삭제 버튼 */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          삭제
        </button>

        {/* 닫기 버튼 */}
        <button
          onClick={() => setShowDetailModal(false)}
          className="bg-gray-300 text-gray-900 px-4 py-2 rounded-lg"
        >
          닫기
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 의류 목록 조회
```
1. WardrobePage 접속
2. GET /api/clothing 요청
3. 12개 아이템의 그리드 표시
4. 각 아이템에 이미지, 이름, 색상 표시
```

### 시나리오 2: 색상 필터
```
1. "파란색" 필터 클릭
2. 필터 즉시 적용
3. 파란색만 표시
4. 다른 필터와 조합 가능
```

### 시나리오 3: 검색
```
1. 검색창에 "청바지" 입력
2. 실시간으로 "청바지"만 표시
3. 다른 필터와 조합 가능
```

### 시나리오 4: 페이지네이션
```
1. 12개 아이템 표시
2. "다음" 버튼 클릭
3. 다음 12개 아이템 표시
4. 페이지 번호 업데이트
```

### 시나리오 5: 삭제
```
1. 아이템 클릭 → 상세 모달
2. "삭제" 버튼 클릭
3. 확인 모달 표시
4. "확인" 클릭
5. DELETE /api/clothing/:id 요청
6. 목록에서 제거
```

---

## 🔄 구현 순서

### Phase 1: 백엔드 API 확장
```
1. GET /api/clothing에 쿼리 파라미터 지원
   - category, color, material, style, occasion
   - search, limit, offset
2. 필터링 로직 구현
3. 페이지네이션 구현
```

### Phase 2: 프론트엔드 WardrobePage
```
1. 기본 그리드 표시
2. 필터 UI 추가
3. 필터링 로직 구현
4. 페이지네이션 구현
5. 상세 모달 추가
6. 삭제 기능 추가
```

### Phase 3: 반응형 디자인 및 최적화
```
1. 모바일 반응형
2. 필터 패널 접기/펼치기
3. 이미지 최적화 (thumbnail)
4. 로딩 상태 표시
```

---

## 📊 데이터 흐름

```
Backend (ClothingService)
├─ getClothingByUserId(userId) → 모든 의류
├─ filterClothing(userId, filters) → 필터된 의류
└─ deleteClothing(clothingId) → 삭제

Frontend (WardrobePage)
├─ useEffect: 초기 데이터 로드
├─ useState: 필터 상태 관리
├─ useMemo: 필터링 + 페이지네이션
└─ onClick: 삭제 요청
```

---

## 💡 주요 고려사항

### 1. 필터 조합 로직
- 같은 카테고리: OR (색상 A 또는 색상 B)
- 다른 카테고리: AND (색상 A 그리고 스타일 B)

### 2. 검색과 필터 조합
- 검색 + 필터: 둘 다 만족하는 결과

### 3. 성능
- 로컬 필터링: 데이터가 적을 때 (< 100개)
- 백엔드 필터링: 데이터가 많을 때 (> 100개)

### 4. UX
- 필터 변경 시 스크롤 위로 (첫 페이지로)
- 로딩 상태 표시
- 결과 없음 메시지

---

**다음: Phase 3 [3-3] WardrobePage 구현 시작** 🚀
