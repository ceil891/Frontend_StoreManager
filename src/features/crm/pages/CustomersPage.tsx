import { useState, useMemo } from 'react';
import {
  UserPlus, Download, Search, Star, Eye, Mail, Phone, MapPin, Award,
  Gift, Clock, Edit, Trash2, ShoppingBag, TrendingUp, CheckCircle, Loader2,
  Plus, Minus, AlertCircle, Users, DollarSign
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

import { useCrmStore, type CustomerProfile } from '../store/crmStore';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { buildUserAvatarUrl } from '@/shared/utils/userAvatar';

// ─── Tier config ────────────────────────────────────────────────────────────
// NOTE: lifetimeSpent trong store dùng đơn vị USD ($).
// Ngưỡng thăng hạng tương đương: 5 000 000 VNĐ ≈ 200$, 20 000 000 VNĐ ≈ 800$, 100 000 000 VNĐ ≈ 4 000$
const TIER_THRESHOLDS = {
  BRONZE: 0,     // < 200$
  SILVER: 200,   // 200$ – 800$   (~5 000 000 – 20 000 000 VNĐ)
  GOLD: 800,     // 800$ – 4 000$ (~20 000 000 – 100 000 000 VNĐ)
  DIAMOND: 4000, // > 4 000$      (> 100 000 000 VNĐ)
} as const;

function calcTier(spent: number): CustomerProfile['loyaltyTier'] {
  if (spent >= TIER_THRESHOLDS.DIAMOND) return 'DIAMOND';
  if (spent >= TIER_THRESHOLDS.GOLD) return 'GOLD';
  if (spent >= TIER_THRESHOLDS.SILVER) return 'SILVER';
  return 'BRONZE';
}

const tierColors: Record<string, string> = {
  BRONZE:  'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300',
  SILVER:  'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
  GOLD:    'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300',
  DIAMOND: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300',
  ELITE_CLUB: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300',
};
const tierLabel: Record<string, string> = {
  BRONZE: 'Đồng', SILVER: 'Bạc', GOLD: 'Vàng', DIAMOND: 'Kim Cương', ELITE_CLUB: 'Elite Club',
};

// ─── Mock transaction history ────────────────────────────────────────────────
type Transaction = {
  id: string;
  orderId: string;
  date: string;
  summary: string;
  total: number;
  status: 'Hoàn thành' | 'Đang xử lý';
};
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', orderId: 'ORD-8821', date: '2024-05-10', summary: 'Laptop Dell XPS 15, Chuột Logitech', total: 1250.00, status: 'Hoàn thành' },
  { id: 't2', orderId: 'ORD-8745', date: '2024-04-22', summary: 'Tai nghe Sony WH-1000XM5', total: 349.00, status: 'Hoàn thành' },
  { id: 't3', orderId: 'ORD-8690', date: '2024-03-15', summary: 'iPhone 15 Pro Max 256GB', total: 1199.00, status: 'Hoàn thành' },
  { id: 't4', orderId: 'ORD-8630', date: '2024-02-28', summary: 'Màn hình LG 27" 4K', total: 599.00, status: 'Hoàn thành' },
  { id: 't5', orderId: 'ORD-8910', date: '2024-05-20', summary: 'Bàn phím cơ Keychron K2', total: 119.00, status: 'Đang xử lý' },
];

// ─── Mock loyalty point history ──────────────────────────────────────────────
type PointRecord = {
  id: string;
  date: string;
  type: 'Tích điểm' | 'Dùng điểm' | 'Hết hạn';
  points: number;
  balance: number;
};
const MOCK_POINTS: PointRecord[] = [
  { id: 'p1', date: '2024-05-10', type: 'Tích điểm', points: +125,  balance: 3420 },
  { id: 'p2', date: '2024-05-05', type: 'Dùng điểm',  points: -200,  balance: 3295 },
  { id: 'p3', date: '2024-04-22', type: 'Tích điểm', points: +34,   balance: 3495 },
  { id: 'p4', date: '2024-03-15', type: 'Tích điểm', points: +119,  balance: 3461 },
  { id: 'p5', date: '2024-01-01', type: 'Hết hạn',   points: -50,   balance: 3342 },
];

