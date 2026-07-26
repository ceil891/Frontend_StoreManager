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
  deleteSaleOrder: (id: string) => Promise<void>;

  addQuote: (quote: Omit<QuoteItem, 'id'>) => Promise<void>;
  updateQuote: (id: string, data: Partial<QuoteItem>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;

  addExportInvoice: (row: Omit<ExportInvoiceItem, 'id'>) => Promise<void>;
  updateExportInvoice: (id: string, data: Partial<ExportInvoiceItem>) => Promise<void>;
  deleteExportInvoice: (id: string) => Promise<void>;

  addCustomerReturn: (row: Omit<CustomerReturnItem, 'id'>) => Promise<void>;
  updateCustomerReturn: (id: string, data: Partial<CustomerReturnItem>) => Promise<void>;
  deleteCustomerReturn: (id: string) => Promise<void>;
}

const defaultData = {
  saleOrders: [],
  quotes: [],
  exportInvoices: [],
  customerReturns: [],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateLegacyOrder(raw: any): SaleOrder {
  const subTotal = Number(raw.subTotal ?? raw.total ?? 0);
  const taxAmount = Number(raw.taxAmount ?? 0);
  const discountAmount = Number(raw.discountAmount ?? 0);
  const shippingFee = raw.shippingFee != null ? Number(raw.shippingFee) : undefined;
  const customerId =
    raw.customerId ??
    LEGACY_CUSTOMER_NAME_TO_ID[String(raw.customerName)] ??
    WALK_IN_CUSTOMER_ID;
  return {
    ...raw,
    customerId,
    subTotal,
    taxAmount,
    discountAmount,
    shippingFee,
    totalAmount: Number(
      raw.totalAmount ?? calcTotalAmount({ subTotal, taxAmount, discountAmount, shippingFee })
    ),
  } as SaleOrder;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateLegacyQuote(raw: any): QuoteItem {
  const subTotal = Number(raw.subTotal ?? raw.total ?? 0);
  return {
    ...raw,
    customerId: raw.customerId ?? LEGACY_CUSTOMER_NAME_TO_ID[String(raw.customerName)] ?? '1',
    issueDate: raw.issueDate ?? raw.validUntil ?? new Date().toISOString().slice(0, 10),
    revision: Number(raw.revision ?? 1),
    subTotal,
    taxAmount: Number(raw.taxAmount ?? 0),
    discountAmount: Number(raw.discountAmount ?? 0),
    totalAmount: Number(raw.totalAmount ?? raw.total ?? subTotal),
  } as QuoteItem;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateLegacyInvoice(raw: any): ExportInvoiceItem {
  const issueDate = raw.issueDate ?? new Date().toISOString().slice(0, 10);
  const paymentTerms = raw.paymentTerms ?? 'Net 30';
  return {
    ...raw,
    customerId: raw.customerId ?? LEGACY_CUSTOMER_NAME_TO_ID[String(raw.customerName)] ?? '1',
    billingAddress: raw.billingAddress ?? '',
    orderIds: Array.isArray(raw.orderIds) ? raw.orderIds : [],
    dueDate: raw.dueDate ?? paymentTermsToDueDate(issueDate, paymentTerms),
  } as ExportInvoiceItem;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateLegacyReturn(raw: any): CustomerReturnItem {
  return {
    ...raw,
    customerId: raw.customerId ?? LEGACY_CUSTOMER_NAME_TO_ID[String(raw.customerName)] ?? '1',
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
          const data = res.content || res || [];
          set({ saleOrders: Array.isArray(data) ? data.map(migrateLegacyOrder) : [] });
        } catch (e) {
          console.error('Failed to fetch sale orders:', e);
        }
      },

      fetchQuotes: async () => {
        try {
          const res = await axiosClient.get<any, any>('/sales/quotes');
          const data = res.content || res || [];
          set({ quotes: Array.isArray(data) ? data.map(migrateLegacyQuote) : [] });
        } catch (e) {
          console.error('Failed to fetch quotes:', e);
        }
      },

      fetchExportInvoices: async () => {
        try {
          const res = await axiosClient.get<any, any>('/sales/invoices');
          const data = res.content || res || [];
          set({ exportInvoices: Array.isArray(data) ? data.map(migrateLegacyInvoice) : [] });
        } catch (e) {
          console.error('Failed to fetch invoices:', e);
        }
      },

      fetchCustomerReturns: async () => {
        try {
          const res = await axiosClient.get<any, any>('/sales/returns');
          const data = res.content || res || [];
          set({ customerReturns: Array.isArray(data) ? data.map(migrateLegacyReturn) : [] });
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
