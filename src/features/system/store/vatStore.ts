import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface VatRuleRecord {
  id: string;
  taxCode: string; // e.g. "VAT-STD-10"
  taxTitle: string;
  ratePercentage: number;
  countryScope: string;
  jurisdiction: 'NATIONAL_FEDERAL' | 'STATE_PROVINCIAL' | 'MUNICIPAL_LOCAL' | 'SPECIAL_ECONOMIC_ZONE';
  effectiveDate: string;
  expirationDate?: string;
  isCompoundTax: boolean;
  status: 'ACTIVE' | 'PENDING_ENACTMENT' | 'ARCHIVED_EXPIRED';
  glAccountBinding: string;
  exemptionNotes?: string;
}



interface VatStore {
  vatRules: VatRuleRecord[];
  fetchVatRules: () => Promise<void>;
  addVatRule: (rule: Omit<VatRuleRecord, 'id'>) => Promise<void>;
  updateVatRule: (rule: VatRuleRecord) => Promise<void>;
  deleteVatRule: (id: string) => Promise<void>;
}

export const useVatStore = create<VatStore>()(
  persist(
    (set, get) => ({
      vatRules: [],

      fetchVatRules: async () => {
        try {
          const res = await axiosClient.get<any, any>('/system/vat');
          const data = res.content || res || [];
          if (Array.isArray(data) && data.length > 0) {
            set({ vatRules: data.map((item: any) => ({
              id: String(item.id),
              taxCode: item.taxCode || '',
              taxTitle: item.taxTitle || '',
              ratePercentage: Number(item.ratePercentage || 0),
              countryScope: item.countryScope || 'Việt Nam (VND)',
              jurisdiction: item.jurisdiction || 'NATIONAL_FEDERAL',
              effectiveDate: item.effectiveDate ? item.effectiveDate.split('T')[0] : '',
              expirationDate: item.expirationDate ? item.expirationDate.split('T')[0] : undefined,
              isCompoundTax: Boolean(item.isCompoundTax),
              status: item.status || 'ACTIVE',
              glAccountBinding: item.glAccountBinding || '',
              exemptionNotes: item.exemptionNotes || '',
            })) });
          }
        } catch (e) {
          console.error('Failed to fetch VAT rules:', e);
        }
      },

      addVatRule: async (newRule) => {
        try { await axiosClient.post('/system/vat', newRule); } catch (e) { console.error(e); }
        set((state) => ({
          vatRules: [...state.vatRules, {
            ...newRule,
            id: `vat_${Date.now()}`
          }]
        }));
      },
      updateVatRule: async (updatedRule) => {
        try { await axiosClient.put(`/system/vat/${updatedRule.id}`, updatedRule); } catch (e) { console.error(e); }
        set((state) => ({
          vatRules: state.vatRules.map((r) => r.id === updatedRule.id ? updatedRule : r)
        }));
      },
      deleteVatRule: async (id) => {
        try { await axiosClient.delete(`/system/vat/${id}`); } catch (e) { console.error(e); }
        set((state) => ({
          vatRules: state.vatRules.filter((r) => r.id !== id)
        }));
      }
    }),
    {
      name: 'retailhub-vat-config',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
