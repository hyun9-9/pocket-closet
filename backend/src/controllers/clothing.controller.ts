// src/controllers/clothing.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ClothingService } from '../services/clothing.service';

// Multer 파일 타입 정의
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

// Request에 file과 userId 속성 추가
interface RequestWithFile extends Omit<Request, 'file'> {
  file?: MulterFile;
  userId?: string;
  body: any;
}

export class ClothingController {
  /**
   * POST /api/clothing/upload
   * 의류 이미지 업로드 및 AI 분석
   */
  static async uploadClothing(
    req: RequestWithFile,
    res: Response,
    next: NextFunction
  ) {
    try {
      // 1️⃣ 파일 확인
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '이미지 파일이 필요합니다',
        });
      }

      // 2️⃣ 요청 데이터 추출
      const { name, brand, categoryId } = req.body;
      const userId = req.userId!; // 미들웨어에서 주입됨

      // 3️⃣ 필수 데이터 검증
      if (!name || !categoryId) {
        return res.status(400).json({
          success: false,
          message: '이름과 카테고리는 필수입니다',
        });
      }

      // 4️⃣ Service에 위임
      const result = await ClothingService.uploadClothing({
        userId,
        name,
        brand,
        categoryId,
        fileBuffer: req.file.buffer,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
      });

      // 5️⃣ 성공 응답
      res.status(201).json({
        success: true,
        message: '의류 업로드 및 분석 완료',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/clothing
   * 사용자의 의류 목록 조회
   */
  static async getClothing(
    req: RequestWithFile,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.userId!; // 미들웨어에서 주입됨

      const clothes = await ClothingService.getClothingByUserId(userId);

      res.status(200).json({
        success: true,
        message: '의류 목록 조회 성공',
        data: clothes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/clothing/:id
   * 특정 의류 상세 조회
   */
  static async getClothingById(
    req: RequestWithFile,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const userId = req.userId!; // 미들웨어에서 주입됨

      const clothing = await ClothingService.getClothingById(id, userId);

      res.status(200).json({
        success: true,
        message: '의류 상세 조회 성공',
        data: clothing,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/clothing/:id
   * 의류 삭제
   */
  static async deleteClothing(
    req: RequestWithFile,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const userId = req.userId!; // 미들웨어에서 주입됨

      await ClothingService.deleteClothing(id, userId);

      res.status(200).json({
        success: true,
        message: '의류 삭제 완료',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/clothing/:id
   * 의류 정보 수정
   */
  static async updateClothing(
    req: RequestWithFile,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const userId = req.userId!; // 미들웨어에서 주입됨
      const updates = req.body;

      // 최소한 하나의 필드가 있는지 확인
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: '수정할 정보가 없습니다',
        });
      }

      const result = await ClothingService.updateClothing(id, userId, updates);

      res.status(200).json({
        success: true,
        message: '의류 정보 수정 완료',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}