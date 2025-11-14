// src/services/auth.service.ts
// src/services/auth.service.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {CustomError} from '../middleware/error.middleware';

const prisma = new PrismaClient();

export interface AuthPayload {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export class AuthService {
  /**
   * 회원가입
   */
  static async register(payload: AuthPayload): Promise<AuthResponse> {
    const { email, password, name } = payload;

    // 1. 입력값 검증
    if (!email || !password) {
      throw new CustomError('Email and password are required', 400);
    }

    if (password.length < 6) {
      throw new CustomError('Password must be at least 6 characters', 400);
    }

    // 2. 기존 사용자 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new CustomError('Email already exists', 409);
    }

    // 3. 비밀번호 해싱 (Bcrypt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
      },
    });

    // 5. JWT 토큰 생성
    const token = this.generateToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * 로그인
   */
  static async login(payload: AuthPayload): Promise<AuthResponse> {
    const { email, password } = payload;

    // 1. 입력값 검증
    if (!email || !password) {
      throw new CustomError('Email and password are required', 400);
    }

    // 2. 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new CustomError('Invalid email or password', 401);
    }

    // 3. 비밀번호 검증 (Bcrypt 비교)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new CustomError('Invalid email or password', 401);
    }

    // 4. JWT 토큰 생성
    const token = this.generateToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * 프로필 조회
   */
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    return user;
  }

  /**
   * JWT 토큰 생성 (Private 메서드)
   */
  private static generateToken(userId: string, email: string): string {
    const payload = { id: userId, email };
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET || 'your-secret-key', 
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      } as jwt.SignOptions
    );

    return token;
  }
}
