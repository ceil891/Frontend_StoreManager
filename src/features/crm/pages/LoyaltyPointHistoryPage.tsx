import { useMemo, useState, useEffect } from 'react';
import { Download, Search, Eye, Award, AlertCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useCrmStore } from '../store/crmStore';
import { exportToCsv } from '@/shared/utils/exportCsv';

interface LoyaltyPointHistoryItem {
  id: string;
  customerName: string;
  customerPhone: string;
  pointChange: number;
  transactionType: string;
  typeKey: 'EARN' | 'REDEEM' | 'ADJUST';
  referenceCode: string;
  transactionDate: string;
  operatorName: string;
  pointBalanceAfter: number;
  notes?: string;
}

export function LoyaltyPointHistoryPage() {
  const {
    loyaltyHistories: storeHistories,
    fetchLoyaltyHistories,
    customers,
    fetchCustomers,
  } = useCrmStore();

  useEffect(() => {
    fetchLoyaltyHistories();
    fetchCustomers();
  }, [fetchLoyaltyHistories, fetchCustomers]);

  const data: LoyaltyPointHistoryItem[] = useMemo(() => {
    return (storeHistories || []).map((h: any) => {
      const rawType = String(h.transactionType || h.actionType || '').toUpperCase();
      let typeKey: 'EARN' | 'REDEEM' | 'ADJUST' = 'ADJUST';
      let displayType = 'Điều chỉnh hệ thống';

      if (rawType.includes('EARN') || rawType.includes('TÍCH')) {
        typeKey = 'EARN';
        displayType = 'Tích điểm đơn hàng';
      } else if (rawType.includes('REDEEM') || rawType.includes('TIÊU') || rawType.includes('ĐỔI') || rawType.includes('QUÀ')) {
        typeKey = 'REDEEM';
        displayType = 'Đổi quà / voucher';
      } else if (h.pointsChange && Number(h.pointsChange) > 0) {
        typeKey = 'EARN';
        displayType = 'Tích điểm đơn hàng';
      } else if (h.pointsChange && Number(h.pointsChange) < 0) {
        typeKey = 'REDEEM';
        displayType = 'Đổi quà / voucher';
      }

      return {
        id: h.code || h.id || `TX-${Math.random()}`,
        customerName: h.customerName || h.name || 'Khách hàng',
        customerPhone: h.customerPhone || h.phone || 'Chưa cập nhật',
        pointChange: Number(h.pointsChange ?? h.pointChange ?? 0),
        transactionType: displayType,
        typeKey,
        referenceCode: h.refDocument || h.referenceOrder || `REF-${h.id}`,
        transactionDate: h.date || h.createdAt || new Date().toISOString().split('T')[0],
        operatorName: h.operatorName || 'Nhân viên thu ngân',
        pointBalanceAfter: Number(h.balanceAfter ?? h.pointBalanceAfter ?? 0),
        notes: h.notes || '',
      };
    });
  }, [storeHistories]);

  const totalPoints = useMemo(() => {
    if (customers && customers.length > 0) {
      return customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
    }
    if (data.length > 0) {
      return data.reduce((sum, d) => sum + Math.max(0, d.pointChange), 0);
    }
    return 0;
  }, [customers, data]);

  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'7days' | '30days' | 'thisMonth' | 'all'>('all');
  
  const [selectedItem, setSelectedItem] = useState<LoyaltyPointHistoryItem | null>(null);

  const handleExportExcel = () => {
    if (!filtered || filtered.length === 0) {
      toast.error('Không có dữ liệu để xuất Excel');
      return;
    }
    exportToCsv('Lich_su_tich_diem', filtered, [
      { header: 'Mã giao dịch', accessor: (r) => r.id },
      { header: 'Khách hàng', accessor: (r) => r.customerName },
      { header: 'Số điện thoại', accessor: (r) => r.customerPhone },
      { header: 'Điểm thay đổi', accessor: (r) => r.pointChange },
      { header: 'Loại giao dịch', accessor: (r) => r.transactionType },
      { header: 'Chứng từ gốc', accessor: (r) => r.referenceCode },
      { header: 'Ngày giao dịch', accessor: (r) => r.transactionDate },
      { header: 'Số dư sau', accessor: (r) => r.pointBalanceAfter },
      { header: 'Ghi chú', accessor: (r) => r.notes || '' },
    ]);
    toast.success('Đã xuất file Excel lịch sử điểm thành công');
  };

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
        item.customerPhone.toLowerCase().includes(search.toLowerCase()) ||
        item.referenceCode.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'ALL' || item.typeKey === typeFilter;
      
      let matchesDate = true;
      if (item.transactionDate) {
        const txDate = new Date(item.transactionDate);
        const now = new Date();
        if (dateFilter === '7days') {
          const diff = now.getTime() - txDate.getTime();
          matchesDate = diff <= 7 * 24 * 60 * 60 * 1000;
        } else if (dateFilter === '30days') {
          const diff = now.getTime() - txDate.getTime();
          matchesDate = diff <= 30 * 24 * 60 * 60 * 1000;
        } else if (dateFilter === 'thisMonth') {
          matchesDate = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [data, search, typeFilter, dateFilter]);

  const columns = useMemo<ColumnDef<LoyaltyPointHistoryItem>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Mã giao dịch',
        cell: (info) => (
          <span className="font-mono font-bold text-gray-900 dark:text-white">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 dark:text-white">{row.original.customerName}</span>
            <span className="text-xs text-gray-400 font-mono">{row.original.customerPhone}</span>
          </div>
        ),
      },
      {
        accessorKey: 'pointChange',
        header: 'Điểm thay đổi',
        cell: (info) => {
          const val = info.getValue() as number;
          const isPositive = val >= 0;
          return (
            <span
              className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded ${
                isPositive
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
              }`}
            >
              {isPositive ? `+${val}` : `${val}`}
            </span>
          );
        },
      },
      {
        accessorKey: 'transactionType',
        header: 'Loại giao dịch',
        cell: (info) => {
          const val = info.getValue() as string;
          const typeMap: Record<string, { label: string; color: string }> = {
            TÍCH_ĐIỂM_ĐƠN_HÀNG: { label: 'Tích điểm đơn hàng', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' },
            ĐỔI_QUÀ: { label: 'Đổi quà / voucher', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900' },
            ĐIỀU_CHỈNH_HỆ_THỐNG: { label: 'Hệ thống điều chỉnh', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900' },
          };
          const resolved = typeMap[val] || { label: val, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${resolved.color}`}>
              {resolved.label}
            </span>
          );
        },
      },
      {
        accessorKey: 'referenceCode',
        header: 'Chứng từ tham chiếu',
        cell: (info) => (
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'transactionDate',
        header: 'Ngày giao dịch',
        cell: (info) => (
          <span className="text-gray-500 font-mono text-sm">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'pointBalanceAfter',
        header: 'Số dư sau giao dịch',
        cell: (info) => (
          <span className="text-gray-500 font-mono text-sm">
            {info.getValue() as number}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
              title="Xem nhật ký chi tiết"
            >
              <Eye className="w-4 h-4 text-primary" /> Chi tiết
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lịch sử tích & tiêu điểm thưởng</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Nhật ký tự động theo dõi biến động điểm thành viên của khách hàng qua hoạt động mua hàng, đổi quà tặng, và hiệu chỉnh hệ thống.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
              <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng điểm khả dụng</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalPoints.toLocaleString()} điểm</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Điểm chờ kích hoạt</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">150 điểm</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Điểm sắp hết hạn</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">100 điểm</h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Hết hạn: 31/08/2026</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã giao dịch, khách hàng, số điện thoại, hóa đơn..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
              {(
                [
                  { id: 'all', label: 'Tất cả' },
                  { id: '7days', label: '7 ngày qua' },
                  { id: 'thisMonth', label: 'Tháng này' },
                  { id: '30days', label: '30 ngày' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDateFilter(f.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dateFilter === f.id
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap hidden sm:inline">Loại giao dịch:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white py-1.5 px-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="ALL">Tất cả loại giao dịch</option>
                <option value="EARN">Tích điểm đơn hàng</option>
                <option value="REDEEM">Đổi quà / voucher</option>
                <option value="ADJUST">Hệ thống điều chỉnh</option>
              </select>
            </div>
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={(row) => setSelectedItem(row)} />
      </div>

      {/* Drawer Chi tiết */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem ? `Chi tiết giao dịch điểm: ${selectedItem.id}` : 'Thông tin chi tiết'}
        width="max-w-lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
              selectedItem.pointChange >= 0
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
            }`}>
              <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Biến động điểm tích lũy</p>
                <p className={`text-xl font-bold ${selectedItem.pointChange >= 0 ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-800 dark:text-rose-400'}`}>
                  {selectedItem.pointChange >= 0 ? `+${selectedItem.pointChange}` : selectedItem.pointChange} điểm
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Khách hàng:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedItem.customerName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Số điện thoại:</span>
                <span className="font-mono text-gray-900 dark:text-white">{selectedItem.customerPhone}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Loại nghiệp vụ biến động:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedItem.transactionType === 'TÍCH_ĐIỂM_ĐƠN_HÀNG' ? 'Tích điểm hóa đơn bán hàng' : selectedItem.transactionType === 'ĐỔI_QUÀ' ? 'Đổi quà / quà tặng' : 'Điều chỉnh sửa đổi hệ thống'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Mã chứng từ liên đới:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedItem.referenceCode}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Ngày ghi nhận giao dịch:</span>
                <span className="font-mono text-gray-900 dark:text-white">{selectedItem.transactionDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Nhân viên xử lý tác nghiệp:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.operatorName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Điểm khả dụng (sau giao dịch):</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedItem.pointBalanceAfter.toLocaleString()} điểm</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Chi tiết nghiệp vụ & ghi chú</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedItem.notes || 'Không ghi nhận ghi chú.'}</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-bold">Nhật ký hệ thống tự động</p>
                <p>Mục này do hệ thống hạch toán tự động từ luồng nghiệp vụ POS/Bán hàng hoặc công cụ Chăm sóc khách hàng. Dữ liệu này chỉ cho phép truy xuất và đối chiếu lịch sử, không thể chỉnh sửa thủ công để đảm bảo tính minh bạch kế toán điểm.</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

