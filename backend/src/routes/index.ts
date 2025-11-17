// src/routes/index.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import authRoutes from './auth.routes';
import clothingRoutes from './clothing.routes';

const router = Router();

// 헬스 체크
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// TODO: 라우트 추가
router.use('/auth', authRoutes);
  // Clothing 라우트 (추가)
  router.use('/clothing', clothingRoutes);
// router.use('/recommendations', authenticateToken, recommendationRoutes);

export default router;
