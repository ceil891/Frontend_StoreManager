import { create } from 'zustand';
import { financeService } from '../services/financeService';

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

interface FinanceState {
  receipts: ReceiptVoucher[];
  payments: PaymentVoucher[];
  debts: DebtRecord[];
  operatingCosts: OperatingCost[];
  bankAccounts: CorporateBankAccount[];
  transactionReasons: TransactionReasonRecord[];
  journalEntries: JournalEntry[];
  fixedAssets: FixedAssetRecord[];
  depreciations: DepreciationRecord[];
  fundBalances: FundBalanceRecord[];
  taxDuties: TaxDutyRecord[];
  isLoading: boolean;
  error: string | null;

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

  fetchFixedAssets: () => Promise<void>;
  addFixedAsset: (item: Omit<FixedAssetRecord, 'id'>) => Promise<void>;
  updateFixedAsset: (id: string, data: Partial<FixedAssetRecord>) => Promise<void>;
  deleteFixedAsset: (id: string) => Promise<void>;

  fetchDepreciations: () => Promise<void>;
  fetchFundBalances: () => Promise<void>;
  fetchTaxDuties: () => Promise<void>;
}

const DEFAULT_FIXED_ASSETS: FixedAssetRecord[] = [
  { id: '1', assetCode: 'TS-POS-01', assetName: 'Máy bán hàng POS 2 màn hình Touch', category: 'Thiết bị công nghệ', originalValue: 25000000, accumulatedDepreciation: 5000000, netBookValue: 20000000, usefulLifeMonths: 36, purchasedDate: '2025-01-15', status: 'ACTIVE' },
  { id: '2', assetCode: 'TS-TRK-02', assetName: 'Xe tải giao hàng Suzuki 750kg', category: 'Phương tiện vận tải', originalValue: 320000000, accumulatedDepreciation: 80000000, netBookValue: 240000000, usefulLifeMonths: 60, purchasedDate: '2024-06-01', status: 'ACTIVE' },
];

const DEFAULT_DEPRECIATIONS: DepreciationRecord[] = [
  { id: '1', assetCode: 'TS-POS-01', assetName: 'Máy bán hàng POS 2 màn hình Touch', depreciationMonth: '2026-06', monthlyAmount: 694444, accumulatedTotal: 5000000 },
  { id: '2', assetCode: 'TS-TRK-02', assetName: 'Xe tải giao hàng Suzuki 750kg', depreciationMonth: '2026-06', monthlyAmount: 5333333, accumulatedTotal: 80000000 },
];

const DEFAULT_FUND_BALANCES: FundBalanceRecord[] = [
  { id: '1', fundCode: 'FND-VND-01', fundName: 'Quỹ tiền mặt Trung tâm HQ', accountNumber: 'CASH-HQ-01', balance: 85000000, currency: 'VND', status: 'ACTIVE' },
  { id: '2', fundCode: 'FND-BANK-02', fundName: 'Quỹ tài khoản thanh toán Vietcombank', accountNumber: '001100223344', balance: 1450800000, currency: 'VND', status: 'ACTIVE' },
];

const DEFAULT_TAX_DUTIES: TaxDutyRecord[] = [
  { id: '1', taxCode: 'TAX-VAT-Q2', taxName: 'Thuế giá trị gia tăng (VAT) Q2/2026', taxRatePercent: 10, taxPeriod: 'Q2/2026', payableAmount: 45000000, paidAmount: 45000000, status: 'PAID' },
  { id: '2', taxCode: 'TAX-CIT-2026', taxName: 'Thuế TNDN tạm tính Q2/2026', taxRatePercent: 20, taxPeriod: 'Q2/2026', payableAmount: 18000000, paidAmount: 0, status: 'DUE' },
];

