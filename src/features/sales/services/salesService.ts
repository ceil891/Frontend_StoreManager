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
      customerName: item.customerName || item.customer?.name || item.recipientName || 'Khách vãng lai',
      customerPhone: item.customerPhone || item.customer?.phone || item.recipientPhone || item.customer_phone || '',
      recipientName: item.recipientName || item.customerName || item.customer?.name || '',
      recipientPhone: item.recipientPhone || item.customerPhone || item.customer?.phone || '',
      shippingAddress: item.shippingAddress || '',
      date: item.date || item.orderDate || item.createdAt ? (item.date || item.orderDate || item.createdAt).split('T')[0] : '',
      subTotal: Number(item.subTotal || 0),
      taxAmount: Number(item.taxAmount || 0),
      discountAmount: Number(item.discountAmount || 0),
      shippingFee: Number(item.shippingFee || 0),
      totalAmount: Number(item.totalAmount || item.finalAmount || 0),
      status: item.status || 'COMPLETED',
      paymentStatus: item.paymentStatus || 'PAID',
      paymentMethod: item.paymentMethod || 'CASH',
      cashier: item.cashier || item.createdByName || 'Thu ngân POS',
      createdByName: item.createdByName || 'NV Bán hàng',
      branchId: item.branchId ? String(item.branchId) : 'BR-001',
      branchName: item.branchName || 'Chi nhánh chính',
      origin: item.origin || item.orderOrigin || 'POS',
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
      code: item.quoteCode || item.code || `QT-${item.id}`,
      customerId: item.customerId ? String(item.customerId) : '1',
      issueDate: item.quoteDate ? item.quoteDate.split('T')[0] : (item.issueDate ? item.issueDate.split('T')[0] : ''),
      revision: Number(item.revision || 1),
      currency: item.currency || 'VND',
      paymentTerms: item.paymentTerms || '',
      deliveryTerms: item.deliveryTerms || '',
      warrantyTerms: item.warrantyTerms || '',
      validityTerms: item.validityTerms || '',
      shippingAddress: item.shippingAddress || '',
      subTotal: Number(item.subTotal || 0),
      discountType: item.discountType || 'AMOUNT',
      discountValue: Number(item.discountValue || 0),
      discountAmount: Number(item.discountAmount || 0),
      shippingFee: Number(item.shippingFee || 0),
      taxRate: Number(item.taxRate || 0),
      taxAmount: Number(item.taxAmount || 0),
      totalAmount: Number(item.totalAmount || 0),
      validUntil: item.validUntil ? item.validUntil.split('T')[0] : '',
      status: item.status || 'DRAFT',
      salesRep: item.salesPersonName || item.salesRep || 'System User',
      salesPersonId: item.salesPersonId ? String(item.salesPersonId) : undefined,
      salesPersonName: item.salesPersonName || item.salesRep || 'System User',
      warehouseId: item.warehouseId ? String(item.warehouseId) : undefined,
      warehouseName: item.warehouseName || '',
      notes: item.note || item.notes || '',
      attachments: item.attachments || '',
      pdfUrl: item.pdfUrl || '',
      itemsCount: Array.isArray(item.details) ? item.details.length : Number(item.itemsCount || 1),
      orderLines: Array.isArray(item.details) ? item.details.map((d: any) => ({
        id: String(d.id || Date.now()),
        productVariantId: d.productVariantId ? String(d.productVariantId) : undefined,
        productId: d.productId ? String(d.productId) : undefined,
        sku: d.sku || d.productCode || '',
        barcode: d.barcode || '',
        productName: d.productName || d.description || 'Sản phẩm',
        unit: d.unit || 'Cái',
        description: d.description || '',
        quantity: Number(d.quantity || 1),
        unitPrice: Number(d.unitPrice || 0),
        discountType: d.discountType || 'AMOUNT',
        discountValue: Number(d.discountValue || 0),
        discountAmount: Number(d.discountAmount || d.discount || 0),
        taxRate: Number(d.taxRate || 0),
        taxAmount: Number(d.taxAmount || 0),
        lineTotal: Number(d.totalAmount || d.subTotal || 0),
      })) : (item.orderLines || []),
    }));
  },

  async addQuote(quote: Partial<QuoteItem>): Promise<QuoteItem> {
    const payload = {
      quoteCode: quote.code,
      quoteDate: quote.issueDate ? `${quote.issueDate}T00:00:00` : new Date().toISOString(),
      validUntil: quote.validUntil ? `${quote.validUntil}T23:59:59` : null,
      currency: quote.currency || 'VND',
      paymentTerms: quote.paymentTerms,
      deliveryTerms: quote.deliveryTerms,
      warrantyTerms: quote.warrantyTerms,
      validityTerms: quote.validityTerms,
      shippingAddress: quote.shippingAddress,
      subTotal: quote.subTotal,
      discountType: quote.discountType || 'AMOUNT',
      discountValue: quote.discountValue || 0,
      discountAmount: quote.discountAmount || 0,
      shippingFee: quote.shippingFee || 0,
      taxRate: quote.taxRate || 0,
      taxAmount: quote.taxAmount || 0,
      customerId: Number(quote.customerId) || 1,
      branchId: Number(quote.branchId) || 1,
      warehouseId: quote.warehouseId ? Number(quote.warehouseId) : null,
      warehouseName: quote.warehouseName,
      salesPersonId: quote.salesPersonId ? Number(quote.salesPersonId) : null,
      salesPersonName: quote.salesPersonName || quote.salesRep,
      status: quote.status || 'DRAFT',
      note: quote.notes,
      attachments: quote.attachments,
      details: (quote.orderLines || []).map((l) => ({
        productVariantId: l.productVariantId ? Number(l.productVariantId) : null,
        productId: l.productId ? Number(l.productId) : (isNaN(Number(l.id)) ? 1 : Number(l.id)),
        sku: l.sku,
        barcode: l.barcode,
        description: l.description || l.productName,
        unit: l.unit || 'Cái',
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountType: l.discountType || 'AMOUNT',
        discountValue: l.discountValue || 0,
        discount: l.discountAmount || 0,
        taxRate: l.taxRate || 0,
      })),
    };

    const res = await axiosClient.post<any, any>('/sales/quotes', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      code: item?.quoteCode || quote.code || '',
      customerId: String(item?.customerId || quote.customerId || '1'),
      issueDate: quote.issueDate || new Date().toISOString().split('T')[0],
      revision: Number(item?.revision || 1),
      currency: quote.currency || 'VND',
      subTotal: Number(item?.subTotal || quote.subTotal || 0),
      discountAmount: Number(item?.discountAmount || quote.discountAmount || 0),
      taxAmount: Number(item?.taxAmount || quote.taxAmount || 0),
      totalAmount: Number(item?.totalAmount || quote.totalAmount || 0),
      validUntil: quote.validUntil || '',
      status: (item?.status || quote.status || 'DRAFT') as any,
      salesRep: quote.salesRep || 'System User',
      itemsCount: (quote.orderLines || []).length,
      orderLines: quote.orderLines,
    };
  },

  async updateQuote(id: string, quote: Partial<QuoteItem>): Promise<Partial<QuoteItem>> {
    const payload = {
      quoteDate: quote.issueDate ? `${quote.issueDate}T00:00:00` : new Date().toISOString(),
      validUntil: quote.validUntil ? `${quote.validUntil}T23:59:59` : null,
      currency: quote.currency || 'VND',
      paymentTerms: quote.paymentTerms,
      deliveryTerms: quote.deliveryTerms,
      warrantyTerms: quote.warrantyTerms,
      validityTerms: quote.validityTerms,
      shippingAddress: quote.shippingAddress,
      subTotal: quote.subTotal,
      discountType: quote.discountType || 'AMOUNT',
      discountValue: quote.discountValue || 0,
      discountAmount: quote.discountAmount || 0,
      shippingFee: quote.shippingFee || 0,
      taxRate: quote.taxRate || 0,
      taxAmount: quote.taxAmount || 0,
      customerId: Number(quote.customerId) || 1,
      branchId: Number(quote.branchId) || 1,
      warehouseId: quote.warehouseId ? Number(quote.warehouseId) : null,
      warehouseName: quote.warehouseName,
      salesPersonId: quote.salesPersonId ? Number(quote.salesPersonId) : null,
      salesPersonName: quote.salesPersonName || quote.salesRep,
      status: quote.status || 'DRAFT',
      note: quote.notes,
      attachments: quote.attachments,
      details: (quote.orderLines || []).map((l) => ({
        productVariantId: l.productVariantId ? Number(l.productVariantId) : null,
        productId: l.productId ? Number(l.productId) : (isNaN(Number(l.id)) ? 1 : Number(l.id)),
        sku: l.sku,
        barcode: l.barcode,
        description: l.description || l.productName,
        unit: l.unit || 'Cái',
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountType: l.discountType || 'AMOUNT',
        discountValue: l.discountValue || 0,
        discount: l.discountAmount || 0,
        taxRate: l.taxRate || 0,
      })),
    };

    const res = await axiosClient.put<any, any>(`/sales/quotes/${id}`, payload);
    return res?.data || res || quote;
  },

  async deleteQuote(id: string): Promise<void> {
    await axiosClient.delete(`/sales/quotes/${id}`);
  },

  async convertQuoteToOrder(id: string): Promise<any> {
    const res = await axiosClient.post<any, any>(`/sales/quotes/${id}/convert-to-order`);
    return res?.data || res;
  },

  async downloadQuotePdf(id: string): Promise<void> {
    const res = await axiosClient.get(`/sales/quotes/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res as any], { type: 'text/html' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Quote-${id}.html`);
    document.body.appendChild(link);
    link.click();
    link.remove();
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

  async addExportInvoice(invoice: Partial<ExportInvoiceItem>): Promise<ExportInvoiceItem> {
    const payload = {
      invoiceNumber: invoice.invoiceNumber,
      customerId: Number(invoice.customerId) || 1,
      taxId: invoice.taxId,
      companyName: invoice.companyName,
      issueDate: invoice.issueDate ? `${invoice.issueDate}T00:00:00` : new Date().toISOString(),
      dueDate: invoice.dueDate ? `${invoice.dueDate}T23:59:59` : null,
      subTotal: invoice.subTotal || 0,
      taxAmount: invoice.taxAmount || 0,
      totalAmount: invoice.totalAmount || 0,
      paymentTerms: invoice.paymentTerms || 'IMMEDIATE',
      status: invoice.status || 'ISSUED',
      einvoiceRef: invoice.einvoiceRef,
      notes: invoice.notes,
    };
    const res = await axiosClient.post<any, any>('/sales/invoices', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      invoiceNumber: item?.invoiceNumber || invoice.invoiceNumber || '',
      customerId: String(item?.customerId || invoice.customerId || '1'),
      taxId: invoice.taxId || '',
      companyName: invoice.companyName || '',
      issueDate: invoice.issueDate || '',
      dueDate: invoice.dueDate || '',
      subTotal: Number(item?.subTotal || invoice.subTotal || 0),
      taxAmount: Number(item?.taxAmount || invoice.taxAmount || 0),
      totalAmount: Number(item?.totalAmount || invoice.totalAmount || 0),
      paymentTerms: (invoice.paymentTerms || 'IMMEDIATE') as any,
      status: (item?.status || invoice.status || 'ISSUED') as any,
      einvoiceRef: invoice.einvoiceRef,
      notes: invoice.notes,
    };
  },

  async updateExportInvoice(id: string, data: Partial<ExportInvoiceItem>): Promise<Partial<ExportInvoiceItem>> {
    const payload = {
      customerId: data.customerId ? Number(data.customerId) : undefined,
      taxId: data.taxId,
      companyName: data.companyName,
      issueDate: data.issueDate ? `${data.issueDate}T00:00:00` : undefined,
      dueDate: data.dueDate ? `${data.dueDate}T23:59:59` : undefined,
      subTotal: data.subTotal,
      taxAmount: data.taxAmount,
      totalAmount: data.totalAmount,
      paymentTerms: data.paymentTerms,
      status: data.status,
      einvoiceRef: data.einvoiceRef,
      notes: data.notes,
    };
    const res = await axiosClient.put<any, any>(`/sales/invoices/${id}`, payload);
    return res?.data || res || data;
  },

  async deleteExportInvoice(id: string): Promise<void> {
    await axiosClient.delete(`/sales/invoices/${id}`);
  },

  // --- Customer Returns ---
  async fetchCustomerReturns(): Promise<CustomerReturnItem[]> {
    const res = await axiosClient.get<any, any>('/sales/returns');
    const data = extractPageContent<any>(res);
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      id: String(item.id),
      returnCode: item.returnCode || `RET-${item.id}`,
      orderCode: item.originalOrderCode || item.orderCode || (item.invoice ? `INV-${item.invoice.id}` : ''),
      customerId: item.customer?.id ? String(item.customer.id) : (item.customerId ? String(item.customerId) : '1'),
      returnDate: item.returnDate ? item.returnDate.split('T')[0] : new Date().toISOString().split('T')[0],
      refundAmount: Number(item.totalRefund || item.refundAmount || 0),
      deductionAmount: Number(item.deductionAmount || 0),
      reason: item.reason || '',
      status: item.status || 'PENDING_INSPECTION',
      refundMethod: item.refundMethod || 'CASH',
      isRestocked: item.isRestocked !== undefined ? item.isRestocked : true,
      returnBranchId: item.branch?.id ? String(item.branch.id) : (item.returnBranchId || 'BR-001'),
      warehouseId: item.warehouseId ? String(item.warehouseId) : '',
      locationId: item.locationId ? String(item.locationId) : '',
      inspector: item.inspector || item.createdBy || 'Người kiểm tra',
      createdBy: item.createdBy || 'Nhân viên bán hàng',
      notes: item.note || item.notes || '',
      returnLines: Array.isArray(item.details) ? item.details.map((d: any) => ({
        id: String(d.id),
        productId: String(d.product?.id || d.productId || 1),
        productName: d.product?.name || d.productName || 'Sản phẩm',
        sku: d.product?.sku || d.sku || 'SKU-UNKNOWN',
        quantity: Number(d.quantity || 1),
        originalQty: Number(d.originalQty || d.quantity || 1),
        returnedQty: Number(d.returnedQty || 0),
        availableQty: Number(d.availableQty || d.quantity || 1),
        price: Number(d.refundPrice || d.price || 0),
        discountAmount: Number(d.discountAmount || 0),
        subTotal: Number(d.subTotal || (d.quantity * d.refundPrice) || 0),
        reason: d.reason || '',
        condition: d.condition || 'UNOPENED',
        isRestocked: d.isRestocked !== undefined ? d.isRestocked : true,
      })) : [],
    }));
  },

  async addCustomerReturn(payload: any): Promise<any> {
    const res = await axiosClient.post<any, any>('/sales/returns', payload);
    return res?.data || res;
  },

  async updateCustomerReturn(id: string, payload: any): Promise<any> {
    const res = await axiosClient.put<any, any>(`/sales/returns/${id}`, payload);
    return res?.data || res;
  },

  async updateCustomerReturnStatus(id: string, status: string): Promise<any> {
    const res = await axiosClient.put<any, any>(`/sales/returns/${id}/status?status=${status}`);
    return res?.data || res;
  },

  async deleteCustomerReturn(id: string): Promise<void> {
    await axiosClient.delete(`/sales/returns/${id}`);
  },
};
