import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ReceiptVoucher {
  id: string;
  voucherNumber: string;
  payerName: string;
  category: 'SALES_REVENUE' | 'DEBT_COLLECTION' | 'INVESTMENT' | 'OTHER';
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD';
  receivedDate: string;
  referenceDoc?: string;
  cashier: string;
  branchId: string;
  notes?: string;
  receivingAccount?: string;
  payerContact?: string;
  attachments?: string[];
}

export interface PaymentVoucher {
  id: string;
  voucherNumber: string;
  payeeName: string;
  category: 'SUPPLIER_PAYMENT' | 'UTILITIES' | 'PAYROLL' | 'TAXES' | 'LOGISTICS';
  amount: number;
  paymentMethod: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH';
  paymentDate: string;
  bankAccountRef: string;
  approver: string;
  branchId: string;
  notes?: string;
  status: 'COMPLETED' | 'PENDING_APPROVAL' | 'REJECTED';
  payeeBankAccount?: string;
  attachments?: string[];
  creator?: string;
}

export interface DebtRecord {
  id: string;
  debtCode: string;
  entityName: string;
  entityType: 'CUSTOMER' | 'SUPPLIER' | 'PARTNER';
  totalDebt: number;
  dueAmount: number;
  dueDate: string;
  status: 'NORMAL' | 'DUE_SOON' | 'OVERDUE' | 'SETTLED';
  lastPaymentDate?: string;
  accountManager: string;
  branchId: string;
  notes?: string;
  referenceDoc?: string;
  incurredDate?: string;
  paidAmount?: number;
  currency?: string;
}

export interface OperatingCost {
  id: string;
  costCode: string;
  costName: string;
  category: 'RENTAL' | 'UTILITIES' | 'SALARY' | 'MARKETING' | 'MAINTENANCE' | 'INSURANCE' | 'SUPPLIES';
  amount: number;
  incurredDate: string;
  branch: string;
  branchId: string;
  paymentStatus: 'PAID' | 'SCHEDULED' | 'PENDING' | 'OVERDUE';
  assignedBudget: string;
  authorizedBy: string;
  description?: string;
}

export interface CorporateBankAccount {
  id: string;
  accountName?: string;
  accountNumber?: string;
  accountNumberMasked: string;
  bankName: string;
  branchName: string;
  swiftBic: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'VND';
  currentBalance: number;
  availableWorkingCapital: number;
  accountType: 'PRIMARY_OPERATING' | 'PAYROLL_DISBURSEMENT' | 'MERCHANT_SETTLEMENT' | 'ESCROW_RESERVE';
  status: 'ACTIVE' | 'RESTRICTED' | 'CLOSING' | 'AUDIT_HOLD';
  openedDate: string;
  authorizedSignatories: string[];
  notes?: string;
  lastReconciledDate?: string;
  overdraftLimit?: number;
  bankCountry?: string;
  updatedBy?: string;
}

export interface TransactionReasonRecord {
  id: string;
  reasonCode: string;
  reasonName: string;
  category: 'OPERATING_REVENUE' | 'COST_OF_GOODS' | 'PAYROLL_EXPENSE' | 'CAPEX_EQUIPMENT' | 'TAX_VAT_SETTLEMENT' | 'INTEREST_FEES';
  accountingGLCode: string;
  cashFlowImpact: 'INFLOW_DEBIT' | 'OUTFLOW_CREDIT' | 'NEUTRAL_TRANSFER';
  isTaxDeductible: boolean;
  requiresReceiptUpload: boolean;
  totalLoggedVolumeUsd: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'REQUIRES_CFO_REVIEW';
  applicableDepartments: string;
  description?: string;
  defaultOffsetGLCode?: string;
  budgetLimit?: number;
  isBudgetTracked?: boolean;
}

export type JournalStatus = 'DRAFT' | 'POSTED';

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  entityId?: string;
  costCenter?: string;
  currency?: string;
  exchangeRate?: number;
  originalAmount?: number;
}

export interface JournalEntry {
  id: string;
  code: string;
  date: string;
  description: string;
  reference: string;
  status: JournalStatus;
  branchId: string;
  lines: JournalLine[];
}

import { axiosClient } from '@/shared/lib/axiosClient';

