import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, MapPin, Building2, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
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

const MOCK_WAREHOUSES: SupplierWarehouseRecord[] = [
  {
    id: '1',
    warehouseCode: 'SWH-GBL-01',
    warehouseName: 'Kho Đông Anh - Toàn Cầu',
    supplierName: 'Nhà Cung Cấp Toàn Cầu',
    address: 'Khu công nghiệp Đông Anh, Hà Nội',
    contactPerson: 'Nguyễn Văn Kho',
    phone: '0912111222',
    status: 'HOAT_DONG',
    notes: 'Kho lớn hỗ trợ xe tải trên 10 tấn ra vào bốc dỡ hàng',
  },
  {
    id: '2',
    warehouseCode: 'SWH-ASI-02',
    warehouseName: 'Kho Cát Lái - Á Châu',
    supplierName: 'Công Ty Nhập Khẩu Á Châu',
    address: 'Cảng Cát Lái, Quận 2, TP. HCM',
    contactPerson: 'Lê Văn Cảng',
    phone: '0988333444',
    status: 'HOAT_DONG',
    notes: 'Kho trung chuyển hàng nhập khẩu cảng biển',
  },
];

export function SupplierWarehousesPage() {
  const [data, setData] = useState<SupplierWarehouseRecord[]>(MOCK_WAREHOUSES);
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
      warehouseCode: '',
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.warehouseCode || !editingItem.warehouseName || !editingItem.supplierName) return;

    if (modalMode === 'create') {
      const newItem: SupplierWarehouseRecord = {
        id: String(data.length + 1),
        warehouseCode: editingItem.warehouseCode.toUpperCase(),
        warehouseName: editingItem.warehouseName!,
        supplierName: editingItem.supplierName!,
        address: editingItem.address || '',
        contactPerson: editingItem.contactPerson || '',
        phone: editingItem.phone || '',
        status: editingItem.status as any || 'HOAT_DONG',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as SupplierWarehouseRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa thông tin kho nhà cung cấp này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<SupplierWarehouseRecord>[]>(
    () => [
      {
        accessorKey: 'warehouseCode',
        header: 'Mã Kho',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'warehouseName',
        header: 'Tên Kho Hàng NCC',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà Cung Cấp',
        cell: (info) => <span className="font-semibold text-blue-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'address',
        header: 'Địa Chỉ Kho',
        cell: (info) => <span className="truncate max-w-xs block">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'phone',
        header: 'Số Điện Thoại',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'HOAT_DONG' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
          const label = status === 'HOAT_DONG' ? 'Hoạt Động' : 'Tạm Ngưng';
          return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              className="p-1 text-gray-500 hover:text-emerald-600 rounded"
              title="Xem Chi Tiết Kho"
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
          <h1 className="text-2xl font-bold">Danh Sách Kho Hàng Nhà Cung Cấp (Supplier Warehouses)</h1>
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
                <span className="text-gray-500">Mã Kho Hàng:</span>
                <p className="font-mono font-semibold">{selected.warehouseCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Số Điện Thoại Kho:</span>
                <p className="font-mono">{selected.phone}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên Kho Hàng:</span>
              <p className="font-semibold text-base">{selected.warehouseName}</p>
            </div>
            <div>
              <span className="text-gray-500">Nhà Cung Cấp:</span>
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
                <span className="text-gray-500">Người Liên Hệ Bốc Xếp:</span>
                <p className="font-semibold">{selected.contactPerson || 'Không có thông tin'}</p>
              </div>
              <div>
                <span className="text-gray-500">Trạng Thái Kho:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.status === 'HOAT_DONG' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selected.status === 'HOAT_DONG' ? 'Hoạt Động' : 'Tạm Ngưng'}
                  </span>
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Vận Chuyển / Lấy Hàng:</span>
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
        title={modalMode === 'create' ? 'Thêm Kho Đối Tác NCC Mới' : 'Sửa Kho Đối Tác'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Kho *</label>
              <input
                type="text"
                value={editingItem.warehouseCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, warehouseCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="SWH-XXXX"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Số Điện Thoại Kho *</label>
              <input
                type="text"
                value={editingItem.phone || ''}
                onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="Số điện thoại kho"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tên Kho Hàng NCC *</label>
              <input
                type="text"
                value={editingItem.warehouseName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, warehouseName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên kho hàng đối tác"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nhà Cung Cấp Sở Hữu *</label>
              <input
                type="text"
                value={editingItem.supplierName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, supplierName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên nhà cung cấp"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Địa Chỉ Kho *</label>
            <input
              type="text"
              value={editingItem.address || ''}
              onChange={(e) => setEditingItem({ ...editingItem, address: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Địa chỉ bốc xếp hàng"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Người Liên Hệ Bốc Xếp</label>
              <input
                type="text"
                value={editingItem.contactPerson || ''}
                onChange={(e) => setEditingItem({ ...editingItem, contactPerson: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên thủ kho đối tác"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trạng Thái</label>
              <select
                value={editingItem.status || 'HOAT_DONG'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="HOAT_DONG">Hoạt Động (Cho phép bốc xếp)</option>
                <option value="TAM_NGUNG">Tạm Ngưng (Đóng cửa bảo trì/sửa chữa)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Ghi chú thời gian bốc xếp, phương thức lấy hàng..."
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
              Lưu Kho Đối Tác
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default SupplierWarehousesPage;
