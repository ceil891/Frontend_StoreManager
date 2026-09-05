import { Modal } from '@/shared/components/ui/Modal';
import React, { useMemo, useState, useEffect } from 'react';
import {
  Plus,
  Download,
  Search,
  Eye,
  Scale,
  Edit,
  Trash2,
  X,
  List,
  Layers,
  ArrowRight,
  Sparkles,
  ChevronRight,
  GitBranch,
  FolderTree,
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type UnitOfMeasure } from '@/features/inventory/store/inventoryStore';

export function UnitsPage() {
  const { unitsList, fetchUnits, products, fetchProducts, addUnit, updateUnit, deleteUnit } = useInventoryStore();
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
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
    fetchProducts();
    fetchUnits(statusFilter === 'all' || statusFilter === 'DELETED');
  }, [fetchUnits, fetchProducts, statusFilter]);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await addUnit({
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
        toast.success('Đã thêm đơn vị tính mới thành công!');
      } else if (editingId) {
        await updateUnit(editingId, {
          code: unitCode,
          unitName,
          type: unitType,
          conversionFactor,
          baseUnitCode: baseUnitCode || unitCode,
          status,
          precisionDecimals,
          notes,
        });
        toast.success('Đã cập nhật đơn vị tính thành công!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Lỗi khi lưu đơn vị:', err);
      toast.error('Lỗi khi lưu đơn vị tính: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
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
        cell: (info) => <span className="font-mono font-bold text-primary hover:underline">{info.getValue() as string}</span>,
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
            AREA: 'Diện tích',
          };
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              {typeMap[typeVal] || typeVal}
            </span>
          );
        },
      },
      {
        accessorKey: 'conversionFactor',
        header: 'Quy đổi',
        cell: ({ row }) => (
          <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
            1 {row.original.code} = {row.original.conversionFactor} {row.original.baseUnitCode || row.original.code}
          </span>
        ),
      },
      {
        accessorKey: 'assignedSkusCount',
        header: 'Sản phẩm áp dụng',
        cell: (info) => (
          <span className="font-medium text-gray-900 dark:text-white">
            {((info.getValue() as number) || 0).toLocaleString('vi-VN')} SKU
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const statusVal = info.getValue() as string;
          const map: Record<string, { label: string; class: string }> = {
            ACTIVE: { label: 'Đang sử dụng', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
            DEPRECATED: { label: 'Ngừng sử dụng', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
            DELETED: { label: 'Đã xóa', class: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
          };
          const badge = map[statusVal] || { label: statusVal, class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.class}`}>
              {badge.label}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const isDeleted = row.original.status === 'DELETED';
          const isActive = row.original.status === 'ACTIVE';
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedUnit(row.original); }}
                title="Xem chi tiết"
                className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
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
                      toast.error(`Không thể xóa đơn vị "${row.original.code}" vì đang hoạt động. Vui lòng tắt hoạt động trước khi xóa.`);
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đơn vị đo lường & quy đổi</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cấu hình các đơn vị kiểm đếm tồn kho cơ bản, tỷ lệ đóng gói sỉ và quy đổi hệ đo lường</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <List className="w-3.5 h-3.5" /> Dạng bảng
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'tree'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" /> Sơ đồ cây phân cấp
              </button>
            </div>

            <button className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs font-semibold shadow-sm cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Xuất Excel
            </button>
            <button
              onClick={() => {
                setUnitCode(`UNT-${Math.floor(100 + Math.random() * 900)}`);
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
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors text-xs font-bold shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm mới đơn vị
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
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Trạng thái đơn vị:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatusFilter(val);
                  fetchUnits(val === 'all' || val === 'DELETED');
                }}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang sử dụng</option>
                <option value="DEPRECATED">Ngừng sử dụng</option>
                <option value="DELETED">Đã xóa</option>
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

        {viewMode === 'table' ? (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedUnit(row)} />
        ) : (
          /* ── HIERARCHICAL TREE VIEW ────────────────────────────── */
          <div className="space-y-6">
            <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  Sơ đồ cây phân cấp Đơn vị tính nhiều tầng (Hierarchical Tree)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Mỗi nhóm đo lường được tổ chức theo cấp bậc quy đổi từ Đơn vị gốc (Cấp 1) đến Đơn vị bán sỉ/đóng gói lớn hơn (Cấp 2, Cấp 3, Cấp 4).
                </p>
              </div>
            </div>

            {/* Render Groups */}
            {['QUANTITY', 'WEIGHT', 'VOLUME', 'LENGTH', 'AREA'].map((typeKey) => {
              const groupUnits = filtered
                .filter((u) => (u.type || 'QUANTITY') === typeKey)
                .sort((a, b) => (a.conversionFactor || 1) - (b.conversionFactor || 1));

              if (groupUnits.length === 0) return null;

              const typeTitleMap: Record<string, string> = {
                QUANTITY: 'Số lượng & Đóng gói (Lon, Lốc, Thùng, Hộp, Vỉ, Kiện...)',
                WEIGHT: 'Khối lượng & Trọng lượng (Gram, Kg, Yến, Tạ, Tấn...)',
                VOLUME: 'Thể tích & Dung tích (ml, Lít, Chai, Can, Phuy...)',
                LENGTH: 'Chiều dài & Kích thước (mm, cm, Mét, Cuộn...)',
                AREA: 'Diện tích (m², Tấm, Kiện...)',
              };

              return (
                <div
                  key={typeKey}
                  className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-primary" />
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                        {typeTitleMap[typeKey] || typeKey}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {groupUnits.length} đơn vị
                      </span>
                    </div>
                  </div>

                  {/* Multi-Tier Tree Chain Flow */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-1">
                    {groupUnits.map((unit, idx) => {
                      const isBase = unit.conversionFactor === 1 || !unit.baseUnitCode || unit.baseUnitCode === unit.code;
                      const level = isBase ? 1 : idx + 1;

                      return (
                        <div
                          key={unit.id}
                          onClick={() => setSelectedUnit(unit)}
                          className="relative p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                  isBase
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                                }`}
                              >
                                {isBase ? 'Cấp 1: ĐVT Gốc' : `Cấp ${level}: Quy đổi`}
                              </span>

                              <span
                                className={`w-2 h-2 rounded-full ${
                                  unit.status === 'ACTIVE'
                                    ? 'bg-emerald-500'
                                    : unit.status === 'DEPRECATED'
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                title={unit.status}
                              />
                            </div>

                            <h5 className="font-bold text-gray-900 dark:text-white text-base mt-2.5">
                              {unit.unitName}
                            </h5>
                            <p className="font-mono text-xs text-primary font-semibold">{unit.code}</p>

                            <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
                              <p className="text-[11px] text-gray-400 font-medium">Công thức quy đổi:</p>
                              <p className="font-mono font-bold text-gray-900 dark:text-white mt-0.5">
                                1 {unit.code} = {unit.conversionFactor} {unit.baseUnitCode || unit.code}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs text-gray-500">
                            <span>{(unit.assignedSkusCount || 0).toLocaleString('vi-VN')} SKU</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingId(unit.id);
                                  setUnitCode(unit.code);
                                  setUnitName(unit.unitName);
                                  setUnitType(unit.type);
                                  setConversionFactor(unit.conversionFactor);
                                  setBaseUnitCode(unit.baseUnitCode || unit.code);
                                  setPrecisionDecimals(unit.precisionDecimals);
                                  setStatus(unit.status as any);
                                  setNotes(unit.notes || '');
                                  setModalMode('edit');
                                  setIsModalOpen(true);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                title="Sửa"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      <Modal
        isOpen={!!selectedUnit}
        onClose={() => setSelectedUnit(null)}
        title={selectedUnit ? `Chi tiết đơn vị: ${selectedUnit.code}` : 'Thông tin đơn vị tính'}
        width="max-w-lg"
      >
        {selectedUnit && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">{selectedUnit.unitName}</h3>
                  <p className="text-xs text-primary font-mono font-medium">{selectedUnit.code}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedUnit.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedUnit.status === 'DEPRECATED' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedUnit.status === 'ACTIVE' ? 'Đang sử dụng' : selectedUnit.status === 'DEPRECATED' ? 'Ngừng sử dụng' : 'Đã xóa'}
              </span>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Loại đo lường</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedUnit.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Công thức quy đổi</span>
                <span className="font-mono font-semibold text-primary">
                  1 {selectedUnit.code} = {selectedUnit.conversionFactor} {selectedUnit.baseUnitCode || selectedUnit.code}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Số chữ số thập phân</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedUnit.precisionDecimals}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Số lượng SKU áp dụng</span>
                <span className="font-semibold text-gray-900 dark:text-white">{(selectedUnit.assignedSkusCount || 0).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 dark:text-gray-400">Ghi chú</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedUnit.notes || 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setSelectedUnit(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm mới đơn vị đo lường' : 'Chỉnh sửa đơn vị đo lường'}
        width="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã đơn vị *</label>
                <input
                  type="text"
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                  placeholder="Ví dụ: KG, HOP, CHAI..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên đơn vị *</label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                  placeholder="Ví dụ: Kilogram, Hộp, Thùng..."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại đo lường</label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value as any)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="QUANTITY">Số lượng</option>
                  <option value="WEIGHT">Trọng lượng</option>
                  <option value="VOLUME">Thể tích</option>
                  <option value="LENGTH">Chiều dài</option>
                  <option value="AREA">Diện tích</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái hoạt động</label>
                <select
                  value={status || 'ACTIVE'}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="ACTIVE">Đang sử dụng</option>
                  <option value="DEPRECATED">Ngừng sử dụng</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn vị cơ sở quy đổi</label>
              <input
                type="text"
                value={baseUnitCode}
                onChange={(e) => setBaseUnitCode(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                placeholder="Ví dụ: G (nếu quy đổi sang Gram)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hệ số quy đổi *</label>
                <input
                  type="number"
                  step="any"
                  min="0.000001"
                  value={conversionFactor}
                  onChange={(e) => setConversionFactor(parseFloat(e.target.value) || 1)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số chữ số thập phân (0 - 6)</label>
                <input
                  type="number"
                  min={0}
                  max={6}
                  value={precisionDecimals}
                  onChange={(e) => setPrecisionDecimals(parseInt(e.target.value) || 0)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary text-sm"
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
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              {modalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
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
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={async () => {
                if (deletingUnit) {
                  if (deletingUnit.status === 'ACTIVE') {
                    toast.error(`Đơn vị "${deletingUnit.unitName}" đang ở trạng thái hoạt động. Vui lòng chuyển sang ngừng sử dụng trước khi xóa!`);
                    setDeletingUnit(null);
                    return;
                  }
                  try {
                    await deleteUnit(deletingUnit.id);
                    toast.success(`Đã xóa đơn vị "${deletingUnit.unitName}" thành công!`);
                  } catch (err: any) {
                    console.error('Lỗi khi xóa đơn vị:', err);
                    toast.error('Không thể xóa đơn vị tính: ' + (err?.response?.data?.message || err?.message || 'Đang được sản phẩm liên kết'));
                  }
                  setDeletingUnit(null);
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              Đồng ý xóa
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
