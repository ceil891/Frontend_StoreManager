import { create } from 'zustand';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface ProductAttribute {
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
  options?: string[];
}

interface AttributeState {
  attributes: ProductAttribute[];
  loading: boolean;
  fetchAttributes: () => Promise<void>;
  addAttribute: (payload: Omit<ProductAttribute, 'id'>) => Promise<void>;
  updateAttribute: (id: string, payload: Partial<ProductAttribute>) => Promise<void>;
  deleteAttribute: (id: string) => Promise<void>;
}

export const useAttributeStore = create<AttributeState>((set, get) => ({
  attributes: [],
  loading: false,

  fetchAttributes: async () => {
    set({ loading: true });
    try {
      const data = await axiosClient.get<any, any>('/catalog/attributes');
      const content = Array.isArray(data) ? data : data?.content || [];
      const mapped = content.map((item: any) => ({
        id: String(item.id),
        name: item.name || '',
        type: item.type || 'text',
        isRequired: !!item.isRequired,
        options: item.options || [],
      }));
      set({ attributes: mapped, loading: false });
    } catch (error) {
      console.error('Failed to fetch attributes:', error);
      set({ loading: false });
    }
  },

  addAttribute: async (payload) => {
    try {
      await axiosClient.post('/catalog/attributes', payload);
      await get().fetchAttributes();
    } catch (error) {
      console.error('Failed to add attribute:', error);
    }
  },

  updateAttribute: async (id, payload) => {
    try {
      await axiosClient.put(`/catalog/attributes/${id}`, payload);
      await get().fetchAttributes();
    } catch (error) {
      console.error('Failed to update attribute:', error);
    }
  },

  deleteAttribute: async (id) => {
    try {
      await axiosClient.delete(`/catalog/attributes/${id}`);
      await get().fetchAttributes();
    } catch (error) {
      console.error('Failed to delete attribute:', error);
    }
  }
}));
