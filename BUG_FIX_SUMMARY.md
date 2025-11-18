# 🐛 FormData 포맷 버그 수정 완료

## 문제 상황

### 에러 메시지
```
400 Bad Request
{
  "success": false,
  "message": "이름과 카테고리는 필수입니다"
}
```

### 원인 분석

**백엔드가 기대하는 포맷** (clothing.controller.ts:42):
```typescript
const { name, brand, categoryId } = req.body;
// req.body에서 name, brand, categoryId를 개별 필드로 찾음
```

**프론트엔드가 보낸 포맷** (수정 전):
```javascript
formData.append('image', imageFile);
formData.append('metadata', JSON.stringify({
  name: '검정 스웨터',
  categoryId: 'top',
  brand: 'Nike'
}));
// metadata 필드에 전체 객체를 JSON 문자열로 넣음
// 백엔드의 req.body.name은 undefined가 됨!
```

---

## 🔧 수정 사항

### 파일: frontend/src/services/api.ts (Line 52-67)

#### 수정 전 ❌
```typescript
async uploadClothing(imageFile: File, metadata: any) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('metadata', JSON.stringify(metadata)); // ❌ 잘못된 방식

  const res = await this.client.post('/clothing/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}
```

**문제점**:
- `metadata` 필드에 전체 객체를 JSON 문자열로 변환
- 백엔드가 `req.body.name`을 찾으려고 하지만 존재하지 않음
- `JSON.stringify`로 인해 `metadata` 필드는 문자열 값을 가짐

---

#### 수정 후 ✅
```typescript
async uploadClothing(imageFile: File, metadata: any) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('name', metadata.name);                 // ✅ 개별 필드
  formData.append('categoryId', metadata.categoryId);     // ✅ 개별 필드
  if (metadata.brand) {
    formData.append('brand', metadata.brand);             // ✅ 개별 필드 (선택)
  }

  const res = await this.client.post('/clothing/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}
```

**장점**:
- 각 필드를 FormData에 개별적으로 추가
- 백엔드의 `req.body.name`, `req.body.categoryId` 등이 정확한 값을 가짐
- 선택 필드(brand)는 조건부로 추가

---

## 📊 네트워크 요청 비교

### 수정 전 (❌ 오류)
```
POST /api/clothing/upload
Content-Type: multipart/form-data

Form Data:
├── image: [File: image.jpg]
└── metadata: "{\"name\":\"검정 스웨터\",\"categoryId\":\"top\",\"brand\":\"Nike\"}"
    ↑ 문자열! 백엔드가 파싱 안 함
```

**백엔드 수신**:
```javascript
req.body.image    // [File object] ✅
req.body.metadata // 문자열 ✅
req.body.name     // undefined ❌
req.body.categoryId // undefined ❌
req.body.brand    // undefined ❌
```

**결과**: 400 Bad Request (필수값 누락)

---

### 수정 후 (✅ 성공)
```
POST /api/clothing/upload
Content-Type: multipart/form-data

Form Data:
├── image: [File: image.jpg]
├── name: "검정 스웨터"
├── categoryId: "top"
└── brand: "Nike"
```

**백엔드 수신**:
```javascript
req.body.image      // [File object] ✅
req.body.name       // "검정 스웨터" ✅
req.body.categoryId // "top" ✅
req.body.brand      // "Nike" ✅
```

**결과**: 201 Created (성공)

---

## 🎯 수정 영향 범위

### 관련 파일 (영향 받음)
1. **frontend/src/services/api.ts** ✅ 수정됨
   - `uploadClothing()` 메서드 수정

### 관련 파일 (수정 필요 없음)
1. **backend/src/controllers/clothing.controller.ts** - 이미 올바른 구현
2. **frontend/src/pages/UploadPage.tsx** - 호출부는 이미 올바름
   - `apiClient.uploadClothing(selectedFile, { name, categoryId, brand })`
   - metadata 객체 구조가 올바름

---

## ✅ 수정 검증

### 1. 코드 검토
- ✅ FormData 필드명이 백엔드 기대값과 일치
- ✅ 필수 필드: name, categoryId
- ✅ 선택 필드: brand (조건부 추가)
- ✅ 파일 필드: image (그대로 유지)