export const useFinanceStore = create<FinanceState>()((set) => ({
  receipts: [],
  payments: [],
  debts: [],
  operatingCosts: [],
  bankAccounts: [],
  transactionReasons: [],
  journalEntries: [],
  fixedAssets: DEFAULT_FIXED_ASSETS,
  depreciations: DEFAULT_DEPRECIATIONS,
  fundBalances: DEFAULT_FUND_BALANCES,
  taxDuties: DEFAULT_TAX_DUTIES,
  isLoading: false,
  error: null,

  fetchReceipts: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await financeService.fetchReceiptVouchers();
      const mapped: ReceiptVoucher[] = data.map((item) => ({
        id: item.id,
        voucherNumber: item.voucherCode,
        payerName: item.payerName,
        category: 'SALES_REVENUE',
        amount: item.amount,
        paymentMethod: item.paymentMethod as any,
        receivedDate: item.createdDate,
        cashier: item.createdByName,
        branchId: '1',
      }));
      set({ receipts: mapped, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải phiếu thu' });
    }
  },

  fetchPayments: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await financeService.fetchPaymentVouchers();
      const mapped: PaymentVoucher[] = data.map((item) => ({
        id: item.id,
        voucherNumber: item.voucherCode,
        payeeName: item.recipientName,
        category: 'SUPPLIER_PAYMENT',
        amount: item.amount,
        paymentMethod: item.paymentMethod as any,
        paymentDate: item.createdDate,
        bankAccountRef: '',
        approver: item.createdByName,
        branchId: '1',
        status: item.status as any,
      }));
      set({ payments: mapped, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải phiếu chi' });
    }
  },

  fetchDebts: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await financeService.fetchDebtLedgers();
      const mapped: DebtRecord[] = data.map((item) => ({
        id: item.id,
        debtCode: item.partnerCode,
        entityName: item.partnerName,
        entityType: item.partnerType as any,
        totalDebt: item.closingDebt,
        dueAmount: item.closingDebt,
        dueDate: item.lastTransactionDate,
        status: 'NORMAL',
        accountManager: 'Kế toán công nợ',
        branchId: '1',
      }));
      set({ debts: mapped, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải sổ nợ' });
    }
  },

  fetchOperatingCosts: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await financeService.fetchOperatingCosts();
      const mapped: OperatingCost[] = data.map((item) => ({
        id: item.id,
        costCode: item.costCode,
        costName: item.title,
        category: 'RENTAL',
        amount: item.amount,
        incurredDate: item.incurredDate,
        branch: 'Chi nhánh 1',
        branchId: '1',
        paymentStatus: item.paymentStatus as any,
        assignedBudget: 'Budget-2026',
        authorizedBy: 'Giám đốc',
      }));
      set({ operatingCosts: mapped, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải chi phí vận hành' });
    }
  },

  fetchBankAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await financeService.fetchBankAccounts();
      const mapped: CorporateBankAccount[] = data.map((item) => ({
        id: item.id,
        accountName: item.accountHolder,
        accountNumber: item.accountNumber,
        accountNumberMasked: item.accountNumber ? `•••• •••• ${item.accountNumber.slice(-4)}` : '',
        bankName: item.bankName,
        branchName: item.branchName,
        swiftBic: 'VCBVIETNAM',
        currency: 'VND',
        currentBalance: item.currentBalance,
        availableWorkingCapital: item.currentBalance,
        accountType: 'PRIMARY_OPERATING',
        status: item.status as any,
        openedDate: '2025-01-01',
        authorizedSignatories: ['Giám đốc'],
      }));
      set({ bankAccounts: mapped, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải tài khoản ngân hàng' });
    }
  },

  fetchTransactionReasons: async () => {
    set({ isLoading: true, error: null });
    try {
      set({ isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  fetchJournalEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await financeService.fetchJournalEntries();
      const mapped: JournalEntry[] = data.map((item) => ({
        id: item.id,
        code: item.entryCode,
        date: item.transactionDate,
        description: item.description,
        reference: '',
        status: 'POSTED',
        branchId: '1',
        lines: [],
      }));
      set({ journalEntries: mapped, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải sổ nhật ký chung' });
    }
  },

  addReceipt: async (row) => {
    set({ isLoading: true, error: null });
    try {
      const created = await financeService.addReceiptVoucher({
        id: '',
        voucherCode: row.voucherNumber,
        payerName: row.payerName,
        paymentReason: row.notes || '',
        amount: row.amount,
        paymentMethod: row.paymentMethod,
        createdDate: row.receivedDate,
        status: 'COMPLETED',
        createdByName: row.cashier,
      });
      const newRec: ReceiptVoucher = {
        ...row,
        id: created.id,
        voucherNumber: created.voucherCode || row.voucherNumber,
      };
      set((state) => ({ receipts: [newRec, ...state.receipts], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi thêm phiếu thu' });
      throw e;
    }
  },

  updateReceipt: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        receipts: state.receipts.map((r) => (r.id === id ? { ...r, ...data } : r)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteReceipt: async (id) => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        receipts: state.receipts.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  addPayment: async (row) => {
    set({ isLoading: true, error: null });
    try {
      const created = await financeService.addPaymentVoucher({
        id: '',
        voucherCode: row.voucherNumber,
        recipientName: row.payeeName,
        paymentReason: row.notes || '',
        amount: row.amount,
        paymentMethod: row.paymentMethod,
        createdDate: row.paymentDate,
        status: 'COMPLETED',
        createdByName: row.approver,
      });
      const newPay: PaymentVoucher = {
        ...row,
        id: created.id,
        voucherNumber: created.voucherCode || row.voucherNumber,
      };
      set((state) => ({ payments: [newPay, ...state.payments], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi thêm phiếu chi' });
      throw e;
    }
  },

  updatePayment: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        payments: state.payments.map((p) => (p.id === id ? { ...p, ...data } : p)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  deletePayment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        payments: state.payments.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  addDebt: async (row) => {
    set((state) => ({ debts: [{ id: String(Date.now()), ...row }, ...state.debts] }));
  },
  updateDebt: async (id, data) => {
    set((state) => ({ debts: state.debts.map((d) => (d.id === id ? { ...d, ...data } : d)) }));
  },
  deleteDebt: async (id) => {
    set((state) => ({ debts: state.debts.filter((d) => d.id !== id) }));
  },

  addOperatingCost: async (row) => {
    set((state) => ({ operatingCosts: [{ id: String(Date.now()), ...row }, ...state.operatingCosts] }));
  },
  updateOperatingCost: async (id, data) => {
    set((state) => ({ operatingCosts: state.operatingCosts.map((c) => (c.id === id ? { ...c, ...data } : c)) }));
  },
  deleteOperatingCost: async (id) => {
    set((state) => ({ operatingCosts: state.operatingCosts.filter((c) => c.id !== id) }));
  },

  addBankAccount: async (row) => {
    set({ isLoading: true, error: null });
    try {
      const created = await financeService.addBankAccount({
        id: '',
        bankName: row.bankName,
        accountNumber: row.accountNumber || '',
        accountHolder: row.accountName || '',
        branchName: row.branchName,
        currentBalance: row.currentBalance,
        status: row.status,
        isDefault: false,
      });
      const newAcc: CorporateBankAccount = {
        ...row,
        id: created.id,
      };
      set((state) => ({ bankAccounts: [newAcc, ...state.bankAccounts], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  updateBankAccount: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.updateBankAccount(id, {
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountHolder: data.accountName,
        currentBalance: data.currentBalance,
        status: data.status,
      });
      set((state) => ({
        bankAccounts: state.bankAccounts.map((b) => (b.id === id ? { ...b, ...data } : b)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteBankAccount: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.deleteBankAccount(id);
      set((state) => ({
        bankAccounts: state.bankAccounts.filter((b) => b.id !== id),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({
        bankAccounts: state.bankAccounts.filter((b) => b.id !== id),
        isLoading: false,
      }));
    }
  },

  addTransactionReason: async (row) => {
    set((state) => ({ transactionReasons: [{ id: String(Date.now()), ...row }, ...state.transactionReasons] }));
  },
  updateTransactionReason: async (id, data) => {
    set((state) => ({ transactionReasons: state.transactionReasons.map((t) => (t.id === id ? { ...t, ...data } : t)) }));
  },
  deleteTransactionReason: async (id) => {
    set((state) => ({ transactionReasons: state.transactionReasons.filter((t) => t.id !== id) }));
  },

  updateJournalEntry: async (id, data) => {
    set((state) => ({ journalEntries: state.journalEntries.map((j) => (j.id === id ? { ...j, ...data } : j)) }));
  },
  addJournalEntry: async (row) => {
    set((state) => ({ journalEntries: [{ id: String(Date.now()), ...row }, ...state.journalEntries] }));
  },

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
}));
