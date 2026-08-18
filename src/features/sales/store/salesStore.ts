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
  customerPhone?: string;
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
  '1': 'Chi nhánh Quận 1 (TP. Hồ Chí Minh)',
  '2': 'Chi nhánh Hà Nội (Cầu Giấy)',
  '3': 'Chi nhánh Đà Nẵng (Hải Châu)',
  '4': 'Chi nhánh Cần Thơ (Ninh Kiều)',
  'CN-HCM': 'Chi nhánh Quận 1 (TP. Hồ Chí Minh)',
  'CN-HN': 'Chi nhánh Hà Nội (Cầu Giấy)',
  'CN-DN': 'Chi nhánh Đà Nẵng (Hải Châu)',
  'CN-CT': 'Chi nhánh Cần Thơ (Ninh Kiều)',
};

export interface QuoteItem {
  id: string;
  code: string;
  customerId: string;
  issueDate: string;
  revision: number;
  currency?: 'VND' | 'USD';
  paymentTerms?: string;
  deliveryTerms?: string;
  warrantyTerms?: string;
  validityTerms?: string;
  shippingAddress?: string;
  subTotal: number;
  discountType?: 'PERCENT' | 'AMOUNT';
  discountValue?: number;
  discountAmount: number;
  shippingFee?: number;
  taxRate?: number;
  taxAmount: number;
  totalAmount: number;
  validUntil: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  salesRep: string;
  salesPersonId?: string;
  salesPersonName?: string;
  warehouseId?: string;
  warehouseName?: string;
  notes?: string;
  attachments?: string;
  pdfUrl?: string;
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

export interface CustomerReturnLine {
  id?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  originalQty?: number;
  returnedQty?: number;
  availableQty?: number;
  price: number;
  discountAmount?: number;
  subTotal: number;
  reason?: string;
  condition?: 'UNOPENED' | 'DEFECTIVE' | 'USED_DAMAGED';
  isRestocked?: boolean;
}

export interface ReturnRequestItem {
  id: string;
  requestCode: string;
  orderCode: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  requestDate: string;
  reason: string;
  requestedRefundMethod: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PARTIALLY_RETURNED' | 'COMPLETED';
  handlerName?: string;
  notes?: string;
  requestedQty: number;
  returnedQty: number;
  remainingQty: number;
  items?: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    returnedQty?: number;
    price: number;
    reason?: string;
  }[];
}

export interface CustomerReturnItem {
  id: string;
  returnCode: string;
  returnRequestId?: string | null;
  returnRequestCode?: string | null;
  orderCode?: string;
  originalOrderCode?: string;
  customerId: string;
  returnDate: string;
  refundAmount: number;
  deductionAmount?: number;
  reason: string;
  status: 'DRAFT' | 'PENDING_RECEIPT' | 'PENDING_INSPECTION' | 'INSPECTING' | 'APPROVED' | 'STOCK_IN' | 'REFUND_PROCESSING' | 'REFUNDED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  refundMethod: RefundMethod;
  isRestocked: boolean;
  returnBranchId: string;
  warehouseId?: string;
  locationId?: string;
  inspector?: string;
  createdBy?: string;
  notes?: string;
  returnLines?: CustomerReturnLine[];
}

interface SalesState {
  saleOrders: SaleOrder[];
  surveys: any[];
  exportInvoices: ExportInvoiceItem[];
  customerReturns: CustomerReturnItem[];
  returnRequests: ReturnRequestItem[];
  isLoading: boolean;
  error: string | null;

  fetchSaleOrders: () => Promise<void>;
  fetchQuotes: () => Promise<void>;
  fetchSurveys: () => Promise<void>;
  fetchReturnRequests: () => Promise<void>;
  fetchExportInvoices: () => Promise<void>;
  fetchCustomerReturns: () => Promise<void>;

  addReturnRequest: (req: ReturnRequestItem) => Promise<void>;
  updateReturnRequestStatus: (id: string, status: ReturnRequestItem['status']) => Promise<void>;

