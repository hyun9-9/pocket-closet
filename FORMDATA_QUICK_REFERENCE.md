# 📖 FormData 빠른 참고 가이드

## 🚫 FormData와 JSON.stringify의 관계

### FormData에 JSON.stringify 금지!

```javascript
❌ 틀린 방식 - 이렇게 하지 마세요!
const formData = new FormData();
formData.append('metadata', JSON.stringify({
  name: 'item',
  categoryId: 'top'
}));
// 백엔드: req.body.metadata = "{\"name\":\"item\",...}" (문자열)
//         req.body.name = undefined (존재 안 함)

✅ 올바른 방식
const formData = new FormData();
formData.append('name', 'item');
formData.append('categoryId', 'top');
// 백엔드: req.body.name = 'item' ✅
//         req.body.categoryId = 'top' ✅
```

---

## 📋 포맷 선택 가이드

### FormData (파일 업로드)
**언제 사용?** 파일이 포함될 때
```javascript
const formData = new FormData();
formData.append('image', fileObject);      // 파일
formData.append('name', 'value');          // 텍스트
formData.append('categoryId', 'top');      // 텍스트

await axios.post('/api/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// 백엔드
const { name, categoryId } = req.body;
```

### JSON (일반 데이터)
**언제 사용?** 파일이 없을 때
```javascript
const data = {
  name: 'value',
  categoryId: 'top'
};

await axios.post('/api/endpoint', data);
// axios가 자동으로 JSON.stringify

// 백엔드
const { name, categoryId } = req.body;
```

---

## 🔍 Pocket Closet에서 실제 사용

### 업로드 API (파일 포함) → FormData 사용

**프론트엔드** (frontend/src/services/api.ts:52)
```typescript
async uploadClothing(imageFile: File, metadata: any) {
  const formData = new FormData();
  formData.append('image', imageFile);           // 파일
  formData.append('name', metadata.name);        // 텍스트
  formData.append('categoryId', metadata.categoryId);
  if (metadata.brand) {
    formData.append('brand', metadata.brand);
  }

  const res = await this.client.post('/clothing/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}
```

**백엔드** (backend/src/controllers/clothing.controller.ts:42)
```typescript
const { name, brand, categoryId } = req.body;

if (!name || !categoryId) {
  return res.status(400).json({
    success: false,
    message: '이름과 카테고리는 필수입니다',
  });
}
```

### 로그인 API (파일 없음) → JSON 사용

**프론트엔드** (frontend/src/services/api.ts:41)
```typescript
async login(email: string, password: string) {
  const res = await this.client.post('/auth/login', {
    email,
    password
  });
  return res.data;
}
// axios가 자동으로 JSON으로 변환
```

**백엔드** (backend/src/controllers/auth.controller.ts)
```typescript
const { email, password } = req.body;
```

---

## 🐛 문제 진단 가이드

### 에러: "필수값이 누락되었습니다"

```
→ FormData 포맷을 확인하세요!
→ req.body의 필드명과 일치하는지 확인
```

### 디버깅 방법

1. **DevTools Network 탭**
   - Request 보기
   - "Form Data" 섹션 확인
   - 각 필드가 개별적으로 보이는지 확인

2. **백엔드 로그**
   ```typescript
   console.log('req.body:', req.body);
   // { name: '값', categoryId: '값' } → ✅
   // { metadata: "{...}" } → ❌
   ```

3. **코드 검토**
   ```javascript
   // ❌ 이 부분 있는지 확인
   formData.append('metadata', JSON.stringify(...))

   // ✅ 이렇게 수정
   formData.append('name', value);
   formData.append('categoryId', value);
   ```

---

## 📝 체크리스트

파일 업로드 API 개발할 때:

- [ ] 백엔드 controller 읽음
- [ ] req.body의 필드명 확인함
- [ ] FormData 사용하기로 결정
- [ ] 각 필드를 개별적으로 append함
- [ ] JSON.stringify 사용하지 않음
- [ ] 필수 필드 검증 추가함
- [ ] DevTools Network 탭에서 확인
- [ ] 형식: "Form Data" (JSON 아님)

---

## 🎯 핵심 원칙

> **FormData의 각 필드는 개별 속성으로 백엔드에 전달됨**

```
FormData에 추가              →  백엔드에서 수신
formData.append('name', 'X')    req.body.name = 'X'
formData.append('id', '123')    req.body.id = '123'

❌ 절대 금지
formData.append('data', JSON.stringify({...}))
```

---

## 🔗 관련 파일

| 파일 | 위치 | 설명 |
|------|------|------|
| uploadClothing | frontend/src/services/api.ts:52 | FormData 사용 예시 |
| login | frontend/src/services/api.ts:41 | JSON 사용 예시 |
| uploadClothing (백엔드) | backend/src/controllers/clothing.controller.ts:42 | req.body 처리 |
| clothing.routes.ts | backend/src/routes/clothing.routes.ts | multer 설정 |

---

**이 가이드를 북마크하세요!** 🔖
