import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface BatchRecord {
  id: string;
  batchCode: string;
  handoverDate: string;
  carrierName: string; // Partner or internal shipper
  totalOrders: number;
  totalWeight: number; // in kg
  status: 'DANG_GOM' | 'DA_BAN_GIAO' | 'DA_HUY';
  notes?: string;
}

const MOCK_BATCHES: BatchRecord[] = [
  {
    id: '1',
    batchCode: 'BTC-2026-001',
    handoverDate: '2026-06-04',
    carrierName: 'Giao Hàng Tiết Kiệm (GHTK)',
    totalOrders: 18,
    totalWeight: 22.4,
    status: 'DA_BAN_GIAO',
    notes: 'Bàn giao lô đơn đi tỉnh miền Bắc bưu cục Cầu Giấy',
  },
  {
    id: '2',
    batchCode: 'BTC-2026-002',
    handoverDate: '2026-06-04',
    carrierName: 'Shipper Nguyễn Văn Tài xế (Nội bộ)',
    totalOrders: 5,
    totalWeight: 8.5,
    status: 'DANG_GOM',
    notes: 'Đang xếp gom các đơn quận Đống Đa đi giao chiều',
  },
];

export function ShippingOrderBatchesPage() {
  const [data, setData] = useState<BatchRecord[]>(MOCK_BATCHES);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<BatchRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<BatchRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.batchCode.toLowerCase().includes(q) ||
        d.carrierName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      batchCode: `BTC-2026-${Date.now().toString().slice(-4)}`,
      handoverDate: new Date().toISOString().split('T')[0],
      carrierName: '',
      totalOrders: 0,
      totalWeight: 0,
      status: 'DANG_GOM',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: BatchRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.batchCode || !editingItem.carrierName) return;

    if (modalMode === 'create') {
      const newItem: BatchRecord = {
        id: String(data.length + 1),
        batchCode: editingItem.batchCode!.toUpperCase(),
        handoverDate: editingItem.handoverDate!,
        carrierName: editingItem.carrierName!,
        totalOrders: Number(editingItem.totalOrders || 0),
        totalWeight: Number(editingItem.totalWeight || 0),
        status: editingItem.status as any || 'DANG_GOM',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as BatchRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa lô gom đơn hàng này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<BatchRecord>[]>(
    () => [
      {
        accessorKey: 'batchCode',
        header: 'Mã Lô Gom',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'carrierName',
        header: 'Nhân Viên / Đối Tác Nhận',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'handoverDate',
        header: 'Ngày Bàn Giao',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalOrders',
        header: 'Tổng Đơn',
        cell: (info) => <span className="font-mono font-semibold">{info.getValue() as number} đơn</span>,
      },
      {
        accessorKey: 'totalWeight',
        header: 'Tổng Trọng Lượng',
        cell: (info) => <span className="font-mono">{info.getValue() as number} kg</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-100 text-amber-800';
          let label = 'Đang Gom Đơn';
          if (status === 'DA_BAN_GIAO') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã Bàn Giao';
          } else if (status === 'DA_HUY') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Đã Hủy Lô';
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
              title="Xem Chi Tiết Lô Gom"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Sửa Lô Gom"
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
          <h1 className="text-2xl font-bold">Quản Lý Gom Lô Bàn Giao Đơn (Shipping Batches)</h1>
          <p className="text-sm text-gray-500">
            Xem và lập các phiếu bàn giao đồng loạt nhiều đơn vận chuyển cho một bưu tá bưu cục đối tác hoặc shipper nội bộ của cửa hàng.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Tạo Lô Bàn Giao Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã lô gom đơn, đơn vị nhận bàn giao..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết lô bàn giao: ${selected?.batchCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Lô Bàn Giao:</span>
                <p className="font-mono font-semibold">{selected.batchCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Ngày Bàn Giao:</span>
                <p className="font-mono font-semibold">{selected.handoverDate}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Người / Đơn Vị Nhận Gom:</span>
              <p className="font-semibold text-base text-blue-600">{selected.carrierName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Tổng Số Đơn Hàng:</span>
                <p className="font-mono font-bold text-lg">{selected.totalOrders} đơn</p>
              </div>
              <div>
                <span className="text-gray-500">Tổng Trọng Lượng:</span>
                <p className="font-mono font-bold text-lg">{selected.totalWeight} kg</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái Lô:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_BAN_GIAO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'DANG_GOM'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_BAN_GIAO' ? 'Đã Bàn Giao Cho Shipper' : selected.status === 'DANG_GOM' ? 'Đang Gom Lô Đơn' : 'Đã Hủy Lô'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Lô Gom:</span>
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
        title={modalMode === 'create' ? 'Tạo Lô Gom Bàn Giao Mới' : 'Sửa Lô Gom Bàn Giao'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Lô Gom *</label>
              <input
                type="text"
                value={editingItem.batchCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, batchCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Bàn Giao *</label>
              <input
                type="date"
                value={editingItem.handoverDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, handoverDate: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Người / Đơn Vị Nhận Bàn Giao *</label>
            <input
              type="text"
              value={editingItem.carrierName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, carrierName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Chọn GHTK, GHN, hoặc Shipper nội bộ"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tổng Số Đơn Hàng *</label>
              <input
                type="number"
                value={editingItem.totalOrders || 0}
                onChange={(e) => setEditingItem({ ...editingItem, totalOrders: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
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
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng Thái Lô *</label>
            <select
              value={editingItem.status || 'DANG_GOM'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="DANG_GOM">Đang Gom Đơn (Chưa xuất bãi)</option>
              <option value="DA_BAN_GIAO">Đã Bàn Giao Cho Shipper (Đang đi giao)</option>
              <option value="DA_HUY">Hủy Bỏ Lô Bàn Giao</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={2}
              placeholder="Ghi chú thêm..."
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
              Lưu Lô Gom
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingOrderBatchesPage;
