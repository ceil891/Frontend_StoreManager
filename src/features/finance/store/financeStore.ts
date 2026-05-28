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
}

export type JournalStatus = 'DRAFT' | 'POSTED';

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
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

interface FinanceState {
  receipts: ReceiptVoucher[];
  payments: PaymentVoucher[];
  debts: DebtRecord[];
  operatingCosts: OperatingCost[];
  bankAccounts: CorporateBankAccount[];
  transactionReasons: TransactionReasonRecord[];
  journalEntries: JournalEntry[];

  addReceipt: (row: Omit<ReceiptVoucher, 'id'>) => void;
  updateReceipt: (id: string, data: Partial<ReceiptVoucher>) => void;
  deleteReceipt: (id: string) => void;

  addPayment: (row: Omit<PaymentVoucher, 'id'>) => void;
  updatePayment: (id: string, data: Partial<PaymentVoucher>) => void;
  deletePayment: (id: string) => void;

  addDebt: (row: Omit<DebtRecord, 'id'>) => void;
  updateDebt: (id: string, data: Partial<DebtRecord>) => void;
  deleteDebt: (id: string) => void;

  addOperatingCost: (row: Omit<OperatingCost, 'id'>) => void;
  updateOperatingCost: (id: string, data: Partial<OperatingCost>) => void;
  deleteOperatingCost: (id: string) => void;

  addBankAccount: (row: Omit<CorporateBankAccount, 'id'>) => void;
  updateBankAccount: (id: string, data: Partial<CorporateBankAccount>) => void;
  deleteBankAccount: (id: string) => void;

  addTransactionReason: (row: Omit<TransactionReasonRecord, 'id'>) => void;
  updateTransactionReason: (id: string, data: Partial<TransactionReasonRecord>) => void;
  deleteTransactionReason: (id: string) => void;

  updateJournalEntry: (id: string, data: Partial<JournalEntry>) => void;
  addJournalEntry: (row: Omit<JournalEntry, 'id'>) => void;
}

const DEFAULT_RECEIPTS: ReceiptVoucher[] = [
  { id: '1', voucherNumber: 'REC-2024-001', payerName: 'Đại lý Hùng Cường', category: 'SALES_REVENUE', amount: 4500000, paymentMethod: 'BANK_TRANSFER', receivedDate: '2024-05-17', referenceDoc: 'INV-2024-901', cashier: 'Trần Thị Lan', branchId: 'BR-001', notes: 'Thanh toán đơn bán buôn tháng 5.' },
  { id: '2', voucherNumber: 'REC-2024-002', payerName: 'Khách lẻ POS', category: 'SALES_REVENUE', amount: 150000, paymentMethod: 'CASH', receivedDate: '2024-05-17', cashier: 'Lê Hoàng Nam', branchId: 'BR-001' },
];

const DEFAULT_PAYMENTS: PaymentVoucher[] = [
  { id: '1', voucherNumber: 'PAY-2024-001', payeeName: 'NCC Điện tử Toàn Cầu', category: 'SUPPLIER_PAYMENT', amount: 35000000, paymentMethod: 'BANK_TRANSFER', paymentDate: '2024-05-16', bankAccountRef: 'VCB •••• 2450', approver: 'Nguyễn Minh Quân', branchId: 'HQ', status: 'COMPLETED', notes: 'Tạm ứng PO #89102.' },
  { id: '2', voucherNumber: 'PAY-2024-002', payeeName: 'Điện lực TP.HCM', category: 'UTILITIES', amount: 1850000, paymentMethod: 'BANK_TRANSFER', paymentDate: '2024-05-15', bankAccountRef: 'VCB •••• 2450', approver: 'Trần Thị Lan', branchId: 'BR-001', status: 'COMPLETED' },
];

const DEFAULT_DEBTS: DebtRecord[] = [
  { id: '1', debtCode: 'DBT-2024-101', entityName: 'Siêu thị Apex', entityType: 'CUSTOMER', totalDebt: 45000000, dueAmount: 15000000, dueDate: '2024-05-30', status: 'DUE_SOON', lastPaymentDate: '2024-05-01', accountManager: 'Trần Thị Lan', branchId: 'BR-001' },
  { id: '2', debtCode: 'DBT-2024-102', entityName: 'NCC Global Tech', entityType: 'SUPPLIER', totalDebt: -125000000, dueAmount: -25000000, dueDate: '2024-05-15', status: 'OVERDUE', lastPaymentDate: '2024-04-15', accountManager: 'Nguyễn Minh Quân', branchId: 'HQ' },
];

const DEFAULT_COSTS: OperatingCost[] = [
  { id: '1', costCode: 'OPC-2024-501', costName: 'Tiền thuê mặt bằng CH Quận 1', category: 'RENTAL', amount: 12500000, incurredDate: '2024-05-01', branch: 'CH Quận 1', branchId: 'BR-001', paymentStatus: 'PAID', assignedBudget: 'Q2 Fixed', authorizedBy: 'Nguyễn Minh Quân' },
  { id: '2', costCode: 'OPC-2024-502', costName: 'Quảng cáo Facebook', category: 'MARKETING', amount: 4850000, incurredDate: '2024-05-14', branch: 'Marketing', branchId: 'HQ', paymentStatus: 'PAID', assignedBudget: 'Q2 Marketing', authorizedBy: 'Trần Thị Lan' },
];

