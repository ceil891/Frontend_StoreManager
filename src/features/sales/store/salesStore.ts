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

const SAMPLE_LINES = {
  onl1: [
    { id: 'l1', sku: 'SS-S24', productName: 'Samsung Galaxy S24', quantity: 1, unitPrice: 19900000, lineTotal: 19900000 },
    { id: 'l2', sku: 'CASE-01', productName: 'Ốp lưng Silicon', quantity: 2, unitPrice: 300000, lineTotal: 600000 },
  ] as OrderLineItem[],
  pos: [
    { id: 'l3', sku: 'SV-001', productName: 'Sữa Vinamilk 1L', quantity: 1, unitPrice: 29000, lineTotal: 29000 },
    { id: 'l4', sku: 'MG-005', productName: 'Mì gói Hảo Hảo', quantity: 3, unitPrice: 5500, lineTotal: 16500 },
  ] as OrderLineItem[],
};

const MOCK_ORDERS: SaleOrder[] = [
  {
    id: '1',
    code: 'ONL-2024-001',
    customerId: '1',
    date: '2024-05-17 10:30',
    subTotal: 20500000,
    taxAmount: 0,
    discountAmount: 0,
    shippingFee: 30000,
    totalAmount: 20530000,
    orderLines: SAMPLE_LINES.onl1,
    itemsSummary: 'Samsung Galaxy S24×1, ốp lưng Silicon×2',
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    paymentMethod: 'Online Card',
    cashier: 'Sarah Jenkins',
    createdByName: 'Sarah Jenkins',
    createdByEmail: 's.jenkins@retailhub.local',
    origin: 'ONLINE',
    onlineChannel: 'WEB',
    currency: 'VND',
    branchId: 'BR-001',
    branchName: 'CH Quận 1',
    recipientName: 'Nguyễn Văn an',
    recipientPhone: '0909111222',
    shippingAddress: '12 Lê Lợi, P. Bến Nghé',
    province: 'TP.HCM',
    district: 'Quận 1',
    deliveryStatus: 'DELIVERED',
    shippingProvider: 'GHTK',
    trackingCode: 'GHTK-9812001',
    isCod: false,
    paymentGatewayRef: 'VNPAY-TXN-88291001',
    promoCodeApplied: 'WELCOME10',
  },
  {
    id: '2',
    code: 'ONL-2024-002',
    customerId: '2',
    date: '2024-05-17 11:15',
    subTotal: 3400000,
    taxAmount: 0,
    discountAmount: 0,
    shippingFee: 35000,
    totalAmount: 3435000,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'COD',
    cashier: 'Michael Chang',
    createdByName: 'Michael Chang',
    createdByEmail: 'm.chang@retailhub.local',
    origin: 'ONLINE',
    onlineChannel: 'APP',
    currency: 'VND',
    branchId: 'BR-002',
    branchName: 'CH Tân Bình',
    recipientName: 'Trần Thị Bình',
    recipientPhone: '0918222333',
    shippingAddress: '45 Cộng Hòa',
    province: 'TP.HCM',
    district: 'Tân Bình',
    deliveryStatus: 'CONFIRMED',
    shippingProvider: 'Ahamove',
    trackingCode: 'AHM-229991',
    isCod: true,
    codAmount: 3435000,
    promoCodeApplied: 'FREESHIP',
  },
  {
    id: '3',
    code: 'ORD-2024-003',
    customerId: WALK_IN_CUSTOMER_ID,
    date: '2024-05-17 12:00',
    subTotal: 455000,
    taxAmount: 36400,
    discountAmount: 0,
    totalAmount: 491400,
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    paymentMethod: 'Tiền mặt',
    cashier: 'Sarah Jenkins',
    createdByName: 'Sarah Jenkins',
    origin: 'POS',
    currency: 'VND',
    branchId: 'BR-001',
    branchName: 'CH Quận 1',
    orderLines: SAMPLE_LINES.pos,
    amountTendered: 500000,
    changeAmount: 8600,
    shiftId: 'SHIFT-2024-05-17-AM',
  },
  {
    id: '4',
    code: 'ORD-2024-004',
    customerId: '3',
    date: '2024-05-17 14:20',
    subTotal: 8990000,
    taxAmount: 0,
    discountAmount: 500000,
    totalAmount: 8490000,
    status: 'CANCELLED',
    paymentStatus: 'UNPAID',
    paymentMethod: 'Bank Transfer',
    cashier: 'David Ross',
    createdByName: 'David Ross',
    origin: 'MANUAL',
    currency: 'VND',
    branchId: 'BR-003',
    branchName: 'CH Gò Vấp',
  },
  {
    id: '5',
    code: 'ONL-2024-003',
    customerId: '4',
    date: '2024-05-17 15:45',
    subTotal: 15000000,
    taxAmount: 1200000,
    discountAmount: 0,
    shippingFee: 250000,
    totalAmount: 16450000,
    status: 'PENDING',
    paymentStatus: 'PAID',
    paymentMethod: 'Bank Transfer',
    cashier: 'Michael Chang',
    createdByName: 'Michael Chang',
    origin: 'ONLINE',
    onlineChannel: 'MARKETPLACE',
    currency: 'VND',
    branchId: 'BR-004',
    branchName: 'CH Quận 7',
    recipientName: 'Phạm thị dung',
    recipientPhone: '0938444555',
    shippingAddress: '10 Nguyễn Văn Linh',
    province: 'TP.HCM',
    district: 'Quận 7',
    deliveryStatus: 'SHIPPED',
    shippingProvider: 'VNPost',
    trackingCode: 'VNPOST-771920',
    isCod: false,
    paymentGatewayRef: 'MOMO-TRANS-77192088',
  },
];

