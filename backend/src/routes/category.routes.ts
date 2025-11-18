// src/routes/category.routes.ts
import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';

const router = Router();

/**
 * GET /api/categories
 * 모든 의류 카테고리 조회 (공개, 인증 불필요)
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "카테고리 조회 성공",
 *   "data": [
 *     {
 *       "id": "clo123...",
 *       "name": "상의",
 *       "nameEn": "top",
 *       "description": "상의류 (티셔츠, 셔츠, 후드 등)"
 *     },
 *     {
 *       "id": "clo124...",
 *       "name": "하의",
 *       "nameEn": "bottom",
 *       "description": "하의류 (바지, 치마 등)"
 *     }
 *   ]
 * }
 */
router.get('/', CategoryController.getAllCategories);

/**
 * GET /api/categories/:id
 * 특정 카테고리 상세 조회
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "카테고리 상세 조회 성공",
 *   "data": {
 *     "id": "clo123...",
 *     "name": "상의",
 *     "nameEn": "top",
 *     "description": "상의류 (티셔츠, 셔츠, 후드 등)",
 *     "requiredMeasurements": {
 *       "chest": true,
 *       "length": true,
 *       "shoulder": false
 *     }
 *   }
 * }
 */
router.get('/:id', CategoryController.getCategoryById);

export default router;
