import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------
// TYPES: PRICE LISTS
// ---------------------------
export interface PriceListDetail {
  id: string;
  sku: string;           // Target Product SKU
  productName: string;
  basePrice: number;     // Reference retail base price
  overridePrice: number; // The new target price in this matrix
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
  
  // PriceList Actions
  addPriceList: (list: Omit<PriceListSchedule, 'id'>) => void;
  updatePriceList: (id: string, data: Partial<PriceListSchedule>) => void;
  deletePriceList: (id: string) => void;
}

// ---------------------------
// MOCK DATA SEED
// ---------------------------
const MOCK_PRICE_LISTS: PriceListSchedule[] = [
  { 
    id: '1', 
    listCode: 'PL-2024-STD', 
    listName: 'Standard Omnichannel Retail Master', 
    currency: 'USD', 
    pricingTier: 'RETAIL_DEFAULT', 
    effectiveDate: '2024-01-01', 
    markupPercentage: 45.0, 
    status: 'ACTIVE', 
    applicableBranches: 'All Corporate Stores & Webstore', 
    notes: 'Master base retail pricing matrix. Indexed against standard supplier intake landed costs.',
    details: [
      { id: 'd1', sku: 'NK-AM24', productName: 'Nike Air Max 2024', basePrice: 129.99, overridePrice: 119.99 }
    ]
  },
  { 
    id: '2', 
    listCode: 'PL-2024-WHS', 
    listName: 'Wholesale Key Accounts Matrix (B2B)', 
    currency: 'USD', 
    pricingTier: 'WHOLESALE_TIER1', 
    effectiveDate: '2024-01-15', 
    expirationDate: '2024-12-31', 
    markupPercentage: 20.0, 
    status: 'ACTIVE', 
    applicableBranches: 'Regional Warehouses & B2B Portal', 
    notes: 'Applies automatically to authenticated Gold and Diamond commercial contractor accounts.',
    details: [
      { id: 'd2', sku: 'NK-AM24', productName: 'Nike Air Max 2024', basePrice: 129.99, overridePrice: 95.00 },
      { id: 'd3', sku: 'SS-S24', productName: 'Samsung Galaxy S24', basePrice: 899.00, overridePrice: 799.00 }
    ]
  },
];

export const useLogisticsStore = create<LogisticsState>()(
  persist(
    (set) => ({
      priceLists: MOCK_PRICE_LISTS,

      // Price List Actions
      addPriceList: (list) => set((state) => ({ priceLists: [{ id: Date.now().toString(), ...list }, ...state.priceLists] })),
      updatePriceList: (id, data) => set((state) => ({ priceLists: state.priceLists.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
      deletePriceList: (id) => set((state) => ({ priceLists: state.priceLists.filter((p) => p.id !== id) })),
    }),
    {
      name: 'retailhub-logistics-storage',
    }
  )
);
