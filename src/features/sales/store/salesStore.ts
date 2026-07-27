import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  WALK_IN_CUSTOMER_ID,
  calcTotalAmount,
  LEGACY_CUSTOMER_NAME_TO_ID,
  paymentTermsToDueDate,
  type RefundMethod,
} from './salesHelpers';

export type { RefundMethod } from './salesHelpers';
export { WALK_IN_CUSTOMER_ID, resolveCustomerName, calcTotalAmount, formatMoney, deriveShiftId } from './salesHelpers';

export interface OrderLineItem {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SaleOrder {
  id: string;
  code: string;
  customerId: string;
  customerName?: string;
  date: string;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingFee?: number;
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PAID' | 'UNPAID';
  paymentMethod?: string;
  cashier?: string;
  createdByName?: string;
  createdByEmail?: string;
  branchId?: string | null;
  branchName?: string;
  origin?: 'POS' | 'ONLINE' | 'MANUAL';
  currency?: 'VND' | 'USD';
  itemsSummary?: string;
  orderLines?: OrderLineItem[];

  // POS — cash reconciliation
  amountTendered?: number;
  changeAmount?: number;
  shiftId?: string;

  // Online
  onlineChannel?: 'WEB' | 'APP' | 'MARKETPLACE';
  recipientName?: string;
  recipientPhone?: string;
  shippingAddress?: string;
  province?: string;
  district?: string;
  deliveryStatus?: 'CREATED' | 'CONFIRMED' | 'PICKING' | 'SHIPPED' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  shippingProvider?: string;
  trackingCode?: string;
  isCod?: boolean;
  codAmount?: number;
  paymentGatewayRef?: string;
  promoCodeApplied?: string;
}

export const BRANCH_NAME_BY_ID: Record<string, string> = {
  branch_001: 'CH Quận 1',
  'BR-001': 'CH Quận 1',
  'BR-002': 'CH Tân Bình',
  'BR-003': 'CH Gò Vấp',
  'BR-004': 'CH Quận 7',
  'BR-005': 'CH Bình Dương',
};

export interface QuoteItem {
  id: string;
  code: string;
  customerId: string;
  issueDate: string;
  revision: number;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  validUntil: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED';
  salesRep: string;
  notes?: string;
  itemsCount: number;
  orderLines?: OrderLineItem[];
}

export interface ExportInvoiceItem {
  id: string;
  invoiceNumber: string;
  customerId: string;
  taxId: string;
  billingAddress: string;
  orderIds: string[];
  issueDate: string;
  dueDate: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  status: 'ISSUED' | 'PAID' | 'CANCELLED' | 'OVERDUE';
  paymentTerms: string;
  notes?: string;
}

export interface CustomerReturnItem {
  id: string;
  returnCode: string;
  orderCode: string;
  customerId: string;
  refundAmount: number;
  refundMethod: RefundMethod;
  isRestocked: boolean;
  returnBranchId: string;
  returnDate: string;
  reason: string;
  condition: 'DEFECTIVE' | 'UNOPENED' | 'USED_DAMAGED';
  status: 'PENDING_INSPECTION' | 'APPROVED_REFUNDED' | 'REJECTED';
  inspector: string;
  notes?: string;
  returnLines?: OrderLineItem[];
}

import { axiosClient } from '@/shared/lib/axiosClient';

interface SalesState {
  saleOrders: SaleOrder[];
  quotes: QuoteItem[];
  exportInvoices: ExportInvoiceItem[];
  customerReturns: CustomerReturnItem[];

  fetchSaleOrders: () => Promise<void>;
  fetchQuotes: () => Promise<void>;
  fetchExportInvoices: () => Promise<void>;
  fetchCustomerReturns: () => Promise<void>;

  addSaleOrder: (order: Omit<SaleOrder, 'id'>) => Promise<void>;
  updateSaleOrder: (id: string, data: Partial<SaleOrder>) => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  deleteSaleOrder: (id: string) => Promise<void>;

  addQuote: (quote: Omit<QuoteItem, 'id'>) => Promise<void>;
  updateQuote: (id: string, data: Partial<QuoteItem>) => Promise<void>;
  updateQuoteStatus: (id: string, status: string) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;

  addExportInvoice: (row: Omit<ExportInvoiceItem, 'id'>) => Promise<void>;
  updateExportInvoice: (id: string, data: Partial<ExportInvoiceItem>) => Promise<void>;
  updateInvoiceStatus: (id: string, status: string) => Promise<void>;
  deleteExportInvoice: (id: string) => Promise<void>;

