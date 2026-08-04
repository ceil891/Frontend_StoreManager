import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export interface ShippingNoteRecord {
  id: string;
  noteCode: string;
  orderCode: string;
  shipperName: string;
  noteType: 'GIAO_LAI' | 'KHIẾU_NẠI' | 'LƯU_KHO' | 'ĐỔI_ĐỊA_CHỈ';
  content: string;
  createdAt: string;
}

const DEFAULT_NOTES: ShippingNoteRecord[] = [
  {
    id: '1',
    noteCode: 'NOTE-001',
    orderCode: 'SO-88101',
    shipperName: 'Nguyễn Văn Minh (Viettel Post)',
    noteType: 'GIAO_LAI',
    content: 'Khách hàng hẹn giao lại vào buổi chiều sau 17h.',
    createdAt: '2026-08-01 10:15'
  },
  {
    id: '2',
    noteCode: 'NOTE-002',
    orderCode: 'SO-88102',
    shipperName: 'Trần Quốc Huy (GHTK)',
    noteType: 'ĐỔI_ĐỊA_CHỈ',
    content: 'Đổi địa chỉ giao sang số 45 Lê Lợi, Q1.',
    createdAt: '2026-08-01 11:30'
  }
];

export function ShippingNotesPage() {
  const [data, setData] = useState<ShippingNoteRecord[]>(DEFAULT_NOTES);
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState<ShippingNoteRecord | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ShippingNoteRecord>>({});

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      noteCode: `NOTE-${Date.now().toString().slice(-4)}`,
      orderCode: 'SO-88101',
      shipperName: 'Viettel Post',
      noteType: 'GIAO_LAI',
      content: '',
      createdAt: new Date().toISOString().substring(0, 16).replace('T', ' ')
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ShippingNoteRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.orderCode || !editingItem.content) {
      toast.error('Vui lòng nhập mã đơn và nội dung ghi chú vận chuyển!');
      return;
    }

    try {
      const newRecord: ShippingNoteRecord = {
        id: editingItem.id || String(Date.now()),
        noteCode: editingItem.noteCode || `NOTE-${Date.now().toString().slice(-4)}`,
        orderCode: editingItem.orderCode || '',
        shipperName: editingItem.shipperName || 'Nội bộ',
        noteType: editingItem.noteType || 'GIAO_LAI',
        content: editingItem.content || '',
        createdAt: editingItem.createdAt || new Date().toISOString().substring(0, 16).replace('T', ' ')
      };

      if (modalMode === 'create') {
        setData(prev => [newRecord, ...prev]);
        toast.success('Tạo ghi chú vận chuyển mới thành công!');
      } else {
        setData(prev => prev.map(item => item.id === newRecord.id ? newRecord : item));
        toast.success('Cập nhật ghi chú thành công!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể lưu ghi chú: Dữ liệu bị trùng hoặc vi phạm ràng buộc!');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) {
      setData(prev => prev.filter(item => item.id !== id));
      toast.success('Đã xóa ghi chú thành công!');
      setSelectedNote(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      item =>
        item.noteCode.toLowerCase().includes(q) ||
        item.orderCode.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns = useMemo<ColumnDef<ShippingNoteRecord>[]>(
    () => [
      {
        accessorKey: 'noteCode',
        header: 'Mã ghi chú',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'orderCode',
        header: 'Mã đơn vận chuyển',
        cell: (info) => <span className="font-mono font-bold text-primary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'shipperName',
        header: 'Đơn vị / Shipper ghi chú',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'noteType',
        header: 'Loại ghi chú',
        cell: (info) => {
          const type = info.getValue() as string;
          return (
            <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
              {type.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'content',
        header: 'Nội dung ghi chú',
        cell: (info) => <span className="text-gray-700 dark:text-gray-300 truncate max-w-xs block">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Thời gian',
        cell: (info) => <span className="font-mono text-xs text-gray-500">{info.getValue() as string}</span>,
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button onClick={() => setSelectedNote(row.original)} className="p-1 text-gray-400 hover:text-emerald-600">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => handleOpenEdit(row.original)} className="p-1 text-gray-400 hover:text-blue-600">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={() => handleDelete(row.original.id)} className="p-1 text-gray-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ghi chú vận chuyển</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý các ghi chú giao nhận, yêu cầu giao lại, đổi địa chỉ từ shipper và bưu tá.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm Ghi Chú Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã đơn, mã ghi chú, nội dung..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} />

      {/* Modal Xem chi tiết căn giữa (TC-ALL-1) */}
      <Modal
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        title={selectedNote ? `Chi tiết ghi chú: ${selectedNote.noteCode}` : 'Thông tin ghi chú'}
        width="max-w-md"
      >
        {selectedNote && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Mã đơn vận chuyển:</span>
              <span className="font-mono font-bold text-primary">{selectedNote.orderCode}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Loại ghi chú:</span>
              <span className="font-bold text-blue-600">{selectedNote.noteType.replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Nội dung chi tiết:</span>
              <p className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-800 dark:text-gray-200 italic">
                {selectedNote.content}
              </p>
            </div>
            <div className="flex justify-end pt-3 border-t">
              <button onClick={() => setSelectedNote(null)} className="px-4 py-2 bg-gray-100 font-bold rounded-lg">
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thêm/Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Ghi Chú Vận Chuyển' : 'Sửa Ghi Chú Vận Chuyển'}
        width="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Mã ghi chú *</label>
              <input
                type="text"
                value={editingItem.noteCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, noteCode: e.target.value })}
                required
                className="w-full p-2.5 border rounded-lg font-mono bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Mã đơn hàng *</label>
              <input
                type="text"
                value={editingItem.orderCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, orderCode: e.target.value })}
                required
                placeholder="VD: SO-88101"
                className="w-full p-2.5 border rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Đơn vị / Shipper</label>
              <input
                type="text"
                value={editingItem.shipperName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, shipperName: e.target.value })}
                className="w-full p-2.5 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Loại ghi chú</label>
              <select
                value={editingItem.noteType || 'GIAO_LAI'}
                onChange={(e) => setEditingItem({ ...editingItem, noteType: e.target.value as any })}
                className="w-full p-2.5 border rounded-lg"
              >
                <option value="GIAO_LAI">Giao lại</option>
                <option value="KHIẾU_NẠI">Khiếu nại</option>
                <option value="LƯU_KHO">Lưu kho</option>
                <option value="ĐỔI_ĐỊA_CHỈ">Đổi địa chỉ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Nội dung ghi chú *</label>
            <textarea
              value={editingItem.content || ''}
              onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
              required
              rows={3}
              placeholder="Nhập ghi chú giao nhận..."
              className="w-full p-2.5 border rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg">
              Hủy Bỏ
            </button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg">
              Lưu Ghi Chú
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingNotesPage;

