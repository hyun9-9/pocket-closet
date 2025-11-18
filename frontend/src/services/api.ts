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

  async getClothing() {
    const res = await this.client.get('/clothing');
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
  async getRecommendations(occasion: string) {
    const res = await this.client.post('/recommendations/style', { occasion });
    return res.data;
  }
}

export { ApiClient };
export const apiClient = new ApiClient();
