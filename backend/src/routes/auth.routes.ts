// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * 회원가입
 *
 * Request Body:
 * {
 *   "email": "test@example.com",
 *   "password": "password123",
 *   "name": "테스트 사용자" (선택사항)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "회원가입 성공",
 *   "data": {
 *     "token": "eyJhbGc...",
 *     "user": {
 *       "id": "user-123",
 *       "email": "test@example.com",
 *       "name": "테스트 사용자"
 *     }
 *   }
 * }
 */
router.post('/register', AuthController.register);

/**
 * POST /api/auth/login
 * 로그인
 *
 * Request Body:
 * {
 *   "email": "test@example.com",
 *   "password": "password123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "로그인 성공",
 *   "data": {
 *     "token": "eyJhbGc...",
 *     "user": {
 *       "id": "user-123",
 *       "email": "test@example.com",
 *       "name": "테스트 사용자"
 *     }
 *   }
 * }
 */
router.post('/login', AuthController.login);

/**
 * GET /api/auth/me
 * 현재 사용자 프로필 조회 (인증 필요)
 *
 * Headers:
 * {
 *   "Authorization": "Bearer eyJhbGc..."
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "프로필 조회 성공",
 *   "data": {
 *     "id": "user-123",
 *     "email": "test@example.com",
 *     "name": "테스트 사용자",
 *     "createdAt": "2024-11-14T..."
 *   }
 * }
 */
router.get('/me', authenticateToken, AuthController.getProfile);

export default router;