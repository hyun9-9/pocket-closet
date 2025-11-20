// src/controllers/recommendation.controller.ts
import { Request, Response, NextFunction } from 'express';
import { RecommendationService } from '../services/recommendation.service';
import { CombinationService } from '../services/combination.service';

// Request에 userId 속성 추가
type RequestWithUser = Omit<Request, 'user'> & {
  userId?: string;
  body: any;
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

  /**
   * POST /api/recommendations/save
   * AI 추천 조합을 저장된 조합으로 변환
   *
   * Body:
   * {
   *   "recommendationRank": 1,
   *   "recommendationScore": 9.5,
   *   "combinationItems": [
   *     {"clothingId": "uuid", "layer": 1},
   *     ...
   *   ],
   *   "occasion": "데이트",
   *   "season": "봄",
   *   "name": "로맨틱 룩",
   *   "description": "..."
   * }
   */
  static async saveRecommendation(
    req: RequestWithUser,
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

      // 2️⃣ Service 호출 (CombinationService의 saveRecommendation 사용)
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
}
