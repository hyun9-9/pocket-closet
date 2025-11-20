// src/services/combination.service.ts
import { PrismaClient } from '@prisma/client';
import { CustomError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export interface SaveCombinationPayload {
  userId: string;
  recommendationRank: number;
  recommendationScore: number;
  combinationItems: Array<{
    clothingId: string;
    layer: number;
  }>;
  occasion: string;
  season?: string;
  name?: string;
  description?: string;
}

export class CombinationService {
  /**
   * 추천 조합 저장
   * AI 추천에서 사용자 저장으로 전환
   */
  static async saveRecommendation(payload: SaveCombinationPayload): Promise<any> {
    const {
      userId,
      recommendationRank,
      recommendationScore,
      combinationItems,
      occasion,
      season,
      name,
      description,
    } = payload;

    try {
      // 1️⃣ 의류 존재 여부 검증
      for (const item of combinationItems) {
        const clothing = await prisma.myClothing.findFirst({
          where: { id: item.clothingId, userId },
        });

        if (!clothing) {
          throw new CustomError(
            `의류 ${item.clothingId}를 찾을 수 없습니다`,
            404
          );
        }
      }

      // 2️⃣ 중복 체크 (같은 의류 조합이 이미 저장되어 있는지)
      const normalizedNewCombo = this.normalizeCombination(
        combinationItems.map(item => item.clothingId)
      );

      const savedCombinations = await prisma.styleCombination.findMany({
        where: {
          userId,
          savedAt: { not: null }, // 저장된 조합만 (마이그레이션 후)
        },
        include: {
          items: {
            select: { clothingId: true },
          },
        },
      });

      for (const saved of savedCombinations) {
        const normalizedSaved = this.normalizeCombination(
          saved.items.map((item: any) => item.clothingId)
        );

        if (normalizedNewCombo === normalizedSaved) {
          throw new CustomError('이미 저장된 조합입니다', 400);
        }
      }

      // 3️⃣ StyleCombination 생성
      const combination = await prisma.styleCombination.create({
        data: {
          userId,
          name: name || `${occasion} 룩 #${new Date().getTime()}`,
          description: description,
          occasion,
          season: season || null,
          isAiRecommended: true,
          savedAt: new Date(), // 저장 시간 기록
          originalRecommendationRank: recommendationRank,
        },
      });

      // 4️⃣ CombinationItem 생성 (의류 조합)
      for (const item of combinationItems) {
        await prisma.combinationItem.create({
          data: {
            combinationId: combination.id,
            clothingId: item.clothingId,
            layer: item.layer,
          },
        });
      }

      // 5️⃣ 저장된 조합 반환
      const savedCombination = await prisma.styleCombination.findUnique({
        where: { id: combination.id },
        include: {
          items: {
            include: {
              clothing: {
                select: {
                  id: true,
                  name: true,
                  primaryColor: true,
                  pattern: true,
                  style: true,
                },
              },
            },
          },
        },
      });

      return {
        id: savedCombination?.id,
        userId: savedCombination?.userId,
        name: savedCombination?.name,
        occasion: savedCombination?.occasion,
        season: savedCombination?.season,
        isAiRecommended: savedCombination?.isAiRecommended,
        savedAt: savedCombination?.savedAt,
        originalRecommendationRank: savedCombination?.originalRecommendationRank,
        rating: savedCombination?.rating,
        items: savedCombination?.items.map(item => ({
          clothingId: item.clothing.id,
          name: item.clothing.name,
          primaryColor: item.clothing.primaryColor,
          pattern: item.clothing.pattern,
          style: item.clothing.style,
          layer: item.layer,
        })),
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      console.error('조합 저장 오류:', error);
      throw new CustomError('조합 저장 중 오류가 발생했습니다', 500);
    }
  }

  /**
   * 저장된 조합 목록 조회
   */
  static async getCombinations(
    userId: string,
    filters?: {
      isAiRecommended?: boolean;
      occasion?: string;
      season?: string;
    },
    limit: number = 12,
    offset: number = 0
  ): Promise<{ data: any[]; total: number; pagination: any }> {
    try {
      const where: any = {
        userId,
        savedAt: { not: null }, // 저장된 조합만
      };

      if (filters?.isAiRecommended !== undefined) {
        where.isAiRecommended = filters.isAiRecommended;
      }

      if (filters?.occasion) {
        where.occasion = filters.occasion;
      }

      if (filters?.season) {
        where.season = filters.season;
      }

      // 1️⃣ 전체 개수 조회
      const total = await prisma.styleCombination.count({ where });

      // 2️⃣ 페이지네이션된 조합 조회
      const combinations = await prisma.styleCombination.findMany({
        where,
        include: {
          items: {
            include: {
              clothing: {
                select: {
                  id: true,
                  name: true,
                  primaryColor: true,
                  colorHex: true,
                  pattern: true,
                  style: true,
                  originalImage: true,
                },
              },
            },
          },
        },
        orderBy: { savedAt: 'desc' },
        take: limit,
        skip: offset,
      });

      // 3️⃣ 응답 데이터 구성
      const data = combinations.map(combo => ({
        id: combo.id,
        name: combo.name,
        description: combo.description,
        occasion: combo.occasion,
        season: combo.season,
        isAiRecommended: combo.isAiRecommended,
        savedAt: combo.savedAt,
        originalRecommendationRank: combo.originalRecommendationRank,
        rating: combo.rating,
        feedback: combo.feedback,
        usedCount: combo.usedCount,
        items: combo.items.map(item => ({
          clothingId: item.clothing.id,
          name: item.clothing.name,
          primaryColor: item.clothing.primaryColor,
          colorHex: item.clothing.colorHex,
          pattern: item.clothing.pattern,
          style: item.clothing.style,
          originalImage: item.clothing.originalImage,
          layer: item.layer,
        })),
      }));

      // 4️⃣ 페이지네이션 정보
      // 조합이 없을 때도 정상 처리 (0개일 때 totalPages = 1)
      const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
      const currentPage = Math.floor(offset / limit) + 1;

      return {
        data,
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
      console.error('조합 목록 조회 오류:', error);
      throw new CustomError('조합 목록 조회 중 오류가 발생했습니다', 500);
    }
  }

  /**
   * 조합 평가 저장
   */
  static async updateRating(
    combinationId: string,
    userId: string,
    rating: number,
    feedback?: string
  ): Promise<any> {
    try {
      // 권한 확인
      const combination = await prisma.styleCombination.findFirst({
        where: { id: combinationId, userId },
      });

      if (!combination) {
        throw new CustomError('조합을 찾을 수 없습니다', 404);
      }

      // 평가 저장 (1-5)
      if (rating < 1 || rating > 5) {
        throw new CustomError('평가는 1-5 사이의 값이어야 합니다', 400);
      }

      const updated = await prisma.styleCombination.update({
        where: { id: combinationId },
        data: {
          rating,
          feedback: feedback || null,
        },
      });

      return {
        id: updated.id,
        rating: updated.rating,
        feedback: updated.feedback,
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      console.error('평가 저장 오류:', error);
      throw new CustomError('평가 저장 중 오류가 발생했습니다', 500);
    }
  }

  /**
   * 조합 삭제
   */
  static async deleteCombination(
    combinationId: string,
    userId: string
  ): Promise<void> {
    try {
      // 권한 확인
      const combination = await prisma.styleCombination.findFirst({
        where: { id: combinationId, userId },
      });

      if (!combination) {
        throw new CustomError('조합을 찾을 수 없습니다', 404);
      }

      // 조합 삭제 (CombinationItem은 CASCADE로 자동 삭제)
      await prisma.styleCombination.delete({
        where: { id: combinationId },
      });
    } catch (error) {
      if (error instanceof CustomError) throw error;
      console.error('조합 삭제 오류:', error);
      throw new CustomError('조합 삭제 중 오류가 발생했습니다', 500);
    }
  }

  /**
   * 저장된 조합 조회 (필터링 및 중복 제거용)
   * 정규화된 형태로 반환
   */
  static async getUniqueCombinations(userId: string): Promise<Set<string>> {
    try {
      const savedCombinations = await prisma.styleCombination.findMany({
        where: {
          userId,
          savedAt: { not: null },
          isAiRecommended: true,
        },
        select: {
          id: true,
          items: {
            select: { clothingId: true },
          },
        },
      });

      // 정규화된 조합들의 Set 반환
      return new Set(
        savedCombinations.map(combo =>
          this.normalizeCombination(
            combo.items.map(item => item.clothingId)
          )
        )
      );
    } catch (error) {
      console.error('저장된 조합 조회 오류:', error);
      return new Set();
    }
  }

  /**
   * 조합 정규화 함수
   * [C, A, B] → "A,B,C"
   * 순서 무관하게 같은 조합 비교 가능
   */
  private static normalizeCombination(clothingIds: string[]): string {
    return clothingIds.sort().join(',');
  }
}
