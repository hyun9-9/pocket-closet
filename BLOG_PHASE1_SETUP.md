# Pocket Closet - Phase 1: Docker PostgreSQL 데이터베이스 설정 완벽 가이드

> **작성일**: 2024년 11월 14일
> **주제**: Docker와 PostgreSQL을 이용한 로컬 개발 환경 구축
> **난이도**: 초급 - 중급
> **소요 시간**: 약 30분

---

## 📌 개요

Pocket Closet 프로젝트에서 처음으로 **로컬 개발 환경 구축**을 진행했습니다.
Supabase를 사용하지 않고, **Docker와 PostgreSQL**을 활용해 자체 데이터베이스 환경을 만들었습니다.

이 방식의 장점:
- 💻 로컬에서 완전한 제어 가능
- 🎓 Docker와 데이터베이스 학습 기회
- ⚡ 개발 속도 향상
- 🔄 재현 가능한 환경 구성

---

## 🎯 목표

Phase 1에서 달성한 목표:
1. ✅ Docker Desktop 설치 및 검증
2. ✅ Docker Compose로 PostgreSQL 컨테이너 실행
3. ✅ 환경 변수 설정
4. ✅ Prisma ORM으로 데이터베이스 마이그레이션
5. ✅ 샘플 데이터 시딩

---

## 📚 Step 1: Docker Desktop 설치 및 확인

### 설치 방법

Windows 환경에서 Docker Desktop을 설치합니다:

1. **Docker 공식 사이트** 방문: https://www.docker.com/products/docker-desktop
2. **"Download for Windows"** 클릭
3. 다운로드 완료 후 설치 파일 실행
4. 설치 화면에서 **"WSL 2"** 옵션 선택
5. 설치 완료 후 **시스템 재시작**

### 설치 확인

PowerShell을 열고 다음 명령어 실행:

```powershell
docker --version
```

**예상 출력:**
```
Docker version 28.5.1, build e180ab8
```

✅ 버전이 출력되면 설치 완료!

### 💡 Docker란?

Docker는 **컨테이너화 기술**로, 애플리케이션과 그 환경을 하나의 패키지로 만듭니다:

```
[나의 컴퓨터]
  └─ [Docker]
      └─ [PostgreSQL 컨테이너]
          └─ 완전히 독립적인 환경
```

**장점:**
- 어디서나 같은 환경으로 실행 가능
- 로컬 시스템을 오염시키지 않음
- 쉽게 시작/중지 가능

---

## 🐘 Step 2: Docker Compose로 PostgreSQL 설정

### docker-compose.yml 파일 생성

프로젝트 루트에 `docker-compose.yml` 파일을 생성합니다:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: pocket-closet-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: pocket_closet
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
```

### 각 항목 설명

| 항목 | 설명 |
|------|------|
| `version: '3.8'` | Docker Compose 버전 |
| `image: postgres:16-alpine` | PostgreSQL 16 (Alpine - 경량 버전) |
| `POSTGRES_USER` | 데이터베이스 관리자 사용자명 |
| `POSTGRES_PASSWORD` | 관리자 비밀번호 |
| `POSTGRES_DB` | 생성할 기본 데이터베이스명 |
| `ports: "5432:5432"` | 호스트의 5432 포트를 컨테이너의 5432 포트와 연결 |
| `volumes: postgres_data` | 데이터베이스 데이터 영구 저장 |
| `healthcheck` | 컨테이너 상태 점검 |

### PostgreSQL 실행

```powershell
cd C:\Users\bss\pocket-closet
docker-compose up -d
```

**옵션 설명:**
- `-d` : 백그라운드에서 실행 (detached mode)

### 컨테이너 상태 확인

```powershell
docker ps
```

**예상 출력:**
```
CONTAINER ID   IMAGE              STATUS                   PORTS
89530424927b   postgres:16-alpine Up 3 seconds (healthy)   0.0.0.0:5432->5432/tcp
```

### PostgreSQL 버전 확인

```powershell
docker exec -it pocket-closet-db psql -U postgres -d pocket_closet -c "SELECT version();"
```

**예상 출력:**
```
PostgreSQL 16.11 on x86_64-pc-linux-musl, compiled by gcc (Alpine 14.2.0) 14.2.0, 64-bit
```

✅ PostgreSQL이 정상 작동!

### 💡 Docker Compose란?

Docker Compose는 **여러 컨테이너를 한 번에 관리**하는 도구입니다:

```yaml
# 하나의 파일로 여러 서비스 정의
services:
  postgres:  # 서비스 1
  redis:     # 서비스 2 (나중에)
  api:       # 서비스 3 (나중에)
