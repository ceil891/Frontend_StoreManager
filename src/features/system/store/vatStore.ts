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

const DEFAULT_VAT_CONFIGS: VatRuleRecord[] = [
  { 
    id: '1', 
    taxCode: 'VAT-STD-10', 
    taxTitle: 'Thuế giá trị gia tăng tiêu chuẩn Việt Nam', 
    ratePercentage: 10.0, 
    countryScope: 'Việt Nam (VND)', 
    jurisdiction: 'NATIONAL_FEDERAL', 
    effectiveDate: '2023-01-01', 
    isCompoundTax: false, 
    status: 'ACTIVE', 
    glAccountBinding: 'GL-2311-VAT-OUTPUT', 
    exemptionNotes: 'Thuế giá trị gia tăng đầu ra tiêu chuẩn áp dụng cho tất cả các sản phẩm bán lẻ phổ thông.' 
  },
  { 
    id: '2', 
    taxCode: 'VAT-RED-08', 
    taxTitle: 'Thuế VAT ưu đãi kích thích kinh tế (Nghị quyết 44)', 
    ratePercentage: 8.0, 
    countryScope: 'Việt Nam (VND)', 
    jurisdiction: 'NATIONAL_FEDERAL', 
    effectiveDate: '2023-07-01', 
    expirationDate: '2024-12-31', 
    isCompoundTax: false, 
    status: 'ACTIVE', 
    glAccountBinding: 'GL-2312-VAT-REDUCED', 
    exemptionNotes: 'Chương trình giảm thuế VAT 2% kích cầu tiêu dùng của Chính phủ Việt Nam theo Nghị định 44/2023/NĐ-CP.' 
  },
  { 
    id: '3', 
    taxCode: 'TAX-US-NY-8875', 
    taxTitle: 'Thuế bán hàng NYC & New York State kết hợp', 
    ratePercentage: 8.875, 
    countryScope: 'Hoa Kỳ (USD)', 
    jurisdiction: 'STATE_PROVINCIAL', 
    effectiveDate: '2021-04-01', 
    isCompoundTax: true, 
    status: 'ACTIVE', 
    glAccountBinding: 'GL-2320-US-SALESTAX', 
    exemptionNotes: 'Gồm thuế bang NY 4.0% + thuế thành phố NYC 4.5% + khu vực tàu điện ngầm 0.375%.' 
  },
  { 
    id: '4', 
    taxCode: 'VAT-ZERO-EXP', 
    taxTitle: 'Thuế suất 0% áp dụng cho xuất khẩu thương mại', 
    ratePercentage: 0.0, 
    countryScope: 'Toàn cầu (Cross-Border)', 
    jurisdiction: 'NATIONAL_FEDERAL', 
    effectiveDate: '2018-01-01', 
    isCompoundTax: false, 
    status: 'ACTIVE', 
    glAccountBinding: 'GL-2310-VAT-ZERO', 
    exemptionNotes: 'Áp dụng nghiêm ngặt cho hóa đơn xuất khẩu có kèm tờ khai hải quan được xác minh.' 
  },
  { 
    id: '5', 
    taxCode: 'TAX-LUX-GOODS-30', 
    taxTitle: 'Thuế tiêu thụ đặc biệt hàng xa xỉ phẩm', 
    ratePercentage: 30.0, 
    countryScope: 'Việt Nam (VND)', 
    jurisdiction: 'NATIONAL_FEDERAL', 
    effectiveDate: '2020-01-01', 
    isCompoundTax: true, 
    status: 'ARCHIVED_EXPIRED', 
    glAccountBinding: 'GL-2350-EXCISE-TAX', 
    exemptionNotes: 'Đã hết hạn thi hành và được thay thế bằng biểu thuế sửa đổi mới. Giữ lại để đối chiếu sổ sách lịch sử.' 
  },
];

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
