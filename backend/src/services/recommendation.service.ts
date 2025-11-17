// src/services/recommendation.service.ts
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI, Type } from '@google/genai';
import { CustomError } from '../middleware/error.middleware';

const prisma = new PrismaClient();
const apiKey = process.env.GOOGLE_AI_API_KEY;

export class RecommendationService {
  /**
   * 스타일 추천 생성
   * 사용자의 옷 데이터를 분석해서 최고의 조합 3가지 추천
   */
  static async getStyleRecommendations(userId: string): Promise<any> {
    try {
      // 1️⃣ 사용자의 모든 옷 조회
      const clothes = await this.getUserClothes(userId);

      // 최소 3개의 옷이 필요
      if (clothes.length < 3) {
        throw new CustomError(
          '최소 3개 이상의 옷이 필요합니다',
          400
        );
      }

      // 2️⃣ AI 프롬프트 생성
      const prompt = this.generateRecommendationPrompt(clothes);

      // 3️⃣ Google Gemini AI로 추천 생성
      const recommendations = await this.generateRecommendationsWithAI(prompt);

      // 4️⃣ 의류 ID로 매핑
      const mappedRecommendations = this.mapClothingIds(recommendations, clothes);

      return {
        totalClothes: clothes.length,
        recommendations: mappedRecommendations,
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      console.error('추천 생성 오류:', error);
      throw new CustomError('스타일 추천 생성 중 오류가 발생했습니다', 500);
    }
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
   */
  private static generateRecommendationPrompt(clothes: any[]): string {
    const clothingList = clothes
      .map(
        (c, idx) =>
          `${idx + 1}. ${c.name} (색상: ${c.primaryColor}/${c.colorHex}, 패턴: ${c.pattern}, 재질: ${c.material}, 스타일: ${c.style.join(', ')}, 시즌: ${c.season.join(', ')}, 용도: ${c.occasion.join(', ')}, 격식도: ${c.formality}/10)`
      )
      .join('\n');

    const prompt = `
당신은 국제적 패션 스타일리스트입니다.

다음 사용자의 옷장 데이터를 분석해서 최고의 스타일링 조합 3가지를 추천해주세요.

【사용자 옷장】
${clothingList}

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
    {
      "rank": 1,
      "combination": ["옷이름1", "옷이름2", "옷이름3"],
      "score": 9.5,
      "reason": "이유 설명 (색상 조화, 스타일 통일감, 패턴 균형 등을 구체적으로)"
    },
    {
      "rank": 2,
      "combination": ["옷이름1", "옷이름2", "옷이름3"],
      "score": 8.5,
      "reason": "이유 설명"
    },
    {
      "rank": 3,
      "combination": ["옷이름1", "옷이름2", "옷이름3"],
      "score": 7.5,
      "reason": "이유 설명"
    }
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
}
