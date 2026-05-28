import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  customerName: string;
  date: string;
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PAID' | 'UNPAID';
  paymentMethod?: string;
  cashier?: string; // legacy display name
  createdByName?: string;
  createdByEmail?: string;
  branchId?: string | null;
  branchName?: string;
  /** Đơn tạo từ POS (VND) vs nhập tay / mock (USD) */
  origin?: 'POS' | 'ONLINE' | 'MANUAL';
  currency?: 'VND' | 'USD';
  itemsSummary?: string;
  orderLines?: OrderLineItem[];

  // --- Online order fields ---
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
  customerName: string;
  total: number;
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
  customerName: string;
  taxId: string;
  issueDate: string;
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
  customerName: string;
  refundAmount: number;
  returnDate: string;
  reason: string;
  condition: 'DEFECTIVE' | 'UNOPENED' | 'USED_DAMAGED';
  status: 'PENDING_INSPECTION' | 'APPROVED_REFUNDED' | 'REJECTED';
  inspector: string;
  notes?: string;
  returnLines?: OrderLineItem[];
}

interface SalesState {
  saleOrders: SaleOrder[];
  quotes: QuoteItem[];
  exportInvoices: ExportInvoiceItem[];
  customerReturns: CustomerReturnItem[];

  addSaleOrder: (order: Omit<SaleOrder, 'id'>) => void;
  updateSaleOrder: (id: string, data: Partial<SaleOrder>) => void;
  deleteSaleOrder: (id: string) => void;

  addQuote: (quote: Omit<QuoteItem, 'id'>) => void;
  updateQuote: (id: string, data: Partial<QuoteItem>) => void;
  deleteQuote: (id: string) => void;

  addExportInvoice: (row: Omit<ExportInvoiceItem, 'id'>) => void;
  updateExportInvoice: (id: string, data: Partial<ExportInvoiceItem>) => void;
  deleteExportInvoice: (id: string) => void;

  addCustomerReturn: (row: Omit<CustomerReturnItem, 'id'>) => void;
  updateCustomerReturn: (id: string, data: Partial<CustomerReturnItem>) => void;
  deleteCustomerReturn: (id: string) => void;
}

const SAMPLE_LINES = {
  onl1: [
    { id: 'l1', sku: 'SS-S24', productName: 'Samsung Galaxy S24', quantity: 1, unitPrice: 199.99, lineTotal: 199.99 },
    { id: 'l2', sku: 'CASE-01', productName: 'Ốp lưng Silicon', quantity: 2, unitPrice: 30, lineTotal: 60 },
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
    customerName: 'John Doe',
    date: '2024-05-17 10:30',
    total: 259.98,
    orderLines: SAMPLE_LINES.onl1,
    itemsSummary: 'Samsung Galaxy S24×1, Ốp lưng Silicon×2',
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    paymentMethod: 'Online Card',
    cashier: 'Sarah Jenkins',
    createdByName: 'Sarah Jenkins',
    createdByEmail: 's.jenkins@retailhub.local',
    origin: 'ONLINE',
    onlineChannel: 'WEB',
    currency: 'USD',
    branchId: 'BR-001',
    branchName: 'CH Quận 1',
    recipientName: 'John Doe',
    recipientPhone: '0909000111',
    shippingAddress: '12 Lê Lợi, P. Bến Nghé',
    province: 'TP.HCM',
    district: 'Quận 1',
    deliveryStatus: 'DELIVERED',
    shippingProvider: 'GHTK',
    trackingCode: 'GHTK-9812001',
    isCod: false,
  },
  {
    id: '2',
    code: 'ONL-2024-002',
    customerName: 'Alice Smith',
    date: '2024-05-17 11:15',
    total: 129.99,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'COD',
    cashier: 'Michael Chang',
    createdByName: 'Michael Chang',
    createdByEmail: 'm.chang@retailhub.local',
    origin: 'ONLINE',
    onlineChannel: 'APP',
    currency: 'USD',
    branchId: 'BR-002',
    branchName: 'CH Tân Bình',
    recipientName: 'Alice Smith',
    recipientPhone: '0909000222',
    shippingAddress: '45 Cộng Hòa',
    province: 'TP.HCM',
    district: 'Tân Bình',
    deliveryStatus: 'CONFIRMED',
    shippingProvider: 'Ahamove',
    trackingCode: 'AHM-229991',
    isCod: true,
    codAmount: 129.99,
  },
  { id: '3', code: 'ORD-2024-003', customerName: 'Walk-in Customer', date: '2024-05-17 12:00', total: 45.0, status: 'COMPLETED', paymentStatus: 'PAID', paymentMethod: 'Apple Pay', cashier: 'Sarah Jenkins', createdByName: 'Sarah Jenkins', origin: 'MANUAL', currency: 'USD', branchId: 'BR-001', branchName: 'CH Quận 1' },
  { id: '4', code: 'ORD-2024-004', customerName: 'Bob Johnson', date: '2024-05-17 14:20', total: 899.0, status: 'CANCELLED', paymentStatus: 'UNPAID', paymentMethod: 'Bank Transfer', cashier: 'David Ross', createdByName: 'David Ross', origin: 'MANUAL', currency: 'USD', branchId: 'BR-003', branchName: 'CH Gò Vấp' },
  {
    id: '5',
    code: 'ONL-2024-003',
    customerName: 'Charlie Brown',
    date: '2024-05-17 15:45',
    total: 1500.0,
    status: 'PENDING',
    paymentStatus: 'PAID',
    paymentMethod: 'Bank Transfer',
    cashier: 'Michael Chang',
    createdByName: 'Michael Chang',
    origin: 'ONLINE',
    onlineChannel: 'MARKETPLACE',
    currency: 'USD',
    branchId: 'BR-004',
    branchName: 'CH Quận 7',
    recipientName: 'Charlie Brown',
    recipientPhone: '0909000333',
    shippingAddress: '10 Nguyễn Văn Linh',
    province: 'TP.HCM',
    district: 'Quận 7',
    deliveryStatus: 'SHIPPED',
    shippingProvider: 'VNPost',
    trackingCode: 'VNPOST-771920',
    isCod: false,
  },
];

