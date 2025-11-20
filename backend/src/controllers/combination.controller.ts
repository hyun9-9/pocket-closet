// src/controllers/combination.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CombinationService } from '../services/combination.service';

interface RequestWithAuth extends Request {
  userId?: string;
  body: any;
}

export class CombinationController {
  /**
   * POST /api/recommendations/save
   * AI 추천 조합을 저장된 조합으로 변환
   */
  static async saveRecommendation(
    req: RequestWithAuth,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.userId!; // 미들웨어에서 주입됨

      // 1️⃣ 요청 데이터 추출 및 검증
      const {
        recommendationRank,
        recommendationScore,
        combinationItems,
        occasion,
        season,
        name,
        description,
      } = req.body;

      // 필수 필드 검증
      if (!combinationItems || !Array.isArray(combinationItems) || combinationItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: '조합에 포함될 의류가 필요합니다',
        });
      }

      if (!occasion) {
        return res.status(400).json({
          success: false,
          message: '용도(occasion)는 필수입니다',
        });
      }

      // 2️⃣ Service 호출
      const result = await CombinationService.saveRecommendation({
        userId,
        recommendationRank: recommendationRank || 0,
        recommendationScore: recommendationScore || 0,
        combinationItems,
        occasion,
        season,
        name,
        description,
      });

      // 3️⃣ 성공 응답
      res.status(201).json({
        success: true,
        message: '조합이 저장되었습니다',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/combinations
   * 저장된 조합 목록 조회 (필터링 + 페이지네이션)
   *
   * 쿼리 파라미터:
   * - isAiRecommended: AI 추천만 조회 (true/false)
   * - occasion: 용도 필터
   * - season: 계절 필터
   * - limit: 페이지 크기 (기본값: 12)
   * - offset: 페이지 오프셋 (기본값: 0)
   *
   * 응답 (200 OK):
   * {
   *   "success": true,
   *   "message": "저장된 조합 조회 성공",
   *   "data": [...],  // 조합이 없어도 빈 배열 반환
   *   "pagination": {...}
   * }
   */
  static async getCombinations(
    req: RequestWithAuth,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.userId!; // 미들웨어에서 주입됨

      // 1️⃣ 쿼리 파라미터 추출
      const {
        isAiRecommended,
        occasion,
        season,
        limit = '12',
        offset = '0',
      } = req.query;

      // 2️⃣ 타입 변환
      const parsedLimit = Math.min(parseInt(limit as string) || 12, 100); // 최대 100개
      const parsedOffset = Math.max(0, parseInt(offset as string) || 0); // offset은 0 이상

      // 3️⃣ 필터 객체 구성
      const filters = {
        isAiRecommended: isAiRecommended === 'true' ? true : isAiRecommended === 'false' ? false : undefined,
        occasion: occasion ? (occasion as string) : undefined,
        season: season ? (season as string) : undefined,
      };

      // 4️⃣ Service 호출
      const result = await CombinationService.getCombinations(
        userId,
        filters,
        parsedLimit,
        parsedOffset
      );

      // 5️⃣ 응답 (조합이 없어도 성공 응답)
      res.status(200).json({
        success: true,
        message: '저장된 조합 조회 성공',
        data: result.data || [], // 항상 배열 보장
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/combinations/:id/rate
   * 조합 평가 및 피드백 저장
   */
  static async updateRating(
    req: RequestWithAuth,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const userId = req.userId!; // 미들웨어에서 주입됨
      const { rating, feedback } = req.body;

      // 1️⃣ 필수 필드 검증
      if (rating === undefined) {
        return res.status(400).json({
          success: false,
          message: '평가는 필수입니다',
        });
      }

      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: '평가는 1-5 사이의 숫자여야 합니다',
        });
      }

      // 2️⃣ Service 호출
      const result = await CombinationService.updateRating(
        id,
        userId,
        rating,
        feedback
      );

      // 3️⃣ 응답
      res.status(200).json({
        success: true,
        message: '조합 평가가 저장되었습니다',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/combinations/:id
   * 조합 삭제
   */
  static async deleteCombination(
    req: RequestWithAuth,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const userId = req.userId!; // 미들웨어에서 주입됨

      // 1️⃣ Service 호출
      await CombinationService.deleteCombination(id, userId);

      // 2️⃣ 응답
      res.status(200).json({
        success: true,
        message: '조합이 삭제되었습니다',
      });
    } catch (error) {
      next(error);
    }
  }
}
