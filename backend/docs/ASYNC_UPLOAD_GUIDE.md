# 🚀 의류 업로드 비동기 처리 시스템 - 완벽 가이드

> **작성일**: 2025년 11월 20일
> **주제**: 동기 처리를 비동기 처리로 개선하여 응답 속도 60% 개선
> **난이도**: ⭐⭐⭐ (중급)

---

## 📌 목차

1. [문제 상황](#문제-상황)
2. [해결 방안](#해결-방안)
3. [개념 설명](#개념-설명)
4. [구현 상세](#구현-상세)
5. [코드 분석](#코드-분석)
6. [테스트 방법](#테스트-방법)
7. [실무 팁](#실무-팁)

---

## 🔴 문제 상황

### **원래 코드의 문제점**

```typescript
// ❌ 이전 코드: 동기 처리
static async uploadClothing(payload) {
  // 1️⃣ 이미지 처리 (2초)
  const processedImage = await this.processImage(fileBuffer);

  // 2️⃣ AI 분석 시작 (5-10초) ← 여기서 멈춤!
  const metadata = await this.analyzeClothingWithAI(base64Image);

  // 3️⃣ DB 저장 (1초)
  const clothing = await prisma.myClothing.create({...});

  // ✅ 응답 반환 (총 8-13초 소요)
  return clothing;
}
```

### **타임라인**

```
0초         3초         13초
├──────────┼──────────────┤
 이미지처리   AI분석 진행    응답 반환
                ↑
          사용자 기다리는 동안
          (10초 대기는 너무 김!)
```

### **사용자 경험**

```
사용자: "업로드 버튼을 눌렀어"
대기: ...
대기: ... (3초)
대기: ... (5초)
대기: ... (8초)
대기: ... (10초)
대기: ... (13초) ← "아직도 안 끝났어?"
서버: "업로드 완료!"
사용자: 😞
```

---

## ✅ 해결 방안

### **비동기 처리 개념**

```typescript
// ✅ 개선 코드: 비동기 처리
static async uploadClothing(payload) {
  // 1️⃣ 이미지 처리 (2초)
  const processedImage = await this.processImage(fileBuffer);

  // 2️⃣ 기본값으로 DB 저장 (1초)
  const clothing = await prisma.myClothing.create({
    data: {
      name,
      pattern: '분석중',     // ← 분석 전 상태 표시
      material: '분석중',
      primaryColor: '#CCCCCC',
    },
  });

  // 3️⃣ AI 분석을 백그라운드에서 시작 (대기 X)
  this.analyzeAndUpdateClothingAsync(clothing.id, base64Image)
    .catch(err => console.error(err));
    // ↑ await 없음! = 비동기 실행

  // ✅ 즉시 응답 반환 (총 3초만!)
  return {
    id: clothing.id,
    status: 'analyzing',
    message: 'AI가 분석 중입니다',
  };
}

// 🔥 백그라운드 함수 (사용자 응답과 무관하게 실행)
private static async analyzeAndUpdateClothingAsync(clothingId, base64Image) {
  // 1️⃣ AI 분석 (5-10초, 하지만 사용자는 이미 응답받음)
  const metadata = await this.analyzeClothingWithAI(base64Image);

  // 2️⃣ 분석 결과로 DB 업데이트
  await prisma.myClothing.update({
    where: { id: clothingId },
    data: {
      primaryColor: metadata.primaryColor,
      pattern: metadata.pattern,
      material: metadata.material,
      style: metadata.style,
    },
  });

  console.log(`✅ ${clothingId} 분석 완료`);
}
```

### **새로운 타임라인**

```
0초      3초      13초
├────────┼────────────────┐
 처리+저장  응답 반환      분석 완료
 (사용자)           (백그라운드)

사용자: "업로드!" → 3초 후 응답 받음 ✅
백그라운드: 분석 진행 중... (5-10초)
```

### **사용자 경험**

```
사용자: "업로드 버튼을 눌렀어"
대기: ...
대기: ... (3초)
서버: "저장되었습니다! AI가 분석 중입니다."
사용자: 😊 "오! 빨라졌네"
  ↓
사용자가 다른 작업 진행
  ↓
(백그라운드에서 AI 분석 진행 중...)
  ↓
분석 완료 후 DB 업데이트 완료
사용자가 나중에 새로고침 → 완전한 정보 확인
```

---

## 💡 개념 설명

### **1️⃣ 동기 vs 비동기**

#### **동기 (Synchronous) - 순차 실행**

```typescript
console.log('1️⃣ 시작');
const result = await longTask();  // ← 여기서 대기!
console.log('2️⃣ 완료');

// 실행 순서:
// 1️⃣ 시작
// ... (5초 대기)
// 2️⃣ 완료
```

**특징**:
- 결과를 받을 때까지 대기
- 코드 순서대로 실행됨
- 이해하기 쉬움
- **느림** ⏱️

#### **비동기 (Asynchronous) - 병렬 실행**

```typescript
console.log('1️⃣ 시작');
longTask()  // ← 실행하고 즉시 반환 (await 없음!)
  .then(() => console.log('2️⃣ 완료'));
console.log('1-2️⃣ 즉시 실행');

// 실행 순서:
// 1️⃣ 시작
// 1-2️⃣ 즉시 실행
// ... (5초 후)
// 2️⃣ 완료
```

**특징**:
- 결과를 기다리지 않음
- 다른 작업 동시 진행
- 복잡할 수 있음
- **빠름** ⚡

### **2️⃣ Promise와 async/await**

#### **Promise란?**

```javascript
// Promise = "미래의 값"에 대한 약속
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('완료!');  // 2초 후 완료
  }, 2000);
});

// Promise 사용 방법 1️⃣: .then()
promise
  .then(result => console.log(result))  // '완료!' 출력
  .catch(error => console.error(error));

// Promise 사용 방법 2️⃣: async/await
async function test() {
  const result = await promise;  // Promise가 완료될 때까지 대기
  console.log(result);           // '완료!' 출력
}
test();
```

#### **async/await의 작동 원리**

```typescript
// ✅ async 함수는 항상 Promise를 반환
async function getData() {
  return 'data';  // ← 자동으로 Promise로 감싸짐
}

// 호출 방식 1️⃣: await 사용 (대기)
const result = await getData();  // 완료할 때까지 대기
console.log(result);

// 호출 방식 2️⃣: await 없이 사용 (비동기)
getData()  // ← Promise 즉시 반환
  .then(result => console.log(result));  // 나중에 완료됨
// 즉시 다음 줄로 진행
```

### **3️⃣ "await 없이 호출" = 비동기 실행**

**가장 중요한 개념!**

```typescript
// ❌ 동기: await 사용 → 완료될 때까지 대기
await analyzeClothingWithAI(base64Image);  // 5-10초 대기
console.log('다음 코드');                   // 분석 완료 후 실행

// ✅ 비동기: await 없음 → 즉시 반환
analyzeClothingWithAI(base64Image);  // 즉시 반환 (백그라운드 진행)
console.log('다음 코드');             // 즉시 실행 (분석 완료 안 기다림)

// 🔥 에러 처리 추가
analyzeClothingWithAI(base64Image)
  .catch(err => console.error('분석 실패:', err));
console.log('다음 코드');  // 여전히 즉시 실행
```

---

## 🔧 구현 상세

### **파일 1️⃣: ClothingService.ts**

#### **변경 전**

```typescript
export class ClothingService {
  static async uploadClothing(payload: UploadClothingPayload): Promise<any> {
    const { userId, name, brand, categoryId, fileBuffer, fileName, mimeType } = payload;

    // 1️⃣ 파일 검증
    this.validateFile(fileBuffer, mimeType);

    // 2️⃣ 이미지 처리
    const processedImage = await this.processImage(fileBuffer);
    const base64Image = processedImage.toString('base64');

    // 3️⃣ ⏰ AI 분석 (여기서 5-10초 대기!)
    const metadata = await this.analyzeClothingWithAI(base64Image);

    // 4️⃣ DB 저장
    const clothing = await prisma.myClothing.create({
      data: {
        userId,
        categoryId,
        name,
        brand: brand || metadata.brand,
        primaryColor: metadata.primaryColor || '#000000',
        // ... metadata 필드들
      },
    });

    return {
      id: clothing.id,
      name: clothing.name,
      primaryColor: clothing.primaryColor,
    };
  }
}
```

**문제**: `await this.analyzeClothingWithAI()`에서 5-10초 대기

#### **변경 후**

```typescript
export class ClothingService {
  /**
   * 1️⃣ 빠른 응답 함수 (이미지만 저장)
   */
  static async uploadClothing(payload: UploadClothingPayload): Promise<any> {
    const { userId, name, brand, categoryId, fileBuffer, fileName, mimeType } = payload;

    // 1️⃣ 파일 검증
    this.validateFile(fileBuffer, mimeType);

    // 2️⃣ 이미지 처리
    const processedImage = await this.processImage(fileBuffer);
    const base64Image = processedImage.toString('base64');

    // 3️⃣ 기본값으로 즉시 저장 (AI 분석 X)
    const clothing = await prisma.myClothing.create({
      data: {
        userId,
        categoryId,
        name,
        brand: brand || null,
        primaryColor: '#CCCCCC',      // 기본값 (분석 전)
        colorHex: '#CCCCCC',
        pattern: '분석중',             // 상태 표시
        material: '분석중',
        style: [],
        season: [],
        occasion: [],
        formality: 5,
        originalImage: `data:${mimeType};base64,${base64Image}`,
        measurements: {},
        matchingRules: {},
      },
    });

    // 🔥 4️⃣ 비동기 AI 분석 시작 (대기 X)
    // ⭐ 핵심: await를 사용하지 않음!
    this.analyzeAndUpdateClothingAsync(clothing.id, base64Image).catch((err) => {
      console.error(`의류 ${clothing.id} AI 분석 실패:`, err);
    });

    // 5️⃣ 즉시 응답 반환 (3초)
    return {
      id: clothing.id,
      name: clothing.name,
      primaryColor: clothing.primaryColor,
      status: 'analyzing',  // 분석 중 상태 표시
      message: 'AI가 의류를 분석 중입니다. 잠시 후 새로고침하면 완전한 정보를 볼 수 있습니다.',
      metadata: {
        pattern: '분석중',
        material: '분석중',
        style: [],
        season: [],
        occasion: [],
      },
    };
  }

  /**
   * 2️⃣ 백그라운드 함수 (AI 분석 + DB 업데이트)
   * 이 함수는 uploadClothing과 별개로 실행됨
   */
  private static async analyzeAndUpdateClothingAsync(
    clothingId: string,
    base64Image: string
  ): Promise<void> {
    try {
      // 🔥 1️⃣ Google Gemini AI로 의류 분석 (5-10초 소요)
      console.log(`⏳ ${clothingId} AI 분석 시작...`);
      const metadata = await this.analyzeClothingWithAI(base64Image);
      console.log(`✅ ${clothingId} AI 분석 완료`);

      // 🔥 2️⃣ 분석 결과로 DB 업데이트
      console.log(`💾 ${clothingId} 정보 업데이트 중...`);
      await prisma.myClothing.update({
        where: { id: clothingId },
        data: {
          brand: metadata.brand || null,
          primaryColor: metadata.primaryColor || '#000000',
          colorHex: metadata.colorHex || '#000000',
          pattern: metadata.pattern || '무지',
          material: metadata.material || '미정',
          style: metadata.style || ['캐주얼'],
          season: metadata.season || ['사계절'],
          occasion: metadata.occasion || ['일상'],
          formality: metadata.formality || 3,
          measurements: metadata.measurements || {},
          matchingRules: metadata.matchingRules || {},
        },
      });
      console.log(`✅ ${clothingId} 정보 업데이트 완료`);
    } catch (error) {
      // ⚠️ 에러가 발생해도 이미지는 저장되어 있음
      console.error(`❌ ${clothingId} 분석 실패:`, error);
      // 사용자에게는 에러 표시 안 함 (이미지는 저장됨)
    }
  }

  // ... 기타 메서드는 동일
}
```

### **파일 2️⃣: ClothingController.ts**

#### **변경점**

```typescript
// 응답 구조 변경
res.status(201).json({
  success: true,
  message: '이미지 저장 완료! AI가 의류를 분석 중입니다.',
  data: result,  // ← status: 'analyzing' 포함
  // 🔥 프론트엔드에서 사용할 정보 추가
  hint: {
    status: 'analyzing',
    tips: [
      'AI 분석은 10초~30초 정도 소요됩니다.',
      '잠시 후 옷장 페이지에서 새로고침(F5)하면 완전한 정보를 확인할 수 있습니다.',
      '옷장에서 수동으로 정보를 편집할 수도 있습니다.',
    ],
  },
});
```

### **파일 3️⃣: UploadPage.tsx (프론트엔드)**

#### **변경점**

```typescript
// 분석 중 상태 감지
const isAnalyzing = uploadedItem.status === 'analyzing';

// 조건부 렌더링
{isAnalyzing ? (
  // 🔄 분석 중 화면
  <>
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-spin"></div>
    </div>
    <h2 className="text-2xl font-bold text-blue-600 mb-2">
      분석 중입니다
    </h2>
    <p className="text-gray-600 mb-6">
      <strong>{uploadedItem.name}</strong>을 AI가 분석 중입니다.
    </p>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <p className="text-sm text-blue-800 mb-2 font-semibold">
        📝 업로드 완료!
      </p>
      <ul className="text-xs text-blue-700 space-y-1">
        <li>✓ 분석 소요 시간: 10~30초</li>
        <li>✓ 옷장 페이지에서 새로고침하면 결과를 확인할 수 있습니다</li>
        <li>✓ 정보가 부정확하면 수동으로 편집할 수 있습니다</li>
      </ul>
    </div>
  </>
) : (
  // ✅ 분석 완료 화면
  <>
    <div className="text-6xl mb-4">✅</div>
    <h2 className="text-2xl font-bold text-green-600 mb-2">
      업로드 성공!
    </h2>
    {/* AI 분석 결과 표시 */}
  </>
)}
```

---

## 📊 코드 분석

### **핵심 라인별 분석**

#### **Line 64-68: 비동기 AI 분석 시작**

```typescript
// 🔥 백그라운드에서 AI 분석 시작 (대기하지 않음!)
this.analyzeAndUpdateClothingAsync(clothing.id, base64Image).catch((err) => {
  console.error(`의류 ${clothing.id} AI 분석 실패:`, err);
  // 실패해도 사용자에게 에러 표시 안 함 (이미지는 저장됨)
});
```

**분석**:

| 부분 | 설명 |
|------|------|
| `this.analyzeAndUpdateClothingAsync(...)` | async 함수 호출 |
| **`await` 없음** | ⭐ 핵심! 즉시 반환, 백그라운드에서 실행 |
| `.catch((err) => {})` | Promise 실패 시 처리 |
| 콘솔 로그만 | 사용자에게 에러 표시 안 함 (이미지는 저장됨) |

**실행 흐름**:

```
this.analyzeAndUpdateClothingAsync(...) 호출
  ↓
Promise 즉시 반환 (기다리지 않음)
  ↓
다음 줄 즉시 실행 (return 문)
  ↓
백그라운드에서 analyzeAndUpdateClothingAsync 진행
```

#### **Line 90-121: 백그라운드 함수**

```typescript
private static async analyzeAndUpdateClothingAsync(
  clothingId: string,
  base64Image: string
): Promise<void> {
  try {
    // 1️⃣ AI 분석 (5-10초)
    const metadata = await this.analyzeClothingWithAI(base64Image);

    // 2️⃣ DB 업데이트
    await prisma.myClothing.update({
      where: { id: clothingId },
      data: { /* 분석 결과 */ },
    });

    console.log(`✅ 의류 ${clothingId} AI 분석 완료`);
  } catch (error) {
    console.error(`❌ 의류 ${clothingId} AI 분석 실패:`, error);
    // 에러 발생해도 이미지는 이미 저장됨
  }
}
```

**특징**:

1. **`async` 함수** → Promise 반환
2. **내부에서 `await` 사용** → 분석 완료까지 대기 (하지만 이건 백그라운드!)
3. **에러 처리 포함** → 분석 실패 시에도 프로그램 계속 실행
4. **사용자에게 무관** → 응답은 이미 반환됨

---

## 🧪 테스트 방법

### **1️⃣ 백엔드 로그 확인**

```bash
# 백엔드 실행 중 다음과 같이 로그가 출력됨

⏳ clothing-123 AI 분석 시작...
✅ clothing-123 AI 분석 완료
💾 clothing-123 정보 업데이트 중...
✅ clothing-123 정보 업데이트 완료
```

### **2️⃣ 응답 시간 측정**

#### **브라우저 개발자 도구에서:**

```
1. F12 열기 → Network 탭
2. UploadPage에서 이미지 업로드
3. POST /api/clothing/upload 요청 확인
4. Time 열 확인 → 약 3초 (이전: 8-13초)
```

#### **콘솔에서:**

```javascript
// 프론트엔드에서 시간 측정
const start = performance.now();
const response = await apiClient.uploadClothing(file, metadata);
const end = performance.now();

console.log(`업로드 소요 시간: ${end - start}ms`);
// 출력 예: 업로드 소요 시간: 3000ms (3초)
```

### **3️⃣ 분석 진행 상태 확인**

```javascript
// API 응답
{
  success: true,
  message: '이미지 저장 완료! AI가 의류를 분석 중입니다.',
  data: {
    id: 'clothing-123',
    name: '검정 후드티',
    status: 'analyzing',  // ← 분석 중 상태
    message: 'AI가 의류를 분석 중입니다...',
  },
  hint: {
    status: 'analyzing',
    tips: ['분석은 10~30초 소요...', '새로고침하면 결과 확인...'],
  }
}
```

### **4️⃣ 분석 완료 확인**

```javascript
// 10-30초 후 옷장 페이지에서 새로고침 (F5)
// → pattern, material, style 등이 '분석중'에서 실제 값으로 변경됨

// 예:
{
  id: 'clothing-123',
  name: '검정 후드티',
  pattern: '무지',           // '분석중'에서 변경됨
  material: '코튼',          // '분석중'에서 변경됨
  style: ['캐주얼'],         // []에서 변경됨
  primaryColor: '#000000',  // '#CCCCCC'에서 변경됨
}
```

---

## 💼 실무 팁

### **1️⃣ 에러 처리**

#### **❌ 나쁜 예**

```typescript
// 에러를 무시함
this.analyzeAndUpdateClothingAsync(clothingId, base64Image);
```

#### **✅ 좋은 예**

```typescript
// 에러를 처리함
this.analyzeAndUpdateClothingAsync(clothingId, base64Image)
  .catch((err) => {
    console.error(`분석 실패 [${clothingId}]:`, err);
    // 모니터링 시스템에 알림
    this.notifyAdmin(`AI 분석 실패: ${clothingId}`);
  });
```

### **2️⃣ 타임아웃 처리**

```typescript
// AI 분석이 너무 오래 걸리면 중단
private static async analyzeAndUpdateClothingAsync(
  clothingId: string,
  base64Image: string
): Promise<void> {
  try {
    // 30초 타임아웃 설정
    const metadata = await Promise.race([
      this.analyzeClothingWithAI(base64Image),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('분석 타임아웃')), 30000)
      ),
    ]);

    await prisma.myClothing.update({
      where: { id: clothingId },
      data: { /* 분석 결과 */ },
    });
  } catch (error) {
    console.error(`분석 실패: ${error.message}`);
  }
}
```

### **3️⃣ 로깅 및 모니터링**

```typescript
private static async analyzeAndUpdateClothingAsync(
  clothingId: string,
  base64Image: string
): Promise<void> {
  const startTime = Date.now();

  try {
    console.log(`[${new Date().toISOString()}] 분석 시작: ${clothingId}`);

    const metadata = await this.analyzeClothingWithAI(base64Image);

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 분석 완료: ${clothingId} (${duration}ms)`);

    await prisma.myClothing.update({
      where: { id: clothingId },
      data: { /* ... */ },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 분석 실패: ${clothingId} (${duration}ms)`, error);
  }
}
```

### **4️⃣ 데이터베이스 트랜잭션**

```typescript
// ⚠️ 문제: 업데이트가 실패하면?
const clothing = await prisma.myClothing.create({ /* ... */ });  // ✅ 저장됨
this.analyzeAndUpdateClothingAsync(clothing.id, base64Image);    // ❌ 실패 가능

// ✅ 해결: 롤백 불가능하지만 에러 처리
private static async analyzeAndUpdateClothingAsync(
  clothingId: string,
  base64Image: string
): Promise<void> {
  try {
    const metadata = await this.analyzeClothingWithAI(base64Image);

    // 트랜잭션 사용 (선택사항)
    await prisma.$transaction(async (tx) => {
      await tx.myClothing.update({
        where: { id: clothingId },
        data: { /* ... */ },
      });
    });
  } catch (error) {
    console.error(`분석 실패: ${clothingId}`, error);
    // 수동으로 정보 편집할 수 있으므로 괜찮음
  }
}
```

### **5️⃣ 성능 모니터링**

```typescript
// 대시보드용 메트릭 수집
private static analysisMetrics = {
  total: 0,      // 총 분석 개수
  success: 0,    // 성공
  failed: 0,     // 실패
  avgTime: 0,    // 평균 소요 시간
};

private static async analyzeAndUpdateClothingAsync(
  clothingId: string,
  base64Image: string
): Promise<void> {
  const startTime = Date.now();
  this.analysisMetrics.total++;

  try {
    const metadata = await this.analyzeClothingWithAI(base64Image);
    await prisma.myClothing.update({
      where: { id: clothingId },
      data: { /* ... */ },
    });

    this.analysisMetrics.success++;
  } catch (error) {
    this.analysisMetrics.failed++;
  }

  // 평균 시간 계산
  const duration = Date.now() - startTime;
  this.analysisMetrics.avgTime =
    (this.analysisMetrics.avgTime * (this.analysisMetrics.total - 1) + duration) /
    this.analysisMetrics.total;
}

// 메트릭 조회 엔드포인트
static getAnalysisMetrics() {
  return this.analysisMetrics;
}
```

---

## 🎯 핵심 요약

### **변경 전후 비교**

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| **응답 시간** | 8-13초 | **3초** ⚡ |
| **사용자 대기** | 8-13초 대기 😞 | 3초만 대기 😊 |
| **AI 분석** | 응답 후 완료 | 백그라운드 병렬 실행 |
| **코드 복잡도** | 단순 | 중간 |
| **UX** | 답답함 | 쾌적함 |

### **기술 포인트**

1. **비동기 함수는 `await` 없이 호출** → 즉시 반환
2. **`.catch()`로 에러 처리** → 프로그램 안정성
3. **상태 필드 추가** → 프론트에서 분석 중인지 판단
4. **기본값으로 DB 저장** → 데이터 손실 방지
5. **로깅 추가** → 디버깅 용이

### **언제 사용할까?**

✅ **사용해야 하는 경우**:
- 시간이 오래 걸리는 작업 (AI, 이미지 처리, 외부 API)
- 사용자에게 빠른 응답이 중요
- 작업 실패해도 기본값이 있을 때

❌ **사용하면 안 되는 경우**:
- 결과를 즉시 반환해야 할 때
- 작업 실패 시 롤백이 필요할 때
- 순서가 중요한 작업들

---

## 🚀 다음 단계

### **Phase 2 고도화 방안**

#### **1️⃣ Job Queue 도입 (권장)**

```typescript
// Redis + Bull 라이브러리 사용
import Queue from 'bull';

const analysisQueue = new Queue('clothing-analysis', {
  redis: { host: '127.0.0.1', port: 6379 }
});

// 큐에 작업 추가
static async uploadClothing(payload) {
  // 이미지 저장
  const clothing = await prisma.myClothing.create({...});

  // 큐에 분석 작업 추가
  await analysisQueue.add({
    clothingId: clothing.id,
    base64Image: base64Image,
  }, { attempts: 3 });  // 실패 시 3번 재시도

  return clothing;
}

// 큐 워커 (백그라운드 프로세스)
analysisQueue.process(async (job) => {
  const { clothingId, base64Image } = job.data;
  const metadata = await this.analyzeClothingWithAI(base64Image);
  await prisma.myClothing.update({...});
});
```

**장점**:
- 서버 재시작 후에도 작업 복구 가능
- 여러 워커로 병렬 처리
- 작업 상태 추적 가능

#### **2️⃣ WebSocket으로 실시간 알림**

```typescript
// Socket.IO 사용
socket.on('clothing-analysis-complete', (clothingId) => {
  // 자동 새로고침 또는 알림 표시
});
```

#### **3️⃣ 배치 처리**

```typescript
// 야간에 대량 분석 (예: 23시~05시)
const schedule = require('node-schedule');

schedule.scheduleJob('0 23 * * *', async () => {
  const pendingClothes = await prisma.myClothing.findMany({
    where: { pattern: '분석중' }
  });

  for (const clothing of pendingClothes) {
    await this.analyzeAndUpdateClothingAsync(...);
  }
});
```

---

## 📚 참고 자료

- [MDN: Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN: async/await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises)
- [Bull: Node.js task queue](https://github.com/OptimalBits/bull)
- [Socket.IO: Real-time communication](https://socket.io/)

---

**작성자**: Pocket Closet 팀
**마지막 수정**: 2025년 11월 20일
**버전**: 1.0.0
