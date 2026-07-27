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
}

interface PosConfigState {
  paymentMethods: PaymentMethodRecord[];
  
  // Actions
  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (method: Omit<PaymentMethodRecord, 'id'>) => Promise<void>;
  updatePaymentMethod: (id: string, data: Partial<PaymentMethodRecord>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
}

export const usePosConfigStore = create<PosConfigState>()(
  persist(
    (set, get) => ({
      paymentMethods: [],

      fetchPaymentMethods: async () => {
        try {
          const response = await axiosClient.get<any, any[]>('/finance/payment-methods');
          set({ paymentMethods: response });
        } catch (error) {
          console.error('Failed to fetch payment methods:', error);
        }
      },

      addPaymentMethod: async (method) => {
        try {
          await axiosClient.post('/finance/payment-methods', method);
          await get().fetchPaymentMethods();
        } catch (error) {
          console.error('Fallback: Failed to add payment method via API, using local state', error);
          set((state) => ({
            paymentMethods: [{ id: Date.now().toString(), ...method } as PaymentMethodRecord, ...state.paymentMethods],
          }));
        }
      },

      updatePaymentMethod: async (id, data) => {
        try {
          await axiosClient.put(`/finance/payment-methods/${id}`, data);
          await get().fetchPaymentMethods();
        } catch (error) {
          console.error('Fallback: Failed to update payment method via API, using local state', error);
          set((state) => ({
            paymentMethods: state.paymentMethods.map((m) =>
              m.id === id ? { ...m, ...data } : m
            ),
          }));
        }
      },

      deletePaymentMethod: async (id) => {
        try {
          await axiosClient.delete(`/finance/payment-methods/${id}`);
          await get().fetchPaymentMethods();
        } catch (error) {
          console.error('Fallback: Failed to delete payment method via API, using local state', error);
          set((state) => ({
            paymentMethods: state.paymentMethods.filter((m) => m.id !== id),
          }));
        }
      },
    }),
    {
      name: 'retailhub-pos-config-storage',
    }
  )
);
