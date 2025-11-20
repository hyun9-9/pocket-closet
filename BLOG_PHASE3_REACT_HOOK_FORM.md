# React Hook Form으로 효율적인 폼 관리

## 📚 목차
1. [React Hook Form이란?](#react-hook-form이란)
2. [기본 개념](#기본-개념)
3. [Register와 Watch](#register와-watch)
4. [폼 검증](#폼-검증)
5. [에러 처리](#에러-처리)
6. [Pocket Closet 사례](#pocket-closet-사례)
7. [고급 기능](#고급-기능)

---

## React Hook Form이란?

### 🎯 React Hook Form의 개념

**폼 상태 관리를 간단하게 하는 라이브러리**

- 최소한의 리렌더링 (성능 최적화)
- 작은 번들 크기 (~9KB)
- TypeScript 지원
- HTML5 표준 검증
- 복잡한 폼도 쉽게 관리 가능

### 📊 useState vs React Hook Form

#### 기존 방식 (useState 사용)

```jsx
// ❌ 복잡하고 비효율적
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (value) => {
    if (!value) return '이메일을 입력하세요';
    if (!value.includes('@')) return '유효한 이메일을 입력하세요';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return '비밀번호를 입력하세요';
    if (value.length < 6) return '6자 이상 입력하세요';
    return '';
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setErrors({ ...errors, email: validateEmail(value) });
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setErrors({ ...errors, password: validatePassword(value) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    // API 호출
    console.log({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={handleEmailChange}
        placeholder="이메일"
      />
      {errors.email && <p>{errors.email}</p>}

      <input
        type="password"
        value={password}
        onChange={handlePasswordChange}
        placeholder="비밀번호"
      />
      {errors.password && <p>{errors.password}</p>}

      <button type="submit">로그인</button>
    </form>
  );
}
```

**문제점:**
- 매번 onChange 핸들러 필요
- 검증 로직 복잡
- 상태 관리 복잡
- 매번 리렌더링

#### React Hook Form 방식

```jsx
// ✅ 간단하고 효율적
import { useForm } from 'react-hook-form';

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    // data = { email: '...', password: '...' }
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email', {
          required: '이메일을 입력하세요',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: '유효한 이메일을 입력하세요',
          },
        })}
        placeholder="이메일"
      />
      {errors.email && <p>{errors.email.message}</p>}

      <input
        {...register('password', {
          required: '비밀번호를 입력하세요',
          minLength: {
            value: 6,
            message: '6자 이상 입력하세요',
          },
        })}
        type="password"
        placeholder="비밀번호"
      />
      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit">로그인</button>
    </form>
  );
}
```

**장점:**
- 간결한 코드
- 자동 검증
- 최소한의 리렌더링
- 명확한 에러 메시지

---

## 기본 개념

### 1️⃣ useForm 훅

**폼 전체를 관리하는 핵심 훅:**

```jsx
import { useForm } from 'react-hook-form';

function MyForm() {
  const {
    register,           // input 등록
    handleSubmit,       // 폼 제출 처리
    watch,              // 값 감시
    reset,              // 폼 초기화
    formState,          // 에러, 로딩 등
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      remember: false,  // checkbox
    },
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 입력 필드들 */}
    </form>
  );
}
```

### 2️⃣ register() 함수

**입력 필드를 폼에 등록:**

```jsx
// 기본 사용법
<input {...register('email')} />

// 검증 규칙 추가
<input
  {...register('email', {
    required: '필수 항목입니다',           // 필수 여부
    minLength: { value: 3, message: '...' },  // 최소 길이
    maxLength: { value: 50, message: '...' }, // 최대 길이
    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '...' }, // 정규식
    validate: (value) => {                // 커스텀 검증
      if (value === 'admin') return '예약어입니다';
      return true;
    },
  })}
  placeholder="이메일"
/>
```

### 3️⃣ handleSubmit() 함수

**폼 제출 처리 (자동 검증):**

```jsx
const onSubmit = (data) => {
  // data: { email: '...', password: '...' }
  // 모든 검증을 통과한 경우만 실행
  console.log('유효한 데이터:', data);
};

const onError = (errors) => {
  // 검증 실패 시 실행 (선택사항)
  console.log('에러:', errors);
};

<form onSubmit={handleSubmit(onSubmit, onError)}>
  {/* 입력 필드들 */}
  <button type="submit">제출</button>
</form>
```

---

## Register와 Watch

### 📝 register - 필드 등록

**각 입력 필드를 폼에 등록:**

```jsx
import { useForm } from 'react-hook-form';

function RegistrationForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    // { name: '...', email: '...', age: 30, category: '...' }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 텍스트 입력 */}
      <input
        {...register('name', { required: '이름을 입력하세요' })}
        placeholder="이름"
      />
      {errors.name && <p className="text-red-500">{errors.name.message}</p>}

      {/* 이메일 입력 */}
      <input
        type="email"
        {...register('email', {
          required: '이메일을 입력하세요',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: '유효한 이메일을 입력하세요',
          },
        })}
        placeholder="이메일"
      />
      {errors.email && <p className="text-red-500">{errors.email.message}</p>}

      {/* 숫자 입력 */}
      <input
        type="number"
        {...register('age', {
          required: '나이를 입력하세요',
          min: { value: 18, message: '18세 이상이어야 합니다' },
          max: { value: 100, message: '100세 이하여야 합니다' },
        })}
        placeholder="나이"
      />
      {errors.age && <p className="text-red-500">{errors.age.message}</p>}

      {/* select 선택 */}
      <select {...register('category', { required: '카테고리를 선택하세요' })}>
        <option value="">선택하세요</option>
        <option value="it">IT</option>
        <option value="business">비즈니스</option>
        <option value="design">디자인</option>
      </select>
      {errors.category && <p className="text-red-500">{errors.category.message}</p>}

      {/* checkbox */}
      <label>
        <input {...register('agree')} type="checkbox" />
        이용약관에 동의합니다
      </label>

      <button type="submit">등록</button>
    </form>
  );
}
```

### 👁️ watch - 필드 값 감시

**특정 필드의 값을 실시간으로 감시:**

```jsx
import { useForm } from 'react-hook-form';

function ConditionalForm() {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      userType: 'personal',  // 개인/회사
      company: '',
    },
  });

  // userType 필드를 감시
  const userType = watch('userType');

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 사용자 타입 선택 */}
      <select {...register('userType')}>
        <option value="personal">개인</option>
        <option value="company">회사</option>
      </select>

      {/* 회사 선택 시만 표시 */}
      {userType === 'company' && (
        <input
          {...register('company', {
            required: userType === 'company' ? '회사명을 입력하세요' : false,
          })}
          placeholder="회사명"
        />
      )}

      <button type="submit">제출</button>
    </form>
  );
}
```

**watch() 사용 예제:**

```jsx
const { watch } = useForm();

// 1. 특정 필드만 감시
const email = watch('email');

// 2. 여러 필드 감시
const [email, password] = watch(['email', 'password']);

// 3. 모든 필드 감시
const allValues = watch();
console.log(allValues); // { email: '...', password: '...', ... }

// 4. 콜백 함수로 감시
watch((data) => {
  console.log('폼 데이터 변경:', data);
});
```

---

## 폼 검증

### ✅ 기본 검증 규칙

```jsx
<input
  {...register('email', {
    // 필수 여부
    required: '이메일은 필수입니다',

    // 또는 객체 형식 (에러 타입별 메시지)
    required: { value: true, message: '이메일은 필수입니다' },

    // 최소 길이
    minLength: { value: 6, message: '6자 이상 입력하세요' },

    // 최대 길이
    maxLength: { value: 50, message: '50자 이하 입력하세요' },

    // 정규식 패턴
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: '유효한 이메일을 입력하세요',
    },

    // 최소값 (숫자)
    min: { value: 18, message: '18 이상이어야 합니다' },

    // 최대값 (숫자)
    max: { value: 100, message: '100 이하여야 합니다' },

    // 커스텀 검증
    validate: (value) => {
      if (value === 'admin') return '예약어입니다';
      if (value.length < 5) return '5자 이상이어야 합니다';
      return true; // 검증 통과
    },
  })}
/>
```

### 🔗 상호 의존 검증 (필드 간 비교)

```jsx
import { useForm } from 'react-hook-form';

function PasswordForm() {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // 비밀번호 필드 감시
  const password = watch('password');

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        type="password"
        {...register('password', {
          required: '비밀번호를 입력하세요',
          minLength: {
            value: 6,
            message: '6자 이상 입력하세요',
          },
        })}
        placeholder="비밀번호"
      />
      {errors.password && <p className="text-red-500">{errors.password.message}</p>}

      {/* 비밀번호 확인 */}
      <input
        type="password"
        {...register('confirmPassword', {
          required: '비밀번호 확인을 입력하세요',
          validate: (value) => {
            if (value !== password) return '비밀번호가 일치하지 않습니다';
            return true;
          },
        })}
        placeholder="비밀번호 확인"
      />
      {errors.confirmPassword && (
        <p className="text-red-500">{errors.confirmPassword.message}</p>
      )}

      <button type="submit">등록</button>
    </form>
  );
}
```

### 🌐 비동기 검증 (API 검증)

```jsx
import { useForm } from 'react-hook-form';

function EmailCheckForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // 이메일 중복 확인 API
  const checkEmailDuplicate = async (email) => {
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const { isDuplicate } = await response.json();

      if (isDuplicate) return '이미 사용 중인 이메일입니다';
      return true;
    } catch {
      return '이메일 확인 중 오류가 발생했습니다';
    }
  };

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        type="email"
        {...register('email', {
          required: '이메일을 입력하세요',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: '유효한 이메일을 입력하세요',
          },
          validate: checkEmailDuplicate, // 비동기 검증
        })}
        placeholder="이메일"
      />
      {errors.email && <p className="text-red-500">{errors.email.message}</p>}

      <button type="submit">등록</button>
    </form>
  );
}
```

---

## 에러 처리

### ❌ formState.errors

**모든 에러를 한 곳에서 관리:**

```jsx
import { useForm } from 'react-hook-form';

function ErrorHandlingForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty, isSubmitting },
  } = useForm({
    mode: 'onChange', // 입력할 때마다 검증 (기본: onSubmit)
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 이메일 입력 */}
      <div>
        <input
          {...register('email', {
            required: '이메일을 입력하세요',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: '유효한 이메일을 입력하세요',
            },
          })}
          placeholder="이메일"
          className={`border ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* 비밀번호 입력 */}
      <div>
        <input
          type="password"
          {...register('password', {
            required: '비밀번호를 입력하세요',
            minLength: {
              value: 6,
              message: '6자 이상 입력하세요',
            },
          })}
          placeholder="비밀번호"
          className={`border ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* 전체 폼 상태 */}
      <div>
        <p>폼 유효: {isValid ? '✅' : '❌'}</p>
        <p>변경됨: {isDirty ? '✅' : '❌'}</p>
        <p>제출 중: {isSubmitting ? '⏳' : '✅'}</p>
      </div>

      {/* 제출 버튼 (유효할 때만 활성화) */}
      <button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? '제출 중...' : '제출'}
      </button>
    </form>
  );
}
```

### 🎨 에러 UI 패턴

```jsx
function FormField({ label, register, registerOptions, errors, fieldName }) {
  const error = errors[fieldName];

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <input
        {...register(fieldName, registerOptions)}
        className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
          error
            ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500'
            : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
        }`}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
          <span>⚠️</span> {error.message}
        </p>
      )}
    </div>
  );
}

// 사용 예제
function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <FormField
        label="이메일"
        register={register}
        registerOptions={{
          required: '이메일을 입력하세요',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: '유효한 이메일을 입력하세요',
          },
        }}
        errors={errors}
        fieldName="email"
      />

      <FormField
        label="비밀번호"
        register={register}
        registerOptions={{
          required: '비밀번호를 입력하세요',
          minLength: { value: 6, message: '6자 이상 입력하세요' },
        }}
        errors={errors}
        fieldName="password"
      />

      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg">
        제출
      </button>
    </form>
  );
}
```

---

## Pocket Closet 사례

### 📱 LoginPage (React Hook Form 적용)

```jsx
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

