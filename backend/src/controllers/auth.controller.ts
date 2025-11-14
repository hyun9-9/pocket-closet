// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  /**
   * POST /api/auth/register
   * 회원가입
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      // Service에 위임
      const result = await AuthService.register({
        email,
        password,
        name,
      });

      // 성공 응답
      res.status(201).json({
        success: true,
        message: '회원가입 성공',
        data: result,
      });
    } catch (error) {
      // 에러는 에러 미들웨어로 전달
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * 로그인
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Service에 위임
      const result = await AuthService.login({
        email,
        password,
      });

      // 성공 응답
      res.status(200).json({
        success: true,
        message: '로그인 성공',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * 현재 사용자 프로필 (인증 필요)
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;  // ← 미들웨어에서 주입됨

      const user = await AuthService.getProfile(userId);

      res.status(200).json({
        success: true,
        message: '프로필 조회 성공',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}