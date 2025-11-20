# Axios 인터셉터와 API 클라이언트 설계

## 📚 목차
1. [HTTP 클라이언트란?](#http-클라이언트란)
2. [Axios 기본](#axios-기본)
3. [인터셉터 (Interceptor)](#인터셉터-interceptor)
4. [API 클라이언트 설계](#api-클라이언트-설계)
5. [고급 패턴](#고급-패턴)
6. [Pocket Closet 사례](#pocket-closet-사례)

---

## HTTP 클라이언트란?

### 🤔 클라이언트가 필요한 이유

프론트엔드에서 백엔드 API를 호출할 때:

```typescript
// ❌ 매번 fetch를 직접 사용?
async function loginUser(email: string, password: string) {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,  // 토큰 매번 추가
    },
    body: JSON.stringify({ email, password }),
  });

  if (response.status === 401) {
    // 토큰 만료 시 처리 (매번?)
    logout();
  }

  return response.json();
}

// ❌ 모든 컴포넌트에서 이 로직을 반복?
async function uploadClothing(file: File) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('http://localhost:3001/api/clothing/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,  // 또 토큰 추가
    },
    body: formData,
  });

  if (response.status === 401) {
    logout();  // 또 401 처리
  }

  return response.json();
}
```

**문제점:**
- 토큰 추가가 매번 반복됨
- 에러 처리가 일관성 없음
- 401 (인증 오류)을 매번 처리
- API URL이 하드코딩됨
- 로깅/디버깅이 어려움

### ✅ API 클라이언트 솔루션

**중앙에서 HTTP 요청을 관리하는 클래스/함수:**

```typescript
// ✅ 한 번 설정하면 모든 요청에 적용
const apiClient = new ApiClient();

// ✅ 간단한 호출
const response = await apiClient.login(email, password);
const uploadResult = await apiClient.uploadClothing(file);
```

**장점:**
- 토큰 자동 추가
- 에러 처리 통일
- API URL 중앙화
- 요청/응답 로깅
- 재시도 로직
- 타입 안정성

---

## Axios 기본

### 🎯 Axios란?

**Promise 기반 HTTP 클라이언트** (fetch의 상위 호환)

```bash
npm install axios
```

### 기본 사용법

```typescript
import axios from 'axios';

// 1. GET 요청
const response = await axios.get('http://localhost:3001/api/clothing');
console.log(response.data);  // 응답 데이터

// 2. POST 요청
const response = await axios.post('http://localhost:3001/api/auth/login', {
  email: 'test@example.com',
  password: 'password123',
});

// 3. PATCH 요청
const response = await axios.patch('http://localhost:3001/api/clothing/1', {
  name: '새로운 이름',
});

// 4. DELETE 요청
const response = await axios.delete('http://localhost:3001/api/clothing/1');
```

### Axios 인스턴스

모든 요청에 공통 설정을 적용:

```typescript
import axios from 'axios';

// ✅ 인스턴스 생성
const instance = axios.create({
  baseURL: 'http://localhost:3001/api',  // 모든 요청 앞에 자동 붙음
  timeout: 10000,                         // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 이제 상대 경로 사용 가능
instance.get('/clothing');          // GET http://localhost:3001/api/clothing
instance.post('/auth/login', {...}); // POST http://localhost:3001/api/auth/login
```

---

## 인터셉터 (Interceptor)

### 🎯 인터셉터란?

**모든 요청/응답을 가로채서 처리하는 메커니즘**

```
클라이언트
    ↓
[요청 인터셉터] ← 토큰 추가, 헤더 수정, 로깅
    ↓
백엔드 API
    ↓
[응답 인터셉터] ← 에러 처리, 로깅, 상태 코드 확인
    ↓
클라이언트
```

### 요청 인터셉터 (Request Interceptor)

**모든 요청 전에 토큰을 자동으로 추가:**

```typescript
const instance = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// ✅ 요청 인터셉터 등록
instance.interceptors.request.use(
  (config) => {
    // 요청 전 실행

    // 1. Zustand에서 토큰 가져오기
    const token = useAuthStore.getState().token;

    // 2. 토큰이 있으면 헤더에 추가
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 3. 로깅
    console.log('📤 요청:', config.method?.toUpperCase(), config.url);
    console.log('📋 데이터:', config.data);

    // 4. 수정된 config 반환
    return config;
  },
  (error) => {
    // 요청 에러 발생 시 (거의 안 발생)
    console.error('요청 에러:', error);
    return Promise.reject(error);
  }
);
```

**동작 예시:**

```typescript
// 요청 (토큰 없음)
const response = await instance.post('/auth/login', {
  email: 'test@example.com',
  password: 'password123',
});

// 요청 인터셉터에 의해 자동 처리:
// 📤 요청: POST /auth/login
// 📋 데이터: { email: 'test@example.com', password: 'password123' }

// =====================================

// 요청 (이후 로그인 후)
const response = await instance.get('/clothing');

// 요청 인터셉터에 의해 자동 처리:
// Authorization: Bearer eyJhbGc... 헤더 자동 추가
// 📤 요청: GET /clothing
```

### 응답 인터셉터 (Response Interceptor)

**모든 응답 후에 에러를 처리하고 상태를 확인:**

```typescript
// ✅ 응답 인터셉터 등록
instance.interceptors.response.use(
  (response) => {
    // 응답 성공 (200-299)

    // 1. 로깅
    console.log('📥 응답:', response.status, response.data);

    // 2. 응답 반환
    return response;
  },
  (error) => {
    // 응답 에러 (4xx, 5xx)

    // 1. 상태 코드 확인
    const status = error.response?.status;
    const message = error.response?.data?.message;

    console.error('❌ 에러:', status, message);

    // 2. 401 (인증 오류) 처리
    if (status === 401) {
      console.log('🔑 토큰 만료됨. 로그아웃합니다.');

      // Zustand에서 로그아웃
      useAuthStore.getState().logout();

      // 로그인 페이지로 이동
      window.location.href = '/login';
    }

    // 3. 다른 에러도 처리
    if (status === 403) {
      console.log('🚫 접근 권한이 없습니다.');
    }

    if (status === 500) {
      console.log('⚠️ 서버 에러가 발생했습니다.');
    }

    // 4. 에러 반환
    return Promise.reject(error);
  }
);
```

**동작 예시:**

```typescript
// 성공한 요청
const response = await instance.get('/clothing');
// 📥 응답: 200 { success: true, data: [...] }

// 401 에러 (토큰 만료)
try {
  const response = await instance.get('/clothing');
} catch (error) {
  // 응답 인터셉터가 자동으로 처리:
  // 🔑 토큰 만료됨. 로그아웃합니다.
  // → localStorage에서 토큰 삭제
  // → window.location.href = '/login'로 이동
}
```

---

## API 클라이언트 설계

### 🎯 설계 패턴

API 요청들을 **클래스의 메서드로 정의하기:**

```typescript
import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import { useAuthStore } from '../store/authStore';

// 📝 타입 정의
interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface ClothingItem {
  id: string;
  name: string;
  color: string;
  pattern: string;
  // ... 더 많은 필드
}

interface UploadResponse {
  id: string;
  name: string;
  // ... AI 분석 결과
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ✅ API 클라이언트 클래스
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // 1️⃣ Axios 인스턴스 생성
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 2️⃣ 요청 인터셉터
    this.client.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 3️⃣ 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      }
    );
  }

  // 🔐 인증 API
  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<LoginResponse>> {
    const res = await this.client.post('/auth/login', { email, password });
    return res.data;
  }

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<ApiResponse<LoginResponse>> {
    const res = await this.client.post('/auth/register', {
      name,
      email,
      password,
    });
    return res.data;
  }

  // 👕 의류 API
  async uploadClothing(
    imageFile: File,
    metadata: any
  ): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('metadata', JSON.stringify(metadata));

    const res = await this.client.post('/clothing/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  }

  async getClothing(): Promise<ApiResponse<ClothingItem[]>> {
    const res = await this.client.get('/clothing');
    return res.data;
  }

  async getClothingById(id: string): Promise<ApiResponse<ClothingItem>> {
    const res = await this.client.get(`/clothing/${id}`);
    return res.data;
  }

  async updateClothing(
    id: string,
    updates: Partial<ClothingItem>
  ): Promise<ApiResponse<ClothingItem>> {
    const res = await this.client.patch(`/clothing/${id}`, updates);
    return res.data;
  }

  async deleteClothing(id: string): Promise<ApiResponse<{ id: string }>> {
    const res = await this.client.delete(`/clothing/${id}`);
    return res.data;
  }

  // ✨ 추천 API
  async getRecommendations(count?: number): Promise<ApiResponse<any>> {
    const params = count ? { count } : {};
    const res = await this.client.get('/recommendations/style', { params });
    return res.data;
  }
}

// ✅ 싱글톤 인스턴스 (모든 곳에서 같은 인스턴스 사용)
export const apiClient = new ApiClient();
```

---

## 고급 패턴

### 1️⃣ 재시도 로직 (Retry)

네트워크 오류 시 자동 재시도:

```typescript
class ApiClient {
  private retryCount = 3;
  private retryDelay = 1000; // 1초

  async request<T>(
    method: 'get' | 'post' | 'patch' | 'delete',
    url: string,
    data?: any
  ): Promise<T> {
    let lastError: any;

    // 최대 3번 시도
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        const config: any = { method, url };
        if (data) config.data = data;

        const response = await this.client(config);
        return response.data;
      } catch (error) {
        lastError = error;

        // 네트워크 오류만 재시도 (401, 403은 재시도 안 함)
        const status = (error as any).response?.status;
        if (status && status !== 401 && status !== 403) {
          if (attempt < this.retryCount - 1) {
            console.log(`🔄 재시도 ${attempt + 1}/${this.retryCount - 1}`);
            await new Promise((resolve) =>
              setTimeout(resolve, this.retryDelay * (attempt + 1))
            );
          }
        } else {
          break;
        }
      }
    }

    throw lastError;
  }
}
```

### 2️⃣ 요청 취소 (Cancel)

더 이상 필요 없는 요청 취소:

```typescript
import { CancelToken } from 'axios';

class ApiClient {
  private cancelTokens = new Map<string, CancelToken>();

  async getClothing(key: string = 'default'): Promise<any> {
    // 이전 요청 취소
    if (this.cancelTokens.has(key)) {
      this.cancelTokens.get(key)?.cancel('요청 취소됨');
    }

    // 새 취소 토큰 생성
    const cancelToken = axios.CancelToken.source();
    this.cancelTokens.set(key, cancelToken.token);

    try {
      const res = await this.client.get('/clothing', {
        cancelToken: cancelToken.token,
      });
      return res.data;
    } finally {
      this.cancelTokens.delete(key);
    }
  }

  cancelRequest(key: string = 'default') {
    const token = this.cancelTokens.get(key);
    if (token) {
      token.cancel('사용자가 취소했습니다');
    }
  }
}

// 사용 예
const apiClient = new ApiClient();

// 1. 요청 시작
const promise = apiClient.getClothing();

// 2. 사용자가 나가거나 새로운 요청을 시작하면
apiClient.cancelRequest(); // 요청 취소
```

### 3️⃣ 요청 캐싱

같은 요청을 반복하지 않기:

```typescript
class ApiClient {
  private cache = new Map<string, { data: any; time: number }>();
  private cacheExpiry = 5 * 60 * 1000; // 5분

  async getClothing(useCache = true): Promise<any> {
    const key = '/clothing';

    // 캐시 확인
    if (useCache && this.cache.has(key)) {
      const cached = this.cache.get(key)!;
      const isExpired = Date.now() - cached.time > this.cacheExpiry;

      if (!isExpired) {
        console.log('✅ 캐시에서 가져옴');
        return cached.data;
      }
    }

    // 캐시 없으면 요청
    console.log('🔄 새로 요청');
    const res = await this.client.get(key);

    // 캐시 저장
    this.cache.set(key, {
      data: res.data,
      time: Date.now(),
    });

    return res.data;
  }

  clearCache() {
    this.cache.clear();
  }
}
```

---

## Pocket Closet 사례

### 📁 현재 구조

```
frontend/src/services/
└── api.ts (ApiClient 클래스)
```

### 🔍 api.ts 분석

```typescript
// 1️⃣ Axios 인스턴스 생성
const instance = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// 2️⃣ 요청 인터셉터: 토큰 자동 추가
instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3️⃣ 응답 인터셉터: 401 에러 처리
instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();  // 자동 로그아웃
    }
    return Promise.reject(error);
  }
);

// 4️⃣ 메서드별로 API 호출 정의
class ApiClient {
  async login(email: string, password: string) {
    const res = await this.client.post('/auth/login', { email, password });
    return res.data;  // { success, message, data: { token, user } }
  }

  async uploadClothing(imageFile: File, metadata: any) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('metadata', JSON.stringify(metadata));

    const res = await this.client.post('/clothing/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // ... 더 많은 메서드
}

export const apiClient = new ApiClient();
```

### 💡 사용 예시

#### LoginPage.tsx

```typescript
import { apiClient } from '../services/api';
import { useAuthStore } from '../store/authStore';

function LoginPage() {
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (email: string, password: string) => {
    try {
      // ✅ apiClient.login() 호출
      // 요청 인터셉터: 이미 토큰이 있으면 Authorization 헤더 자동 추가
      // (로그인 전이므로 토큰 없음)
      const response = await apiClient.login(email, password);

      // ✅ 응답: { success: true, message: "...", data: { token, user } }
      const { token, user } = response.data;

      // ✅ Zustand에 저장 (localStorage도 자동 동기화)
      setToken(token);
      setUser(user);

      navigate('/dashboard');
    } catch (error) {
      // 응답 인터셉터에서 401은 이미 처리됨
      // 여기서는 다른 에러만 처리
    }
  };
}
```

#### UploadPage.tsx

```typescript
function UploadPage() {
  const handleUpload = async (file: File) => {
    try {
      // ✅ apiClient.uploadClothing() 호출
      // 요청 인터셉터: Authorization 헤더 자동 추가
      const response = await apiClient.uploadClothing(file, {});

      // ✅ 응답: { success: true, data: { id, name, colors, ... } }
      const clothingItem = response.data;

      console.log('업로드 성공:', clothingItem);
      navigate('/wardrobe');
    } catch (error) {
      // ❌ 에러 처리
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;
        setError(message);
      }
    }
  };
}
```

### 🎯 동작 흐름

```
1️⃣ LoginPage에서 로그인
   ↓
2️⃣ apiClient.login(email, password) 호출
   ↓
3️⃣ 요청 인터셉터
   - Authorization: Bearer (토큰 없음, 스킵)
   - 요청 로깅
   ↓
4️⃣ 백엔드: POST /api/auth/login
   - 이메일/비밀번호 확인
   - JWT 토큰 생성
   - 응답: { success: true, data: { token, user } }
   ↓
5️⃣ 응답 인터셉터
   - 상태 코드 200 (성공)
   - 응답 로깅
   ↓
6️⃣ LoginPage에서 응답 받음
   - token, user 추출
   - Zustand에 저장 (localStorage도 자동 동기화)
   - navigate('/dashboard')
   ↓
7️⃣ DashboardPage에서 apiClient.getClothing() 호출
   ↓
8️⃣ 요청 인터셉터
   - Authorization: Bearer {token} (자동 추가)
   - 요청 로깅
   ↓
9️⃣ 백엔드: GET /api/clothing
   - 토큰 검증
   - 사용자의 옷 목록 조회
   - 응답: { success: true, data: [...] }
   ↓
🔟 응답 인터셉터
   - 상태 코드 200 (성공)
   - 응답 로깅
   ↓
1️⃣1️⃣ DashboardPage에서 응답 받음
   - 옷 목록 렌더링
```

---

## 베스트 프랙티스

### ✅ 해야 할 것

```typescript
// 1. 타입 정의
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// 2. 에러 타입 명확화
try {
  const response = await apiClient.login(email, password);
  // ...
} catch (error) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    // ...
  }
}

// 3. 인터셉터에서 401 처리
// → 사용자가 로그인 페이지로 자동 이동

// 4. 재시도 로직
// → 네트워크 오류 시 자동 재시도

// 5. 요청 취소
// → 사용자가 나가면 불필요한 요청 취소
```

### ❌ 하지 말아야 할 것

```typescript
// 1. 매번 토큰 추가
// ❌ const headers = { Authorization: `Bearer ${token}` };
// ✅ 인터셉터에서 자동 추가

// 2. 매번 에러 처리
// ❌ try-catch를 모든 요청마다
// ✅ 인터셉터에서 통일된 처리

// 3. API URL 하드코딩
// ❌ 'http://localhost:3001/api/clothing'
// ✅ baseURL + 상대 경로

// 4. fetch 대신 axios 사용
// ❌ fetch로 직접 호출
// ✅ apiClient 메서드 사용

// 5. 응답 후 처리
// ❌ response.data.data.data 중첩 접근
// ✅ 메서드에서 이미 처리하고 반환
```

---

## 정리

### Axios 인터셉터의 역할

| 인터셉터 | 역할 | 예시 |
|---------|------|------|
| **요청** | 모든 요청 전에 처리 | 토큰 추가, 헤더 설정, 로깅 |
| **응답** | 모든 응답 후에 처리 | 에러 처리, 상태 확인, 로깅 |

### API 클라이언트의 이점

- ✅ 중복 코드 제거
- ✅ 일관된 에러 처리
- ✅ 토큰 자동 관리
- ✅ 타입 안정성
- ✅ 테스트 용이
- ✅ 유지보수 용이

### Pocket Closet의 구현

- ✅ Axios 인스턴스 생성 (baseURL 설정)
- ✅ 요청 인터셉터 (토큰 자동 추가)
- ✅ 응답 인터셉터 (401 에러 처리)
- ✅ API 메서드별 정의
- ✅ 타입 안정성 (TypeScript)

---

## 참고 자료

- [Axios 공식 문서](https://axios-http.com/)
- [Axios 인터셉터](https://axios-http.com/docs/interceptors)
- [REST API 에러 처리](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

**다음 글**: Tailwind CSS로 반응형 UI 만들기 (POC-69)
