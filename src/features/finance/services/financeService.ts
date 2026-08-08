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
};