const MOCK_QUOTES: QuoteItem[] = [
  {
    id: '1',
    code: 'QT-2024-001',
    customerId: '5',
    issueDate: '2024-05-01',
    revision: 2,
    subTotal: 112500000,
    taxAmount: 11250000,
    discountAmount: 11250000,
    totalAmount: 112500000,
    validUntil: '2024-06-01',
    status: 'ACCEPTED',
    salesRep: 'Sarah Jenkins',
    notes: 'Includes 15% VIP enterprise discount.',
    itemsCount: 2,
    orderLines: [{ id: 'q1', sku: 'NK-AM24', productName: 'Nike Air Max 2024', quantity: 50, unitPrice: 2250000, lineTotal: 112500000 }],
  },
  {
    id: '2',
    code: 'QT-2024-002',
    customerId: '1',
    issueDate: '2024-05-05',
    revision: 1,
    subTotal: 312512500,
    taxAmount: 31250000,
    discountAmount: 0,
    totalAmount: 343762500,
    validUntil: '2024-05-30',
    status: 'SENT',
    salesRep: 'David Ross',
    notes: 'Annual hardware upgrade package.',
    itemsCount: 45,
  },
  {
    id: '3',
    code: 'QT-2024-003',
    customerId: '2',
    issueDate: '2024-05-10',
    revision: 1,
    subTotal: 21250000,
    taxAmount: 2125000,
    discountAmount: 0,
    totalAmount: 23375000,
    validUntil: '2024-05-25',
    status: 'DRAFT',
    salesRep: 'Michael Chang',
    notes: 'Initial server rack consultation.',
    itemsCount: 3,
  },
  {
    id: '4',
    code: 'QT-2024-004',
    customerId: '3',
    issueDate: '2024-04-20',
    revision: 3,
    subTotal: 80000000,
    taxAmount: 8000000,
    discountAmount: 0,
    totalAmount: 88000000,
    validUntil: '2024-05-10',
    status: 'EXPIRED',
    salesRep: 'Sarah Jenkins',
    itemsCount: 8,
  },
];