// ─── Drawer tab type ─────────────────────────────────────────────────────────
type DrawerTab = 'info' | 'transactions' | 'points';

// ─────────────────────────────────────────────────────────────────────────────
export function CustomersPage() {
  const { customers: data, addCustomer, updateCustomer, deleteCustomer } = useCrmStore();
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('info');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingCustomer, setEditingCustomer] = useState<Partial<CustomerProfile>>({});
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerProfile | null>(null);

  const filtered = data.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.phone.includes(search) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.customerCode.toLowerCase().includes(search.toLowerCase());
    const matchesTier = selectedTier ? item.loyaltyTier === selectedTier : true;
    return matchesSearch && matchesTier;
  });

  // ── KPI stats ───────────────────────────────────────────────────────────────
  const totalRevenue = data.reduce((acc, c) => acc + c.lifetimeSpent, 0);
  const activeCount  = data.filter(c => c.status === 'ACTIVE').length;
  const vipCount     = data.filter(c => c.loyaltyTier === 'DIAMOND' || c.loyaltyTier === 'GOLD').length;
  const totalPoints  = data.reduce((acc, c) => acc + c.loyaltyPoints, 0);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingCustomer({
      customerCode: `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
      name: '', phone: '', email: '', address: '',
      avatarUrl: buildUserAvatarUrl('new-customer@retailhub.vn'),
      loyaltyTier: 'BRONZE', loyaltyPoints: 0, lifetimeSpent: 0,
      status: 'ACTIVE',
      registeredDate: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: CustomerProfile) => {
    setModalMode('edit');
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer.name || !editingCustomer.phone) return;

    // Tự động tính lại loyaltyTier dựa vào lifetimeSpent (đơn vị USD $)
    const autoTier = calcTier(editingCustomer.lifetimeSpent ?? 0);

    if (modalMode === 'create') {
      const newCust: Omit<CustomerProfile, 'id'> = {
        customerCode:   editingCustomer.customerCode || `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
        name:           editingCustomer.name || '',
        phone:          editingCustomer.phone || '',
        email:          editingCustomer.email || '',
        address:        editingCustomer.address || '',
        avatarUrl:      editingCustomer.avatarUrl?.trim() || buildUserAvatarUrl(editingCustomer.email || editingCustomer.name || 'customer'),
        loyaltyTier:    autoTier,           // ← tự động thăng hạng
        loyaltyPoints:  editingCustomer.loyaltyPoints || 0,
        lifetimeSpent:  editingCustomer.lifetimeSpent || 0,
        registeredDate: editingCustomer.registeredDate || new Date().toISOString().split('T')[0],
        lastActive:     editingCustomer.lastActive    || new Date().toISOString().split('T')[0],
        status:         editingCustomer.status || 'ACTIVE',
        notes:          editingCustomer.notes,
      };
      addCustomer(newCust);
    } else if (editingCustomer.id) {
      updateCustomer(editingCustomer.id, { ...editingCustomer, loyaltyTier: autoTier });
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingCustomer) return;
    deleteCustomer(deletingCustomer.id);
    setDeletingCustomer(null);
  };

  // ── Table columns ────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<CustomerProfile>[]>(
    () => [
      {
        accessorKey: 'customerCode',
        header: 'Mã KH',
        cell: (info) => (
          <span className="font-mono font-bold text-primary hover:underline">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Tên & Email Khách Hàng',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <UserAvatar name={row.original.name} avatarUrl={row.original.avatarUrl} seed={row.original.email} size="sm" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.name}</p>
              <p className="text-xs text-gray-500">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Số điện thoại',
        cell: (info) => <span className="font-mono text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'loyaltyTier',
        header: 'Hạng thành viên',
        cell: (info) => {
          const tier = info.getValue() as keyof typeof tierColors;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierColors[tier]}`}>
              <Star className="w-3 h-3" />
              {tierLabel[tier] || tier}
            </span>
          );
        },
      },
      {
        accessorKey: 'loyaltyPoints',
        header: 'Điểm tích lũy',
        cell: (info) => (
          <span className="font-mono text-primary font-semibold">
            {info.getValue() as number} điểm
          </span>
        ),
      },
      {
        accessorKey: 'lifetimeSpent',
        header: 'Tổng chi tiêu',
        cell: (info) => (
          <span className="font-bold text-gray-900 dark:text-white">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            ACTIVE: 'Hoạt động', DORMANT: 'Không hoạt động', CHURNED: 'Đã rời đi',
          };
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
              status === 'ACTIVE'  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'DORMANT' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {statusMap[status] || status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setDrawerTab('info'); setSelectedCustomer(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingCustomer(row.original); }}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [data]
  );

  // ── Tier progress helper ─────────────────────────────────────────────────────
  function getTierProgress(spent: number) {
    if (spent >= TIER_THRESHOLDS.DIAMOND) return { label: 'Kim Cương – Hạng tối đa', percent: 100, next: null };
    if (spent >= TIER_THRESHOLDS.GOLD)   return { label: 'Lên Kim Cương', percent: Math.round((spent - TIER_THRESHOLDS.GOLD) / (TIER_THRESHOLDS.DIAMOND - TIER_THRESHOLDS.GOLD) * 100), next: 'DIAMOND' };
    if (spent >= TIER_THRESHOLDS.SILVER) return { label: 'Lên Vàng', percent: Math.round((spent - TIER_THRESHOLDS.SILVER) / (TIER_THRESHOLDS.GOLD - TIER_THRESHOLDS.SILVER) * 100), next: 'GOLD' };
    return { label: 'Lên Bạc', percent: Math.round(spent / TIER_THRESHOLDS.SILVER * 100), next: 'SILVER' };
  }

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Khách hàng (CRM)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý hồ sơ khách hàng, theo dõi điểm thưởng tích lũy và giám sát lịch sử chi tiêu. Nhấp vào dòng để xem chi tiết.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất danh sách
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> Thêm khách hàng mới
            </button>
          </div>
        </div>

        {/* KPI Cards – 5 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng khách hàng</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.length}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Khách VIP (Kim Cương & Vàng)</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{vipCount}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng quỹ điểm thưởng</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{totalPoints.toLocaleString()}</p>
          </div>

          {/* NEW: Doanh thu tổng */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Doanh thu tổng</h3>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>

          {/* NEW: Hoạt động hôm nay */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Đang hoạt động</h3>
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{activeCount}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm khách hàng theo tên, số điện thoại, email hoặc mã..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all"
              />
            </div>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            >
              <option value="">Tất cả hạng thành viên</option>
              <option value="DIAMOND">VIP Kim Cương</option>
              <option value="GOLD">Thành viên Vàng</option>
              <option value="SILVER">Thành viên Bạc</option>
              <option value="BRONZE">Thành viên Đồng</option>
            </select>
          </div>
          <div className="p-4">
            <ReusableDataTable
              columns={columns}
              data={filtered}
              onRowClick={(row) => { setDrawerTab('info'); setSelectedCustomer(row); }}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DRAWER: Xem chi tiết khách hàng (với Tab navigation)
      ════════════════════════════════════════════════════════════════════════ */}
      <Drawer
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer ? `Thẻ Khách Hàng: ${selectedCustomer.customerCode}` : 'Hồ Sơ Khách Hàng'}
        width="max-w-lg"
      >
        {selectedCustomer && (() => {
          const progress = getTierProgress(selectedCustomer.lifetimeSpent);
          return (
            <div className="space-y-4">
              {/* Avatar + Tier badge */}
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
                <div className="flex items-center gap-3">
                  <UserAvatar name={selectedCustomer.name} avatarUrl={selectedCustomer.avatarUrl} seed={selectedCustomer.email} size="lg" />
                  <div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                    <p className="text-xs text-primary font-mono">{selectedCustomer.email}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${tierColors[selectedCustomer.loyaltyTier]}`}>
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {tierLabel[selectedCustomer.loyaltyTier]}
                </span>
              </div>

              {/* Tab navigation */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                {([
                  { key: 'info' as DrawerTab, label: 'Thông tin' },
                  { key: 'transactions' as DrawerTab, label: 'Lịch sử GD' },
                  { key: 'points' as DrawerTab, label: 'Điểm thưởng' },
                ] as { key: DrawerTab; label: string }[]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setDrawerTab(tab.key)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                      drawerTab === tab.key
                        ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── TAB: Thông tin ── */}
              {drawerTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        <Award className="w-4 h-4 text-primary" /> Điểm thưởng khả dụng
                      </div>
                      <p className="text-lg font-mono font-bold text-primary truncate">{selectedCustomer.loyaltyPoints} điểm</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        <Gift className="w-4 h-4 text-emerald-500" /> Tổng chi tiêu
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white truncate">${selectedCustomer.lifetimeSpent.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
                    <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="font-mono">{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-gray-700 dark:text-gray-300">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span>{selectedCustomer.address}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>Hoạt động lần cuối: <strong className="text-gray-900 dark:text-white">{selectedCustomer.lastActive}</strong></span>
                    </div>
                    {selectedCustomer.notes && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú từ bộ phận CSKH</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedCustomer.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow transition-colors text-sm">
                      <Gift className="w-4 h-4" /> Cấp voucher đặc quyền
                    </button>
                    <button
                      onClick={() => setDrawerTab('transactions')}
                      className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm"
                    >
                      <ShoppingBag className="w-4 h-4 inline mr-1" /> Giao dịch
                    </button>
                  </div>
                </div>
              )}

              {/* ── TAB: Lịch sử giao dịch ── */}
              {drawerTab === 'transactions' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                    5 giao dịch gần nhất
                  </p>
                  {MOCK_TRANSACTIONS.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3.5 shadow-sm hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-mono text-xs font-bold text-primary">{tx.orderId}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-1">{tx.summary}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-sm text-gray-900 dark:text-white">${tx.total.toFixed(2)}</p>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium mt-0.5 ${
                            tx.status === 'Hoàn thành'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {tx.status === 'Hoàn thành'
                              ? <CheckCircle className="w-3 h-3" />
                              : <Loader2 className="w-3 h-3 animate-spin" />
                            }
                            {tx.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 pl-11">
                        <Clock className="w-3 h-3 inline mr-1" />{tx.date}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── TAB: Điểm thưởng ── */}
              {drawerTab === 'points' && (
                <div className="space-y-4">
                  {/* Progress bar lên hạng tiếp theo */}
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Tiến độ {progress.label}
                      </span>
                      <span className="text-xs font-bold text-primary">{progress.percent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                        style={{ width: `${Math.min(progress.percent, 100)}%` }}
                      />
                    </div>
                    {progress.next && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Còn <strong className="text-gray-700 dark:text-gray-200">
                          ${(TIER_THRESHOLDS[progress.next as keyof typeof TIER_THRESHOLDS] - selectedCustomer.lifetimeSpent).toFixed(0)}
                        </strong> nữa để lên hạng <strong className="text-primary">{tierLabel[progress.next]}</strong>
                      </p>
                    )}
                    {!progress.next && (
                      <p className="text-xs text-primary font-semibold mt-2">🎉 Bạn đã đạt hạng tối đa – Kim Cương!</p>
                    )}
                  </div>

                  {/* Point balance */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Award className="w-4 h-4 text-primary" />
                      <span>Số dư điểm hiện tại</span>
                    </div>
                    <span className="font-mono font-bold text-xl text-primary">
                      {selectedCustomer.loyaltyPoints.toLocaleString()} điểm
                    </span>
                  </div>

                  {/* History list */}
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                    Lịch sử tích / tiêu điểm
                  </p>
                  <div className="space-y-2">
                    {MOCK_POINTS.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-3.5 py-2.5 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                            rec.type === 'Tích điểm' ? 'bg-emerald-100 dark:bg-emerald-900/40' :
                            rec.type === 'Dùng điểm' ? 'bg-blue-100 dark:bg-blue-900/40' :
                            'bg-red-100 dark:bg-red-900/40'
                          }`}>
                            {rec.type === 'Tích điểm' && <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                            {rec.type === 'Dùng điểm' && <Minus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                            {rec.type === 'Hết hạn'   && <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{rec.type}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{rec.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-mono font-bold text-sm ${
                            rec.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                          }`}>
                            {rec.points > 0 ? `+${rec.points}` : rec.points}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Dư: {rec.balance}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Drawer>

      {/* Modal: Thêm / Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Khách Hàng Mới' : 'Chỉnh Sửa Hồ Sơ Khách Hàng'}
        width="max-w-xl"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
            <UserAvatar
              name={editingCustomer.name || 'Khách mới'}
              avatarUrl={editingCustomer.avatarUrl}
              seed={editingCustomer.email || editingCustomer.name}
              size="lg"
            />
            <div className="flex-1 w-full space-y-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">URL ảnh đại diện *</label>
              <input
                type="url"
                required
                value={editingCustomer.avatarUrl || ''}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, avatarUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() =>
                  setEditingCustomer((p) => ({
                    ...p,
                    avatarUrl: buildUserAvatarUrl(p.email || p.name || 'customer'),
                  }))
                }
                className="text-xs text-primary font-semibold hover:underline"
              >
                Tạo ảnh mặc định theo email
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã khách hàng</label>
              <input
                type="text"
                value={editingCustomer.customerCode || ''}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, customerCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hạng thành viên <span className="text-primary font-normal">(tự động cập nhật theo chi tiêu)</span>
              </label>
              <input
                type="text"
                readOnly
                value={tierLabel[calcTier(editingCustomer.lifetimeSpent ?? 0)]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên khách hàng *</label>
            <input
              type="text"
              value={editingCustomer.name || ''}
              onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại *</label>
              <input
                type="text"
                value={editingCustomer.phone || ''}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                placeholder="+84 9xx xxx xxx"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ Email</label>
              <input
                type="email"
                value={editingCustomer.email || ''}
                onChange={(e) => {
                  const email = e.target.value;
                  setEditingCustomer((p) => ({
                    ...p,
                    email,
                    avatarUrl:
                      modalMode === 'create' && (!p.avatarUrl || p.avatarUrl.includes('new-customer'))
                        ? buildUserAvatarUrl(email || 'customer')
                        : p.avatarUrl,
                  }));
                }}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ liên hệ</label>
            <input
              type="text"
              value={editingCustomer.address || ''}
              onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
              placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Điểm tích lũy</label>
              <input
                type="number"
                value={editingCustomer.loyaltyPoints ?? 0}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, loyaltyPoints: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary font-mono"
              />
            </div>
            <div>
              {/* NOTE: lifetimeSpent dùng đơn vị USD ($) – giữ nguyên để tương thích với store */}
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng chi tiêu ($)</label>
              <input
                type="number"
                step="0.01"
                value={editingCustomer.lifetimeSpent ?? 0}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, lifetimeSpent: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select
                value={editingCustomer.status || 'ACTIVE'}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="ACTIVE">Hoạt động</option>
                <option value="DORMANT">Không hoạt động</option>
                <option value="CHURNED">Đã rời đi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú CSKH</label>
            <textarea
              rows={3}
              value={editingCustomer.notes || ''}
              onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
              placeholder="Ghi chú sở thích, thói quen mua hàng hoặc yêu cầu đặc biệt..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              {modalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xác nhận xóa */}
      <Modal
        isOpen={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        title="Xác nhận xóa khách hàng"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa khách hàng{' '}
            <strong className="text-gray-900 dark:text-white">{deletingCustomer?.name}</strong>{' '}
            (Mã: <code className="text-red-600 font-semibold">{deletingCustomer?.customerCode}</code>)?
          </p>
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-200 dark:border-red-800/40">
            Hành động này sẽ gỡ bỏ hoàn toàn dữ liệu hồ sơ và điểm thưởng của khách hàng này khỏi hệ thống.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingCustomer(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Đồng ý xóa
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