```

**장점:**
- 복잡한 설정을 YAML 파일로 관리
- `docker-compose up` 한 줄로 모든 서비스 실행
- 개발팀이 같은 환경으로 작업 가능

---

## 🔧 Step 3: 환경 변수 (.env) 설정

### .env 파일 수정

`backend/.env` 파일을 Docker PostgreSQL에 맞게 수정합니다:

```env
# Database (Docker PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pocket_closet?schema=public"

# JWT
JWT_SECRET="your-super-secret-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR="./uploads"

# Server
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### 주요 설정값 설명

```
postgresql://postgres:postgres@localhost:5432/pocket_closet?schema=public
│             │       │         │         │    │                    │
└─ 프로토콜   └─ 사용자 └─ 비밀번호 └─ 호스트 └─ 포트 └─ DB명 └─ 스키마
```

**각 부분:**
- `postgresql://` : PostgreSQL 데이터베이스 연결 프로토콜
- `postgres:postgres` : 사용자명:비밀번호
- `localhost:5432` : 로컬 PC의 5432 포트 (Docker가 바인딩)
- `pocket_closet` : 데이터베이스명
- `?schema=public` : 스키마 지정

---

## 🗄️ Step 4: Prisma ORM 설정 및 마이그레이션

### Prisma란?

**Prisma**는 Node.js/TypeScript용 ORM(Object-Relational Mapping)입니다:

```typescript
// SQL 쿼리 대신 TypeScript 코드 작성
const user = await prisma.user.create({
  data: {
    email: "test@example.com",
    name: "테스트 사용자"
  }
});

// ↑ 자동으로 SQL로 변환됨
```

**장점:**
- 타입 안전성
- 자동 완성
- 마이그레이션 자동화
- 데이터베이스 스키마 버전 관리

### Prisma 클라이언트 생성

```powershell
cd C:\Users\bss\pocket-closet\backend
npx prisma generate
```

**출력:**
```
✔ Generated Prisma Client (v6.19.0) to .\node_modules\@prisma\client in 130ms
```

### 데이터베이스 마이그레이션

```powershell
npx prisma migrate dev --name init
```

**출력:**
```
prisma\migrations/
  └─ 20251114051830_init/
    └─ migration.sql

Your database is now in sync with your schema.
✔ Generated Prisma Client (v6.19.0)
```

이 명령어는:
1. `backend/prisma/schema.prisma`의 모델을 읽음
2. SQL 마이그레이션 파일 생성
3. PostgreSQL에 테이블 생성
4. 마이그레이션 기록 저장

### 마이그레이션 파일 확인

`backend/prisma/migrations/` 디렉토리에 자동으로 생성됨:

```
migrations/
  └─ 20251114051830_init/
      ├─ migration.sql  (생성된 SQL)
      └─ migration_lock.toml
```

**migration.sql** 파일에는 실제 실행된 SQL이 저장되어, 언제든 이전 상태로 되돌릴 수 있습니다.

---

## 🌱 Step 5: 데이터베이스 시딩 (샘플 데이터)

### Seed 파일 생성

