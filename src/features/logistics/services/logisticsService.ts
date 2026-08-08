import { axiosClient } from '@/shared/lib/axiosClient';
import type { PriceListSchedule, PromotionRecord, ShippingChargeRecord } from '../store/logisticsStore';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';

const resolveBranchId = (name?: string): number => {
  if (!name) return 1;
  const lower = name.toLowerCase();
  if (lower.includes('quận 2') || lower.includes('q2') || lower.includes('cn2')) return 2;
  if (lower.includes('quận 3') || lower.includes('q3') || lower.includes('cn3')) return 3;
  return 1;
};

const resolveProductIdBySku = (sku?: string): number => {
  if (!sku) return 1;
  const products = useInventoryStore.getState().products;
  const p = products.find(prod => prod.sku === sku);
  return p ? Number(p.id) : 1;
};

const resolveProductUnitIdBySku = (sku?: string): number | undefined => {
  if (!sku) return undefined;
  const products = useInventoryStore.getState().products;
  const p = products.find(prod => prod.sku === sku);
  if (!p || !p.units?.length) return undefined;
  const base = p.units.find(u => u.isBaseUnit) ?? p.units.find(u => u.conversionRate === 1) ?? p.units[0];
  return base ? Number(base.id) : undefined;
};

export const logisticsService = {
  // --- Price Lists ---
  async fetchPriceLists(): Promise<PriceListSchedule[]> {
    const res = await axiosClient.get<any, any[]>('/catalog/price-lists');
    const rawList = Array.isArray(res) ? res : (res?.content || []);
    return rawList.map((p: any) => ({
      id: String(p.id),
      listCode: p.listCode || '',
      listName: p.listName || '',
      currency: 'VND' as const,
      pricingTier: 'RETAIL_DEFAULT' as const,
      effectiveDate: p.startDate ? p.startDate.split('T')[0] : '',
      expirationDate: p.endDate ? p.endDate.split('T')[0] : undefined,
      markupPercentage: 0,
      status: (p.isActive ? 'ACTIVE' : 'EXPIRED') as 'ACTIVE' | 'EXPIRED',
      applicableBranches: p.branchName || 'Tất cả chi nhánh',
      notes: '',
      details: p.details ? p.details.map((d: any) => ({
        id: String(d.id),
        sku: d.productCode || '',
        productName: d.productName || '',
        basePrice: Number(d.price || 0),
        overridePrice: Number(d.price || 0),
        productUnitId: d.productUnitId ? String(d.productUnitId) : undefined,
        unitName: d.unitName || '',
      })) : [],
    }));
  },

  async addPriceList(list: Omit<PriceListSchedule, 'id'>): Promise<PriceListSchedule> {
    const payload = {
      listCode: list.listCode,
      listName: list.listName,
      startDate: list.effectiveDate ? `${list.effectiveDate}T00:00:00` : undefined,
      endDate: list.expirationDate ? `${list.expirationDate}T00:00:00` : undefined,
      branchId: resolveBranchId(list.applicableBranches),
      isActive: list.status === 'ACTIVE',
      details: list.details?.map(d => ({
        productId: resolveProductIdBySku(d.sku),
        productUnitId: d.productUnitId ? Number(d.productUnitId) : resolveProductUnitIdBySku(d.sku),
        price: d.overridePrice,
      })) || [],
    };
    const res = await axiosClient.post<any, any>('/catalog/price-lists', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...list,
      ...(item || {}),
    };
  },

  async updatePriceList(id: string, data: Partial<PriceListSchedule>): Promise<Partial<PriceListSchedule>> {
    const payload = {
      listCode: data.listCode,
      listName: data.listName,
      startDate: data.effectiveDate ? `${data.effectiveDate}T00:00:00` : undefined,
      endDate: data.expirationDate ? `${data.expirationDate}T00:00:00` : undefined,
      branchId: data.applicableBranches ? resolveBranchId(data.applicableBranches) : undefined,
      isActive: data.status === undefined ? undefined : data.status === 'ACTIVE',
      details: data.details?.map(d => ({
        productId: resolveProductIdBySku(d.sku),
        productUnitId: d.productUnitId ? Number(d.productUnitId) : resolveProductUnitIdBySku(d.sku),
        price: d.overridePrice,
      })) || [],
    };
    const res = await axiosClient.put<any, any>(`/catalog/price-lists/${id}`, payload);
    return res?.data || res || data;
  },

  async deletePriceList(id: string): Promise<void> {
    await axiosClient.delete(`/catalog/price-lists/${id}`);
  },

  // --- Promotions ---
  async fetchPromotions(): Promise<PromotionRecord[]> {
    const res = await axiosClient.get<any, any>('/logistics/promotions');
    const data = res.content || res || [];
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      id: String(item.id),
      promoCode: item.promoCode || item.code || '',
      promoName: item.promoName || item.name || '',
      discountType: item.discountType || 'PERCENT',
      discountValue: Number(item.discountValue || 0),
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      status: item.status || 'ACTIVE',
    }));
  },

  async addPromotion(item: Omit<PromotionRecord, 'id'>): Promise<PromotionRecord> {
    const res = await axiosClient.post<any, any>('/logistics/promotions', item);
    const result = res?.data || res;
    return {
      id: String(result?.id || Date.now()),
      ...item,
      ...(result || {}),
    };
  },

  async updatePromotion(id: string, data: Partial<PromotionRecord>): Promise<Partial<PromotionRecord>> {
    const res = await axiosClient.put<any, any>(`/logistics/promotions/${id}`, data);
    return res?.data || res || data;
  },

  async deletePromotion(id: string): Promise<void> {
    await axiosClient.delete(`/logistics/promotions/${id}`);
  },

  // --- Shipping Charges ---
  async fetchShippingCharges(): Promise<ShippingChargeRecord[]> {
    const res = await axiosClient.get<any, any>('/logistics/shipping-charges');
    const data = res.content || res || [];
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      id: String(item.id),
      zoneCode: item.zoneCode || '',
      zoneName: item.zoneName || '',
      carrierName: item.carrierName || '',
      baseFee: Number(item.baseFee || 0),
      perKgFee: Number(item.perKgFee || 0),
      estimatedHours: Number(item.estimatedHours || 24),
      status: item.status || 'ACTIVE',
    }));
  },

  async addShippingCharge(item: Omit<ShippingChargeRecord, 'id'>): Promise<ShippingChargeRecord> {
    const res = await axiosClient.post<any, any>('/logistics/shipping-charges', item);
    const result = res?.data || res;
    return {
      id: String(result?.id || Date.now()),
      ...item,
      ...(result || {}),
    };
  },

  async updateShippingCharge(id: string, data: Partial<ShippingChargeRecord>): Promise<Partial<ShippingChargeRecord>> {
    const res = await axiosClient.put<any, any>(`/logistics/shipping-charges/${id}`, data);
    return res?.data || res || data;
  },

  async deleteShippingCharge(id: string): Promise<void> {
    await axiosClient.delete(`/logistics/shipping-charges/${id}`);
  },
};
