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
    avatarUrl: partial.avatarUrl?.trim() || '',
    loyaltyTier: partial.loyaltyTier ?? 'BRONZE',
    loyaltyPoints: partial.loyaltyPoints ?? 0,
    lifetimeSpent: partial.lifetimeSpent ?? 0,
    registeredDate: partial.registeredDate ?? new Date().toISOString().split('T')[0],
    lastActive: partial.lastActive ?? new Date().toISOString().split('T')[0],
    status: partial.status ?? 'ACTIVE',
    notes: partial.notes,
    taxCode: partial.taxCode,
    gender: partial.gender,
    dateOfBirth: partial.dateOfBirth,
    groupId: partial.groupId,
    areaId: partial.areaId,
  };
}

function normalizeRank(rank?: string): CustomerProfile['loyaltyTier'] {
  if (!rank) return 'BRONZE';
  const r = rank.toUpperCase();
  if (r.includes('DIAMOND') || r.includes('KIM CƯƠNG')) return 'DIAMOND';
  if (r.includes('PLATINUM') || r.includes('BẠCH KIM')) return 'ELITE_CLUB';
  if (r.includes('GOLD') || r.includes('VÀNG')) return 'GOLD';
  if (r.includes('SILVER') || r.includes('BẠC')) return 'SILVER';
  return 'BRONZE';
}

