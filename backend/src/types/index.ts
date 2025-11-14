// src/types/index.ts

// 인증 타입
export interface JWTPayload {
  id: string;
  email: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

// 옷 관련 타입
export interface ClothingMetadata {
  visual: {
    primaryColor: string;
    secondaryColors: string[];
    pattern: string;
    texture: string;
    silhouette: string;
    neckline?: string;
    sleeves?: string;
    length?: string;
  };
  material: {
    fabric: string[];
    weight: string;
    stretch: boolean;
    transparency: string;
    formality: number;
  };
  style: {
    mainStyle: string[];
    mood: string[];
    season: string[];
    occasion: string[];
  };
  pairing: {
    goodWithColors: string[];
    goodWithPatterns: string[];
    avoidColors: string[];
    avoidPatterns: string[];
    layeringCompatible: boolean;
    recommendedBottoms?: string[];
    recommendedTops?: string[];
  };
}

export interface ClothingMeasurements {
  chest?: number;
  waist?: number;
  hip?: number;
  length?: number;
  shoulderWidth?: number;
  sleeveLength?: number;
}

export interface CreateClothingRequest {
  name: string;
  brand?: string;
  category: string;
  metadata: ClothingMetadata;
  measurements?: ClothingMeasurements;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
