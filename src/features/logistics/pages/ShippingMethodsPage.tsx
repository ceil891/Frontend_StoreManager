import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, Truck, Clock, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface ShippingMethodRecord {
  id: string;
  methodCode: string;
  methodName: string;
  description: string;
  estimatedHours: number;
  baseFee: number;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export function ShippingMethodsPage() {
  const [data, setData] = useState<ShippingMethodRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ShippingMethodRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ShippingMethodRecord>>({});

  const fetchMethods = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any[]>('/logistics/methods');
      if (Array.isArray(res)) {
        const mapped = res.map((item: any) => ({
          id: String(item.id),
          methodCode: item.methodCode || `SM-${item.id}`,
          methodName: item.methodName || 'Phương thức giao hàng',
          description: item.description || '',
          estimatedHours: Number(item.estimatedHours || 24),
          baseFee: Number(item.baseFee || 0),
          status: item.status || 'ACTIVE',
          notes: item.notes || ''
        }));
        setData(mapped);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách hình thức giao hàng.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      methodCode: `SM-${Date.now().toString().slice(-6)}`,
      methodName: '',
      description: '',
      estimatedHours: 24,
      baseFee: 30000,
      status: 'ACTIVE',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ShippingMethodRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.methodCode || !editingItem.methodName) return;

    try {
      const payload = {
        methodCode: editingItem.methodCode,
        methodName: editingItem.methodName,
        description: editingItem.description,
        estimatedHours: Number(editingItem.estimatedHours || 0),
        baseFee: Number(editingItem.baseFee || 0),
        status: editingItem.status,
        notes: editingItem.notes
      };

      if (modalMode === 'create') {
        await axiosClient.post('/logistics/methods', payload);
        toast.success('Thêm hình thức vận chuyển mới thành công!');
      } else {
        await axiosClient.put(`/logistics/methods/${editingItem.id}`, payload);
        toast.success('Cập nhật hình thức vận chuyển thành công!');
      }
      setIsModalOpen(false);
      fetchMethods();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu hình thức vận chuyển.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phương thức vận chuyển này?')) {
      try {
        await axiosClient.delete(`/logistics/methods/${id}`);
        toast.success('Đã xóa hình thức vận chuyển thành công!');
        fetchMethods();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi xóa hình thức vận chuyển.');
      }
    }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.methodCode.toLowerCase().includes(q) ||
        d.methodName.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
    );
  }, [search, data]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<ShippingMethodRecord>[]>(
    () => [
      {
        accessorKey: 'methodCode',
        header: 'Mã phương thức',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'methodName',
        header: 'Tên phương thức',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'estimatedHours',
        header: 'Hạn giao (dự kiến)',
        cell: (info) => <span className="font-mono">{info.getValue() as number} giờ</span>,
      },
      {
        accessorKey: 'baseFee',
        header: 'Phí cơ bản',
        cell: (info) => <span className="font-mono text-emerald-600 font-bold">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
          const label = status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa';
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
              title="Xem chi tiết"
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
          <h1 className="text-2xl font-bold">Hình thức giao hàng (shipping methods)</h1>
          <p className="text-sm text-gray-500">
            Quản lý các hình thức vận chuyển, phí giao hàng cơ bản và thời gian giao hàng dự kiến phục vụ lên đơn bán hàng.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Thêm Hình Thức
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phương thức, tên hình thức..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-750 shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách phương thức giao hàng...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết hình thức: ${selected?.methodName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã hình thức:</span>
                <p className="font-mono font-semibold">{selected.methodCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Phí giao cơ bản:</span>
                <p className="font-mono font-bold text-emerald-600">{formatCurrency(selected.baseFee)}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên hình thức vận chuyển:</span>
              <p className="font-semibold text-base">{selected.methodName}</p>
            </div>
            <div>
              <span className="text-gray-500">Mô tả dịch vụ:</span>
              <p className="text-gray-700 dark:text-gray-300">{selected.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" /> Hạn Giao Dự Kiến:
                </span>
                <p className="font-mono font-semibold">{selected.estimatedHours} giờ</p>
              </div>
              <div>
                <span className="text-gray-500">Trạng thái:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selected.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                  </span>
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú thêm:</span>
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
        title={modalMode === 'create' ? 'Thêm hình thức giao hàng mới' : 'Sửa hình thức'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã phương thức *</label>
              <input
                type="text"
                value={editingItem.methodCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, methodCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="SM-XXXX"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tên hình thức *</label>
              <input
                type="text"
                value={editingItem.methodName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, methodName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên phương thức"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mô tả dịch vụ</label>
            <input
              type="text"
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Chi tiết cách thức giao hàng"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thời gian dự kiến (giờ) *</label>
              <input
                type="number"
                value={editingItem.estimatedHours || 0}
                onChange={(e) => setEditingItem({ ...editingItem, estimatedHours: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phí giao hàng cơ bản (VND) *</label>
              <input
                type="number"
                value={editingItem.baseFee || 0}
                onChange={(e) => setEditingItem({ ...editingItem, baseFee: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng thái *</label>
            <select
              value={editingItem.status || 'ACTIVE'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Tạm khóa</option>
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
              Lưu hình thức
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingMethodsPage;
