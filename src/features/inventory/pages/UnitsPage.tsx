import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Scale, CheckCircle2, Sliders, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type UnitOfMeasure } from '@/features/inventory/store/inventoryStore';

export function UnitsPage() {
  const { unitsList, fetchUnits, addUnit, updateUnit, deleteUnit } = useInventoryStore();
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<UnitOfMeasure | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deletingUnit, setDeletingUnit] = useState<UnitOfMeasure | null>(null);

  // Form states
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitType, setUnitType] = useState<UnitOfMeasure['type']>('QUANTITY');
  const [conversionFactor, setConversionFactor] = useState<number>(1);
  const [baseUnitCode, setBaseUnitCode] = useState('');
  const [precisionDecimals, setPrecisionDecimals] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<UnitOfMeasure['status']>('ACTIVE');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    // Gọi fetchUnits lần đầu, kiểm tra xem statusFilter có cần lấy cả Đã xóa không
    fetchUnits(statusFilter === 'all' || statusFilter === 'DELETED');
  }, [fetchUnits, statusFilter]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      addUnit({
        code: unitCode,
        unitName,
        type: unitType,
        conversionFactor,
        baseUnitCode: baseUnitCode || unitCode,
        status,
        precisionDecimals,
        notes,
        assignedSkusCount: 0,
      });
    } else if (editingId) {
      updateUnit(editingId, {
        code: unitCode,          // BẮT BUỘC — backend @NotBlank unitCode
        unitName,
        type: unitType,
        conversionFactor,
        baseUnitCode: baseUnitCode || unitCode,
        status,
        precisionDecimals,
        notes,
      });
    }
    setIsModalOpen(false);
  };

  const filtered = unitsList.filter((item) => {
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
              status === 'ACTIVE'     ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'DEPRECATED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                                        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 line-through'
            }`}>
              {status === 'ACTIVE' ? 'Hoạt động' : status === 'DEPRECATED' ? 'Đã ngưng' : 'Đã xóa'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const isActive = row.original.status === 'ACTIVE';
          const isDeleted = (row.original as any).isDeleted;
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedUnit(row.original); }}
                title="Xem chi tiết"
                className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
              {/* Nút Sửa — ẩn khi đã xóa */}
              {!isDeleted && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(row.original.id);
                    setUnitCode(row.original.code);
                    setUnitName(row.original.unitName);
                    setUnitType(row.original.type);
                    setConversionFactor(row.original.conversionFactor);
                    setBaseUnitCode(row.original.baseUnitCode || row.original.code);
                    setPrecisionDecimals(row.original.precisionDecimals);
                    setStatus(row.original.status as any);
                    setNotes(row.original.notes || '');
                    setModalMode('edit');
                    setIsModalOpen(true);
                  }}
                  title="Chỉnh sửa"
                  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {/* Nút Xóa:
                  - Ẩn nếu đã xóa rồi
                  - Disable nếu đang ACTIVE (phải tắt hoạt động trước)
              */}
              {!isDeleted && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive) {
                      alert(`❌ Không thể xóa đơn vị "'${row.original.code}'" vì đang HOẠT ĐỘNG.\n\nVui lòng tắt hoạt động trước khi xóa.`);
                      return;
                    }
                    setDeletingUnit(row.original);
                  }}
                  title={isActive ? 'Phải tắt hoạt động trước khi xóa' : 'Xóa đơn vị'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [updateUnit, deleteUnit]
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
            <button
              onClick={() => {
                setUnitCode('');
                setUnitName('');
                setUnitType('QUANTITY');
                setConversionFactor(1);
                setBaseUnitCode('');
                setPrecisionDecimals(0);
                setStatus('ACTIVE');
                setNotes('');
                setEditingId(null);
                setModalMode('create');
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
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
                onChange={(e) => {
                  const val = e.target.value;
                  setStatusFilter(val);
                  // Nếu chọn "Tất cả" hoặc "Đã xóa" → gọi fetchUnits(true) để lấy cả đã xóa từ backend
                  // Nếu chọn "ACTIVE" hoặc "DEPRECATED" → gọi fetchUnits(false)
                  fetchUnits(val === 'all' || val === 'DELETED');
                }}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="DEPRECATED">Ngưng sử dụng (DEPRECATED)</option>
                <option value="DELETED">Đã xóa (DELETED) — Kể cả đã xóa mềm</option>
              </select>
            </div>

            {(statusFilter !== 'all' || search) && (
              <button
                onClick={() => { setStatusFilter('all'); setSearch(''); fetchUnits(true); }}
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

      {/* Modal Thêm / Sửa Đơn vị */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm đơn vị đo lường mới' : 'Cập nhật đơn vị đo lường'}
        width="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Mã đơn vị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value.toUpperCase())}
                placeholder="VD: PCS, BOX, KG"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all font-mono font-bold"
                disabled={modalMode === 'edit'}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Tên đơn vị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="VD: Cái, Hộp, Kilogam"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Loại đo lường
              </label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value as any)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all font-medium"
              >
                <option value="QUANTITY">Đếm số lượng (QUANTITY)</option>
                <option value="WEIGHT">Trọng lượng (WEIGHT)</option>
                <option value="VOLUME">Thể tích (VOLUME)</option>
                <option value="DIMENSION">Kích thước (DIMENSION)</option>
                <option value="PACKAGING">Đóng gói (PACKAGING)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Số thập phân hiển thị
              </label>
              <input
                type="number"
                min={0}
                max={6}
                value={precisionDecimals}
                onChange={(e) => setPrecisionDecimals(parseInt(e.target.value) || 0)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Tỷ lệ quy đổi
              </label>
              <input
                type="number"
                step="any"
                min={0}
                value={conversionFactor}
                onChange={(e) => setConversionFactor(parseFloat(e.target.value) || 1)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Mã đơn vị cơ bản
              </label>
              <input
                type="text"
                value={baseUnitCode}
                onChange={(e) => setBaseUnitCode(e.target.value.toUpperCase())}
                placeholder="Mặc định là chính nó"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all font-medium"
            >
              <option value="ACTIVE">Hoạt động (ACTIVE)</option>
              <option value="DEPRECATED">Ngưng sử dụng (DEPRECATED)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Ghi chú / Mô tả
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập mô tả hoặc quy tắc quy đổi..."
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              {modalMode === 'create' ? 'Tạo mới' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Xác nhận Xóa */}
      <Modal
        isOpen={!!deletingUnit}
        onClose={() => setDeletingUnit(null)}
        title="Xác nhận xóa đơn vị đo lường"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa đơn vị đo lường <strong className="text-gray-900 dark:text-white">{deletingUnit?.unitName} ({deletingUnit?.code})</strong>?
          </p>
          <p className="text-xs text-red-500 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-900">
            Cảnh báo: Hành động này không thể hoàn tác và có thể ảnh hưởng đến các sản phẩm đang liên kết với đơn vị này.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <button
              type="button"
              onClick={() => setDeletingUnit(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-semibold"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                if (deletingUnit) {
                  deleteUnit(deletingUnit.id);
                  setDeletingUnit(null);
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
