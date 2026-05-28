import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { buildUserAvatarUrl } from '@/shared/utils/userAvatar';

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

const DEFAULT_CUSTOMERS: CustomerProfile[] = [
  normalizeCustomer({ id: '1', customerCode: 'CUST-88102', name: 'Nguyễn Văn An', phone: '0909111222', email: 'nguyen.van.an@email.com', address: '12 Lê Lợi, Q.1, TP.HCM', avatarUrl: buildUserAvatarUrl('nguyen.van.an@email.com'), loyaltyTier: 'DIAMOND', loyaltyPoints: 12500, lifetimeSpent: 14500.5, registeredDate: '2023-01-15', lastActive: '2024-05-17', status: 'ACTIVE', notes: 'Khách hàng doanh nghiệp VIP.' }),
  normalizeCustomer({ id: '2', customerCode: 'CUST-88105', name: 'Trần Thị Bình', phone: '0918222333', email: 'tran.thi.binh@email.com', address: '45 Cộng Hòa, Tân Bình', avatarUrl: buildUserAvatarUrl('tran.thi.binh@email.com'), loyaltyTier: 'GOLD', loyaltyPoints: 4500, lifetimeSpent: 4200, registeredDate: '2023-06-10', lastActive: '2024-05-14', status: 'ACTIVE' }),
  normalizeCustomer({ id: '3', customerCode: 'CUST-88112', name: 'Lê Hoàng Cường', phone: '0929333444', email: 'le.hoang.cuong@email.com', address: '89 Quang Trung, Gò Vấp', avatarUrl: buildUserAvatarUrl('le.hoang.cuong@email.com'), loyaltyTier: 'SILVER', loyaltyPoints: 850, lifetimeSpent: 950, registeredDate: '2023-11-01', lastActive: '2024-04-20', status: 'ACTIVE' }),
  normalizeCustomer({ id: '4', customerCode: 'CUST-88119', name: 'Phạm Thị Dung', phone: '0938444555', email: 'pham.thi.dung@email.com', address: '10 Nguyễn Văn Linh, Q.7', avatarUrl: buildUserAvatarUrl('pham.thi.dung@email.com'), loyaltyTier: 'BRONZE', loyaltyPoints: 120, lifetimeSpent: 185, registeredDate: '2024-02-14', lastActive: '2024-02-14', status: 'DORMANT', notes: 'Chưa mua lại 90 ngày.' }),
  normalizeCustomer({ id: '5', customerCode: 'CUST-88125', name: 'Hoàng Văn Em', phone: '0947555666', email: 'hoang.van.em@email.com', address: '56 Lê Lợi, Thủ Dầu Một', avatarUrl: buildUserAvatarUrl('hoang.van.em@email.com'), loyaltyTier: 'GOLD', loyaltyPoints: 5200, lifetimeSpent: 5800.75, registeredDate: '2023-03-25', lastActive: '2024-05-16', status: 'ACTIVE' }),
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
  addCustomer: (customer: CustomerInput) => void;
  updateCustomer: (id: string, data: Partial<CustomerProfile>) => void;
  deleteCustomer: (id: string) => void;
  addTier: (tier: Omit<LoyaltyTierConfig, 'id'>) => void;
  updateTier: (id: string, data: Partial<LoyaltyTierConfig>) => void;
  deleteTier: (id: string) => void;
}

export const useCrmStore = create<CRMState>()(
  persist(
    (set) => ({
      customers: DEFAULT_CUSTOMERS,
      loyaltyTiers: MOCK_TIERS,

      addCustomer: (customer) =>
        set((state) => ({
          customers: [normalizeCustomer({ ...customer, id: `cust_${Date.now()}` }), ...state.customers],
        })),

      updateCustomer: (id, data) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? normalizeCustomer({ ...c, ...data, id: c.id, name: data.name ?? c.name }) : c
          ),
        })),

      deleteCustomer: (id) =>
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        })),

      addTier: (tier) =>
        set((state) => ({
          loyaltyTiers: [{ id: `tier_${Date.now()}`, ...tier }, ...state.loyaltyTiers],
        })),

      updateTier: (id, data) =>
        set((state) => ({
          loyaltyTiers: state.loyaltyTiers.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),

      deleteTier: (id) =>
        set((state) => ({
          loyaltyTiers: state.loyaltyTiers.filter((t) => t.id !== id),
        })),
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
