# Phase 3 [3-2] 의류 업로드 페이지 - 완벽한 이해와 구현

## 📚 학습 목표

이 블로그에서는 다음을 배웁니다:
- 프론트엔드-백엔드 API 계약의 중요성
- FormData를 올바르게 사용하는 방법
- 외래 키 제약 조건이란 무엇인가
- 동적 데이터 로드와 상태 관리
- 파일 업로드 검증 및 에러 처리

---

## 🎯 핵심: Backend-First 개발

> **"먼저 백엔드 코드를 읽으세요. 백엔드가 기대하는 데이터 형식이 무엇인지 확인하세요."**

### 왜 이게 중요한가?

많은 개발자들이 이 실수를 합니다:
1. 프론트엔드부터 개발하고
2. 백엔드 연동 시도
3. 400 Bad Request 에러 발생
4. 원인 분석에 시간 낭비

### 올바른 순서

```
1️⃣ 백엔드 코드 읽기 (clothing.controller.ts)
   ↓
2️⃣ API 요구사항 정리
   - 필수값: name, categoryId
   - 선택값: brand
   - 파일: image
   ↓
3️⃣ 데이터 포맷 확인
   - FormData 사용
   - 각 필드를 개별적으로 append
   ↓
4️⃣ 프론트엔드 개발
   ↓
5️⃣ 테스트 및 수정
```

---

## 🔍 실제 문제와 해결책

### 문제 1: FormData 포맷 오류

#### ❌ 틀린 방식
```typescript
// api.ts
formData.append('metadata', JSON.stringify(metadata));

// 백엔드에서 받은 것:
// req.body.metadata = "{\"name\":\"...\",\"categoryId\":\"...\"}"
// req.body.name = undefined ❌
// req.body.categoryId = undefined ❌
```

**왜 안 되나?**
- Backend가 `req.body.name`을 찾는데
- 실제로는 `metadata` 필드에 JSON 문자열이 들어가 있음
- 필수값 검증 실패 → 400 Bad Request

#### ✅ 올바른 방식
```typescript
// api.ts
formData.append('name', metadata.name);
formData.append('categoryId', metadata.categoryId);
if (metadata.brand) {
  formData.append('brand', metadata.brand);
}

// 백엔드에서 받은 것:
// req.body.name = "청바지" ✅
// req.body.categoryId = "a6d2f5cb-..." ✅
// req.body.brand = "Nike" ✅
```

---

### 문제 2: 외래 키 제약 조건 (Foreign Key Constraint)

#### 에러 메시지
```
Foreign key constraint violated on the constraint: `my_clothes_categoryId_fkey`
```

#### 원인
```typescript
// Prisma Schema
model MyClothing {
  categoryId String
  category   ClothingCategory @relation(fields: [categoryId], references: [id])
}

// categoryId는 반드시 ClothingCategory 테이블의 id여야 함
```

#### ❌ 틀린 데이터
```javascript
// 프론트엔드가 보낸 것:
categoryId: "top"  // nameEn 값 (문자열)

// 데이터베이스에 실제로 있는 것:
id: "a6d2f5cb-cb4f-448b-82cf-ddd05a32ed92"  // UUID
```

**일치하지 않음 → 외래 키 검증 실패**

#### ✅ 올바른 데이터
```javascript
// 프론트엔드가 보내야 할 것:
categoryId: "a6d2f5cb-cb4f-448b-82cf-ddd05a32ed92"  // UUID

// 데이터베이스에 있는 것:
id: "a6d2f5cb-cb4f-448b-82cf-ddd05a32ed92"  // UUID

// 일치함 ✅
```

#### 해결 방법
```typescript
// UploadPage.tsx - select option
<option value={cat.id}>  {/* nameEn 대신 id 사용 */}
  {cat.name}
</option>

// api.ts - validateCategory 추가
const categoryExists = await ClothingService.validateCategory(categoryId);
if (!categoryExists) {
  return res.status(400).json({ message: '존재하지 않는 카테고리입니다' });
}
```

---

## 🛠️ 구현 전체 흐름

### 1단계: 백엔드 카테고리 API 개발

```typescript
// backend/src/routes/category.routes.ts
router.get('/categories', CategoryController.getAllCategories);
router.get('/categories/:id', CategoryController.getCategoryById);

// 기본 카테고리 자동 생성 (서버 시작 시)
await CategoryService.initializeDefaultCategories();
```

**기본 카테고리 (6가지)**
```
1. 상의 (top)
2. 하의 (bottom)
3. 아우터 (outerwear)
4. 신발 (shoes)
5. 악세서리 (accessories)
6. 원피스 (dress)
```

### 2단계: 프론트엔드 카테고리 동적 로드

