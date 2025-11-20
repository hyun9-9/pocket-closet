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
     * 의류 업로드 (이미지 저장만 수행 - 빠른 응답)
     * ✅ 개선: AI 분석은 백그라운드에서 비동기로 진행
     *
     * 반환 시간: 3초 (이전: 8-13초)
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

      // 4️⃣ 기본 데이터만으로 DB에 즉시 저장 (AI 분석 없음)
      const clothing = await prisma.myClothing.create({
        data: {
          userId,
          categoryId,
          name,
          brand: brand || null,
          primaryColor: '#CCCCCC',  // 기본값 (분석 전)
          colorHex: '#CCCCCC',
          pattern: '분석중',
          material: '분석중',
          style: [],
          season: [],
          occasion: [],
          formality: 5,
          originalImage: `data:${mimeType};base64,${base64Image}`,
          measurements: {},
          matchingRules: {},
        },
      });

      // 5️⃣ 🔥 백그라운드에서 AI 분석 시작 (대기하지 않음!)
      this.analyzeAndUpdateClothingAsync(clothing.id, base64Image).catch((err) => {
        console.error(`의류 ${clothing.id} AI 분석 실패:`, err);
        // 실패해도 사용자에게 에러 표시 안 함 (이미지는 저장됨)
      });

      return {
        id: clothing.id,
        name: clothing.name,
        primaryColor: clothing.primaryColor,
        status: 'analyzing',  // 분석 중 상태 표시
        message: 'AI가 의류를 분석 중입니다. 잠시 후 새로고침하면 완전한 정보를 볼 수 있습니다.',
        metadata: {
          pattern: '분석중',
          material: '분석중',
          style: [],
          season: [],
          occasion: [],
        },
      };
    }

    /**
     * 백그라운드 AI 분석 및 DB 업데이트
     * 🔥 비동기 함수 - 메인 응답에서 대기하지 않음
     */
    private static async analyzeAndUpdateClothingAsync(
      clothingId: string,
      base64Image: string
    ): Promise<void> {
      try {
        // 1️⃣ Google Gemini AI로 의류 분석 (시간 소요)
        const metadata = await this.analyzeClothingWithAI(base64Image);

        // 2️⃣ 분석 결과로 DB 업데이트
        await prisma.myClothing.update({
          where: { id: clothingId },
          data: {
            brand: metadata.brand || null,
            primaryColor: metadata.primaryColor || '#000000',
            colorHex: metadata.colorHex || '#000000',
            pattern: metadata.pattern || '무지',
            material: metadata.material || '미정',
            style: metadata.style || ['캐주얼'],
            season: metadata.season || ['사계절'],
            occasion: metadata.occasion || ['일상'],
            formality: metadata.formality || 3,
            measurements: metadata.measurements || {},
            matchingRules: metadata.matchingRules || {},
          },
        });

        console.log(`✅ 의류 ${clothingId} AI 분석 완료`);
      } catch (error) {
        console.error(`❌ 의류 ${clothingId} AI 분석 실패:`, error);
        // 에러가 발생해도 이미지는 이미 저장되어 있음
      }
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
          'JPG, JPEG, PNG, WebP 형식만 지원합니다',
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
     * 카테고리 유효성 검증
     * categoryId가 실제 데이터베이스에 존재하는지 확인
     */
    static async validateCategory(categoryId: string): Promise<boolean> {
      try {
        const category = await prisma.clothingCategory.findUnique({
          where: { id: categoryId },
        });
        return !!category;
      } catch (error) {
        console.error('카테고리 검증 오류:', error);
        return false;
      }
    }

    /**
     * 의류 목록 조회 (필터링 + 페이지네이션)
     *
     * @param userId 사용자 ID
     * @param filters 필터 옵션 {
     *   search?: string (의류 이름 검색)
     *   material?: string (소재)
     *   primaryColor?: string (주요 색상)
     *   style?: string[] (스타일)
     *   occasion?: string[] (용도)
     * }
     * @param limit 페이지 크기 (기본값: 12)
     * @param offset 페이지 오프셋 (기본값: 0)
     */
    static async getClothingByUserId(
      userId: string,
      filters?: {
        search?: string;
        material?: string;
        primaryColor?: string;
        style?: string;
        occasion?: string;
      },
      limit: number = 12,
      offset: number = 0
    ): Promise<{ data: any[]; total: number; pagination: any }> {
      try {
        // 1️⃣ WHERE 조건 구성
        const where: any = { userId };

        // 검색 필터
        if (filters?.search) {
          where.name = {
            contains: filters.search,
            mode: 'insensitive',
          };
        }

        // 소재 필터
        if (filters?.material) {
          where.material = filters.material;
        }

        // 색상 필터
        if (filters?.primaryColor) {
          where.primaryColor = filters.primaryColor;
        }

        // 스타일 필터 (배열에 포함된 항목)
        if (filters?.style) {
          where.style = {
            has: filters.style,
          };
        }

        // 용도 필터 (배열에 포함된 항목)
        if (filters?.occasion) {
          where.occasion = {
            has: filters.occasion,
          };
        }

        // 2️⃣ 전체 개수 조회
        const total = await prisma.myClothing.count({ where });

        // 3️⃣ 페이지네이션된 데이터 조회
        const clothes = await prisma.myClothing.findMany({
          where,
          select: {
            id: true,
            name: true,
            brand: true,
            primaryColor: true,
            colorHex: true,
            pattern: true,
            material: true,
            style: true,
            season: true,
            occasion: true,
            originalImage: true,
            thumbnailImage: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        });

        // 4️⃣ 페이지네이션 정보
        const totalPages = Math.ceil(total / limit);
        const currentPage = Math.floor(offset / limit) + 1;

        return {
          data: clothes,
          total,
          pagination: {
            page: currentPage,
            limit,
            total,
            pages: totalPages,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1,
          },
        };
      } catch (error) {
        console.error('의류 목록 조회 오류:', error);
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