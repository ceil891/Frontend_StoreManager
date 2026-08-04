import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type StockOutRecord } from '@/features/inventory/store/inventoryStore';

const TYPE_MAP: Record<string, string> = {
  BAN_HANG: 'Bán hàng',
  TRA_NCC: 'Trả nhà cung cấp',
  HUY_HANG_HONG: 'Xuất hủy hàng hỏng',
  CHUYEN_KHO: 'Chuyển kho',
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  CHO_XU_LY: { label: 'Chờ xử lý', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  DA_XUAT: { label: 'Đã xuất kho', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  DA_HUY: { label: 'Đã hủy', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
};

export function StockOutsPage() {
  const { stockOuts: data, fetchStockOuts, addStockOut, updateStockOut, deleteStockOut } = useInventoryStore();

  useEffect(() => {
    fetchStockOuts();
  }, [fetchStockOuts]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StockOutRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<StockOutRecord>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.stockOutCode.toLowerCase().includes(q) ||
        d.creator.toLowerCase().includes(q) ||
        (d.notes && d.notes.toLowerCase().includes(q))
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      stockOutCode: `SOUT-2026-${Date.now().toString().slice(-4)}`,
      outType: 'BAN_HANG',
      issuedDate: new Date().toISOString().split('T')[0],
      totalItems: 1,
      totalValue: 0,
      creator: '',
      status: 'CHO_XU_LY',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StockOutRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.stockOutCode || !editingItem.creator) return;

    const payload: Omit<StockOutRecord, 'id'> = {
      stockOutCode: editingItem.stockOutCode,
      outType: editingItem.outType || 'BAN_HANG',
      issuedDate: editingItem.issuedDate || new Date().toISOString().split('T')[0],
      totalItems: Number(editingItem.totalItems || 0),
      totalValue: Number(editingItem.totalValue || 0),
      creator: editingItem.creator,
      status: editingItem.status || 'CHO_XU_LY',
      notes: editingItem.notes || '',
    };

    if (modalMode === 'create') {
      await addStockOut(payload);
    } else if (editingItem.id) {
      await updateStockOut(editingItem.id, payload);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      await deleteStockOut(deletingId);
      setDeletingId(null);
      if (selected?.id === deletingId) setSelected(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<StockOutRecord>[]>(
    () => [
      {
        accessorKey: 'stockOutCode',
        header: 'Mã xuất kho',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'issuedDate',
        header: 'Ngày xuất',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'outType',
        header: 'Loại xuất',
        cell: (info) => {
          const type = info.getValue() as string;
          return <span className="font-semibold text-gray-700 dark:text-gray-300">{TYPE_MAP[type] || type}</span>;
        },
      },
      {
        accessorKey: 'totalItems',
        header: 'Số lượng',
        cell: (info) => <span className="font-mono font-bold">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'totalValue',
        header: 'Tổng giá trị',
        cell: (info) => <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'creator',
        header: 'Người lập phiếu',
        cell: (info) => <span className="font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const cfg = STATUS_MAP[status] || { label: status, cls: 'bg-gray-100 text-gray-800' };
          return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button onClick={() => setSelected(row.original)} className="p-1 text-gray-500 hover:text-emerald-600 rounded"><Eye className="w-4 h-4" /></button>
            <button onClick={() => handleOpenEdit(row.original)} className="p-1 text-gray-500 hover:text-blue-600 rounded"><Edit className="w-4 h-4" /></button>
            <button onClick={() => setDeletingId(row.original.id)} className="p-1 text-gray-500 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phiếu xuất kho (Stock Outs)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Xem danh sách, quản lý xuất kho hàng hóa.</p>
        </div>
        <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition text-sm shadow">
          <Plus className="w-4 h-4" /> Lập Phiếu Xuất Kho
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phiếu xuất, người lập, ghi chú..."
          className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Chi tiết xuất kho: ${selected?.stockOutCode}`}>
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã phiếu xuất:</span>
                <p className="font-mono font-semibold text-emerald-600">{selected.stockOutCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Loại xuất kho:</span>
                <p className="font-semibold">{TYPE_MAP[selected.outType] || selected.outType}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Người lập:</span>
                <p className="font-medium">{selected.creator}</p>
              </div>
              <div>
                <span className="text-gray-500">Ngày xuất:</span>
                <p>{selected.issuedDate}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Số lượng:</span>
                <p className="font-mono font-bold text-base">{selected.totalItems} sản phẩm</p>
              </div>
              <div>
                <span className="text-gray-500">Giá trị xuất kho:</span>
                <p className="font-mono font-bold text-base text-emerald-600">{formatCurrency(selected.totalValue)}</p>
              </div>
            </div>
            {selected.notes && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">Ghi chú</p>
                <p className="italic text-gray-700 dark:text-gray-300">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Lập phiếu xuất kho mới' : 'Sửa phiếu xuất kho'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã phiếu xuất *</label>
              <input
                type="text"
                value={editingItem.stockOutCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, stockOutCode: e.target.value })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại xuất kho *</label>
              <select
                value={editingItem.outType || 'BAN_HANG'}
                onChange={(e) => setEditingItem({ ...editingItem, outType: e.target.value as any })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="BAN_HANG">Bán hàng</option>
                <option value="TRA_NCC">Trả nhà cung cấp</option>
                <option value="HUY_HANG_HONG">Xuất hủy hàng hỏng</option>
                <option value="CHUYEN_KHO">Chuyển kho</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người lập phiếu *</label>
              <input
                type="text"
                value={editingItem.creator || ''}
                onChange={(e) => setEditingItem({ ...editingItem, creator: e.target.value })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                placeholder="Nhập tên người lập..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày xuất kho</label>
              <input
                type="date"
                value={editingItem.issuedDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, issuedDate: e.target.value })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng mặt hàng *</label>
              <input
                type="number"
                min={1}
                value={editingItem.totalItems || 1}
                onChange={(e) => setEditingItem({ ...editingItem, totalItems: Number(e.target.value) })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng giá trị xuất (VNĐ) *</label>
              <input
                type="number"
                min={0}
                value={editingItem.totalValue || 0}
                onChange={(e) => setEditingItem({ ...editingItem, totalValue: Number(e.target.value) })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái xử lý</label>
            <select
              value={editingItem.status || 'CHO_XU_LY'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="CHO_XU_LY">Chờ xử lý</option>
              <option value="DA_XUAT">Đã xuất kho</option>
              <option value="DA_HUY">Đã hủy</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm resize-none"
              rows={3}
              placeholder="Chi tiết đơn hàng hoặc lý do xuất kho..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Hủy
            </button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm shadow">
              Lưu phiếu xuất
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Xác nhận xóa phiếu xuất" isDestructive width="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa phiếu xuất kho này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setDeletingId(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">
              Hủy
            </button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
              Xóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
