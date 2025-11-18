// src/routes/index.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import authRoutes from './auth.routes';
import clothingRoutes from './clothing.routes';
import categoryRoutes from './category.routes';
import recommendationRoutes from './recommendation.routes';

const router = Router();

// 헬스 체크
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 라우트 추가
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes); // 카테고리 (공개, 인증 불필요)
router.use('/clothing', clothingRoutes);
router.use('/recommendations', authenticateToken, recommendationRoutes);

export default router;
