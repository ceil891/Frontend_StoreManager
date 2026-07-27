import { useMemo, useState, useEffect } from 'react';
import { 
  Plus, Search, Eye, Edit, Trash2, Grid, Package, CheckCircle2, 
  AlertTriangle, HelpCircle, Layers, Shield, Settings, Info, ShoppingBag, 
  Percent, RefreshCw, Barcode, MapPin, Sliders, Layout, ShieldAlert
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type RackRecord } from '@/features/inventory/store/inventoryStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import { toast } from 'sonner';

export function WarehouseAreasPage() {
  const { 
    racks, 
    fetchRacks, 
    addRack, 
    updateRack, 
    deleteRack, 
    areas, 
    fetchAreas,
    warehouseZones,
    fetchWarehouseZones
  } = useInventoryStore();

  const { branches, fetchBranches } = useBranchStore();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RackRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Custom WMS properties state for form
  const [editingItem, setEditingItem] = useState<Partial<RackRecord & {
    branchId: string;
    zoneId: string;
    heightM: number;
    levels: number;
    baysPerLevel: number;
    statusConfig: 'ACTIVE' | 'FULL' | 'MAINTENANCE' | 'LOCKED' | 'INACTIVE';
    allowFood: boolean;
    allowCosmetics: boolean;
    allowElectronics: boolean;
    allowChemicals: boolean;
    allowHazmat: boolean;
  }>>({});

  // Local UX states
  const [codeStatus, setCodeStatus] = useState<'valid' | 'duplicate' | 'empty' | 'invalid_format'>('empty');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRacks();
    fetchAreas();
    fetchWarehouseZones();
    fetchBranches();
  }, [fetchRacks, fetchAreas, fetchWarehouseZones, fetchBranches]);

  // Hierarchical Filtered Options for Form
  const filteredZones = useMemo(() => {
    if (!editingItem.branchId) return warehouseZones;
    // Find branch code/name to filter
    const selectedBranch = branches.find(b => String(b.id) === editingItem.branchId);
    if (!selectedBranch) return warehouseZones;
    return warehouseZones.filter(z => z.branchName === selectedBranch.name);
  }, [editingItem.branchId, warehouseZones, branches]);

  const filteredAreas = useMemo(() => {
    if (!editingItem.zoneId) return areas;
    const selectedZone = warehouseZones.find(z => String(z.id) === editingItem.zoneId);
    if (!selectedZone) return areas;
    return areas.filter(a => a.zoneCode === selectedZone.zoneCode);
  }, [editingItem.zoneId, areas, warehouseZones]);

  // Realtime Code Validation & Formatting
  useEffect(() => {
    const code = editingItem.rackCode?.trim();
    if (!code) {
      setCodeStatus('empty');
      return;
    }
    // Simple format check (e.g. must start with RACK- or ZONE- prefix)
    const formatRegex = /^[A-Z0-9_-]{3,15}$/;
    if (!formatRegex.test(code)) {
      setCodeStatus('invalid_format');
      return;
    }
    const isDuplicate = racks.some(
      (r) => r.rackCode.toLowerCase() === code.toLowerCase() && r.id !== editingItem.id
    );
    setCodeStatus(isDuplicate ? 'duplicate' : 'valid');
  }, [editingItem.rackCode, racks, editingItem.id]);

  const filtered = useMemo(() => {
    if (!search) return racks;
    const q = search.toLowerCase();
    return racks.filter(
      (d) =>
        d.rackCode.toLowerCase().includes(q) ||
        d.rackName.toLowerCase().includes(q) ||
        (d.areaName && d.areaName.toLowerCase().includes(q)) ||
        (d.zoneCode && d.zoneCode.toLowerCase().includes(q)) ||
        (d.branchName && d.branchName.toLowerCase().includes(q))
    );
  }, [search, racks]);

  // Generate code automatically based on selected zone
  const handleAutoGenerateCode = () => {
    if (isSaving) return;
    let prefix = 'RACK-';
    if (editingItem.zoneId) {
      const zone = warehouseZones.find(z => String(z.id) === editingItem.zoneId);
      if (zone) {
        prefix = `RACK-${zone.zoneCode.replace('ZONE-', '')}`;
      }
    }
    
    let nextNum = 1;
    let code = `${prefix}${String(nextNum).padStart(2, '0')}`;
    while (racks.some(r => r.rackCode === code)) {
      nextNum++;
      code = `${prefix}${String(nextNum).padStart(2, '0')}`;
    }
    setEditingItem(prev => ({ ...prev, rackCode: code }));
    toast.success(`Đã sinh mã kệ WMS tự động: ${code}`);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      rackCode: '',
      rackName: '',
      branchId: branches[0]?.id ? String(branches[0].id) : '',
      zoneId: warehouseZones[0]?.id ? String(warehouseZones[0].id) : '',
      areaId: areas[0]?.id || '',
      maxWeightKg: 1000,
      maxVolumeM3: 5,
      maxPallet: 4,
      heightM: 3.5,
      levels: 4,
      baysPerLevel: 5,
      statusConfig: 'ACTIVE',
      allowFood: true,
      allowCosmetics: true,
      allowElectronics: true,
      allowChemicals: false,
      allowHazmat: false,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RackRecord) => {
    setModalMode('edit');
    // Map existing properties and default mock values
    const zone = warehouseZones.find(z => z.zoneCode === item.zoneCode);
    const branch = branches.find(b => b.name === item.branchName);
    
    setEditingItem({
      ...item,
      branchId: branch ? String(branch.id) : '',
      zoneId: zone ? String(zone.id) : '',
      heightM: 3.5,
      levels: 4,
      baysPerLevel: 6,
      statusConfig: item.isActive !== false ? 'ACTIVE' : 'LOCKED',
      allowFood: true,
      allowCosmetics: true,
      allowElectronics: true,
      allowChemicals: false,
      allowHazmat: false,
    });
    setIsModalOpen(true);
  };

  const executeSave = async (payload: any) => {
    if (modalMode === 'create') {
      await addRack(payload);
    } else {
      await updateRack(editingItem.id!, payload);
    }
  };

  const handleSave = async (e: React.FormEvent, createAnother = false) => {
    e.preventDefault();
    if (!editingItem.rackCode || !editingItem.rackName || !editingItem.areaId) return;
    if (codeStatus === 'duplicate') {
      toast.error('Mã kệ hàng đã tồn tại!');
      return;
    }

    setIsSaving(true);
    const payload = {
      rackCode: editingItem.rackCode.toUpperCase(),
      rackName: editingItem.rackName,
      areaId: editingItem.areaId,
      maxWeightKg: Number(editingItem.maxWeightKg || 0),
      maxVolumeM3: Number(editingItem.maxVolumeM3 || 0),
      maxPallet: Number(editingItem.maxPallet || 0),
      isActive: editingItem.statusConfig === 'ACTIVE' || editingItem.statusConfig === 'FULL',
      description: editingItem.description || '',
    };

    try {
      await executeSave(payload);
      toast.success(
        modalMode === 'create'
          ? `Đã cẩu đặt kệ hàng ${payload.rackCode} thành công!`
          : `Đã cập nhật cấu hình kệ ${payload.rackCode}!`
      );
      
      if (createAnother && modalMode === 'create') {
        // Reset form but keep location parameters
        setEditingItem(prev => ({
          ...prev,
          rackCode: '',
          rackName: '',
          maxWeightKg: 1000,
          maxVolumeM3: 5,
          maxPallet: 4,
          description: '',
        }));
      } else {
        setIsModalOpen(false);
      }
    } catch (err) {
      toast.error('Lỗi khi đồng bộ cấu trúc bãi kệ.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Cảnh báo: Việc xóa dãy kệ có thể làm mất định vị các ô kệ (Bins) bên trong. Bạn chắc chắn dỡ bỏ kệ hàng này?')) {
      try {
        await deleteRack(id);
        toast.success('Đã dỡ bỏ kệ hàng và giải phóng vị trí.');
      } catch (err) {
        toast.error('Dỡ bỏ kệ hàng thất bại.');
      }
    }
  };

  const columns = useMemo<ColumnDef<RackRecord>[]>(
    () => [
      {
        accessorKey: 'rackCode',
        header: 'Mã kệ WMS',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-450">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'rackName',
        header: 'Tên kệ hàng',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'areaName',
        header: 'Khu vực bãi (Area)',
        cell: (info) => <span className="font-semibold text-blue-600 dark:text-blue-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'parentZoneCode',
        header: 'Thuộc Khu vực kho',
        cell: (info) => <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{info.getValue() as string || 'ZONE-A'}</span>,
      },
      {
        accessorKey: 'branchName',
        header: 'Chi nhánh',
        cell: (info) => <span className="text-gray-500 text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'maxPallet',
        header: 'Pallets tối đa',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-gray-150">{info.getValue() as number} Pallets</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Vận hành',
        cell: (info) => {
          const active = info.getValue() as boolean;
          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                active 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50' 
                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {active ? 'Hoạt động' : 'Tạm khóa'}
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
              className="p-1 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Sửa cấu hình"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Xóa kệ"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [racks]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layout className="w-6 h-6 text-emerald-600" />
            Hệ thống kệ hàng WMS (Racks)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Thiết lập sơ đồ vật lý, quy tắc ngành hàng và giới hạn tải trọng của các dãy kệ hàng (Racks) trong kho.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-semibold text-sm shadow-sm whitespace-nowrap self-start animate-fade-in"
        >
          <Plus className="w-4 h-4" /> Khai Báo Kệ Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo mã kệ, tên kệ hàng, bãi kho, zone hoặc chi nhánh..."
          className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      {/* Drawer: Chi tiết Kệ Hàng */}
      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Kệ Hàng: ${selected?.rackCode}`}
        width="max-w-md"
      >
        {selected && (
          <div className="space-y-5 text-sm text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Mã kệ hàng:</span>
                <p className="font-mono font-bold text-emerald-600 mt-0.5 text-base">{selected.rackCode}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Trạng thái WMS:</span>
                <div className="mt-1">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      selected.isActive !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {selected.isActive !== false ? '🟢 Hoạt động' : '🔴 Tạm khóa'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t dark:border-gray-800 pt-3">
              <span className="text-xs text-gray-400 font-bold uppercase">Tên kệ hàng:</span>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5 text-base">{selected.rackName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t dark:border-gray-800 pt-3">
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Bãi kho (Area):</span>
                <p className="font-bold text-gray-905 dark:text-white mt-0.5">{selected.areaName}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Phân khu kho (Zone):</span>
                <p className="text-gray-900 dark:text-white mt-0.5 font-bold font-mono">{selected.zoneCode || 'ZONE-A'}</p>
              </div>
            </div>

            <div className="border-t dark:border-gray-800 pt-3">
              <span className="text-xs text-gray-400 font-bold uppercase">Chi nhánh trực thuộc:</span>
              <p className="text-gray-900 dark:text-white mt-0.5 font-medium">{selected.branchName}</p>
            </div>

            {/* Visual Storage Statistics */}
            <div className="border-t dark:border-gray-800 pt-3 space-y-2">
              <span className="text-xs text-gray-400 font-bold uppercase">Hiệu suất sử dụng:</span>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800 space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Tải trọng (Max: {selected.maxWeightKg} kg):</span>
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-250">250 kg (25%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Pallet (Max: {selected.maxPallet} Pallets):</span>
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-250">1 Pallet (25%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* WMS Stats Panel */}
            <div className="border-t dark:border-gray-800 pt-3 space-y-2">
              <span className="text-xs text-gray-400 font-bold uppercase">📦 Thống kê Rack chi tiết</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 rounded border border-blue-100 dark:border-blue-900/40">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Số lượng ô kệ (Bins)</span>
                  <p className="font-mono font-bold text-sm text-blue-700 dark:text-blue-400 mt-0.5">24 Ô kệ</p>
                </div>
                <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Đang dùng / Trống</span>
                  <p className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">16 / 8 Ô kệ</p>
                </div>
                <div className="p-2.5 bg-purple-50/50 dark:bg-purple-950/20 rounded border border-purple-100 dark:border-purple-900/40">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Số lượng SKU lưu giữ</span>
                  <p className="font-mono font-bold text-sm text-purple-700 dark:text-purple-400 mt-0.5">12 SKU</p>
                </div>
                <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 rounded border border-amber-100 dark:border-amber-900/40">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Tổng tồn / Tạm giữ</span>
                  <p className="font-mono font-bold text-sm text-amber-700 dark:text-amber-400 mt-0.5">1,240 / 120</p>
                </div>
              </div>
            </div>

            {selected.description && (
              <div className="border-t dark:border-gray-800 pt-3">
                <span className="text-xs text-gray-400 font-bold uppercase">Hướng dẫn vận hành & Ghi chú:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-gray-700 dark:text-gray-300 italic mt-1 border border-dashed dark:border-gray-800">
                  "{selected.description}"
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Modal Khai báo kệ hàng */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={modalMode === 'create' ? '📦 Khai báo dãy kệ hàng (Rack) mới' : '⚙️ Cấu hình thông số dãy kệ'}
        width="max-w-2xl"
      >
        <form onSubmit={(e) => handleSave(e, false)} className="space-y-4 text-xs relative max-h-[80vh] overflow-y-auto pr-1">
          {isSaving && (
            <div className="absolute inset-0 bg-white/70 dark:bg-gray-950/70 z-50 flex flex-col items-center justify-center rounded-lg">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Đang đồng bộ cấu trúc bãi kệ...</p>
            </div>
          )}

          {/* Section 1: Thông tin định vị */}
          <div className="p-3.5 bg-gray-50/70 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" /> 1. Thông tin định vị kho bãi
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-550 uppercase mb-1">Chi nhánh *</label>
                <select
                  value={editingItem.branchId || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, branchId: e.target.value, zoneId: '', areaId: '' })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">-- Tất cả Chi nhánh --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-550 uppercase mb-1">Thuộc Phân khu (Zone) *</label>
                <SearchLookupModal
                  title="Chọn Phân Khu Kho (Zone)"
                  iconType="location"
                  placeholder="Chọn Zone..."
                  value={editingItem.zoneId}
                  options={filteredZones.map(z => ({
                    id: z.id,
                    code: z.zoneCode,
                    name: z.zoneName,
                    subtitle: `Kiểu: ${z.zoneType || 'Normal'}`
                  }))}
                  onChange={(val) => setEditingItem(prev => ({ ...prev, zoneId: val, areaId: '' }))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-550 uppercase mb-1">Bãi kho (Area) *</label>
                <SearchLookupModal
                  title="Chọn Bãi Kho (Area)"
                  iconType="location"
                  placeholder="Chọn Area..."
                  value={editingItem.areaId}
                  options={filteredAreas.map(a => ({
                    id: a.id,
                    code: a.areaCode,
                    name: a.areaName,
                  }))}
                  onChange={(val) => setEditingItem(prev => ({ ...prev, areaId: val }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-gray-550 uppercase">Mã kệ hàng (WMS) *</label>
                  {modalMode === 'create' && (
                    <button
                      type="button"
                      onClick={handleAutoGenerateCode}
                      className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                    >
                      [⚡ Sinh mã]
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={editingItem.rackCode || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, rackCode: e.target.value.toUpperCase() })}
                    placeholder="Ví dụ: RACK-A01"
                    className={`w-full p-2 border rounded font-mono text-xs bg-white dark:bg-gray-955 dark:border-gray-700 ${
                      codeStatus === 'duplicate' ? 'border-red-500' : codeStatus === 'valid' ? 'border-emerald-500' : ''
                    }`}
                    required
                    disabled={modalMode === 'edit'}
                  />
                  {modalMode === 'create' && codeStatus === 'duplicate' && (
                    <span className="absolute right-2 top-2 text-[10px] text-red-500 font-bold">❌ Đã tồn tại</span>
                  )}
                  {modalMode === 'create' && codeStatus === 'valid' && (
                    <span className="absolute right-2 top-2 text-[10px] text-emerald-600 font-bold">✓ Mã hợp lệ</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-555 uppercase mb-1">Tên kệ hàng *</label>
                <input
                  type="text"
                  value={editingItem.rackName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, rackName: e.target.value })}
                  placeholder="Kệ hàng điện tử, Kệ bánh kẹo, Kệ mỹ phẩm..."
                  className="w-full p-2 border rounded text-xs dark:bg-gray-955 dark:border-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-555 uppercase mb-1">Trạng thái vận hành *</label>
                <select
                  value={editingItem.statusConfig || 'ACTIVE'}
                  onChange={(e) => setEditingItem({ ...editingItem, statusConfig: e.target.value as any })}
                  className="w-full p-2 border rounded dark:bg-gray-955 dark:border-gray-700 text-xs"
                >
                  <option value="ACTIVE">🟢 Hoạt động (Sẵn sàng)</option>
                  <option value="FULL">🟡 Đầy (FULL)</option>
                  <option value="MAINTENANCE">🟠 Bảo trì kệ</option>
                  <option value="LOCKED">🔴 Tạm khóa</option>
                  <option value="INACTIVE">⚫ Ngừng sử dụng</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Cấu trúc & Sức chứa */}
          <div className="p-3.5 bg-gray-50/70 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-orange-500" /> 2. Cấu hình cấu trúc kệ & Sức chứa
            </h4>

            {/* Structural Parameters */}
            <div className="grid grid-cols-3 gap-3 pb-2 border-b dark:border-gray-800">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Chiều cao dãy kệ (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingItem.heightM || 3.5}
                  onChange={(e) => setEditingItem({ ...editingItem, heightM: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-955 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Số tầng kệ (Levels)</label>
                <input
                  type="number"
                  value={editingItem.levels || 4}
                  onChange={(e) => setEditingItem({ ...editingItem, levels: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-955 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Số ô mỗi tầng (Bays)</label>
                <input
                  type="number"
                  value={editingItem.baysPerLevel || 5}
                  onChange={(e) => setEditingItem({ ...editingItem, baysPerLevel: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-955 dark:border-gray-700"
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 italic">
              💡 Hệ thống sẽ tự động cấu hình sinh ra <strong>{(editingItem.levels || 4) * (editingItem.baysPerLevel || 5)} Ô kệ (Bins)</strong> trực thuộc dãy kệ này.
            </p>

            {/* Capacity Parameters */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Tải trọng tối đa (kg)</label>
                <input
                  type="number"
                  value={editingItem.maxWeightKg || 1000}
                  onChange={(e) => setEditingItem({ ...editingItem, maxWeightKg: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-955 dark:border-gray-700"
                />
                <span className="text-[9px] text-gray-400 block mt-0.5">Ví dụ: 20 thùng × 50kg</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  Thể tích tối đa (m³)
                  <span title="Thể tích chứa hàng: m³ = Dài × Rộng × Cao">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.maxVolumeM3 || 5}
                  onChange={(e) => setEditingItem({ ...editingItem, maxVolumeM3: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-955 dark:border-gray-700"
                />
                <span className="text-[9px] text-gray-400 block mt-0.5">m³ = Dài × Rộng × Cao</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Pallet tối đa</label>
                <input
                  type="number"
                  value={editingItem.maxPallet || 4}
                  onChange={(e) => setEditingItem({ ...editingItem, maxPallet: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-955 dark:border-gray-700"
                />
                <span className="text-[9px] text-gray-400 block mt-0.5">≈ 96 thùng tiêu chuẩn</span>
              </div>
            </div>
          </div>

          {/* Section 3: Quy tắc lưu & Nhóm hàng */}
          <div className="p-3.5 bg-gray-50/70 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-500" /> 3. Quy định lưu trữ ngành hàng
            </h4>

            <div>
              <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Phân quyền chứa ngành hàng:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.allowFood !== false}
                    onChange={(e) => setEditingItem({ ...editingItem, allowFood: e.target.checked })}
                    className="rounded border-gray-350 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Thực phẩm</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.allowCosmetics !== false}
                    onChange={(e) => setEditingItem({ ...editingItem, allowCosmetics: e.target.checked })}
                    className="rounded border-gray-350 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Mỹ phẩm</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.allowElectronics !== false}
                    onChange={(e) => setEditingItem({ ...editingItem, allowElectronics: e.target.checked })}
                    className="rounded border-gray-350 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Điện tử</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingItem.allowChemicals}
                    onChange={(e) => setEditingItem({ ...editingItem, allowChemicals: e.target.checked })}
                    className="rounded border-gray-350 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Hóa chất</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingItem.allowHazmat}
                    onChange={(e) => setEditingItem({ ...editingItem, allowHazmat: e.target.checked })}
                    className="rounded border-gray-350 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-red-500 font-semibold flex items-center gap-0.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Nguy hiểm
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Hướng dẫn vận hành */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">4. Hướng dẫn vận hành kệ & Ghi chú</label>
            <textarea
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              placeholder="Ví dụ: Không xếp quá 4 pallet. Chỉ chứa hàng điện tử. Không để hàng dễ cháy..."
              className="w-full p-2 border rounded dark:bg-gray-955 dark:border-gray-700 text-xs"
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Statistics Block for Edit Mode (Góp ý 11 + 12) */}
          {modalMode === 'edit' && (
            <div className="p-3.5 bg-gray-55 dark:bg-gray-900/60 rounded-xl border dark:border-gray-800 space-y-3.5">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">📊 Thống kê hiện trạng sử dụng</h5>
              
              {/* Progress bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>Độ đầy kệ hàng:</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">70% Đang dùng</span>
                  </div>
                  <div className="w-full bg-gray-250 dark:bg-gray-850 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full rounded-full" style={{ width: '70%' }} />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Bin đã sinh: <strong className="text-gray-900 dark:text-white">28 / 40 Bins</strong></span>
                  <span>Tải trọng: <strong className="text-gray-900 dark:text-white">3,500kg / 5,000kg</strong></span>
                  <span>Mặt hàng lưu: <strong className="text-gray-900 dark:text-white">12 SKU</strong></span>
                </div>
              </div>

              {/* Panel stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t dark:border-gray-800 text-xs">
                <div className="p-2 bg-white dark:bg-gray-955 rounded border dark:border-gray-800">
                  <span className="text-[9px] text-gray-400 font-bold uppercase">Số Bin thực tế</span>
                  <p className="font-bold text-sm text-gray-800 dark:text-gray-200 mt-0.5">40 Bins</p>
                  <p className="text-[9px] text-gray-400">26 Đang dùng | 14 Trống</p>
                </div>
                <div className="p-2 bg-white dark:bg-gray-955 rounded border dark:border-gray-800">
                  <span className="text-[9px] text-gray-400 font-bold uppercase">Tổng sản lượng</span>
                  <p className="font-bold text-sm text-gray-800 dark:text-gray-200 mt-0.5">3,420</p>
                  <p className="text-[9px] text-gray-400">58 SKU lưu kho</p>
                </div>
                <div className="p-2 bg-white dark:bg-gray-955 rounded border dark:border-gray-800">
                  <span className="text-[9px] text-gray-400 font-bold uppercase">Reserved (Tạm giữ)</span>
                  <p className="font-bold text-sm text-amber-600 dark:text-amber-400 mt-0.5">580 sản phẩm</p>
                  <p className="text-[9px] text-gray-400">Chờ nhặt đóng gói</p>
                </div>
                <div className="p-2 bg-white dark:bg-gray-955 rounded border dark:border-gray-800">
                  <span className="text-[9px] text-gray-400 font-bold uppercase">Available (Sẵn sàng)</span>
                  <p className="font-bold text-sm text-emerald-600 dark:text-emerald-450 mt-0.5">2,840 sản phẩm</p>
                  <p className="text-[9px] text-gray-400">Khả dụng xuất bán</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition text-gray-700 dark:text-gray-300 text-xs font-semibold"
              disabled={isSaving}
            >
              Hủy
            </button>
            <div className="flex gap-2">
              {modalMode === 'create' && (
                <button
                  type="button"
                  onClick={(e) => handleSave(e, true)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-250 rounded-lg transition text-xs font-semibold"
                  disabled={isSaving || codeStatus === 'duplicate' || codeStatus === 'invalid_format'}
                >
                  Lưu & Tạo Tiếp
                </button>
              )}
              <button 
                type="submit" 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-xs font-semibold shadow-sm"
                disabled={isSaving || codeStatus === 'duplicate' || codeStatus === 'invalid_format'}
              >
                Lưu kệ hàng
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default WarehouseAreasPage;
