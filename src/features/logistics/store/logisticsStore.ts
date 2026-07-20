import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';
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
  details: PriceListDetail[]; // Specifically overridden SKUs for this list
}

// ---------------------------
// STATE INTERFACE
// ---------------------------
interface LogisticsState {
  priceLists: PriceListSchedule[];
  
  fetchPriceLists: () => Promise<void>;
  // PriceList Actions
  addPriceList: (list: Omit<PriceListSchedule, 'id'>) => Promise<void>;
  updatePriceList: (id: string, data: Partial<PriceListSchedule>) => Promise<void>;
  deletePriceList: (id: string) => Promise<void>;
}

export const useLogisticsStore = create<LogisticsState>()(
  persist(
    (set, get) => ({
      priceLists: [],

      fetchPriceLists: async () => {
        try {
           const res = await axiosClient.get<any, any[]>('/catalog/price-lists');
          const mapped = res.map((p: any) => ({
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
          set({ priceLists: mapped });
        } catch (error) {
          console.error('Failed to fetch price lists:', error);
        }
      },
      addPriceList: async (list) => {
        try {
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
          await axiosClient.post('/catalog/price-lists', payload);
          await get().fetchPriceLists();
        } catch (error) {
          console.error('Failed to add price list:', error);
        }
      },
      updatePriceList: async (id, data) => {
        try {
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
          await axiosClient.put(`/catalog/price-lists/${id}`, payload);
          await get().fetchPriceLists();
        } catch (error) {
          console.error('Failed to update price list:', error);
        }
      },
      deletePriceList: async (id) => {
        try {
          await axiosClient.delete(`/catalog/price-lists/${id}`);
          await get().fetchPriceLists();
        } catch (error) {
          console.error('Failed to delete price list:', error);
        }
      },
    }),
    {
      name: 'retailhub-logistics-storage',
    }
  )
);
