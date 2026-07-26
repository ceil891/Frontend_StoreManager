import { useMemo, useState, useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { Plus, Search, Eye, Edit, Trash2, Calendar, MapPin, Building2, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import { AddressCascadeSelect } from '@/shared/components/ui/AddressCascadeSelect';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import type { ColumnDef } from '@tanstack/react-table';

interface SupplierWarehouseRecord {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  supplierName: string;
  address: string;
  contactPerson: string;
  phone: string;
  status: 'HOAT_DONG' | 'TAM_NGUNG';
  notes?: string;
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
        d.supplierName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      warehouseCode: `SWH-${Date.now().toString().slice(-4)}`,
      warehouseName: '',
      supplierName: '',
      address: '',
      contactPerson: '',
      phone: '',
      status: 'HOAT_DONG',
      notes: '',
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
      address: editingItem.address || '',
      contactPerson: editingItem.contactPerson || '',
      phone: editingItem.phone || '',
      status: editingItem.status || 'HOAT_DONG',
      notes: editingItem.notes || '',
    };

    if (modalMode === 'create') {
      await addSupplierWarehouse(payload);
    } else if (editingItem.id) {
      await updateSupplierWarehouse(editingItem.id, payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa thông tin kho nhà cung cấp này?')) {
      await deleteSupplierWarehouse(id);
      if (selected?.id === id) setSelected(null);
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
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="font-semibold text-blue-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'address',
        header: 'Địa chỉ kho',
        cell: (info) => <span className="truncate max-w-xs block">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'phone',
        header: 'Số điện thoại',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'HOAT_DONG' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
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
              className="p-1 text-gray-500 hover:text-emerald-600 rounded"
              title="Xem chi tiết kho"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1 text-gray-500 hover:text-red-600 rounded"
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Danh sách kho hàng nhà cung cấp (supplier warehouses)</h1>
          <p className="text-sm text-gray-500">
            Xem và cập nhật danh sách vị trí kho hàng của các đối tác cung cấp, hỗ trợ lên kế hoạch lấy hàng từ kho nhà cung cấp.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Thêm Kho Nhà Cung Cấp
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Building2 className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã kho, tên kho, nhà cung cấp..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết kho đối tác: ${selected?.warehouseName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã kho hàng:</span>
                <p className="font-mono font-semibold">{selected.warehouseCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Số điện thoại kho:</span>
                <p className="font-mono">{selected.phone}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên kho hàng:</span>
              <p className="font-semibold text-base">{selected.warehouseName}</p>
            </div>
            <div>
              <span className="text-gray-500">Nhà cung cấp:</span>
              <p className="font-semibold text-blue-600 text-base">{selected.supplierName}</p>
            </div>
            <div>
              <span className="text-gray-500 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" /> Địa Chỉ Kho:
              </span>
              <p className="font-semibold text-gray-700 dark:text-gray-300">{selected.address}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Người liên hệ bốc xếp:</span>
                <p className="font-semibold">{selected.contactPerson || 'Không có thông tin'}</p>
              </div>
              <div>
                <span className="text-gray-500">Trạng thái kho:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.status === 'HOAT_DONG' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selected.status === 'HOAT_DONG' ? 'Hoạt động' : 'Tạm ngưng'}
                  </span>
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú vận chuyển / lấy hàng:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm kho đối tác NCC mới' : 'Sửa kho đối tác'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
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
                placeholder="Số điện thoại kho"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên kho hàng NCC *</label>
              <input
                type="text"
                value={editingItem.warehouseName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, warehouseName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Tên kho hàng đối tác..."
                required
              />
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

          <div>
            <AddressCascadeSelect
              addressDetail={editingItem.address || ''}
              onChange={({ province, district, ward, addressDetail }) => {
                const fullAddr = [addressDetail, ward, district, province].filter(Boolean).join(', ');
                setEditingItem(prev => ({ ...prev, address: fullAddr }));
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người liên hệ bốc xếp (Thủ kho)</label>
              <input
                type="text"
                value={editingItem.contactPerson || ''}
                onChange={(e) => setEditingItem({ ...editingItem, contactPerson: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Tên thủ kho đối tác..."
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
                <option value="TAM_NGUNG">Tạm Ngưng (Đóng cửa bảo trì/sửa chữa)</option>
              </select>
            </div>
          </div>

          <div>
            <FileDropzone
              label="Sơ đồ kho & Giấy tờ bàn giao bãi bốc xếp (PDF/Image)"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú & Phương thức lấy hàng</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              rows={3}
              placeholder="Ghi chú thời gian bốc xếp, phương thức lấy hàng, lịch hoạt động..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
              Lưu kho đối tác
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default SupplierWarehousesPage;
