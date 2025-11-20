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

      // 4️⃣ categoryId 유효성 검증 (UUID 형식 및 데이터베이스 존재 확인)
      const categoryExists = await ClothingService.validateCategory(categoryId);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: '존재하지 않는 카테고리입니다',
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

      // 5️⃣ 성공 응답 (상태: analyzing)
      res.status(201).json({
        success: true,
        message: '이미지 저장 완료! AI가 의류를 분석 중입니다.',
        data: result,
        // 🔥 프론트에서 사용할 수 있는 정보
        hint: {
          status: 'analyzing',
          tips: [
            'AI 분석은 10초~30초 정도 소요됩니다.',
            '잠시 후 옷장 페이지에서 새로고침(F5)하면 완전한 정보를 확인할 수 있습니다.',
            '옷장에서 수동으로 정보를 편집할 수도 있습니다.',
          ],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/clothing
   * 사용자의 의류 목록 조회 (필터링 + 페이지네이션)
   *
   * 쿼리 파라미터:
   * - search: 의류 이름 검색
   * - material: 소재 필터
   * - primaryColor: 색상 필터
   * - style: 스타일 필터
   * - occasion: 용도 필터
   * - limit: 페이지 크기 (기본값: 12)
   * - offset: 페이지 오프셋 (기본값: 0)
   */
  static async getClothing(
    req: RequestWithFile,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.userId!; // 미들웨어에서 주입됨

      // 1️⃣ 쿼리 파라미터 추출
      const {
        search,
        material,
        primaryColor,
        style,
        occasion,
        limit = '12',
        offset = '0',
      } = req.query;

      // 2️⃣ 타입 변환
      const parsedLimit = Math.min(parseInt(limit as string) || 12, 100); // 최대 100개
      const parsedOffset = parseInt(offset as string) || 0;

      // 3️⃣ 필터 객체 구성
      const filters = {
        search: search ? (search as string) : undefined,
        material: material ? (material as string) : undefined,
        primaryColor: primaryColor ? (primaryColor as string) : undefined,
        style: style ? (style as string) : undefined,
        occasion: occasion ? (occasion as string) : undefined,
      };

      // 4️⃣ Service 호출
      const result = await ClothingService.getClothingByUserId(
        userId,
        filters,
        parsedLimit,
        parsedOffset
      );

      // 5️⃣ 응답
      res.status(200).json({
        success: true,
        message: '의류 목록 조회 성공',
        data: result.data,
        pagination: result.pagination,
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