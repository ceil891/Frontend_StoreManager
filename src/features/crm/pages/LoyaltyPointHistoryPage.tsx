import { useMemo, useState } from 'react';
import { Download, Search, Eye, Award, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import type { ColumnDef } from '@tanstack/react-table';

interface LoyaltyPointHistoryItem {
  id: string;
  customerName: string;
  customerPhone: string;
  pointChange: number;
  transactionType: 'TÍCH_ĐIỂM_ĐƠN_HÀNG' | 'ĐỔI_QUÀ' | 'ĐIỀU_CHỈNH_HỆ_THỐNG';
  referenceCode: string;
  transactionDate: string;
  operatorName: string;
  pointBalanceAfter: number;
  notes?: string;
}

const MOCK_DATA: LoyaltyPointHistoryItem[] = [
  { id: 'GD-10021', customerName: 'Nguyễn Văn A', customerPhone: '0901234567', pointChange: 150, transactionType: 'TÍCH_ĐIỂM_ĐƠN_HÀNG', referenceCode: 'HD0001042', transactionDate: '2026-06-04 10:15:30', operatorName: 'Trần Thị Thuỷ (Thu ngân)', pointBalanceAfter: 1250, notes: 'Tích điểm tự động từ hoá đơn mua sắm hàng tiêu dùng nhanh.' },
  { id: 'GD-10022', customerName: 'Lê Hoàng Long', customerPhone: '0987654321', pointChange: -500, transactionType: 'ĐỔI_QUÀ', referenceCode: 'QC00084', transactionDate: '2026-06-04 11:20:00', operatorName: 'Trần Thị Thuỷ (Thu ngân)', pointBalanceAfter: 350, notes: 'Khách hàng đổi 500 điểm lấy Voucher giảm giá 50k.' },
  { id: 'GD-10023', customerName: 'Phạm Thanh Bình', customerPhone: '0912345678', pointChange: 50, transactionType: 'ĐIỀU_CHỈNH_HỆ_THỐNG', referenceCode: 'ADJ-9921', transactionDate: '2026-06-03 14:05:12', operatorName: 'Nguyễn Văn B (Quản trị viên)', pointBalanceAfter: 420, notes: 'Điều chỉnh điểm bù lỗi hệ thống tính toán sai lệch ngày 02-06.' },
  { id: 'GD-10024', customerName: 'Trần Minh Quân', customerPhone: '0933445566', pointChange: 220, transactionType: 'TÍCH_ĐIỂM_ĐƠN_HÀNG', referenceCode: 'HD0001048', transactionDate: '2026-06-03 16:42:01', operatorName: 'Lê Văn C (Bán hàng)', pointBalanceAfter: 880, notes: 'Tích điểm đơn hàng mua Tủ lạnh Panasonic.' },
  { id: 'GD-10025', customerName: 'Vũ Thị Hương', customerPhone: '0944556677', pointChange: -100, transactionType: 'ĐỔI_QUÀ', referenceCode: 'QC00089', transactionDate: '2026-06-02 09:12:45', operatorName: 'Trần Thị Thuỷ (Thu ngân)', pointBalanceAfter: 150, notes: 'Đổi 100 điểm lấy 01 Ly sứ RetailHub.' }
];

export function LoyaltyPointHistoryPage() {
  const [data] = useState<LoyaltyPointHistoryItem[]>(MOCK_DATA);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('Tất cả');
  
  const [selectedItem, setSelectedItem] = useState<LoyaltyPointHistoryItem | null>(null);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
        item.customerPhone.toLowerCase().includes(search.toLowerCase()) ||
        item.referenceCode.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'Tất cả' || item.transactionType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [data, search, typeFilter]);

  const columns = useMemo<ColumnDef<LoyaltyPointHistoryItem>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Mã GD',
        cell: (info) => (
          <span className="font-mono font-bold text-gray-900 dark:text-white">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'customerName',
        header: 'Khách Hàng',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 dark:text-white">{row.original.customerName}</span>
            <span className="text-xs text-gray-400 font-mono">{row.original.customerPhone}</span>
          </div>
        ),
      },
      {
        accessorKey: 'pointChange',
        header: 'Điểm Thay Đổi',
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
        header: 'Loại Giao Dịch',
        cell: (info) => {
          const val = info.getValue() as string;
          const typeMap: Record<string, { label: string; color: string }> = {
            TÍCH_ĐIỂM_ĐƠN_HÀNG: { label: 'Tích điểm đơn hàng', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' },
            ĐỔI_QUÀ: { label: 'Đổi quà / Voucher', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900' },
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
        header: 'Chứng Từ Tham Chiếu',
        cell: (info) => (
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'transactionDate',
        header: 'Ngày Giao Dịch',
        cell: (info) => (
          <span className="text-gray-500 font-mono text-sm">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
              title="Xem nhật ký chi tiết"
            >
              <Eye className="w-4 h-4" /> Chi tiết
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lịch Sử Tích & Tiêu Điểm Loyalty</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Nhật ký tự động theo dõi biến động điểm thành viên của khách hàng qua hoạt động mua hàng, đổi quà tặng, và hiệu chỉnh hệ thống.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất báo cáo biến động
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã GD, khách hàng, số điện thoại, hóa đơn..."
              className="block w-full sm:max-w-md pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Loại giao dịch:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-2"
            >
              <option value="Tất cả">Tất cả loại giao dịch</option>
              <option value="TÍCH_ĐIỂM_ĐƠN_HÀNG">Tích điểm đơn hàng</option>
              <option value="ĐỔI_QUÀ">Đổi quà / Voucher</option>
              <option value="ĐIỀU_CHỈNH_HỆ_THỐNG">Hệ thống điều chỉnh</option>
            </select>
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={setSelectedItem} />
      </div>

      {/* Drawer Chi tiết */}
      <Drawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem ? `Chi tiết giao dịch điểm: ${selectedItem.id}` : 'Thông tin chi tiết'}
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
                  {selectedItem.pointChange >= 0 ? `+${selectedItem.pointChange}` : selectedItem.pointChange} Điểm
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Khách hàng:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedItem.customerName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Số điện thoại liên lạc:</span>
                <span className="font-mono text-gray-900 dark:text-white">{selectedItem.customerPhone}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Loại nghiệp vụ biến động:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedItem.transactionType === 'TÍCH_ĐIỂM_ĐƠN_HÀNG' ? 'Tích điểm hóa đơn bán hàng' : selectedItem.transactionType === 'ĐỔI_QUÀ' ? 'Đổi quà / Quà tặng' : 'Điều chỉnh sửa đổi hệ thống'}
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
                <span className="text-gray-500">Điểm khả dụng (sau GD):</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedItem.pointBalanceAfter.toLocaleString()} điểm</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Chi tiết nghiệp vụ & Ghi chú</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedItem.notes || 'Không ghi nhận ghi chú.'}</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-bold uppercase">Nhật ký hệ thống tự động</p>
                <p>Mục này do hệ thống hạch toán tự động từ luồng nghiệp vụ POS/Bán hàng hoặc công cụ Chăm sóc khách hàng. Dữ liệu này chỉ cho phép truy xuất và đối chiếu lịch sử, không thể chỉnh sửa thủ công để đảm bảo tính minh bạch kế toán điểm.</p>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
