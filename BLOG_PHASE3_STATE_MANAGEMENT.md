# React 상태 관리: Zustand vs Context API

## 📚 목차
1. [상태 관리란?](#상태-관리란)
2. [Context API](#context-api)
3. [Zustand](#zustand)
4. [비교: Zustand vs Context API](#비교-zustand-vs-context-api)
5. [실무 선택 가이드](#실무-선택-가이드)
6. [Pocket Closet 사례](#pocket-closet-사례)

---

## 상태 관리란?

### 🤔 상태 관리가 필요한 이유

React에서 컴포넌트는 데이터(상태)를 가지고 있습니다.

```typescript
// ❌ Props drilling 문제
<App>
  <Header user={user} />           {/* user 필요 */}
  <Main user={user} />             {/* user 필요 */}
    <Sidebar user={user} />        {/* user 필요 */}
      <UserMenu user={user} />     {/* 실제로 필요 */}
```

**문제점:**
- 깊은 계층에 있는 컴포넌트에 props를 전달하려면 중간 컴포넌트들도 받아야 함
- 중간 컴포넌트는 해당 props를 사용하지 않음
- 코드가 복잡하고 유지보수가 어려움

### ✅ 상태 관리 솔루션

상태를 중앙에서 관리하고, 필요한 컴포넌트가 직접 접근하는 방식:

```typescript
// ✅ 상태 관리
const user = useAuthStore((state) => state.user);

// 모든 컴포넌트에서 직접 접근 가능
<UserMenu />  // 내부에서 user 가져옴
<Header />    // 내부에서 user 가져옴
```

---

## Context API

### 🎯 Context API란?

**Context**: React에 내장된 상태 공유 메커니즘

### 기본 사용법

#### 1️⃣ Context 생성

```typescript
import { createContext } from 'react';

// Context 객체 생성
export const AuthContext = createContext<{
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
} | undefined>(undefined);
```

#### 2️⃣ Provider 생성

```typescript
import { ReactNode, useState } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### 3️⃣ Custom Hook 생성

```typescript
import { useContext } from 'react';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### 4️⃣ App에 감싸기

```typescript
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 라우트들 */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

#### 5️⃣ 컴포넌트에서 사용

```typescript
function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <div>
      <p>사용자: {user?.name}</p>
      <button onClick={logout}>로그아웃</button>
    </div>
  );
}
```

### 📊 Context API 예제: 테마 관리

```typescript
// 1. Context 생성
const ThemeContext = createContext<{
  isDark: boolean;
  toggleTheme: () => void;
} | undefined>(undefined);

// 2. Provider
function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. Custom Hook
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

// 4. 사용
function App() {
  return (
    <ThemeProvider>
      <Header />
      <Main />
      <Footer />
    </ThemeProvider>
  );
}

function Header() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className={isDark ? 'bg-gray-900' : 'bg-white'}>
      <button onClick={toggleTheme}>
        {isDark ? '☀️' : '🌙'}
      </button>
    </header>
  );
}
```

### ⚠️ Context API의 문제점

#### 1️⃣ 성능 문제 (Re-render)

```typescript
// ❌ 문제: 작은 상태 변화에도 모든 구독자가 리렌더링
const AuthContext = createContext<{
  user: User | null;
  notifications: Notification[];  // 알림만 변해도
  theme: 'light' | 'dark';         // user를 쓰는 컴포넌트가 리렌더링됨
}>(...);

// UserMenu는 user만 필요하지만
// notifications이 변하면 리렌더링됨
function UserMenu() {
  const { user } = useContext(AuthContext);  // ← 전체 Context 구독
  return <div>{user?.name}</div>;
}
```

**해결책:**
```typescript
// ✅ 여러 Context로 분리
export const UserContext = createContext(null);
export const NotificationContext = createContext(null);
export const ThemeContext = createContext(null);

// 이렇게 분리하면 필요한 것만 구독 가능
function UserMenu() {
  const { user } = useContext(UserContext);  // user 변화만 감지
}
```

#### 2️⃣ 보일러플레이트 코드

```typescript
// Context, Provider, Custom Hook을 모두 작성해야 함
// 3개 파일 이상 필요할 수 있음
```

#### 3️⃣ 비동기 작업 처리가 복잡

```typescript
// 로그인 로직
const login = async (email: string, password: string) => {
  setLoading(true);
  try {
    const response = await apiClient.login(email, password);
    setUser(response.data);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

// 이 로직을 매번 Provider에 작성해야 함
```

---

## Zustand

### 🎯 Zustand란?

**가벼운 상태 관리 라이브러리** (Redux/MobX의 단순화 버전)

- 번들 크기: 2.2kB (Context보다 훨씬 가벼움)
- 보일러플레이트: 최소화
- TypeScript: 완벽 지원
- 비동기: 간편한 처리

### 기본 사용법

#### 1️⃣ Store 생성

```typescript
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthStore {
  // State (상태)
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions (액션)
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // 초기 상태
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  // 액션들
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, error: null });
  },

  // 비동기 액션
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.login(email, password);
      const { token, user } = response.data.data;

      set({
        user,
        token,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      throw error;
    }
  },
}));
```

#### 2️⃣ 컴포넌트에서 사용

```typescript
function LoginPage() {
  // Hook으로 직접 상태 접근
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const handleSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // 에러 처리
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <input type="email" placeholder="이메일" />
      <input type="password" placeholder="비밀번호" />
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? '로그인 중...' : '로그인'}
      </button>
    </div>
  );
}
```

#### 3️⃣ Provider 불필요

```typescript
// Context와 달리, Provider를 감싸지 않아도 됨!
// 모든 컴포넌트에서 직접 useAuthStore() 호출 가능

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* 더 많은 라우트들 */}
      </Routes>
    </Router>
  );
}
```

### 📊 Zustand 예제: 옷장 관리

```typescript
// Store 정의
interface ClothingItem {
  id: string;
  name: string;
  color: string;
  style: string[];
}

