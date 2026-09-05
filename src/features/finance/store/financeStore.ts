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
  status?: 'COMPLETED' | 'PENDING_APPROVAL' | 'REJECTED' | 'CANCELLED';
  fundAccountName?: string;
  receivingAccount?: string;
  payerContact?: string;
  attachments?: string[];
  voucherCode?: string;
  createdDate?: string;
  createdByName?: string;
  invoiceCode?: string;
  paymentReason?: string;
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
  referenceDoc?: string;
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
  increase?: number;
  decrease?: number;
  currency?: string;
  partnerCode?: string;
  partnerName?: string;
  partnerType?: string;
  closingDebt?: number;
  lastTransactionDate?: string;
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
  title?: string;
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
  entryCode?: string;
  transactionDate?: string;
}

export type ReceiptVoucherRecord = ReceiptVoucher;
export type PaymentVoucherRecord = PaymentVoucher;
export type DebtLedgerRecord = DebtRecord;
export type BankAccountRecord = CorporateBankAccount;
export type OperatingCostRecord = OperatingCost;
export type JournalEntryRecord = JournalEntry;

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
  deleteJournalEntry: (id: string) => Promise<void>;

  fetchFixedAssets: () => Promise<void>;
  addFixedAsset: (item: Omit<FixedAssetRecord, 'id'>) => Promise<void>;
  updateFixedAsset: (id: string, data: Partial<FixedAssetRecord>) => Promise<void>;
  deleteFixedAsset: (id: string) => Promise<void>;

  fetchDepreciations: () => Promise<void>;
  addDepreciation: (item: any) => Promise<void>;
  updateDepreciation: (id: string, data: any) => Promise<void>;
  deleteDepreciation: (id: string) => Promise<void>;
  fetchFundBalances: () => Promise<void>;
  addFundBalance: (item: any) => Promise<any>;
  updateFundBalance: (id: string, data: any) => Promise<any>;
  deleteFundBalance: (id: string) => Promise<void>;

  fetchTaxDuties: () => Promise<void>;
  addTaxDuty: (item: any) => Promise<any>;
  updateTaxDuty: (id: string, data: any) => Promise<any>;
  deleteTaxDuty: (id: string) => Promise<void>;
}

const DEFAULT_FIXED_ASSETS: FixedAssetRecord[] = [];
const DEFAULT_DEPRECIATIONS: DepreciationRecord[] = [];
const DEFAULT_FUND_BALANCES: FundBalanceRecord[] = [];
const DEFAULT_TAX_DUTIES: TaxDutyRecord[] = [];

export const DEFAULT_MOCK_RECEIPTS: ReceiptVoucher[] = [];
export const DEFAULT_MOCK_PAYMENTS: PaymentVoucher[] = [];

