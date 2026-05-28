import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Scale, CheckCircle2, Sliders, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import type { ColumnDef } from '@tanstack/react-table';

interface UnitOfMeasure {
  id: string;
  code: string;
  unitName: string;
  type: 'WEIGHT' | 'DIMENSION' | 'QUANTITY' | 'VOLUME' | 'PACKAGING';
  conversionFactor: number;
  baseUnitCode: string;
  assignedSkusCount: number;
  status: 'ACTIVE' | 'DEPRECATED';
  precisionDecimals: number;
  notes?: string;
}

const MOCK_UNITS: UnitOfMeasure[] = [
  { id: '1', code: 'PCS', unitName: 'Pieces / Single Unit', type: 'QUANTITY', conversionFactor: 1.0, baseUnitCode: 'PCS', assignedSkusCount: 14200, status: 'ACTIVE', precisionDecimals: 0, notes: 'Standard fundamental unit for all discrete packaged goods.' },
  { id: '2', code: 'BOX-12', unitName: 'Standard Box of 12', type: 'PACKAGING', conversionFactor: 12.0, baseUnitCode: 'PCS', assignedSkusCount: 350, status: 'ACTIVE', precisionDecimals: 0, notes: 'Wholesale carton bundle containing exactly 12 single items.' },
  { id: '3', code: 'KG', unitName: 'Kilogram (Metric)', type: 'WEIGHT', conversionFactor: 1.0, baseUnitCode: 'KG', assignedSkusCount: 890, status: 'ACTIVE', precisionDecimals: 3, notes: 'Used for loose fresh produce, bakery ingredients, and bulk coffee.' },
  { id: '4', code: 'LBS', unitName: 'Pound (Imperial)', type: 'WEIGHT', conversionFactor: 0.453592, baseUnitCode: 'KG', assignedSkusCount: 45, status: 'DEPRECATED', precisionDecimals: 2, notes: 'Deprecated in favor of standard metric KG across all stores.' },
];

export function UnitsPage() {
  const [data] = useState<UnitOfMeasure[]>(MOCK_UNITS);
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<UnitOfMeasure | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.unitName.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = useMemo<ColumnDef<UnitOfMeasure>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Mã đơn vị',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'unitName',
        header: 'Tên đơn vị',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'type',
        header: 'Loại đo lường',
        cell: (info) => <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-semibold">{String(info.getValue())}</span>,
      },
      {
        accessorKey: 'conversionFactor',
        header: 'Tỷ lệ quy đổi',
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.conversionFactor} <span className="text-gray-400">× {row.original.baseUnitCode}</span>
          </span>
        ),
      },
      {
        accessorKey: 'assignedSkusCount',
        header: 'Số lượng sản phẩm',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{info.getValue() as number} mục</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
            }`}>
              {status === 'ACTIVE' ? 'Hoạt động' : 'Đã ngừng'}
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
              onClick={(e) => { e.stopPropagation(); setSelectedUnit(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); alert(`Chỉnh sửa đơn vị: ${row.original.unitName}`); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); confirm(`Bạn có chắc muốn xóa đơn vị ${row.original.unitName}?`); }}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đơn vị Đo lường & Quy đổi</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cấu hình các đơn vị kiểm đếm tồn kho cơ bản, tỷ lệ đóng gói sỉ và quy đổi hệ đo lường. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Thêm đơn vị
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
                placeholder="Tìm kiếm theo mã đơn vị, tên hoặc loại..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Trạng thái đơn vị:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="DEPRECATED">Ngưng sử dụng (DEPRECATED)</option>
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

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedUnit(row)} />
      </div>

      <Drawer
        isOpen={!!selectedUnit}
        onClose={() => setSelectedUnit(null)}
        title={selectedUnit ? `Unit Spec: ${selectedUnit.code}` : 'Unit Details'}
        width="max-w-lg"
      >
        {selectedUnit && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">{selectedUnit.type} Unit</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedUnit.unitName}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedUnit.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
              }`}>
                {selectedUnit.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Conversion Ratio
                </div>
                <p className="text-base font-mono font-bold text-gray-900 dark:text-white truncate">
                  {selectedUnit.conversionFactor} × {selectedUnit.baseUnitCode}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Decimal Precision
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedUnit.precisionDecimals} decimal places</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Assigned SKU Inventory:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedUnit.assignedSkusCount} products</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Base Anchor Unit:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedUnit.baseUnitCode}</span>
              </div>

              {selectedUnit.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Counting Rules & Notes</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedUnit.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedUnit.status !== 'ACTIVE' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Restore Active Unit
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm w-full">
                View SKU Usage Matrix
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