const MOCK_QUOTES: QuoteItem[] = [
  {
    id: '1', code: 'QT-2024-001', customerName: 'Acme Corp', total: 4500.0, validUntil: '2024-06-01', status: 'ACCEPTED', salesRep: 'Sarah Jenkins', notes: 'Includes 15% VIP enterprise discount.', itemsCount: 2,
    orderLines: [
      { id: 'q1', sku: 'NK-AM24', productName: 'Nike Air Max 2024', quantity: 50, unitPrice: 90, lineTotal: 4500 },
    ],
  },
  { id: '2', code: 'QT-2024-002', customerName: 'Global Logistics', total: 12500.5, validUntil: '2024-05-30', status: 'SENT', salesRep: 'David Ross', notes: 'Annual hardware upgrade package.', itemsCount: 45 },
  { id: '3', code: 'QT-2024-003', customerName: 'Tech Startup Inc', total: 850.0, validUntil: '2024-05-25', status: 'DRAFT', salesRep: 'Michael Chang', notes: 'Initial server rack consultation.', itemsCount: 3 },
  { id: '4', code: 'QT-2024-004', customerName: 'Beta Retailers', total: 3200.0, validUntil: '2024-05-10', status: 'EXPIRED', salesRep: 'Sarah Jenkins', itemsCount: 8 },
];

const MOCK_INVOICES: ExportInvoiceItem[] = [
  { id: '1', invoiceNumber: 'INV-2024-901', customerName: 'Apex Hypermarkets', taxId: 'TAX-8921029', issueDate: '2024-05-15', subtotal: 10000.0, vatAmount: 1000.0, totalAmount: 11000.0, status: 'PAID', paymentTerms: 'Net 30', notes: 'Payment cleared via Wire Transfer #WT-89102.' },
  { id: '2', invoiceNumber: 'INV-2024-902', customerName: 'Metro Department Stores', taxId: 'TAX-1029381', issueDate: '2024-05-10', subtotal: 45000.0, vatAmount: 4500.0, totalAmount: 49500.0, status: 'ISSUED', paymentTerms: 'Net 60', notes: 'Dispatched to central distribution warehouse.' },
  { id: '3', invoiceNumber: 'INV-2024-903', customerName: 'Zenith Retails', taxId: 'TAX-5521908', issueDate: '2024-04-01', subtotal: 5000.0, vatAmount: 500.0, totalAmount: 5500.0, status: 'OVERDUE', paymentTerms: 'Net 15', notes: 'Automated overdue reminder sent to finance email.' },
  { id: '4', invoiceNumber: 'INV-2024-904', customerName: 'Boutique Alpha', taxId: 'TAX-0019283', issueDate: '2024-05-02', subtotal: 1200.0, vatAmount: 120.0, totalAmount: 1320.0, status: 'CANCELLED', paymentTerms: 'Due on Receipt', notes: 'Cancelled due to duplicate order submission.' },
];

