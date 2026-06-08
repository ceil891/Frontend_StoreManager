import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ShieldCheck, Link2, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface CarrierRecord {
  id: string;
  carrierCode: string;
  carrierName: string;
  phone: string;
  address: string;
  apiStatus: 'CONNECTED' | 'DISCONNECTED' | 'SUSPENDED';
  serviceTypes: string;
  notes?: string;
}

const MOCK_CARRIERS: CarrierRecord[] = [
  {
    id: '1',
    carrierCode: 'CR-GHTK',
    carrierName: 'Giao Hàng Tiết Kiệm (GHTK)',
    phone: '19006092',
    address: '8 Phạm Hùng, Cầu Giấy, Hà Nội',
    apiStatus: 'CONNECTED',
    serviceTypes: 'Nhanh, Tiết Kiệm, Đường Bộ',
    notes: 'Đơn vị vận chuyển chính cho các đơn đi tỉnh miền Bắc và miền Trung',
  },
  {
    id: '2',
    carrierCode: 'CR-GHN',
    carrierName: 'Giao Hàng Nhanh (GHN)',
    phone: '1900636671',
    address: '405/15 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP. HCM',
    apiStatus: 'CONNECTED',
    serviceTypes: 'Nhanh, Chuẩn, Hỏa Tốc',
    notes: 'Hỗ trợ lấy hàng nhanh tại khu vực phía Nam',
  },
  {
    id: '3',
    carrierCode: 'CR-VTP',
    carrierName: 'Viettel Post',
    phone: '19008095',
    address: 'Tòa nhà Viettel, Cầu Giấy, Hà Nội',
    apiStatus: 'DISCONNECTED',
    serviceTypes: 'Chuyển Phát Nhanh, Tiết Kiệm',
    notes: 'Đang tạm dừng kết nối API để bảo trì hệ thống đồng bộ mã vận đơn',
  },
];

export function ShippingCarriersPage() {
  const [data, setData] = useState<CarrierRecord[]>(MOCK_CARRIERS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CarrierRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<CarrierRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.carrierCode.toLowerCase().includes(q) ||
        d.carrierName.toLowerCase().includes(q) ||
        d.phone.includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      carrierCode: '',
      carrierName: '',
      phone: '',
      address: '',
      apiStatus: 'DISCONNECTED',
      serviceTypes: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CarrierRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.carrierCode || !editingItem.carrierName) return;

    if (modalMode === 'create') {
      const newItem: CarrierRecord = {
        id: String(data.length + 1),
        carrierCode: editingItem.carrierCode.toUpperCase(),
        carrierName: editingItem.carrierName!,
        phone: editingItem.phone || '',
        address: editingItem.address || '',
        apiStatus: editingItem.apiStatus as any || 'DISCONNECTED',
        serviceTypes: editingItem.serviceTypes || 'Nhanh',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as CarrierRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa đối tác vận chuyển này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<CarrierRecord>[]>(
    () => [
      {
        accessorKey: 'carrierCode',
        header: 'Mã Đối Tác',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'carrierName',
        header: 'Đơn Vị Vận Chuyển',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'phone',
        header: 'Tổng Đài Hỗ Trợ',
        cell: (info) => <span className="font-mono text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'serviceTypes',
        header: 'Dịch Vụ Cung Cấp',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'apiStatus',
        header: 'Đồng Bộ API',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-gray-100 text-gray-800';
          let label = 'Chưa Kết Nối';
          if (status === 'CONNECTED') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã Kết Nối';
          } else if (status === 'SUSPENDED') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Tạm Khóa';
          }
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
              title="Xem Chi Tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Cấu Hình API / Sửa"
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
          <h1 className="text-2xl font-bold">Đối Tác Vận Chuyển (Carriers)</h1>
          <p className="text-sm text-gray-500">
            Quản lý danh sách các đơn vị chuyển phát liên kết ngoài, theo dõi trạng thái tích hợp API tạo đơn tự động.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Thêm Đối Tác
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã đối tác, tên đơn vị vận chuyển..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết đối tác: ${selected?.carrierName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Đơn Vị:</span>
                <p className="font-mono font-semibold">{selected.carrierCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Tổng Đài Hỗ Trợ:</span>
                <p className="font-mono">{selected.phone}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên Đối Tác Vận Chuyển:</span>
              <p className="font-semibold">{selected.carrierName}</p>
            </div>
            <div>
              <span className="text-gray-500">Địa Chỉ Văn Phòng / Trụ Sở:</span>
              <p className="text-gray-700 dark:text-gray-300">{selected.address}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Các Dịch Vụ:</span>
                <p>{selected.serviceTypes}</p>
              </div>
              <div>
                <span className="text-gray-500">Trạng Thái Kết Nối API:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.apiStatus === 'CONNECTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selected.apiStatus === 'DISCONNECTED'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selected.apiStatus === 'CONNECTED'
                      ? 'Đã Kết Nối API'
                      : selected.apiStatus === 'DISCONNECTED'
                      ? 'Chưa Kết Nối'
                      : 'Đang Tạm Khóa'}
                  </span>
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Vận Hành:</span>
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
        title={modalMode === 'create' ? 'Thêm Đơn Vị Vận Chuyển Đối Tác' : 'Sửa Thông Tin Đơn Vị'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Đối Tác *</label>
              <input
                type="text"
                value={editingItem.carrierCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, carrierCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="CR-XXXX"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tổng Đài Hỗ Trợ *</label>
              <input
                type="text"
                value={editingItem.phone || ''}
                onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="1900XXXX"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên Đối Tác Vận Chuyển *</label>
            <input
              type="text"
              value={editingItem.carrierName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, carrierName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Tên công ty vận chuyển"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Địa Chỉ Trụ Sở *</label>
            <input
              type="text"
              value={editingItem.address || ''}
              onChange={(e) => setEditingItem({ ...editingItem, address: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Địa chỉ công ty"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dịch Vụ Cung Cấp *</label>
              <input
                type="text"
                value={editingItem.serviceTypes || ''}
                onChange={(e) => setEditingItem({ ...editingItem, serviceTypes: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Nhanh, Tiết kiệm, Hỏa tốc"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đồng Bộ API</label>
              <select
                value={editingItem.apiStatus || 'DISCONNECTED'}
                onChange={(e) => setEditingItem({ ...editingItem, apiStatus: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="DISCONNECTED">Chưa Kết Nối (Gọi thủ công)</option>
                <option value="CONNECTED">Đã Kết Nối (Tự động đồng bộ)</option>
                <option value="SUSPENDED">Tạm Dừng Đồng Bộ (Khóa kết nối)</option>
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
              placeholder="Chi tiết tài khoản API kết nối hoặc thông tin liên hệ bưu cục..."
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
              Lưu Đối Tác
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
