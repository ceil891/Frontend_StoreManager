import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { 
  Plus, Search, Eye, Edit, Trash2, Calendar, MapPin, Grid, Download, 
  HelpCircle, Layers, Shield, Settings, Info, ShoppingBag, Percent, 
  ArrowRightLeft, Database, Sparkles 
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import { CurrencyInput } from '@/shared/components/ui/CurrencyInput';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

interface SupplierStorageRecord {
  id: string;
  storageCode: string;
  storageName: string;
  supplierWarehouseName: string;
  storageType: 'THUONG' | 'LANH' | 'MAT';
  capacityPallets: number;
  capacityUnit?: string;
  operatingHours?: string;
  status: 'TRONG' | 'DAY' | 'TAM_KHOA';
  notes?: string;
  // WMS Fields
  zoneType?: string;
  putawayRule?: string;
  allowImport?: boolean;
  allowExport?: boolean;
  allowTransfer?: boolean;
  usedPallets?: number;
}

export function SupplierStoragesPage() {
  const { supplierStorages: storeStorages, fetchSupplierStorages, addSupplierStorage, updateSupplierStorage, deleteSupplierStorage } = useInventoryStore();

  useEffect(() => {
    fetchSupplierStorages();
  }, [fetchSupplierStorages]);

  const data: SupplierStorageRecord[] = useMemo(() => {
    return storeStorages.map((s) => ({
      id: s.id,
      storageCode: s.storageCode,
      storageName: s.storageName,
      supplierWarehouseName: s.warehouseName,
      storageType: (s.areaType === 'KHO_LANH' ? 'LANH' : 'THUONG') as any,
      capacityPallets: s.capacity || 100,
      status: (s.status === 'TAM_NGUNG' ? 'TAM_KHOA' : s.currentUsage >= s.capacity ? 'DAY' : 'TRONG') as any,
      notes: s.notes || '',
      zoneType: (s.areaType === 'KHO_LANH' ? 'COLD' : 'NORMAL') as any,
      putawayRule: 'FIFO',
      allowImport: true,
      allowExport: true,
      allowTransfer: true,
      usedPallets: s.currentUsage || 0,
    }));
  }, [storeStorages]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SupplierStorageRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SupplierStorageRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.storageCode.toLowerCase().includes(q) ||
        d.storageName.toLowerCase().includes(q) ||
        d.supplierWarehouseName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      storageCode: `SST-${Date.now().toString().slice(-4)}`,
      storageName: '',
      supplierWarehouseName: '',
      storageType: 'THUONG',
      capacityPallets: 100,
      usedPallets: 0,
      status: 'TRONG',
      notes: '',
      zoneType: 'NORMAL',
      putawayRule: 'FIFO',
      allowImport: true,
      allowExport: true,
      allowTransfer: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SupplierStorageRecord) => {
    setModalMode('edit');
    setEditingItem({
      ...item,
      zoneType: item.zoneType || 'NORMAL',
      putawayRule: item.putawayRule || 'FIFO',
      allowImport: item.allowImport !== false,
      allowExport: item.allowExport !== false,
      allowTransfer: item.allowTransfer !== false,
      usedPallets: item.status === 'DAY' ? item.capacityPallets : item.status === 'TRONG' ? 15 : 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.storageCode || !editingItem.storageName || !editingItem.supplierWarehouseName) return;

    const payload: any = {
      storageCode: editingItem.storageCode.toUpperCase(),
      storageName: editingItem.storageName,
      warehouseName: editingItem.supplierWarehouseName,
      supplierName: 'Nhà cung cấp',
      areaType: editingItem.storageType === 'LANH' ? 'KHO_LANH' : 'KHO_THUONG',
      capacity: Number(editingItem.capacityPallets || 100),
      currentUsage: Number(editingItem.usedPallets || 0),
      status: editingItem.status === 'TAM_KHOA' ? 'TAM_NGUNG' : 'HOAT_DONG',
      notes: editingItem.notes || '',
    };

    if (modalMode === 'create') {
      await addSupplierStorage(payload);
    } else if (editingItem.id) {
      await updateSupplierStorage(editingItem.id, payload);
    }
    toast.success('Đã lưu thông tin khu vực lưu trữ!');
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khu vực lưu trữ nhà cung cấp này?')) {
      await deleteSupplierStorage(id);
      if (selected?.id === id) setSelected(null);
      toast.success('Đã xóa khu vực.');
    }
  };

  const columns = useMemo<ColumnDef<SupplierStorageRecord>[]>(
    () => [
      {
        accessorKey: 'storageCode',
        header: 'Mã Zone',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'storageName',
        header: 'Tên Zone (Khu vực)',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierWarehouseName',
        header: 'Thuộc kho đối tác',
        cell: (info) => (
          <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 font-medium">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'capacityPallets',
        header: 'Sức chứa',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-gray-900 dark:text-gray-150">
            {info.getValue() as number} {info.row.original.capacityUnit || 'PALLET'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái Zone',
        cell: (info) => {
          const status = info.getValue() as string;
          let label = 'Còn trống';
          let colorCls = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50';
          if (status === 'DAY') {
            label = 'Kệ đầy hàng';
            colorCls = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50';
          } else if (status === 'TAM_KHOA') {
            label = 'Tạm khóa / Bảo trì';
            colorCls = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50';
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
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Khu vực lưu trữ của đối tác</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý và theo dõi các khu vực, bãi kho của đối tác giao hàng hoặc nhà cung cấp ký gửi.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-semibold text-sm shadow-sm whitespace-nowrap self-start"
        >
          <Plus className="w-4 h-4" /> Thêm Khu Vực Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo mã phân khu, tên phân khu kho, thuộc kho đối tác..."
          className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      {/* Drawer: Xem chi tiết phân khu đối tác */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Phân Khu: ${selected?.storageCode}`}
      >
        {selected && (
          <div className="space-y-5 text-sm text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Mã phân khu:</span>
                <p className="font-mono font-bold text-emerald-600 mt-0.5 text-base">{selected.storageCode}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Trạng thái:</span>
                <div className="mt-1">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      selected.status === 'TRONG'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selected.status === 'TAM_KHOA'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {selected.status === 'TRONG' ? '🟢 Còn trống' : selected.status === 'TAM_KHOA' ? '🟡 Tạm khóa' : '🔴 Kệ đầy'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t dark:border-gray-800 pt-3">
              <span className="text-xs text-gray-400 font-bold uppercase">Tên phân khu kho:</span>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5 text-base">{selected.storageName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t dark:border-gray-800 pt-3">
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Thuộc kho đối tác:</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selected.supplierWarehouseName}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Điều kiện bảo quản:</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                  {selected.storageType === 'LANH' ? '❄️ Đông lạnh (-18°C)' :
                   selected.storageType === 'MAT' ? '🌡️ Hàng mát (2-8°C)' : '☀️ Nhiệt độ thường'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t dark:border-gray-800 pt-3">
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Quy tắc cất hàng:</span>
                <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {selected.putawayRule || 'FIFO'} (Nhập trước xuất trước)
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Loại phân khu WMS:</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                  {selected.zoneType === 'COLD' ? 'Kho lạnh' :
                   selected.zoneType === 'QC' ? 'Khu QC' :
                   selected.zoneType === 'PICKING' ? 'Khu Picking' :
                   selected.zoneType === 'RECEIVING' ? 'Khu nhập' :
                   selected.zoneType === 'SHIPPING' ? 'Khu xuất' : 'Kho thường'}
                </p>
              </div>
            </div>

            {/* Sức chứa trực quan */}
            <div className="border-t dark:border-gray-800 pt-3 space-y-2">
              <span className="text-xs text-gray-400 font-bold uppercase">Sức chứa bãi lưu trữ:</span>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                    {selected.usedPallets || (selected.status === 'DAY' ? selected.capacityPallets : 15)}
                  </span>
                  <span className="text-gray-400 text-xs font-bold"> / {selected.capacityPallets} Pallets</span>
                </div>
                <div className="w-1/2 bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${selected.status === 'DAY' ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${selected.status === 'DAY' ? 100 : 25}%` }}
                  />
                </div>
              </div>
            </div>

            {selected.notes && (
              <div className="border-t dark:border-gray-800 pt-3">
                <span className="text-xs text-gray-400 font-bold uppercase">Ghi chú chi tiết:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-gray-700 dark:text-gray-300 italic mt-1">
                  "{selected.notes}"
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Thêm/Sửa Khu vực kho */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm điểm kho (Zone đối tác) mới' : 'Chỉnh sửa thông tin điểm kho đối tác'}
        size="erp"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          {/* Group 1: Thông tin chung */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-600" /> Thông tin chung Zone (Khu vực kho)
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã Zone *</label>
                <input
                  type="text"
                  value={editingItem.storageCode || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, storageCode: e.target.value })}
                  className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-950 dark:border-gray-700"
                  placeholder="ZONE-XXXX"
                  required
                  disabled={modalMode === 'edit'}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Tên Zone *</label>
                <input
                  type="text"
                  value={editingItem.storageName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, storageName: e.target.value })}
                  className="w-full mt-1 p-2 border rounded text-xs dark:bg-gray-950 dark:border-gray-700"
                  placeholder="Ví dụ: Khu A - Bánh kẹo"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Thuộc kho đối tác *</label>
              <SearchLookupModal
                title="Chọn Kho Hàng Đối Tác"
                iconType="building"
                placeholder="Chọn kho hàng nhà cung cấp..."
                value={editingItem.supplierWarehouseName}
                options={[
                  { id: 'Kho Tổng Vinamilk Bình Dương', code: 'SWH-8821', name: 'Kho Tổng Vinamilk Bình Dương', subtitle: 'KCN Việt Hương, Bình Dương' },
                  { id: 'Kho Unilever Củ Chi', code: 'SWH-5512', name: 'Kho Unilever Củ Chi', subtitle: 'KCN Tân Phú Trung, Củ Chi' },
                  { id: 'Kho Samsung Bắc Ninh', code: 'SWH-1029', name: 'Kho Samsung Yên Phong Bắc Ninh', subtitle: 'KCN Yên Phong, Bắc Ninh' },
                ]}
                onChange={(val, opt) => setEditingItem(prev => ({ ...prev, supplierWarehouseName: opt ? opt.name : val }))}
              />
            </div>
          </div>

          {/* Group 2: Vận hành WMS */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-500" /> Cấu hình & Vận hành WMS
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Loại Zone *</label>
                <select
                  value={editingItem.zoneType || 'NORMAL'}
                  onChange={(e) => setEditingItem({ ...editingItem, zoneType: e.target.value })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700 text-xs"
                >
                  <option value="NORMAL">Normal (Kho thường)</option>
                  <option value="COLD">Cold Storage (Kho lạnh)</option>
                  <option value="RECEIVING">Receiving (Khu nhập hàng)</option>
                  <option value="SHIPPING">Shipping (Khu xuất hàng)</option>
                  <option value="PICKING">Picking (Khu lấy hàng)</option>
                  <option value="QC">QC Area (Kiểm phẩm)</option>
                  <option value="QUARANTINE">Quarantine (Cách ly)</option>
                  <option value="DAMAGE">Defective (Hàng lỗi)</option>
                  <option value="RETURN">Return (Hàng trả về)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Điều kiện bảo quản *</label>
                <select
                  value={editingItem.storageType || 'THUONG'}
                  onChange={(e) => setEditingItem({ ...editingItem, storageType: e.target.value as any })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700 text-xs"
                >
                  <option value="THUONG">Nhiệt độ thường (25-30°C)</option>
                  <option value="LANH">Đông lạnh (-18°C)</option>
                  <option value="MAT">Hàng mát (2-8°C)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t dark:border-gray-800">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  Quy tắc lấy hàng (Picking Rule)
                  <span title="Quy tắc xuất hàng (FIFO/FEFO/LIFO) là quy tắc cốt lõi của WMS để lấy hàng ra khỏi kho.">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  </span>
                </label>
                <select
                  value={editingItem.putawayRule || 'FIFO'}
                  onChange={(e) => setEditingItem({ ...editingItem, putawayRule: e.target.value })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700 text-xs"
                >
                  <option value="FIFO">FIFO (Nhập trước - Xuất trước)</option>
                  <option value="FEFO">FEFO (Hết hạn trước - Xuất trước)</option>
                  <option value="LIFO">LIFO (Nhập sau - Xuất trước)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Quyền nghiệp vụ của Zone</label>
                <div className="flex flex-col gap-1.5 text-xs mt-1.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.allowImport !== false}
                      onChange={(e) => setEditingItem({ ...editingItem, allowImport: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span>Cho phép nhập hàng</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.allowExport !== false}
                      onChange={(e) => setEditingItem({ ...editingItem, allowExport: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span>Cho phép xuất hàng</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.allowTransfer !== false}
                      onChange={(e) => setEditingItem({ ...editingItem, allowTransfer: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span>Cho phép dịch chuyển kho</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t dark:border-gray-800">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Khung giờ vận hành (Operating Hours)</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={(editingItem.operatingHours || '08:00 - 17:30').split(' - ')[0] || '08:00'}
                  onChange={(e) => {
                    const close = (editingItem.operatingHours || '08:00 - 17:30').split(' - ')[1] || '17:30';
                    setEditingItem({ ...editingItem, operatingHours: `${e.target.value} - ${close}` });
                  }}
                  className="w-full p-2 border rounded font-mono text-xs dark:bg-gray-950 dark:border-gray-700"
                >
                  {['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00'].map(t => (
                    <option key={t} value={t}>Mở: {t}</option>
                  ))}
                </select>
                <select
                  value={(editingItem.operatingHours || '08:00 - 17:30').split(' - ')[1] || '17:30'}
                  onChange={(e) => {
                    const open = (editingItem.operatingHours || '08:00 - 17:30').split(' - ')[0] || '08:00';
                    setEditingItem({ ...editingItem, operatingHours: `${open} - ${e.target.value}` });
                  }}
                  className="w-full p-2 border rounded font-mono text-xs dark:bg-gray-950 dark:border-gray-700"
                >
                  {['16:30', '17:00', '17:30', '18:00', '19:00', '20:00', '21:00', '22:00', '24/24'].map(t => (
                    <option key={t} value={t}>Đóng: {t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Group 3: Sức chứa thực tế & Đang dùng */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-orange-500" /> Sức chứa & Trạng thái Zone
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Sức chứa tối đa *</label>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="number"
                    value={editingItem.capacityPallets || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, capacityPallets: Number(e.target.value) })}
                    className="w-full p-2 border rounded font-mono text-xs dark:bg-gray-950 dark:border-gray-700"
                    required
                    min={1}
                  />
                  <span className="text-xs font-bold text-gray-500">PALLET</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Đã sử dụng (Tính tự động)</label>
                <div className="w-full mt-1 p-2 bg-gray-100 dark:bg-gray-800 border rounded font-mono text-xs text-gray-600 dark:text-gray-400 font-bold">
                  {editingItem.usedPallets || 0} PALLET
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Trạng thái Zone</label>
                <select
                  value={editingItem.status || 'TRONG'}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700 text-xs"
                >
                  <option value="TRONG">Hoạt động bình thường</option>
                  <option value="TAM_KHOA">Khóa / Bảo trì Zone</option>
                </select>
              </div>
            </div>

            {/* Capacity Dashboard nhỏ (Gợi ý 9) */}
            {modalMode === 'edit' && (
              <div className="pt-2 border-t dark:border-gray-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-500">Hiệu suất sử dụng:</span>
                <span className="font-mono font-bold text-gray-850 dark:text-gray-200">
                  {editingItem.usedPallets || 0} / {editingItem.capacityPallets} Pallets (
                  {((editingItem.usedPallets || 0) / (editingItem.capacityPallets || 1)) * 100}%)
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Ghi chú vận hành</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700 text-xs"
              rows={2}
              placeholder="Ghi chú đăng ký xe vận tải, điều kiện bốc xếp..."
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
              {modalMode === 'create' ? 'Tạo Khu vực kho' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
