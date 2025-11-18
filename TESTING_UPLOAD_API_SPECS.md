# Phase 3 [3-2] 업로드 페이지 통합 테스트
## 백엔드 API 요구사항 분석

---

## 📋 API 명세서

### **POST /api/clothing/upload**
의류 이미지 업로드 및 AI 분석

#### 요청 (Request)

**Content-Type**: `multipart/form-data`

**필수 필드**:
```
- image (File): 이미지 파일
  - 지원 형식: image/jpeg, image/png, image/webp
  - 최대 크기: 10MB (10485760 bytes)

- name (string): 의류 이름
  - 예: "검정 후드집업"

- categoryId (string): 카테고리 ID
  - 예: "outerwear", "top", "bottom", "shoes"
```

**선택 필드**:
```
- brand (string): 브랜드명 (선택사항)
  - 예: "Nike"
  - 없으면 AI가 분석한 브랜드 사용
```

#### 응답 (Response)

**성공 (201 Created)**:
```json
{
  "success": true,
  "message": "의류 업로드 및 분석 완료",
  "data": {
    "id": "cloxxxxxx",
    "name": "검정 후드집업",
    "primaryColor": "#000000",
    "metadata": {
      "pattern": "무지",
      "material": "코튼",
      "style": ["캐주얼"],
      "season": ["봄", "가을", "겨울"],
      "occasion": ["일상"]
    }
  }
}
```

