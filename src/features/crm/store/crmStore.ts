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

const DEFAULT_CUSTOMERS: CustomerProfile[] = [
  normalizeCustomer({ id: '1', customerCode: 'CUST-88102', name: 'Nguyễn Văn an', phone: '0909111222', email: 'nguyen.van.an@email.com', address: '12 Lê Lợi, Q.1, TP.HCM', avatarUrl: buildUserAvatarUrl('nguyen.van.an@email.com'), loyaltyTier: 'DIAMOND', loyaltyPoints: 12500, lifetimeSpent: 14500.5, registeredDate: '2023-01-15', lastActive: '2024-05-17', status: 'ACTIVE', notes: 'Khách hàng doanh nghiệp VIP.' }),
  normalizeCustomer({ id: '2', customerCode: 'CUST-88105', name: 'Trần Thị Bình', phone: '0918222333', email: 'tran.thi.binh@email.com', address: '45 Cộng Hòa, Tân Bình', avatarUrl: buildUserAvatarUrl('tran.thi.binh@email.com'), loyaltyTier: 'GOLD', loyaltyPoints: 4500, lifetimeSpent: 4200, registeredDate: '2023-06-10', lastActive: '2024-05-14', status: 'ACTIVE' }),
  normalizeCustomer({ id: '3', customerCode: 'CUST-88112', name: 'Lê Hoàng Cường', phone: '0929333444', email: 'le.hoang.cuong@email.com', address: '89 Quang Trung, Gò Vấp', avatarUrl: buildUserAvatarUrl('le.hoang.cuong@email.com'), loyaltyTier: 'SILVER', loyaltyPoints: 850, lifetimeSpent: 950, registeredDate: '2023-11-01', lastActive: '2024-04-20', status: 'ACTIVE' }),
  normalizeCustomer({ id: '4', customerCode: 'CUST-88119', name: 'Phạm thị dung', phone: '0938444555', email: 'pham.thi.dung@email.com', address: '10 Nguyễn Văn Linh, Q.7', avatarUrl: buildUserAvatarUrl('pham.thi.dung@email.com'), loyaltyTier: 'BRONZE', loyaltyPoints: 120, lifetimeSpent: 185, registeredDate: '2024-02-14', lastActive: '2024-02-14', status: 'DORMANT', notes: 'Chưa mua lại 90 ngày.' }),
  normalizeCustomer({ id: '5', customerCode: 'CUST-88125', name: 'Hoàng Văn em', phone: '0947555666', email: 'hoang.van.em@email.com', address: '56 Lê Lợi, Thủ Dầu Một', avatarUrl: buildUserAvatarUrl('hoang.van.em@email.com'), loyaltyTier: 'GOLD', loyaltyPoints: 5200, lifetimeSpent: 5800.75, registeredDate: '2023-03-25', lastActive: '2024-05-16', status: 'ACTIVE' }),
];

const MOCK_TIERS: LoyaltyTierConfig[] = [
  { id: '1', tierCode: 'TR-BRONZE', tierName: 'BRONZE', minSpendThreshold: 0, pointsMultiplier: 1.0, discountPercentage: 0, activeMembersCount: 8412, freeShippingEligible: false, prioritySupport: false, status: 'ACTIVE', description: 'Hạng mặc định khi đăng ký.' },
  { id: '2', tierCode: 'TR-SILVER', tierName: 'SILVER', minSpendThreshold: 500, pointsMultiplier: 1.25, discountPercentage: 5, activeMembersCount: 3120, freeShippingEligible: true, prioritySupport: false, status: 'ACTIVE', description: 'Giảm 5% và miễn phí ship chuẩn.' },
  { id: '3', tierCode: 'TR-GOLD', tierName: 'GOLD', minSpendThreshold: 2000, pointsMultiplier: 1.5, discountPercentage: 10, activeMembersCount: 1205, freeShippingEligible: true, prioritySupport: true, status: 'ACTIVE', description: 'VIP 10% và hỗ trợ ưu tiên.' },
  { id: '4', tierCode: 'TR-DIAMOND', tierName: 'DIAMOND', minSpendThreshold: 5000, pointsMultiplier: 2.0, discountPercentage: 15, activeMembersCount: 420, freeShippingEligible: true, prioritySupport: true, status: 'ACTIVE', description: 'Hạng kim cương — điểm x2.' },
  { id: '5', tierCode: 'TR-ELITE', tierName: 'ELITE_CLUB', minSpendThreshold: 15000, pointsMultiplier: 3.0, discountPercentage: 25, activeMembersCount: 15, freeShippingEligible: true, prioritySupport: true, status: 'DRAFT', description: 'Hạng mời — đang pilot.' },
];

