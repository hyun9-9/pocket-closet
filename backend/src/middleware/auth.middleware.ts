// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError } from './error.middleware';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: { id: string; email: string };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new CustomError('No token provided', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string; email: string };
    req.userId = decoded.id;
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    next(new CustomError('Invalid token', 401));
  }
};