**필드 설명**:
- `id`: 생성된 의류 ID (Prisma UUID)
- `name`: 업로드 시 전달한 의류 이름
- `primaryColor`: AI가 분석한 주요 색상 (HEX 코드, 예: #000000)
- `metadata.pattern`: 패턴 (무지, 스트라이프, 체크, 도트, 플로럴)
- `metadata.material`: 소재 (코튼, 폴리에스터, 데님, 니트, 실크 등)
- `metadata.style`: 스타일 배열 (캐주얼, 미니멀, 스트릿, 클래식 등)
- `metadata.season`: 계절 배열 (봄, 여름, 가을, 겨울)
- `metadata.occasion`: 용도 배열 (일상, 출근, 데이트, 파티)

---

## ⚠️ 에러 처리

### 1️⃣ **400 Bad Request - 파일 없음**
```json
{
  "success": false,
  "message": "이미지 파일이 필요합니다"
}
```
**원인**: `image` 필드가 없거나 파일이 전달되지 않음

### 2️⃣ **400 Bad Request - 필수 필드 누락**
```json
{
  "success": false,
  "message": "이름과 카테고리는 필수입니다"
}
```
**원인**: `name` 또는 `categoryId`가 없음

### 3️⃣ **400 Bad Request - 파일 형식 오류**
```json
{
  "success": false,
  "message": "JPG, PNG, WebP 형식만 지원합니다"
}
```
**원인**: 지원하지 않는 이미지 형식 (예: GIF, BMP 등)

### 4️⃣ **400 Bad Request - 파일 크기 초과**
```json
{
  "success": false,
  "message": "파일 크기가 너무 큽니다 (최대 10MB)"
}
```
**원인**: 파일 크기가 10MB 초과

### 5️⃣ **401 Unauthorized - 인증 실패**
```json
{
  "success": false,
  "message": "인증이 필요합니다"
}
```
**원인**: Authorization 헤더 없음 또는 유효하지 않은 토큰

### 6️⃣ **500 Internal Server Error - 이미지 처리 오류**
```json
{
  "success": false,
  "message": "이미지 처리 중 오류가 발생했습니다"
}
```
**원인**: Sharp 처리 중 오류

### 7️⃣ **500 Internal Server Error - AI 분석 오류**
```json
{
  "success": false,
  "message": "AI 분석 중 오류가 발생했습니다. 다시 시도해주세요."
}
```
**원인**: Google Gemini API 호출 오류, API 할당량 초과 등

---

## 🔄 데이터 흐름

```
1. 프론트엔드: UploadPage에서 파일 선택 (드래그 앤 드롭 또는 클릭)
   ↓
2. 프론트엔드: 파일 검증 (타입, 크기)
   ↓
3. 프론트엔드: FileReader로 미리보기 생성 (Data URL)
   ↓
4. 사용자: 파일명, 브랜드 등 메타데이터 입력
   ↓
5. 프론트엔드: 업로드 버튼 클릭
   ↓
6. 프론트엔드: FormData 생성
   - image: File (바이너리)
   - name: string
   - categoryId: string
   - brand: string (선택)
   ↓
7. 프론트엔드: apiClient.uploadClothing() 호출
   ↓
8. 백엔드: POST /api/clothing/upload 요청 받음
   ↓
9. 백엔드: 인증 확인 (JWT 토큰)
   ↓
10. 백엔드: Multer로 파일 파싱
   ↓
11. 백엔드: 파일 및 필드 검증
   ↓
12. 백엔드: Sharp로 이미지 처리 (1024x1024, JPEG)
   ↓
13. 백엔드: Base64 인코딩
   ↓
14. 백엔드: Google Gemini AI 호출 (이미지 분석)
   ↓
15. 백엔드: JSON 응답 파싱
   ↓
16. 백엔드: 데이터베이스 저장 (MyClothing 테이블)
   ↓
17. 백엔드: 응답 반환
   ↓
18. 프론트엔드: 응답 데이터 파싱
   ↓
19. 프론트엔드: 상태 업데이트 (uploadedItem)
   ↓
20. 프론트엔드: 성공 UI 표시 (2초 후 /wardrobe로 이동)
```

---

## 🧪 통합 테스트 시나리오

### **시나리오 1: 성공적인 업로드**

**준비**:
- 로그인된 상태 (유효한 JWT 토큰)
- 유효한 이미지 파일 (JPG, PNG, WebP)
- name, categoryId 입력

**기대 결과**:
- 상태 코드 201
- 응답에 id, name, primaryColor, metadata 포함
- 데이터베이스에 새 의류 레코드 생성
- 프론트엔드: 성공 UI 표시 후 /wardrobe로 이동

---

### **시나리오 2: 파일 없음**

**준비**:
- 로그인된 상태
- 파일 선택 안 함

**기대 결과**:
- 상태 코드 400
- 에러 메시지: "이미지 파일이 필요합니다"
- 프론트엔드: 에러 메시지 표시

---

### **시나리오 3: 필수 필드 누락 (name)**

**준비**:
- 로그인된 상태
- 유효한 파일
- name 필드 없음

**기대 결과**:
- 상태 코드 400
- 에러 메시지: "이름과 카테고리는 필수입니다"
- 프론트엔드: 에러 메시지 표시

---

### **시나리오 4: 필수 필드 누락 (categoryId)**

**준비**:
- 로그인된 상태
- 유효한 파일
- name은 입력, categoryId 없음

**기대 결과**:
- 상태 코드 400
- 에러 메시지: "이름과 카테고리는 필수입니다"
- 프론트엔드: 에러 메시지 표시

---

### **시나리오 5: 지원하지 않는 파일 형식**

**준비**:
- 로그인된 상태
- GIF, BMP, SVG 등 지원하지 않는 형식
- name, categoryId 입력

**기대 결과**:
- 상태 코드 400
- 에러 메시지: "JPG, PNG, WebP 형식만 지원합니다"
- 프론트엔드: 에러 메시지 표시

---

### **시나리오 6: 파일 크기 초과**

**준비**:
- 로그인된 상태
- 10MB 초과 파일
- name, categoryId 입력

**기대 결과**:
- 상태 코드 400
- 에러 메시지: "파일 크기가 너무 큽니다 (최대 10MB)"
- 프론트엔드: 에러 메시지 표시

---

### **시나리오 7: 인증 실패 (토큰 없음)**

**준비**:
- 로그인하지 않은 상태
- 유효한 파일, name, categoryId

**기대 결과**:
- 상태 코드 401
- 에러 메시지: "인증이 필요합니다" (또는 유사)
- 프론트엔드: /login으로 리다이렉트

---

### **시나리오 8: 유효하지 않은 토큰**

**준비**:
- 만료된 또는 변조된 토큰
- 유효한 파일, name, categoryId

**기대 결과**:
- 상태 코드 401
- 에러 메시지: "인증이 필요합니다"
- 프론트엔드: /login으로 리다이렉트

---

## 📝 UploadPage에서 전달해야 할 데이터

현재 UploadPage.tsx 코드 (frontend/src/pages/UploadPage.tsx:174):
```jsx
const response = await apiClient.uploadClothing(selectedFile, {});
```

**문제점**: categoryId가 전달되지 않음!

**수정 필요**:
```jsx
const response = await apiClient.uploadClothing(selectedFile, {
  name: '사용자 입력 또는 기본값',
  categoryId: '사용자 선택 또는 기본값',
  brand: '사용자 입력 (선택사항)',
});
```

---

## 🎯 테스트 체크리스트

### 프론트엔드 테스트
- [ ] 파일 선택 시 미리보기 표시
- [ ] 파일 타입 검증 (JPG, PNG, WebP만)
- [ ] 파일 크기 검증 (10MB 이하)
- [ ] 드래그 앤 드롭 기능
- [ ] 업로드 버튼 클릭 시 로딩 표시
- [ ] 성공 응답 처리 및 UI 표시
- [ ] 에러 응답 처리 및 에러 메시지 표시
- [ ] 재선택 버튼 기능
- [ ] 성공 후 /wardrobe로 자동 이동

### 백엔드 테스트
- [ ] 파일 없을 때 400 에러
- [ ] 필수 필드 없을 때 400 에러
- [ ] 지원하지 않는 형식 400 에러
- [ ] 파일 크기 초과 400 에러
- [ ] 인증 실패 시 401 에러
- [ ] 정상 요청 시 201 + 응답 데이터
- [ ] 데이터베이스에 정상 저장

### 통합 테스트
- [ ] 로그인 후 업로드 시 정상 작동
- [ ] 업로드 후 /wardrobe에서 업로드된 의류 조회 가능
- [ ] 에러 발생 시 프론트엔드에서 사용자 피드백 표시

---

## 🔧 테스트 환경 준비

1. **백엔드 실행**:
   ```bash
   cd backend
   npm run dev
   ```

2. **프론트엔드 실행**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **테스트 이미지 준비**:
   - 유효한 이미지: JPG/PNG/WebP 파일 (< 10MB)
   - 유효하지 않은 이미지: GIF, BMP 등
   - 큰 이미지: 10MB 초과 파일

4. **테스트 사용자 준비**:
   - 회원가입 및 로그인
   - 유효한 JWT 토큰 확보

---

## 📊 응답 데이터 필드 추가 분석

### MyClothing 모델에 저장되는 필드들

```typescript
{
  id: string;                    // UUID
  userId: string;                // 사용자 ID
  categoryId: string;            // 카테고리 ID
  name: string;                  // 의류 이름
  brand: string | null;          // 브랜드명
  primaryColor: string;          // 주요 색상명
  colorHex: string;              // HEX 코드
  pattern: string;               // 패턴
  material: string;              // 소재
  style: string[];               // 스타일 배열
  season: string[];              // 계절 배열
  occasion: string[];            // 용도 배열
  formality: number;             // 정장도 (1-10)
  originalImage: string;         // Base64 인코딩된 이미지
  measurements: Record<string, any>;    // 치수 정보
  matchingRules: Record<string, any>;   // 매칭 규칙
  createdAt: Date;               // 생성 시간
  updatedAt: Date;               // 수정 시간
}
```

### 응답에 포함되는 필드들

```json
{
  "id": "string",
  "name": "string",
  "primaryColor": "string",
  "metadata": {
    "pattern": "string",
    "material": "string",
    "style": "string[]",
    "season": "string[]",
    "occasion": "string[]"
  }
}
```

---

## ✅ 다음 단계

1. UploadPage.tsx에서 categoryId와 name 필드 추가
2. 백엔드와 실제 통합 테스트 수행
3. 에러 처리 검증
4. 성공 케이스 검증
5. 필요시 코드 수정