export function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const response = await apiClient.login(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.status === 401) {
        setError('root', {
          message: '이메일 또는 비밀번호가 잘못되었습니다',
        });
      } else {
        setError('root', {
          message: '로그인 실패. 다시 시도해주세요.',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">로그인</h2>

        {/* 일반 에러 */}
        {errors.root && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* 이메일 */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">이메일</label>
            <input
              {...register('email', {
                required: '이메일을 입력하세요',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: '유효한 이메일을 입력하세요',
                },
              })}
              type="email"
              autoComplete="email"
              className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
                errors.email
                  ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
              }`}
              placeholder="이메일을 입력하세요"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">비밀번호</label>
            <input
              {...register('password', {
                required: '비밀번호를 입력하세요',
                minLength: {
                  value: 6,
                  message: '6자 이상 입력하세요',
                },
              })}
              type="password"
              autoComplete="current-password"
              className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
                errors.password
                  ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
              }`}
              placeholder="비밀번호를 입력하세요"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition disabled:cursor-not-allowed"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 회원가입 링크 */}
        <p className="text-center text-sm text-gray-600 mt-4">
          계정이 없으신가요?{' '}
          <a href="/register" className="text-blue-500 hover:text-blue-700">
            회원가입
          </a>
        </p>
      </div>
    </div>
  );
}
```

### 📝 RegisterPage (더 복잡한 검증)

```jsx
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // 비밀번호 감시 (비밀번호 확인용)
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      await apiClient.register(data.name, data.email, data.password);
      navigate('/login', { state: { message: '회원가입 완료. 로그인하세요.' } });
    } catch (error) {
      if (error.response?.status === 409) {
        setError('email', {
          message: '이미 가입된 이메일입니다',
        });
      } else {
        setError('root', {
          message: '회원가입 실패. 다시 시도해주세요.',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">회원가입</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* 이름 */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">이름</label>
            <input
              {...register('name', {
                required: '이름을 입력하세요',
                minLength: {
                  value: 2,
                  message: '2자 이상 입력하세요',
                },
              })}
              autoComplete="name"
              className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
                errors.name
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
              }`}
              placeholder="이름"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* 이메일 */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">이메일</label>
            <input
              {...register('email', {
                required: '이메일을 입력하세요',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: '유효한 이메일을 입력하세요',
                },
              })}
              type="email"
              autoComplete="email"
              className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
                errors.email
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
              }`}
              placeholder="이메일"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">비밀번호</label>
            <input
              {...register('password', {
                required: '비밀번호를 입력하세요',
                minLength: {
                  value: 6,
                  message: '6자 이상 입력하세요',
                },
              })}
              type="password"
              autoComplete="new-password"
              className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
                errors.password
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
              }`}
              placeholder="비밀번호"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              비밀번호 확인
            </label>
            <input
              {...register('confirmPassword', {
                required: '비밀번호 확인을 입력하세요',
                validate: (value) => {
                  if (value !== password) return '비밀번호가 일치하지 않습니다';
                  return true;
                },
              })}
              type="password"
              autoComplete="new-password"
              className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
                errors.confirmPassword
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
              }`}
              placeholder="비밀번호 확인"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition disabled:cursor-not-allowed"
          >
            {isSubmitting ? '가입 중...' : '회원가입'}
          </button>
        </form>

        {/* 로그인 링크 */}
        <p className="text-center text-sm text-gray-600 mt-4">
          이미 계정이 있으신가요?{' '}
          <a href="/login" className="text-blue-500 hover:text-blue-700">
            로그인
          </a>
        </p>
      </div>
    </div>
  );
}
```

---

## 고급 기능

### 🔄 reset() - 폼 초기화

```jsx
import { useForm } from 'react-hook-form';

function DynamicForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log('제출:', data);
    // 제출 후 폼 초기화
    reset(); // 모든 필드 초기화
  };

  const handleReset = () => {
    reset({
      email: '', // 특정 필드만 초기화
      password: '',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email', { required: true })} />
      <input {...register('password', { required: true })} />

      <button type="submit">제출</button>
      <button type="button" onClick={handleReset}>
        초기화
      </button>
    </form>
  );
}
```

### 🎯 Mode - 검증 타이밍

```jsx
const { register, handleSubmit, formState: { errors } } = useForm({
  mode: 'onChange', // 다양한 모드 선택 가능:
  // 'onChange': 입력 시마다 검증 (권장)
  // 'onBlur': focus를 잃을 때 검증
  // 'onSubmit': 제출할 때만 검증 (기본값)
  // 'onTouched': 건드린 필드만 검증
  // 'all': 모든 이벤트에 검증
});
```

### 📊 formState 유용한 속성들

```jsx
const {
  formState: {
    errors,              // 에러 객체
    isValid,             // 폼 유효 여부
    isDirty,             // 값이 변경되었는가
    isSubmitting,        // 제출 중인가
    isSubmitted,         // 제출 시도했는가
    touchedFields,       // 건드린 필드들
    dirtyFields,         // 변경된 필드들
  },
} = useForm();
```

### 🔗 getValues() - 현재 폼 값 가져오기

```jsx
const { register, getValues } = useForm();

// 특정 필드의 값
const email = getValues('email');

// 모든 값
const allValues = getValues();

// 여러 필드
const [email, password] = getValues(['email', 'password']);
```

### ✅ setValue() - 프로그래밍 방식으로 값 설정

```jsx
const { register, setValue } = useForm();

const handleSetEmail = () => {
  setValue('email', 'test@example.com'); // 특정 필드 설정
  setValue('email', 'test@example.com', { shouldValidate: true }); // 검증 실행
  setValue({ // 여러 필드 설정
    email: 'test@example.com',
    password: '123456',
  });
};
```

---

## 정리

### React Hook Form의 장점

- ✅ 최소한의 리렌더링 (성능 최적화)
- ✅ 간결한 코드 (복잡한 상태 관리 불필요)
- ✅ 강력한 검증 (내장 + 커스텀)
- ✅ TypeScript 지원
- ✅ 작은 번들 크기 (~9KB)
- ✅ 자동 폼 검증
- ✅ 에러 메시지 관리 간편

### Pocket Closet에서 사용할 패턴

```
✅ 모든 폼에서 useForm() 사용
✅ register()로 검증 규칙 정의
✅ formState.errors로 에러 표시
✅ handleSubmit()로 자동 검증
✅ watch()로 조건부 필드 표시
✅ 상호 의존 검증 (비밀번호 확인)
✅ 비동기 검증 (API 확인)
```

### 다음 단계

```
1. LoginPage/RegisterPage에 React Hook Form 적용 (이미 완료 가능)
2. UploadPage 파일 입력 관리
3. WardrobePage 필터 폼
4. 모든 폼에서 일관된 패턴 유지
```

---

## 참고 자료

- [React Hook Form 공식 문서](https://react-hook-form.com)
- [React Hook Form API](https://react-hook-form.com/api)
- [폼 검증 예제](https://react-hook-form.com/form-builder)
- [TypeScript 지원](https://react-hook-form.com/ts)

---

**다음 글**: 드래그 앤 드롭 파일 업로드 UI 구현 (POC-71)
