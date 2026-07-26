import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { buildUserAvatarUrl } from '@/shared/utils/userAvatar';
import { axiosClient } from '@/shared/lib/axiosClient';
import { extractPageContent, toFormData } from '@/shared/lib/apiHelpers';

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
  openRate: number;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
}

export interface PartnerGroupRecord {
  id: string;
  groupCode: string;
  groupName: string;
  memberCount: number;
  discountRate: number;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ProductWarrantyRecord {
  id: string;
  serialNumber: string;
  productName: string;
  customerName: string;
  phone: string;
  purchaseDate: string;
  expiryDate: string;
  status: 'VALID' | 'EXPIRED' | 'CLAIMED';
}

export interface WarrantyClaimRecord {
  id: string;
  claimCode: string;
  serialNumber: string;
  customerName: string;
  issueDescription: string;
  receivedDate: string;
  status: 'RECEIVED' | 'IN_REPAIR' | 'COMPLETED' | 'REJECTED';
  repairedBy?: string;
  notes?: string;
}

export interface SupportTicketRecord {
  id: string;
  ticketCode: string;
  customerName: string;
  subject: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
  assignee?: string;
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

function normalizeCustomer(partial: Partial<CustomerProfile> & Pick<CustomerProfile, 'id' | 'name'>): CustomerProfile {
  const seed = partial.email || partial.customerCode || partial.name;
  return {
    id: partial.id,
    customerCode: partial.customerCode ?? `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
    name: partial.name,
    phone: partial.phone ?? '',
    email: partial.email ?? '',
    address: partial.address ?? '',
    avatarUrl: partial.avatarUrl?.trim() || buildUserAvatarUrl(seed),
    loyaltyTier: partial.loyaltyTier ?? 'BRONZE',
    loyaltyPoints: partial.loyaltyPoints ?? 0,
    lifetimeSpent: partial.lifetimeSpent ?? 0,
    registeredDate: partial.registeredDate ?? new Date().toISOString().split('T')[0],
    lastActive: partial.lastActive ?? new Date().toISOString().split('T')[0],
    status: partial.status ?? 'ACTIVE',
    notes: partial.notes,
  };
}

function mapCustomer(item: any): CustomerProfile {
  return normalizeCustomer({
    id: String(item.id),
    customerCode: item.customerCode || `CUST-${item.id}`,
    name: item.name || '',
    phone: item.phone || '',
    email: item.email || '',
    address: item.address || '',
    status: item.isActive === false ? 'DORMANT' : 'ACTIVE',
    notes: item.notes || '',
  });
}

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

export const useCrmStore = create<CRMState>()(
  persist(
    (set, get) => ({
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

      fetchCustomers: async () => {
        set({ isLoadingCustomers: true });
        try {
          const data = await axiosClient.get<any, unknown>('/partnerarea/customers?size=500');
          const list = extractPageContent<any>(data);
          if (list && list.length > 0) {
            set({ customers: list.map(mapCustomer), isLoadingCustomers: false });
          } else {
            set({ isLoadingCustomers: false });
          }
        } catch {
          set({ isLoadingCustomers: false });
        }
      },

      addCustomer: async (customer) => {
        try {
          await axiosClient.post('/partnerarea/customers', customer);
          await get().fetchCustomers();
        } catch (e) {
          console.error(e);
        }
      },

      updateCustomer: async (id, data) => {
        try {
          await axiosClient.put(`/partnerarea/customers/${id}`, data);
          await get().fetchCustomers();
        } catch (e) {
          console.error(e);
        }
      },

      deleteCustomer: async (id) => {
        try {
          await axiosClient.delete(`/partnerarea/customers/${id}`);
          await get().fetchCustomers();
        } catch (e) {
          console.error(e);
        }
      },

      fetchVouchers: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/crm/vouchers');
          set({ vouchers: res });
        } catch (e) {
          console.error(e);
        }
      },
      addVoucher: async (item) => {
        try {
          await axiosClient.post('/crm/vouchers', item);
          await get().fetchVouchers();
        } catch (e) {
          console.error(e);
        }
      },
      updateVoucher: async (id, data) => {
        try {
          await axiosClient.put(`/crm/vouchers/${id}`, data);
          await get().fetchVouchers();
        } catch (e) {
          console.error(e);
        }
      },
      deleteVoucher: async (id) => {
        try {
          await axiosClient.delete(`/crm/vouchers/${id}`);
          await get().fetchVouchers();
        } catch (e) {
          console.error(e);
        }
      },

      fetchCustomerVouchers: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/crm/customer-vouchers');
          set({ customerVouchers: res });
        } catch (e) {
          console.error(e);
        }
      },
      addCustomerVoucher: async (item) => {
        try {
          await axiosClient.post('/crm/customer-vouchers', item);
          await get().fetchCustomerVouchers();
        } catch (e) {
          console.error(e);
        }
      },
      updateCustomerVoucher: async (id, data) => {
        try {
          await axiosClient.put(`/crm/customer-vouchers/${id}`, data);
          await get().fetchCustomerVouchers();
        } catch (e) {
          console.error(e);
        }
      },
      deleteCustomerVoucher: async (id) => {
        try {
          await axiosClient.delete(`/crm/customer-vouchers/${id}`);
          await get().fetchCustomerVouchers();
        } catch (e) {
          console.error(e);
        }
      },

      fetchFeedbacks: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/crm/feedback');
          set({ feedbacks: res });
        } catch (e) {
          console.error(e);
        }
      },
      addFeedback: async (item) => {
        try {
          await axiosClient.post('/crm/feedback', item);
          await get().fetchFeedbacks();
        } catch (e) {
          console.error(e);
        }
      },
      updateFeedback: async (id, data) => {
        try {
          await axiosClient.put(`/crm/feedback/${id}`, data);
          await get().fetchFeedbacks();
        } catch (e) {
          console.error(e);
        }
      },
      deleteFeedback: async (id) => {
        try {
          await axiosClient.delete(`/crm/feedback/${id}`);
          await get().fetchFeedbacks();
        } catch (e) {
          console.error(e);
        }
      },

      fetchLoyaltyHistories: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/crm/loyalty-history');
          set({ loyaltyHistories: res });
        } catch (e) {
          console.error(e);
        }
      },
      addLoyaltyHistory: async (item) => {
        try {
          await axiosClient.post('/crm/loyalty-history', item);
          await get().fetchLoyaltyHistories();
        } catch (e) {
          console.error(e);
        }
      },

      fetchMarketingCampaigns: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/crm/campaigns');
          set({ marketingCampaigns: res });
        } catch (e) {
          console.error(e);
        }
      },
      addMarketingCampaign: async (item) => {
        try {
          await axiosClient.post('/crm/campaigns', item);
          await get().fetchMarketingCampaigns();
        } catch (e) {
          console.error(e);
        }
      },
      updateMarketingCampaign: async (id, data) => {
        try {
          await axiosClient.put(`/crm/campaigns/${id}`, data);
          await get().fetchMarketingCampaigns();
        } catch (e) {
          console.error(e);
        }
      },
      deleteMarketingCampaign: async (id) => {
        try {
          await axiosClient.delete(`/crm/campaigns/${id}`);
          await get().fetchMarketingCampaigns();
        } catch (e) {
          console.error(e);
        }
      },

      fetchPartnerGroups: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/crm/partner-groups');
          set({ partnerGroups: res });
        } catch (e) {
          console.error(e);
        }
      },
      addPartnerGroup: async (item) => {
        try {
          await axiosClient.post('/crm/partner-groups', item);
          await get().fetchPartnerGroups();
        } catch (e) {
          console.error(e);
        }
      },
      updatePartnerGroup: async (id, data) => {
        try {
          await axiosClient.put(`/crm/partner-groups/${id}`, data);
          await get().fetchPartnerGroups();
        } catch (e) {
          console.error(e);
        }
      },
      deletePartnerGroup: async (id) => {
        try {
          await axiosClient.delete(`/crm/partner-groups/${id}`);
          await get().fetchPartnerGroups();
        } catch (e) {
          console.error(e);
        }
      },

      fetchProductWarranties: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/crm/warranties');
          set({ productWarranties: res });
        } catch (e) {
          console.error(e);
        }
      },
      addProductWarranty: async (item) => {
        try {
          await axiosClient.post('/crm/warranties', item);
          await get().fetchProductWarranties();
        } catch (e) {
          console.error(e);
        }
      },
      updateProductWarranty: async (id, data) => {
        try {
          await axiosClient.put(`/crm/warranties/${id}`, data);
          await get().fetchProductWarranties();
        } catch (e) {
          console.error(e);
        }
      },
      deleteProductWarranty: async (id) => {
        try {
          await axiosClient.delete(`/crm/warranties/${id}`);
          await get().fetchProductWarranties();
        } catch (e) {
          console.error(e);
        }
      },

      fetchWarrantyClaims: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/crm/warranty-claims');
          set({ warrantyClaims: res });
        } catch (e) {
          console.error(e);
        }
      },
      addWarrantyClaim: async (item) => {
        try {
          await axiosClient.post('/crm/warranty-claims', item);
          await get().fetchWarrantyClaims();
        } catch (e) {
          console.error(e);
        }
      },
      updateWarrantyClaim: async (id, data) => {
        try {
          await axiosClient.put(`/crm/warranty-claims/${id}`, data);
          await get().fetchWarrantyClaims();
        } catch (e) {
          console.error(e);
        }
      },
      deleteWarrantyClaim: async (id) => {
        try {
          await axiosClient.delete(`/crm/warranty-claims/${id}`);
          await get().fetchWarrantyClaims();
        } catch (e) {
          console.error(e);
        }
      },

      fetchSupportTickets: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/crm/tickets');
          set({ supportTickets: res });
        } catch (e) {
          console.error(e);
        }
      },
      addSupportTicket: async (item) => {
        try {
          await axiosClient.post('/crm/tickets', item);
          await get().fetchSupportTickets();
        } catch (e) {
          console.error(e);
        }
      },
      updateSupportTicket: async (id, data) => {
        try {
          await axiosClient.put(`/crm/tickets/${id}`, data);
          await get().fetchSupportTickets();
        } catch (e) {
          console.error(e);
        }
      },
      deleteSupportTicket: async (id) => {
        try {
          await axiosClient.delete(`/crm/tickets/${id}`);
          await get().fetchSupportTickets();
        } catch (e) {
          console.error(e);
        }
      },

      fetchTicketMessages: async (ticketId) => {
        try {
          const url = ticketId ? `/crm/ticket-messages?ticketId=${ticketId}` : '/crm/ticket-messages';
          const res = await axiosClient.get<any, any[]>(url);
          set({ ticketMessages: res });
        } catch (e) {
          console.error(e);
        }
      },
      addTicketMessage: async (item) => {
        try {
          await axiosClient.post('/crm/ticket-messages', item);
          await get().fetchTicketMessages(item.ticketId);
        } catch (e) {
          console.error(e);
        }
      },
    }),
    {
      name: 'retailhub-crm-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
