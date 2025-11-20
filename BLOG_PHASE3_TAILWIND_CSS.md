# Tailwind CSS로 반응형 UI 만들기

## 📚 목차
1. [Tailwind CSS란?](#tailwind-css란)
2. [기본 개념](#기본-개념)
3. [반응형 디자인](#반응형-디자인)
4. [유틸리티 클래스](#유틸리티-클래스)
5. [컴포넌트 패턴](#컴포넌트-패턴)
6. [Pocket Closet 사례](#pocket-closet-사례)

---

## Tailwind CSS란?

### 🎯 Tailwind CSS의 개념

**유틸리티 우선(Utility-First) CSS 프레임워크**

- 미리 정의된 클래스로 스타일 적용
- CSS 파일 작성 불필요
- HTML에서 모든 스타일 처리
- 번들 크기 최소화 (사용한 클래스만 포함)

### Bootstrap vs Tailwind

#### Bootstrap (컴포넌트 우선)
```html
<!-- Bootstrap: 미리 만들어진 컴포넌트 사용 -->
<div class="card">
  <div class="card-header">제목</div>
  <div class="card-body">내용</div>
</div>

<!-- CSS 파일 -->
.card { ... }
.card-header { ... }
.card-body { ... }
```

#### Tailwind (유틸리티 우선)
```html
<!-- Tailwind: 유틸리티 클래스 조합 -->
<div class="border rounded-lg p-4 shadow">
  <div class="bg-blue-500 text-white px-4 py-2">제목</div>
  <div class="p-4">내용</div>
</div>

<!-- CSS 파일 불필요 -->
```

### 📦 설치

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### ⚙️ 설정 (tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',  // 어디를 스캔할지
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',  // 커스텀 색상
      },
    },
  },
  plugins: [],
};
```

### 📝 CSS 파일에 import

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 기본 개념

### 1️⃣ 유틸리티 클래스

**각 속성에 해당하는 클래스:**

```html
<!-- 배경색 -->
<div class="bg-blue-500">파란 배경</div>
<div class="bg-red-500">빨간 배경</div>
<div class="bg-green-500">초록 배경</div>

<!-- 텍스트 색상 -->
<p class="text-gray-900">어두운 텍스트</p>
<p class="text-gray-600">중간 텍스트</p>
<p class="text-gray-400">밝은 텍스트</p>

<!-- 패딩 -->
<div class="p-4">모든 면에 16px 패딩</div>
<div class="px-4 py-2">좌우 16px, 상하 8px</div>

<!-- 마진 -->
<div class="m-4">모든 면에 16px 마진</div>
<div class="mb-8">아래쪽 32px 마진</div>

<!-- 너비/높이 -->
<div class="w-full h-screen">전체 너비, 전체 높이</div>
<div class="w-1/2 h-64">50% 너비, 256px 높이</div>

<!-- 둥근 모서리 -->
<div class="rounded">기본 둥글기</div>
<div class="rounded-lg">더 둥글게</div>
<div class="rounded-full">완전히 둥글게</div>

<!-- 그림자 -->
<div class="shadow">가벼운 그림자</div>
<div class="shadow-lg">큰 그림자</div>
<div class="shadow-xl">매우 큰 그림자</div>

<!-- 글자 크기 -->
<h1 class="text-4xl font-bold">제목</h1>
<p class="text-base">본문</p>
<small class="text-sm">작은 텍스트</small>

<!-- 글자 굵기 -->
<p class="font-light">100</p>
<p class="font-normal">400</p>
<p class="font-bold">700</p>
<p class="font-black">900</p>
```

### 2️⃣ 색상 시스템

**일관된 색상 팔레트:**

```
50:    매우 밝음 (배경용)
100:   밝음
200:   밝음-중간
300:   밝음-짙음
400:   중간
500:   기본 (가장 많이 사용)
600:   짙음
700:   매우 짙음
800:   더 짙음
900:   매우 짙음 (텍스트용)
```

```html
<!-- 파란색 계열 -->
<div class="bg-blue-50">배경 (50)</div>
<div class="bg-blue-100">배경 (100)</div>
<div class="bg-blue-500">메인 색상 (500)</div>
<div class="bg-blue-900">어두운 색상 (900)</div>

<!-- 일관된 색상 사용 -->
<button class="bg-blue-500 hover:bg-blue-600 text-white">
  버튼
</button>
```

### 3️⃣ Spacing 시스템

**일관된 간격:**

```
0:    0px
1:    4px
2:    8px
3:    12px
4:    16px (가장 기본)
6:    24px
8:    32px
12:   48px
16:   64px
20:   80px
24:   96px
```

```html
<!-- 패딩 -->
<div class="p-4">16px 패딩</div>
<div class="p-8">32px 패딩</div>

<!-- 마진 -->
<div class="m-4">16px 마진</div>
<div class="m-auto">자동 마진 (중앙 정렬)</div>

<!-- Gap (Flex/Grid) -->
<div class="flex gap-4">16px 간격</div>
<div class="grid gap-8">32px 간격</div>
```

---

## 반응형 디자인

### 🎯 브레이크포인트

**다양한 화면 크기:**

```
sm:  640px  (스마트폰 큰 화면)
md:  768px  (태블릿)
lg:  1024px (데스크톱)
xl:  1280px (큰 데스크톱)
2xl: 1536px (매우 큰 화면)
```

### 📱 모바일 우선 접근법

```html
<!-- 모바일 (기본): 1열 -->
<!-- sm 이상: 2열 -->
<!-- md 이상: 3열 -->
<!-- lg 이상: 4열 -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  <div>항목 1</div>
  <div>항목 2</div>
  <div>항목 3</div>
  <div>항목 4</div>
</div>
```

### 💡 반응형 패턴 예제

#### 1️⃣ 네비게이션 바

```html
<!-- 모바일: 세로 (flex-col), 모바일 메뉴 아이콘 보임 -->
<!-- md 이상: 가로 (flex-row), 메뉴 아이콘 숨김 -->
<nav class="flex flex-col md:flex-row justify-between items-center p-4">
  <div class="text-xl font-bold">Logo</div>
  <div class="hidden md:flex gap-4">
    <a href="#">Home</a>
    <a href="#">About</a>
    <a href="#">Contact</a>
  </div>
  <button class="md:hidden">☰</button>
</nav>
```

#### 2️⃣ 카드 레이아웃

```html
<!-- 모바일: 1열, 전체 폭 -->
<!-- md 이상: 2열, 최대 6개 아이템 -->
<!-- lg 이상: 3열, 최대 9개 아이템 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="bg-white rounded-lg shadow p-4">카드 1</div>
  <div class="bg-white rounded-lg shadow p-4">카드 2</div>
  <div class="bg-white rounded-lg shadow p-4">카드 3</div>
</div>
```

#### 3️⃣ 사이드바 + 메인

```html
<!-- 모바일: 메인만 표시 (사이드바는 z-index로 오버레이) -->
<!-- md 이상: 사이드바 + 메인 함께 표시 -->
<div class="flex flex-col md:flex-row gap-4">
  <!-- 사이드바 (모바일에서는 숨김) -->
  <aside class="hidden md:block w-48">
    <div class="sticky top-4">
      <h3 class="font-bold mb-4">메뉴</h3>
      <!-- 메뉴 항목들 -->
    </div>
  </aside>

  <!-- 메인 콘텐츠 -->
  <main class="flex-1">
    <!-- 콘텐츠 -->
  </main>
</div>
```

#### 4️⃣ 이미지 + 텍스트

```html
<!-- 모바일: 세로 (이미지 위, 텍스트 아래) -->
<!-- md 이상: 가로 (이미지 좌, 텍스트 우) -->
<div class="flex flex-col md:flex-row gap-4">
  <img src="image.jpg" class="w-full md:w-1/2 rounded-lg" />
  <div class="flex-1">
    <h2 class="text-2xl font-bold mb-2">제목</h2>
    <p class="text-gray-600">설명 텍스트</p>
  </div>
</div>
```

---

## 유틸리티 클래스

### 📐 Flexbox (유연한 레이아웃)

```html
<!-- 가로 정렬 (기본) -->
<div class="flex">
  <div>항목 1</div>
  <div>항목 2</div>
  <div>항목 3</div>
</div>

<!-- 세로 정렬 -->
<div class="flex flex-col">
  <div>항목 1</div>
  <div>항목 2</div>
  <div>항목 3</div>
</div>

<!-- 중앙 정렬 (수평 + 수직) -->
<div class="flex items-center justify-center h-screen">
  중앙에 배치됨
</div>

<!-- 공간 분산 -->
<div class="flex justify-between">
  <div>왼쪽</div>
  <div>오른쪽</div>
</div>

<!-- 간격 설정 -->
<div class="flex gap-4">
  <div>항목 1</div>
  <div>항목 2</div>
</div>

<!-- 자동 랩 (아이템이 너무 많으면 다음 줄로) -->
<div class="flex flex-wrap gap-4">
  <div>항목 1</div>
  <div>항목 2</div>
  <div>항목 3</div>
</div>
```

### 🔲 Grid (격자 레이아웃)

```html
<!-- 3열 그리드 -->
<div class="grid grid-cols-3 gap-4">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>

<!-- 반응형 그리드 -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  <div>1</div>
  <div>2</div>
  <div>3</div>
  <div>4</div>
</div>

<!-- 아이템이 차지할 열 수 -->
<div class="grid grid-cols-3 gap-4">
  <div class="col-span-2">2열 차지</div>
  <div>1열</div>
</div>
```

### 🎨 호버 / 활성화 상태

```html
<!-- 호버 효과 -->
<button class="bg-blue-500 hover:bg-blue-600">
  호버하면 색상 변함
</button>

<!-- 활성화 상태 -->
<button class="bg-blue-500 active:bg-blue-700">
  클릭하면 색상 변함
</button>

<!-- 포커스 상태 (접근성) -->
<input class="border focus:ring-2 focus:ring-blue-500 focus:border-transparent" />

<!-- 비활성화 상태 -->
<button class="bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
  비활성화
</button>

<!-- 조건부 스타일 -->
<div class={`bg-white ${isDark ? 'dark:bg-gray-900' : 'dark:bg-white'}`}>
  다크 모드
</div>
```

### 🎬 애니메이션

```html
<!-- 회전 애니메이션 -->
<div class="animate-spin">
  로딩 중...
</div>

<!-- 스핀-슬로우 (느린 회전) -->
<div class="animate-spin-slow">
  느린 로딩
</div>

<!-- 페이드 인 -->
<div class="animate-fade-in">
  페이드 인 효과
</div>

<!-- 커스텀 애니메이션 (config에서 정의) -->
<div class="animate-bounce">
  튀는 효과
</div>
```

---

## 컴포넌트 패턴

### 🧩 재사용 가능한 컴포넌트

#### 1️⃣ 버튼

```html
<!-- 기본 버튼 -->
<button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
  기본
</button>

<!-- 아웃라인 버튼 -->
<button class="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition">
  아웃라인
</button>

<!-- 소형 버튼 -->
<button class="px-2 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
  소형
</button>

<!-- 전체 너비 버튼 -->
<button class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
  전체 너비
</button>
```

#### 2️⃣ 입력 필드

```html
<!-- 기본 입력 -->
<input
  type="text"
  placeholder="이메일을 입력하세요"
  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
/>

<!-- 에러 상태 -->
<input
  type="text"
  class="w-full px-4 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
/>
<p class="text-red-500 text-sm mt-1">이메일 형식이 잘못되었습니다</p>

<!-- 비활성화 -->
<input
  type="text"
  disabled
  class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
/>
```

#### 3️⃣ 카드

```html
<!-- 기본 카드 -->
<div class="bg-white rounded-lg shadow p-6">
  <h3 class="text-lg font-bold mb-2">제목</h3>
  <p class="text-gray-600">설명</p>
</div>

<!-- 호버 효과 있는 카드 -->
<div class="bg-white rounded-lg shadow hover:shadow-lg hover:scale-105 transition cursor-pointer p-6">
  <h3 class="text-lg font-bold mb-2">클릭 가능</h3>
  <p class="text-gray-600">설명</p>
</div>

<!-- 이미지 있는 카드 -->
<div class="bg-white rounded-lg shadow overflow-hidden">
  <img src="image.jpg" class="w-full h-48 object-cover" />
  <div class="p-4">
    <h3 class="text-lg font-bold mb-2">제목</h3>
    <p class="text-gray-600">설명</p>
  </div>
</div>
```

#### 4️⃣ 배지

```html
<!-- 기본 배지 -->
<span class="inline-block px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm font-semibold">
  배지
</span>

<!-- 다양한 색상 -->
<span class="inline-block px-3 py-1 bg-green-100 text-green-900 rounded-full text-sm">성공</span>
<span class="inline-block px-3 py-1 bg-red-100 text-red-900 rounded-full text-sm">에러</span>
<span class="inline-block px-3 py-1 bg-yellow-100 text-yellow-900 rounded-full text-sm">경고</span>
```

#### 5️⃣ 알림

```html
<!-- 성공 알림 -->
<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
  <strong>성공!</strong> 작업이 완료되었습니다.
</div>

<!-- 에러 알림 -->
<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
  <strong>에러!</strong> 문제가 발생했습니다.
</div>

<!-- 정보 알림 -->
<div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg">
  <strong>정보:</strong> 알려드릴 사항입니다.
</div>
```

---

## Pocket Closet 사례

### 📁 구조

```
frontend/src/
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   └── UploadPage.tsx
└── index.css (Tailwind import)
```

### 🎨 LoginPage 분석

```jsx
<div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100">
  {/* 배경: 최소 전체 화면 높이, 그라디언트 */}

  <div className="max-w-md mx-auto">
    {/* 중앙 정렬, 최대 너비 28rem (448px) */}

    <div className="bg-white rounded-lg shadow-xl p-8">
      {/* 흰 배경, 둥근 모서리, 큰 그림자, 32px 패딩 */}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          {/* 에러: 빨간 배경, 빨간 테두리, 빨간 텍스트 */}
        </div>
      )}

      <input
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
        {/*
          - w-full: 전체 너비
          - px-4 py-2: 좌우 16px, 상하 8px
          - border border-gray-300: 1px 회색 테두리
          - rounded-md: 중간 크기 둥글기
          - focus: 포커스 시 파란색 링
          - disabled: 비활성화 시 회색 배경
          - transition: 색상 변화 애니메이션
        */}
      />

      <button
        className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 rounded-md hover:opacity-90 transition disabled:opacity-50"
        {/*
          - w-full: 전체 너비
          - mt-6: 위쪽 마진 24px
          - bg-gradient: 파란색에서 인디고로 그라디언트
          - text-white font-semibold: 흰색 굵은 텍스트
          - py-2: 상하 8px
          - hover:opacity-90: 호버 시 90% 투명도
          - disabled: 비활성화 시 50% 투명도
        */}
      />
    </div>
  </div>
