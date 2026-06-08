import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, MapPin, Building, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface ShippingAddressRecord {
  id: string;
  customerCode: string;
  customerName: string;
  phone: string;
  fullAddress: string;
  city: string;
  district: string;
  addressType: 'NHA_RIENG' | 'VAN_PHONG';
  isDefault: boolean;
  notes?: string;
}

const MOCK_ADDRESSES: ShippingAddressRecord[] = [
  {
    id: '1',
    customerCode: 'KH001',
    customerName: 'Nguyễn Văn A',
    phone: '0912345678',
    fullAddress: '123 Đường Láng, Đống Đa, Hà Nội',
    city: 'Hà Nội',
    district: 'Đống Đa',
    addressType: 'NHA_RIENG',
    isDefault: true,
    notes: 'Giao giờ hành chính hoặc tối đều được',
  },
  {
    id: '2',
    customerCode: 'KH002',
    customerName: 'Trần Thị B',
    phone: '0987654321',
    fullAddress: 'Tòa nhà Keangnam, Mễ Trì, Nam Từ Liêm, Hà Nội',
    city: 'Hà Nội',
    district: 'Nam Từ Liêm',
    addressType: 'VAN_PHONG',
    isDefault: false,
    notes: 'Chỉ giao từ thứ 2 đến thứ 6 trước 17h',
  },
];

export function ShippingAddressesPage() {
  const [data, setData] = useState<ShippingAddressRecord[]>(MOCK_ADDRESSES);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ShippingAddressRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ShippingAddressRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.customerName.toLowerCase().includes(q) ||
        d.customerCode.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        d.fullAddress.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      customerCode: '',
      customerName: '',
      phone: '',
      fullAddress: '',
      city: '',
      district: '',
      addressType: 'NHA_RIENG',
      isDefault: false,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ShippingAddressRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.customerCode || !editingItem.customerName || !editingItem.fullAddress) return;

    if (modalMode === 'create') {
      const newItem: ShippingAddressRecord = {
        id: String(data.length + 1),
        customerCode: editingItem.customerCode.toUpperCase(),
        customerName: editingItem.customerName!,
        phone: editingItem.phone || '',
        fullAddress: editingItem.fullAddress!,
        city: editingItem.city || '',
        district: editingItem.district || '',
        addressType: editingItem.addressType as any || 'NHA_RIENG',
        isDefault: editingItem.isDefault || false,
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as ShippingAddressRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<ShippingAddressRecord>[]>(
    () => [
      {
        accessorKey: 'customerCode',
        header: 'Mã Khách Hàng',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Tên Khách Hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'phone',
        header: 'Số Điện Thoại',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'fullAddress',
        header: 'Địa Chỉ Giao Hàng',
        cell: (info) => <span className="truncate max-w-xs block">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'addressType',
        header: 'Loại Địa Chỉ',
        cell: (info) => {
          const val = info.getValue() as string;
          const label = val === 'VAN_PHONG' ? 'Văn Phòng' : 'Nhà Riêng';
          return <span>{label}</span>;
        },
      },
      {
        accessorKey: 'isDefault',
        header: 'Mặc Định',
        cell: (info) => {
          const val = info.getValue() as boolean;
          return val ? (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">Mặc Định</span>
          ) : (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">Phụ</span>
          );
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
              title="Xem Chi Tiết"
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
          <h1 className="text-2xl font-bold">Danh Mục Địa Chỉ Nhận Hàng (Shipping Addresses)</h1>
          <p className="text-sm text-gray-500">
            Xem và cấu hình sổ địa chỉ nhận hàng của khách hàng đối tác, cấu hình địa chỉ giao mặc định hỗ trợ POS lên đơn.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Thêm Địa Chỉ
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã khách hàng, tên khách hàng, số điện thoại, địa chỉ..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Địa chỉ giao hàng: ${selected?.customerName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Khách Hàng:</span>
                <p className="font-mono font-semibold">{selected.customerCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Số Điện Thoại:</span>
                <p className="font-mono">{selected.phone}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" /> Địa Chỉ Giao Hàng Chi Tiết:
              </span>
              <p className="font-semibold text-base text-gray-700 dark:text-gray-300">{selected.fullAddress}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Quận/Huyện:</span>
                <p className="font-semibold">{selected.district}</p>
              </div>
              <div>
                <span className="text-gray-500">Tỉnh/Thành Phố:</span>
                <p className="font-semibold">{selected.city}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Loại Địa Chỉ:</span>
                <p>{selected.addressType === 'VAN_PHONG' ? 'Văn Phòng Công Ty' : 'Nhà Riêng'}</p>
              </div>
              <div>
                <span className="text-gray-500">Mặc Định:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.isDefault ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {selected.isDefault ? 'Đồng Ý Mặc Định' : 'Địa Chỉ Phụ'}
                  </span>
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Giao Nhận:</span>
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
        title={modalMode === 'create' ? 'Thêm Địa Chỉ Giao Hàng Mới' : 'Sửa Địa Chỉ Giao Hàng'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Khách Hàng *</label>
              <input
                type="text"
                value={editingItem.customerCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, customerCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="KHXXX"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tổng Đài / Số Điện Thoại *</label>
              <input
                type="text"
                value={editingItem.phone || ''}
                onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="Số điện thoại"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tên Khách Hàng *</label>
              <input
                type="text"
                value={editingItem.customerName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Họ tên người nhận"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Địa Chỉ Chi Tiết *</label>
              <input
                type="text"
                value={editingItem.fullAddress || ''}
                onChange={(e) => setEditingItem({ ...editingItem, fullAddress: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Số nhà, ngõ/ngách, tên đường..."
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quận / Huyện *</label>
              <input
                type="text"
                value={editingItem.district || ''}
                onChange={(e) => setEditingItem({ ...editingItem, district: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Quận/Huyện"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tỉnh / Thành Phố *</label>
              <input
                type="text"
                value={editingItem.city || ''}
                onChange={(e) => setEditingItem({ ...editingItem, city: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tỉnh/Thành phố"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Loại Địa Chỉ *</label>
              <select
                value={editingItem.addressType || 'NHA_RIENG'}
                onChange={(e) => setEditingItem({ ...editingItem, addressType: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="NHA_RIENG">Nhà Riêng / Cá nhân</option>
                <option value="VAN_PHONG">Văn Phòng / Cơ quan</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="isDefault"
                checked={editingItem.isDefault || false}
                onChange={(e) => setEditingItem({ ...editingItem, isDefault: e.target.checked })}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="isDefault" className="ml-2 block text-xs text-gray-700 dark:text-gray-300">
                Đặt làm địa chỉ mặc định
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={2}
              placeholder="Chỉ dẫn giao nhận..."
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
              Lưu Địa Chỉ
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingAddressesPage;
