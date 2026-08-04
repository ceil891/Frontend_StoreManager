import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, CheckSquare, AlertCircle, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';

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

export function InventoryAdjustmentsPage() {
  const { inventoryChecks: data, fetchInventoryChecks, addInventoryCheck, updateInventoryCheck, deleteInventoryCheck } = useInventoryStore();

  useEffect(() => {
    fetchInventoryChecks();
  }, [fetchInventoryChecks]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<any>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d: any) =>
        d.checkCode.toLowerCase().includes(q) ||
        d.checkedBy.toLowerCase().includes(q) ||
        (d.notes && d.notes.toLowerCase().includes(q))
    );

  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      checkCode: `IADJ-2026-${Date.now().toString().slice(-4)}`,
      checkDate: new Date().toISOString().split('T')[0],
      checkedBy: '',
      netVariance: 0,
      discrepancyCount: 0,
      status: 'DRAFT',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.checkCode || !editingItem.checkedBy) return;

    const payload = {
      checkCode: editingItem.checkCode,
      branchId: 1,
      checkDate: editingItem.checkDate || new Date().toISOString().split('T')[0],
      notes: editingItem.notes || '',
    };

    if (modalMode === 'create') {
      await addInventoryCheck(payload);
    } else if (editingItem.id) {
      await updateInventoryCheck(editingItem.id, { notes: editingItem.notes });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteInventoryCheck(id);
    if (selected?.id === id) setSelected(null);
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'checkCode',
        header: 'Mã điều chỉnh',
        cell: (info) => <span className="font-mono font-bold text-blue-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'checkDate',
        header: 'Ngày lập',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'checkedBy',
        header: 'Người lập phiếu',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'notes',
        header: 'Lý do / ghi chú',
        cell: (info) => <span className="text-gray-600 truncate block max-w-[200px]">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'netVariance',
        header: 'Chênh lệch',
        cell: (info) => <span className="font-mono text-emerald-600 font-bold">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'discrepancyCount',
        header: 'Số sản phẩm lệch',
        cell: (info) => <span className="font-mono text-red-600 font-bold">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-gray-100 text-gray-800';
          let label = 'Bản nháp';
          if (status === 'COMPLETED') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã đồng bộ';
          } else if (status === 'CANCELLED') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Đã hủy';
          }
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
              title="Xem chi tiết phiếu"
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
          <h1 className="text-2xl font-bold">Phiếu cân bằng & điều chỉnh kho (adjustments)</h1>
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

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết phiếu điều chỉnh: ${selected?.checkCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã phiếu điều chỉnh:</span>
                <p className="font-mono font-semibold">{selected.checkCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Ngày lập:</span>
                <p>{selected.checkDate}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Người lập:</span>
                <p className="font-semibold">{selected.checkedBy}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Ghi chú điều chỉnh:</span>
              <p className="text-gray-700 bg-gray-50 p-2 rounded">{selected.notes}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Chênh lệch giá trị:</span>
                <p className="font-mono font-bold text-emerald-600 text-lg">{selected.netVariance}</p>
              </div>
              <div>
                <span className="text-gray-500">Sản phẩm lệch:</span>
                <p className="font-mono font-bold text-red-600 text-lg">{selected.discrepancyCount}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái đồng bộ:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'DRAFT'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'COMPLETED' ? 'Đã đồng bộ kho' : selected.status === 'DRAFT' ? 'Bản nháp' : 'Đã hủy'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Lập phiếu điều chỉnh kho mới' : 'Sửa thông tin phiếu'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã phiếu điều chỉnh *</label>
              <input
                type="text"
                value={editingItem.checkCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, checkCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50"
                placeholder="IADJ-XXXX"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Người lập phiếu *</label>
              <input
                type="text"
                value={editingItem.checkedBy || ''}
                onChange={(e) => setEditingItem({ ...editingItem, checkedBy: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên nhân viên..."
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Lý do điều chỉnh / ghi chú *</label>
            <input
              type="text"
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="VD: Điều chỉnh kho định kỳ tháng 6..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Chênh lệch giá trị</label>
              <input
                type="number"
                value={editingItem.netVariance || 0}
                onChange={(e) => setEditingItem({ ...editingItem, netVariance: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sản phẩm lệch</label>
              <input
                type="number"
                value={editingItem.discrepancyCount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, discrepancyCount: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng thái đồng bộ *</label>
            <select
              value={editingItem.status || 'DRAFT'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="DRAFT">Bản nháp</option>
              <option value="COMPLETED">Đã đồng bộ (thẻ kho)</option>
              <option value="CANCELLED">Hủy phiếu</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
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
              Lưu phiếu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
