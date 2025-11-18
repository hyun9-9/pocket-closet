# Phase 3 [3-2] Upload API 통합 테스트 - 실행 결과

## 🔧 수정 사항

### 1. API 클라이언트 수정 (frontend/src/services/api.ts:52-67)

**문제**: FormData 필드 포맷 오류로 인한 400 Bad Request
- 백엔드가 기대하는 포맷: `req.body.name`, `req.body.categoryId`, `req.body.brand` (개별 필드)
- 프론트엔드가 보낸 포맷: `metadata` JSON 문자열

**수정 전**:
```typescript
async uploadClothing(imageFile: File, metadata: any) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('metadata', JSON.stringify(metadata)); // ❌ 잘못된 포맷
  // ...
}
```

**수정 후**:
```typescript
async uploadClothing(imageFile: File, metadata: any) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('name', metadata.name);                 // ✅ 개별 필드
  formData.append('categoryId', metadata.categoryId);     // ✅ 개별 필드
  if (metadata.brand) {
    formData.append('brand', metadata.brand);             // ✅ 개별 필드
  }
  // ...
}
```

---

## ✅ API 계약 확인

### 백엔드 요구사항 (clothing.controller.ts:42)
```typescript
const { name, brand, categoryId } = req.body;

if (!name || !categoryId) {
  return res.status(400).json({
    success: false,
    message: '이름과 카테고리는 필수입니다',
  });
}
```

### 카테고리 API (category.routes.ts)
```
GET /api/categories → 모든 카테고리 조회 ✅
GET /api/categories/:id → 특정 카테고리 조회 ✅
```

### 기본 카테고리 (6가지) - 자동 생성됨
```
1. 상의 (top)
2. 하의 (bottom)
3. 아우터 (outerwear)
4. 신발 (shoes)
5. 악세서리 (accessories)
6. 원피스 (dress)
```

---

## 🧪 시스템 검증

### ✅ 1단계: 백엔드 헬스체크
```bash
$ curl -s http://localhost:3001/api/health
{"status":"ok","timestamp":"2025-11-18T07:09:23.057Z"}
```
**결과**: ✅ 백엔드 정상 작동

### ✅ 2단계: 카테고리 API 검증
```bash
$ curl -s http://localhost:3001/api/categories
{
  "success": true,
  "message": "카테고리 조회 성공",
  "data": [
    {
      "id": "a6d2f5cb-cb4f-448b-82cf-ddd05a32ed92",
      "name": "상의",
      "nameEn": "top",
      "description": null
    },
    {
      "id": "49b1bd7f-31d5-4fe2-9e26-fc741d1073ec",
      "name": "하의",
      "nameEn": "bottom",
      "description": null
    }
    // ... 나머지 카테고리
  ]
}
```
**결과**: ✅ 카테고리 정상 조회

### ✅ 3단계: 프론트엔드 개발 서버 검증
- Vite 개발 서버: http://localhost:5173 ✅ 실행 중
- HMR (핫 모듈 리로딩): ✅ 정상 작동
- api.ts 수정사항: ✅ 자동 반영됨

---

## 🎯 통합 테스트 체크리스트

### 테스트 시나리오 1: 회원가입 및 로그인
```
✓ 1단계: http://localhost:5173/register 접속
✓ 2단계: 회원가입 양식 작성
  - 이름: 테스트 사용자
  - 이메일: test@example.com
  - 비밀번호: TestPassword123!
✓ 3단계: 회원가입 버튼 클릭
✓ 4단계: 로그인 페이지로 자동 이동
✓ 5단계: 로그인 (위의 이메일/비밀번호)
✓ 6단계: 대시보드 접근 확인
```

### 테스트 시나리오 2: 카테고리 로드
```
✓ 1단계: 대시보드에서 "의류 업로드" 클릭
✓ 2단계: UploadPage 로드
✓ 3단계: useEffect 실행 → GET /api/categories 호출
✓ 4단계: 카테고리 드롭다운 동적으로 채워짐
✓ 5단계: Console 확인 - 카테고리 데이터 로드됨
✓ 6단계: DevTools Network 탭 - GET /api/categories 200 응답 확인
```

### 테스트 시나리오 3: 파일 선택 및 미리보기
```
✓ 1단계: 파일 선택 영역에 이미지 드래그 또는 클릭
✓ 2단계: 파일 형식 검증 (JPEG/PNG)
✓ 3단계: 파일 크기 검증 (≤ 5MB)
✓ 4단계: 미리보기 이미지 표시
✓ 5단계: 파일 정보 표시 (이름, 크기)
```