  addCustomerReturn: (row: Omit<CustomerReturnItem, 'id'>) => Promise<void>;
  updateCustomerReturn: (id: string, data: Partial<CustomerReturnItem>) => Promise<void>;
  updateReturnStatus: (id: string, status: string) => Promise<void>;
  deleteCustomerReturn: (id: string) => Promise<void>;
}

const defaultData = {
  saleOrders: [],
  quotes: [],
  exportInvoices: [],
  customerReturns: [],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateLegacyOrder(raw: any): SaleOrder {
  const subTotal = Number(raw.subTotal ?? raw.subtotal ?? raw.total ?? raw.totalAmount ?? 0);
  const taxAmount = Number(raw.taxAmount ?? 0);
  const discountAmount = Number(raw.discountAmount ?? 0);
  const shippingFee = raw.shippingFee != null ? Number(raw.shippingFee) : undefined;
  const customerId = raw.customerId != null ? String(raw.customerId) : (LEGACY_CUSTOMER_NAME_TO_ID[String(raw.customerName)] || WALK_IN_CUSTOMER_ID);
  const customerName = raw.customerName || raw.customer?.name || '';
  const code = raw.code || raw.orderCode || `SO-2026-${String(raw.id || '001').padStart(4, '0')}`;
  const date = raw.date || (raw.orderDate ? raw.orderDate.split('T')[0] : (raw.createdDate ? raw.createdDate.split('T')[0] : new Date().toISOString().split('T')[0]));

  return {
    ...raw,
    id: String(raw.id || Date.now()),
    code,
    customerId,
    customerName,
    date,
    subTotal,
    taxAmount,
    discountAmount,
    shippingFee,
    totalAmount: Number(raw.totalAmount ?? raw.total ?? calcTotalAmount({ subTotal, taxAmount, discountAmount, shippingFee })),
    status: raw.status || 'COMPLETED',
    paymentStatus: raw.paymentStatus || 'PAID',
    paymentMethod: raw.paymentMethod || 'Tiền mặt',
    cashier: raw.cashier || raw.createdByName || 'Thu ngân',
    createdByName: raw.createdByName || raw.cashier || 'Thu ngân',
    branchId: raw.branchId != null ? String(raw.branchId) : '1',
    branchName: raw.branchName || 'Chi nhánh Q1 (Flagship)',
    origin: raw.origin || 'POS',
    itemsSummary: raw.itemsSummary || (raw.orderLines ? raw.orderLines.map((l: any) => `${l.productName || l.sku}×${l.quantity}`).join(', ') : ''),
    orderLines: raw.orderLines || raw.details || [],
  } as SaleOrder;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateLegacyQuote(raw: any): QuoteItem {
  const subTotal = Number(raw.subTotal ?? raw.total ?? 0);
  return {
    ...raw,
    id: String(raw.id || Date.now()),
    code: raw.code || raw.quoteCode || `OF-2026-${String(raw.id || '001').padStart(4, '0')}`,
    customerId: raw.customerId != null ? String(raw.customerId) : (LEGACY_CUSTOMER_NAME_TO_ID[String(raw.customerName)] ?? '1'),
    customerName: raw.customerName || '',
    issueDate: raw.issueDate ? raw.issueDate.split('T')[0] : (raw.validUntil ? raw.validUntil.split('T')[0] : new Date().toISOString().slice(0, 10)),
    revision: Number(raw.revision ?? 1),
    subTotal,
    taxAmount: Number(raw.taxAmount ?? 0),
    discountAmount: Number(raw.discountAmount ?? 0),
    totalAmount: Number(raw.totalAmount ?? raw.total ?? subTotal),
  } as QuoteItem;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateLegacyInvoice(raw: any): ExportInvoiceItem {
  const issueDate = raw.issueDate ? raw.issueDate.split('T')[0] : (raw.createdDate ? raw.createdDate.split('T')[0] : new Date().toISOString().slice(0, 10));
  const paymentTerms = raw.paymentTerms ?? 'Net 30';
  const invoiceNumber = raw.invoiceNumber || raw.invoiceCode || raw.code || `INV-2026-${String(raw.id || '001').padStart(4, '0')}`;
  const orderIds = Array.isArray(raw.orderIds) && raw.orderIds.length > 0 ? raw.orderIds : [raw.orderCode || raw.orderId || `SO-2026-${String(raw.id || '001').padStart(4, '0')}`];
  const customerId = raw.customerId != null ? String(raw.customerId) : (LEGACY_CUSTOMER_NAME_TO_ID[String(raw.customerName)] || '1');
  const customerName = raw.customerName || '';

  return {
    ...raw,
    id: String(raw.id || Date.now()),
    invoiceNumber,
    customerId,
    customerName,
    billingAddress: raw.billingAddress ?? 'Hà Nội, Việt Nam',
    orderIds,
    issueDate,
    dueDate: raw.dueDate ? raw.dueDate.split('T')[0] : paymentTermsToDueDate(issueDate, paymentTerms),
    subtotal: Number(raw.subtotal ?? raw.subTotal ?? raw.totalAmount ?? 0),
    vatAmount: Number(raw.vatAmount ?? raw.taxAmount ?? 0),
    totalAmount: Number(raw.totalAmount ?? raw.subtotal ?? 0),
    status: raw.status || 'ISSUED',
    notes: raw.notes || '',
  } as ExportInvoiceItem;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateLegacyReturn(raw: any): CustomerReturnItem {
  return {
    ...raw,
    id: String(raw.id || Date.now()),
    customerId: raw.customerId != null ? String(raw.customerId) : (LEGACY_CUSTOMER_NAME_TO_ID[String(raw.customerName)] ?? '1'),
    refundMethod: raw.refundMethod ?? 'CASH',
    isRestocked: raw.isRestocked ?? raw.condition === 'UNOPENED',
    returnBranchId: raw.returnBranchId ?? 'BR-001',
  } as CustomerReturnItem;
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      ...defaultData,

      fetchSaleOrders: async () => {
        try {
          const res = await axiosClient.get<any, any>('/sales/orders');
          const data = extractPageContent<any>(res);
          if (Array.isArray(data) && data.length > 0) {
            const apiOrders = data.map(migrateLegacyOrder);
            const currentLocal = get().saleOrders || [];
            // Merge API items with local items without duplicating IDs
            const merged = [...apiOrders];
            currentLocal.forEach(localItem => {
              if (!merged.some(m => String(m.id) === String(localItem.id) || m.code === localItem.code)) {
                merged.push(localItem);
              }
            });
            set({ saleOrders: merged });
          }
        } catch (e) {
          console.error('Failed to fetch sale orders:', e);
        }
      },

      fetchQuotes: async () => {
        try {
          const res = await axiosClient.get<any, any>('/sales/quotes');
          const data = extractPageContent<any>(res);
          if (Array.isArray(data) && data.length > 0) {
            const apiQuotes = data.map(migrateLegacyQuote);
            const currentLocal = get().quotes || [];
            const merged = [...apiQuotes];
            currentLocal.forEach(localItem => {
              if (!merged.some(m => String(m.id) === String(localItem.id) || m.code === localItem.code)) {
                merged.push(localItem);
              }
            });
            set({ quotes: merged });
          }
        } catch (e) {
          console.error('Failed to fetch quotes:', e);
        }
      },

      fetchExportInvoices: async () => {
        try {
          const res = await axiosClient.get<any, any>('/sales/invoices');
          const data = extractPageContent<any>(res);
          if (Array.isArray(data) && data.length > 0) {
            const apiInvoices = data.map(migrateLegacyInvoice);
            const currentLocal = get().exportInvoices || [];
            const merged = [...apiInvoices];
            currentLocal.forEach(localItem => {
              if (!merged.some(m => String(m.id) === String(localItem.id) || m.invoiceNumber === localItem.invoiceNumber)) {
                merged.push(localItem);
              }
            });
            set({ exportInvoices: merged });
          }
        } catch (e) {
          console.error('Failed to fetch invoices:', e);
        }
      },

      fetchCustomerReturns: async () => {
        try {
          const res = await axiosClient.get<any, any>('/sales/returns');
          const data = extractPageContent<any>(res);
          if (Array.isArray(data) && data.length > 0) {
            const apiReturns = data.map(migrateLegacyReturn);
            const currentLocal = get().customerReturns || [];
            const merged = [...apiReturns];
            currentLocal.forEach(localItem => {
              if (!merged.some(m => String(m.id) === String(localItem.id) || m.returnCode === localItem.returnCode)) {
                merged.push(localItem);
              }
            });
            set({ customerReturns: merged });
          }
        } catch (e) {
          console.error('Failed to fetch customer returns:', e);
        }
      },

      addSaleOrder: async (order) => {
        try {
          const payload = {
            orderCode: order.code,
            orderDate: new Date().toISOString(),
            customerId: Number(order.customerId || 1),
            branchId: Number(order.branchId || 1),
            status: order.status || 'COMPLETED',
            note: (order as any).note || '',
            details: order.orderLines?.map((line: any) => ({
              productVariantId: line.productVariantId || Number(line.id) || 1,
              quantity: line.quantity,
              unitPriceSnapshot: line.unitPrice,
            })) || [],
          };
          await axiosClient.post('/sales/orders', payload);
          await get().fetchSaleOrders();
        } catch (e) {
          console.error(e);
        }
      },

      updateSaleOrder: async (id, data) => {
        try {
          await axiosClient.put(`/sales/orders/${id}`, data);
          await get().fetchSaleOrders();
        } catch (e) {
          console.error(e);
        }
      },

      updateOrderStatus: async (id, status) => {
        try {
          await axiosClient.put(`/sales/orders/${id}/status?status=${status}`);
          await get().fetchSaleOrders();
        } catch (e) {
          console.error(e);
        }
      },

      deleteSaleOrder: async (id) => {
        try {
          await axiosClient.delete(`/sales/orders/${id}`);
          await get().fetchSaleOrders();
        } catch (e) {
          console.error(e);
        }
      },

      addQuote: async (quote) => {
        try {
          await axiosClient.post('/sales/quotes', quote);
          await get().fetchQuotes();
        } catch (e) {
          console.error(e);
        }
      },

      updateQuote: async (id, data) => {
        try {
          await axiosClient.put(`/sales/quotes/${id}`, data);
          await get().fetchQuotes();
        } catch (e) {
          console.error(e);
        }
      },

      updateQuoteStatus: async (id, status) => {
        try {
          await axiosClient.put(`/sales/quotes/${id}/status?status=${status}`);
          await get().fetchQuotes();
        } catch (e) {
          console.error(e);
        }
      },

      deleteQuote: async (id) => {
        try {
          await axiosClient.delete(`/sales/quotes/${id}`);
          await get().fetchQuotes();
        } catch (e) {
          console.error(e);
        }
      },

      addExportInvoice: async (row) => {
        try {
          await axiosClient.post('/sales/invoices', row);
          await get().fetchExportInvoices();
        } catch (e) {
          console.error(e);
        }
      },

      updateExportInvoice: async (id, data) => {
        try {
          await axiosClient.put(`/sales/invoices/${id}`, data);
          await get().fetchExportInvoices();
        } catch (e) {
          console.error(e);
        }
      },

      updateInvoiceStatus: async (id, status) => {
        try {
          await axiosClient.put(`/sales/invoices/${id}/status?status=${status}`);
          await get().fetchExportInvoices();
        } catch (e) {
          console.error(e);
        }
      },

      deleteExportInvoice: async (id) => {
        try {
          await axiosClient.delete(`/sales/invoices/${id}`);
          await get().fetchExportInvoices();
        } catch (e) {
          console.error(e);
        }
      },

      addCustomerReturn: async (row) => {
        try {
          await axiosClient.post('/sales/returns', row);
          await get().fetchCustomerReturns();
        } catch (e) {
          console.error(e);
        }
      },

      updateCustomerReturn: async (id, data) => {
        try {
          await axiosClient.put(`/sales/returns/${id}`, data);
          await get().fetchCustomerReturns();
        } catch (e) {
          console.error(e);
        }
      },

      updateReturnStatus: async (id, status) => {
        try {
          await axiosClient.put(`/sales/returns/${id}/status?status=${status}`);
          await get().fetchCustomerReturns();
        } catch (e) {
          console.error(e);
        }
      },

      deleteCustomerReturn: async (id) => {
        try {
          await axiosClient.delete(`/sales/returns/${id}`);
          await get().fetchCustomerReturns();
        } catch (e) {
          console.error(e);
        }
      },
    }),
    {
      name: 'retailhub-sales-storage',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, version) => {
        if (version >= 2) return persisted as SalesState;
        const p = persisted as Partial<SalesState>;
        return {
          ...defaultData,
          ...p,
          saleOrders: (p.saleOrders ?? defaultData.saleOrders).map(migrateLegacyOrder),
          quotes: (p.quotes ?? defaultData.quotes).map(migrateLegacyQuote),
          exportInvoices: (p.exportInvoices ?? defaultData.exportInvoices).map(migrateLegacyInvoice),
          customerReturns: (p.customerReturns ?? defaultData.customerReturns).map(migrateLegacyReturn),
        };
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<SalesState> | undefined;
        if (!p || typeof p !== 'object') return current as SalesState;
        const c = current as SalesState;
        const saleOrders = (Array.isArray(p.saleOrders) ? p.saleOrders : defaultData.saleOrders).map(
          (o) => migrateLegacyOrder({ ...o, orderLines: o.orderLines?.length ? o.orderLines : [] })
        );
        const quotes = (Array.isArray(p.quotes) ? p.quotes : defaultData.quotes).map((q) =>
          migrateLegacyQuote({
            ...q,
            orderLines: q.orderLines?.length ? q.orderLines : [],
            itemsCount: q.orderLines?.length ?? q.itemsCount,
          })
        );
        const customerReturns = (Array.isArray(p.customerReturns) ? p.customerReturns : defaultData.customerReturns).map(
          (r) => migrateLegacyReturn({ ...r, returnLines: r.returnLines?.length ? r.returnLines : [] })
        );
        const exportInvoices = (Array.isArray(p.exportInvoices) ? p.exportInvoices : defaultData.exportInvoices).map(
          migrateLegacyInvoice
        );
        return { ...c, ...p, saleOrders, quotes, exportInvoices, customerReturns };
      },
    }
  )
);
