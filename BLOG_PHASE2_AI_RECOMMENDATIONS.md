# Phase 2 [2-4] AI-Powered Recommendations

> Google Gemini AI를 활용한 스타일 추천 시스템 구현

## 📚 목차
1. [개요](#개요)
2. [핵심 개념](#핵심-개념)
3. [추천 알고리즘](#추천-알고리즘)
4. [코드 아키텍처](#코드-아키텍처)
5. [API 명세](#api-명세)
6. [테스트 가이드](#테스트-가이드)
7. [프롬프트 엔지니어링](#프롬프트-엔지니어링)
8. [학습 포인트](#학습-포인트)

---

## 개요

Phase 2 [2-4]에서는 **AI가 사용자의 옷 데이터를 분석해서 최고의 스타일링 조합을 추천**하는 기능을 구현합니다.

### 🎯 주요 목표
- 사용자의 옷장 분석
- 색상 조화 기반 추천
- 스타일 통일성 검증
- 패턴 균형 고려
- 계절/용도별 맞춤 추천

### 📊 기술 스택
- **Backend**: Express.js, TypeScript, Prisma ORM
- **AI**: Google Generative AI (Gemini 2.5 Flash)
- **Database**: PostgreSQL
- **인증**: JWT 토큰 기반

---

## 핵심 개념

### 1️⃣ 색상 조화 (Color Harmony)

**색상환(Color Wheel)**을 기반으로 어떤 색상들이 잘 어울리는지 판단합니다.

```
색상환:
        빨강
       /    \
      주황    자주
      |       |
      노랑 - 파랑
       \     /
        초록

조화 유형:

1️⃣ 모노톤 (Monochromatic)
   같은 색의 밝기를 다양하게
   - 검정 + 회색 + 흰색 ✅
   - 효과: 세련되고 우아함
   - 격식도: 높음
   - 추천 상황: 정장, 포멀

2️⃣ 보색 (Complementary)
   색상환의 정반대 색상
   - 파랑 + 주황 ✅
   - 빨강 + 초록 ✅
   - 효과: 생기있고 대비가 강함
   - 격식도: 낮음
   - 추천 상황: 캐주얼, 재미있는 룩

3️⃣ 인접색 (Analogous)
   색상환에서 옆에 붙어있는 색상
   - 빨강 + 주황 + 노랑 ✅
   - 파랑 + 자주 + 초록 ✅
   - 효과: 조화로운 따뜻함/시원함
   - 격식도: 중간
   - 추천 상황: 자연스러운 데일리룩

4️⃣ 삼각 조합 (Triadic)
   색상환에서 균등하게 떨어진 3가지
   - 빨강 + 파랑 + 노랑 ✅
   - 효과: 균형잡히고 생동감있음
   - 격식도: 낮음
   - 추천 상황: 예술적인 표현

5️⃣ 분할-보색 (Split-Complementary)
   보색과 그 인접색
   - 파랑 + 빨강 + 주황 ✅
   - 효과: 세련되면서도 현대적
   - 격식도: 중간-높음
   - 추천 상황: 모던 스타일링
```

**실제 예제**:
```json
검정 후드티 (검정 #000000)와 조화로운 조합들:

✅ 모노톤: 검정 + 회색 + 흰색
   상의: 검정 후드티
   하의: 회색 바지
   신발: 흰색 스니커즈
   점수: 9.5/10

✅ 인접색: 검정 + 회색 + 카키
   상의: 검정 후드티
   하의: 카키 바지
   신발: 검정 구두
   점수: 8/10

❌ 보색 (강함): 검정 + 밝은 주황
   상의: 검정 후드티
   하의: 밝은 주황 바지
   점수: 4/10 (너무 튀는 대비)
```

---

### 2️⃣ 스타일 호환성 (Style Compatibility)

같은 스타일끼리 조합하면 통일감이 생깁니다.

```
스타일 분류:

🏙️ 캐주얼 (Casual)
   특징: 편하고 일상적
   예: 반팔티, 청바지, 스니커즈
   호환성: 캐주얼끼리 최고
   격식도: 1-3

🎩 포멀 (Formal)
   특징: 정장, 깔끔, 우아함
   예: 정장 셔츠, 슬랙스, 구두
   호환성: 포멀끼리 최고
   격식도: 8-10

🌆 스트릿 (Street)
   특징: 트렌디하고 힙한
   예: 오버사이즈 후드, 와이드팬츠, 하이탑 스니커즈
   호환성: 스트릿끼리 최고
   격식도: 2-4

✨ 미니멀 (Minimal)
   특징: 단순하고 세련됨
   예: 화이트 셔츠, 검정 팬츠, 로퍼
   호환성: 미니멀끼리 최고
   격식도: 5-7

👗 클래식 (Classic)
   특징: 전통적이고 우아함
   예: 플레어 스커트, 진주 목걸이, 펌프스
   호환성: 클래식끼리 최고
   격식도: 6-8

조합 규칙:

✅ 같은 스타일 조합 (최고)
   캐주얼 + 캐주얼 + 캐주얼 = 통일감 있음

⚠️ 다른 스타일 조합 (신중)
   캐주얼 + 포멀 = 스타일 믹스 (가능하지만 의도적이어야 함)
   스트릿 + 클래식 = 모던 믹스 (고급스러움)

❌ 너무 다른 스타일 (피해야 함)
   캐주얼 + 포멀 + 스트릿 = 통일감 없음
   클래식 + 스트릿 + 스포츠 = 어색함
```

**예제**:
```json
검정 후드티 (캐주얼)의 최고 조합:

1위: 캐주얼 + 캐주얼 + 캐주얼
   상의: 검정 후드티 (캐주얼)
   하의: 청바지 (캐주얼)
   신발: 스니커즈 (캐주얼)
   점수: 10/10 - 완벽한 통일감

2위: 캐주얼 + 스트릿 + 스트릿
   상의: 검정 후드티 (캐주얼)
   하의: 와이드 팬츠 (스트릿)
   신발: 하이탑 스니커즈 (스트릿)
   점수: 8/10 - 모던한 느낌

3위: 캐주얼 + 포멀 + 캐주얼
   상의: 검정 후드티 (캐주얼)
   하의: 슬랙스 (포멀)
   신발: 로퍼 (포멀)
   점수: 5/10 - 스타일 충돌
```

---

### 3️⃣ 패턴 조합 (Pattern Mixing)

패턴끼리 조화로운 배치를 결정합니다.

```
패턴 유형:

무지 (Solid) - 색상만 있는 단색
   예: 검정 후드티, 흰색 셔츠
   조합성: 최고

스트라이프 (Stripe) - 줄무늬
   예: 파란색 줄무늬 셔츠
   조합성: 무지와 좋음, 다른 패턴과는 피해야 함

체크 (Check) - 격자 무늬
   예: 빨강/검정 체크 셔츠
   조합성: 무지와 조화, 다른 체크는 피해야 함

도트 (Dot) - 작은 점무늬
   예: 흰색 바탕의 검정 도트
   조합성: 무지와 조화, 큰 패턴과는 피해야 함

플로럴 (Floral) - 꽃무늬
   예: 분홍색 꽃무늬 드레스
   조합성: 무지와 조화, 다른 패턴은 피해야 함

패턴 조합 규칙:

규칙 1: 한 가지 패턴만 사용
   ✅ 무지 + 무지 + 스트라이프 = 조화로움
   ❌ 스트라이프 + 체크 + 도트 = 너무 복잡함

규칙 2: 패턴의 크기를 다르게
   ✅ 큰 플로럴 + 작은 도트 (이론상)
   ❌ 하지만 실제로는 피하는 것이 좋음

규칙 3: 패턴의 색감을 통일
   ✅ 파란색 스트라이프 + 파란색 무지 = 색감 통일
   ❌ 파란색 스트라이프 + 빨강 도트 = 색감 충돌

규칙 4: 무지 우선
   ✅ 무지 (70%) + 패턴 (30%) = 균형
   ❌ 패턴 (70%) + 패턴 (30%) = 너무 많음
```

**예제**:
```json
스트라이프 셔츠 (파란색+흰색 줄무늬)의 조합:

✅ 최고: 무지 + 스트라이프 + 무지
   상의: 파란색/흰색 스트라이프 셔츠
   하의: 검정 무지 바지
   신발: 흰색 무지 스니커즈
   점수: 9/10 - 깔끔한 스트라이프 강조

⚠️ 신중: 무지 + 스트라이프 + 패턴
   상의: 파란색/흰색 스트라이프 셔츠
   하의: 작은 도트 바지
   신발: 흰색 무지 스니커즈
   점수: 6/10 - 패턴이 경쟁함

❌ 피해야 함: 스트라이프 + 스트라이프 + 체크
   상의: 파란색/흰색 스트라이프 셔츠
   하의: 빨강/흰색 스트라이프 바지
   신발: 체크 무늬 신발
   점수: 2/10 - 보잡함
```

---

### 4️⃣ 계절별 색상 톤 (Seasonal Color Palette)

계절에 맞는 색상을 선택하면 자연스럽고 어울립니다.

```
계절별 톤 분석:

🌸 봄 (Spring): 밝고 맑은 톤
   특징: 파스텔 계열, 생기있음, 따뜻함
   색상: 파스텔 핑크, 밝은 노랑, 라임 그린, 하늘 파랑
   예시: 연한 핑크 셔츠, 밝은 베이지 바지, 파스텔 스니커즈
   격식도: 3-5 (편하고 생동감있음)
   추천: 캐주얼, 스트릿

☀️ 여름 (Summer): 밝고 차가운 톤
   특징: 순색계, 청량함, 깔끔함
   색상: 순백색, 연한 파랑, 민트, 라벤더
   예시: 흰색 셔츠, 밝은 청바지, 흰색 스니커즈
   격식도: 2-5 (시원하고 깔끔함)
   추천: 캐주얼, 포멀

🍂 가을 (Autumn): 어둡고 따뜻한 톤
   특징: 흙톤, 깊이 있음, 따뜻함
   색상: 번트 주황, 갈색, 올리브 그린, 와인색
   예시: 갈색 니트, 버그온드 바지, 갈색 부츠
   격식도: 5-7 (깊고 무게감있음)
   추천: 클래식, 미니멀

❄️ 겨울 (Winter): 어둡고 차가운 톤
   특징: 명도 극대, 선명함, 고급스러움
   색상: 검정, 순백색, 짙은 파랑, 은색
   예시: 검정 코트, 흰색 셔츠, 검정 부츠
   격식도: 7-10 (우아하고 포멀함)
   추천: 포멀, 미니멀

현재 계절에 맞는 조합:

현재 계절이 "가을"이라고 가정:

✅ 최고: 가을 톤 + 가을 톤 + 가을 톤
   상의: 갈색 니트 (가을)
   하의: 올리브 그린 바지 (가을)
   신발: 갈색 부츠 (가을)
   점수: 10/10 - 계절 완벽 매치

⚠️ 우선 고려: 가을 톤 + 사계절 톤
   상의: 갈색 니트 (가을)
   하의: 검정 바지 (사계절)
   신발: 검정 구두 (사계절)
   점수: 8/10 - 계절감 있고 보편적

❌ 피해야 함: 봄 톤 + 겨울 톤
   상의: 파스텔 핑크 (봄)
   하의: 짙은 파랑 (겨울)
   신발: 순백색 (여름)
   점수: 3/10 - 계절감 없고 어색함
```

---

## 추천 알고리즘

### 알고리즘 플로우

```
사용자의 옷 데이터 조회
        ↓
색상, 스타일, 패턴, 시즌 데이터 추출
        ↓
Google Gemini AI에 프롬프트 전송
        ↓
AI가 6가지 기준으로 평가:
  1. 색상 조화 (모노톤, 보색, 인접색)
  2. 스타일 통일감 (같은 스타일 우대)
  3. 패턴 균형 (무지 우선)
  4. 격식도 유사성 (범위 3 이내)
  5. 시즌 조화 (같은 시즌 우대)
  6. 용도 조화 (같은 용도 우대)
        ↓
AI가 조합 점수 계산 (1-10)
        ↓
상위 3개 조합 선택
        ↓
의류 ID로 매핑
        ↓
JSON 응답 반환
```

### 점수 계산 로직

```typescript
// AI가 계산하는 점수:

점수 = (색상조화 + 스타일통일 + 패턴균형 + 격식도 + 시즌 + 용도) / 6

예제 1:
  색상조화: 10 (모노톤 완벽)
  스타일통일: 10 (모두 캐주얼)
  패턴균형: 10 (모두 무지)
  격식도: 9 (범위 내)
  시즌: 10 (모두 같은 시즌)
  용도: 10 (모두 같은 용도)
  최종 점수: 9.8/10 ⭐⭐⭐⭐⭐

예제 2:
  색상조화: 7 (인접색)
  스타일통일: 8 (거의 같은 스타일)
  패턴균형: 8 (무지 1, 패턴 1)
  격식도: 7 (약간 차이)
  시즌: 7 (같은 시즌)
  용도: 7 (거의 같은 용도)
  최종 점수: 7.3/10 ⭐⭐⭐⭐

예제 3:
  색상조화: 4 (강한 보색)
  스타일통일: 3 (다른 스타일)
  패턴균형: 5 (패턴이 많음)
  격식도: 2 (심한 차이)
  시즌: 3 (다른 시즌)
  용도: 3 (다른 용도)
  최종 점수: 3.3/10 ⭐⭐
```

---

## 코드 아키텍처

### 디렉토리 구조

```
backend/src/
├── services/
│   ├── clothing.service.ts
│   ├── auth.service.ts
│   └── recommendation.service.ts      ← 새로 추가
├── controllers/
│   ├── clothing.controller.ts
│   ├── auth.controller.ts
│   └── recommendation.controller.ts   ← 새로 추가
├── routes/
│   ├── clothing.routes.ts
│   ├── auth.routes.ts
│   ├── recommendation.routes.ts       ← 새로 추가
│   └── index.ts                       ← 수정 (라우트 등록)
└── middleware/
    ├── auth.middleware.ts
    └── error.middleware.ts
```

### 계층 구조 (Layered Architecture)

```
GET /api/recommendations/style (HTTP Request)
        ↓
[Route] recommendation.routes.ts
    ↓ (라우팅)
[Controller] recommendation.controller.ts
    - 사용자 ID 추출
    - 요청 검증
    ↓ (위임)
[Service] recommendation.service.ts
    - 사용자 옷 조회 (Prisma)
    - 프롬프트 생성
    - AI 호출
    - JSON 파싱
    - 데이터 매핑
    ↓ (실행)
[Database] PostgreSQL
    - MyClothing 테이블 조회
    ↓
[AI] Google Gemini API
    - 프롬프트 분석
    - 조합 생성
    - 점수 계산
    - JSON 응답
    ↓
HTTP Response (JSON)
```

### recommendation.service.ts 상세

```typescript
export class RecommendationService {
  // 1. 메인 메서드
  static async getStyleRecommendations(userId: string): Promise<any>

  // 2. 데이터 조회
  private static async getUserClothes(userId: string): Promise<any[]>

  // 3. 프롬프트 생성
  private static generateRecommendationPrompt(clothes: any[]): string

  // 4. AI 호출
  private static async generateRecommendationsWithAI(prompt: string): Promise<any>

  // 5. 데이터 매핑
  private static mapClothingIds(recommendations: any, clothes: any[]): any[]
}
```

#### 메서드 1: getStyleRecommendations

```typescript
/**
 * 스타일 추천 생성
 *
 * 흐름:
 * 1. 사용자의 모든 옷 조회
 * 2. 최소 3개 검증
 * 3. AI 프롬프트 생성
 * 4. Google Gemini 호출
 * 5. 의류 ID로 매핑
 * 6. 결과 반환
 */
static async getStyleRecommendations(userId: string): Promise<any> {
  // 1️⃣ 사용자의 모든 옷 조회
  const clothes = await this.getUserClothes(userId);

  // 2️⃣ 최소 3개의 옷이 필요
  if (clothes.length < 3) {
    throw new CustomError('최소 3개 이상의 옷이 필요합니다', 400);
  }

  // 3️⃣ AI 프롬프트 생성
  const prompt = this.generateRecommendationPrompt(clothes);

  // 4️⃣ Google Gemini AI로 추천 생성
  const recommendations = await this.generateRecommendationsWithAI(prompt);

  // 5️⃣ 의류 ID로 매핑
  const mappedRecommendations = this.mapClothingIds(recommendations, clothes);

  return {
    totalClothes: clothes.length,
    recommendations: mappedRecommendations,
  };
}
```

#### 메서드 2: getUserClothes

```typescript
/**
 * 사용자의 모든 옷 조회
 *
 * 선택 필드:
 * - 기본 정보: id, name
 * - 색상: primaryColor, colorHex
 * - 디자인: pattern, material, texture, silhouette
 * - 분류: style, season, occasion
 * - 메타: formality
 */
private static async getUserClothes(userId: string): Promise<any[]> {
  const clothes = await prisma.myClothing.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      primaryColor: true,
      colorHex: true,
      pattern: true,
      material: true,
      style: true,
      season: true,
      occasion: true,
      formality: true,
      texture: true,
      silhouette: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return clothes;
}
```

#### 메서드 3: generateRecommendationPrompt

```typescript
/**
 * AI 프롬프트 생성
 *
 * 프롬프트 구성:
 * 1. 역할 정의: "당신은 패션 스타일리스트입니다"
 * 2. 옷 목록: 각 옷의 상세 정보 포함
 * 3. 평가 기준: 6가지 색상/스타일/패턴/격식/시즌/용도
 * 4. 응답 형식: JSON 스키마 명시
 * 5. 제약 조건: "유효한 JSON만"
 */
private static generateRecommendationPrompt(clothes: any[]): string {
  const clothingList = clothes
    .map(
      (c, idx) =>
        `${idx + 1}. ${c.name} (색상: ${c.primaryColor}/${c.colorHex}, 패턴: ${c.pattern}, ...)`
    )
    .join('\n');

  const prompt = `
당신은 국제적 패션 스타일리스트입니다.

다음 사용자의 옷장 데이터를 분석해서 최고의 스타일링 조합 3가지를 추천해주세요.

【사용자 옷장】
${clothingList}

【평가 기준】
1. 색상 조화: 모노톤, 보색, 인접색 등
2. 스타일 통일감: 같은 스타일끼리 조합
3. 패턴 균형: 무지+패턴 우대
4. 격식도: 비슷한 레벨
5. 시즌 조화: 같은 시즌 우대
6. 용도 조화: 같은 용도 우대

응답은 반드시 다음 JSON 형식이어야 합니다:
{
  "recommendations": [
    {
      "rank": 1,
      "combination": ["옷이름1", "옷이름2", "옷이름3"],
      "score": 9.5,
      "reason": "이유 설명"
    },
    ...
  ]
}
  `;

  return prompt;
}
```

#### 메서드 4: generateRecommendationsWithAI

```typescript
/**
 * Google Gemini AI로 추천 생성
 *
 * 프로세스:
 * 1. GoogleGenAI 인스턴스 생성
 * 2. generateContent() 호출
 * 3. responseMimeType을 'application/json'으로 설정
 * 4. responseSchema으로 응답 형식 강제
 * 5. 마크다운 제거
 * 6. JSON 파싱
 */
private static async generateRecommendationsWithAI(prompt: string): Promise<any> {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                rank: { type: Type.INTEGER },
                combination: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                score: { type: Type.NUMBER },
                reason: { type: Type.STRING },
              },
              required: ['rank', 'combination', 'score', 'reason'],
            },
          },
        },
        required: ['recommendations'],
      },
    },
  } as any);

  // 마크다운 코드 블록 제거
  const responseText = response.text || '{}';
  const cleanText = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const result = JSON.parse(cleanText);
  return result;
}
```

#### 메서드 5: mapClothingIds

```typescript
/**
 * 의류 이름 → ID 매핑
 *
 * AI는 의류 이름으로 조합을 생성하므로,
 * 프론트엔드에서 사용할 ID로 변환해야 함
 *
 * 입력:
 * {
 *   "recommendations": [
 *     {
 *       "combination": ["검정 후드티", "검정 청바지", "흰색 스니커즈"]
 *     }
 *   ]
 * }
 *
 * 출력:
 * {
 *   "recommendations": [
 *     {
 *       "combination": [
 *         { "id": "uuid-1", "name": "검정 후드티", "color": "검정" },
 *         { "id": "uuid-2", "name": "검정 청바지", "color": "검정" },
 *         { "id": "uuid-3", "name": "흰색 스니커즈", "color": "흰색" }
 *       ]
 *     }
 *   ]
 * }
 */
private static mapClothingIds(recommendations: any, clothes: any[]): any[] {
  return recommendations.recommendations.map((rec: any) => {
    const combinationWithIds = rec.combination.map((clothingName: string) => {
      const clothing = clothes.find((c: any) => c.name === clothingName);
      return {
        id: clothing?.id || null,
        name: clothingName,
        color: clothing?.primaryColor || null,
        pattern: clothing?.pattern || null,
        style: clothing?.style || [],
      };
    });

    return {
      rank: rec.rank,
      score: rec.score,
      reason: rec.reason,
      combination: combinationWithIds,
    };
  });
}
```

---

## API 명세

### 엔드포인트

```
GET /api/recommendations/style
```

### 요청

**Headers**:
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Parameters**: 없음 (사용자의 모든 옷 자동 조회)

**Body**: 없음

### 응답

**Status Code**: 200 OK

**Body** (성공):
```json
{
  "success": true,
  "message": "스타일 추천 생성 완료",
  "data": {
    "totalClothes": 10,
    "recommendations": [
      {
        "rank": 1,
        "score": 9.5,
        "reason": "모노톤 조합으로 세련되고 캐주얼 스타일이 통일되어 있습니다. 무지 패턴만 사용해서 깔끔하고, 격식도도 맞게 조화됩니다.",
        "combination": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "검정 후드티",
            "color": "검정",
            "pattern": "무지",
            "style": ["캐주얼"]
          },
          {
            "id": "660e8400-e29b-41d4-a716-446655440001",
            "name": "검정 청바지",
            "color": "검정",
            "pattern": "무지",
            "style": ["캐주얼"]
          },
          {
            "id": "770e8400-e29b-41d4-a716-446655440002",
            "name": "흰색 스니커즈",
            "color": "흰색",
            "pattern": "무지",
            "style": ["캐주얼"]
          }
        ]
      },
      {
        "rank": 2,
        "score": 8.5,
        "reason": "중성적 색감의 조합으로 포멀한 느낌을 낼 수 있습니다. 캐주얼 스타일도 가능하고 다목적으로 사용할 수 있습니다.",
        "combination": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "회색 셔츠",
            "color": "회색",
            "pattern": "무지",
            "style": ["캐주얼", "포멀"]
          },
          {
            "id": "660e8400-e29b-41d4-a716-446655440001",
            "name": "검정 청바지",
            "color": "검정",
            "pattern": "무지",
            "style": ["캐주얼"]
          },
          {
            "id": "880e8400-e29b-41d4-a716-446655440003",
            "name": "검정 구두",
            "color": "검정",
            "pattern": "무지",
            "style": ["포멀"]
          }
        ]
      },
      {
        "rank": 3,
        "score": 7.5,
        "reason": "따뜻한 톤의 조합으로 가을/겨울에 어울립니다. 클래식한 느낌을 선사하며 편안하면서도 세련된 분위기입니다.",
        "combination": [
          {
            "id": "990e8400-e29b-41d4-a716-446655440004",
            "name": "갈색 니트",
            "color": "갈색",
            "pattern": "무지",
            "style": ["클래식"]
          },
          {
            "id": "aa0e8400-e29b-41d4-a716-446655440005",
            "name": "카키 바지",
            "color": "카키",
            "pattern": "무지",
            "style": ["캐주얼"]
          },
          {
            "id": "bb0e8400-e29b-41d4-a716-446655440006",
            "name": "갈색 부츠",
            "color": "갈색",
            "pattern": "무지",
            "style": ["클래식"]
          }
        ]
      }
    ]
  }
}
```

**Status Code**: 400 Bad Request

**Body** (옷이 부족한 경우):
```json
{
  "success": false,
  "message": "최소 3개 이상의 옷이 필요합니다"
}
```

**Status Code**: 401 Unauthorized

**Body** (인증 실패):
```json
{
  "success": false,
  "message": "인증이 필요합니다"
}
```

**Status Code**: 500 Internal Server Error

**Body** (서버 오류):
```json
{
  "success": false,
  "message": "스타일 추천 생성 중 오류가 발생했습니다"
}
```

---

## 테스트 가이드

### 준비 사항

1. **백엔드 실행**:
```bash
cd backend
npm run dev
```

2. **데이터베이스 마이그레이션** (필요시):
```bash
npm run prisma:migrate
```

### Step 1: 회원가입 및 로그인

```bash
# 회원가입
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "테스트유저"
  }'

# 로그인
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

응답에서 `token` 복사:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 2: 의류 3개 이상 업로드

의류 업로드는 Phase 2 [2-2]에서 구현한 API를 사용합니다:

```bash
# 1. 검정 후드티
curl -X POST http://localhost:3001/api/clothing/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@shirt1.jpg" \
  -F "name=검정 후드티" \
  -F "brand=Nike" \
  -F "categoryId=cat-1"

# 2. 검정 청바지
curl -X POST http://localhost:3001/api/clothing/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@pants.jpg" \
  -F "name=검정 청바지" \
  -F "brand=Levi's" \
  -F "categoryId=cat-2"

# 3. 흰색 스니커즈
curl -X POST http://localhost:3001/api/clothing/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@shoes.jpg" \
  -F "name=흰색 스니커즈" \
  -F "brand=Nike" \
  -F "categoryId=cat-3"
```

### Step 3: 스타일 추천 API 호출

```bash
curl -X GET http://localhost:3001/api/recommendations/style \
  -H "Authorization: Bearer $TOKEN"
```

### 기대 응답

```json
{
  "success": true,
  "message": "스타일 추천 생성 완료",
  "data": {
    "totalClothes": 3,
    "recommendations": [
      {
        "rank": 1,
        "score": 9.5,
        "reason": "모노톤 조합으로 세련되고...",
        "combination": [...]
      },
      {
        "rank": 2,
        "score": 8.5,
        "reason": "중성적 색감으로...",
        "combination": [...]
      },
      {
        "rank": 3,
        "score": 7.5,
        "reason": "따뜻한 톤의...",
        "combination": [...]
      }
    ]
  }
}
```

### 테스트 체크리스트

- [ ] 회원가입 성공
- [ ] 로그인 성공 및 토큰 획득
- [ ] 의류 3개 업로드 성공
- [ ] 추천 API 호출 성공
- [ ] 응답 JSON 형식 올바름
- [ ] 추천 3개 반환 여부
- [ ] 각 추천에 rank, score, reason 포함
- [ ] combination 배열의 id, name, color 포함
- [ ] 점수가 1-10 범위
- [ ] 이유 설명이 자세한지 확인
- [ ] 토큰 없이 요청 시 401 에러
- [ ] 옷 3개 미만일 때 400 에러

### 트러블슈팅

#### 문제 1: "최소 3개 이상의 옷이 필요합니다" 에러

**원인**: 업로드한 의류가 3개 미만

**해결책**:
```bash
# 현재 의류 확인
curl -X GET http://localhost:3001/api/clothing \
  -H "Authorization: Bearer $TOKEN"

# 부족하면 추가 업로드
```

#### 문제 2: AI 응답이 Invalid JSON

**원인**: Gemini API가 마크다운 형식으로 응답

**해결책**: 코드에서 자동으로 처리됨
```typescript
// 이미 구현됨
const cleanText = responseText
  .replace(/```json\n?/g, '')
  .replace(/```\n?/g, '')
  .trim();
```

#### 문제 3: 존재하지 않는 옷 이름 추천

**원인**: AI가 옷 이름을 약간 다르게 인식

**해결책**: mapClothingIds에서 `id: null` 처리
```typescript
// null이면 프론트에서 스킵하거나 재시도
const clothing = clothes.find((c: any) => c.name === clothingName);
return {
  id: clothing?.id || null,  // null 가능
  name: clothingName,
};
```

---

## 프롬프트 엔지니어링

### 좋은 프롬프트의 특징

프롬프트는 AI가 정확하고 유용한 추천을 생성하도록 하는 **지시사항**입니다.

#### 1. 역할 정의 (Role Definition)

```
⚠️ 나쁜 예:
"추천해줘"

✅ 좋은 예:
"당신은 국제적 패션 스타일리스트입니다."
```

**효과**: AI가 전문가 입장에서 답변

#### 2. 구체적인 기준 (Specific Criteria)

```
⚠️ 나쁜 예:
"좋은 조합을 추천해"

✅ 좋은 예:
【평가 기준】
1. 색상 조화: 모노톤, 보색, 인접색 등
2. 스타일 통일감: 같은 스타일끼리 조합
3. 패턴 균형: 무지+패턴 우대
...
```

**효과**: AI가 명확한 기준으로 평가

#### 3. 예제 제공 (Examples)

```
⚠️ 나쁜 예:
"색상 조화를 고려해"

✅ 좋은 예:
"모노톤 조합 (검정+회색+흰색): 세련됨 ✅
보색 조합 (파랑+주황): 생기있음 ✅
너무 많은 색상: 피해야 함 ❌"
```

**효과**: AI가 정확한 이해

#### 4. 응답 형식 명시 (Output Format)

```
⚠️ 나쁜 예:
"답변해줘"

✅ 좋은 예:
"응답은 반드시 다음 JSON 형식이어야 합니다:
{
  "recommendations": [
    {
      "rank": 1,
      "combination": ["옷1", "옷2", "옷3"],
      "score": 9.5,
      "reason": "이유"
    }
  ]
}"
```

**효과**: AI가 구조화된 응답 생성

#### 5. 제약 조건 (Constraints)

```
⚠️ 나쁜 예:
"JSON 형식으로 답변"

✅ 좋은 예:
"주의: 반드시 유효한 JSON만 반환하세요. 다른 텍스트는 포함하지 마세요."
```

**효과**: AI가 추가 텍스트 생성 안 함

### 프롬프트 최적화 팁

```typescript
// 팁 1: 옷 정보를 체계적으로 구성
const clothingList = clothes
  .map((c, idx) =>
    `${idx + 1}. ${c.name} (색상: ${c.primaryColor}, 패턴: ${c.pattern}, ...)`
  )
  .join('\n');

// 팁 2: 마크다운으로 섹션 구분
const prompt = `
【섹션1】 역할
당신은 국제적 패션 스타일리스트입니다.

【섹션2】 입력
${clothingList}

【섹션3】 기준
1. 색상 조화
2. 스타일 통일감
...

【섹션4】 응답 형식
{...}

【섹션5】 제약 조건
...
`;

// 팁 3: 한국어로 명확하게
// 영어보다 한국어가 더 정확할 수 있음 (한국 스타일링 기준)

// 팁 4: 반복적 개선
// 첫 번째 테스트 후 프롬프트 개선
// 예: "점수가 너무 높음" → 기준을 더 엄격하게 조정
```

---

## 학습 포인트

### 1️⃣ AI 프롬프트 엔지니어링

**학습한 것**:
- ✅ 명확한 역할 정의의 중요성
- ✅ 구체적인 기준 제시 방법
- ✅ 구조화된 응답 형식 정의
- ✅ JSON 스키마 검증

**핵심 개념**:
```
좋은 프롬프트 = 역할 + 기준 + 예제 + 형식 + 제약
```

### 2️⃣ 색상 이론 (Color Theory)

**학습한 것**:
- ✅ 색상환의 6가지 조화 방식
- ✅ 모노톤 조합의 세련된 느낌
- ✅ 보색 조합의 생기있는 느낌
- ✅ 계절별 색상 톤의 자연스러움

**적용 사례**:
```
겨울에 검정+회색+흰색 조합은 "자연스럽고 고급스러움"
가을에 파스텔 톤은 "어색함"
봄에 밝은 톤은 "생기있고 자연스러움"
```

### 3️⃣ 스타일 분류 및 호환성

**학습한 것**:
- ✅ 5가지 주요 스타일 분류 (캐주얼, 포멀, 스트릿, 미니멀, 클래식)
- ✅ 같은 스타일의 중요성
- ✅ 격식도 스케일 (1-10)
- ✅ 스타일 믹스의 가능성 (의도적으로 혼합)

**적용 사례**:
```
검정 후드티 (캐주얼, 격식도 2)
+ 청바지 (캐주얼, 격식도 2)
+ 스니커즈 (캐주얼, 격식도 1)
= 완벽한 통일감 (점수: 10/10)

vs

검정 후드티 (캐주얼, 격식도 2)
+ 정장 셔츠 (포멀, 격식도 8)
+ 구두 (포멀, 격식도 9)
= 스타일 충돌 (점수: 3/10)
```

### 4️⃣ 패턴 균형의 원리

**학습한 것**:
- ✅ "무지 우선" 규칙의 중요성
- ✅ 패턴은 최소 1개, 최대 2개
- ✅ 같은 색감으로 패턴 통일
- ✅ 패턴 크기 고려 (이론상)

**적용 사례**:
```
스트라이프 셔츠 (한 가지 패턴)
+ 무지 바지 (무지)
+ 무지 신발 (무지)
= 패턴 균형 잡힘 (점수: 9/10)

vs

스트라이프 셔츠 (패턴 1)
+ 도트 바지 (패턴 2)
+ 체크 신발 (패턴 3)
= 너무 복잡함 (점수: 2/10)
```

### 5️⃣ 데이터 변환 및 매핑

**학습한 것**:
- ✅ AI가 생성한 데이터를 다시 정렬
- ✅ 의류 이름 → ID 변환
- ✅ null 처리 (존재하지 않는 의류)
- ✅ 추가 정보 주입 (색상, 패턴, 스타일)

**구현 예제**:
```typescript
// 입력 (AI가 생성)
{
  "combination": ["검정 후드티", "검정 청바지"]
}

// 변환 (데이터베이스 조회)
const clothing = clothes.find(c => c.name === "검정 후드티");

// 출력 (프론트엔드에 반환)
{
  "id": "uuid-123",
  "name": "검정 후드티",
  "color": "검정",
  "pattern": "무지",
  "style": ["캐주얼"]
}
```

### 6️⃣ 에러 처리 및 검증

**학습한 것**:
- ✅ 최소 조건 검증 (옷 3개 이상)
- ✅ AI 응답 파싱 에러 처리
- ✅ 일관된 에러 메시지
- ✅ 사용자 친화적 피드백

**구현 예제**:
```typescript
// 검증
if (clothes.length < 3) {
  throw new CustomError('최소 3개 이상의 옷이 필요합니다', 400);
}

// 파싱
try {
  const result = JSON.parse(cleanText);
} catch (error) {
  throw new CustomError('AI 추천 생성 중 오류가 발생했습니다', 500);
}

// 매핑
const clothing = clothes.find(c => c.name === clothingName);
if (!clothing) {
  // id: null 처리 또는 재시도
}
```

---

## 다음 단계

Phase 2 [2-4] 완료 후:

### Phase 3 계획 (미래 확장)

1. **배경 제거 (Background Removal)**
   - Gemini Vision으로 투명 PNG 생성
   - 프론트엔드에서 의류 미리보기

2. **더 정교한 추천 (Advanced Recommendations)**
   - 날씨별 추천
   - 체형별 추천
   - 피부톤별 추천

3. **추천 저장 및 관리**
   - 추천 조합을 "좋아요" 처리
   - 추천 히스토리 조회
   - 사용자 선호도 학습

4. **프론트엔드 통합**
   - 추천 UI 구현
   - 의류 카드 디자인
   - 추천 상세보기 페이지

---

## 마무리

Phase 2 [2-4]를 통해 다음을 배웠습니다:

✅ **색상 이론** - 6가지 조화 방식
✅ **스타일 분류** - 5가지 스타일과 호환성
✅ **패턴 원리** - "무지 우선" 규칙
✅ **AI 프롬프트** - 명확하고 구조화된 지시사항
✅ **데이터 변환** - AI 응답을 실용적 형태로
✅ **에러 처리** - 사용자 친화적 피드백

**핵심 통찰**:
> "좋은 스타일링은 색상, 스타일, 패턴의 균형이다."

🎨 **패션과 기술의 만남** - AI가 인간의 미적 감각을 학습하고 적용하는 경험!

🧠 **Happy Coding & Happy Styling!**
