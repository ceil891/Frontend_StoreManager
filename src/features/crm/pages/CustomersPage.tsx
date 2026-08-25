import React, { useState, useMemo, useEffect } from 'react';
import { axiosClient } from '@/shared/lib/axiosClient';
import {
  UserPlus, Download, Star, Eye, Edit, Trash2, Award, Gift, Zap, BadgeCheck, Users, Camera, Upload, KeyRound, Lock, Loader2,
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
import { PermissionGuard } from '@/shared/components/ui/PermissionGuard';

const parseAddressString = (fullAddress: string | undefined) => {
  if (!fullAddress) {
    return { province: '', district: '', ward: '', addressDetail: '' };
  }
  const parts = fullAddress.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length >= 4) {
    const province = parts[parts.length - 1];
    const district = parts[parts.length - 2];
    const ward = parts[parts.length - 3];
    const addressDetail = parts.slice(0, parts.length - 3).join(', ');
    return { province, district, ward, addressDetail };
  } else if (parts.length === 3) {
    const province = parts[2];
    const district = parts[1];
    const ward = parts[0];
    return { province, district, ward, addressDetail: '' };
  } else if (parts.length === 2) {
    const province = parts[1];
    const district = parts[0];
    return { province, district, ward: '', addressDetail: '' };
  } else {
    return { province: '', district: '', ward: '', addressDetail: fullAddress };
  }
};

const genderLabel: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác'
};

const groupLabel: Record<string, string> = {
  'GRP-VIP': 'Khách hàng VIP / Doanh nghiệp',
  'GRP-RETAIL': 'Khách hàng Bán lẻ',
  'GRP-WHOLESALE': 'Đại lý / Bán sỉ'
};