  addSaleOrder: (order: Omit<SaleOrder, 'id'>) => Promise<void>;
  updateSaleOrder: (id: string, data: Partial<SaleOrder>) => Promise<void>;
  deleteSaleOrder: (id: string) => Promise<void>;

  addQuote: (quote: Omit<QuoteItem, 'id'>) => Promise<void>;
  updateQuote: (id: string, data: Partial<QuoteItem>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;

  addSurvey: (survey: any) => Promise<void>;
  updateSurvey: (id: string, data: any) => Promise<void>;
  deleteSurvey: (id: string) => Promise<void>;
  convertSurveyToQuote: (id: string) => Promise<any>;

  addExportInvoice: (inv: Omit<ExportInvoiceItem, 'id'>) => Promise<void>;
  updateExportInvoice: (id: string, data: Partial<ExportInvoiceItem>) => Promise<void>;
  deleteExportInvoice: (id: string) => Promise<void>;

  addCustomerReturn: (ret: Omit<CustomerReturnItem, 'id'>) => Promise<void>;
  updateCustomerReturn: (id: string, data: Partial<CustomerReturnItem>) => Promise<void>;
  deleteCustomerReturn: (id: string) => Promise<void>;
}

export const DEFAULT_MOCK_SALE_ORDERS: SaleOrder[] = [];

export const useSalesStore = create<SalesState>()((set, get) => ({
  saleOrders: [],
  quotes: [],
  exportInvoices: [],
  customerReturns: [],
  returnRequests: [],
  isLoading: false,
  error: null,

  addReturnRequest: async (req) => {
    set({ isLoading: true, error: null });
    try {
      const created = await salesService.addReturnRequest(req);
      set((state) => ({ returnRequests: [created, ...state.returnRequests], isLoading: false }));
    } catch (err) {
      console.warn('API addReturnRequest failed, adding locally:', err);
      const fallbackItem = { id: String(Date.now()), ...req } as ReturnRequestItem;
      set((state) => ({ returnRequests: [fallbackItem, ...state.returnRequests], isLoading: false }));
    }
  },

  updateReturnRequestStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      await salesService.updateReturnRequestStatus(id, status);
      set((state) => ({
        returnRequests: state.returnRequests.map((r) => (r.id === id ? { ...r, status } : r)),
        isLoading: false,
      }));
    } catch (err) {
      console.warn('API updateReturnRequestStatus failed, updating locally:', err);
      set((state) => ({
        returnRequests: state.returnRequests.map((r) => (r.id === id ? { ...r, status } : r)),
        isLoading: false,
      }));
    }
  },

  fetchSaleOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await salesService.fetchSaleOrders();
      let localOrders: SaleOrder[] = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('retailhub_pos_orders') || '[]');
      } catch {}
      const mergedMap = new Map<string, SaleOrder>();
      localOrders.forEach(o => mergedMap.set(o.code || o.id, o));
      (data || []).forEach(o => mergedMap.set(o.code || o.id, o));
      const combined = Array.from(mergedMap.values()).sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
      set({ saleOrders: combined, isLoading: false });
    } catch (e: any) {
      console.error('Failed to fetch sale orders:', e);
      let localOrders: SaleOrder[] = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('retailhub_pos_orders') || '[]');
      } catch {}
      set({ saleOrders: localOrders, isLoading: false, error: e.message || 'Lỗi khi tải đơn bán hàng' });
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
      let created: SaleOrder;
      try {
        created = await salesService.addSaleOrder(order);
      } catch (err) {
        created = {
          id: String(Date.now()),
          ...order,
          origin: order.origin || 'POS',
          status: order.status || 'COMPLETED',
          paymentStatus: order.paymentStatus || 'PAID',
        } as SaleOrder;
      }
      try {
        const existingLocal = JSON.parse(localStorage.getItem('retailhub_pos_orders') || '[]');
        const updatedLocal = [created, ...existingLocal.filter((o: any) => o.id !== created.id && o.code !== created.code)];
        localStorage.setItem('retailhub_pos_orders', JSON.stringify(updatedLocal));
      } catch {}
      set((state) => {
        const filtered = state.saleOrders.filter(s => s.id !== created.id && s.code !== created.code);
        return { saleOrders: [created, ...filtered], isLoading: false };
      });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi thêm đơn bán' });
    }
  },

  updateSaleOrder: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await salesService.updateSaleOrder(id, data);
      set((state) => {
        const target = state.saleOrders.find((s) => s.id === id);
        const merged = target ? { ...target, ...updated } : (updated as SaleOrder);
        const others = state.saleOrders.filter((s) => s.id !== id);
        return {
          saleOrders: [merged, ...others],
          isLoading: false,
        };
      });
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
      set((state) => ({ quotes: [created, ...state.quotes.filter(q => q.id !== created.id)], isLoading: false }));
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
      set((state) => {
        const target = state.quotes.find((q) => q.id === id);
        const merged = target ? { ...target, ...updated } : (updated as Quote);
        const others = state.quotes.filter((q) => q.id !== id);
        return {
          quotes: [merged, ...others],
          isLoading: false,
        };
      });
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
    set({ isLoading: true, error: null });
    try {
      const created = await salesService.addExportInvoice(inv);
      set((state) => ({ exportInvoices: [created, ...state.exportInvoices.filter(i => i.id !== created.id)], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi thêm hóa đơn xuất' });
      throw e;
    }
  },

  updateExportInvoice: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await salesService.updateExportInvoice(id, data);
      set((state) => {
        const target = state.exportInvoices.find((inv) => inv.id === id);
        const merged = target ? { ...target, ...updated } : (updated as ExportInvoice);
        const others = state.exportInvoices.filter((inv) => inv.id !== id);
        return {
          exportInvoices: [merged, ...others],
          isLoading: false,
        };
      });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi cập nhật hóa đơn xuất' });
      throw e;
    }
  },

  deleteExportInvoice: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await salesService.deleteExportInvoice(id);
      set((state) => ({ exportInvoices: state.exportInvoices.filter((inv) => inv.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ exportInvoices: state.exportInvoices.filter((inv) => inv.id !== id), isLoading: false }));
    }
  },

  addCustomerReturn: async (ret) => {
    set({ isLoading: true, error: null });
    try {
      const numericCustId = Number(ret.customerId);
      const numericBranchId = Number(ret.returnBranchId.replace(/\D/g, '')) || 1;
      let numericInvoiceId = 1;
      const matchedSO = get().saleOrders.find((so) => so.code === ret.orderCode);
      const matchedInv = get().exportInvoices.find((inv) => inv.invoiceNumber === ret.orderCode);
      if (matchedInv && !isNaN(Number(matchedInv.id))) {
        numericInvoiceId = Number(matchedInv.id);
      } else if (matchedSO && !isNaN(Number(matchedSO.id))) {
        numericInvoiceId = Number(matchedSO.id);
      } else {
        const rawDigits = (ret.orderCode || '').replace(/\D/g, '');
        const parsed = Number(rawDigits);
        if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) {
          numericInvoiceId = parsed;
        }
      }

      const payload = {
        returnCode: ret.returnCode,
        returnRequestCode: ret.returnRequestCode || null,
        returnDate: ret.returnDate ? `${ret.returnDate}T00:00:00` : new Date().toISOString(),
        reason: ret.reason || 'Khách hoàn trả',
        status: ret.status || 'PENDING_INSPECTION',
        customerId: isNaN(numericCustId) ? null : numericCustId,
        invoiceId: numericInvoiceId,
        branchId: numericBranchId,
        note: ret.notes || '',
        details: (ret.returnLines || []).map((line) => ({
          productId: Number(line.productId) || 1,
          quantity: Number(line.quantity) || 1,
          refundPrice: Number(line.price) || 0,
        })),
      };

      await salesService.addCustomerReturn(payload);
      const data = await salesService.fetchCustomerReturns();

      // Update ReturnRequest state if returnRequestCode is present
      if (ret.returnRequestCode) {
        const reqCode = ret.returnRequestCode;
        const numReturnedThisTime = (ret.returnLines || []).reduce((sum, l) => sum + (l.quantity || 0), 0);
        set((state) => ({
          returnRequests: state.returnRequests.map((r) => {
            if (r.requestCode !== reqCode) return r;
            const newReturned = (r.returnedQty || 0) + numReturnedThisTime;
            const newRemaining = Math.max(0, r.requestedQty - newReturned);
            const newStatus = newRemaining === 0 ? 'COMPLETED' : 'PARTIALLY_RETURNED';
            return {
              ...r,
              returnedQty: newReturned,
              remainingQty: newRemaining,
              status: newStatus,
            };
          }),
        }));
      }

      set({ customerReturns: data, isLoading: false });
    } catch (e: any) {
      console.error('Failed to add customer return:', e);
      // Fallback local update if API fails so UI stays responsive and seamless
      const newRetItem: CustomerReturnItem = { id: String(Date.now()), ...ret };
      set((state) => {
        let updatedRequests = state.returnRequests;
        if (ret.returnRequestCode) {
          const reqCode = ret.returnRequestCode;
          const numReturnedThisTime = (ret.returnLines || []).reduce((sum, l) => sum + (l.quantity || 0), 0);
          updatedRequests = state.returnRequests.map((r) => {
            if (r.requestCode !== reqCode) return r;
            const newReturned = (r.returnedQty || 0) + numReturnedThisTime;
            const newRemaining = Math.max(0, r.requestedQty - newReturned);
            const newStatus = newRemaining === 0 ? 'COMPLETED' : 'PARTIALLY_RETURNED';
            return {
              ...r,
              returnedQty: newReturned,
              remainingQty: newRemaining,
              status: newStatus,
            };
          });
        }
        return {
          customerReturns: [newRetItem, ...state.customerReturns],
          returnRequests: updatedRequests,
          isLoading: false,
        };
      });
    }
  },

  updateCustomerReturn: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      if (data.status) {
        await salesService.updateCustomerReturnStatus(id, data.status);
      } else {
        await salesService.updateCustomerReturn(id, data);
      }
      const updatedList = await salesService.fetchCustomerReturns();
      set({ customerReturns: updatedList, isLoading: false });
    } catch (e: any) {
      console.error('Failed to update customer return:', e);
      set((state) => ({
        customerReturns: state.customerReturns.map((r) => (r.id === id ? { ...r, ...data } : r)),
        isLoading: false,
      }));
    }
  },

  deleteCustomerReturn: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await salesService.deleteCustomerReturn(id);
      set((state) => ({ customerReturns: state.customerReturns.filter((r) => r.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error('Failed to delete customer return:', e);
      set((state) => ({ customerReturns: state.customerReturns.filter((r) => r.id !== id), isLoading: false }));
    }
  },

  surveys: [],
  fetchSurveys: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await salesService.fetchQuoteSurveys();
      set({ surveys: data, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải khảo sát báo giá' });
    }
  },

  addSurvey: async (survey) => {
    set({ isLoading: true, error: null });
    try {
      const created = await salesService.addQuoteSurvey(survey);
      const data = await salesService.fetchQuoteSurveys();
      set((state) => ({ surveys: data.length > 0 ? data : [created, ...state.surveys], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  updateSurvey: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await salesService.updateQuoteSurvey(id, data);
      const updated = await salesService.fetchQuoteSurveys();
      set({ surveys: updated, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteSurvey: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await salesService.deleteQuoteSurvey(id);
      set((state) => ({ surveys: state.surveys.filter((s) => s.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ surveys: state.surveys.filter((s) => s.id !== id), isLoading: false }));
    }
  },

  convertSurveyToQuote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const createdQuote = await salesService.convertQuoteSurveyToQuote(id);
      const surveys = await salesService.fetchQuoteSurveys();
      const quotes = await salesService.fetchQuotes();
      set({ surveys, quotes, isLoading: false });
      return createdQuote;
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  fetchReturnRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await salesService.fetchReturnRequests();
      set({ returnRequests: data, isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },
}));
