import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  addVatRule: (rule: Omit<VatRuleRecord, 'id'>) => void;
  updateVatRule: (rule: VatRuleRecord) => void;
  deleteVatRule: (id: string) => void;
}

export const useVatStore = create<VatStore>()(
  persist(
    (set) => ({
      vatRules: DEFAULT_VAT_CONFIGS,
      addVatRule: (newRule) => set((state) => ({
        vatRules: [...state.vatRules, {
          ...newRule,
          id: `vat_${Date.now()}`
        }]
      })),
      updateVatRule: (updatedRule) => set((state) => ({
        vatRules: state.vatRules.map((r) => r.id === updatedRule.id ? updatedRule : r)
      })),
      deleteVatRule: (id) => set((state) => ({
        vatRules: state.vatRules.filter((r) => r.id !== id)
      }))
    }),
    {
      name: 'retailhub-vat-config',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