const areaLabel: Record<string, string> = {
  'AREA-HN': 'Khu vực Hà Nội & Miền Bắc',
  'AREA-HCM': 'Khu vực TP. Hồ Chí Minh & Miền Nam',
  'AREA-DN': 'Khu vực Đà Nẵng & Miền Trung'
};

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
  const [addrPieces, setAddrPieces] = useState({ province: '', district: '', ward: '', addressDetail: '' });
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
    setAddrPieces({ province: '', district: '', ward: '', addressDetail: '' });
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
    setAddrPieces(parseAddressString(customer.address));
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = editingCustomer.name?.trim();
    const cleanPhone = editingCustomer.phone?.trim().replace(/\s+/g, '');
    const cleanEmail = editingCustomer.email?.trim();

    if (!cleanName) {
      toast.error('Vui lòng nhập Họ & Tên khách hàng!');
      return;
    }
    const nameRegex = /^[a-zA-ZÀ-ỹ\s'.-]+$/u;
    if (!nameRegex.test(cleanName)) {
      toast.error('Họ & Tên không được chứa chữ số hoặc ký tự đặc biệt!');
      return;
    }
    if (cleanName.length < 2) {
      toast.error('Họ & Tên khách hàng phải có tối thiểu 2 ký tự!');
      return;
    }
    
    // Validation SĐT: Đầu số VN hợp lệ (03, 05, 07, 08, 09) và đủ 10 số
    const phoneRegex = /^(0[35789])[0-9]{8}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      toast.error('Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại Việt Nam đủ 10 chữ số (Đầu số 03, 05, 07, 08, 09. Ví dụ: 0912345678).');
      return;
    }

    // Validation Email / Gmail
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        toast.error('Địa chỉ email không đúng định dạng (Ví dụ: khachhang@gmail.com)!');
        return;
      }
    }

    if (editingCustomer.dateOfBirth) {
      const dob = new Date(editingCustomer.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        toast.error('Ngày sinh không được lớn hơn ngày hiện tại!');
        return;
      }
    }

    const autoTier = calcTier(editingCustomer.lifetimeSpent ?? 0);

    if (modalMode === 'create') {
      const newCust: Omit<CustomerProfile, 'id'> = {
        customerCode:   editingCustomer.customerCode || `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
        name:           cleanName,
        phone:          cleanPhone,
        email:          cleanEmail || '',
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
      await addCustomer(newCust);
      toast.success(`Đã thêm khách hàng mới: ${cleanName}`);
    } else if (editingCustomer.id) {
      await updateCustomer(editingCustomer.id, { ...editingCustomer, name: cleanName, phone: cleanPhone, email: cleanEmail, loyaltyTier: autoTier });
      toast.success(`Đã cập nhật thông tin khách hàng: ${cleanName}`);
    }
    setIsModalOpen(false);
  };

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh (JPG, PNG, WebP)!');
      return;
    }

    const toastId = toast.loading('Đang tải ảnh đại diện...');
    setIsUploadingAvatar(true);

    try {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target?.result as string;
        if (base64Url) {
          setEditingCustomer((prev) => ({ ...prev, avatarUrl: base64Url }));
        }
      };
      reader.readAsDataURL(file);

      const compressed = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('folder', 'customers');

      try {
        const response: any = await axiosClient.post('/uploads/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const finalUrl =
          response?.data?.imageUrl ||
          response?.imageUrl ||
          response?.url ||
          response?.data?.url ||
          (typeof response?.data === 'string' ? response.data : null);

        if (finalUrl) {
          setEditingCustomer((prev) => ({ ...prev, avatarUrl: finalUrl }));
          toast.success('Đã tải ảnh lên hệ thống thành công!', { id: toastId });
        } else {
          toast.success('Đã nhận ảnh đại diện!', { id: toastId });
        }
      } catch (uploadErr) {
        console.warn('Upload to server failed, using local Base64 image:', uploadErr);
        toast.success('Đã nhận ảnh đại diện (chế độ ảnh trực tiếp)!', { id: toastId });
      }
    } catch (err: any) {
      console.error('Error processing avatar:', err);
      toast.error('Không thể xử lý ảnh! Vui lòng thử lại.', { id: toastId });
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
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
        header: 'Email / địa chỉ',
        cell: ({ row }) => (
          <div>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{row.original.email || 'Chưa cập nhật'}</p>
            <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{row.original.address || 'Chưa cập nhật'}</p>
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
            <PermissionGuard permission="crm:customer:view">
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedCustomer(row.original); }}
                title="Xem chi tiết"
                className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
            </PermissionGuard>
            <PermissionGuard permission="crm:customer:update">
              <button
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
                title="Chỉnh sửa"
                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            </PermissionGuard>
            <PermissionGuard permission="crm:customer:update">
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
            </PermissionGuard>
            <PermissionGuard permission="crm:customer:delete">
              <button
                onClick={(e) => { e.stopPropagation(); setDeletingCustomer(row.original); }}
                title="Xóa"
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </PermissionGuard>
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
            <PermissionGuard permission="crm:customer:export">
              <button
                onClick={() => {
                  exportToCsv('danh_sach_khach_hang', filtered, [
                    { header: 'Họ tên', accessor: (r: any) => r.name },
                    { header: 'Email', accessor: (r: any) => r.email },
                    { header: 'Số điện thoại', accessor: (r: any) => r.phone },
                    { header: 'Hạng thẻ', accessor: (r: any) => tierLabel[r.loyaltyTier] || r.loyaltyTier },
                    { header: 'Điểm tích lũy', accessor: (r: any) => r.loyaltyPoints },
                    { header: 'Tổng chi tiêu', accessor: (r: any) => r.lifetimeSpent },
                    { header: 'Lần mua cuối', accessor: (r: any) => r.lastActive },
                  ]);
                  toast.success('Đã xuất danh sách khách hàng dạng CSV!');
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-semibold shadow-sm hover:shadow active:scale-95 whitespace-nowrap"
              >
                <Download className="w-4 h-4" /> Xuất Excel
              </button>
            </PermissionGuard>
            <PermissionGuard permission="crm:customer:create">
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-full transition-all text-sm font-bold shadow hover:shadow-lg active:scale-95 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" /> Thêm mới khách hàng
              </button>
            </PermissionGuard>
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

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="w-full sm:w-auto flex items-center gap-3 shrink-0">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
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
          title={`Chi tiết khách hàng: ${selectedCustomer.name}`}
          size="erp"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block font-semibold mb-1">Email & địa chỉ</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedCustomer.email || 'Chưa cập nhật'}</p>
                <p className="text-gray-500 mt-1">{selectedCustomer.address || 'Chưa cập nhật'}</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block font-semibold mb-1">Tích điểm & chi tiêu</span>
                <p className="font-bold text-emerald-600 text-sm">{selectedCustomer.loyaltyPoints} điểm khả dụng</p>
                <p className="text-gray-500 mt-1">Tổng chi tiêu: {(selectedCustomer.lifetimeSpent || 0).toLocaleString('vi-VN')} đ</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block font-semibold mb-1">Thông tin cá nhân</span>
                <p className="text-gray-500">Mã số thuế: <span className="font-semibold text-gray-900 dark:text-white font-mono">{selectedCustomer.taxCode || 'Chưa cập nhật'}</span></p>
                <p className="text-gray-500 mt-1">Giới tính: <span className="font-semibold text-gray-900 dark:text-white">{selectedCustomer.gender ? (genderLabel[selectedCustomer.gender] || selectedCustomer.gender) : 'Chưa cập nhật'}</span></p>
                <p className="text-gray-500 mt-1">Ngày sinh: <span className="font-semibold text-gray-900 dark:text-white">{selectedCustomer.dateOfBirth || 'Chưa cập nhật'}</span></p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block font-semibold mb-1">Phân loại & chăm sóc khách hàng</span>
                <p className="text-gray-500">Nhóm: <span className="font-semibold text-gray-900 dark:text-white">{selectedCustomer.groupId ? (groupLabel[selectedCustomer.groupId] || selectedCustomer.groupId) : 'Chưa cập nhật'}</span></p>
                <p className="text-gray-500 mt-1">Khu vực: <span className="font-semibold text-gray-900 dark:text-white">{selectedCustomer.areaId ? (areaLabel[selectedCustomer.areaId] || selectedCustomer.areaId) : 'Chưa cập nhật'}</span></p>
                <p className="text-gray-500 mt-1">Hạn mức nợ: <span className="font-bold text-red-600 font-mono">{(selectedCustomer.creditLimit || 0).toLocaleString('vi-VN')} đ</span></p>
                {selectedCustomer.notes && (
                  <p className="text-gray-500 mt-1 italic">Ghi chú: "{selectedCustomer.notes}"</p>
                )}
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
          title={modalMode === 'create' ? 'Thêm mới khách hàng' : 'Cập nhật thông tin khách hàng'}
          size="erp"
        >
          <form onSubmit={handleSaveCustomer} className="space-y-6">
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-700 pb-2 mb-4">Thông tin cơ bản & định danh</h3>

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
                  <label className={`absolute bottom-0 right-0 p-1 bg-emerald-600 text-white rounded-full cursor-pointer shadow hover:bg-emerald-700 transition-all hover:scale-110 ${isUploadingAvatar ? 'opacity-70 pointer-events-none' : ''}`}>
                    {isUploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">Ảnh đại diện khách hàng</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Nhấp để chọn tệp ảnh từ máy tính (PNG, JPG, WebP) hoặc dán liên kết ảnh bên dưới.</p>
                  <div className="mt-2 flex items-center gap-2">
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold cursor-pointer hover:bg-emerald-100 transition-colors ${isUploadingAvatar ? 'opacity-70 pointer-events-none' : ''}`}>
                      {isUploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {isUploadingAvatar ? 'Đang tải lên...' : 'Tải ảnh lên'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                    </label>
                    <input
                      type="text"
                      value={editingCustomer.avatarUrl || ''}
                      onChange={(e) => setEditingCustomer((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                      placeholder="Hoặc dán liên kết ảnh..."
                      className="flex-1 px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Mã khách hàng *</label>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    value={editingCustomer.phone || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    placeholder="Nhập số điện thoại (VD: 0912345678)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ email</label>
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
                    placeholder="Nhập mã số thuế..."
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
                  province={addrPieces.province}
                  district={addrPieces.district}
                  ward={addrPieces.ward}
                  addressDetail={addrPieces.addressDetail}
                  onChange={(newPieces) => {
                    setAddrPieces(newPieces);
                    const fullAddr = [newPieces.addressDetail, newPieces.ward, newPieces.district, newPieces.province].filter(Boolean).join(', ');
                    setEditingCustomer(prev => ({ ...prev, address: fullAddr }));
                  }}
                />
              </div>
            </div>

            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-700 pb-2 mb-4">Tài chính, phân loại & chăm sóc khách hàng</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhóm khách hàng</label>
                  <SearchLookupModal
                    title="Chọn nhóm khách hàng"
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
                    title="Chọn khu vực"
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
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="DORMANT">Tạm ngưng</option>
                  <option value="CHURNED">Đã rời đi</option>
                </select>
              </div>

              <div>
                <FileDropzone label="Hồ sơ & giấy tờ đính kèm" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú & lưu ý</label>
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
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold shadow transition-all active:scale-95"
              >
                {modalMode === 'create' ? 'Thêm mới' : 'Lưu thông tin'}
              </button>
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
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow transition-all active:scale-95"
              >
                Xóa khách hàng
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Reset Password Modal */}
      {resetPasswordCustomer && (
        <Modal
          isOpen={Boolean(resetPasswordCustomer)}
          onClose={() => setResetPasswordCustomer(null)}
          title={`Cấp lại mật khẩu: ${resetPasswordCustomer.name}`}
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
