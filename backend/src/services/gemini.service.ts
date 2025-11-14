// src/services/gemini.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ClothingMetadata } from '../types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export class GeminiService {
  /**
   * 옷 이미지를 분석하고 메타데이터 추출
   */
  static async analyzeClothing(imageBase64: string): Promise<{
    metadata: ClothingMetadata;
    category: string;
    brand?: string;
  }> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
당신은 패션 전문가입니다. 이 옷 사진을 분석해서 다음 정보를 JSON 형식으로 추출해주세요.

응답은 반드시 유효한 JSON 형식이어야 합니다.

{
  "category": "상의|하의|아우터|원피스|신발|액세서리 중 하나",
  "brand": "브랜드명 (모르면 null)",
  "metadata": {
    "visual": {
      "primaryColor": "주색상 HEX 코드 (예: #FF0000)",
      "secondaryColors": ["보조색상 HEX 코드들"],
      "pattern": "무지|스트라이프|체크|도트|프린트 중 하나",
      "texture": "부드러움|거침|광택",
      "silhouette": "슬림|레귤러|오버사이즈",
      "neckline": "라운드|브이|터틀|칼라 (상의인 경우)",
      "sleeves": "민소매|반팔|7부|긴팔 (상의인 경우)",
      "length": "크롭|레귤러|롱 (해당하면)"
    },
    "material": {
      "fabric": ["면", "폴리에스터", "데님", "니트", "실크" 등"],
      "weight": "얇음|보통|두꺼움",
      "stretch": true|false,
      "transparency": "불투명|반투명|비침",
      "formality": 1~10 숫자 (1=운동복, 10=정장)
    },
    "style": {
      "mainStyle": ["캐주얼", "포멀", "스트릿", "빈티지", "미니멀" 등],
      "mood": ["편안한", "세련된", "귀여운", "시크한" 등],
      "season": ["봄", "여름", "가을", "겨울"],
      "occasion": ["데일리", "데이트", "출근", "운동", "파티" 등]
    },
    "pairing": {
      "goodWithColors": ["잘 어울리는 색상들"],
      "goodWithPatterns": ["잘 어울리는 패턴들"],
      "avoidColors": ["피해야 할 색상들"],
      "avoidPatterns": ["피해야 할 패턴들"],
      "layeringCompatible": true|false,
      "recommendedBottoms": ["추천 하의 스타일들"],
      "recommendedTops": ["추천 상의 스타일들"]
    }
  }
}
    `;

    try {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ]
      });

      const responseText = result.response.text();
      // JSON 추출 (마크다운 코드블록 처리)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        category: parsed.category,
        brand: parsed.brand,
        metadata: parsed.metadata
      };
    } catch (error) {
      console.error('Gemini analysis error:', error);
      throw new Error('Failed to analyze clothing image');
    }
  }

  /**
   * 옷 이미지의 배경 제거 (PNG로 변환)
   */
  static async removeBackground(imageBase64: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
이 옷의 배경을 완전히 제거하고 투명 PNG로 만들어주세요.
옷만 깔끔하게 남겨주세요. 옷의 형태와 디테일이 명확하게 보이도록 조정해주세요.

응답은 처리된 이미지를 base64로 인코딩하여 반환하세요.
    `;

    try {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ]
      });

      // Gemini의 응답에서 이미지 데이터 추출
      const imageData = result.response.candidates?.[0]?.content?.parts?.[0];

      if (imageData && 'inlineData' in imageData) {
        return imageData.inlineData.data;
      }

      throw new Error('No image data in response');
    } catch (error) {
      console.error('Background removal error:', error);
      // 실패 시 원본 이미지 반환
      return imageBase64;
    }
  }

  /**
   * 2단계 필터링 - 추천 옷 선별
   */
  static async filterClothingForRecommendation(
    clothingMetadata: any[],
    occasion: string
  ): Promise<string[]> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
당신은 패션 스타일리스트입니다.

다음 ${clothingMetadata.length}개의 옷 중에서 "${occasion}"에 적합한 20-30개를 선별해주세요.
색상 조화, 스타일 통일성, 상황 적합도를 고려하세요.

옷 목록 (메타데이터):
${JSON.stringify(clothingMetadata, null, 2)}

응답은 다음 JSON 형식으로만:
{
  "selectedIds": ["id1", "id2", ...]
}
    `;

    try {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      });

      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.selectedIds || [];
    } catch (error) {
      console.error('Filtering error:', error);
      // 실패 시 처음 20개 반환
      return clothingMetadata.slice(0, 20).map((c: any) => c.id);
    }
  }

  /**
   * 2단계 필터링 - 코디 조합 생성
   */
  static async generateCombinations(
    selectedClothing: any[],
    occasion: string
  ): Promise<any[]> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
당신은 고급 스타일리스트입니다.

다음 ${selectedClothing.length}개의 옷으로 "${occasion}"에 어울리는 코디 조합 3개를 만들어주세요.

각 조합마다:
- 상의, 하의, 아우터(선택), 신발(선택)
- 색상 조화 점수 (1-10)
- 스타일 통일성 점수 (1-10)
- 추천 이유
- 스타일링 팁

옷 정보:
${JSON.stringify(selectedClothing, null, 2)}

응답은 다음 JSON 형식으로만:
{
  "combinations": [
    {
      "items": ["clothingId1", "clothingId2", ...],
      "colorHarmony": 8,
      "styleConsistency": 9,
      "reason": "...",
      "tips": "..."
    }
  ]
}
    `;

    try {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      });

      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.combinations || [];
    } catch (error) {
      console.error('Combination generation error:', error);
      return [];
    }
  }
}