interface FinanceState {
  receipts: ReceiptVoucher[];
  payments: PaymentVoucher[];
  debts: DebtRecord[];
  operatingCosts: OperatingCost[];
  bankAccounts: CorporateBankAccount[];
  transactionReasons: TransactionReasonRecord[];
  journalEntries: JournalEntry[];

  fetchReceipts: () => Promise<void>;
  fetchPayments: () => Promise<void>;
  fetchDebts: () => Promise<void>;
  fetchOperatingCosts: () => Promise<void>;
  fetchBankAccounts: () => Promise<void>;
  fetchTransactionReasons: () => Promise<void>;
  fetchJournalEntries: () => Promise<void>;

  addReceipt: (row: Omit<ReceiptVoucher, 'id'>) => Promise<void>;
  updateReceipt: (id: string, data: Partial<ReceiptVoucher>) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;

  addPayment: (row: Omit<PaymentVoucher, 'id'>) => Promise<void>;
  updatePayment: (id: string, data: Partial<PaymentVoucher>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  addDebt: (row: Omit<DebtRecord, 'id'>) => Promise<void>;
  updateDebt: (id: string, data: Partial<DebtRecord>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;

  addOperatingCost: (row: Omit<OperatingCost, 'id'>) => Promise<void>;
  updateOperatingCost: (id: string, data: Partial<OperatingCost>) => Promise<void>;
  deleteOperatingCost: (id: string) => Promise<void>;

  addBankAccount: (row: Omit<CorporateBankAccount, 'id'>) => Promise<void>;
  updateBankAccount: (id: string, data: Partial<CorporateBankAccount>) => Promise<void>;
  deleteBankAccount: (id: string) => Promise<void>;

  addTransactionReason: (row: Omit<TransactionReasonRecord, 'id'>) => Promise<void>;
  updateTransactionReason: (id: string, data: Partial<TransactionReasonRecord>) => Promise<void>;
  deleteTransactionReason: (id: string) => Promise<void>;

  updateJournalEntry: (id: string, data: Partial<JournalEntry>) => Promise<void>;
  addJournalEntry: (row: Omit<JournalEntry, 'id'>) => Promise<void>;

  fixedAssets: FixedAssetRecord[];
  depreciations: DepreciationRecord[];
  fundBalances: FundBalanceRecord[];
  taxDuties: TaxDutyRecord[];

  fetchFixedAssets: () => Promise<void>;
  addFixedAsset: (item: Omit<FixedAssetRecord, 'id'>) => Promise<void>;
  updateFixedAsset: (id: string, data: Partial<FixedAssetRecord>) => Promise<void>;
  deleteFixedAsset: (id: string) => Promise<void>;

  fetchDepreciations: () => Promise<void>;
  fetchFundBalances: () => Promise<void>;
  fetchTaxDuties: () => Promise<void>;
}

export interface FixedAssetRecord {
  id: string;
  assetCode: string;
  assetName: string;
  category: string;
  originalValue: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  usefulLifeMonths: number;
  purchasedDate: string;
  status: 'ACTIVE' | 'DISPOSED' | 'FULLY_DEPRECIATED';
}

export interface DepreciationRecord {
  id: string;
  assetCode: string;
  assetName: string;
  depreciationMonth: string;
  monthlyAmount: number;
  accumulatedTotal: number;
}

export interface FundBalanceRecord {
  id: string;
  fundCode: string;
  fundName: string;
  accountNumber: string;
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'LOCKED';
}

export interface TaxDutyRecord {
  id: string;
  taxCode: string;
  taxName: string;
  taxRatePercent: number;
  taxPeriod: string;
  payableAmount: number;
  paidAmount: number;
  status: 'DUE' | 'PAID' | 'OVERDUE';
}

const defaultFinance = {
  receipts: [],
  payments: [],
  debts: [],
  operatingCosts: [],
  bankAccounts: [],
  transactionReasons: [],
  journalEntries: [],
};

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      ...defaultFinance,

      fetchReceipts: async () => {
        try {
          const res = await axiosClient.get<any, any>('/finance/receipt-vouchers');
          const data = res.content || res || [];
          set({ receipts: Array.isArray(data) ? data.map((item: any) => ({
            id: String(item.id),
            voucherNumber: item.voucherNumber || `REC-${item.id}`,
            payerName: item.payerName || '',
            category: item.category || 'SALES_REVENUE',
            amount: Number(item.amount || 0),
            paymentMethod: item.paymentMethod || 'CASH',
            receivedDate: item.receivedDate ? item.receivedDate.split('T')[0] : '',
            referenceDoc: item.referenceDoc || '',
            cashier: item.cashier || '',
            branchId: String(item.branchId || ''),
            notes: item.notes || '',
          })) : [] });
        } catch (e) {
          console.error('Failed to fetch receipts:', e);
          set({ receipts: [] });
        }
      },
      fetchPayments: async () => {
        try {
          const res = await axiosClient.get<any, any>('/finance/payment-vouchers');
          const data = res.content || res || [];
          set({ payments: Array.isArray(data) ? data.map((item: any) => ({
            id: String(item.id),
            voucherNumber: item.voucherNumber || `PAY-${item.id}`,
            payeeName: item.payeeName || '',
            category: item.category || 'SUPPLIER_PAYMENT',
            amount: Number(item.amount || 0),
            paymentMethod: item.paymentMethod || 'CASH',
            paymentDate: item.paymentDate ? item.paymentDate.split('T')[0] : '',
            bankAccountRef: item.bankAccountRef || '',
            approver: item.approver || '',
            branchId: String(item.branchId || ''),
            notes: item.notes || '',
            status: item.status || 'COMPLETED',
          })) : [] });
        } catch (e) {
          console.error('Failed to fetch payments:', e);
          set({ payments: [] });
        }
      },
      fetchDebts: async () => {
        try {
          const res = await axiosClient.get<any, any>('/finance/debt-ledgers');
          const data = res.content || res || [];
          set({ debts: Array.isArray(data) ? data.map((item: any) => ({
            id: String(item.id),
            debtCode: item.debtCode || `DBT-${item.id}`,
            entityName: item.entityName || '',
            entityType: item.entityType || 'CUSTOMER',
            totalDebt: Number(item.totalDebt || 0),
            dueAmount: Number(item.dueAmount || 0),
            dueDate: item.dueDate ? item.dueDate.split('T')[0] : '',
          })) as any : [] });
        } catch (e) {
          console.error('Failed to fetch debts:', e);
          set({ debts: [] });
        }
      },
      fetchOperatingCosts: async () => {
        try {
          const res = await axiosClient.get<any, any>('/finance/operating-costs');
          const data = res.content || res || [];
          set({ operatingCosts: Array.isArray(data) ? data.map((item: any) => ({
            id: String(item.id),
            costCode: item.costCode || `OPC-${item.id}`,
            costName: item.costName || '',
            category: item.category || 'RENTAL',
            amount: Number(item.amount || 0),
            incurredDate: item.incurredDate ? item.incurredDate.split('T')[0] : '',
            branch: item.branch || '',
            branchId: String(item.branchId || ''),
            paymentStatus: item.paymentStatus || 'PAID',
          })) as any : [] });
        } catch (e) {
          console.error('Failed to fetch operating costs:', e);
          set({ operatingCosts: [] });
        }
      },
      fetchBankAccounts: async () => {
        try {
          const res = await axiosClient.get<any, any>('/finance/bank-accounts');
          const data = res.content || res || [];
          set({ bankAccounts: Array.isArray(data) ? data.map((item: any) => ({
            id: String(item.id),
            accountName: item.accountHolder || '',
            accountNumber: item.accountNumber || '',
            accountNumberMasked: item.accountNumber ? `•••• •••• ${item.accountNumber.slice(-4)}` : '',
            bankName: item.bankName || '',
            branchName: item.branchName || '',
            currency: 'VND',
            currentBalance: 100000000,
            availableWorkingCapital: 100000000,
            accountType: 'PRIMARY_OPERATING',
            status: 'ACTIVE',
          })) as any : [] });
        } catch (e) {
          console.error('Failed to fetch bank accounts:', e);
          set({ bankAccounts: [] });
        }
      },
      fetchTransactionReasons: async () => {
        try {
          const res = await axiosClient.get<any, any>('/finance/transaction-reasons');
          const data = res.content || res || [];
          set({ transactionReasons: Array.isArray(data) ? data.map((item: any) => ({
            id: String(item.id),
            reasonCode: item.reasonCode || `RSN-${item.id}`,
            reasonName: item.reasonName || '',
            category: item.category || 'OPERATING_REVENUE',
            status: 'ACTIVE',
          })) as any : [] });
        } catch (e) {
          console.error('Failed to fetch transaction reasons:', e);
          set({ transactionReasons: [] });
        }
      },
      fetchJournalEntries: async () => {
        try {
          const res = await axiosClient.get<any, any>('/accounting/journal-entries');
          const data = (res as any).content || res || [];
          set({ journalEntries: Array.isArray(data) ? data.map((item: any) => ({
            id: String(item.id),
            code: item.code || `JE-${item.id}`,
            date: item.date ? item.date.split('T')[0] : '',
            description: item.description || '',
            reference: item.reference || '',
            status: item.status || 'DRAFT',
            branchId: String(item.branchId || ''),
            lines: [],
          })) : [] });
        } catch (e) {
          console.error('Failed to fetch journal entries:', e);
          set({ journalEntries: [] });
        }
      },

      addReceipt: async (row) => {
        try { 
          await axiosClient.post('/finance/receipt-vouchers', row);
          await get().fetchReceipts();
        } catch (e) { console.error(e); }
      },
      updateReceipt: async (id, data) => {
        try { 
          await axiosClient.put(`/finance/receipt-vouchers/${id}`, data);
          await get().fetchReceipts();
        } catch (e) { console.error(e); }
      },
      deleteReceipt: async (id) => {
        try { 
          await axiosClient.delete(`/finance/receipt-vouchers/${id}`);
          await get().fetchReceipts();
        } catch (e) { console.error(e); }
      },

      addPayment: async (row) => {
        try { 
          await axiosClient.post('/finance/payment-vouchers', row);
          await get().fetchPayments();
        } catch (e) { console.error(e); }
      },
      updatePayment: async (id, data) => {
        try { 
          await axiosClient.put(`/finance/payment-vouchers/${id}`, data);
          await get().fetchPayments();
        } catch (e) { console.error(e); }
      },
      deletePayment: async (id) => {
        try { 
          await axiosClient.delete(`/finance/payment-vouchers/${id}`);
          await get().fetchPayments();
        } catch (e) { console.error(e); }
      },

      addDebt: async (row) => {
        try {
          await axiosClient.post('/finance/debt-ledgers', row);
          await get().fetchDebts();
        } catch (e) { console.error(e); }
      },
      updateDebt: async (id, data) => {
        try {
          await axiosClient.put(`/finance/debt-ledgers/${id}`, data);
          await get().fetchDebts();
        } catch (e) { console.error(e); }
      },
      deleteDebt: async (id) => {
        try {
          await axiosClient.delete(`/finance/debt-ledgers/${id}`);
          await get().fetchDebts();
        } catch (e) { console.error(e); }
      },

      addOperatingCost: async (row) => {
        try { 
          await axiosClient.post('/finance/operating-costs', row);
          await get().fetchOperatingCosts();
        } catch (e) { console.error(e); }
      },
      updateOperatingCost: async (id, data) => {
        try { 
          await axiosClient.put(`/finance/operating-costs/${id}`, data);
          await get().fetchOperatingCosts();
        } catch (e) { console.error(e); }
      },
      deleteOperatingCost: async (id) => {
        try { 
          await axiosClient.delete(`/finance/operating-costs/${id}`);
          await get().fetchOperatingCosts();
        } catch (e) { console.error(e); }
      },

      addBankAccount: async (row) => {
        try { 
          await axiosClient.post('/finance/bank-accounts', row);
          await get().fetchBankAccounts();
        } catch (e) { console.error(e); }
      },
      updateBankAccount: async (id, data) => {
        try { 
          await axiosClient.put(`/finance/bank-accounts/${id}`, data);
          await get().fetchBankAccounts();
        } catch (e) { console.error(e); }
      },
      deleteBankAccount: async (id) => {
        try { 
          await axiosClient.delete(`/finance/bank-accounts/${id}`);
          await get().fetchBankAccounts();
        } catch (e) { console.error(e); }
      },

      addTransactionReason: async (row) => {
        try {
          await axiosClient.post('/finance/transaction-reasons', row);
          await get().fetchTransactionReasons();
        } catch (e) { console.error(e); }
      },
      updateTransactionReason: async (id, data) => {
        try {
          await axiosClient.put(`/finance/transaction-reasons/${id}`, data);
          await get().fetchTransactionReasons();
        } catch (e) { console.error(e); }
      },
      deleteTransactionReason: async (id) => {
        try {
          await axiosClient.delete(`/finance/transaction-reasons/${id}`);
          await get().fetchTransactionReasons();
        } catch (e) { console.error(e); }
      },

      fixedAssets: [
        { id: '1', assetCode: 'TS-POS-01', assetName: 'Máy bán hàng POS 2 màn hình Touch', category: 'Thiết bị công nghệ', originalValue: 25000000, accumulatedDepreciation: 5000000, netBookValue: 20000000, usefulLifeMonths: 36, purchasedDate: '2025-01-15', status: 'ACTIVE' },
        { id: '2', assetCode: 'TS-TRK-02', assetName: 'Xe tải giao hàng Suzuki 750kg', category: 'Phương tiện vận tải', originalValue: 320000000, accumulatedDepreciation: 80000000, netBookValue: 240000000, usefulLifeMonths: 60, purchasedDate: '2024-06-01', status: 'ACTIVE' },
      ],
      depreciations: [
        { id: '1', assetCode: 'TS-POS-01', assetName: 'Máy bán hàng POS 2 màn hình Touch', depreciationMonth: '2026-06', monthlyAmount: 694444, accumulatedTotal: 5000000 },
        { id: '2', assetCode: 'TS-TRK-02', assetName: 'Xe tải giao hàng Suzuki 750kg', depreciationMonth: '2026-06', monthlyAmount: 5333333, accumulatedTotal: 80000000 },
      ],
      fundBalances: [
        { id: '1', fundCode: 'FND-VND-01', fundName: 'Quỹ tiền mặt Trung tâm HQ', accountNumber: 'CASH-HQ-01', balance: 85000000, currency: 'VND', status: 'ACTIVE' },
        { id: '2', fundCode: 'FND-BANK-02', fundName: 'Quỹ tài khoản thanh toán Vietcombank', accountNumber: '001100223344', balance: 1450800000, currency: 'VND', status: 'ACTIVE' },
      ],
      taxDuties: [
        { id: '1', taxCode: 'TAX-VAT-Q2', taxName: 'Thuế giá trị gia tăng (VAT) Q2/2026', taxRatePercent: 10, taxPeriod: 'Q2/2026', payableAmount: 45000000, paidAmount: 45000000, status: 'PAID' },
        { id: '2', taxCode: 'TAX-CIT-2026', taxName: 'Thuế TNDN tạm tính Q2/2026', taxRatePercent: 20, taxPeriod: 'Q2/2026', payableAmount: 18000000, paidAmount: 0, status: 'DUE' },
      ],

      fetchFixedAssets: async () => {},
      addFixedAsset: async (item) => {
        set((s) => ({ fixedAssets: [{ id: `fa_${Date.now()}`, ...item }, ...s.fixedAssets] }));
      },
      updateFixedAsset: async (id, data) => {
        set((s) => ({ fixedAssets: s.fixedAssets.map((f) => (f.id === id ? { ...f, ...data } : f)) }));
      },
      deleteFixedAsset: async (id) => {
        set((s) => ({ fixedAssets: s.fixedAssets.filter((f) => f.id !== id) }));
      },

      fetchDepreciations: async () => {},
      fetchFundBalances: async () => {},
      fetchTaxDuties: async () => {},

      addJournalEntry: async (row) => {
        try { 
          await axiosClient.post('/accounting/journal-entries', row);
          await get().fetchJournalEntries();
        } catch (e) { console.error(e); }
      },
      updateJournalEntry: async (id, data) => {
        try {
          await axiosClient.put(`/accounting/journal-entries/${id}`, data);
          await get().fetchJournalEntries();
        } catch (e) { console.error(e); }
      },
    }),
    {
      name: 'retailhub-finance-storage',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<FinanceState> | undefined;
        const c = current as FinanceState;
        if (!p) return c;
        return {
          ...c,
          ...p,
          receipts: p.receipts?.length ? p.receipts : defaultFinance.receipts,
          payments: p.payments?.length ? p.payments : defaultFinance.payments,
          debts: p.debts?.length ? p.debts : defaultFinance.debts,
          operatingCosts: p.operatingCosts?.length ? p.operatingCosts : defaultFinance.operatingCosts,
          bankAccounts: p.bankAccounts?.length ? p.bankAccounts : defaultFinance.bankAccounts,
          transactionReasons: p.transactionReasons?.length ? p.transactionReasons : defaultFinance.transactionReasons,
          journalEntries: p.journalEntries?.length ? p.journalEntries : defaultFinance.journalEntries,
        };
      },
    }
  )
);
