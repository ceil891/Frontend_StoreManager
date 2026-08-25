import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Ticket, Calendar, CheckCircle2, Clock, Tag, Copy, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useCrmStore } from '../store/crmStore';

import { axiosClient } from '@/shared/lib/axiosClient';

export interface RewardVoucherRecord {
  id: string;
  voucherCode: string;
  campaignName: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  startDate: string;
  expiryDate: string;
  totalIssued: number;
  totalRedeemed: number;
  status: 'ACTIVE' | 'EXPIRED' | 'PAUSED';
  applicableScope: 'ALL_PRODUCTS' | 'SPECIFIC_CATEGORY' | 'SPECIFIC_PRODUCTS';
  notes?: string;
}

const scopeBadgeStyles: Record<string, string> = {
  ALL_PRODUCTS: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  SPECIFIC_CATEGORY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  SPECIFIC_PRODUCTS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
};

const scopeMap: Record<string, string> = {
  ALL_PRODUCTS: 'Tất cả sản phẩm',
  SPECIFIC_CATEGORY: 'Theo danh mục',
  SPECIFIC_PRODUCTS: 'Sản phẩm chỉ định',
};

export function VouchersPage() {
  const {
    vouchers: storeVouchers,
    fetchVouchers,
    addVoucher,
    updateVoucher,
    deleteVoucher,
  } = useCrmStore();

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const data: RewardVoucherRecord[] = useMemo(() => {
    return storeVouchers.map((v) => ({
      id: v.id,
      voucherCode: v.code,
      campaignName: v.name,
      type: (v.discountType as any) || 'PERCENTAGE',
      discountValue: v.value,
      minOrderValue: v.minOrderValue,
      maxDiscount: v.maxDiscount,
      startDate: v.startDate,
      expiryDate: v.endDate,
      totalIssued: v.quantity,
      totalRedeemed: v.usedCount,
      status: (v.status as any) || 'ACTIVE',
      applicableScope: 'ALL_PRODUCTS',
      notes: v.name,
    }));
  }, [storeVouchers]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<RewardVoucherRecord | null>(null);

  // Modal create/edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RewardVoucherRecord | null>(null);
  const [formData, setFormData] = useState({
    voucherCode: '',
    campaignName: '',
    type: 'PERCENTAGE' as RewardVoucherRecord['type'],
    discountValue: 10,
    minOrderValue: 0,
    maxDiscount: 0,
    startDate: '',
    expiryDate: '',
    totalIssued: 100,
    status: 'ACTIVE' as RewardVoucherRecord['status'],
    applicableScope: 'ALL_PRODUCTS' as RewardVoucherRecord['applicableScope'],
    notes: '',
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const handleDelete = async (voucher: RewardVoucherRecord) => {
    if (!confirm(`Bạn có chắc muốn xóa voucher ${voucher.voucherCode}?`)) return;
    try {
      await axiosClient.delete(`/crm/vouchers/${voucher.id}`);
      toast.success(`Đã xóa voucher ${voucher.voucherCode}`);
      fetchVouchers();
    } catch (err) {
      console.error('Error deleting voucher:', err);
      toast.error('Không thể xóa voucher trên máy chủ');
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      voucherCode: `VC-${Math.floor(1000 + Math.random() * 9000)}`,
      campaignName: '',
      type: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 100,
      maxDiscount: 50,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      totalIssued: 500,
      status: 'ACTIVE',
      applicableScope: 'ALL_PRODUCTS',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (voucher: RewardVoucherRecord) => {
    setEditingItem(voucher);
    setFormData({
      voucherCode: voucher.voucherCode,
      campaignName: voucher.campaignName,
      type: voucher.type,
      discountValue: voucher.discountValue,
      minOrderValue: voucher.minOrderValue,
      maxDiscount: voucher.maxDiscount || 0,
      startDate: voucher.startDate,
      expiryDate: voucher.expiryDate,
      totalIssued: voucher.totalIssued,
      status: voucher.status,
      applicableScope: voucher.applicableScope,
      notes: voucher.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];

    if (!editingItem && formData.startDate && formData.startDate < today) {
      toast.error('Ngày bắt đầu không được ở trong quá khứ! Tối thiểu phải từ hôm nay trở đi.');
      return;
    }

    if (formData.startDate && formData.expiryDate) {
      if (formData.expiryDate < formData.startDate) {
        toast.error('Hạn sử dụng (Ngày kết thúc) không được nhỏ hơn Ngày bắt đầu!');
        return;
      }
      if (!editingItem && formData.startDate < today && formData.expiryDate < today) {
        toast.error('Không cho phép tạo voucher với khoảng thời gian hoàn toàn trong quá khứ!');
        return;
      }
    }

    if (formData.discountValue <= 0) {
      toast.error('Giá trị giảm giá phải lớn hơn 0!');
      return;
    }

    if (formData.type === 'PERCENTAGE' && formData.discountValue > 100) {
      toast.error('Mức giảm theo phần trăm không được vượt quá 100%!');
      return;
    }

    if (formData.minOrderValue > 0) {
      if (formData.type === 'FIXED_AMOUNT' && formData.discountValue > formData.minOrderValue) {
        toast.error(`Số tiền giảm (${Math.round(formData.discountValue).toLocaleString('vi-VN')} ₫) không được vượt quá Giá trị đơn tối thiểu (${Math.round(formData.minOrderValue).toLocaleString('vi-VN')} ₫)!`);
        return;
      }
      if (formData.type === 'PERCENTAGE' && formData.maxDiscount && formData.maxDiscount > formData.minOrderValue) {
        toast.error(`Mức giảm tối đa (${Math.round(formData.maxDiscount).toLocaleString('vi-VN')} ₫) không được vượt quá Giá trị đơn tối thiểu (${Math.round(formData.minOrderValue).toLocaleString('vi-VN')} ₫)!`);
        return;
      }
    }

    // Tự động tính trạng thái theo thời gian khi tạo mới
    let computedStatus: RewardVoucherRecord['status'] = 'ACTIVE';
    if (formData.startDate > today) {
      computedStatus = 'SCHEDULED';
    } else if (formData.expiryDate < today) {
      computedStatus = 'EXPIRED';
    } else {
      computedStatus = 'ACTIVE';
    }

    const finalStatus = editingItem ? formData.status : computedStatus;

    try {
      if (editingItem) {
        await updateVoucher(editingItem.id, {
          code: formData.voucherCode,
          name: formData.campaignName,
          discountType: formData.type as any,
          value: formData.discountValue,
          minOrderValue: formData.minOrderValue,
          maxDiscount: formData.maxDiscount,
          quantity: formData.totalIssued,
          status: finalStatus as any,
          startDate: formData.startDate,
          endDate: formData.expiryDate,
        });
        toast.success(`Cập nhật voucher ${formData.voucherCode} thành công!`);
      } else {
        await addVoucher({
          code: formData.voucherCode,
          name: formData.campaignName,
          discountType: formData.type as any,
          value: formData.discountValue,
          minOrderValue: formData.minOrderValue,
          maxDiscount: formData.maxDiscount,
          quantity: formData.totalIssued,
          status: finalStatus as any,
          startDate: formData.startDate,
          endDate: formData.expiryDate,
          usedCount: 0,
        });
        toast.success(`Tạo mới voucher ${formData.voucherCode} thành công (Trạng thái: ${finalStatus === 'SCHEDULED' ? 'Đã lên lịch' : 'Đang hoạt động'})!`);
      }
      setIsModalOpen(false);
      fetchVouchers();
    } catch (err) {
      console.error('Error saving voucher:', err);
      toast.error('Lỗi khi lưu voucher!');
    }
  };

  const filtered = data.filter((item) => {
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.voucherCode.toLowerCase().includes(q) ||
        item.campaignName.toLowerCase().includes(q) ||
        item.applicableScope.toLowerCase().includes(q)
      );
    }
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const columns = useMemo<ColumnDef<RewardVoucherRecord>[]>(
    () => [
      {
        accessorKey: 'voucherCode',
        header: 'Mã voucher',
        cell: (info) => (
          <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 hover:underline">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'campaignName',
        header: 'Tên chiến dịch',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white truncate block max-w-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'discountValue',
        header: 'Mức giảm giá',
        cell: ({ row }) => {
          const type = row.original.type;
          const val = row.original.discountValue;
          const typeMap: Record<string, string> = {
            FREE_SHIPPING: 'Miễn phí vận chuyển',
            FREE_ITEM: 'Tặng sản phẩm',
          };
          return (
            <span className="font-bold text-gray-900 dark:text-white text-sm">
              {type === 'PERCENTAGE' ? `${val}%` : type === 'FIXED_AMOUNT' ? `${Math.round(val).toLocaleString('vi-VN')} đ` : typeMap[type] || type}
            </span>
          );
        },
      },
      {
        accessorKey: 'minOrderValue',
        header: 'Đơn tối thiểu',
        cell: (info) => <span className="font-mono text-gray-700 dark:text-gray-300">{Math.round(info.getValue() as number).toLocaleString('vi-VN')} đ</span>,
      },
      {
        accessorKey: 'applicableScope',
        header: 'Phạm vi áp dụng',
        cell: (info) => {
          const scope = info.getValue() as keyof typeof scopeBadgeStyles;
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${scopeBadgeStyles[scope] || 'bg-gray-100 text-gray-800'}`}>
              {scopeMap[scope] || scope}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalRedeemed',
        header: 'Đã dùng / đã phát hành',
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-gray-900 dark:text-white">{row.original.totalRedeemed}</span>
            <span className="text-xs text-gray-400 ml-1">/ {row.original.totalIssued}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            ACTIVE: 'Hoạt động',
            SCHEDULED: 'Đã lên lịch',
            EXPIRED: 'Đã hết hạn',
            PAUSED: 'Tạm dừng',
            DEPLETED: 'Đã hết lượt',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'PAUSED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {statusMap[status] || status}
            </span>
          );
        },
      },
      {
        accessorKey: 'expiryDate',
        header: 'Hạn sử dụng',
        cell: (info) => <span className="text-gray-500 text-sm font-mono">{info.getValue() as string}</span>,
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedVoucher(row.original); }}
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
              onClick={(e) => { e.stopPropagation(); handleDelete(row.original); }}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const statusMapFull: Record<string, string> = {
    ACTIVE: 'Đang hoạt động',
    SCHEDULED: 'Đã lên lịch',
    EXPIRED: 'Đã hết hạn',
    PAUSED: 'Tạm dừng',
    DEPLETED: 'Đã hết lượt phát hành',
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mã khuyến mãi & chiến dịch ưu đãi</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý và tạo mã giảm giá, thiết lập điều kiện áp dụng và theo dõi hiệu quả khuyến mãi trên toàn hệ thống. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thêm mới voucher
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm theo mã voucher, tên chiến dịch hoặc phạm vi..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Lọc trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="SCHEDULED">Đã lên lịch</option>
                <option value="PAUSED">Tạm dừng</option>
                <option value="EXPIRED">Đã hết hạn</option>
                <option value="DEPLETED">Đã phát hành hết</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Loại voucher:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả loại voucher</option>
                <option value="PERCENTAGE">Phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Số tiền cố định (đ)</option>
                <option value="FREE_SHIPPING">Miễn phí vận chuyển</option>
                <option value="FREE_ITEM">Tặng quà / sản phẩm</option>
              </select>
            </div>

            {(statusFilter !== 'all' || typeFilter !== 'all' || search) && (
              <button
                onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={(row) => setSelectedVoucher(row)} />
      </div>

      {/* Detail Drawer */}
      <Modal
        isOpen={!!selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        title={selectedVoucher ? `Chi tiết voucher: ${selectedVoucher.voucherCode}` : 'Chi tiết mã khuyến mãi'}
        size="erp"
      >
        {selectedVoucher && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedVoucher.status === 'ACTIVE'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : selectedVoucher.status === 'SCHEDULED'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedVoucher.status === 'ACTIVE' ? 'bg-emerald-600' : selectedVoucher.status === 'SCHEDULED' ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Giá trị khuyến mãi</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedVoucher.type === 'PERCENTAGE'
                      ? `${selectedVoucher.discountValue}% giảm`
                      : selectedVoucher.type === 'FIXED_AMOUNT'
                      ? `${Math.round(selectedVoucher.discountValue).toLocaleString('vi-VN')} đ giảm`
                      : selectedVoucher.type === 'FREE_SHIPPING'
                      ? 'Miễn phí vận chuyển'
                      : 'Tặng sản phẩm'}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedVoucher.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedVoucher.status === 'SCHEDULED' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              }`}>
                {statusMapFull[selectedVoucher.status] || selectedVoucher.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-emerald-600" /> Ngày bắt đầu
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate font-mono">
                  {selectedVoucher.startDate && selectedVoucher.startDate.trim() !== '' ? selectedVoucher.startDate : '17/08/2026'}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Clock className="w-4 h-4 text-red-500" /> Hạn sử dụng
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate font-mono">
                  {selectedVoucher.expiryDate && selectedVoucher.expiryDate.trim() !== '' ? selectedVoucher.expiryDate : '31/12/2026'}
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tên chương trình khuyến mãi</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedVoucher.campaignName}</h3>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded font-mono font-semibold ${scopeBadgeStyles[selectedVoucher.applicableScope] || 'bg-gray-100 text-gray-800'}`}>
                  Phạm vi: {scopeMap[selectedVoucher.applicableScope] || selectedVoucher.applicableScope}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-gray-500 dark:text-gray-400">Giá trị đơn hàng tối thiểu:</span>
                <span className="font-bold font-mono text-gray-900 dark:text-white">
                  {Math.round(selectedVoucher.minOrderValue).toLocaleString('vi-VN')} đ
                </span>
              </div>
              {selectedVoucher.maxDiscount ? (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Mức giảm tối đa (giới hạn trần):</span>
                  <span className="font-semibold font-mono text-emerald-600">
                    {Math.round(selectedVoucher.maxDiscount).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Lượt sử dụng / tổng số lượng:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedVoucher.totalRedeemed} / {selectedVoucher.totalIssued} mã</span>
              </div>

              {selectedVoucher.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú chiến lược khuyến mãi</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedVoucher.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedVoucher.status === 'SCHEDULED' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Kích hoạt ngay lập tức
                </button>
              )}
              <button
                onClick={() => { navigator.clipboard.writeText(selectedVoucher.voucherCode); toast.success('Đã sao chép mã khuyến mãi!'); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow transition-colors text-sm"
              >
                <Copy className="w-4 h-4" /> Sao chép mã khuyến mãi
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Cập nhật voucher' : 'Thêm mới voucher'} size="erp">
        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã voucher *</label>
              <input
                type="text"
                required
                value={formData.voucherCode}
                onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase().trim() })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono font-bold text-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên chiến dịch / tên voucher *</label>
              <input
                type="text"
                required
                value={formData.campaignName}
                onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                placeholder="VD: Tri ân khách hàng thân thiết..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại ưu đãi *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-semibold"
              >
                <option value="PERCENTAGE">Phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Số tiền cố định (đ)</option>
                <option value="FREE_SHIPPING">Miễn phí vận chuyển</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {formData.type === 'PERCENTAGE'
                  ? 'Mức giảm (%) * (Tối đa 100%)'
                  : formData.type === 'FIXED_AMOUNT'
                  ? 'Số tiền giảm (đ) *'
                  : 'Mức miễn phí vận chuyển tối đa (đ) *'}
              </label>
              <input
                type="text"
                value={formData.discountValue === 0 ? '' : formData.type === 'PERCENTAGE' ? String(formData.discountValue) : Math.round(formData.discountValue).toLocaleString('vi-VN')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  let num = digits === '' ? 0 : parseInt(digits, 10);
                  if (formData.type === 'PERCENTAGE' && num > 100) num = 100;
                  setFormData({ ...formData, discountValue: Math.max(0, num) });
                }}
                placeholder={formData.type === 'PERCENTAGE' ? 'Nhập số % (1-100)...' : 'Nhập số tiền...'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-bold font-mono text-emerald-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giá trị đơn tối thiểu (đ)</label>
              <input
                type="text"
                value={formData.minOrderValue === 0 ? '' : Math.round(formData.minOrderValue).toLocaleString('vi-VN')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  const num = digits === '' ? 0 : parseInt(digits, 10);
                  setFormData({ ...formData, minOrderValue: Math.max(0, num) });
                }}
                placeholder="0 (Không giới hạn)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
              />
            </div>

            {formData.type === 'PERCENTAGE' ? (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mức giảm tối đa (đ) (giới hạn trần)</label>
                <input
                  type="text"
                  value={formData.maxDiscount === 0 ? '' : Math.round(formData.maxDiscount).toLocaleString('vi-VN')}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    const num = digits === '' ? 0 : parseInt(digits, 10);
                    setFormData({ ...formData, maxDiscount: Math.max(0, num) });
                  }}
                  placeholder="0 (Không khống chế trần)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng số lượt phát hành *</label>
                <input
                  type="text"
                  value={formData.totalIssued === 0 ? '' : Math.round(formData.totalIssued).toLocaleString('vi-VN')}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    const num = digits === '' ? 0 : parseInt(digits, 10);
                    setFormData({ ...formData, totalIssued: Math.max(1, num) });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
                  required
                />
              </div>
            )}
          </div>

          {formData.type === 'PERCENTAGE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng số lượt phát hành *</label>
                <input
                  type="text"
                  value={formData.totalIssued === 0 ? '' : Math.round(formData.totalIssued).toLocaleString('vi-VN')}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    const num = digits === '' ? 0 : parseInt(digits, 10);
                    setFormData({ ...formData, totalIssued: Math.max(1, num) });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
                  required
                />
              </div>
              {editingItem && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-semibold"
                  >
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="SCHEDULED">Đã lên lịch</option>
                    <option value="PAUSED">Tạm dừng</option>
                    <option value="EXPIRED">Đã kết thúc</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {formData.type !== 'PERCENTAGE' && editingItem && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-semibold"
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="SCHEDULED">Đã lên lịch</option>
                <option value="PAUSED">Tạm dừng</option>
                <option value="EXPIRED">Đã kết thúc</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày bắt đầu (hiệu lực) *</label>
              <input
                type="date"
                required
                min={!editingItem ? new Date().toISOString().split('T')[0] : undefined}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hạn sử dụng (ngày hết hạn) *</label>
              <input
                type="date"
                required
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú chiến lược khuyến mãi</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ghi chú điều kiện áp dụng..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              {editingItem ? 'Lưu thông tin' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

