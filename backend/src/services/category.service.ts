// src/services/category.service.ts
import { PrismaClient } from '@prisma/client';
import { CustomError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export class CategoryService {
  /**
   * 모든 의류 카테고리 조회
   */
  static async getAllCategories(): Promise<any[]> {
    try {
      const categories = await prisma.clothingCategory.findMany({
        select: {
          id: true,
          name: true,
          nameEn: true,
          description: true,
        },
        orderBy: { name: 'asc' },
      });

      if (categories.length === 0) {
        throw new CustomError('등록된 카테고리가 없습니다', 404);
      }

      return categories;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError('카테고리 조회 중 오류가 발생했습니다', 500);
    }
  }

  /**
   * 특정 카테고리 상세 조회
   */
  static async getCategoryById(categoryId: string): Promise<any> {
    try {
      const category = await prisma.clothingCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new CustomError('카테고리를 찾을 수 없습니다', 404);
      }

      return category;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError('카테고리 조회 중 오류가 발생했습니다', 500);
    }
  }

  /**
   * 카테고리 초기 데이터 생성 (관리자용)
   * 데이터베이스에 기본 카테고리가 없을 때 호출
   */
  static async initializeDefaultCategories(): Promise<void> {
    try {
      const count = await prisma.clothingCategory.count();

      // 이미 카테고리가 있으면 스킵
      if (count > 0) {
        console.log(`✓ 카테고리 ${count}개 이미 존재`);
        return;
      }

      // 기본 카테고리 생성
      const defaultCategories = [
        {
          name: '상의',
          nameEn: 'top',
          description: '상의류 (티셔츠, 셔츠, 후드 등)',
          requiredMeasurements: {
            chest: true,
            length: true,
            shoulder: false,
          },
        },
        {
          name: '하의',
          nameEn: 'bottom',
          description: '하의류 (바지, 치마 등)',
          requiredMeasurements: {
            waist: true,
            hip: true,
            length: true,
            thigh: false,
          },
        },
        {
          name: '아우터',
          nameEn: 'outerwear',
          description: '아우터 (자켓, 코트, 가디건 등)',
          requiredMeasurements: {
            chest: true,
            shoulder: true,
            length: true,
          },
        },
        {
          name: '신발',
          nameEn: 'shoes',
          description: '신발류 (스니커즈, 구두, 부츠 등)',
          requiredMeasurements: {
            size: true,
          },
        },
        {
          name: '악세서리',
          nameEn: 'accessories',
          description: '악세서리 (가방, 모자, 벨트 등)',
          requiredMeasurements: {},
        },
        {
          name: '원피스',
          nameEn: 'dress',
          description: '원피스 (원피스, 스커트 등)',
          requiredMeasurements: {
            chest: true,
            hip: true,
            length: true,
          },
        },
      ];

      // 배치 생성
      for (const category of defaultCategories) {
        await prisma.clothingCategory.create({
          data: {
            name: category.name,
            nameEn: category.nameEn,
            description: category.description,
            requiredMeasurements: category.requiredMeasurements as any,
          },
        });
      }

      console.log(`✓ ${defaultCategories.length}개의 기본 카테고리 생성 완료`);
    } catch (error) {
      console.error('카테고리 초기화 오류:', error);
      throw error;
    }
  }
}
