import { create } from 'zustand';
import { logisticsService } from '../services/logisticsService';

// ---------------------------
// TYPES: PRICE LISTS
// ---------------------------
export interface PriceListDetail {
  id: string;
  sku: string;
  productName: string;
  basePrice: number;
  overridePrice: number;
  productUnitId?: string;
  unitName?: string;
}

export interface PriceListSchedule {
  id: string;
  listCode: string;
  listName: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'VND';
  pricingTier: 'RETAIL_DEFAULT' | 'WHOLESALE_TIER1' | 'DISTRIBUTOR_VIP' | 'EMPLOYEE_COST';
  effectiveDate: string;
  expirationDate?: string;
  markupPercentage?: number;
  status: 'ACTIVE' | 'FUTURE_SCHEDULED' | 'EXPIRED' | 'DRAFT';
  applicableBranches: string;
  notes?: string;
  details: PriceListDetail[];
}

export interface PromotionRecord {
  id: string;
  promoCode: string;
  promoName: string;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PAUSED';
}

export interface ShippingChargeRecord {
  id: string;
  zoneCode: string;
  zoneName: string;
  carrierName: string;
  baseFee: number;
  perKgFee: number;
  estimatedHours: number;
  status: 'ACTIVE' | 'INACTIVE';
}

interface LogisticsState {
  priceLists: PriceListSchedule[];
  promotions: PromotionRecord[];
  shippingCharges: ShippingChargeRecord[];
  isLoading: boolean;
  error: string | null;

  fetchPriceLists: () => Promise<void>;
  addPriceList: (list: Omit<PriceListSchedule, 'id'>) => Promise<void>;
  updatePriceList: (id: string, data: Partial<PriceListSchedule>) => Promise<void>;
  deletePriceList: (id: string) => Promise<void>;

  fetchPromotions: () => Promise<void>;
  addPromotion: (item: Omit<PromotionRecord, 'id'>) => Promise<void>;
  updatePromotion: (id: string, data: Partial<PromotionRecord>) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;

  fetchShippingCharges: () => Promise<void>;
  addShippingCharge: (item: Omit<ShippingChargeRecord, 'id'>) => Promise<void>;
  updateShippingCharge: (id: string, data: Partial<ShippingChargeRecord>) => Promise<void>;
  deleteShippingCharge: (id: string) => Promise<void>;
}

const getSavedLogisticsItems = <T>(key: string): T[] => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

const saveLogisticsItems = <T>(key: string, items: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {}
};

