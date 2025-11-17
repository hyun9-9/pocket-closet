// src/routes/recommendation.routes.ts
import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/recommendations/style
 * 스타일 추천 조합 생성 (인증 필요)
 *
 * 사용자의 옷장 데이터를 분석해서 최고의 스타일링 조합 3가지를 AI가 추천합니다.
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
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "스타일 추천 생성 완료",
 *   "data": {
 *     "totalClothes": 10,
 *     "recommendations": [
 *       {
 *         "rank": 1,
 *         "score": 9.5,
 *         "reason": "모노톤 조합으로 세련되고 캐주얼 스타일 통일...",
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
 *       },
 *       {
 *         "rank": 2,
 *         "score": 8.5,
 *         "reason": "중성적 색감으로 포멀한 느낌...",
 *         "combination": [...]
 *       },
 *       {
 *         "rank": 3,
 *         "score": 7.5,
 *         "reason": "현대적 스포츠웨어 믹스...",
 *         "combination": [...]
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