const MOCK_INVOICES: ExportInvoiceItem[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-901',
    customerId: '1',
    taxId: 'TAX-8921029',
    billingAddress: '12 Lê Lợi, Q.1, TP.HCM — ĐKKD Apex Hypermarkets',
    orderIds: ['1'],
    issueDate: '2024-05-15',
    dueDate: paymentTermsToDueDate('2024-05-15', 'Net 30'),
    subtotal: 250000000,
    vatAmount: 25000000,
    totalAmount: 275000000,
    status: 'PAID',
    paymentTerms: 'Net 30',
    notes: 'Payment cleared via Wire Transfer #WT-89102.',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-902',
    customerId: '2',
    taxId: 'TAX-1029381',
    billingAddress: '45 Cộng Hòa, Tân Bình — Metro Department Stores',
    orderIds: ['2'],
    issueDate: '2024-05-10',
    dueDate: paymentTermsToDueDate('2024-05-10', 'Net 60'),
    subtotal: 1125000000,
    vatAmount: 112500000,
    totalAmount: 1237500000,
    status: 'ISSUED',
    paymentTerms: 'Net 60',
    notes: 'Dispatched to central distribution warehouse.',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-903',
    customerId: '3',
    taxId: 'TAX-5521908',
    billingAddress: '89 Quang Trung, Gò Vấp — Zenith Retails JSC',
    orderIds: ['4'],
    issueDate: '2024-04-01',
    dueDate: paymentTermsToDueDate('2024-04-01', 'Net 15'),
    subtotal: 125000000,
    vatAmount: 12500000,
    totalAmount: 137500000,
    status: 'OVERDUE',
    paymentTerms: 'Net 15',
    notes: 'Automated overdue reminder sent to finance email.',
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-904',
    customerId: '4',
    taxId: 'TAX-0019283',
    billingAddress: '10 Nguyễn Văn Linh, Q.7 — Boutique Alpha',
    orderIds: ['5'],
    issueDate: '2024-05-02',
    dueDate: paymentTermsToDueDate('2024-05-02', 'Due on Receipt'),
    subtotal: 30000000,
    vatAmount: 3000000,
    totalAmount: 33000000,
    status: 'CANCELLED',
    paymentTerms: 'Due on Receipt',
    notes: 'Cancelled due to duplicate order submission.',
  },
];

