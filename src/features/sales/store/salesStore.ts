import { create } from 'zustand';
import { salesService } from '../services/salesService';
import {
  WALK_IN_CUSTOMER_ID,
  calcTotalAmount,
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

  amountTendered?: number;
  changeAmount?: number;
  shiftId?: string;

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
  '1': 'Chi nhánh chính',
  branch_001: 'Chi nhánh chính',
  'BR-001': 'Chi nhánh chính',
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
  companyName: string;
  issueDate: string;
  dueDate: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentTerms: 'IMMEDIATE' | 'NET30' | 'NET60';
  status: 'DRAFT' | 'ISSUED' | 'CANCELLED';
  einvoiceRef?: string;
  notes?: string;
}

export interface CustomerReturnItem {
  id: string;
  returnCode: string;
  originalOrderCode: string;
  customerId: string;
  returnDate: string;
  refundAmount: number;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  refundMethod: RefundMethod;
  isRestocked: boolean;
  returnBranchId: string;
}

interface SalesState {
  saleOrders: SaleOrder[];
  quotes: QuoteItem[];
  exportInvoices: ExportInvoiceItem[];
  customerReturns: CustomerReturnItem[];
  isLoading: boolean;
  error: string | null;

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

  addExportInvoice: (inv: Omit<ExportInvoiceItem, 'id'>) => Promise<void>;
  updateExportInvoice: (id: string, data: Partial<ExportInvoiceItem>) => Promise<void>;
  deleteExportInvoice: (id: string) => Promise<void>;

  addCustomerReturn: (ret: Omit<CustomerReturnItem, 'id'>) => Promise<void>;
  updateCustomerReturn: (id: string, data: Partial<CustomerReturnItem>) => Promise<void>;
  deleteCustomerReturn: (id: string) => Promise<void>;
}

export const useSalesStore = create<SalesState>()((set) => ({
  saleOrders: [],
  quotes: [],
  exportInvoices: [],
  customerReturns: [],
  isLoading: false,
  error: null,

  fetchSaleOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await salesService.fetchSaleOrders();
      set({ saleOrders: data, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải đơn bán hàng' });
    }
  },

  fetchQuotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await salesService.fetchQuotes();
      set({ quotes: data, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải báo giá' });
    }
  },

  fetchExportInvoices: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await salesService.fetchExportInvoices();
      set({ exportInvoices: data, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải hóa đơn xuất' });
    }
  },

  fetchCustomerReturns: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await salesService.fetchCustomerReturns();
      set({ customerReturns: data, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải đơn trả hàng' });
    }
  },

  addSaleOrder: async (order) => {
    set({ isLoading: true, error: null });
    try {
      const created = await salesService.addSaleOrder(order);
      set((state) => ({ saleOrders: [created, ...state.saleOrders], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi thêm đơn bán' });
      throw e;
    }
  },

  updateSaleOrder: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await salesService.updateSaleOrder(id, data);
      set((state) => ({
        saleOrders: state.saleOrders.map((s) => (s.id === id ? { ...s, ...updated } : s)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi cập nhật đơn bán' });
      throw e;
    }
  },

  deleteSaleOrder: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await salesService.deleteSaleOrder(id);
      set((state) => ({ saleOrders: state.saleOrders.filter((s) => s.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ saleOrders: state.saleOrders.filter((s) => s.id !== id), isLoading: false }));
    }
  },

  addQuote: async (quote) => {
    set({ isLoading: true, error: null });
    try {
      const created = await salesService.addQuote(quote);
      set((state) => ({ quotes: [created, ...state.quotes], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  updateQuote: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await salesService.updateQuote(id, data);
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === id ? { ...q, ...updated } : q)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteQuote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await salesService.deleteQuote(id);
      set((state) => ({ quotes: state.quotes.filter((q) => q.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ quotes: state.quotes.filter((q) => q.id !== id), isLoading: false }));
    }
  },

  addExportInvoice: async (inv) => {
    set((state) => ({ exportInvoices: [{ id: String(Date.now()), ...inv }, ...state.exportInvoices] }));
  },

  updateExportInvoice: async (id, data) => {
    set((state) => ({
      exportInvoices: state.exportInvoices.map((inv) => (inv.id === id ? { ...inv, ...data } : inv)),
    }));
  },

  deleteExportInvoice: async (id) => {
    set((state) => ({ exportInvoices: state.exportInvoices.filter((inv) => inv.id !== id) }));
  },

  addCustomerReturn: async (ret) => {
    set((state) => ({ customerReturns: [{ id: String(Date.now()), ...ret }, ...state.customerReturns] }));
  },

  updateCustomerReturn: async (id, data) => {
    set((state) => ({
      customerReturns: state.customerReturns.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }));
  },

  deleteCustomerReturn: async (id) => {
    set((state) => ({ customerReturns: state.customerReturns.filter((r) => r.id !== id) }));
  },
}));