`backend/prisma/seed.ts` 파일 생성:

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 데이터베이스 시딩 시작...");

  // 1. 테스트 사용자 생성
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      password: hashedPassword,
      name: "테스트 사용자",
    },
  });

  // 2. 체형 정보
  const bodyInfo = await prisma.bodyInfo.create({
    data: {
      userId: user.id,
      height: 175,
      weight: 70,
      // ... 더 많은 필드
    },
  });

  // 3. 의류 카테고리 생성
  const topCategory = await prisma.clothingCategory.create({
    data: {
      name: "상의",
      nameEn: "top",
      requiredMeasurements: {
        chest: true,
        length: true,
      },
    },
  });

  // 4. 의류 아이템 생성
  const clothing = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: topCategory.id,
      name: "검정 후드집업",
      primaryColor: "검정",
      // ... 더 많은 필드
    },
  });

  console.log("✨ 데이터베이스 시딩 완료!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

### package.json에 스크립트 추가

```json
{
  "scripts": {
    "prisma:seed": "ts-node prisma/seed.ts",
    "prisma:reset": "prisma migrate reset"
  }
}
```

### 시딩 실행

```powershell
npm run prisma:seed
```

**출력:**
```
🌱 데이터베이스 시딩 시작...
👤 테스트 사용자 생성 중...
✅ 사용자 생성: test@example.com
📏 체형 정보 생성 중...
✅ 체형 정보 생성: [ID]
📂 의류 카테고리 생성 중...
✅ 의류 카테고리 생성: [ID]
👕 옷 아이템 생성 중...
✅ 옷 아이템 생성: [ID]
🎯 스타일 조합 생성 중...
✅ 스타일 조합 생성: [ID]
📊 사용 통계 생성 중...
✅ 사용 통계 생성 완료

✨ 데이터베이스 시딩 완료!
```

### 생성된 데이터 확인

Prisma Studio를 사용하면 시각적으로 확인할 수 있습니다:

```powershell
npx prisma studio
```

브라우저에서 http://localhost:5555 자동으로 열림.

**Prisma Studio 화면:**
- 좌측: 모든 테이블 목록
- 중앙: 데이터 표시
- 우측: 레코드 상세 정보

---

## 📊 생성된 데이터 구조

시딩을 통해 다음과 같은 데이터가 생성됩니다:

```
User (테스트 사용자)
├─ BodyInfo (체형 정보)
├─ StylePreference (스타일 선호도)
├─ MyClothing (옷 아이템)
│  ├─ 검정 후드집업 (상의)
│  │  ├─ primaryColor: "검정"
│  │  ├─ material: "코튼"
│  │  ├─ style: ["캐주얼"]
│  │  └─ measurements: {chest: 100, length: 70, ...}
│  │
│  └─ 청 바지 (하의)
│     ├─ primaryColor: "파랑"
│     ├─ material: "데님"
│     ├─ style: ["캐주얼"]
│     └─ measurements: {waist: 80, hip: 95, ...}
│
├─ StyleCombination (스타일 조합)
│  └─ 캐주얼 일상복
│     ├─ items: [후드집업, 청바지]
│     ├─ occasion: "일상"
│     └─ season: "봄"
│
└─ UserUsageStats (사용 통계)
   ├─ clothingRegistrations: 2
   └─ aiRecommendations: 0
```

---

## 🛠️ 자주 사용하는 명령어

### Docker 관련

```powershell
# PostgreSQL 시작
docker-compose up -d

# PostgreSQL 중지
docker-compose down

# 컨테이너 상태 확인
docker ps

# 로그 보기
docker logs pocket-closet-db

# 데이터베이스 진입
docker exec -it pocket-closet-db psql -U postgres -d pocket_closet
```

### Prisma 관련

```powershell
# Prisma Client 재생성
npm run prisma:generate

# 마이그레이션 실행
npm run prisma:migrate

# 데이터베이스 리셋 (주의!)
npm run prisma:reset

# 시딩 실행
npm run prisma:seed

# Prisma Studio 열기
npm run prisma:studio
```

---

## 🚨 트러블슈팅

### 문제 1: "DATABASE_URL이 없다"는 오류

**원인:** `.env` 파일을 읽지 못함

**해결:**
```powershell
# .env 파일 확인
cat .env

# Prisma 캐시 초기화
rm -r node_modules/.prisma

# 다시 생성
npx prisma generate
```

### 문제 2: "PostgreSQL 연결 실패"

**원인:** Docker 컨테이너가 실행 중이 아님

**해결:**
```powershell
# 컨테이너 상태 확인
docker ps

# 실행되지 않으면 시작
docker-compose up -d

# 로그 확인
docker logs pocket-closet-db
```

### 문제 3: 포트 5432가 이미 사용 중

**원인:** 다른 PostgreSQL이나 서비스가 같은 포트 사용

**해결:**
```powershell
# 포트 확인
netstat -ano | findstr :5432

# docker-compose.yml에서 포트 변경
ports:
  - "5433:5432"  # 호스트의 5433 포트 사용
```

---

## 💡 학습 포인트

### Docker의 핵심 개념

1. **이미지 (Image)**: 애플리케이션 + 환경의 스냅샷
2. **컨테이너 (Container)**: 실행 중인 이미지
3. **볼륨 (Volume)**: 데이터 영구 저장
4. **포트 바인딩**: 호스트와 컨테이너 간 포트 연결

### Prisma의 핵심 개념

1. **스키마 (Schema)**: 데이터베이스 구조 정의
2. **마이그레이션**: 스키마 버전 관리
3. **Seed**: 초기 데이터 삽입
4. **클라이언트**: TypeScript로 DB 쿼리

---

## ✅ Phase 1 완료 체크리스트

- ✅ Docker Desktop 설치 및 검증
- ✅ docker-compose.yml 파일 생성
- ✅ PostgreSQL 컨테이너 실행
- ✅ 환경 변수 설정
- ✅ Prisma 마이그레이션 실행
- ✅ 샘플 데이터 시딩

---

## 🚀 다음 단계

Phase 2에서는 **백엔드 API** 구축을 시작합니다:

1. **User Authentication** - 회원가입/로그인
2. **Clothing Upload & AI Analysis** - Gemini로 의류 분석
3. **Wardrobe Management** - CRUD 작업
4. **AI Recommendations** - 코디 추천

데이터베이스 기반이 준비되었으니, 본격적으로 API를 개발할 수 있습니다! 🚀

---

## 📚 참고 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 가이드](https://docs.docker.com/compose/)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [Prisma 공식 문서](https://www.prisma.io/docs/)
- [Prisma Migrate 가이드](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

**작성자**: Pocket Closet Dev Team
**마지막 업데이트**: 2024년 11월 14일
