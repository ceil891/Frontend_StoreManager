import { useMemo, useState, useEffect } from 'react';
import { 
  Plus, Search, Eye, Edit, Trash2, Barcode, Grid, Package, CheckCircle2, 
  AlertTriangle, HelpCircle, Layers, Shield, Settings, Info, ShoppingBag, 
  Printer, ArrowRightLeft, Database, Sparkles, Percent 
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type WarehouseBinRecord } from '@/features/inventory/store/inventoryStore';
import { toast } from 'sonner';

export function WarehouseBinsPage() {
  const { 
    warehouseBins, 
    fetchWarehouseBins, 
    addWarehouseBin, 
    updateWarehouseBin, 
    deleteWarehouseBin, 
    racks, 
    fetchRacks 
  } = useInventoryStore();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WarehouseBinRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<WarehouseBinRecord & {
    level: string;
    bay: string;
    position: string;
    binType: string;
    allowFood: boolean;
    allowCosmetics: boolean;
    allowElectronics: boolean;
    allowChemicals: boolean;
    allowMixedSku: boolean;
    allowMixedLot: boolean;
    statusConfig: string;
    // Mock capacities used
    usedWeightKg: number;
    usedVolumeM3: number;
    usedPallets: number;
  }>>({});

  useEffect(() => {
    fetchWarehouseBins();
    fetchRacks();
  }, [fetchWarehouseBins, fetchRacks]);

  // Auto-compose bin code from Rack, Level, Bay, Position
  const selectedRack = useMemo(() => {
    return racks.find(r => r.id === editingItem.rackId);
  }, [editingItem.rackId, racks]);

  useEffect(() => {
    if (modalMode === 'create' && selectedRack) {
      const rackCode = selectedRack.rackCode || 'R';
      const lvl = String(editingItem.level || '01').padStart(2, '0');
      const bay = String(editingItem.bay || '01').padStart(2, '0');
      const pos = String(editingItem.position || '01').padStart(2, '0');
      const composedCode = `${rackCode}-${lvl}-${bay}-${pos}`;
      
      setEditingItem(prev => ({
        ...prev,
        binCode: composedCode,
        barcode: `BAR-${composedCode}`
      }));
    }
  }, [selectedRack, editingItem.level, editingItem.bay, editingItem.position, modalMode]);

  const filtered = useMemo(() => {
    if (!search) return warehouseBins;
    const q = search.toLowerCase();
    return warehouseBins.filter(
      (d) =>
        d.binCode.toLowerCase().includes(q) ||
        (d.barcode && d.barcode.toLowerCase().includes(q)) ||
        (d.rackCode && d.rackCode.toLowerCase().includes(q)) ||
        (d.areaCode && d.areaCode.toLowerCase().includes(q)) ||
        (d.zoneCode && d.zoneCode.toLowerCase().includes(q))
    );
  }, [search, warehouseBins]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      binCode: '',
      barcode: '',
      rackId: racks[0]?.id || '',
      level: '01',
      bay: '01',
      position: '01',
      maxWeightKg: 500,
      maxVolumeM3: 2,
      maxPallet: 1,
      usedWeightKg: 0,
      usedVolumeM3: 0,
      usedPallets: 0,
      status: 'EMPTY',
      description: '',
      binType: 'STORAGE',
      allowFood: true,
      allowCosmetics: true,
      allowElectronics: false,
      allowChemicals: false,
      allowMixedSku: true,
      allowMixedLot: false,
      statusConfig: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: WarehouseBinRecord) => {
    setModalMode('edit');
    // Extract level, bay, position from binCode (e.g. RACK-A-01-02-03)
    const parts = item.binCode.split('-');
    const pos = parts.pop() || '01';
    const bay = parts.pop() || '01';
    const lvl = parts.pop() || '01';

    // Mock used space for Edit
    const isOccupied = item.status === 'OCCUPIED';
    const isFull = item.status === 'FULL';
    
    setEditingItem({
      ...item,
      level: lvl,
      bay: bay,
      position: pos,
      binType: 'STORAGE',
      allowFood: true,
      allowCosmetics: true,
      allowElectronics: false,
      allowChemicals: false,
      allowMixedSku: true,
      allowMixedLot: false,
      statusConfig: (item.status as string) === 'LOCKED' ? 'LOCKED' : (item.status as string) === 'MAINTENANCE' ? 'MAINTENANCE' : (item.status as string) === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      usedWeightKg: isFull ? (item.maxWeightKg || 500) : isOccupied ? 120 : 0,
      usedVolumeM3: isFull ? (item.maxVolumeM3 || 2) : isOccupied ? 0.8 : 0,
      usedPallets: isFull ? (item.maxPallet || 1) : isOccupied ? 1 : 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.binCode || !editingItem.rackId) return;

    // Trạng thái vật lý được lưu dựa trên cấu hình quản lý và sức chứa mock
    let physicalStatus: any = editingItem.status || 'EMPTY';
    if (editingItem.statusConfig === 'LOCKED') {
      physicalStatus = 'LOCKED';
    } else if (editingItem.statusConfig === 'MAINTENANCE') {
      physicalStatus = 'MAINTENANCE';
    } else if (editingItem.statusConfig === 'INACTIVE') {
      physicalStatus = 'INACTIVE';
    } else {
      // Nếu ACTIVE, tự tính trạng thái vật lý
      const utilization = (editingItem.usedPallets || 0) / (editingItem.maxPallet || 1);
      if (utilization >= 1) {
        physicalStatus = 'FULL';
      } else if (utilization > 0) {
        physicalStatus = 'OCCUPIED';
      } else {
        physicalStatus = 'EMPTY';
      }
    }

    const payload = {
      binCode: editingItem.binCode.toUpperCase(),
      barcode: editingItem.barcode?.toUpperCase() || `BAR-${editingItem.binCode.toUpperCase()}`,
      rackId: editingItem.rackId,
      maxWeightKg: Number(editingItem.maxWeightKg || 0),
      maxVolumeM3: Number(editingItem.maxVolumeM3 || 0),
      maxPallet: Number(editingItem.maxPallet || 0),
      status: physicalStatus as any,
      description: editingItem.description || '',
    };

    try {
      if (modalMode === 'create') {
        await addWarehouseBin(payload);
        toast.success(`Đã khởi tạo ô kệ ${payload.binCode} thành công!`);
      } else {
        await updateWarehouseBin(editingItem.id!, payload);
        toast.success(`Đã cập nhật ô kệ ${payload.binCode}!`);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Lỗi khi lưu ô kệ');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa ô kệ này?')) {
      try {
        await deleteWarehouseBin(id);
        toast.success('Đã xóa ô kệ.');
      } catch (err) {
        toast.error('Xóa ô kệ thất bại.');
      }
    }
  };

  // Mock items in selected bin (Bin-level Inventory)
  const mockInventoryItems = useMemo(() => {
    if (!selected) return [];
    if (selected.status === 'EMPTY') return [];
    return [
      {
        sku: 'AP-IP15PM-256',
        name: 'iPhone 15 Pro Max 256GB - Titan Tự Nhiên',
        qty: selected.status === 'FULL' ? 45 : 15,
        lot: 'LOT-IP15-2026',
        hsd: 'N/A (Thiết bị điện tử)',
        reserved: 5,
        available: selected.status === 'FULL' ? 40 : 10,
      },
      {
        sku: 'SS-S24U-512',
        name: 'Samsung Galaxy S24 Ultra 512GB - Xám',
        qty: selected.status === 'FULL' ? 20 : 5,
        lot: 'LOT-S24U-0526',
        hsd: 'N/A (Thiết bị điện tử)',
        reserved: 0,
        available: selected.status === 'FULL' ? 20 : 5,
      }
    ];
  }, [selected]);

  const columns = useMemo<ColumnDef<WarehouseBinRecord>[]>(
    () => [
      {
        accessorKey: 'binCode',
        header: 'Mã Ô kệ (Bin)',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'barcode',
        header: 'Mã vạch Ô kệ',
        cell: (info) => (
          <span className="font-mono flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-800">
            <Barcode className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'rackCode',
        header: 'Hệ thống Kệ (Rack)',
        cell: (info) => (
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {info.getValue() as string || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'maxWeightKg',
        header: 'Tải trọng tối đa',
        cell: (info) => <span className="font-mono text-gray-650 dark:text-gray-350">{info.getValue() as number} kg</span>,
      },
      {
        accessorKey: 'maxPallet',
        header: 'Pallets tối đa',
        cell: (info) => <span className="font-mono font-bold text-blue-600">{info.getValue() as number} Pallet</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái vật lý',
        cell: (info) => {
          const status = info.getValue() as string;
          let label = 'Trống kệ';
          let colorCls = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50';

          if (status === 'OCCUPIED') {
            label = 'Đang có hàng';
            colorCls = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50';
          } else if (status === 'FULL') {
            label = 'Kệ đầy';
            colorCls = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/50';
          } else if (status === 'LOCKED') {
            label = 'Khóa';
            colorCls = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50';
          } else if (status === 'MAINTENANCE') {
            label = 'Bảo trì';
            colorCls = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50';
          } else if (status === 'INACTIVE') {
            label = 'Ngừng dùng';
            colorCls = 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800';
          }

          return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorCls}`}>
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
              title="Xem chi tiết & tồn kho"
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
              onClick={() => handleDelete(row.original.id)}
              className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-450 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [warehouseBins]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sơ đồ vị trí Ô kệ (Bins)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý chi tiết vị trí lưu trữ sản phẩm trong kho hàng (Rack &rarr; Level &rarr; Bay &rarr; Position).
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-semibold text-sm shadow-sm whitespace-nowrap self-start"
        >
          <Plus className="w-4 h-4" /> Thêm Ô Kệ Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo mã ô kệ, mã vạch, mã kệ..."
          className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      {/* Drawer: Chi tiết Ô Kệ & Tồn Kho Thực Tế (Gợi ý 7 + 8 + 12) */}
      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Vị trí Ô Kệ: ${selected?.binCode}`}
        width="max-w-2xl"
      >
        {selected && (
          <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
            {/* Visual Dashboard Sức chứa ô kệ (Gợi ý 9) */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border dark:border-gray-800 space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Percent className="w-4 h-4 text-emerald-600" /> Hiệu suất sử dụng ô kệ
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-2 bg-white dark:bg-gray-850 rounded border dark:border-gray-800">
                  <span className="text-[10px] text-gray-400 font-bold block">TẢI TRỌNG</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {selected.status === 'FULL' ? selected.maxWeightKg : selected.status === 'OCCUPIED' ? 120 : 0} / {selected.maxWeightKg} kg
                  </span>
                  <div className="w-full bg-gray-200 dark:bg-gray-750 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${selected.status === 'FULL' ? 'bg-orange-500' : 'bg-emerald-500'}`}
                      style={{ width: `${selected.status === 'FULL' ? 100 : selected.status === 'OCCUPIED' ? 24 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="p-2 bg-white dark:bg-gray-850 rounded border dark:border-gray-800">
                  <span className="text-[10px] text-gray-400 font-bold block">THỂ TÍCH</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {selected.status === 'FULL' ? selected.maxVolumeM3 : selected.status === 'OCCUPIED' ? 0.8 : 0} / {selected.maxVolumeM3} m³
                  </span>
                  <div className="w-full bg-gray-200 dark:bg-gray-750 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${selected.status === 'FULL' ? 'bg-orange-500' : 'bg-emerald-500'}`}
                      style={{ width: `${selected.status === 'FULL' ? 100 : selected.status === 'OCCUPIED' ? 40 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="p-2 bg-white dark:bg-gray-850 rounded border dark:border-gray-800">
                  <span className="text-[10px] text-gray-400 font-bold block">PALLETS</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {selected.status === 'FULL' ? selected.maxPallet : selected.status === 'OCCUPIED' ? 1 : 0} / {selected.maxPallet} Pallet
                  </span>
                  <div className="w-full bg-gray-200 dark:bg-gray-750 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${selected.status === 'FULL' ? 'bg-orange-500' : 'bg-emerald-500'}`}
                      style={{ width: `${selected.status === 'FULL' ? 100 : selected.status === 'OCCUPIED' ? 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Label in ấn QR & Barcode (Gợi ý 8) */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 border-dashed flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h5 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-emerald-650" />
                  Nhãn định vị Ô Kệ (Location Label)
                </h5>
                <p className="text-xs text-gray-500">Mã vạch chuẩn hóa cho nhân viên dùng PDA quét kiểm kho.</p>
              </div>
              <div className="bg-white p-3 border border-gray-300 rounded-lg flex flex-col items-center gap-1.5">
                <span className="font-mono font-bold text-xs text-gray-900">{selected.binCode}</span>
                {/* Visual Fake Barcode */}
                <div className="h-8 flex gap-0.5 items-end justify-center px-2">
                  {[2,1,3,1,4,1,2,2,3,1,4,2,1,3,2,1,4,1,2].map((w, idx) => (
                    <div key={idx} className="bg-black h-full" style={{ width: `${w}px` }} />
                  ))}
                </div>
                <span className="text-[9px] text-gray-400 font-mono tracking-widest">{selected.barcode || 'N/A'}</span>
              </div>
            </div>

            {/* Thông tin WMS chi tiết */}
            <div className="grid grid-cols-2 gap-4 border-t dark:border-gray-800 pt-4">
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Hệ thống kệ (Rack):</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selected.rackCode || 'N/A'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Phân khu kho (Zone):</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selected.zoneCode || selected.areaCode || 'N/A'}</p>
              </div>
            </div>

            {/* Danh sách tồn kho trong ô kệ (Gợi ý 7 & 12) */}
            <div className="border-t dark:border-gray-800 pt-4 space-y-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                Hàng hóa đang lưu trữ thực tế (Bin-level Inventory)
              </h4>
              
              {mockInventoryItems.length === 0 ? (
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed text-gray-400 text-xs">
                  Ô kệ hiện tại hoàn toàn trống (Không có tồn kho).
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border dark:border-gray-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-2">Sản phẩm</th>
                        <th className="p-2">Mã Lô</th>
                        <th className="p-2 font-mono text-center">Khả dụng</th>
                        <th className="p-2 font-mono text-center">Reserved</th>
                        <th className="p-2 font-mono text-center">Tổng tồn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-800 bg-white dark:bg-gray-950">
                      {mockInventoryItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="p-2">
                            <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                            <span className="text-[10px] text-gray-400 font-mono">{item.sku}</span>
                          </td>
                          <td className="p-2 font-mono text-gray-500">{item.lot}</td>
                          <td className="p-2 font-mono text-center font-bold text-emerald-600">{item.available}</td>
                          <td className="p-2 font-mono text-center text-amber-600">{item.reserved}</td>
                          <td className="p-2 font-mono text-center font-bold text-gray-900 dark:text-white">{item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selected.description && (
              <div className="border-t dark:border-gray-800 pt-4">
                <span className="text-xs text-gray-400 font-bold uppercase">Mô tả vị trí:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-gray-700 dark:text-gray-300 italic mt-1">
                  "{selected.description}"
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Modal: Khai báo vị trí Ô kệ mới (Gợi ý 1 + 2 + 3 + 11) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '📦 Khai báo vị trí Ô kệ mới' : '⚙️ Cập nhật vị trí Ô kệ'}
        width="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          {/* Section: Vị trí & Cấu hình mã (Gợi ý 2 + 11) */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-600" /> Định vị & Sinh mã vị trí tự động
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Kệ hàng (Rack) *</label>
                <select
                  value={editingItem.rackId || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, rackId: e.target.value })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700 text-xs font-semibold"
                  required
                >
                  <option value="">-- Chọn rack --</option>
                  {racks.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.rackCode} - {r.rackName} (Bãi: {r.areaCode})
                    </option>
                  ))}
                </select>
              </div>
              
              {modalMode === 'create' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Tầng (Level)</label>
                    <input
                      type="number"
                      min="1"
                      value={editingItem.level || '01'}
                      onChange={(e) => setEditingItem({ ...editingItem, level: e.target.value })}
                      className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-950 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Khoang (Bay)</label>
                    <input
                      type="number"
                      min="1"
                      value={editingItem.bay || '01'}
                      onChange={(e) => setEditingItem({ ...editingItem, bay: e.target.value })}
                      className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-950 dark:border-gray-700"
                    />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 flex items-center justify-end">
                  <span className="text-xs text-gray-400 italic">Mã vị trí đã khóa khi sửa</span>
                </div>
              )}
            </div>

            {modalMode === 'create' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t dark:border-gray-800 pt-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Vị trí (Position)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.position || '01'}
                    onChange={(e) => setEditingItem({ ...editingItem, position: e.target.value })}
                    className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-950 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã Ô kệ sinh ra (composed)</label>
                  <input
                    type="text"
                    value={editingItem.binCode || ''}
                    disabled
                    className="w-full mt-1 p-2 border rounded font-mono text-xs bg-gray-100 dark:bg-gray-800 font-bold text-emerald-600 cursor-not-allowed border-dashed"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: Phân loại & Quyền hạn WMS (Gợi ý 2 + 11) */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-500" /> Cấu hình nghiệp vụ & Phân loại WMS
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Loại ô kệ (Bin Type)</label>
                <select
                  value={editingItem.binType || 'STORAGE'}
                  onChange={(e) => setEditingItem({ ...editingItem, binType: e.target.value })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700 text-xs"
                >
                  <option value="STORAGE">Storage (Lưu trữ thường)</option>
                  <option value="PICKING">Picking (Nhặt hàng nhanh)</option>
                  <option value="QC">QC Area (Hàng kiểm phẩm)</option>
                  <option value="DAMAGE">Damage (Hàng hỏng lỗi)</option>
                  <option value="RETURN">Return (Nhận hàng trả về)</option>
                  <option value="TRANSIT">Transit (Hàng trung chuyển)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Trạng thái quản lý *</label>
                <select
                  value={editingItem.statusConfig || 'ACTIVE'}
                  onChange={(e) => setEditingItem({ ...editingItem, statusConfig: e.target.value })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700 text-xs"
                >
                  <option value="ACTIVE">🟢 Hoạt động bình thường</option>
                  <option value="LOCKED">🔴 Khóa (Không cho phép Putaway/Pick)</option>
                  <option value="MAINTENANCE">🟡 Bảo trì / Làm sạch</option>
                  <option value="INACTIVE">⚪ Ngừng sử dụng</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t dark:border-gray-800">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cho phép chứa (Loại hàng)</label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.allowFood !== false}
                      onChange={(e) => setEditingItem({ ...editingItem, allowFood: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span>Thực phẩm</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.allowCosmetics !== false}
                      onChange={(e) => setEditingItem({ ...editingItem, allowCosmetics: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span>Mỹ phẩm</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingItem.allowElectronics}
                      onChange={(e) => setEditingItem({ ...editingItem, allowElectronics: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span>Điện tử</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingItem.allowChemicals}
                      onChange={(e) => setEditingItem({ ...editingItem, allowChemicals: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span>Hóa chất</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Quy tắc trộn tồn kho</label>
                <div className="space-y-1.5 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.allowMixedSku !== false}
                      onChange={(e) => setEditingItem({ ...editingItem, allowMixedSku: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Cho phép trộn sản phẩm (Mixed SKU)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingItem.allowMixedLot}
                      onChange={(e) => setEditingItem({ ...editingItem, allowMixedLot: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Cho phép trộn Lô (Mixed Lot)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Sức chứa vật lý & Đang dùng (Gợi ý 6 + 11) */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-orange-500" /> Giới hạn & Sức chứa vật lý
            </h4>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Tải Trọng (kg)</label>
                <input
                  type="number"
                  value={editingItem.maxWeightKg || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, maxWeightKg: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-950 dark:border-gray-700"
                />
                {modalMode === 'edit' && (
                  <span className="text-[10px] text-gray-400 block mt-1">Đang dùng: {editingItem.usedWeightKg}kg</span>
                )}
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Thể Tích (m³)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.maxVolumeM3 || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, maxVolumeM3: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-950 dark:border-gray-700"
                />
                {modalMode === 'edit' && (
                  <span className="text-[10px] text-gray-400 block mt-1">Đang dùng: {editingItem.usedVolumeM3}m³</span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Pallets tối đa</label>
                <input
                  type="number"
                  value={editingItem.maxPallet || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, maxPallet: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-950 dark:border-gray-700"
                />
                {modalMode === 'edit' && (
                  <span className="text-[10px] text-gray-400 block mt-1">Đang dùng: {editingItem.usedPallets}</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Mô tả / Hướng dẫn cất hàng</label>
            <textarea
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700 text-xs"
              rows={2}
              placeholder="Nhập hướng dẫn đi đường hoặc ghi chú đặc biệt..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition text-gray-700 dark:text-gray-300 text-xs font-semibold"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-xs font-semibold shadow-sm"
            >
              {modalMode === 'create' ? 'Tạo Ô kệ WMS' : 'Cập nhật Ô kệ'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default WarehouseBinsPage;
