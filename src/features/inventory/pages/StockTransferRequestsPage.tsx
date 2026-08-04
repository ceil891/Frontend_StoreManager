import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ArrowRightLeft, Calendar, User, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { toast } from 'sonner';

interface TransferRequestItem {
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
}

interface StockTransferRequestRecord {
  id: string;
  requestCode: string;
  sourceWarehouse: string; // Kho xuất đi
  destinationWarehouse: string; // Kho nhận về
  requestDate: string; // Ngày đề xuất
  proposedBy: string; // Người yêu cầu
  status: 'CHỜ_PHÊ_DUYỆT' | 'ĐÃ_PHÊ_DUYỆT' | 'BỊ_TỪ_CHỐI';
  reason?: string;
  items: TransferRequestItem[];
}

export function StockTransferRequestsPage() {
  const { 
    stockTransfers: data, 
    fetchStockTransfers,
    addStockTransfer,
    updateStockTransfer,
    deleteStockTransfer,
    products,
    fetchProducts
  } = useInventoryStore();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    fetchStockTransfers();
    fetchProducts();
  }, [fetchStockTransfers, fetchProducts]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<any>({});

  const [transferItems, setTransferItems] = useState<{ id: string; sku: string; productName: string; quantity: number; unit: string }[]>([
    { id: '1', sku: 'SKU-001', productName: 'Cà phê hạt Gu Chốt 500g', quantity: 50, unit: 'Gói' }
  ]);

  const handleAddTransferItem = () => {
    const p = products[0];
    setTransferItems(prev => [
      ...prev,
      { id: Date.now().toString(), sku: p?.sku || 'SKU-NEW', productName: p?.name || 'Sản phẩm mới', quantity: 10, unit: 'Hộp' }
    ]);
  };

  const handleRemoveTransferItem = (id: string) => {
    setTransferItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateTransferItem = (id: string, field: string, value: any) => {
    setTransferItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (field === 'sku') {
        const p = products.find(prod => prod.sku === value);
        return { ...item, sku: value, productName: p?.name || item.productName };
      }
      return { ...item, [field]: value };
    }));
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d: any) =>
        d.transferNumber.toLowerCase().includes(q) ||
        d.sourceHub.toLowerCase().includes(q) ||
        d.destinationHub.toLowerCase().includes(q) ||
        d.requestedBy.toLowerCase().includes(q)
    );

  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      transferNumber: `STR-2026-${Date.now().toString().slice(-4)}`,
      sourceHub: 'Tổng kho Thủ Đức',
      destinationHub: 'Chi nhánh Quận 1',
      dispatchDate: new Date().toISOString().split('T')[0],
      requestedBy: user?.name || 'Quản lý kho hiện tại',
      status: 'PENDING_APPROVAL',
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
    if (!editingItem.transferNumber || !editingItem.sourceHub || !editingItem.destinationHub) return;

    try {
      if (modalMode === 'create') {
        await addStockTransfer(editingItem);
        toast.success('Đã gửi đề xuất chuyển kho thành công!');
      } else {
        if ((editingItem.status === 'APPROVED' || editingItem.status === 'COMPLETED' || editingItem.status === 'REJECTED') && !isSuperAdmin) {
          toast.error('Chỉ Super Admin mới có quyền phê duyệt hoặc từ chối đề xuất chuyển kho!');
          return;
        }
        await updateStockTransfer(editingItem.id, editingItem);
        toast.success('Cập nhật phiếu chuyển kho thành công!');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu phiếu chuyển kho.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSuperAdmin) {
      toast.error('Chỉ Super Admin mới có quyền xóa phiếu chuyển kho!');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xóa phiếu đề xuất này?')) {
      try {
        await deleteStockTransfer(id);
        toast.success('Đã xóa phiếu đề xuất thành công!');
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi xóa phiếu đề xuất.');
      }
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'transferNumber',
        header: 'Mã yêu cầu chuyển',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sourceHub',
        header: 'Kho xuất đi',
        cell: (info) => <span className="font-semibold text-gray-800 dark:text-gray-200">{info.getValue() as string}</span>,
      },
      {
        id: 'direction',
        header: 'Hướng chuyển',
        cell: () => <ArrowRightLeft className="w-4 h-4 text-gray-400 mx-auto" />,
      },
      {
        accessorKey: 'destinationHub',
        header: 'Kho nhận về',
        cell: (info) => <span className="font-semibold text-gray-800 dark:text-gray-200">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'dispatchDate',
        header: 'Ngày đề xuất',
        cell: (info) => (
          <span className="font-mono flex items-center gap-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'requestedBy',
        header: 'Người yêu cầu',
        cell: (info) => (
          <span className="flex items-center gap-1 text-xs">
            <User className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái Duyệt',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
          let icon = <Clock className="w-3.5 h-3.5" />;

          if (status === 'COMPLETED' || status === 'APPROVED') {
            badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            icon = <CheckCircle2 className="w-3.5 h-3.5" />;
          } else if (status === 'REJECTED' || status === 'CANCELLED') {
            badgeClass = 'bg-red-50 text-red-700 border-red-200';
            icon = <XCircle className="w-3.5 h-3.5" />;
          }

          let label = status;
          if (status === 'PENDING_APPROVAL') label = 'Chờ Duyệt';
          else if (status === 'COMPLETED') label = 'Hoàn tất';
          else if (status === 'REJECTED') label = 'Từ chối';
          else if (status === 'CANCELLED') label = 'Hủy';

          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
            >
              {icon} {label}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
              title="Sửa / Phê duyệt"
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yêu cầu chuyển kho</h1>
          <p className="text-sm text-gray-500">
            Xem và lập các phiếu đề xuất luân chuyển hàng hoá nội bộ giữa các chi nhánh hoặc kho tổng.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tạo Yêu Cầu Chuyển Hàng
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-150 dark:border-gray-750 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã yêu cầu, kho xuất, kho nhận, người yêu cầu..."
          className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết yêu cầu: ${selected?.transferNumber}`}
      >
        {selected && (
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã yêu cầu:</span>
                <p className="font-mono font-semibold">{selected.transferNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">Ngày đề xuất:</span>
                <p>{selected.dispatchDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border dark:border-gray-750">
              <div className="flex-1">
                <span className="text-gray-500 text-xs block mb-1">Kho xuất (nguồn):</span>
                <p className="font-semibold">{selected.sourceHub}</p>
              </div>
              <ArrowRightLeft className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <span className="text-gray-500 text-xs block mb-1">Kho nhận (đích):</span>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">{selected.destinationHub}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Người yêu cầu:</span>
                <p className="font-medium">{selected.requestedBy}</p>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Lý do / ghi chú:</span>
                <p className="text-gray-700 bg-amber-50 dark:bg-gray-800 p-2 rounded text-sm italic">"{selected.notes}"</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '🔄 Tạo đề xuất chuyển kho mới' : '⚙️ Cập nhật & phê duyệt phiếu chuyển kho'}
        width="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã yêu cầu chuyển *</label>
              <input
                type="text"
                value={editingItem.transferNumber || ''}
                onChange={(e) => setEditingItem({ ...editingItem, transferNumber: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="STR-XXXX"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày đề xuất chuyển *</label>
              <input
                type="date"
                value={editingItem.dispatchDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, dispatchDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Kho xuất (nguồn) *</label>
              <input
                type="text"
                value={editingItem.sourceHub || ''}
                onChange={(e) => setEditingItem({ ...editingItem, sourceHub: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Tổng kho Thủ Đức..."
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Kho nhận (đích) *</label>
              <input
                type="text"
                value={editingItem.destinationHub || ''}
                onChange={(e) => setEditingItem({ ...editingItem, destinationHub: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Chi nhánh Quận 1..."
                required
              />
            </div>
          </div>

          {/* Product Items Table for Stock Transfer */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
                📦 Danh sách mặt hàng chuyển kho ({transferItems.length})
              </span>
              <button
                type="button"
                onClick={handleAddTransferItem}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm mặt hàng
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Sản phẩm / SKU</th>
                    <th className="p-2 w-28 text-center">Số lượng chuyển</th>
                    <th className="p-2 w-24">Đơn vị</th>
                    <th className="p-2 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {transferItems.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2">
                        <select
                          value={item.sku}
                          onChange={(e) => handleUpdateTransferItem(item.id, 'sku', e.target.value)}
                          className="w-full p-1 border rounded bg-white dark:bg-gray-900 text-xs font-medium"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.sku}>{p.sku} - {p.name}</option>
                          ))}
                          {!products.some(p => p.sku === item.sku) && (
                            <option value={item.sku}>{item.sku} - {item.productName}</option>
                          )}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleUpdateTransferItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-center font-bold"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleUpdateTransferItem(item.id, 'unit', e.target.value)}
                          className="w-full p-1 border rounded text-center"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveTransferItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Người đề xuất *</label>
              <input
                type="text"
                value={editingItem.requestedBy || ''}
                onChange={(e) => setEditingItem({ ...editingItem, requestedBy: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trạng thái xử lý</label>
              <select
                value={editingItem.status || 'PENDING_APPROVAL'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                disabled={!isSuperAdmin}
              >
                <option value="PENDING_APPROVAL">⏳ Chờ phê Duyệt</option>
                <option value="APPROVED">🟢 Đã phê Duyệt (Chỉ Admin)</option>
                <option value="REJECTED">🔴 Bị từ chối (Chỉ Admin)</option>
                <option value="CANCELLED">⚪ Hủy phiếu</option>
              </select>
              {!isSuperAdmin && (
                <p className="text-[10px] text-red-500 mt-1">Chỉ Super Admin mới có quyền duyệt/từ chối.</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lý do đề xuất chuyển kho</label>
            <textarea
              value={editingItem.reason || ''}
              onChange={(e) => setEditingItem({ ...editingItem, reason: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Ghi rõ lý do như bù tồn kho, sự kiện khuyến mãi..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition text-gray-700 dark:text-gray-300"
            >
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition">
              {modalMode === 'create' ? 'Tạo phiếu đề xuất' : 'Cập nhật phiếu'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
