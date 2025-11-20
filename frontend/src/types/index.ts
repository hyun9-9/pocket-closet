/**
 * 사용자 타입
 */
export interface User {
  id: string;
  email: string;
  name: string;
}

/**
 * 의류 타입
 */
export interface Clothing {
  id: string;
  name: string;
  brand?: string;
  primaryColor: string;
  colorHex: string;
  pattern: string;
  material: string;
  style: string[];
  season: string[];
  occasion: string[];
  formality: number;
  originalImage: string;
  createdAt: string;
}

/**
 * 추천 항목 타입
 */
export interface RecommendedItem {
  id: string;
  name: string;
  color: string;
  pattern: string;
  style: string[];
}

/**
 * 스타일 추천 타입
 */
export interface StyleRecommendation {
  rank: number;
  score: number;
  reason: string;
  combination: RecommendedItem[];
}

/**
 * API 응답 타입
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}
