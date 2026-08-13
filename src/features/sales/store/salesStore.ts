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
  '1': 'CH Quận 1 (Hội Sở)',
  '2': 'Chi nhánh Hà Nội',
  '3': 'CH Gò Vấp',
  '4': 'CH Quận 7',
  '5': 'CH Bình Dương',
  branch_001: 'CH Quận 1 (Hội Sở)',
  'BR-001': 'CH Quận 1 (Hội Sở)',
  'BR-002': 'Chi nhánh Hà Nội',
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
  quotes: QuoteItem[];
  exportInvoices: ExportInvoiceItem[];
  customerReturns: CustomerReturnItem[];
  returnRequests: ReturnRequestItem[];
  isLoading: boolean;
  error: string | null;

  fetchSaleOrders: () => Promise<void>;
  fetchQuotes: () => Promise<void>;
  fetchExportInvoices: () => Promise<void>;
  fetchCustomerReturns: () => Promise<void>;

  addReturnRequest: (req: ReturnRequestItem) => void;
  updateReturnRequestStatus: (id: string, status: ReturnRequestItem['status']) => void;

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
  returnRequests: [
    {
      id: 'rr-1',
      requestCode: 'RR-2026-0001',
      orderCode: 'ONLINE-805391',
      customerId: '1',
      customerName: 'Nguyễn Lưu Hoàng',
      customerPhone: '0901234567',
      requestDate: '2026-08-12',
      reason: 'Sản phẩm lỗi màng bao bì',
      requestedRefundMethod: 'BANK_TRANSFER',
      status: 'APPROVED',
      handlerName: 'Nguyễn Văn Hưng',
      requestedQty: 10,
      returnedQty: 0,
      remainingQty: 10,
      items: [
        { productId: '1', productName: 'Pepsi 330ml - Lon', sku: 'SKU-PEPSI-330', quantity: 10, returnedQty: 0, price: 15000, reason: 'Lỗi đóng gói' },
      ],
    },
    {
      id: 'rr-2',
      requestCode: 'RR-2026-0002',
      orderCode: 'ORD-POS-2026-818712',
      customerId: '2',
      customerName: 'Trần Văn Nam',
      customerPhone: '0988776655',
      requestDate: '2026-08-11',
      reason: 'Khách mua nhầm Size',
      requestedRefundMethod: 'CASH',
      status: 'PARTIALLY_RETURNED',
      handlerName: 'Phạm Thị Mai',
      requestedQty: 5,
      returnedQty: 2,
      remainingQty: 3,
      items: [
        { productId: '2', productName: 'Áo thun Polo Regular Fit - Size L', sku: 'POLO-L-BLK', quantity: 5, returnedQty: 2, price: 250000, reason: 'Size rộng' },
      ],
    },
  ],
  isLoading: false,
  error: null,

  addReturnRequest: (req) => {
    set((state) => ({ returnRequests: [req, ...state.returnRequests] }));
  },

  updateReturnRequestStatus: (id, status) => {
    set((state) => ({
      returnRequests: state.returnRequests.map((r) => (r.id === id ? { ...r, status } : r)),
    }));
  },

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
    set({ isLoading: true, error: null });
    try {
      const created = await salesService.addExportInvoice(inv);
      set((state) => ({ exportInvoices: [created, ...state.exportInvoices], isLoading: false }));
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
      set((state) => ({
        exportInvoices: state.exportInvoices.map((inv) => (inv.id === id ? { ...inv, ...updated } : inv)),
        isLoading: false,
      }));
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
}));
