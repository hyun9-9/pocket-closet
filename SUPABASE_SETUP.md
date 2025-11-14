# Supabase 마이그레이션 가이드

## MVP 단계에서 Supabase 사용 이유

- **자체 관리 필요 제거**: PostgreSQL 자동 관리
- **파일 스토리지 기본 제공**: 이미지 저장소 (Multer 경로 관리 불필요)
- **JWT 인증 통합**: Supabase Auth 활용 가능
- **실시간 기능**: 필요시 기본 제공
- **1인 개발자 최적화**: 배포 및 관리 최소화

---

## 1단계: Supabase 프로젝트 생성

1. https://supabase.com 방문
2. **New Project** 클릭
3. 프로젝트 이름: `pocket-closet`
4. 지역 선택 (Asia - Singapore 추천)
5. 강력한 비밀번호 설정
6. **Create new project** 클릭

---

## 2단계: 환경 변수 설정

프로젝트 생성 후, Supabase 대시보드에서:

1. **Settings → API** 클릭
2. 다음 값 복사:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY` (백엔드만)

**backend/.env**
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"
JWT_SECRET="your-jwt-secret-key"
GOOGLE_AI_API_KEY="your-gemini-api-key"
NODE_ENV="development"
PORT=3001
```

**frontend/.env.local**
```env
VITE_API_URL="http://localhost:3001/api"
```

---

## 3단계: PostgreSQL 스키마 마이그레이션

### 3-1. Prisma Schema 수정

`backend/prisma/schema.prisma`에서:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3-2. 마이그레이션 적용

```bash
cd backend

# 데이터베이스 초기화
npx prisma migrate dev --name init

# 생성된 마이그레이션 폴더: backend/prisma/migrations/
```

### 3-3. Supabase 대시보드에서 확인

1. Supabase 대시보드 → **SQL Editor**
2. 테이블이 생성되었는지 확인

---

## 4단계: 파일 스토리지 설정

### 4-1. Supabase Storage 버킷 생성

1. Supabase 대시보드 → **Storage**
2. **Create a new bucket** 클릭
3. 이름: `clothing-images`
4. Public으로 설정 (또는 필요시 Private)

### 4-2. 백엔드에서 파일 업로드 처리

**backend/.env에 추가:**
```env
SUPABASE_BUCKET_NAME="clothing-images"
```

**backend/src/services/storage.service.ts 생성:**
```typescript
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class StorageService {
  static async uploadImage(
    buffer: Buffer,
    userId: string,
    clothingId: string
  ) {
    const filename = `${userId}/${clothingId}/${Date.now()}.jpg`;

    // 이미지 최적화
    const optimized = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const { data, error } = await supabase.storage
      .from('clothing-images')
      .upload(filename, optimized, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) throw error;

    // 공개 URL 반환
    const { data: publicUrl } = supabase.storage
      .from('clothing-images')
      .getPublicUrl(filename);

    return {
      filename,
      url: publicUrl.publicUrl
    };
  }

  static async deleteImage(filename: string) {
    const { error } = await supabase.storage
      .from('clothing-images')
      .remove([filename]);

    if (error) throw error;
  }
}
```

**package.json에 추가:**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0"
  }
}
```

---

## 5단계: 인증 설정 (선택사항)

### 5-1. JWT 인증 (현재 방식 유지)

기존의 JWT 방식을 계속 사용하려면:

**backend/src/middleware/auth.middleware.ts**는 이미 준비됨.

### 5-2. Supabase Auth 사용 (나중에)

원하면 Phase 2에서 Supabase Auth로 마이그레이션 가능.

---

## 6단계: 개발 서버 실행

```bash
# 백엔드
cd backend
npm install  # Supabase 라이브러리 설치
npm run dev

# 프론트엔드 (새로운 터미널)
cd frontend
npm run dev
```

### 확인 사항

- 백엔드: http://localhost:3001/api/health → `{ status: "ok" }`
- 프론트엔드: http://localhost:5173 (정상 로드)

---

## 7단계: 배포 준비 (Phase 2)

### Vercel에 배포 (프론트엔드)

```bash
npm install -g vercel
vercel
```

### Supabase에서 백엔드 호스팅 (선택)

또는 Railway, Render 등에서 Node.js 호스팅.

---

## 현재 상태 정리

| 항목 | 상태 | 비고 |
|------|------|------|
| PostgreSQL | Supabase 관리 ✅ | 자동 백업, 확장 불필요 |
| 파일 스토리지 | Supabase Storage ✅ | 1GB 무료 |
| 인증 | JWT 방식 ✅ | 나중에 Supabase Auth로 업그레이드 가능 |
| Redis 캐싱 | 지연 ⏸️ | Phase 2에서 추가 (필요시) |
| 보안 헤더 | Helmet 제거 ✅ | Supabase 보안 기본 포함 |
| 검증 | Zod 제거 ✅ | 기본 에러 처리만 사용 |

---

## 트러블슈팅

### 마이그레이션 실패

```bash
# 마이그레이션 리셋 (주의: 데이터 삭제)
npx prisma migrate reset

# 다시 시도
npx prisma migrate dev --name init
```

### 연결 오류

```bash
# .env 파일 확인
echo $DATABASE_URL

# Prisma 클라이언트 재생성
npx prisma generate
```

### 파일 업로드 실패

- Bucket 이름 확인: `clothing-images`
- 권한 확인: Storage → Policies
- 파일 크기 제한: 25MB 이내

---

## 다음 단계

1. **Phase 1 MVP 완성**
   - 옷 업로드 + Gemini 분석
   - 기본 CRUD 작동
   - 간단한 추천 (텍스트 필터링)

2. **Phase 2 고도화** (2-3주 후)
   - Redis 캐싱 추가 (필요시)
   - 이미지 기반 정밀 추천
   - 아바타 피팅

3. **Phase 3 확장**
   - 3D 아바타
   - 소셜 기능
   - 모바일 앱
