import { create } from 'zustand';
import { crmService } from '../services/crmService';

export interface CustomerProfile {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  avatarUrl: string;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'ELITE_CLUB';
  loyaltyPoints: number;
  lifetimeSpent: number;
  registeredDate: string;
  lastActive: string;
  status: 'ACTIVE' | 'DORMANT' | 'CHURNED';
  taxCode?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  creditLimit?: number;
  groupId?: string;
  areaId?: string;
  notes?: string;
}

export interface LoyaltyTierConfig {
  id: string;
  tierCode: string;
  tierName: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'ELITE_CLUB';
  minSpendThreshold: number;
  pointsMultiplier: number;
  discountPercentage: number;
  activeMembersCount: number;
  freeShippingEligible: boolean;
  prioritySupport: boolean;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  description?: string;
}

export interface VoucherRecord {
  id: string;
  code: string;
  name: string;
  discountType: 'PERCENT' | 'FIXED_AMOUNT';
  value: number;
  minOrderValue: number;
  maxDiscount: number;
  quantity: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
}

export interface CustomerVoucherRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCode?: string;
  voucherCode: string;
  programId?: string;
  programName?: string;
  voucherName?: string;
  discountType?: 'PERCENT' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  issueDate: string;
  expiryDate?: string;
  usedDate?: string;
  usedOrderId?: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  notes?: string;
}

export interface FeedbackRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  rating: number;
  content: string;
  category: 'PRODUCT' | 'SERVICE' | 'DELIVERY' | 'OTHER';
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  resolutionNote?: string;
}

export interface LoyaltyPointHistoryRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  actionType: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
  pointsChange: number;
  balanceAfter: number;
  referenceOrder?: string;
  notes: string;
  createdAt: string;
}

export interface MarketingCampaignRecord {
  id: string;
  code: string;
  title: string;
  channel: 'SMS' | 'EMAIL' | 'PUSH';
  targetAudience: string;
  sentCount: number;
  openRatePercentage: number;
  conversionRatePercentage: number;
  status: 'ACTIVE' | 'COMPLETED' | 'SCHEDULED' | 'DRAFT' | 'PAUSED';
  scheduledDate: string;
  contentSnippet: string;
}

export interface PartnerGroupRecord {
  id: string;
  groupCode: string;
  groupName: string;
  partnerType: 'CUSTOMER' | 'SUPPLIER';
  description: string;
  membersCount: number;
  defaultDiscountPercent: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ProductWarrantyRecord {
  id: string;
  serialNumber: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  purchaseDate: string;
  expiryDate: string;
  warrantyMonths: number;
  status: 'VALID' | 'EXPIRED' | 'VOIDED';
}

export interface WarrantyClaimRecord {
  id: string;
  claimCode: string;
  serialNumber: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  issueDescription: string;
  resolution: string;
  receivedDate: string;
  completedDate?: string;
  costAmount: number;
  status: 'RECEIVED' | 'IN_REPAIR' | 'COMPLETED' | 'REJECTED';
}

export interface SupportTicketRecord {
  id: string;
  ticketCode: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'TECHNICAL' | 'BILLING' | 'COMPLAINT' | 'GENERAL';
  assignedTo: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdDate: string;
}

export interface TicketMessageRecord {
  id: string;
  ticketId: string;
  senderName: string;
  isStaff: boolean;
  message: string;
  createdAt: string;
}

export type CustomerInput = Omit<CustomerProfile, 'id'>;

interface CRMState {
  customers: CustomerProfile[];
  loyaltyTiers: LoyaltyTierConfig[];
  vouchers: VoucherRecord[];
  customerVouchers: CustomerVoucherRecord[];
  feedbacks: FeedbackRecord[];
  loyaltyHistories: LoyaltyPointHistoryRecord[];
  marketingCampaigns: MarketingCampaignRecord[];
  partnerGroups: PartnerGroupRecord[];
  productWarranties: ProductWarrantyRecord[];
  warrantyClaims: WarrantyClaimRecord[];
  supportTickets: SupportTicketRecord[];
  ticketMessages: TicketMessageRecord[];
  isLoadingCustomers: boolean;
  isLoading: boolean;
  error: string | null;