export const useLogisticsStore = create<LogisticsState>()((set) => ({
  priceLists: [],
  promotions: [],
  shippingCharges: [],
  isLoading: false,
  error: null,

  fetchPriceLists: async () => {
    set({ isLoading: true, error: null });
    const local = getSavedLogisticsItems<PriceListSchedule>('retailhub_logistics_price_lists');
    try {
      const data = await logisticsService.fetchPriceLists();
      if (data && data.length > 0) {
        const mergedMap = new Map<string, PriceListSchedule>();
        data.forEach(p => mergedMap.set(p.id, p));
        local.forEach(p => mergedMap.set(p.id, p));
        const merged = Array.from(mergedMap.values());
        set({ priceLists: merged, isLoading: false });
        saveLogisticsItems('retailhub_logistics_price_lists', merged);
      } else if (local.length > 0) {
        set({ priceLists: local, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      if (local.length > 0) {
        set({ priceLists: local, isLoading: false });
      } else {
        set({ isLoading: false, error: error.message || 'Lỗi khi tải bảng giá' });
      }
    }
  },

  addPriceList: async (list) => {
    set({ isLoading: true, error: null });
    let created: PriceListSchedule;
    try {
      created = await logisticsService.addPriceList(list);
    } catch (error: any) {
      console.warn('API add price list failed, fallback local add:', error);
      created = {
        id: String(Date.now()),
        listCode: list.listCode || `PL-${Date.now().toString().slice(-6)}`,
        listName: list.listName,
        currency: list.currency || 'VND',
        pricingTier: list.pricingTier || 'RETAIL_DEFAULT',
        effectiveDate: list.effectiveDate || new Date().toISOString().split('T')[0],
        expirationDate: list.expirationDate,
        markupPercentage: list.markupPercentage || 0,
        status: list.status || 'ACTIVE',
        applicableBranches: list.applicableBranches || 'Toàn hệ thống',
        notes: list.notes,
        details: list.details || [],
      };
    }
    set((state) => {
      const next = [created, ...state.priceLists];
      saveLogisticsItems('retailhub_logistics_price_lists', next);
      return { priceLists: next, isLoading: false };
    });
  },

  updatePriceList: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await logisticsService.updatePriceList(id, data);
    } catch (error: any) {
      console.warn('API update price list failed, applying local update:', error);
    }
    set((state) => {
      const next = state.priceLists.map((p) => (p.id === id ? { ...p, ...data } : p));
      saveLogisticsItems('retailhub_logistics_price_lists', next);
      return { priceLists: next, isLoading: false };
    });
  },

  deletePriceList: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await logisticsService.deletePriceList(id);
    } catch (error: any) {
      console.warn('API delete price list failed, applying local delete:', error);
    }
    set((state) => {
      const next = state.priceLists.filter((p) => p.id !== id);
      saveLogisticsItems('retailhub_logistics_price_lists', next);
      return { priceLists: next, isLoading: false };
    });
  },

  fetchPromotions: async () => {
    set({ isLoading: true, error: null });
    const local = getSavedLogisticsItems<PromotionRecord>('retailhub_logistics_promotions');
    try {
      const data = await logisticsService.fetchPromotions();
      if (data && data.length > 0) {
        const mergedMap = new Map<string, PromotionRecord>();
        data.forEach(p => mergedMap.set(p.id, p));
        local.forEach(p => mergedMap.set(p.id, p));
        const merged = Array.from(mergedMap.values());
        set({ promotions: merged, isLoading: false });
        saveLogisticsItems('retailhub_logistics_promotions', merged);
      } else if (local.length > 0) {
        set({ promotions: local, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      if (local.length > 0) {
        set({ promotions: local, isLoading: false });
      } else {
        set({ isLoading: false, error: error.message || 'Lỗi khi tải chương trình khuyến mãi' });
      }
    }
  },

  addPromotion: async (item) => {
    set({ isLoading: true, error: null });
    let created: PromotionRecord;
    try {
      created = await logisticsService.addPromotion(item);
    } catch (error: any) {
      console.warn('API add promotion failed, fallback local add:', error);
      created = {
        id: String(Date.now()),
        promoCode: item.promoCode || `PROMO-${Date.now().toString().slice(-6)}`,
        promoName: item.promoName,
        discountType: item.discountType || 'PERCENT',
        discountValue: item.discountValue || 10,
        startDate: item.startDate || new Date().toISOString().split('T')[0],
        endDate: item.endDate || new Date().toISOString().split('T')[0],
        status: item.status || 'ACTIVE',
      };
    }
    set((state) => {
      const next = [created, ...state.promotions];
      saveLogisticsItems('retailhub_logistics_promotions', next);
      return { promotions: next, isLoading: false };
    });
  },

  updatePromotion: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await logisticsService.updatePromotion(id, data);
    } catch (error: any) {
      console.warn('API update promotion failed, applying local update:', error);
    }
    set((state) => {
      const next = state.promotions.map((p) => (p.id === id ? { ...p, ...data } : p));
      saveLogisticsItems('retailhub_logistics_promotions', next);
      return { promotions: next, isLoading: false };
    });
  },

  deletePromotion: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await logisticsService.deletePromotion(id);
    } catch (error: any) {
      console.warn('API delete promotion failed, applying local delete:', error);
    }
    set((state) => {
      const next = state.promotions.filter((p) => p.id !== id);
      saveLogisticsItems('retailhub_logistics_promotions', next);
      return { promotions: next, isLoading: false };
    });
  },

  fetchShippingCharges: async () => {
    set({ isLoading: true, error: null });
    const local = getSavedLogisticsItems<ShippingChargeRecord>('retailhub_logistics_shipping_charges');
    try {
      const data = await logisticsService.fetchShippingCharges();
      if (data && data.length > 0) {
        const mergedMap = new Map<string, ShippingChargeRecord>();
        data.forEach(s => mergedMap.set(s.id, s));
        local.forEach(s => mergedMap.set(s.id, s));
        const merged = Array.from(mergedMap.values());
        set({ shippingCharges: merged, isLoading: false });
        saveLogisticsItems('retailhub_logistics_shipping_charges', merged);
      } else if (local.length > 0) {
        set({ shippingCharges: local, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      if (local.length > 0) {
        set({ shippingCharges: local, isLoading: false });
      } else {
        set({ isLoading: false, error: error.message || 'Lỗi khi tải cước phí giao hàng' });
      }
    }
  },

  addShippingCharge: async (item) => {
    set({ isLoading: true, error: null });
    let created: ShippingChargeRecord;
    try {
      created = await logisticsService.addShippingCharge(item);
    } catch (error: any) {
      console.warn('API add shipping charge failed, fallback local add:', error);
      created = {
        id: String(Date.now()),
        zoneCode: item.zoneCode || `ZONE-${Date.now().toString().slice(-4)}`,
        zoneName: item.zoneName,
        carrierName: item.carrierName || 'Viettel Post',
        baseFee: item.baseFee || 15000,
        perKgFee: item.perKgFee || 5000,
        estimatedHours: item.estimatedHours || 24,
        status: item.status || 'ACTIVE',
      };
    }
    set((state) => {
      const next = [created, ...state.shippingCharges];
      saveLogisticsItems('retailhub_logistics_shipping_charges', next);
      return { shippingCharges: next, isLoading: false };
    });
  },

  updateShippingCharge: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await logisticsService.updateShippingCharge(id, data);
    } catch (error: any) {
      console.warn('API update shipping charge failed, applying local update:', error);
    }
    set((state) => {
      const next = state.shippingCharges.map((s) => (s.id === id ? { ...s, ...data } : s));
      saveLogisticsItems('retailhub_logistics_shipping_charges', next);
      return { shippingCharges: next, isLoading: false };
    });
  },

  deleteShippingCharge: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await logisticsService.deleteShippingCharge(id);
    } catch (error: any) {
      console.warn('API delete shipping charge failed, applying local delete:', error);
    }
    set((state) => {
      const next = state.shippingCharges.filter((s) => s.id !== id);
      saveLogisticsItems('retailhub_logistics_shipping_charges', next);
      return { shippingCharges: next, isLoading: false };
    });
  },
}));
