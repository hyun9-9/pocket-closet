// src/routes/clothing.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { ClothingController } from '../controllers/clothing.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Multer 설정 (메모리에 파일 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('JPG, PNG, WebP 형식만 지원합니다'));
    }
  },
});

/**
 * POST /api/clothing/upload
 * 의류 이미지 업로드 및 AI 분석
 *
 * Request (FormData):
 * - image: File (필수)
 * - name: string (필수) - 의류 이름
 * - brand: string (선택) - 브랜드명
 * - categoryId: string (필수) - 카테고리 ID
 *
 * Response (201 Created):
 * {
 *   "success": true,
 *   "message": "의류 업로드 및 분석 완료",
 *   "data": {
 *     "id": "clothing-123",
 *     "name": "검정 후드집업",
 *     "primaryColor": "#000000",
 *     "metadata": {
 *       "pattern": "무지",
 *       "material": "코튼",
 *       "style": ["캐주얼"],
 *       "season": ["봄", "가을", "겨울"],
 *       "occasion": ["일상"]
 *     }
 *   }
 * }
 */
router.post(
  '/upload',
  authenticateToken,
  upload.single('image'),
  ClothingController.uploadClothing
);

/**
 * GET /api/clothing
 * 사용자의 의류 목록 조회 (인증 필요)
 *
 * Headers:
 * Authorization: Bearer {token}
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "의류 목록 조회 성공",
 *   "data": [
 *     {
 *       "id": "clothing-123",
 *       "name": "검정 후드집업",
 *       "primaryColor": "#000000",
 *       "pattern": "무지",
 *       "material": "코튼",
 *       "style": ["캐주얼"],
 *       "season": ["봄", "가을", "겨울"],
 *       "occasion": ["일상"],
 *       "createdAt": "2024-11-14T..."
 *     }
 *   ]
 * }
 */
router.get('/', authenticateToken, ClothingController.getClothing);

/**
 * GET /api/clothing/:id
 * 특정 의류 상세 조회 (인증 필요)
 *
 * Headers:
 * Authorization: Bearer {token}
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "의류 상세 조회 성공",
 *   "data": {
 *     "id": "clothing-123",
 *     "name": "검정 후드집업",
 *     "brand": "Nike",
 *     "primaryColor": "#000000",
 *     "colorHex": "#000000",
 *     "pattern": "무지",
 *     "material": "코튼",
 *     "style": ["캐주얼"],
 *     "season": ["봄", "가을", "겨울"],
 *     "occasion": ["일상"],
 *     "formality": 2,
 *     "originalImage": "...",
 *     "measurements": {},
 *     "matchingRules": {},
 *     "createdAt": "2024-11-14T..."
 *   }
 * }
 */
router.get('/:id', authenticateToken, ClothingController.getClothingById);

/**
 * DELETE /api/clothing/:id
 * 의류 삭제 (인증 필요)
 *
 * Headers:
 * Authorization: Bearer {token}
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "의류 삭제 완료"
 * }
 */
router.delete('/:id', authenticateToken, ClothingController.deleteClothing);

export default router;