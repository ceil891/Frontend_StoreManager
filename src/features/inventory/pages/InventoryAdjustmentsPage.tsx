import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, CheckSquare, AlertCircle, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface AdjustmentRecord {
  id: string;
  adjustmentCode: string;
  issuedDate: string;
  handler: string;
  totalIncrease: number; // Qty increase
  totalDecrease: number; // Qty decrease
  reason: string;
  status: 'CHO_DUYET' | 'DA_DONG_BO' | 'DA_HUY';
  notes?: string;
}

const MOCK_ADJUSTMENTS: AdjustmentRecord[] = [
  {
    id: '1',
    adjustmentCode: 'IADJ-2026-001',
    issuedDate: '2026-06-04',
    handler: 'Lưu Hữu Phước',
    totalIncrease: 5,
    totalDecrease: 2,
    reason: 'Đối chiếu kho định kỳ tháng 5 phát hiện thừa thiếu lẻ',
    status: 'DA_DONG_BO',
    notes: 'Đã hoàn tất cộng trừ trực tiếp vào thẻ kho',
  },
  {
    id: '2',
    adjustmentCode: 'IADJ-2026-002',
    issuedDate: '2026-06-03',
    handler: 'Nguyễn Thị Hoa',
    totalIncrease: 0,
    totalDecrease: 15,
    reason: 'Hàng hỏng hết hạn sử dụng không thể bán lẻ',
    status: 'CHO_DUYET',
    notes: 'Đang trình ban giám đốc duyệt khấu trừ giá trị hao hụt',
  },
];

export function InventoryAdjustmentsPage() {
  const [data, setData] = useState<AdjustmentRecord[]>(MOCK_ADJUSTMENTS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdjustmentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<AdjustmentRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.adjustmentCode.toLowerCase().includes(q) ||
        d.handler.toLowerCase().includes(q) ||
        d.reason.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      adjustmentCode: `IADJ-2026-${Date.now().toString().slice(-4)}`,
      issuedDate: new Date().toISOString().split('T')[0],
      handler: '',
      totalIncrease: 0,
      totalDecrease: 0,
      reason: '',
      status: 'CHO_DUYET',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AdjustmentRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.adjustmentCode || !editingItem.handler || !editingItem.reason) return;

    if (modalMode === 'create') {
      const newItem: AdjustmentRecord = {
        id: String(data.length + 1),
        adjustmentCode: editingItem.adjustmentCode!,
        issuedDate: editingItem.issuedDate!,
        handler: editingItem.handler!,
        totalIncrease: Number(editingItem.totalIncrease || 0),
        totalDecrease: Number(editingItem.totalDecrease || 0),
        reason: editingItem.reason!,
        status: editingItem.status as any || 'CHO_DUYET',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as AdjustmentRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phiếu điều chỉnh này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<AdjustmentRecord>[]>(
    () => [
      {
        accessorKey: 'adjustmentCode',
        header: 'Mã Phiếu',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'issuedDate',
        header: 'Ngày Điều Chỉnh',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'handler',
        header: 'Nhân Viên',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalIncrease',
        header: 'Tổng Tăng',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">+{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'totalDecrease',
        header: 'Tổng Giảm',
        cell: (info) => <span className="font-mono font-bold text-red-600">-{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'reason',
        header: 'Lý Do Điều Chỉnh',
        cell: (info) => <span className="truncate max-w-xs block text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-100 text-amber-800';
          let label = 'Chờ Duyệt';
          if (status === 'DA_DONG_BO') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã Đồng Bộ';
          } else if (status === 'DA_HUY') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Đã Hủy';
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
              title="Xem Chi Tiết Phiếu"
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
          <h1 className="text-2xl font-bold">Phiếu Cân Bằng & Điều Chỉnh Kho (Adjustments)</h1>
          <p className="text-sm text-gray-500">
            Ghi nhận chênh lệch số liệu kiểm kho thực tế so với sổ sách, cập nhật thẻ kho tự động.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Lập Phiếu Điều Chỉnh
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phiếu, nhân viên điều chỉnh, lý do..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết phiếu điều chỉnh: ${selected?.adjustmentCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Phiếu:</span>
                <p className="font-mono font-semibold">{selected.adjustmentCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Nhân Viên Thực Hiện:</span>
                <p>{selected.handler}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày Tạo:</span>
                <p className="font-mono">{selected.issuedDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Lý Do:</span>
                <p className="font-medium text-gray-700 dark:text-gray-300">{selected.reason}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Tổng Số Lượng Tăng:</span>
                <p className="font-mono font-bold text-emerald-600 text-lg">+{selected.totalIncrease} món</p>
              </div>
              <div>
                <span className="text-gray-500">Tổng Số Lượng Giảm:</span>
                <p className="font-mono font-bold text-red-600 text-lg">-{selected.totalDecrease} món</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái Đồng Bộ:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_DONG_BO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_DUYET'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_DONG_BO'
                    ? 'Đã Đồng Bộ Vào Thẻ Kho'
                    : selected.status === 'CHO_DUYET'
                    ? 'Chờ Duyệt Cân Bằng'
                    : 'Đã Hủy'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Kho:</span>
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
        title={modalMode === 'create' ? 'Lập Phiếu Điều Chỉnh Kho Mới' : 'Sửa Thông Tin Phiếu'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Phiếu Điều Chỉnh *</label>
              <input
                type="text"
                value={editingItem.adjustmentCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, adjustmentCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nhân Viên Thực Hiện *</label>
              <input
                type="text"
                value={editingItem.handler || ''}
                onChange={(e) => setEditingItem({ ...editingItem, handler: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên nhân viên"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tổng Số Lượng Tăng *</label>
              <input
                type="number"
                value={editingItem.totalIncrease || 0}
                onChange={(e) => setEditingItem({ ...editingItem, totalIncrease: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tổng Số Lượng Giảm *</label>
              <input
                type="number"
                value={editingItem.totalDecrease || 0}
                onChange={(e) => setEditingItem({ ...editingItem, totalDecrease: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Lập Phiếu *</label>
              <input
                type="date"
                value={editingItem.issuedDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, issuedDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lý Do Điều Chỉnh *</label>
              <input
                type="text"
                value={editingItem.reason || ''}
                onChange={(e) => setEditingItem({ ...editingItem, reason: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Ví dụ: Lệch số liệu kiểm tháng"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng Thái Đồng Bộ *</label>
            <select
              value={editingItem.status || 'CHO_DUYET'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="CHO_DUYET">Chờ Duyệt (Chưa ghi vào thẻ kho)</option>
              <option value="DA_DONG_BO">Đồng Ý Bù Trừ (Cập nhật tồn kho)</option>
              <option value="DA_HUY">Hủy Bỏ Phiếu</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú Chi Tiết</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Ghi rõ danh sách SKU lệch..."
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
              Lưu Phiếu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
