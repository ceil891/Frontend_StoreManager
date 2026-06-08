import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, ShieldCheck, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface SupplierDeliveryRecord {
  id: string;
  deliveryCode: string;
  poCode: string;
  supplierName: string;
  expectedDate: string;
  actualDate?: string;
  receiver: string;
  status: 'CHO_GIAO' | 'DA_NHAN' | 'DA_HUY';
  notes?: string;
}

const MOCK_DELIVERIES: SupplierDeliveryRecord[] = [
  {
    id: '1',
    deliveryCode: 'SD-2026-001',
    poCode: 'PO-2026-881',
    supplierName: 'Nhà Cung Cấp Toàn Cầu',
    expectedDate: '2026-06-10',
    receiver: 'Lưu Hữu Phước',
    status: 'CHO_GIAO',
    notes: 'Giao đợt 1 gồm 500 thùng nước ngọt',
  },
  {
    id: '2',
    deliveryCode: 'SD-2026-002',
    poCode: 'PO-2026-882',
    supplierName: 'Công Ty Nhập Khẩu Á Châu',
    expectedDate: '2026-06-02',
    actualDate: '2026-06-03',
    receiver: 'Nguyễn Thị Hoa',
    status: 'DA_NHAN',
    notes: 'Đã nhận đủ và kiểm kho không phát hiện lỗi',
  },
  {
    id: '3',
    deliveryCode: 'SD-2026-003',
    poCode: 'PO-2026-883',
    supplierName: 'Tổng Kho Thực Phẩm HN',
    expectedDate: '2026-05-28',
    status: 'DA_HUY',
    receiver: 'Trần Văn Mạnh',
    notes: 'Hủy đơn do nhà cung cấp hết hàng đột xuất',
  },
];

export function SupplierDeliveriesPage() {
  const [data, setData] = useState<SupplierDeliveryRecord[]>(MOCK_DELIVERIES);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SupplierDeliveryRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SupplierDeliveryRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.deliveryCode.toLowerCase().includes(q) ||
        d.poCode.toLowerCase().includes(q) ||
        d.supplierName.toLowerCase().includes(q) ||
        d.receiver.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      deliveryCode: `SD-${Date.now().toString().slice(-6)}`,
      poCode: '',
      supplierName: '',
      expectedDate: new Date().toISOString().split('T')[0],
      receiver: '',
      status: 'CHO_GIAO',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SupplierDeliveryRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.deliveryCode || !editingItem.poCode || !editingItem.supplierName) return;

    if (modalMode === 'create') {
      const newItem: SupplierDeliveryRecord = {
        id: String(data.length + 1),
        deliveryCode: editingItem.deliveryCode!,
        poCode: editingItem.poCode!,
        supplierName: editingItem.supplierName!,
        expectedDate: editingItem.expectedDate!,
        actualDate: editingItem.actualDate,
        receiver: editingItem.receiver || '',
        status: editingItem.status as any || 'CHO_GIAO',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as SupplierDeliveryRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa lịch sử giao hàng này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<SupplierDeliveryRecord>[]>(
    () => [
      {
        accessorKey: 'deliveryCode',
        header: 'Mã Đợt Giao',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'poCode',
        header: 'Mã Đơn Mua (PO)',
        cell: (info) => <span className="font-mono font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà Cung Cấp',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'expectedDate',
        header: 'Ngày Giao Dự Kiến',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass =
            status === 'DA_NHAN'
              ? 'bg-emerald-100 text-emerald-800'
              : status === 'CHO_GIAO'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800';
          const label = status === 'DA_NHAN' ? 'Đã Nhận' : status === 'CHO_GIAO' ? 'Chờ Giao' : 'Đã Hủy';
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
          <h1 className="text-2xl font-bold">Quản Lý Nhận Hàng Nhà Cung Cấp</h1>
          <p className="text-sm text-gray-500">
            Theo dõi, kiểm tra tình trạng các đợt giao nhận hàng từ nhà cung cấp theo đơn đặt mua.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Tạo Đợt Nhận Hàng
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã đợt giao, mã PO, nhà cung cấp, người nhận..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết đợt nhận hàng: ${selected?.deliveryCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Đợt Giao:</span>
                <p className="font-mono font-semibold">{selected.deliveryCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã PO Đơn Mua:</span>
                <p className="font-mono font-semibold">{selected.poCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Nhà Cung Cấp:</span>
              <p className="font-semibold">{selected.supplierName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày Giao Dự Kiến:</span>
                <p className="font-mono">{selected.expectedDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Ngày Giao Thực Tế:</span>
                <p className="font-mono">{selected.actualDate || 'Chưa nhận hàng'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Người Nhận Hàng:</span>
                <p>{selected.receiver || 'Chưa phân công'}</p>
              </div>
              <div>
                <span className="text-gray-500">Trạng Thái:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.status === 'DA_NHAN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selected.status === 'CHO_GIAO'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selected.status === 'DA_NHAN' ? 'Đã Nhận' : selected.status === 'CHO_GIAO' ? 'Chờ Giao' : 'Đã Hủy'}
                  </span>
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú / Nội Dung:</span>
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
        title={modalMode === 'create' ? 'Tạo Đợt Nhận Hàng Mới' : 'Sửa Thông Tin Đợt Nhận Hàng'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Đợt Giao</label>
              <input
                type="text"
                value={editingItem.deliveryCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, deliveryCode: e.target.value })}
                className="w-full p-2 border rounded bg-gray-50 font-mono"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã PO Đơn Mua *</label>
              <input
                type="text"
                value={editingItem.poCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, poCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="PO-2026-XXX"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nhà Cung Cấp *</label>
            <input
              type="text"
              value={editingItem.supplierName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, supplierName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Tên nhà cung cấp"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Giao Dự Kiến *</label>
              <input
                type="date"
                value={editingItem.expectedDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, expectedDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Giao Thực Tế</label>
              <input
                type="date"
                value={editingItem.actualDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, actualDate: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Người Nhận Hàng</label>
              <input
                type="text"
                value={editingItem.receiver || ''}
                onChange={(e) => setEditingItem({ ...editingItem, receiver: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên người nhận"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trạng Thái</label>
              <select
                value={editingItem.status || 'CHO_GIAO'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="CHO_GIAO">Chờ Giao</option>
                <option value="DA_NHAN">Đã Nhận</option>
                <option value="DA_HUY">Đã Hủy</option>
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
              placeholder="Chi tiết đợt giao..."
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
              Lưu Lại
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