interface WardrobeStore {
  items: ClothingItem[];
  filters: {
    color?: string;
    style?: string;
  };

  // 액션
  addItem: (item: ClothingItem) => void;
  removeItem: (id: string) => void;
  setColorFilter: (color: string) => void;
  setStyleFilter: (style: string) => void;
  clearFilters: () => void;
  getFilteredItems: () => ClothingItem[];
}

export const useWardrobeStore = create<WardrobeStore>((set, get) => ({
  items: [],
  filters: {},

  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  setColorFilter: (color) =>
    set((state) => ({
      filters: { ...state.filters, color },
    })),

  setStyleFilter: (style) =>
    set((state) => ({
      filters: { ...state.filters, style },
    })),

  clearFilters: () =>
    set({
      filters: {},
    }),

  // 계산된 값 (selector 사용)
  getFilteredItems: () => {
    const state = get();
    return state.items.filter((item) => {
      if (state.filters.color && item.color !== state.filters.color) {
        return false;
      }
      if (
        state.filters.style &&
        !item.style.includes(state.filters.style)
      ) {
        return false;
      }
      return true;
    });
  },
}));

// 컴포넌트에서 사용
function WardrobePage() {
  // selector로 필요한 값만 구독
  const items = useWardrobeStore((state) => state.items);
  const filters = useWardrobeStore((state) => state.filters);
  const setColorFilter = useWardrobeStore(
    (state) => state.setColorFilter
  );
  const getFilteredItems = useWardrobeStore(
    (state) => state.getFilteredItems
  );

  const filteredItems = getFilteredItems();

  return (
    <div>
      <h1>내 옷장 ({filteredItems.length})</h1>

      {/* 필터 */}
      <div>
        <button onClick={() => setColorFilter('black')}>검정색</button>
        <button onClick={() => setColorFilter('blue')}>파란색</button>
      </div>

      {/* 의류 목록 */}
      <div className="grid">
        {filteredItems.map((item) => (
          <ClothingCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
```

### ✨ Zustand의 장점

#### 1️⃣ 간단한 문법

```typescript
// Context: 3개 파일 필요
// Zustand: 1개 파일로 끝남

// zustand는 그냥 한 줄
const store = create((set) => ({ ... }));
```

#### 2️⃣ 자동 성능 최적화

```typescript
// ✅ Zustand는 자동으로 필요한 것만 리렌더링
// selector로 특정 상태만 구독 가능

// user 변화만 감지
const user = useAuthStore((state) => state.user);

// token 변화만 감지
const token = useAuthStore((state) => state.token);

// user나 token 중 하나만 바뀌어도 리렌더링 안 됨
```

#### 3️⃣ 비동기 처리가 간단

```typescript
// 비동기 액션
fetchUser: async (id: string) => {
  const user = await api.getUser(id);
  set({ user });
},
```

#### 4️⃣ DevTools 통합

```typescript
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools((set) => ({
    // ...
  }))
);

// Redux DevTools에서 상태 변화 추적 가능
```

---

## 비교: Zustand vs Context API

| 항목 | Context API | Zustand |
|------|------------|---------|
| **설정 복잡도** | 복잡 (Provider, Context, Hook) | 간단 (store 정의만) |
| **번들 크기** | 0kB (내장) | 2.2kB |
| **Provider 필요** | ⭕ 필수 | ❌ 불필요 |
| **성능** | ⚠️ 수동 최적화 필요 | ✅ 자동 최적화 |
| **비동기 처리** | 복잡 | 간단 |
| **학습곡선** | 낮음 | 매우 낮음 |
| **DevTools** | 추가 설정 필요 | 쉬움 |
| **TypeScript** | 좋음 | 완벽함 |

### 📈 성능 비교

**Context API:**
```typescript
// ❌ 구독한 전체 객체가 변하면 모든 컴포넌트 리렌더링
<AuthContext.Provider value={{ user, token, isLoading }}>
  {/* user 변화 → token 구독자도 리렌더링 */}
</AuthContext.Provider>
```

**Zustand:**
```typescript
// ✅ selector로 선택한 값만 변하면 리렌더링
const user = useAuthStore((state) => state.user);  // user 변화만 감지
const token = useAuthStore((state) => state.token);  // token 변화만 감지
```

---

## 실무 선택 가이드

### ✅ Context API를 선택하세요

1. **소규모 프로젝트**
   - 상태 관리가 간단함
   - 외부 라이브러리 최소화

2. **학습 목적**
   - React 내장 기능 활용
   - 원리 이해에 좋음

3. **테마/언어 관리**
   - 간단한 전역 설정
   - Provider로 충분함

```typescript
// 예: 테마 관리
<ThemeProvider>
  <App />
</ThemeProvider>
```

### ✅ Zustand를 선택하세요

1. **중규모 이상 프로젝트** (권장)
   - 복잡한 상태 관리
   - 많은 액션 필요

2. **성능이 중요한 경우**
   - 수십 개의 컴포넌트가 상태 구독
   - 자동 성능 최적화 필요

3. **비동기 작업이 많은 경우**
   - API 호출
   - 로딩/에러 상태 관리

4. **DevTools 활용**
   - 상태 변화 추적
   - 디버깅 필요

```typescript
// 예: 복잡한 상태 관리
const useStore = create((set) => ({
  // 많은 상태와 액션
  user, token, notifications, theme,
  login, logout, updateProfile, ...
}));
```

---

## Pocket Closet 사례

### 🎯 우리의 선택: Zustand

**왜 Zustand를 선택했나?**

1. **복잡한 상태 관리**
   ```typescript
   // 인증 상태 + 옷장 데이터 + 필터 + 추천
   - user, token (인증)
   - clothingItems (옷)
   - filters (필터)
   - recommendations (추천)
   ```

2. **비동기 액션이 많음**
   ```typescript
   - login/logout
   - uploadClothing
   - fetchWardrobe
   - fetchRecommendations
   ```

3. **성능 최적화**
   - 여러 페이지에서 상태 구독
   - selector로 필요한 값만 선택
   - 자동 리렌더링 최적화

### 📁 현재 구조

```
frontend/src/
├── store/
│   ├── authStore.ts (Zustand)
│   └── clothingStore.ts (개발 예정)
└── pages/
    ├── LoginPage.tsx (useAuthStore 사용)
    ├── UploadPage.tsx (useAuthStore 사용)
    └── WardrobePage.tsx (useClothingStore 사용 예정)
```

### 🔧 authStore.ts 분석

```typescript
export const useAuthStore = create<AuthStore>((set) => ({
  // 상태
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  // 액션
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);  // localStorage 동기화
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, error: null });
  },
}));
```

**특징:**
- Provider 없음 (모든 페이지에서 접근 가능)
- localStorage와 동기화
- Axios 인터셉터가 자동으로 토큰 주입

### 사용 예시 (LoginPage.tsx)

```typescript
function LoginPage() {
  const setToken = useAuthStore((state) => state.setToken);  // ✅ selector
  const setUser = useAuthStore((state) => state.setUser);    // ✅ selector

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      const { token, user } = response.data.data;

      // ✅ Zustand에 저장 (자동으로 localStorage도 동기화)
      setToken(token);
      setUser(user);

      navigate('/dashboard');
    } catch (error) {
      // 에러 처리
    }
  };
}
```

---

## 정리

### Context API
- **장점**: 내장 기능, 배우기 쉬움
- **단점**: 보일러플레이트, 성능 수동 최적화
- **사용**: 간단한 전역 설정 (테마, 언어)

### Zustand
- **장점**: 간단, 성능 최적화, 비동기 처리
- **단점**: 외부 라이브러리
- **사용**: 복잡한 상태 관리, 중규모+ 프로젝트

### Pocket Closet
- **선택**: Zustand ✅
- **이유**: 복잡한 상태 + 비동기 + 성능
- **결과**: 간결하고 유지보수하기 쉬운 코드

---

## 참고 자료

- [Zustand 공식 문서](https://github.com/pmndrs/zustand)
- [React Context API 공식 문서](https://react.dev/learn/passing-data-deeply-with-context)
- [상태 관리 라이브러리 비교](https://github.com/pmndrs/zustand#motivation)

---

**다음 글**: Axios 인터셉터와 API 클라이언트 설계 (POC-68)