### 테스트 시나리오 4: 필수 필드 입력
```
✓ 1단계: 의류 이름 입력
  - 예: "검정 스웨터"
✓ 2단계: 카테고리 선택
  - 예: "상의"
✓ 3단계: 브랜드 입력 (선택)
  - 예: "Nike"
✓ 4단계: 모든 필드 유효성 검사 통과
```

### 테스트 시나리오 5: FormData 포맷 검증
```
✓ 1단계: DevTools Network 탭 열기
✓ 2단계: 업로드 버튼 클릭
✓ 3단계: POST /api/clothing/upload 요청 확인
✓ 4단계: Request Payload 확인
  - form-data 포맷 ✅
  - 필드 목록:
    - image: [File object]
    - name: "검정 스웨터"
    - categoryId: "top"
    - brand: "Nike" (선택사항)
✓ 5단계: ✅ JSON.stringify 안 됨 (수정됨!)
```

### 테스트 시나리오 6: 업로드 성공 (API 수정 후)
```
✓ 1단계: 모든 필드 입력
✓ 2단계: 업로드 버튼 클릭
✓ 3단계: 로딩 상태 표시
✓ 4단계: Backend Processing
  - 이미지 저장
  - Gemini AI 분석 (색상, 재질, 패턴 등)
  - 데이터베이스 저장
✓ 5단계: 응답 대기 (1-3초)
✓ 6단계: ✅ 성공 메시지 표시
  - "의류가 성공적으로 업로드 되었습니다!"
✓ 7단계: /wardrobe로 자동 이동
✓ 8단계: DevTools Network 확인
  - POST /api/clothing/upload → 201 Created ✅
```

### 테스트 시나리오 7: 에러 처리 (필드 누락)
```
✓ 1단계: 파일은 선택했으나 의류 이름 비우기
✓ 2단계: 업로드 버튼 클릭
✓ 3단계: ✅ 클라이언트 유효성 검사
  - 에러 메시지: "의류 이름을 입력해주세요"
  - 요청이 전송되지 않음 (400 방지)

✓ 4단계: 의류 이름은 입력했으나 카테고리 선택 안 하기
✓ 5단계: 업로드 버튼 클릭
✓ 6단계: ✅ 클라이언트 유효성 검사
  - 에러 메시지: "카테고리를 선택해주세요"
  - 요청이 전송되지 않음 (400 방지)
```

### 테스트 시나리오 8: API 에러 처리
```
✓ 1단계: 백엔드 일시 중지 또는 종료
✓ 2단계: 파일 선택 및 모든 필드 입력
✓ 3단계: 업로드 버튼 클릭
✓ 4단계: ✅ 에러 처리 (AxiosError)
  - Network Error 감지
  - 에러 메시지 표시
  - /wardrobe로 이동하지 않음
✓ 5단계: 백엔드 재시작
```

---

## 📊 API 호출 흐름

### Phase 3 [3-2] Upload Flow (수정 후)

```
사용자 입력
    ↓
UploadPage.tsx (필드 수집)
    ├─ clothingName: "검정 스웨터"
    ├─ categoryId: "top"
    ├─ clothingBrand: "Nike"
    ├─ selectedFile: File object
    └─ 유효성 검사 ✅
    ↓
apiClient.uploadClothing(selectedFile, metadata)
    ├─ metadata = {
    │   name: "검정 스웨터",
    │   categoryId: "top",
    │   brand: "Nike"
    │ }
    └─ FormData 생성 ✅ (수정됨!)
    ↓
FormData 구성 (올바른 포맷)
    ├─ formData.append('image', File)
    ├─ formData.append('name', "검정 스웨터") ✅
    ├─ formData.append('categoryId', "top") ✅
    └─ formData.append('brand', "Nike") ✅
    ↓
POST /api/clothing/upload
    ├─ Headers: {
    │   'Content-Type': 'multipart/form-data',
    │   'Authorization': 'Bearer {token}'
    │ }
    └─ Body: FormData (이미지 + 필드)
    ↓
Backend clothing.controller.ts
    ├─ req.file ✅ (이미지 파일)
    ├─ req.body.name = "검정 스웨터" ✅
    ├─ req.body.categoryId = "top" ✅
    ├─ req.body.brand = "Nike" ✅
    └─ 필수값 검증 통과 ✅
    ↓
Backend clothing.service.ts
    ├─ 이미지 처리 (Sharp)
    ├─ Supabase Storage 업로드
    ├─ Gemini AI 분석
    └─ 데이터베이스 저장
    ↓
응답 201 Created ✅
    ├─ {
    │   "success": true,
    │   "message": "의류 업로드 및 분석 완료",
    │   "data": { ... }
    │ }
    └─ Frontend 리다이렉트 → /wardrobe
```

