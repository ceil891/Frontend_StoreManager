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
  voucherCode: string;
  voucherName: string;
  discountValue: number;
  issueDate: string;
  usedDate?: string;
  status: 'UNUSED' | 'USED' | 'EXPIRED';
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
    const local = getSavedLocalCustomers();
    try {
      const data = await crmService.fetchCustomers();
      if (data && data.length > 0) {
        const mergedMap = new Map<string, CustomerProfile>();
        data.forEach(c => mergedMap.set(c.id, c));
        local.forEach(c => mergedMap.set(c.id, c));
        const merged = Array.from(mergedMap.values());
        set({ customers: merged });
        saveLocalCustomers(merged);
      } else if (local.length > 0) {
        set({ customers: local });
      }
      set({ isLoadingCustomers: false, isLoading: false });
    } catch (e: any) {
      if (local.length > 0) {
        set({ customers: local, isLoadingCustomers: false, isLoading: false });
      } else {
        set({ isLoadingCustomers: false, isLoading: false, error: e.message || 'Lỗi khi tải khách hàng' });
      }
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
      const next = state.customers.map((c) => (c.id === id ? { ...c, ...data } : c));
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
      if (data.length > 0) set({ vouchers: data });
      set({ isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  addVoucher: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await crmService.addVoucher(item);
      set((state) => ({ vouchers: [created, ...state.vouchers], isLoading: false }));
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
      set((state) => ({
        vouchers: state.vouchers.map((v) => (v.id === id ? { ...v, ...updated } : v)),
        isLoading: false,
      }));
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
      if (data.length > 0) set({ customerVouchers: data });
      set({ isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  addCustomerVoucher: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await crmService.addCustomerVoucher(item);
      set((state) => ({ customerVouchers: [created, ...state.customerVouchers], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  updateCustomerVoucher: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await crmService.updateCustomerVoucher(id, data);
      set((state) => ({
        customerVouchers: state.customerVouchers.map((cv) => (cv.id === id ? { ...cv, ...updated } : cv)),
        isLoading: false,
      }));
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
      set((state) => ({ feedbacks: [created, ...state.feedbacks], isLoading: false }));
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
      set((state) => ({
        feedbacks: state.feedbacks.map((f) => (f.id === id ? { ...f, ...updated } : f)),
        isLoading: false,
      }));
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
      if (data.length > 0) set({ loyaltyHistories: data });
      set({ isLoading: false });
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  addLoyaltyHistory: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await crmService.addLoyaltyHistory(item);
      set((state) => ({ loyaltyHistories: [created, ...state.loyaltyHistories], isLoading: false }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
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
      set((state) => ({ marketingCampaigns: [created, ...state.marketingCampaigns], isLoading: false }));
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
      set((state) => ({
        marketingCampaigns: state.marketingCampaigns.map((mc) => (mc.id === id ? { ...mc, ...updated } : mc)),
        isLoading: false,
      }));
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
      set((state) => ({ loyaltyTiers: [created, ...state.loyaltyTiers], isLoading: false }));
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
      set((state) => ({
        loyaltyTiers: state.loyaltyTiers.map((t) => (t.id === id ? { ...t, ...updated } : t)),
        isLoading: false,
      }));
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
      set((state) => ({ partnerGroups: [created, ...state.partnerGroups], isLoading: false }));
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
      set((state) => ({
        partnerGroups: state.partnerGroups.map((pg) => (pg.id === id ? { ...pg, ...updated } : pg)),
        isLoading: false,
      }));
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
      set((state) => ({ productWarranties: [created, ...state.productWarranties], isLoading: false }));
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
      set((state) => ({
        productWarranties: state.productWarranties.map((pw) => (pw.id === id ? { ...pw, ...updated } : pw)),
        isLoading: false,
      }));
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
      set((state) => ({ warrantyClaims: [created, ...state.warrantyClaims], isLoading: false }));
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
      set((state) => ({
        warrantyClaims: state.warrantyClaims.map((wc) => (wc.id === id ? { ...wc, ...updated } : wc)),
        isLoading: false,
      }));
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
      set((state) => ({ supportTickets: [created, ...state.supportTickets], isLoading: false }));
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
      set((state) => ({
        supportTickets: state.supportTickets.map((st) => (st.id === id ? { ...st, ...updated } : st)),
        isLoading: false,
      }));
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