```typescript
// UploadPage.tsx
useEffect(() => {
  const loadCategories = async () => {
    const response = await apiClient.getCategories();
    setCategories(response.data || []);
    // 첫 번째 카테고리를 기본값으로 설정 (UUID 사용!)
    if (response.data?.length > 0) {
      setCategoryId(response.data[0].id);  // ✅ UUID
    }
  };
  loadCategories();
}, []);
```

### 3단계: FormData 올바르게 구성

```typescript
// api.ts - uploadClothing
async uploadClothing(imageFile: File, metadata: any) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('name', metadata.name);              // ✅
  formData.append('categoryId', metadata.categoryId);  // ✅
  if (metadata.brand) {
    formData.append('brand', metadata.brand);          // ✅
  }

  const res = await this.client.post('/clothing/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}
```

### 4단계: 업로드 처리 및 검증

```typescript
// UploadPage.tsx - handleUpload
const handleUpload = async () => {
  // 필수 필드 검증
  if (!selectedFile) {
    setError('파일을 선택해주세요');
    return;
  }

  if (!clothingName.trim()) {
    setError('의류 이름을 입력해주세요');
    return;
  }

  if (!categoryId) {
    setError('카테고리를 선택해주세요');
    return;
  }

  try {
    const response = await apiClient.uploadClothing(selectedFile, {
      name: clothingName.trim(),
      categoryId,              // UUID ✅
      brand: clothingBrand.trim() || undefined,
    });

    // 성공 응답 처리
    console.log('업로드 성공:', response);
    setUploadedItem(response.data);

    // 2초 후 옷장으로 이동
    setTimeout(() => {
      navigate('/wardrobe');
    }, 2000);
  } catch (err) {
    // 에러 처리
    if (err instanceof AxiosError) {
      setError(err.response?.data?.message || '업로드 실패');
    }
  }
};
```

---

## 📊 성공 응답 처리

### Gemini AI 분석 결과

```json
{
  "success": true,
  "message": "의류 업로드 및 분석 완료",
  "data": {
    "id": "cloxxx...",
    "name": "청바지",
    "primaryColor": "블루",
    "pattern": "무지",
    "material": "데님",
    "style": ["캐주얼", "미니멀", "스트릿"],
    "season": ["봄", "여름", "가을", "겨울"],
    "occasion": ["일상", "데이트", "여행"],
    "metadata": {
      "material": "데님",
      "pattern": "무지",
      "style": ["캐주얼", "미니멀", "스트릿"],
      "season": ["봄", "여름", "가을", "겨울"],
      "occasion": ["일상", "데이트", "여행"]
    }
  }
}
```

### 성공 화면 렌더링

```tsx
// 성공 메시지 표시
✅ 청바지 이 옷장에 추가되었습니다.

// AI 분석 결과 시각화
🎨 주요 색상: [파란 원] 블루
📋 재질: 데님
🎯 패턴: 무지
👕 스타일: [캐주얼] [미니멀] [스트릿]
🌍 시즌: [봄] [여름] [가을] [겨울]
📍 활용 용도: [일상] [데이트] [여행]

// 버튼
[추가 등록하기] [옷장으로 이동]
```

---

## 🧪 통합 테스트 시나리오

### 테스트 1: 정상 업로드
```
✓ 파일 선택
✓ 의류 이름: "청바지"
✓ 카테고리: "하의" 선택
✓ 브랜드: "Levi's" (선택)
✓ 업로드 클릭
→ 201 Created
→ 성공 메시지 표시
→ AI 분석 결과 확인
```

### 테스트 2: 필수 필드 누락
```
✓ 파일 선택
✓ 의류 이름: (비움)
✓ 업로드 클릭
→ 클라이언트 검증 (에러 메시지 표시)
→ 요청 전송 안 함 (400 방지)
```

### 테스트 3: 잘못된 카테고리
```
✓ 파일 선택
✓ 의류 이름: "청바지"
✓ categoryId: "invalid-uuid"
✓ 업로드 클릭
→ 400 Bad Request
→ 메시지: "존재하지 않는 카테고리입니다"
```

---

## 💡 핵심 패턴 정리

### 1️⃣ Backend-First 검증
```typescript
// 항상 백엔드 코드를 먼저 읽으세요!
const { name, brand, categoryId } = req.body;
if (!name || !categoryId) {
  return res.status(400).json({ message: '필수값 누락' });
}
```

### 2️⃣ FormData 구성
```typescript
// 파일이 있으면 FormData 사용
const formData = new FormData();
formData.append('image', file);
formData.append('name', 'value');     // JSON.stringify 금지!
formData.append('categoryId', 'uuid');
```

