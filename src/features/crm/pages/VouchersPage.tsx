import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Ticket, Calendar, CheckCircle2, Clock, Tag, Copy, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import type { ColumnDef } from '@tanstack/react-table';

interface RewardVoucherRecord {
  id: string;
  voucherCode: string;
  campaignName: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'FREE_ITEM';
  discountValue: number; // e.g., 15 for 15% or 50 for $50
  minOrderValue: number;
  maxDiscount?: number;
  startDate: string;
  expiryDate: string;
  totalIssued: number;
  totalRedeemed: number;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'PAUSED' | 'DEPLETED';
  applicableScope: 'ALL_PRODUCTS' | 'SPECIFIC_CATEGORY' | 'VIP_TIER_ONLY' | 'FIRST_TIME_BUYER';
  notes?: string;
}

const MOCK_VOUCHERS: RewardVoucherRecord[] = [
  { id: '1', voucherCode: 'SUMMERPROMO15', campaignName: 'Omnichannel Q2 Summer Blowout', type: 'PERCENTAGE', discountValue: 15, minOrderValue: 100.00, maxDiscount: 75.00, startDate: '2024-05-01', expiryDate: '2024-08-31', totalIssued: 5000, totalRedeemed: 1420, status: 'ACTIVE', applicableScope: 'ALL_PRODUCTS', notes: 'Blanket omnichannel summer promotion promoted across POS terminals and B2B eCommerce portal.' },
  { id: '2', voucherCode: 'VIPGOLD50', campaignName: 'Gold Member Quarterly Reward', type: 'FIXED_AMOUNT', discountValue: 50, minOrderValue: 250.00, startDate: '2024-05-15', expiryDate: '2024-06-15', totalIssued: 1200, totalRedeemed: 310, status: 'ACTIVE', applicableScope: 'VIP_TIER_ONLY', notes: 'Exclusive $50 credit issued to Gold and Diamond loyalty accounts.' },
  { id: '3', voucherCode: 'FREESHIPB2B', campaignName: 'Wholesale Pallet Ground Dispatch', type: 'FREE_SHIPPING', discountValue: 0, minOrderValue: 1000.00, startDate: '2024-04-01', expiryDate: '2024-05-15', totalIssued: 800, totalRedeemed: 795, status: 'EXPIRED', applicableScope: 'SPECIFIC_CATEGORY', notes: 'Promotional waiver of freight carrier fees for wholesale beverage pallets.' },
  { id: '4', voucherCode: 'NEWRETAIL10', campaignName: 'First Time Store Activation', type: 'PERCENTAGE', discountValue: 10, minOrderValue: 50.00, maxDiscount: 25.00, startDate: '2024-05-20', expiryDate: '2024-12-31', totalIssued: 10000, totalRedeemed: 0, status: 'SCHEDULED', applicableScope: 'FIRST_TIME_BUYER', notes: 'Automated welcome voucher printed on receipt during first customer loyalty registration.' },
];

