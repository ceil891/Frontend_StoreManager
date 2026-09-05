import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import { useMemo, useState, useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { Plus, Eye, Edit, Trash2, MapPin, Building2, User, Phone, Mail, Clock, Box, ShieldCheck, FileText } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import { AddressCascadeSelect } from '@/shared/components/ui/AddressCascadeSelect';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export interface SupplierWarehouseRecord {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  supplierName: string;
  address: string;
  warehouseType?: string;
  capacity?: number;
  capacityUnit?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  contactPerson?: string;
  phone: string;
  loadingContactPhone?: string;
  operatingHours?: string;
  operatingDays?: string;
  storageConditions?: string;
  status: 'HOAT_DONG' | 'TAM_NGUNG';
  notes?: string;
  internalNotes?: string;
}

export function SupplierWarehousesPage() {
  const { supplierWarehouses: data, fetchSupplierWarehouses, addSupplierWarehouse, updateSupplierWarehouse, deleteSupplierWarehouse } = useInventoryStore();

  useEffect(() => {
    fetchSupplierWarehouses();
  }, [fetchSupplierWarehouses]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SupplierWarehouseRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SupplierWarehouseRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.warehouseCode.toLowerCase().includes(q) ||
        d.warehouseName.toLowerCase().includes(q) ||
        d.supplierName.toLowerCase().includes(q) ||
        (d.warehouseType && d.warehouseType.toLowerCase().includes(q)) ||
        (d.managerName && d.managerName.toLowerCase().includes(q))
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      warehouseCode: `SWH-${Date.now().toString().slice(-4)}`,
      warehouseName: '',
      supplierName: '',
      warehouseType: 'Kho thường',
      capacity: 1000,
      capacityUnit: 'Pallet',
      managerName: '',
      managerPhone: '',
      managerEmail: '',
      contactPerson: '',
      phone: '',
      loadingContactPhone: '',
      operatingHours: '08:00 - 17:30',
      operatingDays: 'T2 - T7',
      storageConditions: 'Kho khô ráo, nhiệt độ thường',
      address: '',
      status: 'HOAT_DONG',
      notes: '',
      internalNotes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SupplierWarehouseRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.warehouseCode || !editingItem.warehouseName || !editingItem.supplierName) return;

    const payload: Omit<SupplierWarehouseRecord, 'id'> = {
      warehouseCode: editingItem.warehouseCode.toUpperCase(),
      warehouseName: editingItem.warehouseName,
      supplierName: editingItem.supplierName,
      warehouseType: editingItem.warehouseType || 'Kho thường',
      capacity: Number(editingItem.capacity) || 0,
      capacityUnit: editingItem.capacityUnit || 'Pallet',
      managerName: editingItem.managerName || '',
      managerPhone: editingItem.managerPhone || '',
      managerEmail: editingItem.managerEmail || '',
      address: editingItem.address || '',
      contactPerson: editingItem.contactPerson || '',
      phone: editingItem.phone || '',
      loadingContactPhone: editingItem.loadingContactPhone || '',
      operatingHours: editingItem.operatingHours || '',
      operatingDays: editingItem.operatingDays || '',
      storageConditions: editingItem.storageConditions || '',
      status: editingItem.status || 'HOAT_DONG',
      notes: editingItem.notes || '',
      internalNotes: editingItem.internalNotes || '',
    };

    try {
      if (modalMode === 'create') {
        await addSupplierWarehouse(payload);
        toast.success('Đã tạo kho nhà cung cấp mới thành công!');
      } else if (editingItem.id) {
        await updateSupplierWarehouse(editingItem.id, payload);
        toast.success('Đã cập nhật kho nhà cung cấp thành công!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Lỗi khi lưu kho nhà cung cấp:', err);
      toast.error('Lỗi khi lưu kho: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
  };

  const [deletingItem, setDeletingItem] = useState<SupplierWarehouseRecord | null>(null);

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteSupplierWarehouse(deletingItem.id);
      if (selected?.id === deletingItem.id) setSelected(null);
      toast.success(`Đã xóa thông tin kho "${deletingItem.warehouseName}" thành công!`);
      setDeletingItem(null);
    } catch (err: any) {
      console.error('Lỗi khi xóa kho nhà cung cấp:', err);
      toast.error('Lỗi khi xóa kho: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
  };

  const columns = useMemo<ColumnDef<SupplierWarehouseRecord>[]>(
    () => [
      {
        accessorKey: 'warehouseCode',
        header: 'Mã kho',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'warehouseName',
        header: 'Tên kho hàng NCC',
        cell: (info) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</p>
            <p className="text-xs text-gray-400 font-normal">{(info.row.original as any).warehouseType || 'Kho thường'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="font-semibold text-blue-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'managerName',
        header: 'Người phụ trách',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <p className="font-medium text-xs text-gray-900 dark:text-white">{row.managerName || row.contactPerson || '—'}</p>
              <p className="font-mono text-[11px] text-gray-500">{row.managerPhone || row.phone}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'capacity',
        header: 'Sức chứa',
        cell: (info) => {
          const cap = info.getValue() as number;
          const unit = info.row.original.capacityUnit || 'Pallet';
          return cap ? <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{cap.toLocaleString()} {unit}</span> : <span className="text-gray-400">—</span>;
        },
      },
      {
        accessorKey: 'address',
        header: 'Địa chỉ kho',
        cell: (info) => <span className="truncate max-w-xs block text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'HOAT_DONG' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
          const label = status === 'HOAT_DONG' ? 'Hoạt động' : 'Tạm ngưng';
          return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
              title="Xem chi tiết kho"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh sách kho hàng nhà cung cấp (Supplier Warehouses)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Xem và quản lý vị trí kho bãi, loại kho, sức chứa, giờ vận hành và người phụ trách bốc xếp đối tác.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" /> Thêm Kho Nhà Cung Cấp
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Building2 className="w-5 h-5 text-gray-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã kho, tên kho, loại kho, nhà cung cấp, người phụ trách..."
          className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      {/* Detail Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết kho đối tác: ${selected?.warehouseName}`}
        width="max-w-xl"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div>
                <span className="text-gray-500 text-xs block">Mã kho hàng:</span>
                <p className="font-mono font-bold text-emerald-600">{selected.warehouseCode}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Loại kho:</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selected.warehouseType || 'Kho thường'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Tên kho hàng:</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selected.warehouseName}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Nhà cung cấp sở hữu:</span>
                <p className="font-semibold text-blue-600">{selected.supplierName}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Quy mô & Vận hành</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block">Sức chứa:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {selected.capacity ? `${selected.capacity.toLocaleString()} ${selected.capacityUnit || 'Pallet'}` : 'Chưa cập nhật'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Điều kiện bảo quản:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selected.storageConditions || 'Bình thường'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Giờ mở / đóng cửa:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selected.operatingHours || '08:00 - 17:30'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Ngày hoạt động:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selected.operatingDays || 'T2 - T7'}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Người liên hệ & Bốc xếp</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block font-medium">Người phụ trách kho:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selected.managerName || selected.contactPerson || '—'}</span>
                  {selected.managerPhone && <p className="font-mono text-gray-600">{selected.managerPhone}</p>}
                  {selected.managerEmail && <p className="text-blue-600">{selected.managerEmail}</p>}
                </div>
                <div>
                  <span className="text-gray-500 block font-medium">Đội bốc xếp / Thủ kho bãi:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selected.contactPerson || '—'}</span>
                  {selected.loadingContactPhone && <p className="font-mono text-gray-600">{selected.loadingContactPhone}</p>}
                  {selected.phone && <p className="font-mono text-gray-500">ĐT kho: {selected.phone}</p>}
                </div>
              </div>
            </div>

            <div>
              <span className="text-gray-500 text-xs flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Địa Chỉ Kho Chi Tiết:
              </span>
              <p className="font-semibold text-gray-900 dark:text-white text-xs">{selected.address || 'Chưa có địa chỉ'}</p>
            </div>

            {(selected.notes || selected.internalNotes) && (
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800 text-xs">
                {selected.notes && (
                  <div>
                    <span className="text-gray-500 font-medium block">Ghi chú & Phương thức lấy hàng:</span>
                    <p className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg text-gray-700 dark:text-gray-300 italic">{selected.notes}</p>
                  </div>
                )}
                {selected.internalNotes && (
                  <div>
                    <span className="text-amber-600 font-medium block">Ghi chú nội bộ:</span>
                    <p className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 p-2.5 rounded-lg text-amber-800 dark:text-amber-300">{selected.internalNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create / Edit Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Kho đối tác NCC mới' : 'Cập nhật kho đối tác NCC'}
        size="erp"
      >
        <form onSubmit={handleSave} className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
          {/* Nhóm 1: Thông tin cơ bản */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> 1. Thông tin cơ bản kho
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Mã kho *</label>
                  {modalMode === 'create' && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingItem(prev => ({
                          ...prev,
                          warehouseCode: `SWH-${Math.floor(1000 + Math.random() * 9000)}`
                        }))
                      }
                      className="text-[10px] text-emerald-600 hover:underline font-medium"
                    >
                      Tự sinh mã
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={editingItem.warehouseCode || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, warehouseCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="SWH-XXXX"
                  required
                  disabled={modalMode === 'edit'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại kho *</label>
                <input
                  type="text"
                  value={editingItem.phone || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="SĐT cố định / Hotline kho"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại kho hàng *</label>
                <select
                  value={editingItem.warehouseType || 'Kho thường'}
                  onChange={(e) => setEditingItem({ ...editingItem, warehouseType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Kho thường">Kho thường</option>
                  <option value="Kho lạnh">Kho lạnh</option>
                  <option value="Kho đông lạnh">Kho đông lạnh</option>
                  <option value="Kho nguyên liệu">Kho nguyên liệu</option>
                  <option value="Kho thành phẩm">Kho thành phẩm</option>
                  <option value="Kho trung chuyển">Kho trung chuyển</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên kho hàng NCC *</label>
                <input
                  type="text"
                  value={editingItem.warehouseName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, warehouseName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ví dụ: Kho Tổng Vinamilk Bình Dương..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái hoạt động</label>
                <select
                  value={editingItem.status || 'HOAT_DONG'}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="HOAT_DONG">Hoạt Động (Cho phép bốc xếp)</option>
                  <option value="TAM_NGUNG">Tạm Ngưng (Đóng cửa bảo trì/bãi)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhà cung cấp sở hữu *</label>
              <SearchLookupModal
                title="Chọn Nhà Cung Cấp Sở Hữu"
                iconType="building"
                placeholder="Chọn nhà cung cấp..."
                value={editingItem.supplierName}
                options={[
                  { id: 'Vinamilk Corporation', code: 'SUP-VINAMILK', name: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)', subtitle: 'MST: 0300588569' },
                  { id: 'Unilever Việt Nam', code: 'SUP-UNILEVER', name: 'Unilever Việt Nam Co., Ltd', subtitle: 'MST: 0302035542' },
                  { id: 'Samsung Electronics VN', code: 'SUP-SAMSUNG', name: 'Samsung Electronics Vietnam', subtitle: 'MST: 2300329584' },
                  { id: 'Công ty CP Masan Group', code: 'SUP-MASAN', name: 'Tập đoàn Masan Group', subtitle: 'MST: 0303576603' },
                ]}
                onChange={(val, opt) => setEditingItem(prev => ({ ...prev, supplierName: opt ? opt.name : val }))}
              />
            </div>
          </div>

          {/* Nhóm 2: Địa chỉ kho */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> 2. Địa chỉ vị trí kho
            </h3>
            <AddressCascadeSelect
              addressDetail={editingItem.address || ''}
              onChange={({ province, district, ward, addressDetail }) => {
                const fullAddr = [addressDetail, ward, district, province].filter(Boolean).join(', ');
                setEditingItem(prev => ({ ...prev, address: fullAddr }));
              }}
            />
          </div>

          {/* Nhóm 3: Quy mô & Vận hành */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1.5 flex items-center gap-1.5">
              <Box className="w-4 h-4" /> 3. Quy mô & Điều kiện bảo quản
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sức chứa tối đa</label>
                <input
                  type="number"
                  min={0}
                  value={editingItem.capacity ?? ''}
                  onChange={(e) => setEditingItem({ ...editingItem, capacity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="VD: 500, 10000..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn vị sức chứa</label>
                <select
                  value={editingItem.capacityUnit || 'Pallet'}
                  onChange={(e) => setEditingItem({ ...editingItem, capacityUnit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Pallet">Pallet</option>
                  <option value="Kiện">Kiện hàng</option>
                  <option value="m³">m³ (Khối)</option>
                  <option value="Sản phẩm">Sản phẩm</option>
                  <option value="Tấn">Tấn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Điều kiện bảo quản</label>
                <input
                  type="text"
                  value={editingItem.storageConditions || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, storageConditions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="VD: Nhiệt độ 15-25°C, chống ẩm..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khung giờ mở / đóng cửa</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={(editingItem.operatingHours || '08:00 - 17:30').split(' - ')[0] || '08:00'}
                    onChange={(e) => {
                      const close = (editingItem.operatingHours || '08:00 - 17:30').split(' - ')[1] || '17:30';
                      setEditingItem({ ...editingItem, operatingHours: `${e.target.value} - ${close}` });
                    }}
                    className="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  >
                    {['16:30', '17:00', '17:30', '18:00', '19:00', '20:00', '21:00', '22:00', '24/24'].map(t => (
                      <option key={t} value={t}>Đóng: {t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hoạt động trong tuần</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => {
                    const daysStr = editingItem.operatingDays || 'T2 - T7';
                    const isSelected = daysStr.includes(day) || (daysStr.includes('T2 - T7') && day !== 'CN') || (daysStr.includes('Cả tuần'));
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          let current = (editingItem.operatingDays || 'T2, T3, T4, T5, T6, T7').split(', ').map(s => s.trim());
                          if (daysStr === 'T2 - T7') current = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                          if (current.includes(day)) {
                            current = current.filter(d => d !== day);
                          } else {
                            current.push(day);
                          }
                          setEditingItem({ ...editingItem, operatingDays: current.join(', ') || 'N/A' });
                        }}
                        className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Nhóm 4: Người liên hệ (Phân tách rõ Người phụ trách kho vs Người bốc xếp) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4" /> 4. Thông tin người phụ trách & Bốc xếp
            </h3>
            
            <div className="p-3.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
              <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">a. Người phụ trách kho (Thủ kho chính)</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Người phụ trách kho *</label>
                  <input
                    type="text"
                    list="supplier-warehouse-managers"
                    value={editingItem.managerName || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingItem({ ...editingItem, managerName: val });
                      if (val.includes('090') || val.includes('098')) {
                        const parts = val.split(' - ');
                        if (parts.length >= 2) {
                          setEditingItem(prev => ({ ...prev, managerName: parts[0], managerPhone: parts[1] }));
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Chọn hoặc nhập quản lý..."
                    required
                  />
                  <datalist id="supplier-warehouse-managers">
                    <option value="Trần Văn An - 0903123456" />
                    <option value="Lê Thị Bình (Giám sát kho) - 0918765432" />
                    <option value="Phạm Quốc Cường (QL WMS) - 0988665544" />
                    <option value="Hoàng Minh Đức (Điều phối) - 0977223344" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">SĐT người phụ trách *</label>
                  <input
                    type="text"
                    value={editingItem.managerPhone || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, managerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="SĐT di động người phụ trách"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Email người phụ trách</label>
                  <input
                    type="email"
                    value={editingItem.managerEmail || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, managerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="email@domain.com"
                  />
                </div>
              </div>

              <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-t border-gray-200 dark:border-gray-700 pt-2.5">b. Đội ngũ liên hệ bốc xếp / Tiếp nhận bãi</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Người liên hệ bốc xếp</label>
                  <input
                    type="text"
                    list="supplier-loading-contacts"
                    value={editingItem.contactPerson || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Chọn hoặc nhập đại diện..."
                  />
                  <datalist id="supplier-loading-contacts">
                    <option value="Đội Bốc Xếp Tân Phú Trung - 0938112233" />
                    <option value="Tổ Bốc Xếp Việt Hương 1 - 0944556677" />
                    <option value="Tổ Bốc Dỡ Yên Phong Logistics - 0912334455" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">SĐT liên hệ bốc xếp</label>
                  <input
                    type="text"
                    value={editingItem.loadingContactPhone || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, loadingContactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="SĐT trực tiếp tổ bốc xếp"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Nhóm 5: Chứng từ & Ghi chú */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> 5. Chứng từ & Ghi chú
            </h3>
            
            <FileDropzone
              label="Sơ đồ kho & Hợp đồng / Giấy tờ bàn giao bãi bốc xếp (PDF/Image)"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú & Phương thức lấy hàng</label>
                <textarea
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
                  rows={2}
                  placeholder="Lịch bốc xếp, phương thức lấy hàng, quy định ra vào bãi..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú nội bộ (Chỉ công ty xem)</label>
                <textarea
                  value={editingItem.internalNotes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, internalNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
                  rows={2}
                  placeholder="Ghi chú nội bộ bảo mật cho nhân viên RetailHub..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow"
            >
              {modalMode === 'create' ? 'Lưu kho đối tác mới' : 'Cập nhật kho đối tác'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa kho nhà cung cấp"
        description="Bạn có chắc chắn muốn xóa thông tin kho nhà cung cấp này khỏi hệ thống?"
        itemName={deletingItem ? `${deletingItem.warehouseCode} - ${deletingItem.warehouseName}` : undefined}
      />
    </div>
  );
}
export default SupplierWarehousesPage;
