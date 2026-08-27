import React, { useState, useMemo, useEffect } from 'react';
import { axiosClient } from '@/shared/lib/axiosClient';
import {
  UserPlus, Download, Star, Eye, Edit, Trash2, Award, Gift, Zap, BadgeCheck, Users, Camera, Upload, KeyRound, Lock,
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

import { useCrmStore, type CustomerProfile } from '../store/crmStore';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { buildUserAvatarUrl } from '@/shared/utils/userAvatar';
import { toast } from 'sonner';
import { exportToCsv } from '@/shared/utils/exportCsv';
import { CurrencyInput } from '@/shared/components/ui/CurrencyInput';
import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import { AddressCascadeSelect } from '@/shared/components/ui/AddressCascadeSelect';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import { compressImage } from '@/shared/utils/imageCompressor';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { validateCustomerForm } from '@/shared/utils/validators';
import { CreateButton, SecondaryButton, PrimaryButton, DangerButton } from '@/shared/components/ui/Button';

const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 200,
  GOLD: 800,
  DIAMOND: 4000,
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



export function CustomersPage() {
  const { customers: data, addCustomer, updateCustomer, deleteCustomer, fetchCustomers, isLoadingCustomers } = useCrmStore();
  
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  
  // Password Reset state
  const [resetPasswordCustomer, setResetPasswordCustomer] = useState<CustomerProfile | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('RetailHub@123');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoCode, setIsAutoCode] = useState(true);
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

  const handleOpenCreate = () => {
    setModalMode('create');
    setIsAutoCode(true);
    setEditingCustomer({
      customerCode: `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
      name: '', phone: '', email: '', address: '',
      avatarUrl: '',
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
    setIsAutoCode(false);
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = editingCustomer.name?.trim();
    const cleanPhone = editingCustomer.phone?.trim().replace(/\s+/g, '');

    const validation = validateCustomerForm({
      name: cleanName,
      phone: cleanPhone,
      email: editingCustomer.email,
      dateOfBirth: editingCustomer.dateOfBirth,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return;
    }

    const autoTier = calcTier(editingCustomer.lifetimeSpent ?? 0);

    if (modalMode === 'create') {
      const newCust: Omit<CustomerProfile, 'id'> = {
        customerCode:   editingCustomer.customerCode || `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
        name:           cleanName,
        phone:          cleanPhone,
        email:          editingCustomer.email?.trim() || '',
        address:        editingCustomer.address || '',
        taxCode:        editingCustomer.taxCode || '',
        gender:         editingCustomer.gender || 'OTHER',
        dateOfBirth:    editingCustomer.dateOfBirth || '',
        creditLimit:    editingCustomer.creditLimit || 0,
        groupId:        editingCustomer.groupId || '',
        areaId:         editingCustomer.areaId || '',
        avatarUrl:      editingCustomer.avatarUrl?.trim() || '',
        loyaltyTier:    autoTier,
        loyaltyPoints:  editingCustomer.loyaltyPoints || 0,
        lifetimeSpent:  editingCustomer.lifetimeSpent || 0,
        registeredDate: editingCustomer.registeredDate || new Date().toISOString().split('T')[0],
        lastActive:     editingCustomer.lastActive    || new Date().toISOString().split('T')[0],
        status:         editingCustomer.status || 'ACTIVE',
        notes:          editingCustomer.notes,
      };
      addCustomer(newCust);
      toast.success(`Đã thêm khách hàng mới: ${cleanName}`);
    } else if (editingCustomer.id) {
      updateCustomer(editingCustomer.id, { ...editingCustomer, name: cleanName, phone: cleanPhone, loyaltyTier: autoTier });
      toast.success(`Đã cập nhật thông tin khách hàng: ${cleanName}`);
    }
    setIsModalOpen(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh (JPG, PNG, WebP)!');
      return;
    }
    try {
      const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.85 });
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (base64Url) {
          setEditingCustomer((prev) => ({ ...prev, avatarUrl: base64Url }));
          toast.success('Đã chọn & tải ảnh đại diện thành công!');
        }
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error('Error processing avatar image:', err);
      toast.error('Lỗi khi xử lý hình ảnh!');
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingCustomer) return;
    if (deletingCustomer.status === 'ACTIVE') {
      toast.error(`❌ Không thể xóa khách hàng "${deletingCustomer.name}" vì đang ở trạng thái Đang hoạt động.\nVui lòng chuyển trạng thái sang Tạm ngưng hoặc Đã rời đi trước khi xóa!`);
      setDeletingCustomer(null);
      return;
    }
    deleteCustomer(deletingCustomer.id);
    toast.success(`Đã xóa hồ sơ khách hàng ${deletingCustomer.name}`);
    setDeletingCustomer(null);
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordCustomer) return;
    setIsResettingPassword(true);
    try {
      await axiosClient.put(`/partnerarea/customers/${resetPasswordCustomer.id}/reset-password?newPassword=${encodeURIComponent(newPasswordInput)}`);
      toast.success(`Đã cấp lại mật khẩu cho khách hàng "${resetPasswordCustomer.name}"!\nMật khẩu tạm thời: ${newPasswordInput}.\nKhách hàng sẽ phải đổi mật khẩu khi đăng nhập FE_Online.`);
      setResetPasswordCustomer(null);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cấp lại mật khẩu khách hàng.');
    } finally {
      setIsResettingPassword(false);
    }
  };

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
        header: 'Khách hàng',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <UserAvatar
              src={row.original.avatarUrl}
              name={row.original.name}
              size="md"
            />
            <div>
              <p className="font-bold text-gray-900 dark:text-white hover:text-primary transition-colors">{row.original.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{row.original.phone}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email / Địa chỉ',
        cell: ({ row }) => (
          <div>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{row.original.email || 'N/A'}</p>
            <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{row.original.address || 'N/A'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'loyaltyTier',
        header: 'Hạng thẻ',
        cell: (info) => {
          const tier = info.getValue() as string;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierColors[tier] || tierColors.BRONZE}`}>
              <Award className="w-3 h-3" />
              {tierLabel[tier] || tier}
            </span>
          );
        },
      },
      {
        accessorKey: 'loyaltyPoints',
        header: 'Điểm khả dụng',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {(info.getValue() as number).toLocaleString()} điểm
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            ACTIVE: 'Đang hoạt động', DORMANT: 'Tạm ngưng', CHURNED: 'Đã rời đi', INACTIVE: 'Ngừng hoạt động',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
              onClick={(e) => { e.stopPropagation(); setSelectedCustomer(row.original); }}
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
              onClick={(e) => {
                e.stopPropagation();
                setResetPasswordCustomer(row.original);
                setNewPasswordInput('RetailHub@123');
              }}
              title="Cấp lại mật khẩu"
              className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
            >
              <KeyRound className="w-4 h-4" />
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

  const vipCount = data.filter(c => c.loyaltyTier === 'DIAMOND' || c.loyaltyTier === 'GOLD').length;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý khách hàng</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý hồ sơ khách hàng, theo dõi điểm thưởng tích lũy và giám sát lịch sử chi tiêu. Nhấp vào dòng để xem chi tiết.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SecondaryButton
              onClick={() => {
                exportToCsv('danh_sach_khach_hang', filtered, [
                  { header: 'Họ tên', accessor: r => r.name },
                  { header: 'Email', accessor: r => r.email },
                  { header: 'Số điện thoại', accessor: r => r.phone },
                  { header: 'Hạng thẻ', accessor: r => tierLabel[r.loyaltyTier] || r.loyaltyTier },
                  { header: 'Điểm tích lũy', accessor: r => r.loyaltyPoints },
                  { header: 'Tổng chi tiêu ($)', accessor: r => r.lifetimeSpent },
                  { header: 'Lần mua cuối', accessor: r => r.lastActive },
                ]);
                toast.success('Đã xuất danh sách khách hàng dạng CSV!');
              }}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Xuất danh sách
            </SecondaryButton>
            <CreateButton
              onClick={handleOpenCreate}
              icon={<UserPlus className="w-4 h-4" />}
            >
              Thêm khách hàng mới
            </CreateButton>
          </div>
        </div>

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
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Tìm kiếm khách hàng theo tên, SĐT, email..."
            containerClassName="w-full sm:w-96"
          />
          <div className="w-full sm:w-auto flex items-center gap-3">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Tất cả hạng thẻ --</option>
              <option value="BRONZE">Đồng</option>
              <option value="SILVER">Bạc</option>
              <option value="GOLD">Vàng</option>
              <option value="DIAMOND">Kim Cương</option>
            </select>
          </div>
        </div>

        <ReusableDataTable
          data={filtered}
          columns={columns}
          isLoading={isLoadingCustomers}
          onRowClick={(row) => setSelectedCustomer(row)}
        />
      </div>

      {/* Customer Detail View Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          title={`Chi tiết Khách hàng: ${selectedCustomer.name}`}
          size="lg"
        >
          <div className="space-y-4 p-2">
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <UserAvatar src={selectedCustomer.avatarUrl} name={selectedCustomer.name} size="lg" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedCustomer.name}</h3>
                <p className="text-xs text-gray-500 font-mono">{selectedCustomer.customerCode} | {selectedCustomer.phone}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierColors[selectedCustomer.loyaltyTier] || tierColors.BRONZE}`}>
                    {tierLabel[selectedCustomer.loyaltyTier] || selectedCustomer.loyaltyTier}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {selectedCustomer.status === 'ACTIVE' ? 'Đang hoạt động' : selectedCustomer.status === 'DORMANT' ? 'Tạm ngưng' : 'Đã rời đi'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block font-semibold mb-1">EMAIL & ĐỊA CHỈ</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedCustomer.email || 'Chưa cập nhật'}</p>
                <p className="text-gray-500 mt-1">{selectedCustomer.address || 'Chưa cập nhật'}</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block font-semibold mb-1">TÍCH ĐIỂM & CHI TIÊU</span>
                <p className="font-bold text-emerald-600 text-sm">{selectedCustomer.loyaltyPoints} điểm khả dụng</p>
                <p className="text-gray-500 mt-1">Tổng chi tiêu: ${(selectedCustomer.lifetimeSpent || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Customer Create/Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalMode === 'create' ? 'Thêm Khách Hàng Mới' : 'Chỉnh Sửa Hồ Sơ Khách Hàng'}
          size="2xl"
        >
          <form onSubmit={handleSaveCustomer} className="space-y-6">
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-700 pb-2 mb-4">Thông tin cơ bản & Định danh</h3>

              {/* Avatar Upload Block */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500 bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                    {editingCustomer.avatarUrl ? (
                      <img src={editingCustomer.avatarUrl} alt="Avatar Customer" className="w-full h-full object-cover" />
                    ) : (
                      <UserAvatar name={editingCustomer.name || 'Khách hàng'} size="lg" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1 bg-emerald-600 text-white rounded-full cursor-pointer shadow hover:bg-emerald-700 transition-all hover:scale-110">
                    <Camera className="w-3.5 h-3.5" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">Ảnh đại diện khách hàng</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Nhấp để chọn tệp ảnh từ máy tính (PNG, JPG, WebP) hoặc dán liên kết ảnh bên dưới.</p>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold cursor-pointer hover:bg-emerald-100 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      Tải ảnh lên
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    </label>
                    <input
                      type="text"
                      value={editingCustomer.avatarUrl || ''}
                      onChange={(e) => setEditingCustomer((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                      placeholder="Hoặc dán URL ảnh..."
                      className="flex-1 px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Mã KH *</label>
                  </div>
                  <input
                    type="text"
                    value={editingCustomer.customerCode || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, customerCode: e.target.value })}
                    disabled={modalMode === 'create' && isAutoCode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary disabled:opacity-60"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và Tên khách hàng *</label>
                  <input
                    type="text"
                    value={editingCustomer.name || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    value={editingCustomer.phone || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    placeholder="09xx xxx xxx"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-mono"
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
                      }));
                    }}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã số thuế</label>
                  <input
                    type="text"
                    value={editingCustomer.taxCode || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, taxCode: e.target.value })}
                    placeholder="MST"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giới tính</label>
                  <select
                    value={editingCustomer.gender || 'OTHER'}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={editingCustomer.dateOfBirth || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <AddressCascadeSelect
                  addressDetail={editingCustomer.address || ''}
                  onChange={({ province, district, ward, addressDetail }) => {
                    const fullAddr = [addressDetail, ward, district, province].filter(Boolean).join(', ');
                    setEditingCustomer(prev => ({ ...prev, address: fullAddr }));
                  }}
                />
              </div>
            </div>

            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-700 pb-2 mb-4">Tài chính, phân loại & CSKH</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhóm khách hàng</label>
                  <SearchLookupModal
                    title="Chọn Nhóm Khách Hàng"
                    iconType="building"
                    placeholder="Chọn nhóm khách hàng..."
                    value={editingCustomer.groupId}
                    options={[
                      { id: 'GRP-VIP', code: 'GRP-VIP', name: 'Khách hàng VIP / Doanh nghiệp', subtitle: 'Chiết khấu 10%' },
                      { id: 'GRP-RETAIL', code: 'GRP-RETAIL', name: 'Khách hàng Bán lẻ', subtitle: 'Chiết khấu chuẩn' },
                      { id: 'GRP-WHOLESALE', code: 'GRP-WHOLESALE', name: 'Đại lý / Bán sỉ', subtitle: 'Chiết khấu 15%' },
                    ]}
                    onChange={(val) => setEditingCustomer(prev => ({ ...prev, groupId: val }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khu vực địa lý</label>
                  <SearchLookupModal
                    title="Chọn Khu Vực"
                    iconType="location"
                    placeholder="Chọn khu vực..."
                    value={editingCustomer.areaId}
                    options={[
                      { id: 'AREA-HN', code: 'AREA-HN', name: 'Khu vực Hà Nội & Miền Bắc' },
                      { id: 'AREA-HCM', code: 'AREA-HCM', name: 'Khu vực TP. Hồ Chí Minh & Miền Nam' },
                      { id: 'AREA-DN', code: 'AREA-DN', name: 'Khu vực Đà Nẵng & Miền Trung' },
                    ]}
                    onChange={(val) => setEditingCustomer(prev => ({ ...prev, areaId: val }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hạng thành viên <span className="text-primary font-normal">(Tự động tính)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={tierLabel[calcTier(editingCustomer.lifetimeSpent ?? 0)]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm cursor-not-allowed font-semibold text-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Điểm tích lũy</label>
                  <input
                    type="number"
                    value={editingCustomer.loyaltyPoints ?? 0}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, loyaltyPoints: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hạn mức nợ cho phép</label>
                  <CurrencyInput
                    value={editingCustomer.creditLimit ?? 0}
                    onChange={(val) => setEditingCustomer(prev => ({ ...prev, creditLimit: val }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái tài khoản</label>
                <select
                  value={editingCustomer.status || 'ACTIVE'}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                  <option value="DORMANT">Tạm ngưng (DORMANT)</option>
                  <option value="CHURNED">Đã rời đi (CHURNED)</option>
                </select>
              </div>

              <div>
                <FileDropzone label="Hồ sơ & Giấy tờ đính kèm" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú & Lưu ý</label>
                <textarea
                  rows={3}
                  value={editingCustomer.notes || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  placeholder="Ghi chú thêm..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <SecondaryButton
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy bỏ
              </SecondaryButton>
              <PrimaryButton
                type="submit"
              >
                {modalMode === 'create' ? 'Thêm khách hàng' : 'Lưu thay đổi'}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCustomer && (
        <Modal
          isOpen={Boolean(deletingCustomer)}
          onClose={() => setDeletingCustomer(null)}
          title="Xác nhận xóa khách hàng"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Bạn có chắc chắn muốn xóa hồ sơ khách hàng <strong className="text-gray-900 dark:text-white">{deletingCustomer.name}</strong> không?
            </p>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <SecondaryButton
                type="button"
                onClick={() => setDeletingCustomer(null)}
              >
                Hủy bỏ
              </SecondaryButton>
              <DangerButton
                type="button"
                onClick={handleDeleteConfirm}
              >
                Xóa khách hàng
              </DangerButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Reset Password Modal */}
      {resetPasswordCustomer && (
        <Modal
          isOpen={Boolean(resetPasswordCustomer)}
          onClose={() => setResetPasswordCustomer(null)}
          title={`CẤP LẠI MẬT KHẨU KHÁCH HÀNG: ${resetPasswordCustomer.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAdminResetPassword} className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-300">
              <p className="font-bold flex items-center gap-1 mb-1">
                <Lock className="w-4 h-4 text-amber-600" /> Lưu ý quan trọng:
              </p>
              <p>Mật khẩu tạm thời sẽ được cấp lại cho khách hàng <strong>{resetPasswordCustomer.name}</strong> ({resetPasswordCustomer.phone || resetPasswordCustomer.email}). Khách hàng sẽ <strong>bắt buộc phải đổi mật khẩu</strong> ở lần đăng nhập tiếp theo trên FE_Online.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Mật khẩu mới (tạm thời) *
              </label>
              <input
                type="text"
                required
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono font-bold"
              />
              <p className="text-[10px] text-gray-400 mt-1">Mật khẩu mặc định: RetailHub@123</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setResetPasswordCustomer(null)}
                className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isResettingPassword}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow flex items-center gap-1 disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5" /> {isResettingPassword ? 'Đang cấp lại...' : 'Xác nhận cấp lại mật khẩu'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
