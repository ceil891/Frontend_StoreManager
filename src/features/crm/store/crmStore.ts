import { create } from 'zustand';
import { crmService } from '../services/crmService';
import { axiosClient } from '@/shared/lib/axiosClient';

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
  isCreditBlocked?: boolean;
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
  customerId?: string | number;
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
  addCustomer: (customer: CustomerInput) => Promise<CustomerProfile>;
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
  markVoucherUsed: (voucherCode: string, orderCode?: string) => Promise<void>;

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

  blockedCreditCustomerIds: string[];
  toggleBlockCredit: (customerId: string) => boolean;
  isCustomerCreditBlocked: (customerId: string) => boolean;
}

const getSavedBlockedCredit = (): string[] => {
  try {
    const saved = localStorage.getItem('retailhub_blocked_credit_customers');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

const saveBlockedCredit = (ids: string[]) => {
  try {
    localStorage.setItem('retailhub_blocked_credit_customers', JSON.stringify(ids));
  } catch {}
};

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

export const DEFAULT_MOCK_FEEDBACKS: FeedbackRecord[] = [];

export const DEFAULT_MOCK_TICKETS: SupportTicketRecord[] = [];

export const DEFAULT_MOCK_TICKET_MESSAGES: TicketMessageRecord[] = [];

export const useCrmStore = create<CRMState>()((set, get) => ({
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

  blockedCreditCustomerIds: getSavedBlockedCredit(),

  toggleBlockCredit: (customerId: string) => {
    let nowBlocked = false;
    set((state) => {
      const targetCustomer = state.customers.find((c) => String(c.id) === String(customerId));
      const currentlyBlocked = targetCustomer?.isCreditBlocked ?? state.blockedCreditCustomerIds.includes(String(customerId));
      nowBlocked = !currentlyBlocked;

      const nextIds = nowBlocked
        ? Array.from(new Set([...state.blockedCreditCustomerIds, String(customerId)]))
        : state.blockedCreditCustomerIds.filter((id) => id !== String(customerId));
      saveBlockedCredit(nextIds);

      const updatedCustomers = state.customers.map((c) =>
        String(c.id) === String(customerId) ? { ...c, isCreditBlocked: nowBlocked } : c
      );

      // Async sync to backend API
      crmService.toggleCustomerCreditBlock(String(customerId), nowBlocked).catch((err) => {
        console.warn('Failed to sync credit block to backend API:', err);
      });

      return {
        blockedCreditCustomerIds: nextIds,
        customers: updatedCustomers,
      };
    });
    return nowBlocked;
  },

  isCustomerCreditBlocked: (customerId: string) => {
    const cust = get().customers.find((c) => String(c.id) === String(customerId));
    if (cust && cust.isCreditBlocked !== undefined) {
      return Boolean(cust.isCreditBlocked);
    }
    return get().blockedCreditCustomerIds.includes(String(customerId));
  },

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
    try {
      const created = await crmService.addCustomer(customer);
      set((state) => ({
        customers: [created, ...state.customers.filter(c => c.id !== created.id)],
        isLoading: false,
      }));
      return created;
    } catch (e: any) {
      set({ isLoading: false, error: e.message || 'Lỗi khi thêm khách hàng' });
      throw e;
    }
  },

  updateCustomer: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await crmService.updateCustomer(id, data);
      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? { ...c, ...updated } : c)),
        isLoading: false,
      }));
    } catch (e: any) {
      set({ isLoading: false, error: e.message || 'Lỗi khi cập nhật khách hàng' });
      throw e;
    }
  },

  deleteCustomer: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await crmService.deleteCustomer(id);
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (e: any) {
      set({ isLoading: false, error: e.message || 'Lỗi khi xóa khách hàng' });
      throw e;
    }
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
      console.error('Failed to delete voucher:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa' });
      throw e;
    }
  },

  fetchCustomerVouchers: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await crmService.fetchCustomerVouchers();
      set({ customerVouchers: Array.isArray(data) ? data : [], isLoading: false });
    } catch (e: any) {
      console.warn('Fetch customer vouchers error:', e);
      set({ customerVouchers: [], isLoading: false });
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
      console.error('Failed to delete customer voucher:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa' });
      throw e;
    }
  },

  markVoucherUsed: async (voucherCode: string, orderCode?: string) => {
    if (!voucherCode) return;
    try {
      const now = new Date().toISOString();
      try {
        await axiosClient.post('/crm/customer-vouchers/use-by-code', null, {
          params: { code: voucherCode, orderCode }
        });
      } catch (apiErr) {
        console.warn('API mark voucher used failed, updating local state:', apiErr);
      }

      set((state) => {
        const nextCustomerVouchers = state.customerVouchers.map((cv) => {
          if ((cv.voucherCode || '').toUpperCase() === voucherCode.toUpperCase()) {
            return {
              ...cv,
              status: 'USED' as const,
              usedDate: now,
              usedOrderId: orderCode || cv.usedOrderId,
            };
          }
          return cv;
        });

        const nextVouchers = state.vouchers.map((v) => {
          if ((v.code || '').toUpperCase() === voucherCode.toUpperCase()) {
            return {
              ...v,
              usedCount: (v.usedCount || 0) + 1,
            };
          }
          return v;
        });

        return {
          customerVouchers: nextCustomerVouchers,
          vouchers: nextVouchers,
        };
      });
    } catch (e: any) {
      console.error('Failed to mark voucher as used:', e);
    }
  },

  fetchFeedbacks: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await crmService.fetchFeedbacks();
      if (data && data.length > 0) {
        set({ feedbacks: data, isLoading: false });
      } else {
        set({ feedbacks: DEFAULT_MOCK_FEEDBACKS, isLoading: false });
      }
    } catch (e: any) {
      console.error(e);
      set({ feedbacks: DEFAULT_MOCK_FEEDBACKS, isLoading: false });
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
        const merged = target ? { ...target, ...updated } : (updated as FeedbackRecord);
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
      console.error('Failed to delete feedback:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa phản hồi' });
      throw e;
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
      if (updatedCustomer && updatedCustomer.id) {
        crmService.updateCustomer(String(updatedCustomer.id), updatedCustomer).catch((err) => {
          console.warn('Background sync customer points to backend failed:', err);
        });
      }

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

      // Persist to backend
      crmService.addLoyaltyHistory(newHistoryItem).catch((err) => {
        console.warn('Background sync loyalty history to backend failed:', err);
      });

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
      console.error('Failed to delete marketing campaign:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa chiến dịch' });
      throw e;
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
      console.error('Failed to delete loyalty tier:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa hạng thành viên' });
      throw e;
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
      console.error('Failed to delete partner group:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa nhóm đối tác' });
      throw e;
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
      console.error('Failed to delete product warranty:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa chính sách bảo hành' });
      throw e;
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
      console.error('Failed to delete warranty claim:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa yêu cầu bảo hành' });
      throw e;
    }
  },

  fetchSupportTickets: async () => {
    try {
      const data = await crmService.fetchSupportTickets();
      if (Array.isArray(data) && data.length > 0) {
        set({ supportTickets: data, isLoading: false });
      }
    } catch (e: any) {
      console.warn('fetchSupportTickets failed:', e);
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
      console.error('Failed to delete support ticket:', e);
      set({ isLoading: false, error: e?.message || 'Lỗi khi xóa phiếu hỗ trợ' });
      throw e;
    }
  },

  fetchTicketMessages: async (ticketId) => {
    try {
      const data = await crmService.fetchTicketMessages(ticketId);
      if (Array.isArray(data) && data.length > 0) {
        set({ ticketMessages: data, isLoading: false });
      }
    } catch (e: any) {
      console.warn('fetchTicketMessages failed:', e);
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
