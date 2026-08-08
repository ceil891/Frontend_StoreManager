import { axiosClient } from '@/shared/lib/axiosClient';
import { extractPageContent } from '@/shared/lib/apiHelpers';
import type { SaleOrder, QuoteItem, ExportInvoiceItem, CustomerReturnItem } from '../store/salesStore';

export const salesService = {
  // --- Sale Orders ---
  async fetchSaleOrders(): Promise<SaleOrder[]> {
    const res = await axiosClient.get<any, any>('/sales/orders');
    const data = extractPageContent<any>(res);
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      id: String(item.id),
      code: item.code || item.orderCode || `SO-${item.id}`,
      customerId: item.customerId ? String(item.customerId) : '1',
      customerName: item.customerName || item.customer?.name || 'Khách vãng lai',
      date: item.date || item.createdAt ? (item.date || item.createdAt).split('T')[0] : '',
      subTotal: Number(item.subTotal || 0),
      taxAmount: Number(item.taxAmount || 0),
      discountAmount: Number(item.discountAmount || 0),
      shippingFee: Number(item.shippingFee || 0),
      totalAmount: Number(item.totalAmount || 0),
      status: item.status || 'COMPLETED',
      paymentStatus: item.paymentStatus || 'PAID',
      paymentMethod: item.paymentMethod || 'CASH',
      cashier: item.cashier || item.createdByName || 'Thu ngân POS',
      createdByName: item.createdByName || 'NV Bán hàng',
      branchId: item.branchId ? String(item.branchId) : 'BR-001',
      branchName: item.branchName || 'Chi nhánh chính',
      origin: item.origin || 'POS',
    }));
  },

  async addSaleOrder(order: Omit<SaleOrder, 'id'>): Promise<SaleOrder> {
    const res = await axiosClient.post<any, any>('/sales/orders', order);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...order,
      ...(item || {}),
    };
  },

  async updateSaleOrder(id: string, data: Partial<SaleOrder>): Promise<Partial<SaleOrder>> {
    const res = await axiosClient.put<any, any>(`/sales/orders/${id}`, data);
    return res?.data || res || data;
  },

  async deleteSaleOrder(id: string): Promise<void> {
    await axiosClient.delete(`/sales/orders/${id}`);
  },

  // --- Quotes ---
  async fetchQuotes(): Promise<QuoteItem[]> {
    const res = await axiosClient.get<any, any>('/sales/quotes');
    const data = extractPageContent<any>(res);
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      id: String(item.id),
      code: item.code || `QO-${item.id}`,
      customerId: item.customerId ? String(item.customerId) : '1',
      issueDate: item.issueDate ? item.issueDate.split('T')[0] : '',
      revision: Number(item.revision || 1),
      subTotal: Number(item.subTotal || 0),
      taxAmount: Number(item.taxAmount || 0),
      discountAmount: Number(item.discountAmount || 0),
      totalAmount: Number(item.totalAmount || 0),
      validUntil: item.validUntil ? item.validUntil.split('T')[0] : '',
      status: item.status || 'SENT',
      salesRep: item.salesRep || 'NV Tư vấn',
      notes: item.notes || '',
      itemsCount: Number(item.itemsCount || 1),
    }));
  },

  async addQuote(quote: Omit<QuoteItem, 'id'>): Promise<QuoteItem> {
    const res = await axiosClient.post<any, any>('/sales/quotes', quote);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...quote,
      ...(item || {}),
    };
  },

  async updateQuote(id: string, data: Partial<QuoteItem>): Promise<Partial<QuoteItem>> {
    const res = await axiosClient.put<any, any>(`/sales/quotes/${id}`, data);
    return res?.data || res || data;
  },

  async deleteQuote(id: string): Promise<void> {
    await axiosClient.delete(`/sales/quotes/${id}`);
  },

  // --- Export Invoices ---
  async fetchExportInvoices(): Promise<ExportInvoiceItem[]> {
    const res = await axiosClient.get<any, any>('/sales/invoices');
    const data = extractPageContent<any>(res);
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      id: String(item.id),
      invoiceNumber: item.invoiceNumber || `INV-${item.id}`,
      customerId: item.customerId ? String(item.customerId) : '1',
      taxId: item.taxId || '',
      companyName: item.companyName || '',
      issueDate: item.issueDate ? item.issueDate.split('T')[0] : '',
      dueDate: item.dueDate ? item.dueDate.split('T')[0] : '',
      subTotal: Number(item.subTotal || 0),
      taxAmount: Number(item.taxAmount || 0),
      totalAmount: Number(item.totalAmount || 0),
      paymentTerms: item.paymentTerms || 'IMMEDIATE',
      status: item.status || 'ISSUED',
      einvoiceRef: item.einvoiceRef || '',
      notes: item.notes || '',
    }));
  },

  // --- Customer Returns ---
  async fetchCustomerReturns(): Promise<CustomerReturnItem[]> {
    const res = await axiosClient.get<any, any>('/sales/returns');
    const data = extractPageContent<any>(res);
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      id: String(item.id),
      returnCode: item.returnCode || `RET-${item.id}`,
      originalOrderCode: item.originalOrderCode || '',
      customerId: item.customerId ? String(item.customerId) : '1',
      returnDate: item.returnDate ? item.returnDate.split('T')[0] : '',
      refundAmount: Number(item.refundAmount || 0),
      reason: item.reason || '',
      status: item.status || 'COMPLETED',
      refundMethod: item.refundMethod || 'CASH',
      isRestocked: !!item.isRestocked,
      returnBranchId: item.returnBranchId || 'BR-001',
    }));
  },
};
