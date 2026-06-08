import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, UserCheck, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface DeliveryNoteRecord {
  id: string;
  noteCode: string;
  waybillCode: string;
  issuedDate: string;
  customerName: string;
  totalWeight: number; // in kg
  itemCount: number;
  deliveryStaff: string;
  status: 'CHO_BAN_GIAO' | 'DA_BAN_GIAO' | 'BI_TU_CHOI';
  notes?: string;
}

const MOCK_NOTES: DeliveryNoteRecord[] = [
  {
    id: '1',
    noteCode: 'DN-2026-001',
    waybillCode: 'WB-2026-001',
    issuedDate: '2026-06-04',
    customerName: 'Nguyễn Văn A',
    totalWeight: 4.5,
    itemCount: 3,
    deliveryStaff: 'Nguyễn Văn Tài xế',
    status: 'CHO_BAN_GIAO',
    notes: 'Hàng dễ vỡ, vui lòng nhắc nhở nhân viên xếp cẩn thận',
  },
  {
    id: '2',
    noteCode: 'DN-2026-002',
    waybillCode: 'WB-2026-002',
    issuedDate: '2026-06-03',
    customerName: 'Trần Thị B',
    totalWeight: 12.0,
    itemCount: 10,
    deliveryStaff: 'Nguyễn Văn Tài xế',
    status: 'DA_BAN_GIAO',
    notes: 'Đã giao hàng và ký biên bản giao nhận hàng hóa thành công',
  },
];

export function DeliveryNotesPage() {
  const [data, setData] = useState<DeliveryNoteRecord[]>(MOCK_NOTES);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DeliveryNoteRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<DeliveryNoteRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.noteCode.toLowerCase().includes(q) ||
        d.waybillCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.deliveryStaff.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      noteCode: `DN-2026-${Date.now().toString().slice(-4)}`,
      waybillCode: '',
      issuedDate: new Date().toISOString().split('T')[0],
      customerName: '',
      totalWeight: 0,
      itemCount: 0,
      deliveryStaff: '',
      status: 'CHO_BAN_GIAO',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DeliveryNoteRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.noteCode || !editingItem.waybillCode || !editingItem.customerName) return;

    if (modalMode === 'create') {
      const newItem: DeliveryNoteRecord = {
        id: String(data.length + 1),
        noteCode: editingItem.noteCode!,
        waybillCode: editingItem.waybillCode!,
        issuedDate: editingItem.issuedDate!,
        customerName: editingItem.customerName!,
        totalWeight: Number(editingItem.totalWeight || 0),
        itemCount: Number(editingItem.itemCount || 0),
        deliveryStaff: editingItem.deliveryStaff || '',
        status: editingItem.status as any || 'CHO_BAN_GIAO',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as DeliveryNoteRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa biên bản giao hàng này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<DeliveryNoteRecord>[]>(
    () => [
      {
        accessorKey: 'noteCode',
        header: 'Mã Biên Bản',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'waybillCode',
        header: 'Mã Vận Đơn',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách Hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'itemCount',
        header: 'Số Lượng',
        cell: (info) => <span className="font-mono">{info.getValue() as number} món</span>,
      },
      {
        accessorKey: 'deliveryStaff',
        header: 'Nhân Viên Giao',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Tình Trạng',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-gray-100 text-gray-800';
          let label = 'Chờ Bàn Giao';
          if (status === 'DA_BAN_GIAO') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã Bàn Giao';
          } else if (status === 'BI_TU_CHOI') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Khách Từ Chối';
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
          <h1 className="text-2xl font-bold">Biên Bản Bàn Giao Hàng Hóa</h1>
          <p className="text-sm text-gray-500">
            Xem và lập các phiếu/biên bản xác nhận bàn nhận giao hàng thực tế ký tay của khách hàng.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Lập Biên Bản Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã biên bản, mã vận đơn, khách hàng, nhân viên giao..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Biên Bản: ${selected?.noteCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Biên Bản:</span>
                <p className="font-mono font-semibold">{selected.noteCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã Vận Đơn:</span>
                <p className="font-mono font-semibold">{selected.waybillCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách Hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày Lập Biên Bản:</span>
                <p className="font-mono">{selected.issuedDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Nhân Viên Vận Chuyển:</span>
                <p>{selected.deliveryStaff || 'Chưa phân công'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Tổng Trọng Lượng:</span>
                <p className="font-mono">{selected.totalWeight} kg</p>
              </div>
              <div>
                <span className="text-gray-500">Số Lượng Hàng:</span>
                <p className="font-mono">{selected.itemCount} sản phẩm</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái Bàn Giao:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_BAN_GIAO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_BAN_GIAO'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_BAN_GIAO'
                    ? 'Đã Bàn Giao'
                    : selected.status === 'CHO_BAN_GIAO'
                    ? 'Chờ Bàn Giao'
                    : 'Khách Từ Chối'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú / Phản Hồi Từ Khách:</span>
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
        title={modalMode === 'create' ? 'Lập Biên Bản Bàn Giao Hàng' : 'Sửa Biên Bản Bàn Giao'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Biên Bản *</label>
              <input
                type="text"
                value={editingItem.noteCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, noteCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Vận Đơn *</label>
              <input
                type="text"
                value={editingItem.waybillCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, waybillCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="WB-2026-XXX"
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
              placeholder="Khách mua nhận hàng"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nhân Viên Vận Chuyển</label>
              <input
                type="text"
                value={editingItem.deliveryStaff || ''}
                onChange={(e) => setEditingItem({ ...editingItem, deliveryStaff: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên nhân viên giao hàng"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Lập Biên Bản *</label>
              <input
                type="date"
                value={editingItem.issuedDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, issuedDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tổng Trọng Lượng (kg)</label>
              <input
                type="number"
                step="0.1"
                value={editingItem.totalWeight || 0}
                onChange={(e) => setEditingItem({ ...editingItem, totalWeight: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Số Lượng Sản Phẩm</label>
              <input
                type="number"
                value={editingItem.itemCount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, itemCount: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tình Trạng Bàn Giao *</label>
            <select
              value={editingItem.status || 'CHO_BAN_GIAO'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="CHO_BAN_GIAO">Chờ Bàn Giao</option>
              <option value="DA_BAN_GIAO">Đã Giao Xong / Khách Ký Nhận</option>
              <option value="BI_TU_CHOI">Khách Từ Chối Nhận Hàng (Trả Lại Kho)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Ghi chú chi tiết lý do từ chối hoặc tình trạng hàng..."
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
              Lưu Phiếu Giao
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
