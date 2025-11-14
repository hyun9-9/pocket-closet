# Pocket Closet - Phase 2 [2-1]: User Authentication API 개발 완벽 가이드

> **작성일**: 2024년 11월 14일
> **주제**: JWT 기반 회원가입/로그인 API 구현
> **난이도**: 중급
> **소요 시간**: 약 1시간

---

## 📌 개요

Phase 2 [2-1]에서는 **User Authentication (사용자 인증)** API를 구현했습니다.

JWT (JSON Web Token)를 활용해:
- 회원가입 ✅
- 로그인 ✅
- 토큰 기반 인증 ✅
- 프로필 조회 ✅

---

## 🎯 목표

Phase 2 [2-1]에서 달성한 목표:
1. ✅ Auth Service 생성 (비즈니스 로직)
2. ✅ Auth Controller 생성 (요청/응답 처리)
3. ✅ Auth Routes 생성 (URL 매핑)
4. ✅ Error Handling 통합
5. ✅ API 테스트 및 검증

---

## 🏗️ **아키텍처 이해하기**

### MVC 패턴 (Model-View-Controller)

Pocket Closet은 **3계층 아키텍처**를 사용합니다:

```
[HTTP 요청]
    ↓
[Routes] ← URL 매핑
    ↓
[Controller] ← 요청 처리
    ↓
[Service] ← 비즈니스 로직
    ↓
[Middleware] ← 인증, 에러 처리
    ↓
[Database] ← Prisma ORM
    ↓
[HTTP 응답]
```

### 각 계층의 역할

| 계층 | 파일 | 책임 |
|------|------|------|
| **Routes** | `auth.routes.ts` | URL과 핸들러 매핑 |
| **Controller** | `auth.controller.ts` | HTTP 요청/응답 처리 |
| **Service** | `auth.service.ts` | 비즈니스 로직 (암호화, DB) |
| **Middleware** | `auth.middleware.ts` | 토큰 검증 |
| **Database** | Prisma | 사용자 데이터 저장 |

---

## 🔐 **인증의 3가지 핵심 개념**

### 1️⃣ **Bcrypt: 비밀번호 안전하게 저장**

비밀번호를 **평문으로 저장하면 안 됩니다!**

```typescript
// ❌ 위험
const user = {
  email: "test@example.com",
  password: "password123"  // 데이터베이스 해킹 시 노출!
};

// ✅ 안전 (Bcrypt)
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash("password123", 10);
// password123 → $2b$10$N9qo8uLOickgx2...

const user = {
  email: "test@example.com",
  password: hashedPassword  // 암호화된 형태로 저장
};
```

**Bcrypt의 특징:**
- **단방향 암호화**: 암호 해제 불가능
- **솔트(Salt) 포함**: 같은 비밀번호도 매번 다른 해시 생성
- **느린 의도적 알고리즘**: 무차별 대입 공격 방어

**로그인 시 검증:**
```typescript
// 입력된 비밀번호와 DB의 해시된 비밀번호 비교
const isValid = await bcrypt.compare(
  "password123",  // 사용자가 입력한 비밀번호
  "$2b$10$N9qo8uLOickgx2..."  // DB에 저장된 해시
);
// true 또는 false
```

### 2️⃣ **JWT: 토큰으로 사용자 식별**

로그인 성공 후 **토큰을 발급**합니다:

```typescript
const token = jwt.sign(
  { id: userId, email },  // Payload (사용자 정보)
  JWT_SECRET,              // 서버 비밀키
  { expiresIn: '7d' }      // 만료 기간
);

// 결과: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6In...
```

**JWT 구조:**

```
Header.Payload.Signature

Header (헤더)
{
  "alg": "HS256",      // 암호화 알고리즘
  "typ": "JWT"         // 토큰 타입
}
↓ (Base64 인코딩)

Payload (페이로드) ← 중요!
{
  "id": "user-123",
  "email": "test@example.com",
  "iat": 1630704100,      // 발급 시간
  "exp": 1630790500       // 만료 시간
}
↓ (Base64 인코딩)

Signature (서명)
HMACSHA256(
  base64(header) + "." + base64(payload),
  JWT_SECRET
)
```

