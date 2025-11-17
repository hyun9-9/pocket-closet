// src/routes/recommendation.routes.ts
import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/recommendations/style
 * 스타일 추천 조합 생성 (인증 필요)
 *
 * 사용자의 옷장 데이터를 분석해서 AI가 추천하는 스타일링 조합을 반환합니다.
 *
 * Query Parameters:
 * - count: 추천 개수 (기본값: 1, 최소: 1, 최대: 10)
 *   예: ?count=3 → 추천 3개
 *       ?count=5 → 추천 5개
 *       (파라미터 없음) → 기본 1개
 *
 * 평가 기준:
 * 1. 색상 조화 (모노톤, 보색, 인접색)
 * 2. 스타일 통일감 (같은 스타일끼리)
 * 3. 패턴 균형 (무지+패턴 조합)
 * 4. 격식도 유사성
 * 5. 시즌 조화
 * 6. 용도 조화
 *
 * Headers:
 * Authorization: Bearer {token}
 *
 * 사용 예시:
 * GET /api/recommendations/style
 * → 기본 1개 추천
 *
 * GET /api/recommendations/style?count=1
 * → 1개 추천
 *
 * GET /api/recommendations/style?count=3
 * → 3개 추천
 *
 * GET /api/recommendations/style?count=10
 * → 최대 10개 추천
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "스타일 추천 생성 완료",
 *   "data": {
 *     "totalClothes": 10,
 *     "requestedCount": 1,
 *     "recommendations": [
 *       {
 *         "rank": 1,
 *         "score": 9.5,
 *         "reason": "모노톤 조합으로 세련되고 캐주얼 스타일이 통일...",
 *         "combination": [
 *           {
 *             "id": "clothing-id-1",
 *             "name": "검정 후드티",
 *             "color": "검정",
 *             "pattern": "무지",
 *             "style": ["캐주얼"]
 *           },
 *           {
 *             "id": "clothing-id-2",
 *             "name": "검정 청바지",
 *             "color": "검정",
 *             "pattern": "무지",
 *             "style": ["캐주얼"]
 *           },
 *           {
 *             "id": "clothing-id-3",
 *             "name": "흰색 스니커즈",
 *             "color": "흰색",
 *             "pattern": "무지",
 *             "style": ["캐주얼"]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * 에러 응답 (400 Bad Request):
 * {
 *   "success": false,
 *   "message": "최소 3개 이상의 옷이 필요합니다"
 * }
 *
 * 에러 응답 (401 Unauthorized):
 * {
 *   "success": false,
 *   "message": "인증이 필요합니다"
 * }
 *
 * 에러 응답 (500 Internal Server Error):
 * {
 *   "success": false,
 *   "message": "스타일 추천 생성 중 오류가 발생했습니다"
 * }
 */
router.get('/style', authenticateToken, RecommendationController.getStyleRecommendations);

export default router;