function mergeCustomers(users: CustomerProfile[]): CustomerProfile[] {
  const byCode = new Map(DEFAULT_CUSTOMERS.map((c) => [c.customerCode, c]));
  const seen = new Set<string>();
  const merged = users.map((raw) => {
    const def = byCode.get(raw.customerCode);
    seen.add(raw.customerCode);
    return normalizeCustomer({ ...def, ...raw, id: raw.id, name: raw.name || def?.name || 'Khách' });
  });
  for (const def of DEFAULT_CUSTOMERS) {
    if (!seen.has(def.customerCode)) merged.push(def);
  }
  return merged;
}

interface CRMState {
  customers: CustomerProfile[];
  loyaltyTiers: LoyaltyTierConfig[];
  isLoadingCustomers: boolean;

  fetchCustomers: () => Promise<void>;
  addCustomer: (customer: CustomerInput) => Promise<void>;
  updateCustomer: (id: string, data: Partial<CustomerProfile>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  toggleCustomerStatus: (id: string, isActive: boolean) => Promise<void>;

  fetchTiers: () => Promise<void>;
  addTier: (tier: Omit<LoyaltyTierConfig, 'id'>) => Promise<void>;
  updateTier: (id: string, data: Partial<LoyaltyTierConfig>) => Promise<void>;
  deleteTier: (id: string) => Promise<void>;
}

export const useCrmStore = create<CRMState>()(
  persist(
    (set, get) => ({
      customers: [],
      loyaltyTiers: [],
      isLoadingCustomers: false,

      fetchCustomers: async () => {
        set({ isLoadingCustomers: true });
        try {
          const data = await axiosClient.get<any, unknown>('/partnerarea/customers?size=500');
          const list = extractPageContent<any>(data);
          set({ customers: list.map(mapCustomer), isLoadingCustomers: false });
        } catch (err) {
          console.error('Failed to fetch customers:', err);
          set({ isLoadingCustomers: false });
        }
      },

      addCustomer: async (customer) => {
        try {
          const form = toFormData({
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            notes: customer.notes,
            isActive: customer.status === 'ACTIVE'
          });
          await axiosClient.post('/partnerarea/customers', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          await get().fetchCustomers();
        } catch (err) {
          console.error('Failed to add customer:', err);
        }
      },

      updateCustomer: async (id, data) => {
        try {
          const form = toFormData({
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            notes: data.notes,
          });
          await axiosClient.put(`/partnerarea/customers/${id}`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          await get().fetchCustomers();
        } catch (err) {
          console.error('Failed to update customer:', err);
        }
      },

      deleteCustomer: async (id) => {
        try {
          await axiosClient.delete(`/partnerarea/customers/${id}`);
          set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
        } catch (err) {
          console.error('Failed to delete customer:', err);
        }
      },
      
      toggleCustomerStatus: async (id, isActive) => {
        try {
          await axiosClient.patch(`/partnerarea/customers/${id}/status`, null, { params: { isActive } });
          await get().fetchCustomers();
        } catch (err) {
          console.error('Failed to toggle customer status:', err);
        }
      },

      fetchTiers: async () => {
        try {
          const res = await axiosClient.get<any, any>('/crm/tiers');
          const data = res.content || res || [];
          if (Array.isArray(data) && data.length > 0) {
            set({ loyaltyTiers: data.map((item: any) => ({
              id: String(item.id),
              tierCode: item.tierCode || `TR-${item.id}`,
              tierName: item.tierName || 'BRONZE',
              minSpendThreshold: Number(item.minSpendThreshold || 0),
              pointsMultiplier: Number(item.pointsMultiplier || 1.0),
              discountPercentage: Number(item.discountPercentage || 0),
              activeMembersCount: Number(item.activeMembersCount || 0),
              freeShippingEligible: Boolean(item.freeShippingEligible),
              prioritySupport: Boolean(item.prioritySupport),
              status: item.status || 'ACTIVE',
              description: item.description || '',
            })) });
          }
        } catch (e) {
          console.error('Failed to fetch tiers:', e);
        }
      },

      addTier: async (tier) => {
        try {
          await axiosClient.post('/crm/tiers', tier);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          loyaltyTiers: [{ id: `tier_${Date.now()}`, ...tier }, ...state.loyaltyTiers],
        }));
      },

      updateTier: async (id, data) => {
        try {
          await axiosClient.put(`/crm/tiers/${id}`, data);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          loyaltyTiers: state.loyaltyTiers.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
      },

      deleteTier: async (id) => {
        try {
          await axiosClient.delete(`/crm/tiers/${id}`);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          loyaltyTiers: state.loyaltyTiers.filter((t) => t.id !== id),
        }));
      },
    }),
    {
      name: 'retailhub-crm-storage',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<CRMState> | undefined;
        const customers = mergeCustomers(p?.customers ?? (current as CRMState).customers);
        return {
          ...(current as CRMState),
          ...p,
          customers,
          loyaltyTiers: p?.loyaltyTiers ?? (current as CRMState).loyaltyTiers,
        };
      },
    }
  )
);
