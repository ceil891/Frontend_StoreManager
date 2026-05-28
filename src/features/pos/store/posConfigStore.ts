import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addPaymentMethod: (method: Omit<PaymentMethodRecord, 'id'>) => void;
  updatePaymentMethod: (id: string, data: Partial<PaymentMethodRecord>) => void;
  deletePaymentMethod: (id: string) => void;
}

const MOCK_PAYMENT_METHODS: PaymentMethodRecord[] = [
  { id: '1', methodCode: 'PM-CARD-STRIPE', methodName: 'Stripe Terminal & Online Gateway', providerType: 'CREDIT_CARD_GATEWAY', processingFeePct: 2.5, fixedFeeUsd: 0.30, settlementTime: 'T_PLUS_1_BUSINESS_DAY', totalVolumeUsd: 3450800.00, supportedCurrencies: ['USD', 'EUR', 'GBP'], status: 'ACTIVE', configuredGateways: 'Stripe API v2023-10 / BBPOS WisePOS E Sleds' },
  { id: '2', methodCode: 'PM-EWALLET-APL', methodName: 'Apple Pay & Google Pay Contactless', providerType: 'QR_EWALLET', processingFeePct: 1.8, fixedFeeUsd: 0.15, settlementTime: 'SAME_DAY_BATCH', totalVolumeUsd: 1820400.00, supportedCurrencies: ['USD', 'EUR'], status: 'ACTIVE', configuredGateways: 'Adyen Omnichannel Payment Engine' },
  { id: '3', methodCode: 'PM-QR-VIETQR', methodName: 'VietQR Dynamic Banking Transfer', providerType: 'BANK_TRANSFER_QR', processingFeePct: 0.0, fixedFeeUsd: 0.00, settlementTime: 'INSTANT', totalVolumeUsd: 840000.00, supportedCurrencies: ['VND', 'USD'], status: 'ACTIVE', configuredGateways: 'Napas 247 Instant Interbank Clearing' },
  { id: '4', methodCode: 'PM-CASH-USD', methodName: 'Physical Cash Drawer Deposit', providerType: 'CASH_DRAWER', processingFeePct: 0.0, fixedFeeUsd: 0.00, settlementTime: 'INSTANT', totalVolumeUsd: 420500.00, supportedCurrencies: ['USD'], status: 'ACTIVE', configuredGateways: 'Local Store Smart Safe Vault' },
  { id: '5', methodCode: 'PM-BNPL-KLARNA', methodName: 'Klarna 4-Installments Checkout', providerType: 'BUY_NOW_PAY_LATER', processingFeePct: 5.9, fixedFeeUsd: 0.50, settlementTime: 'T_PLUS_3_BUSINESS_DAYS', totalVolumeUsd: 150000.00, supportedCurrencies: ['USD', 'EUR'], status: 'TESTING_MODE', configuredGateways: 'Klarna Enterprise Checkout SDK' },
];

export const usePosConfigStore = create<PosConfigState>()(
  persist(
    (set) => ({
      paymentMethods: MOCK_PAYMENT_METHODS,

      addPaymentMethod: (method) =>
        set((state) => ({
          paymentMethods: [{ id: Date.now().toString(), ...method }, ...state.paymentMethods],
        })),

      updatePaymentMethod: (id, data) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.map((m) =>
            m.id === id ? { ...m, ...data } : m
          ),
        })),

      deletePaymentMethod: (id) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.filter((m) => m.id !== id),
        })),
    }),
    {
      name: 'retailhub-pos-config-storage',
    }
  )
);
