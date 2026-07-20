import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  order: number;
}

interface BannerState {
  banners: Banner[];
  fetchBanners: () => Promise<void>;
  addBanner: (banner: Omit<Banner, 'id'>) => Promise<void>;
  updateBanner: (id: string, data: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  toggleBannerStatus: (id: string) => Promise<void>;
  reorderBanners: (startIndex: number, endIndex: number) => void;
}

const MOCK_BANNERS: Banner[] = [
  {
    id: '1',
    title: 'Khuyến mãi Hè 2026',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
    linkUrl: '/promotions/summer-2026',
    isActive: true,
    validFrom: '2026-06-01',
    validUntil: '2026-08-31',
    order: 1
  },
  {
    id: '2',
    title: 'Xả kho hàng điện tử',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9c16dba5af0f?w=800&q=80',
    linkUrl: '/inventory?category=electronics',
    isActive: false,
    validFrom: '2026-05-01',
    validUntil: '2026-05-31',
    order: 2
  }
];

export const useBannerStore = create<BannerState>()(
  persist(
    (set, get) => ({
      banners: [],

      fetchBanners: async () => {
        try {
          const res = await axiosClient.get<any, any>('/system/banners');
          const data = res.content || res || [];
          if (Array.isArray(data) && data.length > 0) {
            set({ Banners: data.map((item: any) => ({
              id: String(item.id),
              title: item.title || '',
              imageUrl: item.imageUrl || '',
              linkUrl: item.linkUrl || '',
              isActive: Boolean(item.isActive),
              validFrom: item.validFrom ? item.validFrom.split('T')[0] : '',
              validUntil: item.validUntil ? item.validUntil.split('T')[0] : '',
              order: Number(item.orderIndex || item.order || 0),
            })) });
          }
        } catch (e) {
          console.error('Failed to fetch banners:', e);
        }
      },

      addBanner: async (banner) => {
        try { await axiosClient.post('/system/banners', banner); } catch (e) { console.error(e); }
        set((state) => ({
          banners: [...state.banners, { id: Date.now().toString(), ...banner }].sort((a, b) => a.order - b.order)
        }));
      },
      updateBanner: async (id, data) => {
        try { await axiosClient.put(`/system/banners/${id}`, data); } catch (e) { console.error(e); }
        set((state) => ({
          banners: state.banners.map((b) => b.id === id ? { ...b, ...data } : b)
        }));
      },
      deleteBanner: async (id) => {
        try { await axiosClient.delete(`/system/banners/${id}`); } catch (e) { console.error(e); }
        set((state) => ({
          banners: state.banners.filter((b) => b.id !== id)
        }));
      },
      toggleBannerStatus: async (id) => {
        const item = get().banners.find(b => b.id === id);
        if (item) {
          try { await axiosClient.put(`/system/banners/${id}`, { isActive: !item.isActive }); } catch (e) { console.error(e); }
        }
        set((state) => ({
          banners: state.banners.map((b) => b.id === id ? { ...b, isActive: !b.isActive } : b)
        }));
      },
      reorderBanners: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.banners);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        
        // Update order property
        const reordered = result.map((item, index) => ({ ...item, order: index + 1 }));
        return { banners: reordered };
      })
    }),
    {
      name: 'retailhub-banner-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
