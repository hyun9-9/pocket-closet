  // src/services/clothing.service.ts
  import { PrismaClient } from '@prisma/client';
  import sharp from 'sharp';
  import { GoogleGenAI, Type } from '@google/genai';
  import { CustomError } from '../middleware/error.middleware';

  const prisma = new PrismaClient();
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  

  export interface UploadClothingPayload {
    userId: string;
    name: string;
    brand?: string;
    categoryId: string;
    fileBuffer: Buffer;
    fileName: string;
    mimeType: string;
  }

  export class ClothingService {
    /**
     * 의류 업로드 및 AI 분석
     */
    static async uploadClothing(
      payload: UploadClothingPayload
    ): Promise<any> {
      const { userId, name, brand, categoryId, fileBuffer, fileName, mimeType } =
        payload;

      // 1️⃣ 파일 검증
      this.validateFile(fileBuffer, mimeType);

      // 2️⃣ 이미지 처리 (Sharp)
      const processedImage = await this.processImage(fileBuffer);

      // 3️⃣ Base64 인코딩
      const base64Image = processedImage.toString('base64');

      // 4️⃣ Google Gemini AI로 의류 분석
      const metadata = await this.analyzeClothingWithAI(base64Image);

      // 5️⃣ 데이터베이스에 저장
      const clothing = await prisma.myClothing.create({
        data: {
          userId,
          categoryId,
          name,
          brand: brand || metadata.brand,
          primaryColor: metadata.primaryColor || '#000000',
          colorHex: metadata.colorHex || '#000000',
          pattern: metadata.pattern || '무지',
          material: metadata.material || '미정',
          style: metadata.style || ['캐주얼'],
          season: metadata.season || ['사계절'],
          occasion: metadata.occasion || ['일상'],
          formality: metadata.formality || 3,
          originalImage: `data:${mimeType};base64,${base64Image}`,
          measurements: metadata.measurements || {},
          matchingRules: metadata.matchingRules || {},
        },
      });

      return {
        id: clothing.id,
        name: clothing.name,
        primaryColor: clothing.primaryColor,
        metadata: {
          pattern: clothing.pattern,
          material: clothing.material,
          style: clothing.style,
          season: clothing.season,
          occasion: clothing.occasion,
        },
      };
    }

    /**
     * 파일 검증
     */
    private static validateFile(buffer: Buffer, mimeType: string): void {
      // 파일 크기 검증 (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (buffer.length > maxSize) {
        throw new CustomError('파일 크기가 너무 큽니다 (최대 10MB)', 400);
      }

      // MIME Type 검증
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(mimeType)) {
        throw new CustomError(
          'JPG, PNG, WebP 형식만 지원합니다',
          400
        );
      }
    }

    /**
     * 이미지 처리 (Sharp)
     */
    private static async processImage(buffer: Buffer): Promise<Buffer> {
      try {
        const processed = await sharp(buffer)
          .resize(1024, 1024, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        return processed;
      } catch (error) {
        throw new CustomError('이미지 처리 중 오류가 발생했습니다', 500);
      }
    }

  /**
   * Google Gemini AI로 의류 분석 (@google/genai 방식)
   */
  private static async analyzeClothingWithAI(base64Image: string): Promise<any> {
    try {
      const ai = new GoogleGenAI({apiKey: apiKey});
      const prompt = `
  당신은 패션 전문가입니다. 이 옷 사진을 분석하고 다음 정보를 JSON 형식으로 정확하게 추출해주세요.

  응답은 반드시 유효한 JSON이어야 합니다. 다른 텍스트는 포함하지 마세요.

  {
    "primaryColor": "색상명 (예: 검정, 흰색, 파랑)",
    "colorHex": "HEX 코드 (예: #000000)",
    "pattern": "무지|스트라이프|체크|도트|플로럴 중 하나",
    "material": "코튼|폴리에스터|데님|니트|실크 등",
    "style": ["캐주얼", "미니멀", "스트릿" 등 배열],
    "season": ["봄", "여름", "가을", "겨울" 배열],
    "occasion": ["일상", "출근", "데이트", "파티" 배열],
    "formality": 1~10 사이의 숫자 (1=운동복, 10=정장),
    "brand": "브랜드명 (모르면 null)",
    "description": "이 옷에 대한 간단한 설명"
  }
  `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image,
                },
              },
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
              primaryColor: { type: Type.STRING },
              colorHex: { type: Type.STRING },
              pattern: { type: Type.STRING },
              material: { type: Type.STRING },
              style: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              season: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              occasion: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              formality: { type: Type.INTEGER },
              brand: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: [
              'primaryColor',
              'colorHex',
              'pattern',
              'material',
              'style',
              'season',
              'occasion',
              'formality',
            ],
          },
        },
      } as any);

      // @google/genai 방식으로 응답 파싱
      console.log(response);
      const responseText = response.text || '{}';
      console.log(responseText);
      // 마크다운 코드 블록 제거 (```json ... ```)
      const cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const metadata = JSON.parse(cleanText);

      return metadata;
    } catch (error) {
      console.error('AI 분석 오류:', error);
      throw new CustomError(
        'AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.',
        500
      );
    }
  }

    /**
     * 의류 목록 조회
     */
    static async getClothingByUserId(userId: string): Promise<any[]> {
      try {
        const clothes = await prisma.myClothing.findMany({
          where: { userId },
          select: {
            id: true,
            name: true,
            brand: true,
            primaryColor: true,
            pattern: true,
            material: true,
            style: true,
            season: true,
            occasion: true,
            originalImage: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        return clothes;
      } catch (error) {
        throw new CustomError('의류 목록 조회 중 오류가 발생했습니다', 500);
      }
    }

    /**
     * 의류 상세 조회
     */
    static async getClothingById(clothingId: string, userId: string): Promise<any> {
      try {
        const clothing = await prisma.myClothing.findFirst({
          where: {
            id: clothingId,
            userId, // 자신의 옷만 조회 가능
          },
        });

        if (!clothing) {
          throw new CustomError('의류를 찾을 수 없습니다', 404);
        }

        return clothing;
      } catch (error) {
        if (error instanceof CustomError) throw error;
        throw new CustomError('의류 조회 중 오류가 발생했습니다', 500);
      }
    }

    /**
     * 의류 삭제
     */
    static async deleteClothing(clothingId: string, userId: string): Promise<void> {
      try {
        const clothing = await prisma.myClothing.findFirst({
          where: {
            id: clothingId,
            userId, // 자신의 옷만 삭제 가능
          },
        });

        if (!clothing) {
          throw new CustomError('의류를 찾을 수 없습니다', 404);
        }

        await prisma.myClothing.delete({
          where: { id: clothingId },
        });
      } catch (error) {
        if (error instanceof CustomError) throw error;
        throw new CustomError('의류 삭제 중 오류가 발생했습니다', 500);
      }
    }

    /**
     * 의류 수정
     */
    static async updateClothing(
      clothingId: string,
      userId: string,
      updates: any
    ): Promise<any> {
      try {
        // 1️⃣ 기존 의류 존재 여부 확인
        const clothing = await prisma.myClothing.findFirst({
          where: {
            id: clothingId,
            userId, // 자신의 옷만 수정 가능
          },
        });

        if (!clothing) {
          throw new CustomError('의류를 찾을 수 없습니다', 404);
        }

        // 2️⃣ 업데이트 가능한 필드 필터링
        const allowedFields = [
          'name',
          'brand',
          'purchaseDate',
          'purchasePrice',
          'purchaseUrl',
          'primaryColor',
          'secondaryColor',
          'colorHex',
          'pattern',
          'texture',
          'silhouette',
          'details',
          'material',
          'materialWeight',
          'stretch',
          'transparency',
          'formality',
          'style',
          'mood',
          'season',
          'occasion',
          'wearCount',
          'lastWornDate',
          'rating',
          'tags',
        ];

        const filteredUpdates: any = {};
        Object.entries(updates).forEach(([key, value]) => {
          if (allowedFields.includes(key) && value !== undefined) {
            filteredUpdates[key] = value;
          }
        });

        // 3️⃣ 데이터베이스 업데이트
        const updatedClothing = await prisma.myClothing.update({
          where: { id: clothingId },
          data: filteredUpdates,
        });

        // 4️⃣ 응답 반환
        return {
          id: updatedClothing.id,
          name: updatedClothing.name,
          brand: updatedClothing.brand,
          primaryColor: updatedClothing.primaryColor,
          metadata: {
            pattern: updatedClothing.pattern,
            material: updatedClothing.material,
            style: updatedClothing.style,
            season: updatedClothing.season,
            occasion: updatedClothing.occasion,
          },
          updatedAt: updatedClothing.updatedAt,
        };
      } catch (error) {
        if (error instanceof CustomError) throw error;
        throw new CustomError('의류 수정 중 오류가 발생했습니다', 500);
      }
    }
  }