const MOCK_RETURNS: CustomerReturnItem[] = [
  {
    id: '1',
    returnCode: 'RET-2024-001',
    orderCode: 'ORD-2024-189',
    customerId: '1',
    refundAmount: 3249750,
    refundMethod: 'BANK_TRANSFER',
    isRestocked: true,
    returnBranchId: 'BR-001',
    returnDate: '2024-05-17',
    reason: 'Wrong shoe size provided.',
    condition: 'UNOPENED',
    status: 'APPROVED_REFUNDED',
    inspector: 'David Ross',
    notes: 'Restocked to inventory shelf B4.',
    returnLines: [{ id: 'r1', sku: 'SHOE-42', productName: 'Giày thể thao size 42', quantity: 1, unitPrice: 3249750, lineTotal: 3249750 }],
  },
  {
    id: '2',
    returnCode: 'RET-2024-002',
    orderCode: 'ORD-2024-142',
    customerId: '2',
    refundAmount: 22475000,
    refundMethod: 'ORIGINAL_CARD',
    isRestocked: false,
    returnBranchId: 'BR-002',
    returnDate: '2024-05-16',
    reason: 'Screen glitch on power up.',
    condition: 'DEFECTIVE',
    status: 'PENDING_INSPECTION',
    inspector: 'Michael Chang',
    notes: 'Sent to technical verification bench.',
  },
  {
    id: '3',
    returnCode: 'RET-2024-003',
    orderCode: 'ORD-2024-099',
    customerId: '3',
    refundAmount: 1125000,
    refundMethod: 'STORE_CREDIT',
    isRestocked: false,
    returnBranchId: 'BR-003',
    returnDate: '2024-05-14',
    reason: 'Customer changed mind after 3 weeks.',
    condition: 'USED_DAMAGED',
    status: 'REJECTED',
    inspector: 'Sarah Jenkins',
    notes: 'Return period expired & heavy scratch marks.',
  },
];

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
    (set) => ({
      ...defaultData,

      fetchSaleOrders: async () => {
        try {
          const res = await axiosClient.get<any, any>('/sales/orders');
          const data = res.content || res || [];
          if (Array.isArray(data) && data.length > 0) {
            set({ saleOrders: data.map(migrateLegacyOrder) });
          }
        } catch (e) {
          console.error('Failed to fetch sale orders:', e);
        }
      },

      fetchQuotes: async () => {
        try {
          const res = await axiosClient.get<any, any>('/sales/quotes');
          const data = res.content || res || [];
          if (Array.isArray(data) && data.length > 0) {
            set({ quotes: data.map(migrateLegacyQuote) });
          }
        } catch (e) {
          console.error('Failed to fetch quotes:', e);
        }
      },

      fetchExportInvoices: async () => {
        try {
          const res = await axiosClient.get<any, any>('/sales/invoices');
          const data = res.content || res || [];
          if (Array.isArray(data) && data.length > 0) {
            set({ exportInvoices: data.map(migrateLegacyInvoice) });
          }
        } catch (e) {
          console.error('Failed to fetch invoices:', e);
        }
      },

      fetchCustomerReturns: async () => {
        try {
          const res = await axiosClient.get<any, any>('/sales/returns');
          const data = res.content || res || [];
          if (Array.isArray(data) && data.length > 0) {
            set({ customerReturns: data.map(migrateLegacyReturn) });
          }
        } catch (e) {
          console.error('Failed to fetch customer returns:', e);
        }
      },

      addSaleOrder: async (order) => {
        try {
          await axiosClient.post('/sales/orders', order);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          saleOrders: [{ id: Date.now().toString(), ...order }, ...state.saleOrders],
        }));
      },

      updateSaleOrder: async (id, data) => {
        try {
          await axiosClient.put(`/sales/orders/${id}`, data);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          saleOrders: state.saleOrders.map((o) => (o.id === id ? { ...o, ...data } : o)),
        }));
      },

      deleteSaleOrder: async (id) => {
        try {
          await axiosClient.delete(`/sales/orders/${id}`);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          saleOrders: state.saleOrders.filter((o) => o.id !== id),
        }));
      },

      addQuote: async (quote) => {
        try {
          await axiosClient.post('/sales/quotes', quote);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          quotes: [{ id: Date.now().toString(), ...quote }, ...state.quotes],
        }));
      },

      updateQuote: async (id, data) => {
        try {
          await axiosClient.put(`/sales/quotes/${id}`, data);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          quotes: state.quotes.map((q) => (q.id === id ? { ...q, ...data } : q)),
        }));
      },

      deleteQuote: async (id) => {
        try {
          await axiosClient.delete(`/sales/quotes/${id}`);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
        }));
      },

      addExportInvoice: async (row) => {
        try {
          await axiosClient.post('/sales/invoices', row);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          exportInvoices: [{ id: Date.now().toString(), ...row }, ...state.exportInvoices],
        }));
      },

      updateExportInvoice: async (id, data) => {
        try {
          await axiosClient.put(`/sales/invoices/${id}`, data);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          exportInvoices: state.exportInvoices.map((inv) => (inv.id === id ? { ...inv, ...data } : inv)),
        }));
      },

      deleteExportInvoice: async (id) => {
        try {
          await axiosClient.delete(`/sales/invoices/${id}`);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          exportInvoices: state.exportInvoices.filter((inv) => inv.id !== id),
        }));
      },

      addCustomerReturn: async (row) => {
        try {
          await axiosClient.post('/sales/returns', row);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          customerReturns: [{ id: Date.now().toString(), ...row }, ...state.customerReturns],
        }));
      },

      updateCustomerReturn: async (id, data) => {
        try {
          await axiosClient.put(`/sales/returns/${id}`, data);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          customerReturns: state.customerReturns.map((r) => (r.id === id ? { ...r, ...data } : r)),
        }));
      },

      deleteCustomerReturn: async (id) => {
        try {
          await axiosClient.delete(`/sales/returns/${id}`);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          customerReturns: state.customerReturns.filter((r) => r.id !== id),
        }));
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