  fetchCustomers: () => Promise<void>;
  addCustomer: (customer: CustomerInput) => Promise<void>;
  updateCustomer: (id: string, data: Partial<CustomerProfile>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  fetchVouchers: () => Promise<void>;
  addVoucher: (item: Omit<VoucherRecord, 'id'>) => Promise<void>;
  updateVoucher: (id: string, data: Partial<VoucherRecord>) => Promise<void>;
  deleteVoucher: (id: string) => Promise<void>;

  fetchCustomerVouchers: () => Promise<void>;
  addCustomerVoucher: (item: Omit<CustomerVoucherRecord, 'id'>) => Promise<void>;
  updateCustomerVoucher: (id: string, data: Partial<CustomerVoucherRecord>) => Promise<void>;
  deleteCustomerVoucher: (id: string) => Promise<void>;

  fetchFeedbacks: () => Promise<void>;
  addFeedback: (item: Omit<FeedbackRecord, 'id'>) => Promise<void>;
  updateFeedback: (id: string, data: Partial<FeedbackRecord>) => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;

  fetchLoyaltyHistories: () => Promise<void>;
  addLoyaltyHistory: (item: Omit<LoyaltyPointHistoryRecord, 'id'>) => Promise<void>;
  addCustomerPoints: (customerId: string, pointsChange: number, historyRecord: any) => void;

  fetchMarketingCampaigns: () => Promise<void>;
  addMarketingCampaign: (item: Omit<MarketingCampaignRecord, 'id'>) => Promise<void>;
  updateMarketingCampaign: (id: string, data: Partial<MarketingCampaignRecord>) => Promise<void>;
  deleteMarketingCampaign: (id: string) => Promise<void>;

  fetchLoyaltyTiers: () => Promise<any[]>;
  addLoyaltyTier: (item: any) => Promise<any>;
  updateLoyaltyTier: (id: string, item: any) => Promise<any>;
  deleteLoyaltyTier: (id: string) => Promise<void>;

  fetchPartnerGroups: () => Promise<void>;
  addPartnerGroup: (item: Omit<PartnerGroupRecord, 'id'>) => Promise<void>;
  updatePartnerGroup: (id: string, data: Partial<PartnerGroupRecord>) => Promise<void>;
  deletePartnerGroup: (id: string) => Promise<void>;

  fetchProductWarranties: () => Promise<void>;
  addProductWarranty: (item: Omit<ProductWarrantyRecord, 'id'>) => Promise<void>;
  updateProductWarranty: (id: string, data: Partial<ProductWarrantyRecord>) => Promise<void>;
  deleteProductWarranty: (id: string) => Promise<void>;

  fetchWarrantyClaims: () => Promise<void>;
  addWarrantyClaim: (item: Omit<WarrantyClaimRecord, 'id'>) => Promise<void>;
  updateWarrantyClaim: (id: string, data: Partial<WarrantyClaimRecord>) => Promise<void>;
  deleteWarrantyClaim: (id: string) => Promise<void>;

  fetchSupportTickets: () => Promise<void>;
  addSupportTicket: (item: Omit<SupportTicketRecord, 'id'>) => Promise<void>;
  updateSupportTicket: (id: string, data: Partial<SupportTicketRecord>) => Promise<void>;
  deleteSupportTicket: (id: string) => Promise<void>;

  fetchTicketMessages: (ticketId?: string) => Promise<void>;
  addTicketMessage: (item: Omit<TicketMessageRecord, 'id'>) => Promise<void>;
}

const getSavedLocalCustomers = (): CustomerProfile[] => {
  try {
    const saved = localStorage.getItem('retailhub_crm_customers');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

const saveLocalCustomers = (customers: CustomerProfile[]) => {
  try {
    localStorage.setItem('retailhub_crm_customers', JSON.stringify(customers));
  } catch {}
};

export const DEFAULT_MOCK_LOYALTY_HISTORIES: LoyaltyPointHistoryRecord[] = [];

export const SEEDED_CUSTOMER_VOUCHERS: CustomerVoucherRecord[] = [
  {
    id: '1',
    customerName: 'Nguyễn Văn An',
    customerPhone: '0912345678',
    customerCode: 'CUST-001',
    voucherCode: 'VC-2026-AN8812',
    programId: '5',
    programName: 'Tri Ân Hội Viên Vàng',
    voucherName: 'Tri Ân Hội Viên Vàng',
    discountType: 'FIXED_AMOUNT',
    discountValue: 50000,
    minOrderValue: 200000,
    maxDiscount: 50000,
    issueDate: '2026-08-13',
    expiryDate: '2026-09-12',
    status: 'ACTIVE',
    notes: 'Tặng hội viên VIP Vàng tháng 8',
  },
  {
    id: '2',
    customerName: 'Nguyễn Văn An',
    customerPhone: '0912345678',
    customerCode: 'CUST-001',
    voucherCode: 'VC-2026-AN9934',
    programId: '7',
    programName: 'Miễn Phí Vận Chuyển Toàn Quốc',
    voucherName: 'Miễn Phí Vận Chuyển Toàn Quốc',
    discountType: 'FREE_SHIPPING',
    discountValue: 30000,
    minOrderValue: 0,
    maxDiscount: 30000,
    issueDate: '2026-08-08',
    expiryDate: '2026-09-07',
    usedDate: '2026-08-16',
    status: 'USED',
    notes: 'Đã sử dụng cho đơn hàng giao tận nơi',
  },
  {
    id: '3',
    customerName: 'Nguyễn Văn An',
    customerPhone: '0912345678',
    customerCode: 'CUST-001',
    voucherCode: 'VC-2026-AN1122',
    programId: '8',
    programName: 'Quà Tặng Sinh Nhật',
    voucherName: 'Quà Tặng Sinh Nhật',
    discountType: 'FIXED_AMOUNT',
    discountValue: 20000,
    minOrderValue: 50000,
    maxDiscount: 20000,
    issueDate: '2026-08-16',
    expiryDate: '2026-09-15',
    status: 'ACTIVE',
    notes: 'Quà sinh nhật tháng 8',
  },
  {
    id: '4',
    customerName: 'Trần Thị Mai',
    customerPhone: '0988776655',
    customerCode: 'CUST-002',
    voucherCode: 'VC-2026-MAI001',
    programId: '4',
    programName: 'Chào Bạn Mới 10%',
    voucherName: 'Chào Bạn Mới 10%',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderValue: 100000,
    maxDiscount: 50000,
    issueDate: '2026-08-04',
    expiryDate: '2026-09-03',
    usedDate: '2026-08-11',
    status: 'USED',
    notes: 'Đã dùng áp dụng giảm 10%',
  },
  {
    id: '5',
    customerName: 'Trần Thị Mai',
    customerPhone: '0988776655',
    customerCode: 'CUST-002',
    voucherCode: 'VC-2026-MAI002',
    programId: '7',
    programName: 'Miễn Phí Vận Chuyển Toàn Quốc',
    voucherName: 'Miễn Phí Vận Chuyển Toàn Quốc',
    discountType: 'FREE_SHIPPING',
    discountValue: 30000,
    minOrderValue: 0,
    maxDiscount: 30000,
    issueDate: '2026-08-15',
    expiryDate: '2026-09-14',
    status: 'ACTIVE',
    notes: 'Tặng mã freeship hỗ trợ',
  },
  {
    id: '6',
    customerName: 'Công ty TNHH Thương Mại Á Châu',
    customerPhone: '02839998888',
    customerCode: 'CUST-003',
    voucherCode: 'VC-2026-ACHAU1',
    programId: '6',
    programName: 'Đặc Quyền VIP Kim Cương',
    voucherName: 'Đặc Quyền VIP Kim Cương',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minOrderValue: 150000,
    maxDiscount: 100000,
    issueDate: '2026-08-13',
    expiryDate: '2026-09-12',
    status: 'ACTIVE',
    notes: 'Ưu đãi đặc quyền Doanh nghiệp VIP',
  },
  {
    id: '7',
    customerName: 'Công ty TNHH Thương Mại Á Châu',
    customerPhone: '02839998888',
    customerCode: 'CUST-003',
    voucherCode: 'VC-2026-ACHAU2',
    programId: '7',
    programName: 'Miễn Phí Vận Chuyển Toàn Quốc',
    voucherName: 'Miễn Phí Vận Chuyển Toàn Quốc',
    discountType: 'FREE_SHIPPING',
    discountValue: 30000,
    minOrderValue: 0,
    maxDiscount: 30000,
    issueDate: '2026-08-13',
    expiryDate: '2026-09-12',
    status: 'ACTIVE',
    notes: 'Freeship cho đơn hàng công ty',
  },
  {
    id: '8',
    customerName: 'Công ty TNHH Thương Mại Á Châu',
    customerPhone: '02839998888',
    customerCode: 'CUST-003',
    voucherCode: 'VC-2026-ACHAU3',
    programId: '5',
    programName: 'Tri Ân Hội Viên Vàng',
    voucherName: 'Tri Ân Hội Viên Vàng',
    discountType: 'FIXED_AMOUNT',
    discountValue: 50000,
    minOrderValue: 200000,
    maxDiscount: 50000,
    issueDate: '2026-08-06',
    expiryDate: '2026-09-05',
    usedDate: '2026-08-14',
    status: 'USED',
    notes: 'Đã dùng đơn sỉ công ty',
  },
  {
    id: '9',
    customerName: 'Lê Hoàng Nam',
    customerPhone: '0909123123',
    customerCode: 'CUST-004',
    voucherCode: 'VC-2026-NAM001',
    programId: '4',
    programName: 'Chào Bạn Mới 10%',
    voucherName: 'Chào Bạn Mới 10%',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderValue: 100000,
    maxDiscount: 50000,
    issueDate: '2026-08-17',
    expiryDate: '2026-09-16',
    status: 'ACTIVE',
    notes: 'Hỗ trợ khách hàng mới',
  },
  {
    id: '10',
    customerName: 'Lê Hoàng Nam',
    customerPhone: '0909123123',
    customerCode: 'CUST-004',
    voucherCode: 'VC-2026-NAM002',
    programId: '7',
    programName: 'Miễn Phí Vận Chuyển Toàn Quốc',
    voucherName: 'Miễn Phí Vận Chuyển Toàn Quốc',
    discountType: 'FREE_SHIPPING',
    discountValue: 30000,
    minOrderValue: 0,
    maxDiscount: 30000,
    issueDate: '2026-08-12',
    expiryDate: '2026-09-11',
    status: 'CANCELLED',
    notes: 'Đã thu hồi do cấp trùng',
  },
  {
    id: '11',
    customerName: 'Phạm Thanh Hương',
    customerPhone: '0933445566',
    customerCode: 'CUST-005',
    voucherCode: 'VC-2026-HUONG1',
    programId: '4',
    programName: 'Chào Bạn Mới 10%',
    voucherName: 'Chào Bạn Mới 10%',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderValue: 100000,
    maxDiscount: 50000,
    issueDate: '2026-08-14',
    expiryDate: '2026-09-13',
    status: 'ACTIVE',
    notes: 'Voucher chào mừng hội viên mới',
  },
  {
    id: '12',
    customerName: 'Phạm Thanh Hương',
    customerPhone: '0933445566',
    customerCode: 'CUST-005',
    voucherCode: 'VC-2026-HUONG2',
    programId: '8',
    programName: 'Quà Tặng Sinh Nhật',
    voucherName: 'Quà Tặng Sinh Nhật',
    discountType: 'FIXED_AMOUNT',
    discountValue: 20000,
    minOrderValue: 50000,
    maxDiscount: 20000,
    issueDate: '2026-07-09',
    expiryDate: '2026-08-08',
    status: 'EXPIRED',
    notes: 'Mã sinh nhật đợt trước đã hết hạn',
  },
];

export const useCrmStore = create<CRMState>()((set) => ({
  customers: [],
  loyaltyTiers: [],
  vouchers: [],
  customerVouchers: [],
  feedbacks: [],
  loyaltyHistories: [],
  marketingCampaigns: [],
  partnerGroups: [],
  productWarranties: [],
  warrantyClaims: [],
  supportTickets: [],
  ticketMessages: [],
  isLoadingCustomers: false,
  isLoading: false,
  error: null,

  fetchCustomers: async () => {
    set({ isLoadingCustomers: true, isLoading: true, error: null });
    try {
      const data = await crmService.fetchCustomers();
      try {
        localStorage.removeItem('retailhub_crm_customers');
      } catch {}
      set({ customers: data || [], isLoadingCustomers: false, isLoading: false });
    } catch (e: any) {
      console.error('Failed to fetch customers:', e);
      set({ customers: [], isLoadingCustomers: false, isLoading: false, error: e.message || 'Lỗi khi tải khách hàng' });
    }
  },

  addCustomer: async (customer) => {
    set({ isLoading: true, error: null });
    let created: CustomerProfile;
    try {
      created = await crmService.addCustomer(customer);
    } catch (e: any) {
      console.warn('API add customer failed, fallback local add:', e);
      created = {
        id: String(Date.now()),
        customerCode: customer.customerCode || `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        avatarUrl: customer.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        loyaltyTier: customer.loyaltyTier || 'BRONZE',
        loyaltyPoints: customer.loyaltyPoints || 0,
        lifetimeSpent: customer.lifetimeSpent || 0,
        registeredDate: customer.registeredDate || new Date().toISOString().split('T')[0],
        lastActive: new Date().toISOString().split('T')[0],
        status: customer.status || 'ACTIVE',
        notes: customer.notes,
      };
    }
    set((state) => {
      const next = [created, ...state.customers];
      saveLocalCustomers(next);
      return { customers: next, isLoading: false };
    });
  },

  updateCustomer: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await crmService.updateCustomer(id, data);
    } catch (e: any) {
      console.warn('API update customer failed, applying local update:', e);
    }
    set((state) => {
      const target = state.customers.find((c) => c.id === id);
      const merged = target ? { ...target, ...data } : (data as CustomerProfile);
      const others = state.customers.filter((c) => c.id !== id);
      const next = [merged, ...others];
      saveLocalCustomers(next);
      return { customers: next, isLoading: false };
    });
  },

  deleteCustomer: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await crmService.deleteCustomer(id);
    } catch (e: any) {
      console.warn('API delete customer failed, applying local delete:', e);
    }
    set((state) => {
      const next = state.customers.filter((c) => c.id !== id);
      saveLocalCustomers(next);
      return { customers: next, isLoading: false };
    });
  },

  fetchVouchers: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await crmService.fetchVouchers();
      set({ vouchers: data || [], isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ vouchers: [], isLoading: false });
    }
  },

  addVoucher: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await crmService.addVoucher(item);
      set((state) => ({ vouchers: [created, ...state.vouchers.filter(v => v.id !== created.id)], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  updateVoucher: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await crmService.updateVoucher(id, data);
      set((state) => {
        const target = state.vouchers.find((v) => v.id === id);
        const merged = target ? { ...target, ...updated } : (updated as VoucherRecord);
        const others = state.vouchers.filter((v) => v.id !== id);
        return {
          vouchers: [merged, ...others],
          isLoading: false,
        };
      });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteVoucher: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await crmService.deleteVoucher(id);
      set((state) => ({ vouchers: state.vouchers.filter((v) => v.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ vouchers: state.vouchers.filter((v) => v.id !== id), isLoading: false }));
    }
  },

  fetchCustomerVouchers: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await crmService.fetchCustomerVouchers();
      if (Array.isArray(data) && data.length > 0) {
        set({ customerVouchers: data, isLoading: false });
      } else {
        set({ customerVouchers: SEEDED_CUSTOMER_VOUCHERS, isLoading: false });
      }
    } catch (e: any) {
      console.warn('Using seeded customer vouchers fallback:', e);
      set({ customerVouchers: SEEDED_CUSTOMER_VOUCHERS, isLoading: false });
    }
  },

  addCustomerVoucher: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await crmService.addCustomerVoucher(item);
      set((state) => {
        const filtered = state.customerVouchers.filter((cv) => cv.id !== created.id && cv.voucherCode !== created.voucherCode);
        return { customerVouchers: [created, ...filtered], isLoading: false };
      });
    } catch (e: any) {
      console.warn('Fallback add customer voucher:', e);
      const fallback: CustomerVoucherRecord = {
        id: String(Date.now() + Math.floor(Math.random() * 1000)),
        ...item,
      };
      set((state) => ({
        customerVouchers: [fallback, ...state.customerVouchers],
        isLoading: false,
      }));
    }
  },

  updateCustomerVoucher: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await crmService.updateCustomerVoucher(id, data);
      set((state) => {
        const target = state.customerVouchers.find((cv) => cv.id === id);
        const merged = target ? { ...target, ...updated } : (updated as CustomerVoucherRecord);
        const others = state.customerVouchers.filter((cv) => cv.id !== id);
        return {
          customerVouchers: [merged, ...others],
          isLoading: false,
        };
      });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteCustomerVoucher: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await crmService.deleteCustomerVoucher(id);
      set((state) => ({ customerVouchers: state.customerVouchers.filter((cv) => cv.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ customerVouchers: state.customerVouchers.filter((cv) => cv.id !== id), isLoading: false }));
    }
  },

  fetchFeedbacks: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await crmService.fetchFeedbacks();
      if (data.length > 0) set({ feedbacks: data });
      set({ isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  addFeedback: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await crmService.addFeedback(item);
      set((state) => ({ feedbacks: [created, ...state.feedbacks.filter(f => f.id !== created.id)], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  updateFeedback: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await crmService.updateFeedback(id, data);
      set((state) => {
        const target = state.feedbacks.find((f) => f.id === id);
        const merged = target ? { ...target, ...updated } : (updated as CustomerFeedbackRecord);
        const others = state.feedbacks.filter((f) => f.id !== id);
        return {
          feedbacks: [merged, ...others],
          isLoading: false,
        };
      });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteFeedback: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await crmService.deleteFeedback(id);
      set((state) => ({ feedbacks: state.feedbacks.filter((f) => f.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ feedbacks: state.feedbacks.filter((f) => f.id !== id), isLoading: false }));
    }
  },

  fetchLoyaltyHistories: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await crmService.fetchLoyaltyHistories();
      let savedLocal: LoyaltyPointHistoryRecord[] = [];
      try {
        const local = localStorage.getItem('retailhub_crm_loyalty_histories');
        if (local) savedLocal = JSON.parse(local);
      } catch {}
      const rawList = [...savedLocal, ...(Array.isArray(data) ? data : [])];
      set({ loyaltyHistories: rawList, isLoading: false });
    } catch (e: any) {
      console.error(e);
      let savedLocal: LoyaltyPointHistoryRecord[] = [];
      try {
        const local = localStorage.getItem('retailhub_crm_loyalty_histories');
        if (local) savedLocal = JSON.parse(local);
      } catch {}
      set({ loyaltyHistories: savedLocal, isLoading: false });
    }
  },

  addLoyaltyHistory: async (item) => {
    set({ isLoading: true, error: null });
    const localItem: LoyaltyPointHistoryRecord = {
      id: String(Date.now()),
      ...item,
    } as any;
    try {
      let created = localItem;
      try {
        created = await crmService.addLoyaltyHistory(item);
      } catch {}
      set((state) => {
        const next = [created, ...state.loyaltyHistories.filter(h => h.id !== created.id)];
        try {
          localStorage.setItem('retailhub_crm_loyalty_histories', JSON.stringify(next));
        } catch {}
        return { loyaltyHistories: next, isLoading: false };
      });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  addCustomerPoints: (customerId: string, pointsChange: number, historyRecord: any) => {
    set((state) => {
      const targetCustomer = state.customers.find((c) => String(c.id) === String(customerId) || (historyRecord.phone && c.phone === historyRecord.phone));
      const otherCustomers = state.customers.filter((c) => String(c.id) !== String(customerId) && (!historyRecord.phone || c.phone !== historyRecord.phone));
      
      let updatedCustomer = targetCustomer;
      if (targetCustomer) {
        const currentPts = Number(targetCustomer.loyaltyPoints || 0);
        const newPoints = Math.max(0, currentPts + pointsChange);
        const currentSpent = Number(targetCustomer.lifetimeSpent || 0);
        const newSpent = currentSpent + (pointsChange > 0 ? Number(historyRecord.amount || 0) : 0);
        
        let newTier: CustomerProfile['loyaltyTier'] = targetCustomer.loyaltyTier || 'BRONZE';
        if (newPoints >= 6000 || newSpent >= 50000000) newTier = 'DIAMOND';
        else if (newPoints >= 3000 || newSpent >= 25000000) newTier = 'ELITE_CLUB';
        else if (newPoints >= 1500 || newSpent >= 10000000) newTier = 'GOLD';
        else if (newPoints >= 500 || newSpent >= 3000000) newTier = 'SILVER';
        else newTier = 'BRONZE';

        updatedCustomer = {
          ...targetCustomer,
          loyaltyPoints: newPoints,
          lifetimeSpent: newSpent,
          loyaltyTier: newTier,
        };
      }
      
      const updatedCustomers = updatedCustomer ? [updatedCustomer, ...otherCustomers] : state.customers;
      saveLocalCustomers(updatedCustomers);

      const newHistoryItem: LoyaltyPointHistoryRecord = {
        id: String(Date.now() + Math.floor(Math.random() * 1000)),
        code: historyRecord.code || `TX-POS-${Date.now()}`,
        customerId: String(customerId),
        customerName: historyRecord.customerName || 'Khách hàng',
        customerPhone: historyRecord.phone || historyRecord.customerPhone || '',
        pointsChange: pointsChange,
        transactionType: historyRecord.transactionType || (pointsChange > 0 ? 'TÍCH ĐIỂM BÁN HÀNG POS' : 'TIÊU ĐIỂM BÁN HÀNG POS'),
        refDocument: historyRecord.refDocument || historyRecord.referenceOrder || `ORD-POS-${Date.now()}`,
        date: historyRecord.date || new Date().toISOString().split('T')[0],
        balanceAfter: historyRecord.balanceAfter !== undefined ? historyRecord.balanceAfter : pointsChange,
        amount: historyRecord.amount || 0,
        actionType: pointsChange > 0 ? 'EARN' : 'REDEEM',
        createdAt: new Date().toISOString(),
      } as any;

      const nextHistories = [newHistoryItem, ...state.loyaltyHistories];
      try {
        localStorage.setItem('retailhub_crm_loyalty_histories', JSON.stringify(nextHistories));
      } catch {}

      return {
        customers: updatedCustomers,
        loyaltyHistories: nextHistories,
      };
    });
  },

  fetchMarketingCampaigns: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await crmService.fetchMarketingCampaigns();
      if (data.length > 0) set({ marketingCampaigns: data });
      set({ isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  addMarketingCampaign: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await crmService.addMarketingCampaign(item);
      set((state) => ({ marketingCampaigns: [created, ...state.marketingCampaigns.filter(mc => mc.id !== created.id)], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  updateMarketingCampaign: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await crmService.updateMarketingCampaign(id, data);
      set((state) => {
        const target = state.marketingCampaigns.find((mc) => mc.id === id);
        const merged = target ? { ...target, ...updated } : (updated as MarketingCampaignRecord);
        const others = state.marketingCampaigns.filter((mc) => mc.id !== id);
        return {
          marketingCampaigns: [merged, ...others],
          isLoading: false,
        };
      });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteMarketingCampaign: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await crmService.deleteMarketingCampaign(id);
      set((state) => ({ marketingCampaigns: state.marketingCampaigns.filter((mc) => mc.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ marketingCampaigns: state.marketingCampaigns.filter((mc) => mc.id !== id), isLoading: false }));
    }
  },

  fetchLoyaltyTiers: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await crmService.fetchLoyaltyTiers();
      if (data && data.length > 0) set({ loyaltyTiers: data });
      set({ isLoading: false });
      return data;
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      return [];
    }
  },

  addLoyaltyTier: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await crmService.addLoyaltyTier(item);
      set((state) => ({ loyaltyTiers: [created, ...state.loyaltyTiers.filter(t => t.id !== created.id)], isLoading: false }));
      return created;
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  updateLoyaltyTier: async (id, item) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await crmService.updateLoyaltyTier(id, item);
      set((state) => {
        const target = state.loyaltyTiers.find((t) => t.id === id);
        const merged = target ? { ...target, ...updated } : updated;
        const others = state.loyaltyTiers.filter((t) => t.id !== id);
        return {
          loyaltyTiers: [merged, ...others],
          isLoading: false,
        };
      });
      return updated;
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteLoyaltyTier: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await crmService.deleteLoyaltyTier(id);
      set((state) => ({ loyaltyTiers: state.loyaltyTiers.filter((t) => String(t.id) !== String(id)), isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ loyaltyTiers: state.loyaltyTiers.filter((t) => String(t.id) !== String(id)), isLoading: false }));
    }
  },

  fetchPartnerGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await crmService.fetchPartnerGroups();
      if (data.length > 0) set({ partnerGroups: data });
      set({ isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  addPartnerGroup: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await crmService.addPartnerGroup(item);
      set((state) => ({ partnerGroups: [created, ...state.partnerGroups.filter(pg => pg.id !== created.id)], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  updatePartnerGroup: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await crmService.updatePartnerGroup(id, data);
      set((state) => {
        const target = state.partnerGroups.find((pg) => pg.id === id);
        const merged = target ? { ...target, ...updated } : (updated as PartnerGroupRecord);
        const others = state.partnerGroups.filter((pg) => pg.id !== id);
        return {
          partnerGroups: [merged, ...others],
          isLoading: false,
        };
      });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  deletePartnerGroup: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await crmService.deletePartnerGroup(id);
      set((state) => ({ partnerGroups: state.partnerGroups.filter((pg) => pg.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ partnerGroups: state.partnerGroups.filter((pg) => pg.id !== id), isLoading: false }));
    }
  },

  fetchProductWarranties: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await crmService.fetchProductWarranties();
      if (data.length > 0) set({ productWarranties: data });
      set({ isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  addProductWarranty: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await crmService.addProductWarranty(item);
      set((state) => ({ productWarranties: [created, ...state.productWarranties.filter(pw => pw.id !== created.id)], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  updateProductWarranty: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await crmService.updateProductWarranty(id, data);
      set((state) => {
        const target = state.productWarranties.find((pw) => pw.id === id);
        const merged = target ? { ...target, ...updated } : (updated as ProductWarrantyRecord);
        const others = state.productWarranties.filter((pw) => pw.id !== id);
        return {
          productWarranties: [merged, ...others],
          isLoading: false,
        };
      });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteProductWarranty: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await crmService.deleteProductWarranty(id);
      set((state) => ({ productWarranties: state.productWarranties.filter((pw) => pw.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ productWarranties: state.productWarranties.filter((pw) => pw.id !== id), isLoading: false }));
    }
  },

  fetchWarrantyClaims: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await crmService.fetchWarrantyClaims();
      if (data.length > 0) set({ warrantyClaims: data });
      set({ isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  addWarrantyClaim: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await crmService.addWarrantyClaim(item);
      set((state) => ({ warrantyClaims: [created, ...state.warrantyClaims.filter(wc => wc.id !== created.id)], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  updateWarrantyClaim: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await crmService.updateWarrantyClaim(id, data);
      set((state) => {
        const target = state.warrantyClaims.find((wc) => wc.id === id);
        const merged = target ? { ...target, ...updated } : (updated as WarrantyClaimRecord);
        const others = state.warrantyClaims.filter((wc) => wc.id !== id);
        return {
          warrantyClaims: [merged, ...others],
          isLoading: false,
        };
      });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteWarrantyClaim: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await crmService.deleteWarrantyClaim(id);
      set((state) => ({ warrantyClaims: state.warrantyClaims.filter((wc) => wc.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ warrantyClaims: state.warrantyClaims.filter((wc) => wc.id !== id), isLoading: false }));
    }
  },

  fetchSupportTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await crmService.fetchSupportTickets();
      if (data.length > 0) set({ supportTickets: data });
      set({ isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  addSupportTicket: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await crmService.addSupportTicket(item);
      set((state) => ({ supportTickets: [created, ...state.supportTickets.filter(st => st.id !== created.id)], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  updateSupportTicket: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await crmService.updateSupportTicket(id, data);
      set((state) => {
        const target = state.supportTickets.find((st) => st.id === id);
        const merged = target ? { ...target, ...updated } : (updated as SupportTicketRecord);
        const others = state.supportTickets.filter((st) => st.id !== id);
        return {
          supportTickets: [merged, ...others],
          isLoading: false,
        };
      });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteSupportTicket: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await crmService.deleteSupportTicket(id);
      set((state) => ({ supportTickets: state.supportTickets.filter((st) => st.id !== id), isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({ supportTickets: state.supportTickets.filter((st) => st.id !== id), isLoading: false }));
    }
  },

  fetchTicketMessages: async (ticketId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await crmService.fetchTicketMessages(ticketId);
      if (data.length > 0) set({ ticketMessages: data });
      set({ isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  addTicketMessage: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await crmService.addTicketMessage(item);
      set((state) => ({ ticketMessages: [...state.ticketMessages, created], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },
}));