### 3️⃣ 동적 데이터 로드
```typescript
// useEffect로 마운트 시 로드
useEffect(() => {
  const load = async () => {
    const data = await apiClient.getCategories();
    setCategories(data.data);
  };
  load();
}, []);
```

### 4️⃣ 필수값 검증
```typescript
// 클라이언트에서 먼저 검증
if (!clothingName.trim()) {
  setError('의류 이름을 입력해주세요');
  return;
}

// 백엔드에서 다시 검증
if (!name || !categoryId) {
  return res.status(400).json(...);
}
```

### 5️⃣ 에러 처리
```typescript
try {
  const response = await apiClient.uploadClothing(...);
  setUploadedItem(response.data);
} catch (err) {
  if (err instanceof AxiosError) {
    setError(err.response?.data?.message || '실패');
  }
}
```

---

## 🎓 배운 개념들

### FormData vs JSON

| 구분 | FormData | JSON |
|------|----------|------|
| 파일 포함 | ✅ Yes | ❌ No |
| 사용 시기 | 파일 업로드 | 일반 데이터 |
| 필드 구성 | 개별 append | 객체 구조 |
| Content-Type | multipart/form-data | application/json |
| JSON.stringify | ❌ 금지 | ✅ 권장 |

### 외래 키 제약 조건 (Foreign Key)

```
Parent Table (ClothingCategory)
├─ id: "a6d2f5cb-..." (UUID)
└─ name: "하의"

Child Table (MyClothing)
├─ categoryId: "a6d2f5cb-..." (FK)
└─ name: "청바지"
```

**제약 조건**: Child의 categoryId는 Parent의 id와 정확히 일치해야 함

### UUID vs nameEn

| 항목 | UUID | nameEn |
|------|------|--------|
| 형식 | `a6d2f5cb-cb4f-...` | `"top"` |
| 저장 위치 | ClothingCategory.id | ClothingCategory.nameEn |
| 사용 목적 | 데이터베이스 참조 | 사람이 읽는 값 |
| 프론트엔드 | categoryId로 전송 | 화면 표시용 |

---

## 🚀 최종 체크리스트

### 개발 전
- [x] 백엔드 코드 읽기
- [x] API 명세서 정리
- [x] 데이터 형식 확인

### 개발 중
- [x] FormData 올바르게 구성
- [x] 필수값 검증
- [x] 에러 처리
- [x] UUID 사용 (nameEn 아님)

### 개발 후
- [x] 통합 테스트
- [x] 에러 케이스 확인
- [x] UI 완성도 확인

---

## 📌 다음 단계: Phase 3 [3-3] WardrobePage

### 무엇을 만들 것인가?
- 업로드된 의류 목록 표시
- 그리드 레이아웃
- 필터링 (카테고리, 색상, 스타일)
- 검색 기능

### 필요한 백엔드 API
```
GET /api/clothing - 모든 의류 조회
GET /api/clothing?category=top - 카테고리별 필터링
GET /api/clothing?color=blue - 색상별 필터링
```

---

## 🎉 결론

### 핵심 학습

1. **Backend-First**: 백엔드를 먼저 읽고 이해한 후 프론트엔드 개발
2. **FormData**: 파일 업로드는 JSON.stringify 금지, 개별 필드 append
3. **외래 키**: 데이터베이스 참조 무결성은 정확한 ID 형식 필수
4. **검증**: 클라이언트와 서버 모두에서 검증 (Defense in Depth)
5. **에러 처리**: 사용자 친화적인 에러 메시지로 UX 개선

### 개발 시간 절감 팁

```
❌ 하지 말 것:
- 백엔드 없이 프론트엔드부터 개발
- 에러 메시지 무시하고 추측하기
- FormData에 JSON.stringify 사용
- 필드명을 대충 맞추기

✅ 할 것:
- 백엔드 코드 먼저 읽기
- 에러 메시지 분석 (필수값 누락? 형식 오류? 존재하지 않는 데이터?)
- 개별 필드로 FormData 구성
- 타입 정확히 일치시키기
```

---

**Phase 3 [3-2] 업로드 페이지 완성!** 🎉

다음: Phase 3 [3-3] 옷장 페이지 (WardrobePage) - 그리드 & 필터링

---

## 📚 참고 자료

- `BUG_FIX_SUMMARY.md` - 버그 분석
- `FORMDATA_QUICK_REFERENCE.md` - FormData 가이드
- `INTEGRATION_TEST_EXECUTION.md` - 테스트 계획
- `PHASE3_2_CRITICAL_BUG_FIXED.md` - 외래 키 제약 수정

---

**작성일**: 2025-11-18
**버전**: Phase 3 [3-2] 최종 버전
**상태**: ✅ 완료
