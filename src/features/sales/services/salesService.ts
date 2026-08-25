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
      items: Array.isArray(item.details) && item.details.length > 0 ? item.details.map((d: any, idx: number) => ({
        id: String(d.id || idx + 1),
        productId: String(d.productVariantId || d.productId || idx + 1),
        productName: d.productNameSnapshot || d.productName || d.variantDescriptionSnapshot || `Sản phẩm ${idx + 1}`,
        sku: d.skuSnapshot || d.variantCode || d.sku || `SKU-${idx + 1}`,
        quantity: Number(d.quantity || 1),
        price: Number(d.unitPriceSnapshot || d.unitPrice || d.price || 0),
        subTotal: Number(d.subTotal || (d.quantity || 1) * (d.unitPriceSnapshot || 0)),
      })) : (item.items || []),
      orderLines: Array.isArray(item.details) && item.details.length > 0 ? item.details.map((d: any, idx: number) => ({
        id: String(d.id || idx + 1),
        sku: d.skuSnapshot || d.variantCode || d.sku || `SKU-${idx + 1}`,
        productName: d.productNameSnapshot || d.productName || d.variantDescriptionSnapshot || `Sản phẩm ${idx + 1}`,
        quantity: Number(d.quantity || 1),
        unitPrice: Number(d.unitPriceSnapshot || d.unitPrice || d.price || 0),
        lineTotal: Number(d.subTotal || (d.quantity || 1) * (d.unitPriceSnapshot || 0)),
      })) : (item.orderLines || []),
    }));
  },

  async addSaleOrder(order: Omit<SaleOrder, 'id'>): Promise<SaleOrder> {
    const rawDetails = (order as any).details || (order as any).items || (order as any).orderLines || [];
    const formattedDetails = rawDetails.map((d: any, idx: number) => ({
      productVariantId: Number(d.productVariantId || d.productId || d.id || 1),
      quantity: Number(d.quantity || 1),
      unitPriceSnapshot: Number(d.unitPriceSnapshot || d.unitPrice || d.price || (order.totalAmount || 0)),
    }));

    let validOrderDate = new Date().toISOString().slice(0, 19);
    if (order.date) {
      if (order.date.includes('T')) {
        validOrderDate = order.date.slice(0, 19);
      } else if (order.date.includes(' ')) {
        const parts = order.date.split(' ');
        validOrderDate = `${parts[0]}T${parts[1] ? (parts[1].length === 5 ? `${parts[1]}:00` : parts[1]) : '00:00:00'}`;
      } else {
        validOrderDate = `${order.date}T00:00:00`;
      }
    }

    const payload = {
      orderCode: order.code || `SO-${Date.now()}`,
      orderDate: validOrderDate,
      customerId: Number(order.customerId) || 1,
      branchId: Number(order.branchId) || 1,
      status: order.status || 'COMPLETED',
      customerName: order.customerName || order.recipientName || 'Khách vãng lai',
      customerPhone: order.customerPhone || order.recipientPhone || '',
      shippingAddress: order.shippingAddress || '',
      orderOrigin: order.origin || 'POS',
      paymentStatus: order.paymentStatus || 'PAID',
      note: (order as any).note || '',
      paymentMethodId: (order as any).paymentMethodId ? Number((order as any).paymentMethodId) : null,
      paymentMethodCode: (order as any).paymentMethodCode || null,
      details: formattedDetails.length > 0 ? formattedDetails : [
        {
          productVariantId: 1,
          quantity: 1,
          unitPriceSnapshot: order.totalAmount || 0,
        }
      ]
    };
    try {
      const res = await axiosClient.post<any, any>('/sales/orders', payload);
      const rawData = res?.data?.data || res?.data || res;
      const realId = String(rawData?.id || rawData?.orderId || Date.now());
      return {
        ...order,
        id: realId,
        code: rawData?.orderCode || rawData?.code || order.code,
        status: (typeof rawData?.status === 'string') ? (rawData.status as any) : (order.status || 'COMPLETED'),
        paymentStatus: (typeof rawData?.paymentStatus === 'string') ? (rawData.paymentStatus as any) : (order.paymentStatus || 'PAID'),
        origin: (rawData?.origin || rawData?.orderOrigin || order.origin || 'POS') as any,
        date: order.date || new Date().toISOString().split('T')[0],
      };
    } catch (err) {
      console.warn('Backend addSaleOrder failed, saving local POS order:', err);
      return {
        ...order,
        id: String(Date.now()),
        status: order.status || 'COMPLETED',
        paymentStatus: order.paymentStatus || 'PAID',
        origin: order.origin || 'POS',
        date: order.date || new Date().toISOString().split('T')[0],
      };
    }
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

  // --- Quote Surveys (Khảo sát báo giá) ---
  async fetchQuoteSurveys(): Promise<any[]> {
    const res = await axiosClient.get<any, any>('/sales/quote-surveys');
    const data = extractPageContent<any>(res);
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      id: String(item.id),
      surveyCode: item.surveyCode || `KS-${item.id}`,
      customerId: item.customerId ? String(item.customerId) : (item.customer?.id ? String(item.customer.id) : '1'),
      customerName: item.customerName || item.customer?.name || 'Khách hàng',
      branchId: item.branchId ? String(item.branchId) : '1',
      branchName: item.branchName || '',
      contactPerson: item.contactPerson || '',
      contactPhone: item.contactPhone || '',
      contactEmail: item.contactEmail || '',
      salespersonId: item.salespersonId ? String(item.salespersonId) : undefined,
      salespersonName: item.salespersonName || '',
      surveyDate: item.surveyDate ? item.surveyDate.split('T')[0] : '',
      responseDeadline: item.responseDeadline ? item.responseDeadline.split('T')[0] : '',
      requestedProducts: item.requestedProducts || '',
      expectedQuantity: item.expectedQuantity || '',
      expectedBudget: Number(item.expectedBudget || 0),
      technicalRequirements: item.technicalRequirements || '',
      deliveryRequirements: item.deliveryRequirements || '',
      paymentRequirements: item.paymentRequirements || '',
      potentialLevel: item.potentialLevel || 'TRUNG_BINH',
      note: item.note || '',
      attachments: item.attachments || '',
      status: item.status || 'NEW',
      quoteId: item.quoteId ? String(item.quoteId) : undefined,
      createdAt: item.createdAt || '',
      createdBy: item.createdBy || '',
    }));
  },

  async addQuoteSurvey(survey: any): Promise<any> {
    const payload = {
      surveyCode: survey.surveyCode,
      customerId: Number(survey.customerId) || 1,
      branchId: Number(survey.branchId) || 1,
      contactPerson: survey.contactPerson,
      contactPhone: survey.contactPhone,
      contactEmail: survey.contactEmail,
      salespersonId: survey.salespersonId ? Number(survey.salespersonId) : null,
      salespersonName: survey.salespersonName,
      surveyDate: survey.surveyDate ? `${survey.surveyDate}T00:00:00` : new Date().toISOString(),
      responseDeadline: survey.responseDeadline ? `${survey.responseDeadline}T23:59:59` : null,
      requestedProducts: survey.requestedProducts,
      expectedQuantity: survey.expectedQuantity,
      expectedBudget: survey.expectedBudget || 0,
      technicalRequirements: survey.technicalRequirements,
      deliveryRequirements: survey.deliveryRequirements,
      paymentRequirements: survey.paymentRequirements,
      potentialLevel: survey.potentialLevel || 'TRUNG_BINH',
      note: survey.note,
      attachments: survey.attachments,
      status: survey.status || 'NEW',
    };

    const res = await axiosClient.post<any, any>('/sales/quote-surveys', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      surveyCode: item?.surveyCode || survey.surveyCode || '',
      customerId: String(item?.customerId || survey.customerId || '1'),
      customerName: item?.customerName || survey.customerName,
      surveyDate: survey.surveyDate || new Date().toISOString().split('T')[0],
      status: item?.status || survey.status || 'NEW',
      potentialLevel: item?.potentialLevel || survey.potentialLevel || 'TRUNG_BINH',
      expectedBudget: Number(item?.expectedBudget || survey.expectedBudget || 0),
    };
  },

  async updateQuoteSurvey(id: string, survey: any): Promise<any> {
    const payload = {
      customerId: Number(survey.customerId) || 1,
      branchId: Number(survey.branchId) || 1,
      contactPerson: survey.contactPerson,
      contactPhone: survey.contactPhone,
      contactEmail: survey.contactEmail,
      salespersonId: survey.salespersonId ? Number(survey.salespersonId) : null,
      salespersonName: survey.salespersonName,
      surveyDate: survey.surveyDate ? `${survey.surveyDate}T00:00:00` : new Date().toISOString(),
      responseDeadline: survey.responseDeadline ? `${survey.responseDeadline}T23:59:59` : null,
      requestedProducts: survey.requestedProducts,
      expectedQuantity: survey.expectedQuantity,
      expectedBudget: survey.expectedBudget || 0,
      technicalRequirements: survey.technicalRequirements,
      deliveryRequirements: survey.deliveryRequirements,
      paymentRequirements: survey.paymentRequirements,
      potentialLevel: survey.potentialLevel,
      note: survey.note,
      attachments: survey.attachments,
      status: survey.status,
    };
    const res = await axiosClient.put<any, any>(`/sales/quote-surveys/${id}`, payload);
    return res?.data || res || survey;
  },

  async updateQuoteSurveyStatus(id: string, status: string): Promise<any> {
    const res = await axiosClient.put<any, any>(`/sales/quote-surveys/${id}/status?status=${status}`);
    return res?.data || res;
  },

  async deleteQuoteSurvey(id: string): Promise<void> {
    await axiosClient.delete(`/sales/quote-surveys/${id}`);
  },

  async convertQuoteSurveyToQuote(id: string): Promise<QuoteItem> {
    const res = await axiosClient.post<any, any>(`/sales/quote-surveys/${id}/convert-to-quote`);
    const item = res?.data || res;
    return {
      id: String(item.id),
      code: item.quoteCode || `QT-${item.id}`,
      customerId: String(item.customerId || '1'),
      issueDate: item.quoteDate ? item.quoteDate.split('T')[0] : new Date().toISOString().split('T')[0],
      revision: 1,
      subTotal: Number(item.subTotal || 0),
      discountAmount: Number(item.discountAmount || 0),
      taxAmount: Number(item.taxAmount || 0),
      totalAmount: Number(item.totalAmount || 0),
      validUntil: item.validUntil ? item.validUntil.split('T')[0] : '',
      status: item.status || 'DRAFT',
      salesRep: item.salesPersonName || 'System User',
      itemsCount: Array.isArray(item.details) ? item.details.length : 1,
    };
  },

  // --- Return Requests ---
  async fetchReturnRequests(): Promise<ReturnRequestItem[]> {
    const res = await axiosClient.get<any, any>('/sales/return-requests');
    const data = extractPageContent<any>(res);
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      id: String(item.id),
      requestCode: item.requestCode || `RR-${item.id}`,
      orderCode: item.orderCode || '',
      customerId: String(item.customerId || '1'),
      customerName: item.customerName || 'Khách hàng',
      customerPhone: item.customerPhone || '',
      requestedQty: Number(item.requestedQty || 1),
      returnedQty: Number(item.returnedQty || 0),
      remainingQty: Number(item.remainingQty !== undefined ? item.remainingQty : (item.requestedQty || 1)),
      reason: item.reason || '',
      status: item.status || 'PENDING',
      refundMethod: item.refundMethod || 'CASH',
      requestDate: item.requestDate ? item.requestDate.split('T')[0] : new Date().toISOString().split('T')[0],
      items: item.items || [],
    }));
  },

  async addReturnRequest(req: Partial<ReturnRequestItem>): Promise<ReturnRequestItem> {
    const res = await axiosClient.post<any, any>('/sales/return-requests', req);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      requestCode: item?.requestCode || req.requestCode || '',
      orderCode: req.orderCode || '',
      customerId: String(req.customerId || '1'),
      customerName: req.customerName || 'Khách hàng',
      customerPhone: req.customerPhone || '',
      requestedQty: Number(req.requestedQty || 1),
      returnedQty: 0,
      remainingQty: Number(req.requestedQty || 1),
      reason: req.reason || '',
      status: (item?.status || req.status || 'PENDING') as any,
      refundMethod: (req.refundMethod || 'CASH') as any,
      requestDate: req.requestDate || new Date().toISOString().split('T')[0],
      items: req.items || [],
    };
  },

  async updateReturnRequestStatus(id: string, status: string): Promise<any> {
    const res = await axiosClient.put<any, any>(`/sales/return-requests/${id}/status?status=${status}`);
    return res?.data || res;
  },
};
