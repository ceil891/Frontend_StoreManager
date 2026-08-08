import { axiosClient } from '@/shared/lib/axiosClient';
import { extractPageContent, toFormData } from '@/shared/lib/apiHelpers';
import { buildUserAvatarUrl } from '@/shared/utils/userAvatar';
import type {
  CustomerProfile,
  CustomerInput,
  VoucherRecord,
  CustomerVoucherRecord,
  FeedbackRecord,
  LoyaltyPointHistoryRecord,
  MarketingCampaignRecord,
  PartnerGroupRecord,
  ProductWarrantyRecord,
  WarrantyClaimRecord,
  SupportTicketRecord,
  TicketMessageRecord,
} from '../store/crmStore';

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

export const crmService = {
  // --- Customers ---
  async fetchCustomers(): Promise<CustomerProfile[]> {
    const data = await axiosClient.get<any, unknown>('/partnerarea/customers?size=500');
    const list = extractPageContent<any>(data);
    if (!Array.isArray(list)) return [];
    return list.map(mapCustomer);
  },

  async addCustomer(customer: CustomerInput): Promise<CustomerProfile> {
    const form = toFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      customerCode: customer.customerCode,
      notes: customer.notes,
      isActive: true,
    });
    const res = await axiosClient.post<any, any>('/partnerarea/customers', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const item = res?.data || res;
    return normalizeCustomer({
      id: String(item?.id || Date.now()),
      ...customer,
      ...(item || {}),
    });
  },

  async updateCustomer(id: string, data: Partial<CustomerProfile>): Promise<Partial<CustomerProfile>> {
    const form = toFormData({
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      customerCode: data.customerCode,
      notes: data.notes,
      isActive: data.status ? data.status === 'ACTIVE' : true,
    });
    const res = await axiosClient.put<any, any>(`/partnerarea/customers/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res?.data || res || data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await axiosClient.delete(`/partnerarea/customers/${id}`);
  },

  // --- Vouchers ---
  async fetchVouchers(): Promise<VoucherRecord[]> {
    const res = await axiosClient.get<any, any[]>('/crm/vouchers');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      code: item.code || item.voucherCode || '',
      name: item.name || item.voucherName || '',
      discountType: item.discountType || 'PERCENT',
      value: Number(item.value || 0),
      minOrderValue: Number(item.minOrderValue || 0),
      maxDiscount: Number(item.maxDiscount || 0),
      quantity: Number(item.quantity || 100),
      usedCount: Number(item.usedCount || 0),
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      status: item.status || 'ACTIVE',
    }));
  },

  async addVoucher(item: Omit<VoucherRecord, 'id'>): Promise<VoucherRecord> {
    const res = await axiosClient.post<any, any>('/crm/vouchers', item);
    const result = res?.data || res;
    return {
      id: String(result?.id || Date.now()),
      ...item,
      ...(result || {}),
    };
  },

  async updateVoucher(id: string, data: Partial<VoucherRecord>): Promise<Partial<VoucherRecord>> {
    const res = await axiosClient.put<any, any>(`/crm/vouchers/${id}`, data);
    return res?.data || res || data;
  },

  async deleteVoucher(id: string): Promise<void> {
    await axiosClient.delete(`/crm/vouchers/${id}`);
  },

  // --- Customer Vouchers ---
  async fetchCustomerVouchers(): Promise<CustomerVoucherRecord[]> {
    const res = await axiosClient.get<any, any[]>('/crm/customer-vouchers');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      customerName: item.customerName || item.customer?.name || '',
      customerPhone: item.customerPhone || item.customer?.phone || '',
      voucherCode: item.voucherCode || item.voucher?.code || '',
      voucherName: item.voucherName || item.voucher?.name || '',
      discountValue: Number(item.discountValue || 0),
      issueDate: item.issueDate ? item.issueDate.split('T')[0] : '',
      usedDate: item.usedDate ? item.usedDate.split('T')[0] : undefined,
      status: item.status || 'UNUSED',
    }));
  },

  async addCustomerVoucher(item: Omit<CustomerVoucherRecord, 'id'>): Promise<CustomerVoucherRecord> {
    const res = await axiosClient.post<any, any>('/crm/customer-vouchers', item);
    const result = res?.data || res;
    return {
      id: String(result?.id || Date.now()),
      ...item,
      ...(result || {}),
    };
  },

  async updateCustomerVoucher(id: string, data: Partial<CustomerVoucherRecord>): Promise<Partial<CustomerVoucherRecord>> {
    const res = await axiosClient.put<any, any>(`/crm/customer-vouchers/${id}`, data);
    return res?.data || res || data;
  },

  async deleteCustomerVoucher(id: string): Promise<void> {
    await axiosClient.delete(`/crm/customer-vouchers/${id}`);
  },

  // --- Feedbacks ---
  async fetchFeedbacks(): Promise<FeedbackRecord[]> {
    const res = await axiosClient.get<any, any[]>('/crm/feedbacks');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      customerName: item.customerName || '',
      customerPhone: item.customerPhone || '',
      rating: Number(item.rating || 5),
      content: item.content || '',
      category: item.category || 'SERVICE',
      status: item.status || 'PENDING',
      createdAt: item.createdAt ? item.createdAt.split('T')[0] : '',
      resolutionNote: item.resolutionNote,
    }));
  },

  async addFeedback(item: Omit<FeedbackRecord, 'id'>): Promise<FeedbackRecord> {
    const res = await axiosClient.post<any, any>('/crm/feedbacks', item);
    const result = res?.data || res;
    return {
      id: String(result?.id || Date.now()),
      ...item,
      ...(result || {}),
    };
  },

  async updateFeedback(id: string, data: Partial<FeedbackRecord>): Promise<Partial<FeedbackRecord>> {
    const res = await axiosClient.put<any, any>(`/crm/feedbacks/${id}`, data);
    return res?.data || res || data;
  },

  async deleteFeedback(id: string): Promise<void> {
    await axiosClient.delete(`/crm/feedbacks/${id}`);
  },

  // --- Loyalty Point Histories ---
  async fetchLoyaltyHistories(): Promise<LoyaltyPointHistoryRecord[]> {
    const res = await axiosClient.get<any, any[]>('/crm/loyalty-histories');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      customerName: item.customerName || '',
      customerPhone: item.customerPhone || '',
      actionType: item.actionType || 'EARN',
      pointsChange: Number(item.pointsChange || 0),
      balanceAfter: Number(item.balanceAfter || 0),
      referenceOrder: item.referenceOrder,
      notes: item.notes || '',
      createdAt: item.createdAt ? item.createdAt.split('T')[0] : '',
    }));
  },

  async addLoyaltyHistory(item: Omit<LoyaltyPointHistoryRecord, 'id'>): Promise<LoyaltyPointHistoryRecord> {
    const res = await axiosClient.post<any, any>('/crm/loyalty-histories', item);
    const result = res?.data || res;
    return {
      id: String(result?.id || Date.now()),
      ...item,
      ...(result || {}),
    };
  },

  // --- Marketing Campaigns ---
  async fetchMarketingCampaigns(): Promise<MarketingCampaignRecord[]> {
    const res = await axiosClient.get<any, any[]>('/crm/campaigns');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      code: item.campaignCode || item.code || '',
      title: item.name || item.title || '',
      channel: item.channel || 'SMS',
      targetAudience: item.targetAudience || 'Tất cả khách hàng',
      sentCount: Number(item.sentCount || 0),
      openRatePercentage: Number(item.openRatePercentage || 0),
      conversionRatePercentage: Number(item.conversionRatePercentage || 0),
      status: item.status || 'DRAFT',
      scheduledDate: item.startDate ? item.startDate.split('T')[0] : (item.scheduledDate ? item.scheduledDate.split('T')[0] : ''),
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      budget: Number(item.budget || 0),
      contentSnippet: item.contentSnippet || '',
    }));
  },

  async addMarketingCampaign(item: Omit<MarketingCampaignRecord, 'id'>): Promise<MarketingCampaignRecord> {
    const res = await axiosClient.post<any, any>('/crm/campaigns', item);
    const result = res?.data || res;
    return {
      id: String(result?.id || Date.now()),
      ...item,
      ...(result || {}),
    };
  },

  async updateMarketingCampaign(id: string, data: Partial<MarketingCampaignRecord>): Promise<Partial<MarketingCampaignRecord>> {
    const res = await axiosClient.put<any, any>(`/crm/campaigns/${id}`, data);
    return res?.data || res || data;
  },

  async deleteMarketingCampaign(id: string): Promise<void> {
    await axiosClient.delete(`/crm/campaigns/${id}`);
  },

  // --- Loyalty Tiers ---
  async fetchLoyaltyTiers(): Promise<any[]> {
    const res = await axiosClient.get<any, any[]>('/crm/tiers');
    return Array.isArray(res) ? res : (res?.content || []);
  },

  async addLoyaltyTier(tier: any): Promise<any> {
    const res = await axiosClient.post<any, any>('/crm/tiers', tier);
    return res?.data || res;
  },

  async updateLoyaltyTier(id: string, tier: any): Promise<any> {
    const res = await axiosClient.put<any, any>(`/crm/tiers/${id}`, tier);
    return res?.data || res;
  },

  async deleteLoyaltyTier(id: string): Promise<void> {
    await axiosClient.delete(`/crm/tiers/${id}`);
  },

  // --- Partner Groups ---
  async fetchPartnerGroups(): Promise<PartnerGroupRecord[]> {
    const res = await axiosClient.get<any, any[]>('/crm/partner-groups');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      groupCode: item.groupCode || '',
      groupName: item.groupName || item.name || '',
      partnerType: item.partnerType || 'CUSTOMER',
      description: item.description || '',
      membersCount: Number(item.membersCount ?? item.memberCount ?? 0),
      memberCount: Number(item.membersCount ?? item.memberCount ?? 0),
      defaultDiscountPercent: Number(item.defaultDiscountPercent || 0),
      status: item.status || 'ACTIVE',
    }));
  },

  async addPartnerGroup(item: Omit<PartnerGroupRecord, 'id'>): Promise<PartnerGroupRecord> {
    const res = await axiosClient.post<any, any>('/crm/partner-groups', item);
    const result = res?.data || res;
    return {
      id: String(result?.id || Date.now()),
      ...item,
      ...(result || {}),
    };
  },

  async updatePartnerGroup(id: string, data: Partial<PartnerGroupRecord>): Promise<Partial<PartnerGroupRecord>> {
    const res = await axiosClient.put<any, any>(`/crm/partner-groups/${id}`, data);
    return res?.data || res || data;
  },

  async deletePartnerGroup(id: string): Promise<void> {
    await axiosClient.delete(`/crm/partner-groups/${id}`);
  },

  // --- Product Warranties ---
  async fetchProductWarranties(): Promise<ProductWarrantyRecord[]> {
    const res = await axiosClient.get<any, any[]>('/crm/warranties');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      serialNumber: item.serialNumber || '',
      productName: item.productName || '',
      customerName: item.customerName || '',
      customerPhone: item.customerPhone || '',
      purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      warrantyMonths: Number(item.warrantyMonths || 12),
      status: item.status || 'VALID',
    }));
  },

  async addProductWarranty(item: Omit<ProductWarrantyRecord, 'id'>): Promise<ProductWarrantyRecord> {
    const res = await axiosClient.post<any, any>('/crm/warranties', item);
    const result = res?.data || res;
    return {
      id: String(result?.id || Date.now()),
      ...item,
      ...(result || {}),
    };
  },

  async updateProductWarranty(id: string, data: Partial<ProductWarrantyRecord>): Promise<Partial<ProductWarrantyRecord>> {
    const res = await axiosClient.put<any, any>(`/crm/warranties/${id}`, data);
    return res?.data || res || data;
  },

  async deleteProductWarranty(id: string): Promise<void> {
    await axiosClient.delete(`/crm/warranties/${id}`);
  },

  // --- Warranty Claims ---
  async fetchWarrantyClaims(): Promise<WarrantyClaimRecord[]> {
    const res = await axiosClient.get<any, any[]>('/crm/warranty-claims');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      claimCode: item.claimCode || '',
      serialNumber: item.serialNumber || '',
      productName: item.productName || '',
      customerName: item.customerName || '',
      customerPhone: item.customerPhone || '',
      issueDescription: item.issueDescription || '',
      resolution: item.resolution || 'IN_PROGRESS',
      receivedDate: item.receivedDate ? item.receivedDate.split('T')[0] : '',
      completedDate: item.completedDate ? item.completedDate.split('T')[0] : undefined,
      costAmount: Number(item.costAmount || 0),
      status: item.status || 'RECEIVED',
    }));
  },

  async addWarrantyClaim(item: Omit<WarrantyClaimRecord, 'id'>): Promise<WarrantyClaimRecord> {
    const res = await axiosClient.post<any, any>('/crm/warranty-claims', item);
    const result = res?.data || res;
    return {
      id: String(result?.id || Date.now()),
      ...item,
      ...(result || {}),
    };
  },

  async updateWarrantyClaim(id: string, data: Partial<WarrantyClaimRecord>): Promise<Partial<WarrantyClaimRecord>> {
    const res = await axiosClient.put<any, any>(`/crm/warranty-claims/${id}`, data);
    return res?.data || res || data;
  },

  async deleteWarrantyClaim(id: string): Promise<void> {
    await axiosClient.delete(`/crm/warranty-claims/${id}`);
  },

  // --- Support Tickets ---
  async fetchSupportTickets(): Promise<SupportTicketRecord[]> {
    const res = await axiosClient.get<any, any[]>('/crm/support-tickets');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      ticketCode: item.ticketCode || '',
      customerName: item.customerName || '',
      customerPhone: item.customerPhone || '',
      subject: item.subject || '',
      priority: item.priority || 'MEDIUM',
      category: item.category || 'GENERAL',
      assignedTo: item.assignedTo || 'Unassigned',
      status: item.status || 'OPEN',
      createdDate: item.createdDate ? item.createdDate.split('T')[0] : '',
    }));
  },

  async addSupportTicket(item: Omit<SupportTicketRecord, 'id'>): Promise<SupportTicketRecord> {
    const res = await axiosClient.post<any, any>('/crm/support-tickets', item);
    const result = res?.data || res;
    return {
      id: String(result?.id || Date.now()),
      ...item,
      ...(result || {}),
    };
  },

  async updateSupportTicket(id: string, data: Partial<SupportTicketRecord>): Promise<Partial<SupportTicketRecord>> {
    const res = await axiosClient.put<any, any>(`/crm/support-tickets/${id}`, data);
    return res?.data || res || data;
  },

  async deleteSupportTicket(id: string): Promise<void> {
    await axiosClient.delete(`/crm/support-tickets/${id}`);
  },

  // --- Ticket Messages ---
  async fetchTicketMessages(ticketId?: string): Promise<TicketMessageRecord[]> {
    const url = ticketId ? `/crm/support-tickets/${ticketId}/messages` : '/crm/ticket-messages';
    const res = await axiosClient.get<any, any[]>(url);
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      ticketId: String(item.ticketId || ticketId || '1'),
      senderName: item.senderName || '',
      isStaff: !!item.isStaff,
      message: item.message || '',
      createdAt: item.createdAt ? item.createdAt.split('T')[0] : '',
    }));
  },

  async addTicketMessage(item: Omit<TicketMessageRecord, 'id'>): Promise<TicketMessageRecord> {
    const res = await axiosClient.post<any, any>(`/crm/support-tickets/${item.ticketId}/messages`, item);
    const result = res?.data || res;
    return {
      id: String(result?.id || Date.now()),
      ...item,
      ...(result || {}),
    };
  },
};
