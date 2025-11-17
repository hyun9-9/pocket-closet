// src/controllers/recommendation.controller.ts
import { Request, Response, NextFunction } from 'express';
import { RecommendationService } from '../services/recommendation.service';

// Request에 userId 속성 추가
type RequestWithUser = Omit<Request, 'user'> & {
  userId?: string;
};

export class RecommendationController {
  /**
   * GET /api/recommendations/style
   * 스타일 추천 조합 생성
   *
   * Query Parameters:
   * - count: 추천 개수 (기본값: 1, 범위: 1-10)
   */
  static async getStyleRecommendations(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.userId!; // 미들웨어에서 주입됨
      const count = req.query.count ? parseInt(String(req.query.count), 10) : 1;

      const result = await RecommendationService.getStyleRecommendations(userId, count);

      res.status(200).json({
        success: true,
        message: '스타일 추천 생성 완료',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