**JWT의 장점:**
- **Stateless**: 서버에 세션 저장 불필요
- **확장성**: 마이크로서비스에 적합
- **모바일 친화적**: 토큰 기반이라 쿠키 불필요
- **CORS 친화적**: 크로스도메인 요청 쉬움

### 3️⃣ **Middleware: 토큰 검증**

**모든 보호된 API에서 토큰을 검증합니다:**

```typescript
// src/middleware/auth.middleware.ts
export const authenticateToken = (req, res, next) => {
  // 1️⃣ 헤더에서 토큰 추출
  const token = req.headers.authorization?.split(' ')[1];

  // 2️⃣ 토큰 존재 여부 확인
  if (!token) {
    return next(new CustomError('No token provided', 401));
  }

  // 3️⃣ 토큰 검증
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;  // ← 요청 객체에 userId 추가
    next();  // ← 다음 미들웨어/핸들러로 진행
  } catch (error) {
    return next(new CustomError('Invalid token', 401));
  }
};
```

**사용 예:**
```typescript
// 누구나 접근 가능
router.post('/register', AuthController.register);

// 토큰 필요
router.get('/me', authenticateToken, AuthController.getProfile);
```

---

## 💻 **구현 단계별 설명**

### Step 1: Auth Service (비즈니스 로직)

**`src/services/auth.service.ts`**

Service는 **순수한 비즈니스 로직**을 담습니다:

```typescript
export class AuthService {
  /**
   * 회원가입
   */
  static async register(payload: AuthPayload): Promise<AuthResponse> {
    // 1️⃣ 입력값 검증
    if (!email || !password) {
      throw new CustomError('Email and password required', 400);
    }

    // 2️⃣ 기존 사용자 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new CustomError('Email already exists', 409);
    }

    // 3️⃣ 비밀번호 해싱 (Bcrypt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,  // ← 암호화된 형태로 저장
        name: name || email.split('@')[0],
      },
    });

    // 5️⃣ JWT 토큰 생성
    const token = this.generateToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * 로그인
   */
  static async login(payload: AuthPayload): Promise<AuthResponse> {
    // 1️⃣ 입력값 검증
    if (!email || !password) {
      throw new CustomError('Email and password required', 400);
    }

    // 2️⃣ 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new CustomError('Invalid email or password', 401);
    }

    // 3️⃣ 비밀번호 검증 (Bcrypt compare)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new CustomError('Invalid email or password', 401);
    }

    // 4️⃣ JWT 토큰 생성
    const token = this.generateToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * JWT 토큰 생성
   */
  private static generateToken(userId: string, email: string): string {
    return jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
}
```

**주요 로직:**
- ✅ 이메일 중복 확인 (409 Conflict)
- ✅ 비밀번호 해싱 (Bcrypt)
- ✅ 비밀번호 검증 (Bcrypt compare)
- ✅ JWT 토큰 생성

### Step 2: Auth Controller (요청/응답)

**`src/controllers/auth.controller.ts`**

Controller는 **HTTP 요청을 받아서 Service를 호출**합니다:

```typescript
export class AuthController {
  /**
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      // 1️⃣ 요청 데이터 추출
      const { email, password, name } = req.body;

      // 2️⃣ Service 호출
      const result = await AuthService.register({
        email,
        password,
        name,
      });

      // 3️⃣ 성공 응답 (201 Created)
      res.status(201).json({
        success: true,
        message: '회원가입 성공',
        data: result,
      });
    } catch (error) {
      // 4️⃣ 에러는 에러 미들웨어로 전달
      next(error);
    }
  }

  /**
   * GET /api/auth/me (인증 필요)
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      // req.userId는 auth.middleware.ts에서 주입됨!
      const userId = req.userId!;

      const user = await AuthService.getProfile(userId);

      res.status(200).json({
        success: true,
        message: '프로필 조회 성공',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### Step 3: Auth Routes (URL 매핑)

**`src/routes/auth.routes.ts`**

Routes는 **URL과 Controller를 연결**합니다:

```typescript
const router = Router();

// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/login
router.post('/login', AuthController.login);

// GET /api/auth/me (인증 필요)
router.get('/me', authenticateToken, AuthController.getProfile);

export default router;
```

**메인 라우터에서 등록:**
```typescript
// src/routes/index.ts
router.use('/auth', authRoutes);

// 결과:
// POST   /api/auth/register
// POST   /api/auth/login
// GET    /api/auth/me
```

### Step 4: Error Handling

**`src/middleware/error.middleware.ts`**

모든 에러를 **일관된 형식으로 처리**합니다:

```typescript
export class CustomError extends Error {
  status: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
  }
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // 로그 출력
  console.error(`[${new Date().toISOString()}] ${status} - ${message}`);

  // HTTP 응답
  res.status(status).json({
    error: {
      status,
      message,
      // 개발 환경에서만 스택 트레이스 표시
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack
      })
    }
  });
};
```

**HTTP Status Code 활용:**
```typescript
400 - Bad Request      (유효하지 않은 입력)
401 - Unauthorized     (인증 필요 또는 실패)
404 - Not Found        (리소스 없음)
409 - Conflict         (중복, 예: 이메일 이미 존재)
500 - Server Error     (서버 오류)
```

---

## 🧪 **API 테스트**

### Test 1: 회원가입

**Postman에서:**

```
POST http://localhost:3001/api/auth/register

Body (JSON):
{
  "email": "test@example.com",
  "password": "password123",
  "name": "테스트 사용자"
}
```

**응답 (201 Created):**
```json
{
  "success": true,
  "message": "회원가입 성공",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "email": "test@example.com",
      "name": "테스트 사용자"
    }
  }
}
```

### Test 2: 로그인

```
POST http://localhost:3001/api/auth/login

Body (JSON):
{
  "email": "test@example.com",
  "password": "password123"
}
```

**응답 (200 OK):**
```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "email": "test@example.com",
      "name": "테스트 사용자"
    }
  }
}
```

### Test 3: 프로필 조회 (인증 필수)

```
GET http://localhost:3001/api/auth/me

Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답 (200 OK):**
```json
{
  "success": true,
  "message": "프로필 조회 성공",
  "data": {
    "id": "user-123",
    "email": "test@example.com",
    "name": "테스트 사용자",
    "createdAt": "2024-11-14T06:35:39.982Z"
  }
}
```

### Test 4: 토큰 없이 프로필 조회 시도

```
GET http://localhost:3001/api/auth/me

(Headers에 Authorization 없음)
```

**응답 (401 Unauthorized):**
```json
{
  "error": {
    "status": 401,
    "message": "No token provided"
  }
}
```

---

## 🔐 **보안 Best Practice**

### 1️⃣ 비밀번호 저장

```typescript
// ❌ 위험
password: "password123"

// ✅ 안전
const hashedPassword = await bcrypt.hash(password, 10);
password: hashedPassword
```

### 2️⃣ JWT 토큰 관리

```typescript
// 프론트엔드에서
localStorage.setItem('token', token);

// 모든 API 요청에 포함
headers: {
  'Authorization': `Bearer ${token}`
}

// 로그아웃시 삭제
localStorage.removeItem('token');
```

### 3️⃣ 환경 변수

```env
# .env
JWT_SECRET="매우-복잡한-비밀-키-실제-운영환경에서는"
JWT_EXPIRES_IN="7d"
```

### 4️⃣ HTTPS 사용

```typescript
// 프로덕션에서는 반드시 HTTPS 사용
// JWT는 토큰이 탈취될 수 있으므로
// HTTPS로 암호화된 채널에서만 전송
```

