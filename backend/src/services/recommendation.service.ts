// src/services/recommendation.service.ts
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI, Type } from '@google/genai';
import { CustomError } from '../middleware/error.middleware';
import { CombinationService } from './combination.service';

const prisma = new PrismaClient();
const apiKey = process.env.GOOGLE_AI_API_KEY;

export class RecommendationService {
  /**
   * 스타일 추천 생성
   * 사용자의 옷 데이터를 분석해서 최고의 조합 추천
   *
   * ✨ 개선사항: 이미 저장된 조합은 자동으로 제외
   *
   * @param userId 사용자 ID
   * @param count 추천 개수 (기본값: 1, 최대: 10)
   */
  static async getStyleRecommendations(userId: string, count: number = 1): Promise<any> {
    try {
      // 파라미터 검증
      const validatedCount = this.validateRecommendationCount(count);

      // 1️⃣ 사용자의 모든 옷 조회
      const clothes = await this.getUserClothes(userId);

      // 최소 3개의 옷이 필요
      if (clothes.length < 3) {
        throw new CustomError(
          '최소 3개 이상의 옷이 필요합니다',
          400
        );
      }

      // 2️⃣ 저장된 조합 먼저 조회 (AI 프롬프트에 포함할 정보)
      const savedCombinations = await CombinationService.getUniqueCombinations(userId);
      const savedCombinationsList = Array.from(savedCombinations);

      // 3️⃣ AI 프롬프트 생성 (저장된 조합 정보 포함)
      const prompt = this.generateRecommendationPrompt(
        clothes,
        validatedCount,
        savedCombinationsList
      );

      // 4️⃣ Google Gemini AI로 추천 생성
      const recommendations = await this.generateRecommendationsWithAI(prompt);

      console.log(recommendations);
      // 5️⃣ 의류 ID로 매핑
      const mappedRecommendations = this.mapClothingIds(recommendations, clothes);

      // 6️⃣ 이중 안전 장치: AI가 놓친 경우를 대비한 필터링
      const filteredRecommendations = await this.filterSavedCombinations(
        userId,
        mappedRecommendations,
        savedCombinations
      );

      // 7️⃣ 요청한 개수만큼 반환
      const slicedRecommendations = filteredRecommendations.slice(0, validatedCount);

      return {
        totalClothes: clothes.length,
        requestedCount: validatedCount,
        recommendations: slicedRecommendations,
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      console.error('추천 생성 오류:', error);
      throw new CustomError('스타일 추천 생성 중 오류가 발생했습니다', 500);
    }
  }

  /**
   * 추천 개수 검증 및 정규화
   *
   * @param count 요청한 개수
   * @returns 검증된 개수 (1-10)
   */
  private static validateRecommendationCount(count: any): number {
    // 기본값: 1
    if (count === undefined || count === null) {
      return 1;
    }

    // 숫자로 변환
    const parsedCount = parseInt(String(count), 10);

    // 유효하지 않은 숫자면 기본값
    if (isNaN(parsedCount)) {
      return 1;
    }

    // 범위 제한 (1-10)
    if (parsedCount < 1) {
      return 1;
    }
    if (parsedCount > 10) {
      return 10;
    }

    return parsedCount;
  }

  /**
   * 사용자의 모든 옷 조회
   */
  private static async getUserClothes(userId: string): Promise<any[]> {
    try {
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
    } catch (error) {
      throw new CustomError('의류 데이터 조회 중 오류가 발생했습니다', 500);
    }
  }

  /**
   * AI 프롬프트 생성
   * 옷 데이터를 정리해서 AI에게 보낼 프롬프트 작성
   * ✨ 개선: 저장된 조합을 프롬프트에 포함하여 AI가 다른 조합을 생성하도록 유도
   *
   * @param clothes 의류 배열
   * @param count 요청한 추천 개수
   * @param savedCombinations 이미 저장된 조합 목록 (정규화된 형태)
   */
  private static generateRecommendationPrompt(
    clothes: any[],
    count: number,
    savedCombinations: string[] = []
  ): string {
    const clothingList = clothes
      .map(
        (c, idx) =>
          `${idx + 1}. ${c.name} (색상: ${c.primaryColor}/${c.colorHex}, 패턴: ${c.pattern}, 재질: ${c.material}, 스타일: ${c.style.join(', ')}, 시즌: ${c.season.join(', ')}, 용도: ${c.occasion.join(', ')}, 격식도: ${c.formality}/10)`
      )
      .join('\n');

    // 저장된 조합을 사람이 읽을 수 있는 형태로 변환
    let savedCombinationsInfo = '';
    if (savedCombinations.length > 0) {
      const clothingMap = new Map(clothes.map((c) => [c.id, c.name]));
      const savedCombinationsList = savedCombinations
        .map((combo, idx) => {
          const clothingIds = combo.split(',');
          const names = clothingIds
            .map((id) => clothingMap.get(id) || `ID:${id}`)
            .join(' + ');
          return `   ${idx + 1}. ${names}`;
        })
        .join('\n');

      savedCombinationsInfo = `

【이미 저장된 조합 (피해야 함)】
${savedCombinationsList}

⚠️ 위의 저장된 조합과 동일한 의류 조합은 추천하지 마세요!
   정확히 같은 의류의 조합이면 추천 목록에서 제외해주세요.
   (예: "검정 후드집업 + 청 바지 + 검정 스니커즈" 같은 조합은 피하세요)`;
    }

    const prompt = `
당신은 국제적 패션 스타일리스트입니다.

다음 사용자의 옷장 데이터를 분석해서 최고의 스타일링 조합 ${count}가지를 추천해주세요.

【사용자 옷장】
${clothingList}${savedCombinationsInfo}

【평가 기준】
1. 색상 조화
   - 모노톤 조합 (검정+회색+흰색): 세련됨
   - 보색 조합 (파랑+주황): 생기있음
   - 인접색 조합 (빨강+주황): 따뜻함
   - 피해야 할 조합: 너무 다른 색상들의 무작위 조합

2. 스타일 통일감
   - 같은 스타일끼리 조합 우대
   - 예: 캐주얼+캐주얼, 포멀+포멀
   - 서로 다른 스타일은 신중하게

3. 패턴 균형
   - 패턴 2개 이상 섞을 때 조심
   - 무지+패턴이 가장 좋음
   - 패턴의 크기나 색감이 다르면 피해야 함

4. 격식도
   - 모든 항목의 격식도가 비슷해야 함
   - 너무 차이나면 어색함

5. 시즌 조화
   - 같은 시즌 항목 우대

6. 용도 조화
   - 같은 용도 항목 우대

응답은 반드시 다음 JSON 형식이어야 합니다:
{
  "recommendations": [
${Array.from({ length: count }, (_, i) => {
  const rank = i + 1;
  return `    {
      "rank": ${rank},
      "combination": ["옷이름1", "옷이름2", "옷이름3"],
      "score": ${(10 - rank * 0.5).toFixed(1)},
      "reason": "이유 설명 (색상 조화, 스타일 통일감, 패턴 균형 등을 구체적으로)"
    }${i < count - 1 ? ',' : ''}`;
}).join('\n')}
  ]
}

주의: 반드시 유효한 JSON만 반환하세요. 다른 텍스트는 포함하지 마세요.
    `;

    return prompt;
  }

  /**
   * Google Gemini AI로 추천 생성
   */
  private static async generateRecommendationsWithAI(prompt: string): Promise<any> {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt,
              },
            ],
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

