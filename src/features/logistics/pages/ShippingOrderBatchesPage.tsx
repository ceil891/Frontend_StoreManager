import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

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


export function ShippingOrderBatchesPage() {
  const [data, setData] = useState<BatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<BatchRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<BatchRecord>>({});

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any[]>('/logistics/batches');
      if (Array.isArray(res)) {
        const mapped = res.map((item: any) => ({
          id: String(item.id),
          batchCode: item.batchCode || `BTC-${item.id}`,
          handoverDate: item.handoverDate || '2026-06-04',
          carrierName: item.carrierName || 'Nhân viên giao nhận',
          totalOrders: Number(item.totalOrders || 5),
          totalWeight: Number(item.totalWeight || 10),
          status: item.status || 'DANG_GOM',
          notes: item.notes || ''
        }));
        setData(mapped);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách đợt gom đơn.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      batchCode: `BTC-${Date.now().toString().slice(-6)}`,
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.batchCode || !editingItem.carrierName) return;

    try {
      const payload = {
        batchCode: editingItem.batchCode,
        handoverDate: editingItem.handoverDate,
        carrierName: editingItem.carrierName,
        totalOrders: Number(editingItem.totalOrders || 0),
        totalWeight: Number(editingItem.totalWeight || 0),
        status: editingItem.status,
        notes: editingItem.notes
      };

      if (modalMode === 'create') {
        await axiosClient.post('/logistics/batches', payload);
        toast.success('Thêm đợt gom đơn mới thành công!');
      } else {
        await axiosClient.put(`/logistics/batches/${editingItem.id}`, payload);
        toast.success('Cập nhật đợt gom đơn thành công!');
      }
      setIsModalOpen(false);
      fetchBatches();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu đợt gom đơn.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa lô gom đơn hàng này?')) {
      try {
        await axiosClient.delete(`/logistics/batches/${id}`);
        toast.success('Đã xóa lô gom đơn thành công!');
        fetchBatches();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi xóa lô gom đơn.');
      }
    }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.batchCode.toLowerCase().includes(q) ||
        d.carrierName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const columns = useMemo<ColumnDef<BatchRecord>[]>(
    () => [
      {
        accessorKey: 'batchCode',
        header: 'Mã lô gom',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'carrierName',
        header: 'Nhân viên / đối tác nhận',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'handoverDate',
        header: 'Ngày bàn giao',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalOrders',
        header: 'Tổng đơn',
        cell: (info) => <span className="font-mono font-semibold">{info.getValue() as number} đơn</span>,
      },
      {
        accessorKey: 'totalWeight',
        header: 'Tổng trọng lượng',
        cell: (info) => <span className="font-mono">{info.getValue() as number} kg</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-100 text-amber-800';
          let label = 'Đang gom đơn';
          if (status === 'DA_BAN_GIAO') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã bàn giao';
          } else if (status === 'DA_HUY') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Đã hủy lô';
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
              title="Xem chi tiết lô gom"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Sửa lô gom"
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
          <h1 className="text-2xl font-bold">Quản lý gom lô bàn giao đơn (shipping batches)</h1>
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-750 shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách đợt gom đơn...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết lô bàn giao: ${selected?.batchCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã lô bàn giao:</span>
                <p className="font-mono font-semibold">{selected.batchCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Ngày bàn giao:</span>
                <p className="font-mono font-semibold">{selected.handoverDate}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Người / đơn vị nhận gom:</span>
              <p className="font-semibold text-base text-blue-600">{selected.carrierName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Tổng số đơn hàng:</span>
                <p className="font-mono font-bold text-lg">{selected.totalOrders} đơn</p>
              </div>
              <div>
                <span className="text-gray-500">Tổng trọng lượng:</span>
                <p className="font-mono font-bold text-lg">{selected.totalWeight} kg</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái lô:</span>
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
                  {selected.status === 'DA_BAN_GIAO' ? 'Đã bàn giao cho shipper' : selected.status === 'DANG_GOM' ? 'Đang gom lô đơn' : 'Đã hủy lô'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú lô gom:</span>
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
        title={modalMode === 'create' ? 'Tạo lô gom bàn giao mới' : 'Sửa lô gom bàn giao'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã lô gom *</label>
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
              <label className="block text-xs text-gray-500 mb-1">Ngày bàn giao *</label>
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
            <label className="block text-xs text-gray-500 mb-1">Người / đơn vị nhận bàn giao *</label>
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
              <label className="block text-xs text-gray-500 mb-1">Tổng số đơn hàng *</label>
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
            <label className="block text-xs text-gray-500 mb-1">Trạng thái lô *</label>
            <select
              value={editingItem.status || 'DANG_GOM'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="DANG_GOM">Đang Gom Đơn (Chưa xuất bãi)</option>
              <option value="DA_BAN_GIAO">Đã Bàn Giao Cho Shipper (Đang đi giao)</option>
              <option value="DA_HUY">Hủy bỏ lô bàn giao</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
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
              Lưu lô gom
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingOrderBatchesPage;
