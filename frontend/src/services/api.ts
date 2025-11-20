// src/services/api.ts
import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 요청 인터셉터: 토큰 자동 추가
    this.client.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 응답 인터셉터: 에러 처리
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      }
    );
  }

  // 인증
  async login(email: string, password: string) {
    const res = await this.client.post('/auth/login', { email, password });
    return res.data;
  }

  async register(name: string, email: string, password: string) {
    const res = await this.client.post('/auth/register', { name, email, password });
    return res.data;
  }

  // 옷
  async uploadClothing(imageFile: File, metadata: any) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('name', metadata.name);
    formData.append('categoryId', metadata.categoryId);
    if (metadata.brand) {
      formData.append('brand', metadata.brand);
    }

    const res = await this.client.post('/clothing/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  }

  async getClothing(filters?: {
    search?: string;
    material?: string;
    primaryColor?: string;
    style?: string;
    occasion?: string;
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.material) params.append('material', filters.material);
    if (filters?.primaryColor) params.append('primaryColor', filters.primaryColor);
    if (filters?.style) params.append('style', filters.style);
    if (filters?.occasion) params.append('occasion', filters.occasion);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const url = queryString ? `/clothing?${queryString}` : '/clothing';

    const res = await this.client.get(url);
    return res.data;
  }

  async getClothingById(id: string) {
    const res = await this.client.get(`/clothing/${id}`);
    return res.data;
  }

  async deleteClothing(id: string) {
    const res = await this.client.delete(`/clothing/${id}`);
    return res.data;
  }

  // 카테고리
  async getCategories() {
    const res = await this.client.get('/categories');
    return res.data;
  }

  async getCategoryById(id: string) {
    const res = await this.client.get(`/categories/${id}`);
    return res.data;
  }

  // 추천
  async getRecommendations(count: number = 1) {
    const queryString = count > 1 ? `?count=${count}` : '';
    const res = await this.client.get(`/recommendations/style${queryString}`);
    return res.data;
  }

  // 조합 저장
  async saveRecommendation(payload: {
    recommendationRank: number;
    recommendationScore: number;
    combinationItems: Array<{ clothingId: string; layer: number }>;
    occasion: string;
    season?: string;
    name?: string;
    description?: string;
  }) {
    const res = await this.client.post('/recommendations/save', payload);
    return res.data;
  }

  // 저장된 조합 조회
  async getCombinations(filters?: {
    isAiRecommended?: boolean;
    occasion?: string;
    season?: string;
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();

    if (filters?.isAiRecommended !== undefined) {
      params.append('isAiRecommended', String(filters.isAiRecommended));
    }
    if (filters?.occasion) params.append('occasion', filters.occasion);
    if (filters?.season) params.append('season', filters.season);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const url = queryString ? `/combinations?${queryString}` : '/combinations';

    const res = await this.client.get(url);
    return res.data;
  }

  // 조합 평가 저장
  async updateCombinationRating(
    combinationId: string,
    rating: number,
    feedback?: string
  ) {
    const res = await this.client.patch(`/combinations/${combinationId}/rate`, {
      rating,
      feedback,
    });
    return res.data;
  }

  // 조합 삭제
  async deleteCombination(combinationId: string) {
    const res = await this.client.delete(`/combinations/${combinationId}`);
    return res.data;
  }
}

export { ApiClient };
export const apiClient = new ApiClient();
