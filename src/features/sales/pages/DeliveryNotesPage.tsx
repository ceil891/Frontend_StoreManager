import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, UserCheck, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface DeliveryNoteRecord {
  id: string;
  noteCode: string;
  waybillCode: string;
  issuedDate: string;
  customerName: string;
  totalWeight: number; // in kg
  itemCount: number;
  deliveryStaff: string;
  status: 'CHO_BAN_GIAO' | 'DA_BAN_GIAO' | 'BI_TU_CHOI';
  notes?: string;
}

export function DeliveryNotesPage() {
  const [data, setData] = useState<DeliveryNoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DeliveryNoteRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<DeliveryNoteRecord>>({});

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any[]>('/wms/delivery-notes');
      const mapped = (Array.isArray(res) ? res : []).map((n: any) => ({
        id: String(n.id),
        noteCode: n.noteCode || '',
        waybillCode: n.packingListCode || n.trackingNumber || '',
        issuedDate: n.deliveryDate ? n.deliveryDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
        customerName: n.recipientName || 'Khách lẻ',
        totalWeight: 0,
        itemCount: 0,
        deliveryStaff: n.carrierName || 'Vận chuyển nội bộ',
        status: (n.status === 'DELIVERED' ? 'DA_BAN_GIAO' : n.status === 'FAILED' ? 'BI_TU_CHOI' : 'CHO_BAN_GIAO') as DeliveryNoteRecord['status'],
        notes: n.failureReason || n.cancelReason || '',
      }));
      setData(mapped);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách biên bản.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.noteCode.toLowerCase().includes(q) ||
        d.waybillCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.deliveryStaff.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      noteCode: `DN-2026-${Date.now().toString().slice(-4)}`,
      waybillCode: '',
      issuedDate: new Date().toISOString().split('T')[0],
      customerName: '',
      totalWeight: 0,
      itemCount: 0,
      deliveryStaff: '',
      status: 'CHO_BAN_GIAO',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DeliveryNoteRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.noteCode || !editingItem.waybillCode || !editingItem.customerName) return;

    try {
      const apiStatus = editingItem.status === 'DA_BAN_GIAO' ? 'DELIVERED' : editingItem.status === 'BI_TU_CHOI' ? 'FAILED' : 'PENDING';
      const payload = {
        noteCode: editingItem.noteCode,
        recipientName: editingItem.customerName,
        status: apiStatus,
        carrierName: editingItem.deliveryStaff,
        trackingNumber: editingItem.waybillCode,
        deliveryDate: editingItem.issuedDate ? `${editingItem.issuedDate}T00:00:00` : undefined,
      };

      if (modalMode === 'create') {
        await axiosClient.post('/wms/delivery-notes', payload);
        toast.success('Thêm biên bản giao hàng thành công!');
      } else {
        await axiosClient.put(`/wms/delivery-notes/${editingItem.id}`, payload);
        toast.success('Cập nhật biên bản giao hàng thành công!');
      }
      setIsModalOpen(false);
      fetchNotes();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu biên bản giao hàng.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa biên bản giao hàng này?')) {
      try {
        await axiosClient.delete(`/wms/delivery-notes/${id}`);
        toast.success('Đã xóa biên bản giao hàng thành công!');
        fetchNotes();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi xóa biên bản giao hàng.');
      }
    }
  };

  const columns = useMemo<ColumnDef<DeliveryNoteRecord>[]>(
    () => [
      {
        accessorKey: 'noteCode',
        header: 'Mã biên bản',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'waybillCode',
        header: 'Mã vận đơn',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'itemCount',
        header: 'Số lượng',
        cell: (info) => <span className="font-mono">{info.getValue() as number} món</span>,
      },
      {
        accessorKey: 'deliveryStaff',
        header: 'Nhân viên giao',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Tình trạng',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-gray-100 text-gray-800';
          let label = 'Chờ bàn giao';
          if (status === 'DA_BAN_GIAO') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã bàn giao';
          } else if (status === 'BI_TU_CHOI') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Khách từ chối';
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
          <h1 className="text-2xl font-bold">Biên bản bàn giao hàng hóa</h1>
          <p className="text-sm text-gray-500">
            Xem và lập các phiếu/biên bản xác nhận bàn nhận giao hàng thực tế ký tay của khách hàng.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Lập Biên Bản Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã biên bản, mã vận đơn, khách hàng, nhân viên giao..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách biên bản...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Biên Bản: ${selected?.noteCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã biên bản:</span>
                <p className="font-mono font-semibold">{selected.noteCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã vận đơn:</span>
                <p className="font-mono font-semibold">{selected.waybillCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày lập biên bản:</span>
                <p className="font-mono">{selected.issuedDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Nhân viên vận chuyển:</span>
                <p>{selected.deliveryStaff || 'Chưa phân công'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Tổng trọng lượng:</span>
                <p className="font-mono">{selected.totalWeight} kg</p>
              </div>
              <div>
                <span className="text-gray-500">Số lượng hàng:</span>
                <p className="font-mono">{selected.itemCount} sản phẩm</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái bàn giao:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_BAN_GIAO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_BAN_GIAO'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_BAN_GIAO'
                    ? 'Đã bàn giao'
                    : selected.status === 'CHO_BAN_GIAO'
                    ? 'Chờ bàn giao'
                    : 'Khách từ chối'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú / phản hồi từ khách:</span>
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
        title={modalMode === 'create' ? '📋 Tạo biên bản bàn giao hàng hóa mới' : '⚙️ Sửa biên bản bàn giao'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã biên bản *</label>
                {modalMode === 'create' && (
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, noteCode: `DN-2026-${Date.now().toString().slice(-4)}` })}
                    className="text-[10px] text-emerald-600 hover:underline font-bold"
                  >
                    ⚡ Sinh mã
                  </button>
                )}
              </div>
              <input
                type="text"
                value={editingItem.noteCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, noteCode: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã vận đơn liên kết *</label>
              <input
                type="text"
                value={editingItem.waybillCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, waybillCode: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="WB-2026-XXX"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Người nhận hàng (Khách/Đại lý) *</label>
              <input
                type="text"
                value={editingItem.customerName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Họ tên người đại diện nhận hàng..."
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nhân viên bàn giao / Shipper *</label>
              <input
                type="text"
                value={editingItem.deliveryStaff || ''}
                onChange={(e) => setEditingItem({ ...editingItem, deliveryStaff: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Tên nhân viên phụ trách giao..."
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày lập biên bản *</label>
              <input
                type="date"
                value={editingItem.issuedDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, issuedDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tổng trọng lượng (kg)</label>
              <input
                type="number"
                step="0.1"
                value={editingItem.totalWeight || 0}
                onChange={(e) => setEditingItem({ ...editingItem, totalWeight: Number(e.target.value) })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tổng kiện / sản phẩm</label>
              <input
                type="number"
                value={editingItem.itemCount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, itemCount: Number(e.target.value) })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tình trạng bàn giao & Chữ ký *</label>
            <select
              value={editingItem.status || 'CHO_BAN_GIAO'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="CHO_BAN_GIAO">📦 Chờ bàn giao hàng hóa</option>
              <option value="DA_BAN_GIAO">🟢 Đã bàn giao thành công / Khách đã ký nhận biên bản</option>
              <option value="BI_TU_CHOI">🔴 Khách từ chối nhận hàng (Lập biên bản bất thành)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ghi chú tình trạng thùng/hàng & Biên bản nghiệm thu</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Ghi nhận tình trạng tem niêm phong, đếm đủ số lượng kiên hàng, lý do trả (nếu có)..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
              Lưu phiếu giao
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