</div>
```

### 📸 DashboardPage 분석

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/*
    - 모바일: 1열
    - md (태블릿): 2열
    - lg (데스크톱): 4열
    - gap-6: 24px 간격
  */}

  <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden group">
    {/*
      - bg-white: 흰 배경
      - rounded-lg: 큰 둥글기
      - shadow-md: 중간 그림자
      - hover:shadow-lg: 호버 시 큰 그림자
      - transition: 부드러운 변화
      - overflow-hidden: 자식 요소가 테두리를 벗어나지 않도록
      - group: 자식 요소에 group-hover 적용 가능
    */}

    <div className="bg-blue-50 p-8 group-hover:bg-blue-100 transition">
      {/* 부모의 hover 시 배경 색상 변함 */}
      <div className="text-4xl mb-2">📸</div>
      <h3 className="font-semibold text-blue-900 text-lg mb-2">의류 업로드</h3>
    </div>

    <div className="p-4">
      <p className="text-sm text-gray-600 mb-4">설명</p>
      <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition">
        업로드하기
      </button>
    </div>
  </div>
</div>
```

### 📱 UploadPage 분석 (드래그 앤 드롭)

```jsx
<div
  className={`border-2 border-dashed rounded-lg p-12 text-center transition ${
    isDragging
      ? 'border-blue-500 bg-blue-50'
      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
  }`}
  {/*
    - 기본 상태: 회색 테두리, 회색 배경
    - isDragging: 파란색 테두리, 파란 배경
    - border-2 border-dashed: 2px 점선 테두리
    - rounded-lg: 큰 둥글기
    - p-12: 48px 패딩
    - text-center: 중앙 정렬
    - transition: 부드러운 변화
  */}
>
  <input type="file" id="file-input" className="hidden" />
  <label htmlFor="file-input" className="cursor-pointer">
    <div className="text-4xl mb-3">📸</div>
    <p className="text-lg font-semibold text-gray-900 mb-1">
      이미지를 여기로 드래그하세요
    </p>
  </label>
</div>
```

