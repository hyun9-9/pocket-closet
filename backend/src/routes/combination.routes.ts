// src/routes/combination.routes.ts
import { Router } from 'express';
import { CombinationController } from '../controllers/combination.controller';

const router = Router();

/**
 * 조합 관련 라우트
 */

// GET /api/combinations - 저장된 조합 목록 조회
router.get('/', CombinationController.getCombinations);

// DELETE /api/combinations/:id - 조합 삭제
router.delete('/:id', CombinationController.deleteCombination);

// PATCH /api/combinations/:id/rate - 조합 평가
router.patch('/:id/rate', CombinationController.updateRating);

export default router;
