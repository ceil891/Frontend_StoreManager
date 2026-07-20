import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Send, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface RFQRecord {
  id: string;
  rfqCode: string;
  supplierName: string;
  sentDate: string;
  expiryDate: string;
  itemsDescription: string;
  handler: string;
  status: 'CHO_BAO_GIA' | 'DA_BAO_GIA' | 'DA_HUY';
  notes?: string;
}

export function SupplierRequestsPage() {
  const [data, setData] = useState<RFQRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RFQRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<RFQRecord>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchRFQs = async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get('/purchase/orders?size=500');
      const list = res.content || res || [];
      const mapped: RFQRecord[] = (Array.isArray(list) ? list : []).map((item: any) => {
        let status: RFQRecord['status'] = 'CHO_BAO_GIA';
        if (item.status === 'CONFIRMED' || item.status === 'COMPLETED') status = 'DA_BAO_GIA';
        else if (item.status === 'CANCELLED') status = 'DA_HUY';
        return {
          id: String(item.id),
          rfqCode: item.poNumber || '',
          supplierName: item.supplierName || item.supplier?.name || '',
          sentDate: item.orderDate || '',
          expiryDate: item.estDeliveryDate || '',
          itemsDescription: item.notes || `${item.itemsCount || 0} sản phẩm`,
          handler: item.orderedBy || '',
          status,
          notes: item.notes || '',
        };
      });
      setData(mapped);
    } catch (err) {
      console.error('Lỗi tải danh sách yêu cầu báo giá:', err);
      toast.error('Không thể tải danh sách yêu cầu báo giá');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.rfqCode.toLowerCase().includes(q) ||
        d.supplierName.toLowerCase().includes(q) ||
        d.handler.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      rfqCode: `RFQ-2026-${Date.now().toString().slice(-4)}`,
      supplierName: '',
      sentDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      itemsDescription: '',
      handler: '',
      status: 'CHO_BAO_GIA',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RFQRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.rfqCode || !editingItem.supplierName) return;

    try {
      if (modalMode === 'create') {
        const payload = {
          poNumber: editingItem.rfqCode,
          supplierName: editingItem.supplierName,
          orderDate: editingItem.sentDate || new Date().toISOString().split('T')[0],
          estDeliveryDate: editingItem.expiryDate || editingItem.sentDate,
          notes: editingItem.itemsDescription || '',
          orderedBy: editingItem.handler || '',
          status: 'DRAFT',
        };
        await axiosClient.post('/purchase/orders', payload);
        toast.success('Tạo yêu cầu báo giá thành công');
      } else {
        const payload = {
          poNumber: editingItem.rfqCode,
          supplierName: editingItem.supplierName,
          orderDate: editingItem.sentDate,
          estDeliveryDate: editingItem.expiryDate,
          notes: editingItem.itemsDescription || '',
          orderedBy: editingItem.handler || '',
          status: 'DRAFT',
        };
        await axiosClient.put(`/purchase/orders/${editingItem.id}`, payload);
        toast.success('Cập nhật yêu cầu báo giá thành công');
      }
      await fetchRFQs();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Lỗi lưu yêu cầu báo giá:', err);
      toast.error('Không thể lưu yêu cầu báo giá');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa yêu cầu báo giá này?')) {
      try {
        await axiosClient.delete(`/purchase/orders/${id}`);
        toast.success('Đã xóa yêu cầu báo giá');
        await fetchRFQs();
      } catch (err) {
        console.error('Lỗi xóa yêu cầu báo giá:', err);
        toast.error('Không thể xóa yêu cầu báo giá');
      }
    }
  };

  const columns = useMemo<ColumnDef<RFQRecord>[]>(
    () => [
      {
        accessorKey: 'rfqCode',
        header: 'Mã yêu cầu (RFQ)',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sentDate',
        header: 'Ngày gửi',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'itemsDescription',
        header: 'Nội dung yêu cầu',
        cell: (info) => <span className="truncate max-w-xs block">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-100 text-amber-800';
          let label = 'Chờ báo giá';
          if (status === 'DA_BAO_GIA') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã báo giá';
          } else if (status === 'DA_HUY') {
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
              title="Xem chi tiết RFQ"
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
          <h1 className="text-2xl font-bold">Yêu cầu báo giá nhà cung cấp (rfqs)</h1>
          <p className="text-sm text-gray-500">
            Tạo và theo dõi các bản yêu cầu báo giá (Requests for Quotation) gửi tới nhà cung cấp nhằm tìm kiếm giá tốt nhất.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Gửi Yêu Cầu Báo Giá
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã RFQ, nhà cung cấp, nội dung..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Yêu Cầu RFQ: ${selected?.rfqCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã RFQ:</span>
                <p className="font-mono font-semibold">{selected.rfqCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Người thực hiện:</span>
                <p>{selected.handler || 'Nhân viên mua hàng'}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Nhà cung cấp:</span>
              <p className="font-semibold">{selected.supplierName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày gửi RFQ:</span>
                <p className="font-mono">{selected.sentDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Ngày hết hạn nhận báo giá:</span>
                <p className="font-mono">{selected.expiryDate}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Nội dung / mặt hàng yêu cầu:</span>
              <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                {selected.itemsDescription}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái RFQ:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_BAO_GIA'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_BAO_GIA'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_BAO_GIA'
                    ? 'Đã nhận báo giá'
                    : selected.status === 'CHO_BAO_GIA'
                    ? 'Chờ báo giá'
                    : 'Đã hủy RFQ'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú vận hành:</span>
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
        title={modalMode === 'create' ? 'Gửi yêu cầu báo giá RFQ' : 'Sửa yêu cầu báo giá RFQ'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã RFQ *</label>
              <input
                type="text"
                value={editingItem.rfqCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, rfqCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Người liên hệ / nhân viên *</label>
              <input
                type="text"
                value={editingItem.handler || ''}
                onChange={(e) => setEditingItem({ ...editingItem, handler: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Họ tên nhân viên"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên nhà cung cấp yêu cầu *</label>
            <input
              type="text"
              value={editingItem.supplierName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, supplierName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Nhà cung cấp"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày gửi *</label>
              <input
                type="date"
                value={editingItem.sentDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, sentDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày hết hạn phản hồi *</label>
              <input
                type="date"
                value={editingItem.expiryDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nội dung / mặt hàng yêu cầu *</label>
            <textarea
              value={editingItem.itemsDescription || ''}
              onChange={(e) => setEditingItem({ ...editingItem, itemsDescription: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Danh sách sản phẩm chi tiết..."
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng thái *</label>
            <select
              value={editingItem.status || 'CHO_BAO_GIA'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="CHO_BAO_GIA">Chờ báo giá</option>
              <option value="DA_BAO_GIA">Đã nhận báo giá</option>
              <option value="DA_HUY">Đã hủy RFQ</option>
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
              Gửi yêu cầu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
