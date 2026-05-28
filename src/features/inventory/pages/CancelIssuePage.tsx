import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, AlertCircle, Building2, Calendar, FileText, CheckCircle2, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import type { ColumnDef } from '@tanstack/react-table';

interface CancelIssueRecord {
  id: string;
  issueCode: string;
  sku: string;
  productName: string;
  category: string;
  quantity: number;
  totalValuation: number;
  reason: 'DAMAGED' | 'EXPIRED' | 'LOST' | 'THEFT' | 'QUALITY_DEFECT';
  locationHub: string;
  loggedDate: string;
  authorizedBy: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  notes?: string;
}

const MOCK_CANCEL_ISSUES: CancelIssueRecord[] = [
  { id: '1', issueCode: 'WRO-2024-001', sku: 'SKU-FOOD-102', productName: 'Artisanal Sourdough Flour 5KG', category: 'Grocery', quantity: 5, totalValuation: 41.00, reason: 'DAMAGED', locationHub: 'Downtown Branch', loggedDate: '2024-05-18', authorizedBy: 'Michael Chang', status: 'APPROVED', notes: 'Water damage resulting from storage humidity leak.' },
  { id: '2', issueCode: 'WRO-2024-002', sku: 'SKU-BEV-909', productName: 'Imported Sparkling Mineral Water', category: 'Beverage', quantity: 24, totalValuation: 30.00, reason: 'EXPIRED', locationHub: 'Northside Store', loggedDate: '2024-05-17', authorizedBy: 'David Ross', status: 'PROCESSED', notes: 'Batch expired on display shelves. Disposed and accounted as write-off.' },
  { id: '3', issueCode: 'WRO-2024-003', sku: 'SKU-ELEC-002', productName: 'Bluetooth Barcode Scanner', category: 'Hardware', quantity: 1, totalValuation: 120.00, reason: 'LOST', locationHub: 'Central Warehouse', loggedDate: '2024-05-15', authorizedBy: 'Super Admin', status: 'PENDING_APPROVAL', notes: 'Missing during physical inventory audit count. Under investigation.' },
  { id: '4', issueCode: 'WRO-2024-004', sku: 'SKU-APPA-204', productName: 'Staff Uniform Organic Tee (L)', category: 'Apparel', quantity: 2, totalValuation: 50.00, reason: 'QUALITY_DEFECT', locationHub: 'Main Flagship / HQ', loggedDate: '2024-05-14', authorizedBy: 'Sarah Jenkins', status: 'REJECTED', notes: 'Torn seams. Rejected write-off request, returning to vendor for exchange.' },
];

export function CancelIssuePage() {
  const [data] = useState<CancelIssueRecord[]>(MOCK_CANCEL_ISSUES);
  const [search, setSearch] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<CancelIssueRecord | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.issueCode.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.locationHub.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = useMemo<ColumnDef<CancelIssueRecord>[]>(
    () => [
      {
        accessorKey: 'issueCode',
        header: 'Mã phiếu',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Sản phẩm / SKU',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{row.original.productName}</p>
            <p className="text-xs font-mono text-gray-500">{row.original.sku}</p>
          </div>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Lý do hủy',
        cell: (info) => {
          const reason = info.getValue() as string;
          const reasonMap: Record<string, string> = {
            DAMAGED: 'Hư hỏng',
            EXPIRED: 'Hết hạn',
            LOST: 'Thất lạc',
            THEFT: 'Mất cắp',
            QUALITY_DEFECT: 'Lỗi chất lượng',
          };
          return (
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {reasonMap[reason] || reason}
            </span>
          );
        },
      },
      {
        accessorKey: 'quantity',
        header: 'Số lượng',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'totalValuation',
        header: 'Giá trị tổn thất',
        cell: (info) => <span className="font-bold text-red-600 dark:text-red-400">-${(info.getValue() as number).toFixed(2)}</span>,
      },
      {
        accessorKey: 'locationHub',
        header: 'Vị trí kho',
      },
      {
        accessorKey: 'loggedDate',
        header: 'Ngày ghi nhận',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            PENDING_APPROVAL: 'Chờ duyệt',
            APPROVED: 'Đã duyệt',
            REJECTED: 'Từ chối',
            PROCESSED: 'Đã hạch toán',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'APPROVED' || status === 'PROCESSED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
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
              onClick={(e) => { e.stopPropagation(); setSelectedIssue(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); alert(`Chỉnh sửa phiếu hủy hàng: ${row.original.issueCode}`); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); confirm(`Bạn có chắc muốn xóa phiếu hủy hàng ${row.original.issueCode}?`); }}
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

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ghi nhận Hủy hàng & Thất thoát (Write-off)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lập biên bản hàng hư hỏng, hết hạn, thất thoát và hạch toán giảm trừ tồn kho. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Tạo phiếu hủy hàng
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
                placeholder="Tìm kiếm theo mã phiếu, tên sản phẩm, SKU hoặc kho..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PENDING_APPROVAL">Chờ duyệt (PENDING APPROVAL)</option>
                <option value="APPROVED">Đã duyệt (APPROVED)</option>
                <option value="REJECTED">Từ chối (REJECTED)</option>
                <option value="PROCESSED">Đã hạch toán (PROCESSED)</option>
              </select>
            </div>

            {(statusFilter !== 'all' || search) && (
              <button
                onClick={() => { setStatusFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedIssue(row)} />
      </div>

      <Drawer
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        title={selectedIssue ? `Chi tiết Hủy hàng: ${selectedIssue.issueCode}` : 'Chi tiết phiếu'}
        width="max-w-lg"
      >
        {selectedIssue && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-red-800 dark:text-red-400 font-semibold uppercase tracking-wider">Tổn thất ước tính</p>
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">${selectedIssue.totalValuation.toFixed(2)}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedIssue.status === 'APPROVED' || selectedIssue.status === 'PROCESSED' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedIssue.status === 'PENDING_APPROVAL' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedIssue.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Vị trí lưu kho
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedIssue.locationHub}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Ngày lập phiếu
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedIssue.loggedDate}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Sản phẩm:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedIssue.productName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Mã SKU:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedIssue.sku}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Lý do thất thoát:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedIssue.reason}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Số lượng hủy:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedIssue.quantity} đơn vị</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Người phê duyệt:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedIssue.authorizedBy}</span>
              </div>

              {selectedIssue.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú & Biên bản</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedIssue.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedIssue.status === 'PENDING_APPROVAL' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Phê duyệt & Hạch toán giảm
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <FileText className="w-4 h-4 inline mr-1" /> In biên bản hủy
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
