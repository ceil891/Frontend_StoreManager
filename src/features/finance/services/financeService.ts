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
    const res = await axiosClient.get<any, any>('/finance/receipt-vouchers');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      voucherCode: item.voucherCode || `RV-${item.id}`,
      payerName: item.payerName || '',
      paymentReason: item.paymentReason || item.reason?.reasonName || '',
      amount: Number(item.amount || 0),
      paymentMethod: item.paymentMethod || 'BANK_TRANSFER',
      createdDate: item.voucherDate
        ? item.voucherDate.split('T')[0]
        : (item.createdAt ? item.createdAt.split('T')[0] : ''),
      status: item.status || 'COMPLETED',
      createdByName: item.createdByName || item.cashier || 'Kế toán viên',
    }));
  },

  async addReceiptVoucher(voucher: any): Promise<ReceiptVoucherRecord> {
    const rawDate = voucher.voucherDate || voucher.createdDate || voucher.receivedDate;
    const formattedDate = rawDate
      ? (rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00`)
      : new Date().toISOString().substring(0, 19);

    const payload = {
      voucherCode: voucher.voucherCode || voucher.voucherNumber,
      voucherDate: formattedDate,
      amount: Number(voucher.amount || 0),
      payerName: voucher.payerName || '',
      status: voucher.status || 'COMPLETED',
      paymentMethod: voucher.paymentMethod || 'BANK_TRANSFER',
      fundAccountName: voucher.fundAccountName || '',
      invoiceCode: voucher.invoiceCode || voucher.referenceDoc || '',
      notes: voucher.notes || '',
    };
    const res = await axiosClient.post<any, any>('/finance/receipt-vouchers', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      voucherNumber: item?.voucherNumber || item?.voucherCode || payload.voucherCode || '',
      voucherCode: item?.voucherCode || payload.voucherCode || '',
      payerName: item?.payerName || payload.payerName || '',
      category: 'SALES_REVENUE' as const,
      amount: Number(item?.amount || payload.amount),
      paymentMethod: payload.paymentMethod as any,
      receivedDate: formattedDate.split('T')[0],
      cashier: 'Kế toán viên',
      branchId: '1',
      createdDate: formattedDate.split('T')[0],
      status: item?.status || payload.status,
      createdByName: '',
      invoiceCode: payload.invoiceCode,
      referenceDoc: payload.invoiceCode,
    };
  },

  // --- Payment Vouchers ---
  async fetchPaymentVouchers(): Promise<any[]> {
    const res = await axiosClient.get<any, any>('/finance/payment-vouchers');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      voucherCode: item.voucherCode || `PV-${item.id}`,
      recipientName: item.receiverName || item.recipientName || '',
      payeeName: item.receiverName || item.recipientName || '',
      paymentReason: item.paymentReason || item.notes || '',
      notes: item.notes || item.paymentReason || '',
      amount: Number(item.amount || 0),
      paymentMethod: item.paymentMethod || 'BANK_TRANSFER',
      createdDate: item.voucherDate
        ? item.voucherDate.split('T')[0]
        : (item.createdAt ? item.createdAt.split('T')[0] : ''),
      paymentDate: item.voucherDate
        ? item.voucherDate.split('T')[0]
        : (item.createdAt ? item.createdAt.split('T')[0] : ''),
      status: item.status || 'PENDING_APPROVAL',
      createdByName: item.handler || item.createdByName || 'Kế toán viên',
      approver: item.handler || item.createdByName || 'Super Admin',
      fundAccountName: item.fundAccountName || '',
      bankAccountRef: item.fundAccountName || '',
      invoiceCode: item.invoiceCode || '',
      referenceDoc: item.invoiceCode || '',
      attachmentUrl: item.attachmentUrl || '',
      attachments: item.attachmentUrl ? [item.attachmentUrl] : [],
    }));
  },

  async addPaymentVoucher(voucher: any): Promise<any> {
    const rawDate = voucher.voucherDate || voucher.paymentDate || voucher.createdDate;
    const formattedDate = rawDate
      ? (rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00`)
      : new Date().toISOString().substring(0, 19);

    const payload = {
      voucherCode: voucher.voucherCode || voucher.voucherNumber,
      voucherDate: formattedDate,
      amount: Number(voucher.amount || 0),
      receiverName: voucher.receiverName || voucher.recipientName || voucher.payeeName || '',
      status: voucher.status || 'PENDING_APPROVAL',
      paymentMethod: voucher.paymentMethod || 'BANK_TRANSFER',
      fundAccountName: voucher.fundAccountName || voucher.bankAccountRef || '',
      invoiceCode: voucher.invoiceCode || voucher.referenceDoc || '',
      handler: voucher.handler || voucher.approver || '',
      notes: voucher.notes || '',
      attachmentUrl: voucher.attachmentUrl || (Array.isArray(voucher.attachments) ? voucher.attachments[0] : '') || '',
    };
    const res = await axiosClient.post<any, any>('/finance/payment-vouchers', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      voucherCode: item?.voucherCode || payload.voucherCode || '',
      recipientName: item?.receiverName || payload.receiverName,
      payeeName: item?.receiverName || payload.receiverName,
      paymentReason: payload.notes,
      notes: payload.notes,
      amount: Number(item?.amount || payload.amount),
      paymentMethod: payload.paymentMethod,
      createdDate: formattedDate.split('T')[0],
      paymentDate: formattedDate.split('T')[0],
      status: item?.status || payload.status,
      createdByName: payload.handler,
      approver: payload.handler,
      fundAccountName: payload.fundAccountName,
      bankAccountRef: payload.fundAccountName,
      invoiceCode: payload.invoiceCode,
      referenceDoc: payload.invoiceCode,
      attachmentUrl: payload.attachmentUrl,
      attachments: payload.attachmentUrl ? [payload.attachmentUrl] : [],
    };
  },

  // --- Debt Ledgers ---
  async fetchDebtLedgers(): Promise<DebtLedgerRecord[]> {
    const res = await axiosClient.get<any, any>('/finance/debts');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      debtCode: item.refCode || `DBT-${item.id}`,
      entityName: item.entityName || '',
      entityType: item.entityType || 'CUSTOMER',
      partnerCode: item.refCode || `PART-${item.id}`,
      partnerName: item.entityName || '',
      partnerType: item.entityType || 'CUSTOMER',
      totalDebt: Number(item.balance ?? item.totalDebt ?? 0),
      dueAmount: Number(item.balance ?? item.dueAmount ?? 0),
      openingDebt: Number(item.increase || 0),
      incurredDebt: Number(item.decrease || 0),
      paidDebt: Number(item.decrease || 0),
      paidAmount: Number(item.decrease || 0),
      closingDebt: Number(item.balance ?? item.totalDebt ?? 0),
      increase: Number(item.increase || 0),
      decrease: Number(item.decrease || 0),
      lastPaymentDate: item.lastPaymentDate ? String(item.lastPaymentDate).split('T')[0] : '',
      lastTransactionDate: item.lastPaymentDate ? String(item.lastPaymentDate).split('T')[0] : '',
      dueDate: item.dueDate ? String(item.dueDate).split('T')[0] : '',
      status: item.status || 'NORMAL',
      accountManager: item.accountManager || 'Kế toán công nợ',
      partnerId: item.partnerId,
      branchId: '1',
      notes: item.notes || '',
      referenceDoc: item.refCode || '',
      incurredDate: item.transactionDate ? String(item.transactionDate).split('T')[0] : '',
    }));
  },

  // --- Bank Accounts ---
  async fetchBankAccounts(): Promise<any[]> {
    const res = await axiosClient.get<any, any>('/finance/bank-accounts');
    const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      bankName: item.bankName || '',
      accountNumber: item.accountNumber || '',
      accountHolder: item.accountHolder || 'CÔNG TY TNHH BÁN LẺ RETAILHUB',
      branchName: item.branchName || 'Hội sở chính',
      swiftBic: item.swiftBic || (item.bankName?.includes('Techcombank') ? 'TCBVNVX' : item.bankName?.includes('Vietcombank') ? 'BFTVVNVX' : item.bankName?.includes('MB') ? 'MBBEVNVX' : item.bankName?.includes('VPBank') ? 'VPBKVNVX' : 'BANKVNVX'),
      currency: item.currency || 'VND',
      currentBalance: Number(item.currentBalance || 0),
      availableWorkingCapital: Number(item.availableWorkingCapital || item.currentBalance || 0),
      accountType: item.accountType || 'PRIMARY_OPERATING',
      status: item.status || 'ACTIVE',
      openedDate: item.openedDate || '2024-01-15',
    }));
  },

  async addBankAccount(acc: any): Promise<any> {
    const res = await axiosClient.post<any, any>('/finance/bank-accounts', acc);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...acc,
      ...(item || {}),
    };
  },

  async updateBankAccount(id: string, data: any): Promise<any> {
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
      costCategory: item.category || item.costCategory || 'RENTAL',
      category: item.category || 'RENTAL',
      costName: item.description || item.costName || item.title || 'Chi phí vận hành',
      title: item.description || item.costName || item.title || 'Chi phí vận hành',
      amount: Number(item.amount || 0),
      incurredDate: item.costDate ? item.costDate.split('T')[0] : (item.incurredDate ? item.incurredDate.split('T')[0] : ''),
      branch: item.branchName || 'Hội sở chính',
      branchName: item.branchName || 'Hội sở chính',
      branchId: item.branchId ? String(item.branchId) : '1',
      paymentStatus: item.status || item.paymentStatus || 'PAID',
      notes: item.description || item.notes || '',
      description: item.description || '',
    }));
  },

  // --- Journal Entries ---
  async fetchJournalEntries(): Promise<JournalEntryRecord[]> {
    const res = await axiosClient.get<any, any>('/accounting/journal-entries');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      code: item.referenceCode || item.entryCode || `JE-${item.id}`,
      entryCode: item.referenceCode || item.entryCode || `JE-${item.id}`,
      reference: item.referenceCode || item.entryCode || '',
      date: item.entryDate ? item.entryDate.split('T')[0] : (item.transactionDate ? item.transactionDate.split('T')[0] : ''),
      transactionDate: item.entryDate ? item.entryDate.split('T')[0] : (item.transactionDate ? item.transactionDate.split('T')[0] : ''),
      description: item.description || '',
      debitAccount: item.debitAccount || (item.lines && item.lines[0]?.accountCode) || '111',
      creditAccount: item.creditAccount || (item.lines && item.lines[1]?.accountCode) || '131',
      amount: Number(item.totalAmount || item.amount || 0),
      status: (item.status === 'POSTED' || item.status === 'DRAFT') ? item.status : 'POSTED',
      branchId: '1',
      lines: Array.isArray(item.lines) ? item.lines.map((l: any, idx: number) => ({
        id: String(l.id || `line_${idx}_${Date.now()}`),
        accountCode: l.accountCode || '111',
        accountName: l.accountName || '',
        description: l.description || '',
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
        costCenter: l.costCenter || '',
        currency: 'VND',
        exchangeRate: 1,
        originalAmount: Number(l.debit || l.credit || 0),
      })) : [],
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
  async updatePaymentVoucher(id: string, voucher: any): Promise<any> {
    const rawDate = voucher.voucherDate || voucher.paymentDate || voucher.createdDate;
    const formattedDate = rawDate
      ? (rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00`)
      : new Date().toISOString().substring(0, 19);

    const payload = {
      voucherCode: voucher.voucherCode || voucher.voucherNumber,
      voucherDate: formattedDate,
      amount: Number(voucher.amount || 0),
      receiverName: voucher.receiverName || voucher.recipientName || voucher.payeeName || '',
      status: voucher.status || 'PENDING_APPROVAL',
      paymentMethod: voucher.paymentMethod || 'BANK_TRANSFER',
      fundAccountName: voucher.fundAccountName || voucher.bankAccountRef || '',
      invoiceCode: voucher.invoiceCode || voucher.referenceDoc || '',
      handler: voucher.handler || voucher.approver || '',
      notes: voucher.notes || voucher.paymentReason || '',
      attachmentUrl: voucher.attachmentUrl || (Array.isArray(voucher.attachments) ? voucher.attachments[0] : '') || '',
    };
    const res = await axiosClient.put<any, any>(`/finance/payment-vouchers/${id}`, payload);
    return res?.data || res || payload;
  },

  async deletePaymentVoucher(id: string): Promise<void> {
    await axiosClient.delete(`/finance/payment-vouchers/${id}`);
  },

  // --- Fund Balances CRUD ---
  async fetchFundBalances(): Promise<any[]> {
    const res = await axiosClient.get<any, any>('/finance/fund-balances');
    const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      balanceDate: item.balanceDate ? String(item.balanceDate).split('T')[0] : new Date().toISOString().split('T')[0],
      cashOnHand: Number(item.cashBalance || 0),
      bankBalance: Number(item.bankBalance || 0),
      totalFund: Number(item.cashBalance || 0) + Number(item.bankBalance || 0),
      branch: item.branchName || 'Chi nhánh Hội sở chính',
      manager: item.managerName || 'Thủ quỹ',
    }));
  },

  async addFundBalance(fund: any): Promise<any> {
    const payload = {
      balanceDate: fund.balanceDate,
      cashBalance: Number(fund.cashOnHand || 0),
      bankBalance: Number(fund.bankBalance || 0),
      branchName: fund.branch || '',
      managerName: fund.manager || 'Thủ quỹ',
    };
    const res = await axiosClient.post<any, any>('/finance/fund-balances', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...fund,
      totalFund: Number(fund.cashOnHand || 0) + Number(fund.bankBalance || 0),
    };
  },

  async updateFundBalance(id: string, fund: any): Promise<any> {
    const payload = {
      balanceDate: fund.balanceDate,
      cashBalance: Number(fund.cashOnHand || 0),
      bankBalance: Number(fund.bankBalance || 0),
      branchName: fund.branch || '',
      managerName: fund.manager || 'Thủ quỹ',
    };
    const res = await axiosClient.put<any, any>(`/finance/fund-balances/${id}`, payload);
    return res?.data || res || fund;
  },

  async deleteFundBalance(id: string): Promise<void> {
    await axiosClient.delete(`/finance/fund-balances/${id}`);
  },

  // --- Debts CRUD ---
  async fetchTransactionReasons(): Promise<any[]> {
    const res = await axiosClient.get<any, any>('/finance/transaction-reasons');
    const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      reasonCode: item.reasonCode || `RSN-${item.id}`,
      reasonName: item.reasonName || 'Lý do giao dịch',
      category: item.type === 'RECEIPT' ? 'OPERATING_REVENUE' : 'COST_OF_GOODS',
      accountingGLCode: item.accountingCode ? `TK-${item.accountingCode}` : 'GL-40100',
      cashFlowImpact: item.type === 'RECEIPT' ? 'INFLOW_DEBIT' : 'OUTFLOW_CREDIT',
      isTaxDeductible: true,
      requiresReceiptUpload: true,
      totalLoggedVolumeUsd: 150000000,
      status: 'ACTIVE',
      applicableDepartments: 'Tất cả phòng ban',
      description: item.description || '',
    }));
  },

  async addTransactionReason(reason: any): Promise<any> {
    const payload = {
      reasonCode: reason.reasonCode,
      reasonName: reason.reasonName,
      type: reason.cashFlowImpact === 'OUTFLOW_CREDIT' ? 'PAYMENT' : 'RECEIPT',
      accountingCode: (reason.accountingGLCode || '').replace(/^TK-|^GL-/, '') || '511',
      description: reason.description || '',
    };
    const res = await axiosClient.post<any, any>('/finance/transaction-reasons', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...reason,
    };
  },

  async updateTransactionReason(id: string, reason: any): Promise<any> {
    const payload = {
      reasonCode: reason.reasonCode,
      reasonName: reason.reasonName,
      type: reason.cashFlowImpact === 'OUTFLOW_CREDIT' ? 'PAYMENT' : 'RECEIPT',
      accountingCode: (reason.accountingGLCode || '').replace(/^TK-|^GL-/, '') || '511',
      description: reason.description || '',
    };
    const res = await axiosClient.put<any, any>(`/finance/transaction-reasons/${id}`, payload);
    return res?.data || res || reason;
  },

  async deleteTransactionReason(id: string): Promise<void> {
    await axiosClient.delete(`/finance/transaction-reasons/${id}`);
  },

  async fetchTaxDuties(): Promise<any[]> {
    const res = await axiosClient.get<any, any>('/finance/tax-duties');
    const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      type: item.taxType || 'Thuế GTGT',
      period: item.period || 'Q3-2026',
      amountDue: Number(item.amountDue || 0),
      amountPaid: Number(item.amountPaid || 0),
      status: item.status === 'PAID' ? 'ĐÃ_HOÀN_THÀNH' : 'CHƯA_HOÀN_THÀNH',
    }));
  },

  async addTaxDuty(tax: any): Promise<any> {
    const payload = {
      taxType: tax.type,
      period: tax.period,
      amountDue: Number(tax.amountDue || 0),
      amountPaid: Number(tax.amountPaid || 0),
      status: tax.status === 'ĐÃ_HOÀN_THÀNH' ? 'PAID' : 'UNPAID',
    };
    const res = await axiosClient.post<any, any>('/finance/tax-duties', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...tax,
    };
  },

  async updateTaxDuty(id: string, tax: any): Promise<any> {
    const payload = {
      taxType: tax.type,
      period: tax.period,
      amountDue: Number(tax.amountDue || 0),
      amountPaid: Number(tax.amountPaid || 0),
      status: tax.status === 'ĐÃ_HOÀN_THÀNH' ? 'PAID' : 'UNPAID',
    };
    const res = await axiosClient.put<any, any>(`/finance/tax-duties/${id}`, payload);
    return res?.data || res || tax;
  },

  async deleteTaxDuty(id: string): Promise<void> {
    await axiosClient.delete(`/finance/tax-duties/${id}`);
  },

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

  // --- Journal Entries CRUD ---
  async addJournalEntry(entry: Omit<JournalEntryRecord, 'id'>): Promise<JournalEntryRecord> {
    const payload = {
      ...entry,
      referenceCode: entry.code || (entry as any).entryCode || '',
      code: entry.code || (entry as any).entryCode || '',
      description: entry.description || '',
      status: entry.status || 'POSTED',
      entryDate: entry.date || (entry as any).transactionDate || new Date().toISOString().substring(0, 10),
      date: entry.date || (entry as any).transactionDate || new Date().toISOString().substring(0, 10),
      totalAmount: (entry as any).totalAmount || (entry as any).amount || (entry.lines ? entry.lines.reduce((s, l) => s + (l.debit || 0), 0) : 0),
      lines: entry.lines || [],
    };
    const res = await axiosClient.post<any, any>('/accounting/journal-entries', payload);
    const item = res?.data || res;
    return { id: String(item?.id || Date.now()), ...entry, ...(item || {}) };
  },

  async updateJournalEntry(id: string, data: Partial<JournalEntryRecord>): Promise<Partial<JournalEntryRecord>> {
    const payload = {
      ...data,
      referenceCode: data.code || (data as any).entryCode || (data as any).referenceCode,
      code: data.code || (data as any).entryCode || (data as any).referenceCode,
      entryDate: data.date || (data as any).transactionDate || (data as any).entryDate,
      date: data.date || (data as any).transactionDate || (data as any).entryDate,
      totalAmount: (data as any).totalAmount || (data as any).amount || (data.lines ? data.lines.reduce((s, l) => s + (l.debit || 0), 0) : undefined),
    };
    const res = await axiosClient.put<any, any>(`/accounting/journal-entries/${id}`, payload);
    return res?.data || res || data;
  },

  async deleteJournalEntry(id: string): Promise<void> {
    await axiosClient.delete(`/accounting/journal-entries/${id}`);
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

  // --- Depreciation History CRUD ---
  async fetchDepreciations(): Promise<any[]> {
    const res = await axiosClient.get<any, any>('/accounting/depreciation-history');
    const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      assetCode: item.asset?.assetCode || item.assetCode || `FA-${item.id}`,
      assetName: item.asset?.assetName || item.assetName || 'Tài sản cố định',
      depreciationMonth: item.depreciationDate ? String(item.depreciationDate).substring(0, 7) : new Date().toISOString().substring(0, 7),
      monthlyAmount: Number(item.amount || 0),
      accumulatedTotal: Number(item.accumulated || 0),
      netValue: Number(item.netValue || 0),
    }));
  },

  async addDepreciation(dep: any): Promise<any> {
    const payload = {
      asset: { id: dep.assetId || 1 },
      depreciationDate: dep.depDate || new Date().toISOString().substring(0, 10),
      amount: dep.monthlyAmount || dep.depAmount || 0,
      accumulated: dep.accumulatedTotal || dep.accumulatedDep || 0,
      netValue: dep.netBookValue || 0,
    };
    try {
      const res = await axiosClient.post<any, any>('/accounting/depreciation-history', payload);
      return res?.data || res;
    } catch {
      return { id: String(Date.now()), ...dep };
    }
  },

  async updateDepreciation(id: string, dep: any): Promise<any> {
    const payload = {
      depreciationDate: dep.depDate || new Date().toISOString().substring(0, 10),
      amount: dep.monthlyAmount || dep.depAmount || 0,
      accumulated: dep.accumulatedTotal || dep.accumulatedDep || 0,
      netValue: dep.netBookValue || 0,
    };
    try {
      const res = await axiosClient.put<any, any>(`/accounting/depreciation-history/${id}`, payload);
      return res?.data || res || dep;
    } catch {
      return { id, ...dep };
    }
  },

  async deleteDepreciation(id: string): Promise<void> {
    await axiosClient.delete(`/accounting/depreciation-history/${id}`);
  },
};
