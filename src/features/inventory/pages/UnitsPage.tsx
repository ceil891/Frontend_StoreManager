import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Scale, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
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
        code: unitCode,
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
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.unitName.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      );
    }
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
        cell: (info) => {
          const typeVal = String(info.getValue());
          const typeMap: Record<string, string> = {
            QUANTITY: 'Số lượng',
            WEIGHT: 'Trọng lượng',
            VOLUME: 'Thể tích',
            LENGTH: 'Chiều dài',
          };
          return (
            <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-md font-semibold">
              {typeMap[typeVal] || typeVal}
            </span>
          );
        },
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
          const s = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              s === 'ACTIVE'     ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              s === 'DEPRECATED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                                   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 line-through'
            }`}>
              {s === 'ACTIVE' ? 'Hoạt động' : s === 'DEPRECATED' ? 'Đã ngưng' : 'Đã xóa'}
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
              {!isDeleted && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive) {
                      alert(`❌ Không thể xóa đơn vị "${row.original.code}" vì đang HOẠT ĐỘNG.\n\nVui lòng tắt hoạt động trước khi xóa.`);
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
              <Download className="w-4 h-4" /> Xuất Dữ Liệu
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

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Trạng thái đơn vị:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatusFilter(val);
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

      <Modal
        isOpen={!!selectedUnit}
        onClose={() => setSelectedUnit(null)}
        title={selectedUnit ? `Chi tiết đơn vị: ${selectedUnit.code}` : 'Thông tin đơn vị tính'}
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
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">{selectedUnit.unitName}</h3>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">{selectedUnit.code}</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                selectedUnit.status === 'ACTIVE'     ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                selectedUnit.status === 'DEPRECATED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                                                      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              }`}>
                {selectedUnit.status === 'ACTIVE' ? 'Đang hoạt động' : selectedUnit.status === 'DEPRECATED' ? 'Ngưng sử dụng' : 'Đã xóa'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-xs text-gray-500 block mb-1">Loại đo lường</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{selectedUnit.type}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-xs text-gray-500 block mb-1">Hệ số quy đổi cơ bản</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm font-mono">{selectedUnit.conversionFactor} × {selectedUnit.baseUnitCode}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Đăng ký Đơn vị Đo lường mới' : `Chỉnh sửa Đơn vị: ${unitCode}`}
        width="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Định danh đơn vị</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã đơn vị *</label>
                <input
                  type="text"
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value.toUpperCase())}
                  placeholder="VD: PCS, BOX, KG, L"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên đơn vị *</label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="VD: Cái, Thùng, Hộp, Kilogram"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại đo lường</label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value as UnitOfMeasure['type'])}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="QUANTITY">Số lượng (QUANTITY)</option>
                  <option value="WEIGHT">Trọng lượng (WEIGHT)</option>
                  <option value="VOLUME">Thể tích (VOLUME)</option>
                  <option value="LENGTH">Chiều dài / Kích thước (LENGTH)</option>
                </select>
              </div>
            </div>

            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Quy tắc quy đổi</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hệ số quy đổi *</label>
                <input
                  type="number"
                  step="any"
                  min="0.000001"
                  value={conversionFactor}
                  onChange={(e) => setConversionFactor(parseFloat(e.target.value) || 1)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số chữ số thập phân (0–6)</label>
                <input
                  type="number"
                  min={0}
                  max={6}
                  value={precisionDecimals}
                  onChange={(e) => setPrecisionDecimals(parseInt(e.target.value) || 0)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="erp-form-footer border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-end gap-3">
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
              {modalMode === 'create' ? 'Tạo Mới' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

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
