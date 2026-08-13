import { axiosClient } from '@/shared/lib/axiosClient';
import type {
  ReceiptVoucherRecord,
  PaymentVoucherRecord,
  DebtLedgerRecord,
  BankAccountRecord,
  OperatingCostRecord,
  JournalEntryRecord,
} from '../store/financeStore';

export const financeService = {
  // --- Receipt Vouchers ---
  async fetchReceiptVouchers(): Promise<ReceiptVoucherRecord[]> {
    const res = await axiosClient.get<any, any>('/finance/receipts');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      voucherCode: item.voucherCode || `RV-${item.id}`,
      payerName: item.payerName || '',
      paymentReason: item.paymentReason || '',
      amount: Number(item.amount || 0),
      paymentMethod: item.paymentMethod || 'BANK_TRANSFER',
      createdDate: item.createdDate ? item.createdDate.split('T')[0] : '',
      status: item.status || 'COMPLETED',
      createdByName: item.createdByName || 'Kế toán viên',
    }));
  },

  async addReceiptVoucher(voucher: Omit<ReceiptVoucherRecord, 'id'>): Promise<ReceiptVoucherRecord> {
    const res = await axiosClient.post<any, any>('/finance/receipts', voucher);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...voucher,
      ...(item || {}),
    };
  },

  // --- Payment Vouchers ---
  async fetchPaymentVouchers(): Promise<PaymentVoucherRecord[]> {
    const res = await axiosClient.get<any, any>('/finance/payments');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      voucherCode: item.voucherCode || `PV-${item.id}`,
      recipientName: item.recipientName || '',
      paymentReason: item.paymentReason || '',
      amount: Number(item.amount || 0),
      paymentMethod: item.paymentMethod || 'BANK_TRANSFER',
      createdDate: item.createdDate ? item.createdDate.split('T')[0] : '',
      status: item.status || 'COMPLETED',
      createdByName: item.createdByName || 'Kế toán viên',
    }));
  },

  async addPaymentVoucher(voucher: Omit<PaymentVoucherRecord, 'id'>): Promise<PaymentVoucherRecord> {
    const res = await axiosClient.post<any, any>('/finance/payments', voucher);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...voucher,
      ...(item || {}),
    };
  },

  // --- Debt Ledgers ---
  async fetchDebtLedgers(): Promise<DebtLedgerRecord[]> {
    const res = await axiosClient.get<any, any>('/finance/debts');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      partnerCode: item.partnerCode || `PART-${item.id}`,
      partnerName: item.partnerName || '',
      partnerType: item.partnerType || 'CUSTOMER',
      openingDebt: Number(item.openingDebt || 0),
      incurredDebt: Number(item.incurredDebt || 0),
      paidDebt: Number(item.paidDebt || 0),
      closingDebt: Number(item.closingDebt || 0),
      lastTransactionDate: item.lastTransactionDate ? item.lastTransactionDate.split('T')[0] : '',
    }));
  },

  // --- Bank Accounts ---
  async fetchBankAccounts(): Promise<BankAccountRecord[]> {
    const res = await axiosClient.get<any, any>('/finance/bank-accounts');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      bankName: item.bankName || '',
      accountNumber: item.accountNumber || '',
      accountHolder: item.accountHolder || '',
      branchName: item.branchName || '',
      currentBalance: Number(item.currentBalance || 0),
      status: item.status || 'ACTIVE',
      isDefault: !!item.isDefault,
    }));
  },

  async addBankAccount(acc: Omit<BankAccountRecord, 'id'>): Promise<BankAccountRecord> {
    const res = await axiosClient.post<any, any>('/finance/bank-accounts', acc);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...acc,
      ...(item || {}),
    };
  },

  async updateBankAccount(id: string, data: Partial<BankAccountRecord>): Promise<Partial<BankAccountRecord>> {
    const res = await axiosClient.put<any, any>(`/finance/bank-accounts/${id}`, data);
    return res?.data || res || data;
  },

  async deleteBankAccount(id: string): Promise<void> {
    await axiosClient.delete(`/finance/bank-accounts/${id}`);
  },

  // --- Operating Costs ---
  async fetchOperatingCosts(): Promise<OperatingCostRecord[]> {
    const res = await axiosClient.get<any, any>('/finance/operating-costs');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      costCode: item.costCode || `COST-${item.id}`,
      costCategory: item.costCategory || 'VẬN HÀNH',
      title: item.title || '',
      amount: Number(item.amount || 0),
      incurredDate: item.incurredDate ? item.incurredDate.split('T')[0] : '',
      paymentStatus: item.paymentStatus || 'PAID',
      notes: item.notes || '',
    }));
  },

  // --- Journal Entries ---
  async fetchJournalEntries(): Promise<JournalEntryRecord[]> {
    const res = await axiosClient.get<any, any>('/finance/journal-entries');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      entryCode: item.entryCode || `JE-${item.id}`,
      transactionDate: item.transactionDate ? item.transactionDate.split('T')[0] : '',
      description: item.description || '',
      debitAccount: item.debitAccount || '1111',
      creditAccount: item.creditAccount || '1311',
      amount: Number(item.amount || 0),
      createdByName: item.createdByName || 'Kế toán tổng hợp',
    }));
  },

  // --- Receipt Vouchers update/delete ---
  async updateReceiptVoucher(id: string, data: Partial<ReceiptVoucherRecord>): Promise<Partial<ReceiptVoucherRecord>> {
    const res = await axiosClient.put<any, any>(`/finance/receipts/${id}`, data);
    return res?.data || res || data;
  },

  async deleteReceiptVoucher(id: string): Promise<void> {
    await axiosClient.delete(`/finance/receipts/${id}`);
  },

  // --- Payment Vouchers update/delete ---
  async updatePaymentVoucher(id: string, data: Partial<PaymentVoucherRecord>): Promise<Partial<PaymentVoucherRecord>> {
    const res = await axiosClient.put<any, any>(`/finance/payments/${id}`, data);
    return res?.data || res || data;
  },

  async deletePaymentVoucher(id: string): Promise<void> {
    await axiosClient.delete(`/finance/payments/${id}`);
  },

  // --- Debts CRUD ---
  async addDebtLedger(debt: Omit<DebtLedgerRecord, 'id'>): Promise<DebtLedgerRecord> {
    const res = await axiosClient.post<any, any>('/finance/debts', debt);
    const item = res?.data || res;
    return { id: String(item?.id || Date.now()), ...debt, ...(item || {}) };
  },

  async updateDebtLedger(id: string, data: Partial<DebtLedgerRecord>): Promise<Partial<DebtLedgerRecord>> {
    const res = await axiosClient.put<any, any>(`/finance/debts/${id}`, data);
    return res?.data || res || data;
  },

  async deleteDebtLedger(id: string): Promise<void> {
    await axiosClient.delete(`/finance/debts/${id}`);
  },

  // --- Operating Costs CRUD ---
  async addOperatingCost(cost: Omit<OperatingCostRecord, 'id'>): Promise<OperatingCostRecord> {
    const res = await axiosClient.post<any, any>('/finance/operating-costs', cost);
    const item = res?.data || res;
    return { id: String(item?.id || Date.now()), ...cost, ...(item || {}) };
  },

  async updateOperatingCost(id: string, data: Partial<OperatingCostRecord>): Promise<Partial<OperatingCostRecord>> {
    const res = await axiosClient.put<any, any>(`/finance/operating-costs/${id}`, data);
    return res?.data || res || data;
  },

  async deleteOperatingCost(id: string): Promise<void> {
    await axiosClient.delete(`/finance/operating-costs/${id}`);
  },

  // --- Transaction Reasons CRUD ---
  async addTransactionReason(reason: any): Promise<any> {
    const res = await axiosClient.post<any, any>('/finance/transaction-reasons', reason);
    return res?.data || res;
  },

  async updateTransactionReason(id: string, data: any): Promise<any> {
    const res = await axiosClient.put<any, any>(`/finance/transaction-reasons/${id}`, data);
    return res?.data || res || data;
  },

  async deleteTransactionReason(id: string): Promise<void> {
    await axiosClient.delete(`/finance/transaction-reasons/${id}`);
  },

  // --- Journal Entries CRUD ---
  async addJournalEntry(entry: Omit<JournalEntryRecord, 'id'>): Promise<JournalEntryRecord> {
    const res = await axiosClient.post<any, any>('/finance/journal-entries', entry);
    const item = res?.data || res;
    return { id: String(item?.id || Date.now()), ...entry, ...(item || {}) };
  },

  async updateJournalEntry(id: string, data: Partial<JournalEntryRecord>): Promise<Partial<JournalEntryRecord>> {
    const res = await axiosClient.put<any, any>(`/finance/journal-entries/${id}`, data);
    return res?.data || res || data;
  },

  async deleteJournalEntry(id: string): Promise<void> {
    await axiosClient.delete(`/finance/journal-entries/${id}`);
  },

  // --- Fixed Assets CRUD ---
  async fetchFixedAssets(): Promise<any[]> {
    const res = await axiosClient.get<any, any>('/accounting/fixed-assets');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list;
  },

  async addFixedAsset(asset: any): Promise<any> {
    const res = await axiosClient.post<any, any>('/accounting/fixed-assets', asset);
    return res?.data || res;
  },

  async updateFixedAsset(id: string, data: any): Promise<any> {
    const res = await axiosClient.put<any, any>(`/accounting/fixed-assets/${id}`, data);
    return res?.data || res || data;
  },

  async deleteFixedAsset(id: string): Promise<void> {
    await axiosClient.delete(`/accounting/fixed-assets/${id}`);
  },
};