export const useFinanceStore = create<FinanceState>()((set, get) => ({
  receipts: [],
  payments: [],
  debts: [],
  operatingCosts: [],
  bankAccounts: [],
  transactionReasons: [],
  journalEntries: [],
  fixedAssets: [],
  depreciations: [],
  fundBalances: [],
  taxDuties: [],
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
        status: (item.status as any) || 'PENDING_APPROVAL',
        fundAccountName: item.fundAccountName || '',
        referenceDoc: item.invoiceCode || item.referenceDoc || '',
        notes: item.notes || '',
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
        payeeName: item.recipientName || item.payeeName || '',
        category: 'SUPPLIER_PAYMENT',
        amount: item.amount,
        paymentMethod: item.paymentMethod as any,
        paymentDate: item.createdDate || item.paymentDate,
        bankAccountRef: item.bankAccountRef || item.fundAccountName || '',
        approver: item.createdByName || item.approver || 'Super Admin',
        branchId: '1',
        status: item.status as any,
        referenceDoc: item.referenceDoc || item.invoiceCode || '',
        notes: item.notes || item.paymentReason || '',
        attachments: item.attachments || (item.attachmentUrl ? [item.attachmentUrl] : []),
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
        debtCode: item.debtCode || item.partnerCode || `DBT-${item.id}`,
        entityName: item.entityName || item.partnerName || '',
        entityType: (item.entityType || item.partnerType || 'CUSTOMER') as any,
        totalDebt: Number(item.totalDebt ?? item.closingDebt ?? 0),
        dueAmount: Number(item.dueAmount ?? item.closingDebt ?? 0),
        dueDate: (item as any).dueDate || item.lastTransactionDate || '',
        status: ((item as any).status || 'NORMAL') as any,
        lastPaymentDate: item.lastPaymentDate || item.lastTransactionDate || undefined,
        accountManager: (item as any).accountManager || 'Kế toán công nợ',
        branchId: '1',
        increase: Number((item as any).increase ?? (item as any).openingDebt ?? 0),
        decrease: Number((item as any).decrease ?? (item as any).paidDebt ?? 0),
        paidAmount: Number((item as any).paidAmount ?? (item as any).decrease ?? 0),
        referenceDoc: (item as any).referenceDoc || item.partnerCode || '',
        incurredDate: (item as any).incurredDate || '',
        notes: (item as any).notes || '',
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
      const mapped: OperatingCost[] = data.map((item: any) => ({
        id: item.id,
        costCode: item.costCode,
        costName: item.costName || item.title || 'Chi phí vận hành',
        category: (['RENTAL', 'UTILITIES', 'SALARY', 'MARKETING', 'MAINTENANCE', 'INSURANCE', 'SUPPLIES'].includes(item.category || item.costCategory) ? (item.category || item.costCategory) : 'RENTAL'),
        amount: Number(item.amount || 0),
        incurredDate: item.incurredDate || '',
        branch: item.branch || item.branchName || 'Hội sở chính',
        branchId: item.branchId || '1',
        paymentStatus: item.paymentStatus as any || 'PAID',
        assignedBudget: item.assignedBudget || 'Budget-2026',
        authorizedBy: item.authorizedBy || 'Giám đốc',
        description: item.description || item.notes || '',
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
        id: String(item.id),
        accountName: item.accountHolder || 'CÔNG TY TNHH BÁN LẺ RETAILHUB',
        accountNumber: item.accountNumber,
        accountNumberMasked: item.accountNumber && item.accountNumber.length >= 4
          ? `•••• •••• ${item.accountNumber.slice(-4)}`
          : (item.accountNumber || '•••• •••• 8888'),
        bankName: item.bankName,
        branchName: item.branchName || 'Hội sở chính',
        swiftBic: item.swiftBic || 'TCBVNVX',
        currency: (item.currency as any) || 'VND',
        currentBalance: Number(item.currentBalance || 0),
        availableWorkingCapital: Number(item.availableWorkingCapital || item.currentBalance || 0),
        accountType: (item.accountType as any) || 'PRIMARY_OPERATING',
        status: (item.status as any) || 'ACTIVE',
        openedDate: item.openedDate || '2024-01-15',
        authorizedSignatories: ['CFO Sarah Jenkins', 'Tổng Giám Đốc'],
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
      const data = await financeService.fetchTransactionReasons();
      set({ transactionReasons: data, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải lý do thu chi' });
    }
  },

  fetchJournalEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await financeService.fetchJournalEntries();
      const mapped: JournalEntry[] = data.map((item: any) => ({
        id: item.id,
        code: item.code || item.entryCode,
        date: item.date || item.transactionDate,
        description: item.description,
        reference: item.reference || '',
        status: item.status || 'POSTED',
        branchId: item.branchId || '1',
        lines: item.lines || [],
      }));
      set({ journalEntries: mapped, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải sổ nhật ký chung' });
    }
  },

  addReceipt: async (row) => {
    set({ isLoading: true, error: null });
    // Optimistic: thêm ngay vào danh sách để UI phản hồi nhanh
    const newRec: ReceiptVoucher = {
      id: String(Date.now()),
      ...row,
    };
    set((state) => ({ receipts: [newRec, ...state.receipts], isLoading: false }));
    try {
      await financeService.addReceiptVoucher({
        voucherCode: row.voucherNumber,
        voucherDate: row.receivedDate,
        payerName: row.payerName,
        amount: row.amount,
        paymentMethod: row.paymentMethod,
        status: (row as any).status || 'COMPLETED',
        notes: row.notes || '',
        fundAccountName: (row as any).fundAccountName || '',
        invoiceCode: row.referenceDoc || (row as any).invoiceCode || '',
      });
      // Reload từ API để có ID thực + dữ liệu chính xác
      const fresh = await financeService.fetchReceiptVouchers();
      const mapped: ReceiptVoucher[] = fresh.map((item) => ({
        id: item.id,
        voucherNumber: item.voucherCode,
        payerName: item.payerName,
        category: 'SALES_REVENUE',
        amount: item.amount,
        paymentMethod: item.paymentMethod as any,
        receivedDate: item.createdDate,
        cashier: item.createdByName,
        branchId: '1',
        status: (item.status as any) || 'COMPLETED',
        fundAccountName: item.fundAccountName || '',
        referenceDoc: item.invoiceCode || item.referenceDoc || '',
        notes: item.notes || '',
      }));
      set({ receipts: mapped, isLoading: false });
    } catch (e: any) {
      console.error('[addReceipt] API error (reverting optimistic record):', e);
      set((state) => ({ receipts: state.receipts.filter(r => r.id !== newRec.id), isLoading: false }));
      throw e;
    }
  },

  updateReceipt: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.updateReceiptVoucher(id, {
        voucherCode: data.voucherNumber,
        payerName: data.payerName,
        paymentReason: data.notes,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        createdDate: data.receivedDate,
        status: data.status,
      });

      set((state) => {
        const next = state.receipts.map((r) => (r.id === id ? { ...r, ...data } : r));
        try {
          localStorage.setItem('retailhub_finance_receipts', JSON.stringify(next));
        } catch {}
        return { receipts: next, isLoading: false };
      });
    } catch (e: any) {
      console.error('[updateReceipt] API error:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi cập nhật phiếu thu' });
      throw e;
    }
  },

  deleteReceipt: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.deleteReceiptVoucher(id);
      set((state) => {
        const next = state.receipts.filter((r) => r.id !== id);
        try {
          localStorage.setItem('retailhub_finance_receipts', JSON.stringify(next));
        } catch {}
        return { receipts: next, isLoading: false };
      });
    } catch (e: any) {
      console.error('Failed to delete receipt voucher:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa phiếu thu' });
      throw e;
    }
  },

  addPayment: async (row) => {
    set({ isLoading: true, error: null });
    const newPay: PaymentVoucher = {
      id: String(Date.now()),
      ...row,
    };
    set((state) => ({ payments: [newPay, ...state.payments], isLoading: false }));
    try {
      await financeService.addPaymentVoucher({
        voucherCode: row.voucherNumber,
        voucherDate: row.paymentDate,
        receiverName: row.payeeName,
        payeeName: row.payeeName,
        amount: row.amount,
        paymentMethod: row.paymentMethod,
        status: row.status || 'PENDING_APPROVAL',
        fundAccountName: row.bankAccountRef || '',
        handler: row.approver || '',
        notes: row.notes || '',
        invoiceCode: row.referenceDoc || '',
        attachmentUrl: row.attachments?.[0] || '',
      });
      const fresh = await financeService.fetchPaymentVouchers();
      const mapped: PaymentVoucher[] = fresh.map((item) => ({
        id: item.id,
        voucherNumber: item.voucherCode,
        payeeName: item.recipientName || item.payeeName || '',
        category: 'SUPPLIER_PAYMENT',
        amount: item.amount,
        paymentMethod: item.paymentMethod as any,
        paymentDate: item.createdDate || item.paymentDate,
        bankAccountRef: item.bankAccountRef || item.fundAccountName || '',
        approver: item.createdByName || item.approver || 'Super Admin',
        branchId: '1',
        status: item.status as any,
        referenceDoc: item.referenceDoc || item.invoiceCode || '',
        notes: item.notes || item.paymentReason || '',
        attachments: item.attachments || (item.attachmentUrl ? [item.attachmentUrl] : []),
      }));
      set({ payments: mapped, isLoading: false });
    } catch (e: any) {
      console.error('[addPayment] API error:', e);
      set((state) => ({ payments: state.payments.filter(p => p.id !== newPay.id), isLoading: false }));
      throw e;
    }
  },

  updatePayment: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.updatePaymentVoucher(id, {
        voucherCode: data.voucherNumber,
        receiverName: data.payeeName,
        recipientName: data.payeeName,
        payeeName: data.payeeName,
        paymentReason: data.notes,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        voucherDate: data.paymentDate,
        createdDate: data.paymentDate,
        status: data.status,
        fundAccountName: data.bankAccountRef,
        handler: data.approver,
        notes: data.notes,
        invoiceCode: data.referenceDoc,
        attachmentUrl: data.attachments?.[0] || '',
      });

      set((state) => {
        const next = state.payments.map((p) => (p.id === id ? { ...p, ...data } : p));
        try {
          localStorage.setItem('retailhub_finance_payments', JSON.stringify(next));
        } catch {}
        return { payments: next, isLoading: false };
      });
    } catch (e: any) {
      console.error('[updatePayment] API error:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi cập nhật phiếu chi' });
      throw e;
    }
  },

  deletePayment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.deletePaymentVoucher(id);
      set((state) => {
        const next = state.payments.filter((p) => p.id !== id);
        try {
          localStorage.setItem('retailhub_finance_payments', JSON.stringify(next));
        } catch {}
        return { payments: next, isLoading: false };
      });
    } catch (e: any) {
      console.error('Failed to delete payment voucher:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa phiếu chi' });
      throw e;
    }
  },

  addDebt: async (row) => {
    set({ isLoading: true, error: null });
    try {
      const created = await financeService.addDebtLedger(row as any);
      set((state) => ({ debts: [{ ...row, id: created.id }, ...state.debts], isLoading: false }));
    } catch (e: any) {
      console.error('Failed to add debt ledger:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi thêm sổ nợ' });
      throw e;
    }
  },
  updateDebt: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.updateDebtLedger(id, data as any);
      set((state) => ({ debts: state.debts.map((d) => (d.id === id ? { ...d, ...data } : d)), isLoading: false }));
    } catch (e: any) {
      console.error('Failed to update debt ledger:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi cập nhật sổ nợ' });
      throw e;
    }
  },
  deleteDebt: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.deleteDebtLedger(id);
      set((state) => ({ debts: state.debts.filter((d) => d.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error('Failed to delete debt ledger:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa sổ nợ' });
      throw e;
    }
  },

  addOperatingCost: async (row) => {
    set({ isLoading: true, error: null });
    try {
      const created = await financeService.addOperatingCost(row as any);
      set((state) => ({ operatingCosts: [{ ...row, id: created.id }, ...state.operatingCosts], isLoading: false }));
    } catch (e: any) {
      console.error('Failed to add operating cost:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi thêm chi phí vận hành' });
      throw e;
    }
  },
  updateOperatingCost: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.updateOperatingCost(id, data as any);
      set((state) => ({ operatingCosts: state.operatingCosts.map((c) => (c.id === id ? { ...c, ...data } : c)), isLoading: false }));
    } catch (e: any) {
      console.error('Failed to update operating cost:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi cập nhật chi phí vận hành' });
      throw e;
    }
  },
  deleteOperatingCost: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.deleteOperatingCost(id);
      set((state) => ({ operatingCosts: state.operatingCosts.filter((c) => c.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error('Failed to delete operating cost:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa chi phí vận hành' });
      throw e;
    }
  },

  addBankAccount: async (row) => {
    set({ isLoading: true, error: null });
    try {
      const created = await financeService.addBankAccount({
        bankName: row.bankName,
        accountNumber: row.accountNumber || '',
        accountHolder: row.accountName || 'CÔNG TY TNHH BÁN LẺ RETAILHUB',
        branchName: row.branchName,
        swiftBic: row.swiftBic,
        currency: row.currency,
        currentBalance: row.currentBalance,
        availableWorkingCapital: row.availableWorkingCapital,
        accountType: row.accountType,
        openedDate: row.openedDate,
        status: row.status,
        isActive: true,
      });
      const newAcc: CorporateBankAccount = {
        ...row,
        id: String(created.id || Date.now()),
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
        branchName: data.branchName,
        swiftBic: data.swiftBic,
        currency: data.currency,
        currentBalance: data.currentBalance,
        availableWorkingCapital: data.availableWorkingCapital,
        accountType: data.accountType,
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
      console.error('Failed to delete bank account:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa tài khoản ngân hàng' });
      throw e;
    }
  },

  addTransactionReason: async (row) => {
    set({ isLoading: true, error: null });
    try {
      const created = await financeService.addTransactionReason(row);
      set((state) => ({ transactionReasons: [{ ...row, id: String(created?.id || Date.now()) }, ...state.transactionReasons], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ transactionReasons: [{ id: String(Date.now()), ...row }, ...state.transactionReasons], isLoading: false }));
    }
  },
  updateTransactionReason: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.updateTransactionReason(id, data);
      set((state) => ({ transactionReasons: state.transactionReasons.map((t) => (t.id === id ? { ...t, ...data } : t)), isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ transactionReasons: state.transactionReasons.map((t) => (t.id === id ? { ...t, ...data } : t)), isLoading: false }));
    }
  },
  deleteTransactionReason: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.deleteTransactionReason(id);
      set((state) => ({ transactionReasons: state.transactionReasons.filter((t) => t.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error('Failed to delete transaction reason:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa lý do giao dịch' });
      throw e;
    }
  },

  updateJournalEntry: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.updateJournalEntry(id, data as any);
      set((state) => ({ journalEntries: state.journalEntries.map((j) => (j.id === id ? { ...j, ...data } : j)), isLoading: false }));
    } catch (e: any) {
      console.error('Failed to update journal entry:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi cập nhật bút toán' });
      throw e;
    }
  },
  addJournalEntry: async (row) => {
    set({ isLoading: true, error: null });
    try {
      const created = await financeService.addJournalEntry(row as any);
      set((state) => ({ journalEntries: [{ ...row, id: created.id }, ...state.journalEntries], isLoading: false }));
    } catch (e: any) {
      console.error('Failed to add journal entry:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi thêm bút toán' });
      throw e;
    }
  },
  deleteJournalEntry: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.deleteJournalEntry(id);
      set((state) => ({
        journalEntries: state.journalEntries.filter((j) => String(j.id) !== String(id)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error('Failed to delete journal entry:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa bút toán' });
      throw e;
    }
  },

  fetchFixedAssets: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await financeService.fetchFixedAssets();
      set({ fixedAssets: data.map((item: any) => ({ id: String(item.id), ...item })), isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },
  addFixedAsset: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await financeService.addFixedAsset(item);
      set((s) => ({ fixedAssets: [{ ...item, id: String(created?.id || Date.now()) }, ...s.fixedAssets], isLoading: false }));
    } catch (e: any) {
      console.error('Failed to add fixed asset:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi thêm tài sản cố định' });
      throw e;
    }
  },
  updateFixedAsset: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.updateFixedAsset(id, data);
      set((s) => ({ fixedAssets: s.fixedAssets.map((f) => (f.id === id ? { ...f, ...data } : f)), isLoading: false }));
    } catch (e: any) {
      console.error('Failed to update fixed asset:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi cập nhật tài sản cố định' });
      throw e;
    }
  },
  deleteFixedAsset: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.deleteFixedAsset(id);
      set((s) => ({ fixedAssets: s.fixedAssets.filter((f) => f.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error('Failed to delete fixed asset:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa tài sản cố định' });
      throw e;
    }
  },

  fetchDepreciations: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await financeService.fetchDepreciations();
      set({ depreciations: data, isLoading: false });
    } catch (e: any) {
      console.error('Failed to fetch depreciations:', e);
      set({ isLoading: false });
    }
  },

  addDepreciation: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const saved = await financeService.addDepreciation(item);
      set((s) => ({
        depreciations: [saved, ...s.depreciations],
        isLoading: false,
      }));
    } catch (e: any) {
      console.error('Failed to add depreciation:', e);
      set({ isLoading: false });
      throw e;
    }
  },

  updateDepreciation: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await financeService.updateDepreciation(id, data);
      set((s) => ({
        depreciations: s.depreciations.map((d) => (d.id === id ? { ...d, ...updated } : d)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error('Failed to update depreciation:', e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteDepreciation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.deleteDepreciation(id);
      set((s) => ({
        depreciations: s.depreciations.filter((d) => d.id !== id),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error('Failed to delete depreciation:', e);
      set({ isLoading: false });
      throw e;
    }
  },

  fetchFundBalances: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await financeService.fetchFundBalances();
      set({ fundBalances: Array.isArray(data) ? data : [], isLoading: false });
    } catch (e: any) {
      console.error('Failed to fetch fund balances:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi tải số dư quỹ' });
    }
  },
  addFundBalance: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await financeService.addFundBalance(item);
      await get().fetchFundBalances();
      return created;
    } catch (e: any) {
      console.error('Failed to add fund balance:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi tạo số dư quỹ' });
      throw e;
    }
  },
  updateFundBalance: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await financeService.updateFundBalance(id, data);
      await get().fetchFundBalances();
      return updated;
    } catch (e: any) {
      console.error('Failed to update fund balance:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi cập nhật số dư quỹ' });
      throw e;
    }
  },
  deleteFundBalance: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.deleteFundBalance(id);
      set((state) => ({
        fundBalances: state.fundBalances.filter((f) => String(f.id) !== String(id)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error('Failed to delete fund balance:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa số dư quỹ' });
      throw e;
    }
  },

  fetchTaxDuties: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await financeService.fetchTaxDuties();
      set({ taxDuties: Array.isArray(data) ? data : [], isLoading: false });
    } catch (e: any) {
      console.error('Failed to fetch tax duties:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi tải dữ liệu thuế' });
    }
  },
  addTaxDuty: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await financeService.addTaxDuty(item);
      await get().fetchTaxDuties();
      return created;
    } catch (e: any) {
      console.error('Failed to add tax duty:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi tạo thuế' });
      throw e;
    }
  },
  updateTaxDuty: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await financeService.updateTaxDuty(id, data);
      await get().fetchTaxDuties();
      return updated;
    } catch (e: any) {
      console.error('Failed to update tax duty:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi cập nhật thuế' });
      throw e;
    }
  },
  deleteTaxDuty: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.deleteTaxDuty(id);
      set((state) => ({
        taxDuties: state.taxDuties.filter((t) => String(t.id) !== String(id)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error('Failed to delete tax duty:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa thuế' });
      throw e;
    }
  },
}));