function mapCustomer(item: any): CustomerProfile {
  return normalizeCustomer({
    id: String(item.id),
    customerCode: item.customerCode || `CUST-${item.id}`,
    name: item.name || '',
    phone: item.phone || '',
    email: item.email || '',
    address: item.address || '',
    avatarUrl: item.avatarUrl || '',
    loyaltyTier: normalizeRank(item.membershipRank),
    loyaltyPoints: typeof item.points === 'number' ? item.points : Number(item.points || 0),
    lifetimeSpent: typeof item.totalSpend === 'number' ? item.totalSpend : Number(item.totalSpend || 0),
    status: item.isActive === false ? 'DORMANT' : 'ACTIVE',
    notes: item.note || item.notes || '',
    taxCode: item.taxCode || '',
    gender: item.gender || '',
    dateOfBirth: item.dob || '',
    groupId: item.groupId ? String(item.groupId) : '',
    areaId: item.areaId ? String(item.areaId) : '',
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
      note: customer.notes,
      isActive: true,
      dob: customer.dateOfBirth,
      taxCode: customer.taxCode,
      gender: customer.gender,
      groupId: customer.groupId,
      areaId: customer.areaId,
      avatarUrl: customer.avatarUrl,
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
      note: data.notes,
      isActive: data.status ? data.status === 'ACTIVE' : true,
      dob: data.dateOfBirth,
      taxCode: data.taxCode,
      gender: data.gender,
      groupId: data.groupId,
      areaId: data.areaId,
      avatarUrl: data.avatarUrl,
      membershipRank: data.loyaltyTier,
      points: data.loyaltyPoints,
      totalSpend: data.lifetimeSpent,
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
    const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      code: item.code || item.voucherCode || '',
      name: item.name || item.voucherName || '',
      discountType: item.type || item.discountType || 'PERCENTAGE',
      value: Number(item.value || 0),
      minOrderValue: Number(item.minOrderAmount ?? item.minOrderValue ?? 0),
      maxDiscount: Number(item.maxDiscountAmount ?? item.maxDiscount ?? 0),
      quantity: Number(item.maxUsage !== undefined && item.maxUsage !== null ? item.maxUsage : (item.quantity ?? 500)),
      usedCount: Number(item.currentUsage !== undefined && item.currentUsage !== null ? item.currentUsage : (item.usedCount ?? 0)),
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      status: item.status || 'ACTIVE',
    }));
  },

  async addVoucher(item: Omit<VoucherRecord, 'id'>): Promise<VoucherRecord> {
    const payload = {
      voucherCode: item.code,
      voucherName: item.name,
      type: item.discountType,
      value: item.value,
      minOrderAmount: item.minOrderValue,
      maxDiscountAmount: item.maxDiscount,
      maxUsage: item.quantity,
      status: item.status || 'ACTIVE',
      startDate: item.startDate ? `${item.startDate}T00:00:00` : null,
      endDate: item.endDate ? `${item.endDate}T23:59:59` : null,
      description: item.name,
    };
    const res = await axiosClient.post<any, any>('/crm/vouchers', payload);
    const result = res?.data || res;
    return {
      id: String(result?.id || Date.now()),
      ...item,
      ...(result || {}),
    };
  },

  async updateVoucher(id: string, data: Partial<VoucherRecord>): Promise<Partial<VoucherRecord>> {
    const payload: any = {};
    if (data.code !== undefined) payload.voucherCode = data.code;
    if (data.name !== undefined) {
      payload.voucherName = data.name;
      payload.description = data.name;
    }
    if (data.discountType !== undefined) payload.type = data.discountType;
    if (data.value !== undefined) payload.value = data.value;
    if (data.minOrderValue !== undefined) payload.minOrderAmount = data.minOrderValue;
    if (data.maxDiscount !== undefined) payload.maxDiscountAmount = data.maxDiscount;
    if (data.quantity !== undefined) payload.maxUsage = data.quantity;
    if (data.status !== undefined) payload.status = data.status;
    if (data.startDate !== undefined) payload.startDate = data.startDate ? `${data.startDate}T00:00:00` : null;
    if (data.endDate !== undefined) payload.endDate = data.endDate ? `${data.endDate}T23:59:59` : null;

    const res = await axiosClient.put<any, any>(`/crm/vouchers/${id}`, payload);
    return res?.data || res || data;
  },

  async deleteVoucher(id: string): Promise<void> {
    await axiosClient.delete(`/crm/vouchers/${id}`);
  },

  // --- Customer Vouchers ---
  async fetchCustomerVouchers(): Promise<CustomerVoucherRecord[]> {
    const res = await axiosClient.get<any, any[]>('/crm/customer-vouchers');
    const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
    return list.map((item: any) => {
      let status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED' = 'ACTIVE';
      if (item.status === 'USED') status = 'USED';
      else if (item.status === 'EXPIRED') status = 'EXPIRED';
      else if (item.status === 'CANCELLED' || item.status === 'REVOKED') status = 'CANCELLED';
      else if (item.status === 'UNUSED' || item.status === 'ACTIVE') status = 'ACTIVE';

      return {
        id: String(item.id),
        customerName: item.customerName || item.customer?.name || '',
        customerPhone: item.customerPhone || item.customer?.phone || '',
        customerCode: item.customerCode || item.customer?.customerCode || (item.customer?.id ? `KH-${String(item.customer.id).padStart(6, '0')}` : undefined),
        voucherCode: item.voucherCode || item.code || item.voucher?.voucherCode || '',
        programId: item.programId || (item.voucher?.id ? String(item.voucher.id) : undefined),
        programName: item.programName || item.voucherName || item.voucher?.voucherName || item.voucher?.name || 'Chương trình chung',
        voucherName: item.voucherName || item.voucher?.voucherName || '',
        discountType: item.discountType || item.type || item.voucher?.type || 'FIXED_AMOUNT',
        discountValue: Number(item.discountValue || item.value || item.voucher?.value || 0),
        minOrderValue: Number(item.minOrderValue || item.minOrderAmount || item.voucher?.minOrderAmount || 0),
        maxDiscount: Number(item.maxDiscount || item.maxDiscountAmount || item.voucher?.maxDiscountAmount || 0),
        issueDate: item.issueDate || item.collectedAt ? (item.issueDate || item.collectedAt).split('T')[0] : new Date().toISOString().split('T')[0],
        expiryDate: item.expiryDate || item.expiredAt ? (item.expiryDate || item.expiredAt).split('T')[0] : '',
        usedDate: item.usedDate || item.usedAt ? (item.usedDate || item.usedAt).split('T')[0] : undefined,
        usedOrderId: item.usedOrderId || (item.usedOrder?.id ? `SO-${item.usedOrder.id}` : undefined),
        status,
        notes: item.notes || item.description || '',
      };
    });
  },

  async addCustomerVoucher(item: Omit<CustomerVoucherRecord, 'id'>): Promise<CustomerVoucherRecord> {
    try {
      const payload: any = {
        ...item,
        voucherCode: item.voucherCode,
        collectedAt: item.issueDate ? `${item.issueDate}T00:00:00` : new Date().toISOString(),
        expiredAt: item.expiryDate ? `${item.expiryDate}T23:59:59` : null,
        status: item.status || 'ACTIVE',
        notes: item.notes,
        customerId: item.customerId ? Number(item.customerId) : 1,
        programId: item.programId ? Number(item.programId) : 1,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        customerCode: item.customerCode,
        voucherName: item.voucherName || item.programName,
        discountValue: item.discountValue,
        discountType: item.discountType,
        minOrderValue: item.minOrderValue,
        maxDiscount: item.maxDiscount,
        issueDate: item.issueDate,
        expiryDate: item.expiryDate,
      };

      const res = await axiosClient.post<any, any>('/crm/customer-vouchers', payload);
      const result = res?.data || res;
      return {
        id: String(result?.id || Date.now()),
        ...item,
        ...(typeof result === 'object' ? result : {}),
      };
    } catch (err) {
      console.warn('API addCustomerVoucher failed, saving locally:', err);
      return {
        id: String(Date.now() + Math.floor(Math.random() * 1000)),
        ...item,
        status: item.status || 'ACTIVE',
      };
    }
  },

  async updateCustomerVoucher(id: string, data: Partial<CustomerVoucherRecord>): Promise<Partial<CustomerVoucherRecord>> {
    const payload: any = { ...data };
    if (data.issueDate) payload.collectedAt = `${data.issueDate}T00:00:00`;
    if (data.expiryDate) payload.expiredAt = `${data.expiryDate}T23:59:59`;
    if (data.usedDate) payload.usedAt = `${data.usedDate}T00:00:00`;
    const res = await axiosClient.put<any, any>(`/crm/customer-vouchers/${id}`, payload);
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
    const res = await axiosClient.get<any, any>('/crm/loyalty-histories');
    const list = extractPageContent<any>(res);
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => ({
      id: String(item.id),
      customerName: item.customerName || item.customer?.name || item.name || 'Khách hàng',
      customerPhone: item.customerPhone || item.customer?.phone || item.phone || '',
      actionType: item.actionType || item.transactionType || 'EARN',
      pointsChange: Number(item.pointsChange || item.pointChange || 0),
      balanceAfter: Number(item.balanceAfter || item.currentPoints || item.pointBalanceAfter || 0),
      referenceOrder: item.referenceOrder || item.refCode || item.refDocument || `REF-${item.id}`,
      notes: item.notes || item.description || '',
      createdAt: item.createdAt ? (typeof item.createdAt === 'string' ? item.createdAt.split('T')[0] : item.createdAt) : new Date().toISOString().split('T')[0],
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
    const res = await axiosClient.get<any, any>('/crm/support-tickets');
    let list: any[] = [];
    if (Array.isArray(res)) {
      list = res;
    } else if (Array.isArray(res?.data)) {
      list = res.data;
    } else if (Array.isArray(res?.content)) {
      list = res.content;
    } else if (Array.isArray(res?.data?.content)) {
      list = res.data.content;
    }

    return list.map((item: any) => ({
      id: String(item.id),
      ticketCode: item.ticketCode || `TCK-${item.id}`,
      customerName: item.customerName || 'Khách hàng Web Online',
      customerPhone: item.customerPhone || '',
      subject: item.subject || item.title || 'Yêu cầu hỗ trợ',
      priority: item.priority || 'MEDIUM',
      category: item.category || 'GENERAL',
      assignedTo: item.assignedTo || 'Nhân viên CSKH',
      status: item.status || 'OPEN',
      createdDate: item.createdDate ? (item.createdDate.includes('T') ? item.createdDate.split('T')[0] : item.createdDate) : '',
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
    const res = await axiosClient.get<any, any>(url);
    let list: any[] = [];
    if (Array.isArray(res)) {
      list = res;
    } else if (Array.isArray(res?.data)) {
      list = res.data;
    } else if (Array.isArray(res?.content)) {
      list = res.content;
    } else if (Array.isArray(res?.data?.content)) {
      list = res.data.content;
    }

    return list.map((item: any) => {
      let timeStr = item.createdAt || '';
      if (timeStr.includes('T')) {
        timeStr = timeStr.replace('T', ' ').substring(0, 19);
      }
      return {
        id: String(item.id),
        ticketId: String(item.ticketId || ticketId || '1'),
        senderName: item.senderName || (item.isStaff ? 'Nhân viên CSKH' : 'Khách hàng Web Online'),
        isStaff: Boolean(item.isStaff),
        message: item.message || '',
        createdAt: timeStr,
      };
    });
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
