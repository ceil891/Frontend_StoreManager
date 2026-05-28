import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Building2, Calendar, FileText, CheckCircle2, RotateCcw, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import type { ColumnDef } from '@tanstack/react-table';

interface ReturnToSupplierItem {
  id: string;
  returnNumber: string; // RTV Number
  grnRefNumber: string; // Original GRN Reference
  supplierName: string;
  dispatchingStore: string;
  returnDate: string;
  returnedItemsCount: number;
  claimValuation: number;
  reason: 'DEFECTIVE_BATCH' | 'WRONG_SPECIFICATION' | 'EXPIRED_ON_ARRIVAL' | 'EXCESS_UNORDERED';
  status: 'PENDING_SUPPLIER_APPROVAL' | 'APPROVED_CREDIT_NOTE' | 'REPLACEMENT_DISPATCHED' | 'REJECTED';
  logisticsCarrier: string;
  trackingNumber?: string;
  filedBy: string;
  notes?: string;
}

const MOCK_SUPPLIER_RETURNS: ReturnToSupplierItem[] = [
  { id: '1', returnNumber: 'RTV-2024-001', grnRefNumber: 'GRN-2024-302', supplierName: 'Apex Premium Packaging', dispatchingStore: 'Central Distribution Warehouse', returnDate: '2024-05-17', returnedItemsCount: 150, claimValuation: 123.00, reason: 'DEFECTIVE_BATCH', status: 'APPROVED_CREDIT_NOTE', logisticsCarrier: 'Internal Freight Express', trackingNumber: 'TRK-90182931', filedBy: 'David Ross', notes: 'Water damaged shopping bags discovered during unloading. Supplier agreed to offset on next invoice.' },
  { id: '2', returnNumber: 'RTV-2024-002', grnRefNumber: 'GRN-2024-280', supplierName: 'Nordic Apparel Mills', dispatchingStore: 'Downtown Branch', returnDate: '2024-05-14', returnedItemsCount: 25, claimValuation: 1250.00, reason: 'WRONG_SPECIFICATION', status: 'REPLACEMENT_DISPATCHED', logisticsCarrier: 'DHL Air Freight', trackingNumber: 'DHL-55219018', filedBy: 'Sarah Jenkins', notes: 'Received size XL labeled as M in wholesale carton #4.' },
  { id: '3', returnNumber: 'RTV-2024-003', grnRefNumber: 'GRN-2024-255', supplierName: 'Omega Hardware Wholesalers', dispatchingStore: 'Northside Store', returnDate: '2024-05-10', returnedItemsCount: 12, claimValuation: 890.00, reason: 'EXCESS_UNORDERED', status: 'PENDING_SUPPLIER_APPROVAL', logisticsCarrier: 'FedEx Ground', trackingNumber: 'FX-00192831', filedBy: 'Michael Chang', notes: 'Extra unbilled units shipped. Returning to avoid inventory discrepancy.' },
];

export function ReturnToSupplierPage() {
  const [data] = useState<ReturnToSupplierItem[]>(MOCK_SUPPLIER_RETURNS);
  const [search, setSearch] = useState('');
  const [selectedRTV, setSelectedRTV] = useState<ReturnToSupplierItem | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.supplierName.toLowerCase().includes(q) ||
        item.returnNumber.toLowerCase().includes(q) ||
        item.grnRefNumber.toLowerCase().includes(q) ||
        item.dispatchingStore.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = useMemo<ColumnDef<ReturnToSupplierItem>[]>(
    () => [
      {
        accessorKey: 'returnNumber',
        header: 'Mã trả hàng (RTV)',
        cell: (info) => <span className="font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'grnRefNumber',
        header: 'Mã GRN gốc',
        cell: (info) => <span className="font-mono text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'dispatchingStore',
        header: 'Kho / Chi nhánh xuất',
      },
      {
        accessorKey: 'returnedItemsCount',
        header: 'Số lượng trả',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'claimValuation',
        header: 'Giá trị yêu cầu',
        cell: (info) => <span className="font-bold text-red-600 dark:text-red-400">${(info.getValue() as number).toFixed(2)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái xử lý',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            PENDING_SUPPLIER_APPROVAL: 'Chờ NCC phản hồi',
            APPROVED_CREDIT_NOTE: 'Đã duyệt bồi hoàn',
            REPLACEMENT_DISPATCHED: 'Đang gửi hàng đổi',
            REJECTED: 'Từ chối',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'APPROVED_CREDIT_NOTE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'REPLACEMENT_DISPATCHED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'PENDING_SUPPLIER_APPROVAL' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
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
              onClick={(e) => { e.stopPropagation(); setSelectedRTV(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); alert(`Chỉnh sửa đơn trả: ${row.original.returnNumber}`); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); confirm(`Bạn có chắc muốn xóa đơn trả hàng ${row.original.returnNumber}?`); }}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trả hàng cho Nhà cung cấp (RTV)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý các đợt hoàn trả hàng lỗi, yêu cầu bồi hoàn và đổi trả sản phẩm. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Tạo đơn trả hàng
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
                placeholder="Tìm kiếm theo mã RTV, mã GRN hoặc nhà cung cấp..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Trạng thái xử lý:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PENDING_SUPPLIER_APPROVAL">Chờ NCC phản hồi (PENDING SUPPLIER APPROVAL)</option>
                <option value="APPROVED_CREDIT_NOTE">Đã duyệt bồi hoàn (APPROVED CREDIT NOTE)</option>
                <option value="REPLACEMENT_DISPATCHED">Đang gửi hàng đổi (REPLACEMENT DISPATCHED)</option>
                <option value="REJECTED">Từ chối (REJECTED)</option>
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

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedRTV(row)} />
      </div>

      <Drawer
        isOpen={!!selectedRTV}
        onClose={() => setSelectedRTV(null)}
        title={selectedRTV ? `Return To Supplier Claim: ${selectedRTV.returnNumber}` : 'RTV Claim Details'}
        width="max-w-lg"
      >
        {selectedRTV && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-amber-800 dark:text-amber-400 font-semibold uppercase tracking-wider">Claim Chargeback Valuation</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">${selectedRTV.claimValuation.toFixed(2)}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedRTV.status === 'APPROVED_CREDIT_NOTE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedRTV.status === 'REPLACEMENT_DISPATCHED' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                selectedRTV.status === 'PENDING_SUPPLIER_APPROVAL' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedRTV.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Target Supplier
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedRTV.supplierName}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Dispatch Date
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedRTV.returnDate}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Original Goods Receipt Ref (GRN):</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedRTV.grnRefNumber}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Dispatching Origin Store:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedRTV.dispatchingStore}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Returned Items:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedRTV.returnedItemsCount} units</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Logistics Carrier & Tracking:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedRTV.logisticsCarrier} {selectedRTV.trackingNumber && <span className="font-mono text-xs text-gray-500">({selectedRTV.trackingNumber})</span>}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Authorized Logistics Officer:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedRTV.filedBy}</span>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">RTV Categorized Reason</span>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 bg-white dark:bg-gray-800 p-2.5 rounded border border-gray-200 dark:border-gray-700">{selectedRTV.reason.replace('_', ' ')}</p>
              </div>

              {selectedRTV.notes && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Chargeback Offset Agreements & Notes</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedRTV.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedRTV.status === 'PENDING_SUPPLIER_APPROVAL' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Log Supplier Credit Note
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <FileText className="w-4 h-4 inline mr-1" /> Print Outbound RTV Cargo Note
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