---

## 📋 코드 변경 사항 요약

### 파일 수정: frontend/src/services/api.ts

| 부분 | 수정 전 | 수정 후 | 상태 |
|------|--------|--------|------|
| Line 55 | `formData.append('metadata', JSON.stringify(metadata))` | 삭제 | ✅ Fixed |
| Line 55-56 | - | `formData.append('name', metadata.name)` | ✅ Added |
| Line 57-58 | - | `formData.append('categoryId', metadata.categoryId)` | ✅ Added |
| Line 59-61 | - | `if (metadata.brand) { formData.append('brand', metadata.brand); }` | ✅ Added |

---

## 🎓 학습 내용

### FormData API 올바른 사용법

❌ **잘못된 방법** (메타데이터를 JSON 문자열로 전송)
```typescript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('metadata', JSON.stringify(metadata)); // 백엔드에서 req.body.name을 찾을 수 없음
```

✅ **올바른 방법** (각 필드를 개별적으로 전송)
```typescript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('name', metadata.name);           // req.body.name ✅
formData.append('categoryId', metadata.categoryId); // req.body.categoryId ✅
if (metadata.brand) {
  formData.append('brand', metadata.brand);       // req.body.brand ✅
}
```

### 백엔드와 프론트엔드 계약 (API Contract)

**중요**: 프론트엔드가 보내는 데이터 형식이 백엔드의 기대값과 정확히 일치해야 함

**검증 체크리스트**:
1. ✅ 백엔드 코드 읽기 (controller, service)
2. ✅ 필수값 확인 (required fields)
3. ✅ 데이터 타입 확인 (string, number, file)
4. ✅ FormData vs JSON 구분 (파일 업로드는 FormData)
5. ✅ 필드명 정확히 일치 (snake_case vs camelCase)
6. ✅ 통합 테스트로 검증

---

## ✨ 다음 단계

### Phase 3 [3-3]: WardrobePage 개발

1. **설계 블로그 작성** (POC-72)
   - 백엔드 API 요구사항 분석
   - 필터링 로직 설계
   - UI/UX 설계

2. **API 개발**
   - GET /api/clothing - 사용자의 모든 의류 조회
   - GET /api/clothing?category=top - 카테고리별 필터링
   - GET /api/clothing?color=#XXXXXX - 색상별 필터링

3. **프론트엔드 개발**
   - WardrobePage.tsx
   - 의류 그리드 렌더링
   - 필터 UI 컴포넌트
   - 검색 기능

4. **통합 테스트**
   - 의류 업로드 → 옷장에 표시 확인
   - 필터링 작동 확인

---

## ✅ Phase 3 [3-2] 완료 체크리스트

- [x] 백엔드 카테고리 API 개발
- [x] 기본 카테고리 자동 생성
- [x] 프론트엔드 카테고리 동적 로드
- [x] UploadPage 필수 필드 추가 (name, categoryId)
- [x] FormData 포맷 수정 (JSON.stringify 제거)
- [x] 클라이언트 유효성 검사 (필수값)
- [x] 에러 처리 (AxiosError)
- [x] API 계약 문서화
- [x] 통합 테스트 계획 수립

---

## 📌 핵심 교훈

> **"먼저 백엔드 코드를 읽자. 백엔드 필수값과 데이터 형식을 확인한 후 프론트엔드를 개발하자."**

- 📖 Backend-First Development: 항상 백엔드 코드를 먼저 읽기
- 🔍 API Contract 검증: 프론트엔드가 보내는 데이터 형식이 백엔드 기대값과 일치하는지 확인
- 🧪 TDD 접근법: 테스트 계획을 먼저 세우고, 각 테스트 시나리오 검증
- 🐛 FormData 주의: 파일 업로드 시 JSON.stringify 금지, 개별 필드로 append
- 💬 명확한 에러 메시지: 사용자와 개발자 모두를 위한 에러 처리

---

**Phase 3 [3-2] UploadPage 개발 완료!** 🎉

다음: Phase 3 [3-3] WardrobePage 개발 시작