      const responseText = response.text || '{}';
      // 마크다운 코드 블록 제거
      const cleanText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const result = JSON.parse(cleanText);
      return result;
    } catch (error) {
      console.error('AI 추천 생성 오류:', error);
      throw new CustomError(
        'AI 추천 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
        500
      );
    }
  }

  /**
   * 추천 데이터에서 의류 이름을 의류 ID로 매핑
   * AI는 의류 이름으로 조합을 만들므로, 실제 ID로 변환 필요
   */
  private static mapClothingIds(recommendations: any, clothes: any[]): any[] {
    return recommendations.recommendations.map((rec: any) => {
      // 의류 이름 → ID 매핑
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

  /**
   * 저장된 조합 필터링 (이중 안전 장치)
   * AI가 놓친 경우를 대비한 최종 필터링
   *
   * @param userId 사용자 ID
   * @param recommendations 추천 조합 배열
   * @param savedCombinations 이미 조회한 저장된 조합 Set
   * @returns 저장되지 않은 조합만 필터링된 배열
   */
  private static async filterSavedCombinations(
    userId: string,
    recommendations: any[],
    savedCombinations?: Set<string>
  ): Promise<any[]> {
    try {
      // 저장된 조합 조회 (이미 있으면 재사용)
      let combinationsSet = savedCombinations;
      if (!combinationsSet) {
        combinationsSet = await CombinationService.getUniqueCombinations(userId);
      }

      // 추천 조합 필터링
      const filtered = recommendations.filter((rec: any) => {
        // 추천 조합의 의류 ID 추출
        const clothingIds = rec.combination
          .map((item: any) => item.id)
          .filter((id: any) => id !== null);

        // 정규화
        const normalizedRec = clothingIds.sort().join(',');

        // 저장된 조합에 이미 있는지 확인
        const isDuplicate = combinationsSet!.has(normalizedRec);

        if (isDuplicate) {
          console.log(`[중복 필터링] 이미 저장된 조합: ${normalizedRec}`);
        }

        return !isDuplicate;
      });

      return filtered;
    } catch (error) {
      // 필터링 실패 시 에러 로깅 후 원본 반환 (안전 장치)
      console.error('저장된 조합 필터링 중 오류:', error);
      return recommendations;
    }
  }
}
