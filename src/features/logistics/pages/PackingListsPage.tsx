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
          status: item.status === 'COMPLETED' ? 'ĐÃ_ĐÓNG_GÓI' : 'CHỜ_ĐÓNG_GÓI',
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
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu phiếu đóng gói.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phiếu đóng gói này?')) {
      try {
        await axiosClient.delete(`/wms/packing-lists/${id}`);
        toast.success('Đã xóa phiếu đóng gói thành công!');
        fetchPackingLists();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi xóa phiếu đóng gói.');
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
        header: 'Trọng Lượng (kg)',
        cell: (info) => (
          <span className="font-mono flex items-center gap-1 text-xs">
            <Scale className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as number} kg
          </span>
        ),
      },
      {
        accessorKey: 'dimensions',
        header: 'Kích Thước (cm)',
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
                isPacked ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {isPacked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {status.replace('_', ' ')}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phiếu đóng gói kiện hàng</h1>
          <p className="text-sm text-gray-500">
            Theo dõi quá trình cân đo trọng lượng, kích thước kiện hàng, người thực hiện đóng gói đơn hàng trước khi xuất kho giao nhận.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tạo Phiếu Đóng Gói Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-150 dark:border-gray-750 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã đóng gói, mã đơn hàng nguồn, tên người đóng gói..."
          className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-850 rounded-2xl border border-gray-150 dark:border-gray-750 shadow-sm">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách phiếu đóng gói...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      {/* Drawer Chi Tiết Kiện Hàng */}
      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Kiện Hàng: ${selected?.packingCode}`}
      >
        {selected && (
          <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Mã đóng gói:</span>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{selected.packingCode}</p>
              </div>
              <div>
                <span className="text-gray-400">Đơn hàng nguồn:</span>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{selected.sourceOrder}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 dark:border-gray-800 py-3">
              <div>
                <span className="text-gray-400 block text-xs">Trọng lượng thực tế:</span>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{selected.weight} kg</p>
              </div>
              <div>
                <span className="text-gray-400 block text-xs">Kích thước thùng (dxrxc):</span>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{selected.dimensions} cm</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Người đóng gói:</span>
                <p className="text-gray-900 dark:text-white">{selected.packerName}</p>
              </div>
              <div>
                <span className="text-gray-400">Ngày đóng gói:</span>
                <p className="font-mono text-gray-900 dark:text-white">{selected.packingDate}</p>
              </div>
            </div>

            <div>
              <span className="text-gray-400">Tình trạng kiện hàng:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'ĐÃ_ĐÓNG_GÓI'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selected.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {selected.notes && (
              <div>
                <span className="text-gray-400">Ghi chú đóng gói:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded text-gray-800 dark:text-gray-300 font-sans">
                  {selected.notes}
                </p>
              </div>
            )}

            <div>
              <span className="text-gray-400 block mb-2">Các mặt hàng bên trong kiện:</span>
              <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 uppercase font-bold border-b dark:border-gray-750">
                      <th className="p-2.5">Tên mặt hàng</th>
                      <th className="p-2.5">Mã SKU</th>
                      <th className="p-2.5 text-right">Số lượng đóng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-750 text-xs">
                    {selected.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                        <td className="p-2.5 font-medium text-gray-900 dark:text-white">{it.productName}</td>
                        <td className="p-2.5 font-mono text-gray-500">{it.sku}</td>
                        <td className="p-2.5 font-mono font-semibold text-right text-emerald-600 dark:text-emerald-400">
                          {it.quantity} cái
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal Tạo Phiếu Đóng Gói */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo phiếu đóng gói đơn hàng' : 'Cập nhật phiếu đóng gói'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã phiếu đóng gói *</label>
              <input
                type="text"
                value={editingItem.packingCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, packingCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đơn hàng nguồn (mã SO) *</label>
              <input
                type="text"
                value={editingItem.sourceOrder || ''}
                onChange={(e) => setEditingItem({ ...editingItem, sourceOrder: e.target.value })}
                className="w-full p-2 border rounded font-mono dark:bg-gray-950 dark:border-gray-700"
                placeholder="SO-2026-XXX"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trọng lượng thực tế (kg) *</label>
              <input
                type="number"
                step="0.01"
                value={editingItem.weight || 0}
                onChange={(e) => setEditingItem({ ...editingItem, weight: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono dark:bg-gray-950 dark:border-gray-700"
                required
                min={0.01}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Kích thước thùng (dxrxc cm) *</label>
              <input
                type="text"
                value={editingItem.dimensions || ''}
                onChange={(e) => setEditingItem({ ...editingItem, dimensions: e.target.value })}
                className="w-full p-2 border rounded font-mono dark:bg-gray-950 dark:border-gray-700"
                placeholder="Ví dụ: 30 x 20 x 15"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nhân viên đóng gói *</label>
              <input
                type="text"
                value={editingItem.packerName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, packerName: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trạng thái đóng gói *</label>
              <select
                value={editingItem.status || 'CHỜ_ĐÓNG_GÓI'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
              >
                <option value="CHỜ_ĐÓNG_GÓI">Chờ đóng gói</option>
                <option value="ĐÃ_ĐÓNG_GÓI">Đã đóng gói xong</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi chú đóng gói / vật liệu phụ trợ</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
              rows={2}
              placeholder="Ví dụ: Có lót xốp bong bóng, bọc màng PE..."
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
              {modalMode === 'create' ? 'Tạo phiếu đóng gói' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