const MOCK_RETURNS: CustomerReturnItem[] = [
  {
    id: '1', returnCode: 'RET-2024-001', orderCode: 'ORD-2024-189', customerName: 'John Doe', refundAmount: 129.99, returnDate: '2024-05-17', reason: 'Wrong shoe size provided.', condition: 'UNOPENED', status: 'APPROVED_REFUNDED', inspector: 'David Ross', notes: 'Restocked to inventory shelf B4.',
    returnLines: [{ id: 'r1', sku: 'SHOE-42', productName: 'Giày thể thao size 42', quantity: 1, unitPrice: 129.99, lineTotal: 129.99 }],
  },
  { id: '2', returnCode: 'RET-2024-002', orderCode: 'ORD-2024-142', customerName: 'Alice Smith', refundAmount: 899.0, returnDate: '2024-05-16', reason: 'Screen glitch on power up.', condition: 'DEFECTIVE', status: 'PENDING_INSPECTION', inspector: 'Michael Chang', notes: 'Sent to technical verification bench.' },
  { id: '3', returnCode: 'RET-2024-003', orderCode: 'ORD-2024-099', customerName: 'Bob Johnson', refundAmount: 45.0, returnDate: '2024-05-14', reason: 'Customer changed mind after 3 weeks.', condition: 'USED_DAMAGED', status: 'REJECTED', inspector: 'Sarah Jenkins', notes: 'Return period expired & heavy scratch marks.' },
];

const defaultData = {
  saleOrders: MOCK_ORDERS,
  quotes: MOCK_QUOTES,
  exportInvoices: MOCK_INVOICES,
  customerReturns: MOCK_RETURNS,
};

export const useSalesStore = create<SalesState>()(
  persist(
    (set) => ({
      ...defaultData,

      addSaleOrder: (order) =>
        set((state) => ({
          saleOrders: [{ id: Date.now().toString(), ...order }, ...state.saleOrders],
        })),

      updateSaleOrder: (id, data) =>
        set((state) => ({
          saleOrders: state.saleOrders.map((o) => (o.id === id ? { ...o, ...data } : o)),
        })),

      deleteSaleOrder: (id) =>
        set((state) => ({
          saleOrders: state.saleOrders.filter((o) => o.id !== id),
        })),

      addQuote: (quote) =>
        set((state) => ({
          quotes: [{ id: Date.now().toString(), ...quote }, ...state.quotes],
        })),

      updateQuote: (id, data) =>
        set((state) => ({
          quotes: state.quotes.map((q) => (q.id === id ? { ...q, ...data } : q)),
        })),

      deleteQuote: (id) =>
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
        })),

      addExportInvoice: (row) =>
        set((state) => ({
          exportInvoices: [{ id: Date.now().toString(), ...row }, ...state.exportInvoices],
        })),

      updateExportInvoice: (id, data) =>
        set((state) => ({
          exportInvoices: state.exportInvoices.map((inv) => (inv.id === id ? { ...inv, ...data } : inv)),
        })),

      deleteExportInvoice: (id) =>
        set((state) => ({
          exportInvoices: state.exportInvoices.filter((inv) => inv.id !== id),
        })),

      addCustomerReturn: (row) =>
        set((state) => ({
          customerReturns: [{ id: Date.now().toString(), ...row }, ...state.customerReturns],
        })),

      updateCustomerReturn: (id, data) =>
        set((state) => ({
          customerReturns: state.customerReturns.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),

      deleteCustomerReturn: (id) =>
        set((state) => ({
          customerReturns: state.customerReturns.filter((r) => r.id !== id),
        })),
    }),
    {
      name: 'retailhub-sales-storage',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<SalesState> | undefined;
        if (!p || typeof p !== 'object') return current as SalesState;
        const c = current as SalesState;
        const saleOrders = (Array.isArray(p.saleOrders) ? p.saleOrders : defaultData.saleOrders).map((o) => ({
          ...o,
          orderLines: o.orderLines?.length ? o.orderLines : [],
        }));
        const quotes = (Array.isArray(p.quotes) ? p.quotes : defaultData.quotes).map((q) => ({
          ...q,
          orderLines: q.orderLines?.length ? q.orderLines : [],
          itemsCount: q.orderLines?.length ?? q.itemsCount,
        }));
        const customerReturns = (Array.isArray(p.customerReturns) ? p.customerReturns : defaultData.customerReturns).map((r) => ({
          ...r,
          returnLines: r.returnLines?.length ? r.returnLines : [],
        }));
        return {
          ...c,
          ...p,
          saleOrders,
          quotes,
          exportInvoices: Array.isArray(p.exportInvoices) ? p.exportInvoices : defaultData.exportInvoices,
          customerReturns,
        };
      },
    }
  )
);
