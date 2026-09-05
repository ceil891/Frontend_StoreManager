import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import { useMemo, useState, useEffect } from 'react';
import { 
  Plus, Search, Eye, Edit, Trash2, Thermometer, Layers, Warehouse, 
  CheckCircle2, XCircle, HelpCircle, Package, RefreshCw, AlertTriangle, 
  Activity 
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type WarehouseZoneRecord } from '@/features/inventory/store/inventoryStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import { toast } from 'sonner';

export function WarehouseZonesPage() {
  const { 
    warehouseZones, 
    fetchWarehouseZones, 
    addWarehouseZone, 
    updateWarehouseZone, 
    deleteWarehouseZone 
  } = useInventoryStore();

  const { branches, fetchBranches } = useBranchStore();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WarehouseZoneRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<WarehouseZoneRecord>>({});
  
  // Custom states for validation & UX
  const [codeStatus, setCodeStatus] = useState<'valid' | 'duplicate' | 'empty'>('empty');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchWarehouseZones();
    fetchBranches();
  }, [fetchWarehouseZones, fetchBranches]);

  // Realtime Code Validation
  useEffect(() => {
    const code = editingItem.zoneCode?.trim();
    if (!code) {
      setCodeStatus('empty');
      return;
    }
    const isDuplicate = warehouseZones.some(
      (z) => z.zoneCode.toLowerCase() === code.toLowerCase() && z.id !== editingItem.id
    );
    setCodeStatus(isDuplicate ? 'duplicate' : 'valid');
  }, [editingItem.zoneCode, warehouseZones, editingItem.id]);

  const filtered = useMemo(() => {
    if (!search) return warehouseZones;
    const q = search.toLowerCase();
    return warehouseZones.filter(
      (d) =>
        d.zoneCode.toLowerCase().includes(q) ||
        d.zoneName.toLowerCase().includes(q) ||
        (d.branchName && d.branchName.toLowerCase().includes(q))
    );
  }, [search, warehouseZones]);

  // Generate code automatically
  const handleAutoGenerateCode = () => {
    if (isSaving) return;
    const prefix = 'ZONE-';
    let nextNum = warehouseZones.length + 1;
    let code = `${prefix}${String.fromCharCode(65 + (nextNum % 26))}${String(nextNum).padStart(2, '0')}`;
    while (warehouseZones.some(z => z.zoneCode === code)) {
      nextNum++;
      code = `${prefix}${String.fromCharCode(65 + (nextNum % 26))}${String(nextNum).padStart(2, '0')}`;
    }
    setEditingItem(prev => ({ ...prev, zoneCode: code }));
    toast.success(`Đã tự động tạo mã phân khu: ${code}`);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    const firstBranch = branches[0];
    setEditingItem({
      zoneCode: '',
      zoneName: '',
      condition: 'Nhiệt độ thường (25-30°C)',
      capacity: 100,
      branchId: firstBranch?.id ? String(firstBranch.id) : undefined,
      branchName: firstBranch?.name || '',
      status: 'ACTIVE',
      description: '',
      zoneType: 'STORAGE_RACK',
      priority: 'MEDIUM',
      allowImport: true,
      allowExport: true,
      allowExpired: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: WarehouseZoneRecord) => {
    setModalMode('edit');
    // Map status tiếng Việt về tiếng Anh tương ứng
    let englishStatus: any = 'ACTIVE';
    if (item.status === 'HOẠT_ĐỘNG' || item.status === 'ACTIVE') {
      englishStatus = 'ACTIVE';
    } else if (item.status === 'TẠM_NGƯNG' || item.status === 'INACTIVE') {
      englishStatus = 'INACTIVE';
    } else if (item.status === 'MAINTENANCE') {
      englishStatus = 'MAINTENANCE';
    }

    const matchedBranch = branches.find((b) => b.name === item.branchName || String(b.id) === item.branchId);

    setEditingItem({
      ...item,
      branchId: item.branchId || (matchedBranch ? String(matchedBranch.id) : undefined),
      status: englishStatus,
      zoneType: item.zoneType || 'STORAGE_RACK',
      priority: item.priority || 'MEDIUM',
      allowImport: item.allowImport !== false,
      allowExport: item.allowExport !== false,
      allowExpired: !!item.allowExpired,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.zoneCode?.trim()) {
      toast.error('Vui lòng nhập Mã phân khu kho!');
      return;
    }
    if (!editingItem.zoneName?.trim()) {
      toast.error('Vui lòng nhập Tên phân khu kho!');
      return;
    }
    if (Number(editingItem.capacity) <= 0) {
      toast.error('Sức chứa tối đa (Pallet) phải lớn hơn 0!');
      return;
    }
    if (codeStatus === 'duplicate') {
      toast.error('Mã phân khu đã tồn tại, vui lòng thay đổi!');
      return;
    }

    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        await addWarehouseZone({
          zoneCode: editingItem.zoneCode!,
          zoneName: editingItem.zoneName!,
          condition: editingItem.condition || 'Nhiệt độ thường',
          capacity: Number(editingItem.capacity || 0),
          branchId: editingItem.branchId,
          branchName: editingItem.branchName || '',
          status: editingItem.status || 'ACTIVE',
          description: editingItem.description,
          zoneType: editingItem.zoneType || 'STORAGE_RACK',
          priority: editingItem.priority || 'MEDIUM',
          allowImport: editingItem.allowImport !== false,
          allowExport: editingItem.allowExport !== false,
          allowExpired: !!editingItem.allowExpired,
        });
        toast.success('Đã khai báo phân khu kho mới thành công!');
      } else {
        await updateWarehouseZone(editingItem.id!, {
          zoneCode: editingItem.zoneCode,
          zoneName: editingItem.zoneName,
          condition: editingItem.condition,
          capacity: Number(editingItem.capacity || 0),
          branchId: editingItem.branchId,
          branchName: editingItem.branchName,
          status: editingItem.status,
          description: editingItem.description,
          zoneType: editingItem.zoneType,
          priority: editingItem.priority,
          allowImport: editingItem.allowImport,
          allowExport: editingItem.allowExport,
          allowExpired: editingItem.allowExpired,
        });
        toast.success('Đã cập nhật thông tin phân khu kho!');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Lỗi khi lưu phân khu kho.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndContinue = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editingItem.zoneCode || !editingItem.zoneName) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    if (codeStatus === 'duplicate') {
      toast.error('Mã phân khu đã tồn tại, vui lòng thay đổi!');
      return;
    }

    setIsSaving(true);
    try {
      await addWarehouseZone({
        zoneCode: editingItem.zoneCode!,
        zoneName: editingItem.zoneName!,
        condition: editingItem.condition || 'Nhiệt độ thường',
        capacity: Number(editingItem.capacity || 0),
        branchName: editingItem.branchName || 'Main Flagship / HQ',
        status: editingItem.status || 'ACTIVE',
        description: editingItem.description,
        zoneType: editingItem.zoneType || 'STORAGE_RACK',
        priority: editingItem.priority || 'MEDIUM',
        allowImport: editingItem.allowImport !== false,
        allowExport: editingItem.allowExport !== false,
        allowExpired: !!editingItem.allowExpired,
      });
      toast.success(`Đã tạo thành công phân khu ${editingItem.zoneCode}!`);
      
      // Auto-generate next code for quick insertion
      const prefix = 'ZONE-';
      let nextNum = warehouseZones.length + 2; // +2 because list was updated
      let nextCode = `${prefix}${String.fromCharCode(65 + (nextNum % 26))}${String(nextNum).padStart(2, '0')}`;
      while (warehouseZones.some(z => z.zoneCode === nextCode) || nextCode === editingItem.zoneCode) {
        nextNum++;
        nextCode = `${prefix}${String.fromCharCode(65 + (nextNum % 26))}${String(nextNum).padStart(2, '0')}`;
      }

      setEditingItem(prev => ({
        ...prev,
        zoneCode: nextCode,
        zoneName: '',
        description: '',
      }));
    } catch (err) {
      toast.error('Lỗi khi tạo phân khu kho.');
    } finally {
      setIsSaving(false);
    }
  };

  const [deletingItem, setDeletingItem] = useState<WarehouseZoneRecord | null>(null);

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteWarehouseZone(deletingItem.id);
      toast.success(`Đã xóa phân khu kho "${deletingItem.zoneName}".`);
      if (selected?.id === deletingItem.id) setSelected(null);
      setDeletingItem(null);
    } catch (err: any) {
      toast.error('Xóa phân khu kho thất bại: ' + (err?.message || 'Không thể xóa'));
    }
  };

  const columns = useMemo<ColumnDef<WarehouseZoneRecord>[]>(
    () => [
      {
        accessorKey: 'zoneCode',
        header: 'Mã phân khu',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'zoneName',
        header: 'Tên phân khu kho',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'condition',
        header: 'Điều kiện bảo quản',
        cell: (info) => (
          <span className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
            <Thermometer className="w-3.5 h-3.5 text-orange-500" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'capacity',
        header: 'Sức chứa',
        cell: (info) => (
          <span className="font-mono font-bold flex items-center gap-1 text-xs text-gray-900 dark:text-gray-100">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            {(info.getValue() as number) || 0} Pallets
          </span>
        ),
      },
      {
        accessorKey: 'branchName',
        header: 'Chi nhánh',
        cell: (info) => (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Warehouse className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let label = 'Hoạt động';
          let cls = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50';
          if (status === 'INACTIVE' || status === 'TẠM_NGƯNG') {
            label = 'Ngừng sử dụng';
            cls = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50';
          } else if (status === 'MAINTENANCE') {
            label = 'Bảo trì';
            cls = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50';
          }
          return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {label}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelected(row.original)}
              className="p-1 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-450 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingItem(row.original)}
              className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-450 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [warehouseZones]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh sách phân khu kho (Zones)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý và quy hoạch các khu vực phân kho theo chi nhánh, điều kiện bảo quản nhiệt độ và sức chứa.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-semibold text-sm shadow-sm whitespace-nowrap self-start"
        >
          <Plus className="w-4 h-4" /> Thêm Phân Khu Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phân khu, tên phân khu kho, chi nhánh sở hữu..."
          className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      {/* Drawer Xem Chi Tiết */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Phân Khu: ${selected?.zoneCode}`}
      >
        {selected && (
          <div className="space-y-5 text-sm text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Mã phân khu:</span>
                <p className="font-mono font-bold text-emerald-600 mt-0.5 text-base">{selected.zoneCode}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Trạng thái:</span>
                <div className="mt-1">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      selected.status === 'HOẠT_ĐỘNG' || selected.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selected.status === 'MAINTENANCE'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {selected.status === 'HOẠT_ĐỘNG' || selected.status === 'ACTIVE' ? '🟢 Hoạt động' : selected.status === 'MAINTENANCE' ? '🟡 Bảo trì' : '🔴 Ngừng sử dụng'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border-t dark:border-gray-700 pt-3">
              <span className="text-xs text-gray-400 font-semibold uppercase">Tên phân khu kho:</span>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5 text-base">{selected.zoneName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t dark:border-gray-700 pt-3">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Sức chứa tối đa:</span>
                <p className="font-mono font-bold text-gray-900 dark:text-white mt-0.5">{selected.capacity} Pallet</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Chi nhánh sở hữu:</span>
                <p className="text-gray-900 dark:text-white mt-0.5 font-medium">{selected.branchName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t dark:border-gray-700 pt-3">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Loại phân khu:</span>
                <p className="text-gray-900 dark:text-white mt-0.5 font-medium">
                  {selected.zoneType === 'STORAGE_RACK' ? 'Khu lưu trữ kệ hàng' :
                   selected.zoneType === 'STORAGE_FLOOR' ? 'Khu lưu trữ sàn (Bulk)' :
                   selected.zoneType === 'COLD_STORAGE' ? 'Kho đông lạnh' :
                   selected.zoneType === 'INSPECTION_QA' ? 'Khu kiểm hàng QA' :
                   selected.zoneType === 'SHIPPING_GATE' ? 'Khu chờ xuất hàng' :
                   selected.zoneType === 'DEFECTIVE_ZONE' ? 'Khu hàng lỗi / Hủy' :
                   selected.zoneType === 'QUARANTINE' ? 'Khu cách ly hàng hóa' : 'Khu lưu trữ kệ hàng'}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Mức ưu tiên:</span>
                <p className="text-gray-900 dark:text-white mt-0.5 font-bold">
                  {selected.priority === 'HIGH' ? '🔴 Cao' :
                   selected.priority === 'LOW' ? '🔵 Thấp' : '🟡 Trung bình'}
                </p>
              </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-3">
              <span className="text-xs text-gray-400 font-semibold uppercase">Quyền hạn hoạt động:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${selected.allowImport !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                  {selected.allowImport !== false ? '✓' : '✗'} Cho phép nhập
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${selected.allowExport !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                  {selected.allowExport !== false ? '✓' : '✗'} Cho phép xuất
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${selected.allowExpired ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                  {selected.allowExpired ? '✓' : '✗'} Lưu hàng hết hạn
                </span>
              </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-3">
              <span className="text-xs text-gray-400 font-semibold uppercase">Điều kiện bảo quản:</span>
              <p className="text-gray-900 dark:text-white mt-0.5">{selected.condition || selected.conditions}</p>
            </div>

            {selected.description && (
              <div className="border-t dark:border-gray-700 pt-3">
                <span className="text-xs text-gray-400 font-semibold uppercase">Mô tả chi tiết:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-gray-800 dark:text-gray-300 italic mt-1 border dark:border-gray-800">
                  "{selected.description}"
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Thêm/Sửa Phân Khu */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Khai báo phân khu kho mới' : 'Cập nhật thông tin phân khu'}
        size="erp"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm relative">
          {/* Overlay spinner when saving */}
          {isSaving && (
            <div className="absolute inset-0 bg-white/70 dark:bg-gray-950/70 z-50 flex flex-col items-center justify-center rounded-lg">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-350">Đang lưu thông tin...</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Mã phân khu *</label>
                {modalMode === 'create' && (
                  <button
                    type="button"
                    onClick={handleAutoGenerateCode}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                    disabled={isSaving}
                  >
                    [⚡ Tạo mã]
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={editingItem.zoneCode || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, zoneCode: e.target.value.toUpperCase() })}
                  placeholder="Ví dụ: ZONE-A"
                  className={`w-full p-2 border rounded font-mono text-sm bg-white dark:bg-gray-900 dark:border-gray-700 ${
                    codeStatus === 'duplicate' ? 'border-red-500 focus:ring-red-500' :
                    codeStatus === 'valid' ? 'border-emerald-500 focus:ring-emerald-500' : ''
                  }`}
                  required
                  disabled={modalMode === 'edit' || isSaving}
                />
                {modalMode === 'create' && codeStatus === 'duplicate' && (
                  <span className="absolute right-2 top-2.5 text-xs text-red-500 flex items-center gap-0.5">
                    ❌ Đã tồn tại
                  </span>
                )}
                {modalMode === 'create' && codeStatus === 'valid' && (
                  <span className="absolute right-2 top-2.5 text-xs text-emerald-600 flex items-center gap-0.5">
                    ✓ Mã hợp lệ
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                Sức chứa (Pallets) *
                <span title="Số lượng pallet tối đa có thể chứa trong phân khu này.">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                </span>
              </label>
              <input
                type="number"
                value={editingItem.capacity === 0 ? '' : (editingItem.capacity ?? '')}
                onChange={(e) => {
                  const val = e.target.value.replace(/^0+(?=\d)/, '');
                  setEditingItem({ ...editingItem, capacity: val === '' ? 0 : Number(val) });
                }}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="w-full p-2 border rounded font-mono dark:bg-gray-950 dark:border-gray-700"
                required
                min={1}
                disabled={isSaving}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Tên phân khu kho *</label>
              <span className="text-[10px] text-gray-400">{editingItem.zoneName?.length || 0} / 100 ký tự</span>
            </div>
            <input
              type="text"
              value={editingItem.zoneName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, zoneName: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
              placeholder="Ví dụ: Khu bảo quản hàng đông lạnh"
              required
              maxLength={100}
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Loại phân khu WMS *</label>
              <select
                value={editingItem.zoneType || 'STORAGE_RACK'}
                onChange={(e) => setEditingItem({ ...editingItem, zoneType: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                disabled={isSaving}
              >
                <option value="STORAGE_RACK">Khu lưu trữ kệ hàng</option>
                <option value="STORAGE_FLOOR">Khu lưu trữ sàn (Bulk storage)</option>
                <option value="COLD_STORAGE">Kho đông lạnh</option>
                <option value="INSPECTION_QA">Khu kiểm hàng QA</option>
                <option value="SHIPPING_GATE">Khu chờ xuất hàng</option>
                <option value="DEFECTIVE_ZONE">Khu hàng lỗi / Hủy</option>
                <option value="QUARANTINE">Khu cách ly hàng hóa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                Điều kiện bảo quản *
                <span title="Tiêu chuẩn điều kiện nhiệt độ bảo quản bắt buộc cho khu vực này.">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                </span>
              </label>
              <input
                type="text"
                value={editingItem.condition || ''}
                onChange={(e) => setEditingItem({ ...editingItem, condition: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                placeholder="Ví dụ: Đông lạnh (-18 đến -22°C)"
                required
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Chi nhánh sở hữu *</label>
              <select
                value={editingItem.branchId || (branches.find(b => b.name === editingItem.branchName)?.id) || ''}
                onChange={(e) => {
                  const bId = e.target.value;
                  const bObj = branches.find((b) => String(b.id) === bId);
                  setEditingItem({
                    ...editingItem,
                    branchId: bId,
                    branchName: bObj?.name || '',
                  });
                }}
                className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700 text-sm"
                required
                disabled={isSaving}
              >
                <option value="">-- Chọn chi nhánh --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Trạng thái hoạt động *</label>
              <select
                value={editingItem.status || 'ACTIVE'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                disabled={isSaving}
              >
                <option value="ACTIVE">🟢 Hoạt động</option>
                <option value="MAINTENANCE">🟡 Bảo trì</option>
                <option value="INACTIVE">🔴 Ngừng sử dụng</option>
              </select>
            </div>
          </div>

          {/* Advanced WMS: Priority & Checkboxes */}
          <div className="border-t dark:border-gray-700 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Mức độ ưu tiên lấy hàng</label>
              <div className="flex gap-4 mt-1">
                {['HIGH', 'MEDIUM', 'LOW'].map((p) => (
                  <label key={p} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={(editingItem.priority || 'MEDIUM') === p}
                      onChange={(e) => setEditingItem({ ...editingItem, priority: e.target.value })}
                      disabled={isSaving}
                      className="text-emerald-600"
                    />
                    <span>{p === 'HIGH' ? 'Cao' : p === 'LOW' ? 'Thấp' : 'Trung bình'}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Quyền hạn kho (Putaway & Pick)</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.allowImport !== false}
                    onChange={(e) => setEditingItem({ ...editingItem, allowImport: e.target.checked })}
                    disabled={isSaving}
                    className="rounded text-emerald-600"
                  />
                  <span>Cho phép nhập hàng</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.allowExport !== false}
                    onChange={(e) => setEditingItem({ ...editingItem, allowExport: e.target.checked })}
                    disabled={isSaving}
                    className="rounded text-emerald-600"
                  />
                  <span>Cho phép xuất hàng</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingItem.allowExpired}
                    onChange={(e) => setEditingItem({ ...editingItem, allowExpired: e.target.checked })}
                    disabled={isSaving}
                    className="rounded text-emerald-600"
                  />
                  <span className="text-amber-600 font-medium">Chấp nhận lưu trữ hàng hết hạn</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Mô tả phân khu</label>
              <span className="text-[10px] text-gray-400">{editingItem.description?.length || 0} / 500 ký tự</span>
            </div>
            <textarea
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700 text-xs"
              rows={3}
              maxLength={500}
              placeholder="Nhập ghi chú chi tiết về loại hàng bảo quản hoặc lưu ý..."
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition text-gray-700 dark:text-gray-300 text-xs font-semibold"
              disabled={isSaving}
            >
              Hủy
            </button>
            {modalMode === 'create' && (
              <button
                type="button"
                onClick={handleSaveAndContinue}
                className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition text-xs font-semibold"
                disabled={isSaving}
              >
                Lưu & tạo mới
              </button>
            )}
            <button 
              type="submit" 
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-xs font-semibold shadow-sm"
              disabled={isSaving || codeStatus === 'duplicate'}
            >
              {modalMode === 'create' ? 'Tạo phân khu' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa phân khu kho"
        description={`Cảnh báo: Việc xóa phân khu "${deletingItem?.zoneName}" có thể ảnh hưởng đến các bãi kho, dãy kệ và ô kệ bên trong. Bạn có chắc chắn muốn xóa không?`}
      />
    </div>
  );
}
