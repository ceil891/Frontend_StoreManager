import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, UserCheck, CheckCircle2, Clock, Scale, Box, ArrowRight } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface PackageItem {
  productName: string;
  sku: string;
  quantity: number;
}

interface PackingListRecord {
  id: string;
  packingCode: string; // Mã đóng gói
  sourceOrder: string; // Đơn hàng nguồn
  weight: number; // Trọng lượng đóng gói (kg)
  dimensions: string; // Kích thước (Dài x Rộng x Cao cm)
  packerName: string; // Người đóng gói
  packingDate: string; // Ngày đóng gói
  status: 'ĐÃ_ĐÓNG_GÓI' | 'CHỜ_ĐÓNG_GÓI';
  notes?: string;
  items: PackageItem[];
}

export function PackingListsPage() {
  const [data, setData] = useState<PackingListRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PackingListRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<PackingListRecord>>({});

  const fetchPackingLists = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any[]>('/wms/packing-lists');
      if (Array.isArray(res)) {
        const mapped = res.map((item: any) => ({
          id: String(item.id),
          packingCode: item.packingCode || `PKG-${item.id}`,
          sourceOrder: item.sourceOrder || 'SO-2026-X',
          weight: Number(item.weight || 0),
          dimensions: item.dimensions || '20 x 15 x 10',
          packerName: item.packerName || 'Nhân viên kho',
          packingDate: item.packingDate || '2026-06-04',
          status: (item.status === 'COMPLETED' ? 'ĐÃ_ĐÓNG_GÓI' : 'CHỜ_ĐÓNG_GÓI') as PackingListRecord['status'],
          notes: item.notes || '',
          items: Array.isArray(item.items) ? item.items.map((it: any) => ({
            productName: it.productName || 'Sản phẩm',
            sku: it.sku || 'SKU',
            quantity: Number(it.quantity || 1)
          })) : []
        }));
        setData(mapped);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách phiếu đóng gói.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackingLists();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      packingCode: `PKG-${Date.now().toString().slice(-6)}`,
      sourceOrder: '',
      weight: 1.0,
      dimensions: '20 x 20 x 20',
      packerName: 'Trần Minh Hoàng',
      packingDate: new Date().toISOString().split('T')[0],
      status: 'CHỜ_ĐÓNG_GÓI',
      notes: '',
      items: [{ productName: 'Sản phẩm demo', sku: 'DEMO-SKU', quantity: 1 }],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PackingListRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.packingCode || !editingItem.sourceOrder || !editingItem.packerName) return;

    try {
      const payload = {
        packingCode: editingItem.packingCode,
        sourceOrder: editingItem.sourceOrder,
        weight: Number(editingItem.weight || 0),
        dimensions: editingItem.dimensions,
        packerName: editingItem.packerName,
        packingDate: editingItem.packingDate,
        status: editingItem.status === 'ĐÃ_ĐÓNG_GÓI' ? 'COMPLETED' : 'PENDING',
        notes: editingItem.notes,
        items: editingItem.items
      };

      if (modalMode === 'create') {
        await axiosClient.post('/wms/packing-lists', payload);
        toast.success('Tạo phiếu đóng gói thành công!');
      } else {
        await axiosClient.put(`/wms/packing-lists/${editingItem.id}`, payload);
        toast.success('Cập nhật phiếu đóng gói thành công!');
      }
      setIsModalOpen(false);
      fetchPackingLists();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Lỗi vi phạm ràng buộc dữ liệu backend!';
      toast.error(`Không thể lưu phiếu đóng gói: ${msg}`);
    }
  };

  const handleDelete = async (id: string) => {
    setSelected(null);
    if (confirm('Bạn có chắc chắn muốn xóa phiếu đóng gói này?')) {
      try {
        await axiosClient.delete(`/wms/packing-lists/${id}`);
        toast.success('Đã xóa phiếu đóng gói thành công!');
        fetchPackingLists();
      } catch (err: any) {
        console.error(err);
        toast.error('Lỗi vi phạm ràng buộc khi xóa phiếu đóng gói.');
      }
    }
  };

  const columns = useMemo<ColumnDef<PackingListRecord>[]>(
    () => [
      {
        accessorKey: 'packingCode',
        header: 'Mã đóng gói',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sourceOrder',
        header: 'Đơn hàng nguồn',
        cell: (info) => <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'weight',
        header: 'Trọng lượng (kg)',
        cell: (info) => (
          <span className="font-mono flex items-center gap-1 text-xs">
            <Scale className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as number} kg
          </span>
        ),
      },
      {
        accessorKey: 'dimensions',
        header: 'Kích thước (cm)',
        cell: (info) => (
          <span className="font-mono flex items-center gap-1 text-xs">
            <Box className="w-3.5 h-3.5 text-blue-500" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'packerName',
        header: 'Người đóng gói',
        cell: (info) => (
          <span className="flex items-center gap-1 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'packingDate',
        header: 'Ngày đóng gói',
        cell: (info) => (
          <span className="font-mono flex items-center gap-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const isPacked = status === 'ĐÃ_ĐÓNG_GÓI';
          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isPacked ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
              }`}
            >
              {isPacked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {isPacked ? 'Đã đóng gói' : 'Chờ đóng gói'}
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
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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

  const filtered = data.filter(item =>
    item.packingCode.toLowerCase().includes(search.toLowerCase()) ||
    item.sourceOrder.toLowerCase().includes(search.toLowerCase()) ||
    item.packerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phiếu đóng gói kiện hàng</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi quá trình cân đo trọng lượng, kích thước kiện hàng, người thực hiện đóng gói đơn hàng trước khi xuất kho giao nhận
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm mới phiếu đóng gói
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo mã đóng gói, mã đơn hàng nguồn, người đóng gói..."
          className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách phiếu đóng gói...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      {/* Modal Xem chi tiết */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Chi tiết phiếu đóng gói: ${selected.packingCode}` : 'Thông tin đóng gói'}
        width="max-w-md"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500">Mã đóng gói</span>
                <p className="font-mono font-semibold text-primary">{selected.packingCode}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Đơn hàng nguồn</span>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{selected.sourceOrder}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 dark:border-gray-800 py-3">
              <div>
                <span className="text-xs text-gray-500 block">Trọng lượng thực tế</span>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{selected.weight} kg</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Kích thước thùng (D x R x C)</span>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{selected.dimensions} cm</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500">Người đóng gói</span>
                <p className="text-gray-900 dark:text-white">{selected.packerName}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Ngày đóng gói</span>
                <p className="font-mono text-gray-900 dark:text-white">{selected.packingDate}</p>
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-500">Tình trạng kiện hàng</span>
              <div className="mt-1">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'ĐÃ_ĐÓNG_GÓI'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selected.status === 'ĐÃ_ĐÓNG_GÓI' ? 'Đã đóng gói' : 'Chờ đóng gói'}
                </span>
              </div>
            </div>

            {selected.notes && (
              <div>
                <span className="text-xs text-gray-500">Ghi chú đóng gói</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg text-gray-700 dark:text-gray-300 text-xs">
                  {selected.notes}
                </p>
              </div>
            )}

            <div>
              <span className="text-xs text-gray-500 block mb-2">Các mặt hàng bên trong kiện</span>
              <div className="border rounded-lg overflow-hidden border-gray-200 dark:border-gray-700">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 uppercase font-bold border-b border-gray-200 dark:border-gray-700">
                      <th className="p-2.5">Tên mặt hàng</th>
                      <th className="p-2.5">Mã SKU</th>
                      <th className="p-2.5 text-right">Số lượng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                    {selected.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                        <td className="p-2.5 font-medium text-gray-900 dark:text-white">{it.productName}</td>
                        <td className="p-2.5 font-mono text-gray-500">{it.sku}</td>
                        <td className="p-2.5 font-mono font-semibold text-right text-primary">
                          {it.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Tạo Phiếu Đóng Gói */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm mới phiếu đóng gói' : 'Cập nhật phiếu đóng gói'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã phiếu đóng gói *</label>
              <input
                type="text"
                value={editingItem.packingCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, packingCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-sm"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn hàng nguồn (mã SO) *</label>
              <input
                type="text"
                value={editingItem.sourceOrder || ''}
                onChange={(e) => setEditingItem({ ...editingItem, sourceOrder: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm"
                placeholder="SO-2026-XXX"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trọng lượng thực tế (kg) *</label>
              <input
                type="number"
                step="0.01"
                value={editingItem.weight || 0}
                onChange={(e) => setEditingItem({ ...editingItem, weight: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg font-mono bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm"
                required
                min={0.01}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kích thước thùng (D x R x C cm) *</label>
              <input
                type="text"
                value={editingItem.dimensions || ''}
                onChange={(e) => setEditingItem({ ...editingItem, dimensions: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm"
                placeholder="Ví dụ: 30 x 20 x 15"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhân viên đóng gói *</label>
              <input
                type="text"
                value={editingItem.packerName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, packerName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái đóng gói *</label>
              <select
                value={editingItem.status || 'CHỜ_ĐÓNG_GÓI'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm"
              >
                <option value="CHỜ_ĐÓNG_GÓI">Chờ đóng gói</option>
                <option value="ĐÃ_ĐÓNG_GÓI">Đã đóng gói xong</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú đóng gói / vật liệu phụ trợ</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm"
              rows={2}
              placeholder="Ví dụ: Có lót xốp bong bóng, bọc màng PE..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition text-gray-700 dark:text-gray-300 text-sm font-medium"
            >
              Hủy bỏ
            </button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition font-medium text-sm shadow-sm">
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