---

## 베스트 프랙티스

### ✅ 해야 할 것

```jsx
// 1. 반응형 우선
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

// 2. 일관된 색상 사용
<button className="bg-blue-500 hover:bg-blue-600">
// ← 매번 다른 색상 쓰지 말기, 팔레트 정하기

// 3. 간격 시스템 사용
<div className="p-4 m-4 gap-6">
// ← 4, 8, 12, 16 등 시스템 사용

// 4. 조건부 클래스 (동적)
<div className={`px-4 py-2 ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`}>

// 5. 호버/포커스 상태 추가
<button className="hover:opacity-90 focus:ring-2 focus:ring-blue-500">
```

### ❌ 하지 말아야 할 것

```jsx
// 1. 커스텀 CSS로 대체
// ❌ <div style={{ backgroundColor: '#3B82F6' }}>
// ✅ <div className="bg-blue-500">

// 2. 임의 값 사용 (성능 저하)
// ❌ <div className="p-[23px]">
// ✅ <div className="p-6"> (가장 가까운 값)

// 3. 반응형 없이 하드코딩
// ❌ <div className="grid grid-cols-4">
// ✅ <div className="grid grid-cols-1 md:grid-cols-4">

// 4. 매직 넘버 사용
// ❌ <div className="ml-[47px]">
// ✅ <div className="ml-12"> (또는 space 조정)

// 5. 불필요한 클래스
// ❌ <div className="text-left"> (기본값이 left)
// ✅ <div> (필요할 때만 사용)
```