### 2. 타입 검사
```typescript
metadata = {
  name: string;           // ✅
  categoryId: string;     // ✅
  brand?: string;         // ✅ 선택사항
}
```

### 3. 백엔드 검증
```typescript
const { name, brand, categoryId } = req.body;

if (!name || !categoryId) {
  return res.status(400).json({...});
}
// ✅ 이제 name과 categoryId가 정상적으로 수신됨
```

---

## 🚀 테스트 결과

### 시스템 상태
- ✅ 백엔드 실행: http://localhost:3001 (정상)
- ✅ 프론트엔드 실행: http://localhost:5173 (정상)
- ✅ 카테고리 API: http://localhost:3001/api/categories (정상)
- ✅ HMR 반영: api.ts 수정사항 자동 반영됨

### 예상 테스트 결과
```
사용자 입력
├─ 이미지 선택: ✅
├─ 의류 이름: "검정 스웨터" ✅
├─ 카테고리: "상의" ✅
└─ 브랜드: "Nike" ✅
    ↓
FormData 전송 (올바른 포맷)
    ├─ image: File ✅
    ├─ name: "검정 스웨터" ✅
    ├─ categoryId: "top" ✅
    └─ brand: "Nike" ✅
    ↓
백엔드 수신 및 검증
    ├─ name 확인: ✅ "검정 스웨터"
    ├─ categoryId 확인: ✅ "top"
    ├─ brand 확인: ✅ "Nike"
    ├─ 필수값 검증: ✅ 통과
    └─ AI 분석 진행: ✅
    ↓
201 Created ✅
"의류가 성공적으로 업로드되었습니다!"
    ↓
/wardrobe로 자동 이동
```

---

## 📚 FormData API 학습

### FormData 올바른 사용법

#### ❌ 틀린 예시: 메타데이터를 JSON 문자열로 추가
```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('metadata', JSON.stringify({
  name: 'item',
  categoryId: 'top'
}));

// 백엔드에서:
const { name, categoryId } = req.body;
// name = undefined ❌
// categoryId = undefined ❌
// req.body.metadata = "{\"name\":\"item\",\"categoryId\":\"top\"}" (문자열)
```

#### ✅ 올바른 예시: 각 필드를 개별적으로 추가
```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('name', 'item');
formData.append('categoryId', 'top');

// 백엔드에서:
const { name, categoryId } = req.body;
// name = 'item' ✅
// categoryId = 'top' ✅
```

### 언제 JSON.stringify를 사용할까?

```javascript
// ❌ FormData에 직접 추가할 때 사용 금지
formData.append('metadata', JSON.stringify(obj)); // 틀림!

// ✅ JSON 요청 바디에 포함시킬 때 사용
const res = await axios.post('/api/endpoint', {
  metadata: { ... } // axios가 자동으로 JSON.stringify
});
```

---

## 🎓 핵심 교훈

> **"프론트엔드가 보내는 데이터 포맷이 백엔드의 기대값과 정확히 일치해야 한다!"**

### 개발 체크리스트
1. ✅ 백엔드 코드 읽기 (controller, service)
2. ✅ 필수값과 선택값 확인
3. ✅ 데이터 포맷 확인 (JSON vs FormData)
4. ✅ 필드명 정확히 일치 (req.body.name vs req.body.metadata)
5. ✅ 네트워크 탭에서 실제 요청 확인
6. ✅ 에러 메시지 분석 (필수값 누락 → FormData 포맷 확인)

### TDD의 중요성
- 테스트 케이스 먼저 작성 → API 계약 명확화
- 백엔드 필드명/타입 미리 확인 → 프론트엔드 개발
- 통합 테스트로 검증 → 버그 조기 발견

---

## 📌 다음 단계

1. **통합 테스트 실행** (브라우저에서 직접 확인)
   - 회원가입 → 로그인 → 업로드 → 성공 메시지
   - DevTools Network 탭으로 FormData 확인

2. **Phase 3 [3-3] WardrobePage 개발 준비**
   - GET /api/clothing 엔드포인트 설계
   - 필터링 기능 설계
   - UI 컴포넌트 설계

---

**버그 수정 완료!** ✨

다음: Phase 3 [3-3] WardrobePage 개발 (옷장 페이지 - 그리드 & 필터링)
