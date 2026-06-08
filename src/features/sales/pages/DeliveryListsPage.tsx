import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, MapPin, Truck, CheckCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface DeliveryRecord {
  id: string;
  waybillCode: string;
  orderCode: string;
  customerName: string;
  shippingAddress: string;
  carrierName: string;
  createdDate: string;
  expectedDeliveryDate: string;
  status: 'CHO_GIAO' | 'DANG_GIAO' | 'DA_GIAO' | 'THAT_BAI';
  notes?: string;
}

const MOCK_DELIVERIES: DeliveryRecord[] = [
  {
    id: '1',
    waybillCode: 'WB-2026-001',
    orderCode: 'SO-2026-001',
    customerName: 'Nguyễn Văn A',
    shippingAddress: '123 Đường Láng, Đống Đa, Hà Nội',
    carrierName: 'Giao Hàng Tiết Kiệm (GHTK)',
    createdDate: '2026-06-04',
    expectedDeliveryDate: '2026-06-06',
    status: 'DANG_GIAO',
    notes: 'Đang vận chuyển từ kho tổng Hà Nội',
  },
  {
    id: '2',
    waybillCode: 'WB-2026-002',
    orderCode: 'SO-2026-002',
    customerName: 'Trần Thị B',
    shippingAddress: '456 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
    carrierName: 'Giao Hàng Nhanh (GHN)',
    createdDate: '2026-06-03',
    expectedDeliveryDate: '2026-06-05',
    status: 'DA_GIAO',
    notes: 'Khách đã ký nhận và thanh toán COD đầy đủ',
  },
  {
    id: '3',
    waybillCode: 'WB-2026-003',
    orderCode: 'SO-2026-003',
    customerName: 'Lê Văn C',
    shippingAddress: '789 Hùng Vương, Đà Nẵng',
    carrierName: 'Viettel Post',
    createdDate: '2026-06-01',
    expectedDeliveryDate: '2026-06-03',
    status: 'THAT_BAI',
    notes: 'Không liên lạc được với người nhận sau 3 lần giao',
  },
];

export function DeliveryListsPage() {
  const [data, setData] = useState<DeliveryRecord[]>(MOCK_DELIVERIES);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DeliveryRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<DeliveryRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.waybillCode.toLowerCase().includes(q) ||
        d.orderCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.carrierName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      waybillCode: `WB-2026-${Date.now().toString().slice(-4)}`,
      orderCode: '',
      customerName: '',
      shippingAddress: '',
      carrierName: '',
      createdDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      status: 'CHO_GIAO',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DeliveryRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.waybillCode || !editingItem.orderCode || !editingItem.customerName) return;

    if (modalMode === 'create') {
      const newItem: DeliveryRecord = {
        id: String(data.length + 1),
        waybillCode: editingItem.waybillCode!,
        orderCode: editingItem.orderCode!,
        customerName: editingItem.customerName!,
        shippingAddress: editingItem.shippingAddress || '',
        carrierName: editingItem.carrierName || '',
        createdDate: editingItem.createdDate!,
        expectedDeliveryDate: editingItem.expectedDeliveryDate || editingItem.createdDate!,
        status: editingItem.status as any || 'CHO_GIAO',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as DeliveryRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa thông tin vận đơn này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<DeliveryRecord>[]>(
    () => [
      {
        accessorKey: 'waybillCode',
        header: 'Mã Vận Đơn',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'orderCode',
        header: 'Mã Đơn SO',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách Hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'carrierName',
        header: 'Đơn Vị Vận Chuyển',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'expectedDeliveryDate',
        header: 'Ngày Giao Dự Kiến',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-gray-100 text-gray-800';
          let label = 'Chờ Giao';
          if (status === 'DANG_GIAO') {
            badgeClass = 'bg-blue-100 text-blue-800';
            label = 'Đang Giao';
          } else if (status === 'DA_GIAO') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã Giao';
          } else if (status === 'THAT_BAI') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Giao Thất Bại';
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
          <h1 className="text-2xl font-bold">Danh Sách Vận Đơn Giao Hàng</h1>
          <p className="text-sm text-gray-500">
            Theo dõi quá trình giao nhận hàng cho khách hàng, liên kết thông tin đối tác vận chuyển và trạng thái giao hàng thực tế.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Tạo Vận Đơn Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã vận đơn, mã đơn hàng, tên khách hàng, đối tác vận chuyển..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Vận Đơn: ${selected?.waybillCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Vận Đơn:</span>
                <p className="font-mono font-semibold">{selected.waybillCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã Đơn SO:</span>
                <p className="font-mono font-semibold">{selected.orderCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách Hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div>
              <span className="text-gray-500 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" /> Địa Chỉ Nhận Hàng:
              </span>
              <p className="font-medium text-gray-700 dark:text-gray-300">{selected.shippingAddress}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 flex items-center gap-1">
                  <Truck className="w-4 h-4 text-gray-400" /> Đơn Vị Vận Chuyển:
                </span>
                <p>{selected.carrierName}</p>
              </div>
              <div>
                <span className="text-gray-500">Trạng Thái Giao Hàng:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.status === 'DA_GIAO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selected.status === 'DANG_GIAO'
                        ? 'bg-blue-100 text-blue-800'
                        : selected.status === 'THAT_BAI'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selected.status === 'DA_GIAO'
                      ? 'Đã Giao'
                      : selected.status === 'DANG_GIAO'
                      ? 'Đang Giao'
                      : selected.status === 'THAT_BAI'
                      ? 'Giao Thất Bại'
                      : 'Chờ Giao'}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày Tạo:</span>
                <p className="font-mono">{selected.createdDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Hạn Giao Hàng:</span>
                <p className="font-mono">{selected.expectedDeliveryDate}</p>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Hành Trình:</span>
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
        title={modalMode === 'create' ? 'Tạo Vận Đơn Mới' : 'Sửa Thông Tin Vận Đơn'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Vận Đơn *</label>
              <input
                type="text"
                value={editingItem.waybillCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, waybillCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Đơn Hàng SO *</label>
              <input
                type="text"
                value={editingItem.orderCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, orderCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="SO-2026-XXX"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên Khách Hàng *</label>
            <input
              type="text"
              value={editingItem.customerName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Khách mua hàng"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Địa Chỉ Nhận Hàng *</label>
            <input
              type="text"
              value={editingItem.shippingAddress || ''}
              onChange={(e) => setEditingItem({ ...editingItem, shippingAddress: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Địa chỉ giao hàng đầy đủ"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đơn Vị Vận Chuyển *</label>
              <input
                type="text"
                value={editingItem.carrierName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, carrierName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="GHTK, GHN, Viettel Post, v.v."
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Tạo Vận Đơn *</label>
              <input
                type="date"
                value={editingItem.createdDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, createdDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Giao Dự Kiến *</label>
              <input
                type="date"
                value={editingItem.expectedDeliveryDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, expectedDeliveryDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trạng Thái *</label>
              <select
                value={editingItem.status || 'CHO_GIAO'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="CHO_GIAO">Chờ Giao</option>
                <option value="DANG_GIAO">Đang Giao</option>
                <option value="DA_GIAO">Đã Giao</option>
                <option value="THAT_BAI">Giao Thất Bại</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú Hành Trình</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Ghi chú chi tiết..."
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
              Lưu Vận Đơn
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
