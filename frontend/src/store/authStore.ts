// src/store/authStore.ts
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  login: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, error: null });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, error: null });
  }
}));