const DEFAULT_BANKS: CorporateBankAccount[] = [
  { id: '1', accountNumberMasked: '•••• •••• 8810 2450', bankName: 'Vietcombank', branchName: 'CN TP.HCM', swiftBic: 'BFTVVNVX', currency: 'VND', currentBalance: 1450800000, availableWorkingCapital: 1250000000, accountType: 'PRIMARY_OPERATING', status: 'ACTIVE', openedDate: '2021-04-15', authorizedSignatories: ['Nguyễn Minh Quân', 'Trần Thị Lan'] },
  { id: '2', accountNumberMasked: '•••• •••• 4419 9210', bankName: 'Techcombank', branchName: 'CN Quận 1', swiftBic: 'VTCBVNVX', currency: 'VND', currentBalance: 420500000, availableWorkingCapital: 420500000, accountType: 'MERCHANT_SETTLEMENT', status: 'ACTIVE', openedDate: '2022-01-10', authorizedSignatories: ['Trần Thị Lan'] },
];

const DEFAULT_REASONS: TransactionReasonRecord[] = [
  { id: '1', reasonCode: 'RSN-REV-POS', reasonName: 'Doanh thu POS', category: 'OPERATING_REVENUE', accountingGLCode: 'GL-40100', cashFlowImpact: 'INFLOW_DEBIT', isTaxDeductible: false, requiresReceiptUpload: false, totalLoggedVolumeUsd: 1450800, status: 'ACTIVE', applicableDepartments: 'Bán lẻ' },
  { id: '2', reasonCode: 'RSN-COG-SUP', reasonName: 'Thanh toán nhập hàng', category: 'COST_OF_GOODS', accountingGLCode: 'GL-50100', cashFlowImpact: 'OUTFLOW_CREDIT', isTaxDeductible: true, requiresReceiptUpload: true, totalLoggedVolumeUsd: 840500, status: 'ACTIVE', applicableDepartments: 'Mua hàng' },
];

const DEFAULT_JOURNAL: JournalEntry[] = [
  {
    id: 'je_1',
    code: 'JE-2026-0001',
    date: new Date().toISOString().slice(0, 10),
    description: 'Thu công nợ khách hàng đơn SO-2048',
    reference: 'REC-2026-0011',
    status: 'DRAFT',
    branchId: 'BR-001',
    lines: [
      { id: 'line_1', accountCode: '1121', accountName: 'Tiền gửi VCB', description: 'Khách chuyển khoản', debit: 12500000, credit: 0 },
      { id: 'line_2', accountCode: '131', accountName: 'Phải thu KH', description: 'Giảm công nợ', debit: 0, credit: 12500000 },
    ],
  },
];

const defaultFinance = {
  receipts: DEFAULT_RECEIPTS,
  payments: DEFAULT_PAYMENTS,
  debts: DEFAULT_DEBTS,
  operatingCosts: DEFAULT_COSTS,
  bankAccounts: DEFAULT_BANKS,
  transactionReasons: DEFAULT_REASONS,
  journalEntries: DEFAULT_JOURNAL,
};

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      ...defaultFinance,

      addReceipt: (row) => set((s) => ({ receipts: [{ id: `rec_${Date.now()}`, ...row }, ...s.receipts] })),
      updateReceipt: (id, data) => set((s) => ({ receipts: s.receipts.map((r) => (r.id === id ? { ...r, ...data } : r)) })),
      deleteReceipt: (id) => set((s) => ({ receipts: s.receipts.filter((r) => r.id !== id) })),

      addPayment: (row) => set((s) => ({ payments: [{ id: `pay_${Date.now()}`, ...row }, ...s.payments] })),
      updatePayment: (id, data) => set((s) => ({ payments: s.payments.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
      deletePayment: (id) => set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),

      addDebt: (row) => set((s) => ({ debts: [{ id: `debt_${Date.now()}`, ...row }, ...s.debts] })),
      updateDebt: (id, data) => set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, ...data } : d)) })),
      deleteDebt: (id) => set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),

      addOperatingCost: (row) => set((s) => ({ operatingCosts: [{ id: `opc_${Date.now()}`, ...row }, ...s.operatingCosts] })),
      updateOperatingCost: (id, data) => set((s) => ({ operatingCosts: s.operatingCosts.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
      deleteOperatingCost: (id) => set((s) => ({ operatingCosts: s.operatingCosts.filter((c) => c.id !== id) })),

      addBankAccount: (row) => set((s) => ({ bankAccounts: [{ id: `bank_${Date.now()}`, ...row }, ...s.bankAccounts] })),
      updateBankAccount: (id, data) => set((s) => ({ bankAccounts: s.bankAccounts.map((b) => (b.id === id ? { ...b, ...data } : b)) })),
      deleteBankAccount: (id) => set((s) => ({ bankAccounts: s.bankAccounts.filter((b) => b.id !== id) })),

      addTransactionReason: (row) => set((s) => ({ transactionReasons: [{ id: `rsn_${Date.now()}`, ...row }, ...s.transactionReasons] })),
      updateTransactionReason: (id, data) => set((s) => ({ transactionReasons: s.transactionReasons.map((r) => (r.id === id ? { ...r, ...data } : r)) })),
      deleteTransactionReason: (id) => set((s) => ({ transactionReasons: s.transactionReasons.filter((r) => r.id !== id) })),

      addJournalEntry: (row) => set((s) => ({ journalEntries: [{ id: `je_${Date.now()}`, ...row }, ...s.journalEntries] })),
      updateJournalEntry: (id, data) => set((s) => ({ journalEntries: s.journalEntries.map((j) => (j.id === id ? { ...j, ...data } : j)) })),
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