---

## 고급 팁

### 🎯 Extract Component Pattern

복잡한 클래스는 컴포넌트로:

```jsx
// ❌ 복잡한 클래스
<button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
  클릭
</button>

// ✅ 컴포넌트로 추출
function PrimaryButton({ children, ...props }) {
  return (
    <button
      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
      {...props}
    >
      {children}
    </button>
  );
}

<PrimaryButton>클릭</PrimaryButton>
```

### 🔧 @apply로 CSS 클래스 만들기

```css
/* index.css */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition;
  }

  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
}
```

```jsx
// 사용
<button className="btn-primary">클릭</button>
<div className="card">내용</div>
```

### 📐 Grid/Flex 팁

```jsx
// 중앙 정렬 (수평 + 수직)
<div className="flex items-center justify-center h-screen">중앙</div>

// 공간 균등 분배
<div className="flex justify-between">
  <div>왼쪽</div>
  <div>오른쪽</div>
</div>

// 자식이 같은 크기
<div className="flex">
  <div className="flex-1">1</div>
  <div className="flex-1">2</div>
  <div className="flex-1">3</div>
</div>

// 마지막 아이템만 다른 크기
<div className="flex">
  <div className="flex-1">1</div>
  <div className="flex-1">2</div>
  <div className="flex-2">3 (2배)</div>
</div>
```