const scopeBadgeStyles = {
  ALL_PRODUCTS: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  SPECIFIC_CATEGORY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  VIP_TIER_ONLY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  FIRST_TIME_BUYER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

const scopeMap: Record<string, string> = {
  ALL_PRODUCTS: 'Tất cả sản phẩm',
  SPECIFIC_CATEGORY: 'Danh mục cụ thể',
  VIP_TIER_ONLY: 'Chỉ dành cho VIP',
  FIRST_TIME_BUYER: 'Khách hàng mới',
};

export function VouchersPage() {
  const [data] = useState<RewardVoucherRecord[]>(MOCK_VOUCHERS);
  const [search, setSearch] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<RewardVoucherRecord | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.voucherCode.toLowerCase().includes(q) ||
        item.campaignName.toLowerCase().includes(q) ||
        item.applicableScope.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    // 3. Type filter
    const matchesType = typeFilter === 'all' || item.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const columns = useMemo<ColumnDef<RewardVoucherRecord>[]>(
    () => [
      {
        accessorKey: 'voucherCode',
        header: 'Mã Voucher',
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
              {type === 'PERCENTAGE' ? `${val}%` : type === 'FIXED_AMOUNT' ? `$${val.toFixed(2)}` : typeMap[type] || type}
            </span>
          );
        },
      },
      {
        accessorKey: 'minOrderValue',
        header: 'Đơn tối thiểu',
        cell: (info) => <span className="font-mono text-gray-700 dark:text-gray-300">${(info.getValue() as number).toFixed(2)}</span>,
      },
      {
        accessorKey: 'applicableScope',
        header: 'Phạm vi áp dụng',
        cell: (info) => {
          const scope = info.getValue() as keyof typeof scopeBadgeStyles;
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${scopeBadgeStyles[scope]}`}>
              {scopeMap[scope] || scope}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalRedeemed',
        header: 'Đã dùng / Đã phát hành',
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
              onClick={(e) => { e.stopPropagation(); alert(`Chỉnh sửa voucher: ${row.original.voucherCode}`); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); confirm(`Bạn có chắc muốn xóa voucher ${row.original.voucherCode}?`); }}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mã Khuyến Mãi & Chiến Dịch Ưu Đãi (Vouchers)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý và tạo mã giảm giá, thiết lập điều kiện áp dụng và theo dõi hiệu quả khuyến mãi trên toàn hệ thống. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất danh sách voucher
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Tạo mã khuyến mãi mới
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

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Lọc Trạng thái:</span>
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
                <option value="PERCENTAGE">PERCENTAGE (Phần trăm)</option>
                <option value="FIXED_AMOUNT">FIXED AMOUNT (Cố định)</option>
                <option value="FREE_SHIPPING">FREE SHIPPING (Phí vận chuyển)</option>
                <option value="FREE_ITEM">FREE ITEM (Tặng quà)</option>
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

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedVoucher(row)} />
      </div>

      <Drawer
        isOpen={!!selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        title={selectedVoucher ? `Chiến Dịch: ${selectedVoucher.voucherCode}` : 'Chi Tiết Mã Khuyến Mãi'}
        width="max-w-lg"
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
                    {selectedVoucher.type === 'PERCENTAGE' ? `${selectedVoucher.discountValue}% GIẢM` : selectedVoucher.type === 'FIXED_AMOUNT' ? `$${selectedVoucher.discountValue.toFixed(2)} GIẢM` : selectedVoucher.type === 'FREE_SHIPPING' ? 'Miễn phí vận chuyển' : 'Tặng sản phẩm'}
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
                <p className="text-base font-bold text-gray-900 dark:text-white truncate font-mono">{selectedVoucher.startDate}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Clock className="w-4 h-4 text-red-500" /> Hạn sử dụng
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate font-mono">{selectedVoucher.expiryDate}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tên chương trình khuyến mãi</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedVoucher.campaignName}</h3>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded font-mono font-semibold ${scopeBadgeStyles[selectedVoucher.applicableScope]}`}>
                  Phạm vi: {scopeMap[selectedVoucher.applicableScope] || selectedVoucher.applicableScope}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-gray-500 dark:text-gray-400">Giá trị đơn hàng tối thiểu:</span>
                <span className="font-bold font-mono text-gray-900 dark:text-white">${selectedVoucher.minOrderValue.toFixed(2)}</span>
              </div>
              {selectedVoucher.maxDiscount && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Mức giảm tối đa (Capped):</span>
                  <span className="font-semibold font-mono text-primary">${selectedVoucher.maxDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Lượt sử dụng / Tổng số lượng:</span>
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
                onClick={() => { navigator.clipboard.writeText(selectedVoucher.voucherCode); alert('Đã sao chép mã khuyến mãi!'); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow transition-colors text-sm"
              >
                <Copy className="w-4 h-4" /> Sao chép mã khuyến mãi
              </button>
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <Tag className="w-4 h-4 inline mr-1" /> Xem hóa đơn đã dùng
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
