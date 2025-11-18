// src/controllers/category.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';

export class CategoryController {
  /**
   * GET /api/categories
   * 모든 의류 카테고리 조회
   */
  static async getAllCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const categories = await CategoryService.getAllCategories();

      res.status(200).json({
        success: true,
        message: '카테고리 조회 성공',
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories/:id
   * 특정 카테고리 상세 조회
   */
  static async getCategoryById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      const category = await CategoryService.getCategoryById(id);

      res.status(200).json({
        success: true,
        message: '카테고리 상세 조회 성공',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }
}