---

## 📊 **인증 흐름 정리**

```
┌─────────────────────────────────────────────┐
│         사용자 회원가입/로그인 흐름              │
└─────────────────────────────────────────────┘

1️⃣ 회원가입
┌────────────────────────┐
│ 프론트엔드              │
│ email, password 입력   │
└─────────┬──────────────┘
          │
          ↓ POST /api/auth/register
┌────────────────────────┐
│ Controller.register()  │
│ 요청 데이터 추출       │
└─────────┬──────────────┘
          │
          ↓ Service.register() 호출
┌────────────────────────┐
│ Service.register()     │
│ ✅ 이메일 중복 확인    │
│ ✅ 비밀번호 해싱       │
│ ✅ 사용자 생성         │
│ ✅ JWT 토큰 생성       │
└─────────┬──────────────┘
          │
          ↓ { token, user }
┌────────────────────────┐
│ 프론트엔드             │
│ localStorage에 저장    │
└────────────────────────┘

2️⃣ 로그인
┌────────────────────────┐
│ 프론트엔드              │
│ email, password 입력   │
└─────────┬──────────────┘
          │
          ↓ POST /api/auth/login
┌────────────────────────┐
│ Service.login()        │
│ ✅ 사용자 찾기         │
│ ✅ 비밀번호 검증       │
│ ✅ JWT 토큰 생성       │
└─────────┬──────────────┘
          │
          ↓ { token, user }
┌────────────────────────┐
│ 프론트엔드             │
│ localStorage에 저장    │
└────────────────────────┘

3️⃣ 보호된 API 접근
┌────────────────────────┐
│ 프론트엔드              │
│ GET /api/auth/me       │
│ Authorization: Bearer  │
└─────────┬──────────────┘
          │
          ↓
┌────────────────────────┐
│ Middleware             │
│ authenticateToken()    │
│ ✅ 토큰 검증           │
│ ✅ userId 주입         │
└─────────┬──────────────┘
          │
          ↓
┌────────────────────────┐
│ Controller.getProfile()│
│ req.userId 사용        │
└─────────┬──────────────┘
          │
          ↓
┌────────────────────────┐
│ Service.getProfile()   │
│ 사용자 정보 조회       │
└─────────┬──────────────┘
          │
          ↓
┌────────────────────────┐
│ 프론트엔드             │
│ 사용자 정보 표시       │
└────────────────────────┘
```

---

## 📚 **핵심 용어 정리**

| 용어 | 설명 |
|------|------|
| **Authentication** | 인증 (누가인지 증명) |
| **Authorization** | 인가 (무엇을 할 수 있는지) |
| **Bcrypt** | 비밀번호 암호화 알고리즘 |
| **JWT** | JSON Web Token (토큰 기반 인증) |
| **Payload** | JWT에 포함된 사용자 정보 |
| **Middleware** | 요청과 응답 사이에서 작동하는 함수 |
| **CustomError** | HTTP 상태 코드를 포함하는 에러 클래스 |
| **Stateless** | 서버가 클라이언트 상태를 저장하지 않음 |

---

## ✅ **Phase 2 [2-1] 완료 체크리스트**

- ✅ Auth Service 구현 (register, login, getProfile)
- ✅ Auth Controller 구현
- ✅ Auth Routes 정의
- ✅ Error Handling 통합
- ✅ Bcrypt로 비밀번호 암호화
- ✅ JWT 토큰 생성/검증
- ✅ Middleware로 인증 보호
- ✅ Postman으로 모든 API 테스트 완료

---

## 🚀 **다음 단계**

Phase 2 [2-2]에서는 **Clothing Upload & AI Analysis**를 구현합니다:

1. 이미지 파일 업로드 (Multer)
2. 이미지 처리 (Sharp)
3. Google Gemini로 AI 분석
4. 메타데이터 추출 및 저장

---

**작성자**: Pocket Closet Dev Team
**마지막 업데이트**: 2024년 11월 14일