---

## 정리

### Tailwind CSS의 장점

- ✅ 빠른 개발 (CSS 파일 작성 불필요)
- ✅ 일관된 디자인 (색상/간격 시스템)
- ✅ 번들 크기 최소화 (사용한 것만 포함)
- ✅ 반응형 쉬움 (sm:, md:, lg: 프리픽스)
- ✅ 유지보수 쉬움 (HTML에서 스타일 확인)
- ✅ 커스터마이징 가능 (tailwind.config.js)

### 반응형 디자인 핵심

```
모바일 우선:
- 기본: 모바일 (스마트폰)
- sm: 640px+ (큰 스마트폰)
- md: 768px+ (태블릿)
- lg: 1024px+ (데스크톱)
- xl: 1280px+ (큰 데스크톱)
```

### Pocket Closet에서 사용한 패턴

- ✅ 그라디언트 배경 (from-blue-50 to-indigo-100)
- ✅ 카드 레이아웃 (rounded-lg, shadow)
- ✅ 호버 효과 (hover:shadow-lg, hover:bg-color)
- ✅ 반응형 그리드 (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- ✅ 조건부 클래스 (isDragging ? 'border-blue-500' : 'border-gray-300')
- ✅ 접근성 (focus:ring, disabled:opacity)

---

## 참고 자료

- [Tailwind CSS 공식 문서](https://tailwindcss.com)
- [색상 팔레트](https://tailwindcss.com/docs/customizing-colors)
- [반응형 디자인](https://tailwindcss.com/docs/responsive-design)
- [호버/포커스 상태](https://tailwindcss.com/docs/hover-focus-and-other-states)

---

**다음 글**: React Hook Form으로 효율적인 폼 관리 (POC-70)
