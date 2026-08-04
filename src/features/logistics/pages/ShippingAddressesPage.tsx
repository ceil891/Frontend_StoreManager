import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, MapPin, Building, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';
import { useAreaStore } from '@/features/crm/store/areaStore';

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

export function ShippingAddressesPage() {
  const [data, setData] = useState<ShippingAddressRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ShippingAddressRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ShippingAddressRecord>>({});

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any[]>('/logistics/addresses');
      if (Array.isArray(res)) {
        const mapped = res.map((item: any) => ({
          id: String(item.id),
          customerCode: item.customerCode || `KH-${item.id}`,
          customerName: item.customerName || 'Khách hàng',
          phone: item.phone || '',
          fullAddress: item.fullAddress || '',
          city: item.city || 'Hà Nội',
          district: item.district || '',
          addressType: item.addressType || 'NHA_RIENG',
          isDefault: !!item.isDefault,
          notes: item.notes || ''
        }));
        setData(mapped);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách địa chỉ giao hàng.');
    } finally {
      setIsLoading(false);
    }
  };

  const { areas, fetchAreas } = useAreaStore();

  useEffect(() => {
    fetchAddresses();
    fetchAreas();
  }, [fetchAreas]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      customerCode: `KH-${Date.now().toString().slice(-6)}`,
      customerName: '',
      phone: '',
      fullAddress: '',
      city: 'Hà Nội',
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.customerCode || !editingItem.customerName || !editingItem.fullAddress) return;

    try {
      const payload = {
        customerCode: editingItem.customerCode,
        customerName: editingItem.customerName,
        phone: editingItem.phone,
        fullAddress: editingItem.fullAddress,
        city: editingItem.city,
        district: editingItem.district,
        addressType: editingItem.addressType,
        isDefault: !!editingItem.isDefault,
        notes: editingItem.notes
      };

      if (modalMode === 'create') {
        await axiosClient.post('/logistics/addresses', payload);
        toast.success('Thêm địa chỉ giao hàng mới thành công!');
      } else {
        await axiosClient.put(`/logistics/addresses/${editingItem.id}`, payload);
        toast.success('Cập nhật địa chỉ giao hàng thành công!');
      }
      setIsModalOpen(false);
      fetchAddresses();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu địa chỉ giao hàng.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      try {
        await axiosClient.delete(`/logistics/addresses/${id}`);
        toast.success('Đã xóa địa chỉ giao hàng thành công!');
        fetchAddresses();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi xóa địa chỉ giao hàng.');
      }
    }
  };

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

  const columns = useMemo<ColumnDef<ShippingAddressRecord>[]>(
    () => [
      {
        accessorKey: 'customerCode',
        header: 'Mã khách hàng',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Tên khách hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'phone',
        header: 'Số điện thoại',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'fullAddress',
        header: 'Địa chỉ giao hàng',
        cell: (info) => <span className="truncate max-w-xs block">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'addressType',
        header: 'Loại địa chỉ',
        cell: (info) => {
          const val = info.getValue() as string;
          const label = val === 'VAN_PHONG' ? 'Văn Phòng' : 'Nhà riêng';
          return <span>{label}</span>;
        },
      },
      {
        accessorKey: 'isDefault',
        header: 'Mặc định',
        cell: (info) => {
          const val = info.getValue() as boolean;
          return val ? (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">Mặc định</span>
          ) : (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">Phụ</span>
          );
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
              title="Xem chi tiết"
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
          <h1 className="text-2xl font-bold">Danh mục địa chỉ nhận hàng (shipping addresses)</h1>
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-750 shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách địa chỉ giao hàng...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      {/* Modal Xem chi tiết địa chỉ căn giữa (TC-ALL-1) */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Chi tiết địa chỉ giao hàng: ${selected.customerName}` : 'Thông tin địa chỉ'}
        width="max-w-lg"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã KH:</span>
                <p className="font-mono font-semibold">{selected.customerCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Số điện thoại:</span>
                <p className="font-mono font-bold text-emerald-600">{selected.phone}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Họ và tên người nhận:</span>
              <p className="font-semibold text-base">{selected.customerName}</p>
            </div>
            <div>
              <span className="text-gray-500">Địa chỉ giao hàng đầy đủ:</span>
              <p className="text-gray-700 dark:text-gray-300 font-medium">{selected.fullAddress}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Phân loại địa chỉ:</span>
                <p className="font-semibold">{selected.addressType === 'NHA_RIENG' ? 'Nhà Riêng / Cá nhân' : 'Văn Phòng / Cơ quan'}</p>
              </div>
              <div>
                <span className="text-gray-500">Đặc tính:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.isDefault ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {selected.isDefault ? 'Địa chỉ mặc định' : 'Địa chỉ phụ'}
                  </span>
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú giao nhận:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.notes}
                </p>
              </div>
            )}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-sm"
              >
                Đóng Hộp Thoại
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm địa chỉ giao hàng mới' : 'Sửa địa chỉ giao hàng'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã khách hàng *</label>
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
              <label className="block text-xs text-gray-500 mb-1">Tổng đài / số điện thoại *</label>
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
          <datalist id="area-shipping-address-suggestions">
            {areas.map((area) => (
              <option key={area.id} value={area.parentName ? `${area.name}, ${area.parentName}` : area.name} />
            ))}
          </datalist>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tên khách hàng *</label>
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
              <label className="block text-xs text-gray-500 mb-1">Địa chỉ chi tiết (Có gợi ý khu vực) *</label>
              <input
                type="text"
                list="area-shipping-address-suggestions"
                value={editingItem.fullAddress || ''}
                onChange={(e) => setEditingItem({ ...editingItem, fullAddress: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Nhập hoặc chọn gợi ý địa chỉ khu vực..."
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quận / huyện *</label>
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
              <label className="block text-xs text-gray-500 mb-1">Tỉnh / thành phố *</label>
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
              <label className="block text-xs text-gray-500 mb-1">Loại địa chỉ *</label>
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
            <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
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
              Lưu địa chỉ
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingAddressesPage;
