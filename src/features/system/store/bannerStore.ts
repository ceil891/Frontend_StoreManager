import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addBanner: (banner: Omit<Banner, 'id'>) => void;
  updateBanner: (id: string, data: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  toggleBannerStatus: (id: string) => void;
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
    (set) => ({
      banners: MOCK_BANNERS,
      addBanner: (banner) => set((state) => ({
        banners: [...state.banners, { id: Date.now().toString(), ...banner }].sort((a, b) => a.order - b.order)
      })),
      updateBanner: (id, data) => set((state) => ({
        banners: state.banners.map((b) => b.id === id ? { ...b, ...data } : b)
      })),
      deleteBanner: (id) => set((state) => ({
        banners: state.banners.filter((b) => b.id !== id)
      })),
      toggleBannerStatus: (id) => set((state) => ({
        banners: state.banners.map((b) => b.id === id ? { ...b, isActive: !b.isActive } : b)
      })),
      reorderBanners: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.banners);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        
        // Update order property
        const reordered = result.map((item, index) => ({ ...item, order: index + 1 }));
        return { banners: reordered };
      })
    }),
    { name: 'retailhub-banner-storage' }
  )
);
