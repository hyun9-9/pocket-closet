// src/routes/index.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import authRoutes from './auth.routes';
import clothingRoutes from './clothing.routes';
import recommendationRoutes from './recommendation.routes';

const router = Router();

// 헬스 체크
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 라우트 추가
router.use('/auth', authRoutes);
router.use('/clothing', clothingRoutes);
router.use('/recommendations', authenticateToken, recommendationRoutes);

export default router;
