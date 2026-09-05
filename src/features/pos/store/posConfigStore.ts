import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface PaymentMethodRecord {
  id: string;
  methodCode: string;
  methodName: string;
  providerType: 'CREDIT_CARD_GATEWAY' | 'QR_EWALLET' | 'BANK_TRANSFER_QR' | 'CASH_DRAWER' | 'BUY_NOW_PAY_LATER';
  processingFeePct: number;
  fixedFeeUsd: number;
  settlementTime: 'INSTANT' | 'SAME_DAY_BATCH' | 'T_PLUS_1_BUSINESS_DAY' | 'T_PLUS_3_BUSINESS_DAYS';
  totalVolumeUsd: number;
  supportedCurrencies: string[];
  status: 'ACTIVE' | 'TESTING_MODE' | 'MAINTENANCE' | 'DISABLED';
  configuredGateways: string;
  feeType?: 'PERCENT' | 'FIXED';
  feeValue?: number;
  sortOrder?: number;
  logoUrl?: string;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
  merchantId?: string;
  apiKey?: string;
  secretKey?: string;
  checksumKey?: string;
  allowPos?: boolean;
  allowOnline?: boolean;
  currency?: string;
  transferSyntax?: string;
  branchIds?: string[];
  applyToAllBranches?: boolean;
  ytdTotal?: number;
}

interface PosConfigState {
  paymentMethods: PaymentMethodRecord[];
  enableOfflineMode: boolean;

  // Actions
  setEnableOfflineMode: (enabled: boolean) => void;
  clearLocalOfflineDeductions: () => void;
  fetchPaymentMethods: (branchId?: string | number) => Promise<void>;
  addPaymentMethod: (method: Omit<PaymentMethodRecord, 'id'>) => Promise<void>;
  updatePaymentMethod: (id: string, data: Partial<PaymentMethodRecord>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
}

export const usePosConfigStore = create<PosConfigState>()(
  persist(
    (set, get) => ({
      paymentMethods: [],
      enableOfflineMode: false,

      setEnableOfflineMode: (enabled: boolean) => {
        set({ enableOfflineMode: enabled });
        if (!enabled) {
          try {
            localStorage.removeItem('retailhub_pos_stock_deductions');
          } catch {}
        }
      },

      clearLocalOfflineDeductions: () => {
        try {
          localStorage.removeItem('retailhub_pos_stock_deductions');
        } catch {}
      },

      fetchPaymentMethods: async (branchId?: string | number) => {
        try {
          const url = branchId ? `/payment-methods?branchId=${branchId}` : '/payment-methods';
          const response: any = await axiosClient.get<any, any>(url);
          const list: any[] = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : (response?.content || []));
          if (list.length > 0) {
            set({ paymentMethods: list });
          }
        } catch (error) {
          console.error('Failed to fetch payment methods:', error);
        }
      },

      addPaymentMethod: async (method) => {
        const localItem = { id: Date.now().toString(), ...method } as PaymentMethodRecord;
        set((state) => ({
          paymentMethods: [localItem, ...state.paymentMethods],
        }));
        try {
          const res: any = await axiosClient.post('/payment-methods', method);
          const saved = res?.data || res;
          if (saved && saved.id) {
            set((state) => ({
              paymentMethods: state.paymentMethods.map(p => p.id === localItem.id ? { ...p, ...saved, id: String(saved.id) } : p)
            }));
          }
          await get().fetchPaymentMethods();
        } catch (error) {
          console.warn('API sync failed, using persisted local storage for payment methods', error);
        }
      },

      updatePaymentMethod: async (id, data) => {
        set((state) => ({
          paymentMethods: state.paymentMethods.map((m) =>
            m.id === id ? { ...m, ...data } : m
          ),
        }));
        try {
          await axiosClient.put(`/payment-methods/${id}`, data);
          await get().fetchPaymentMethods();
        } catch (error) {
          console.warn('API sync failed, updated locally', error);
        }
      },

      deletePaymentMethod: async (id) => {
        set((state) => ({
          paymentMethods: state.paymentMethods.filter((m) => m.id !== id),
        }));
        try {
          await axiosClient.delete(`/payment-methods/${id}`);
        } catch (error) {
          console.warn('API sync failed, deleted locally', error);
        }
      },
    }),
    {
      name: 'retailhub-pos-config-storage',
    }
  )
);
