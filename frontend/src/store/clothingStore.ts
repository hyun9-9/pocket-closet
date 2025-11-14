// src/store/clothingStore.ts
import { create } from 'zustand';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  metadata: any;
  createdAt: string;
}

interface ClothingStore {
  items: ClothingItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setItems: (items: ClothingItem[]) => void;
  addItem: (item: ClothingItem) => void;
  removeItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useClothingStore = create<ClothingStore>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id)
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error })
}));
