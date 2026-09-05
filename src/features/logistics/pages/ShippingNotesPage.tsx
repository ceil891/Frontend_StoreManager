import { useMemo, useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface ShippingNoteRecord {
  id: string;
  noteCode: string;
  orderCode: string;
  shipperName: string;
  noteType: 'GIAO_LAI' | 'KHIẾU_NẠI' | 'LƯU_KHO' | 'ĐỔI_ĐỊA_CHỈ';
  content: string;
  createdAt: string;
}

const STORAGE_KEY = 'retailhub_shipping_notes_data';

const DEFAULT_NOTES: ShippingNoteRecord[] = [];

const getSavedNotes = (): ShippingNoteRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

const saveNotesList = (list: ShippingNoteRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
};

export function ShippingNotesPage() {
  const [data, setData] = useState<ShippingNoteRecord[]>(() => {
    const local = getSavedNotes();
    return local.length > 0 ? local : DEFAULT_NOTES;
  });
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState<ShippingNoteRecord | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ShippingNoteRecord>>({});
  const [deletingItem, setDeletingItem] = useState<ShippingNoteRecord | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await axiosClient.get<any, any>('/logistics/delivery-notes');
      const items = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      if (items.length > 0) {
        const mapped: ShippingNoteRecord[] = items.map((item: any, idx: number) => ({
          id: String(item.id || idx + 1),
          noteCode: item.noteCode || item.code || `NOTE-${String(idx + 1).padStart(3, '0')}`,
          orderCode: item.orderCode || item.orderId || 'SO-88101',
          shipperName: item.shipperName || 'Nội bộ',
          noteType: (item.noteType || 'GIAO_LAI') as any,
          content: item.content || item.note || '',
          createdAt: item.createdAt || new Date().toISOString().substring(0, 16).replace('T', ' '),
        }));
        setData(mapped);
        saveNotesList(mapped);
      }
    } catch (err) {
      console.warn('Backend GET /logistics/delivery-notes failed, using local store:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      noteCode: `NOTE-${Date.now().toString().slice(-4)}`,
      orderCode: '',
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.orderCode?.trim() || !editingItem.content?.trim()) {
      toast.error('Vui lòng nhập mã đơn và nội dung ghi chú vận chuyển!');
      return;
    }

    const newRecord: ShippingNoteRecord = {
      id: editingItem.id || String(Date.now()),
      noteCode: editingItem.noteCode || `NOTE-${Date.now().toString().slice(-4)}`,
      orderCode: editingItem.orderCode.trim(),
      shipperName: editingItem.shipperName?.trim() || 'Nội bộ',
      noteType: editingItem.noteType || 'GIAO_LAI',
      content: editingItem.content.trim(),
      createdAt: editingItem.createdAt || new Date().toISOString().substring(0, 16).replace('T', ' ')
    };

    try {
      const payload = {
        noteCode: newRecord.noteCode,
        orderCode: newRecord.orderCode,
        shipperName: newRecord.shipperName,
        noteType: newRecord.noteType,
        content: newRecord.content,
        createdAt: newRecord.createdAt,
      };

      if (modalMode === 'create') {
        await axiosClient.post('/logistics/delivery-notes', payload);
      } else {
        await axiosClient.put(`/logistics/delivery-notes/${newRecord.id}`, payload);
      }
    } catch (err) {
      console.warn('API save delivery-note failed, applying local state update:', err);
    }

    if (modalMode === 'create') {
      setData(prev => {
        const next = [newRecord, ...prev];
        saveNotesList(next);
        return next;
      });
      toast.success('Tạo ghi chú vận chuyển mới thành công!');
    } else {
      setData(prev => {
        const next = prev.map(item => item.id === newRecord.id ? newRecord : item);
        saveNotesList(next);
        return next;
      });
      toast.success('Cập nhật ghi chú thành công!');
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await axiosClient.delete(`/logistics/delivery-notes/${deletingItem.id}`);
      setData(prev => {
        const next = prev.filter(item => item.id !== deletingItem.id);
        saveNotesList(next);
        return next;
      });
      toast.success(`Đã xóa ghi chú ${deletingItem.noteCode} thành công!`);
      if (selectedNote?.id === deletingItem.id) setSelectedNote(null);
      setDeletingItem(null);
    } catch (err: any) {
      console.error('API delete delivery-note failed:', err);
      toast.error('Lỗi khi xóa ghi chú: ' + (err?.response?.data?.message || err?.message || 'Không thể xóa'));
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
        header: 'Đơn vị / shipper ghi chú',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'noteType',
        header: 'Loại ghi chú',
        cell: (info) => {
          const type = info.getValue() as string;
          return (
            <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
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
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button onClick={() => setSelectedNote(row.original)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Xem chi tiết">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => handleOpenEdit(row.original)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Chỉnh sửa">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={() => setDeletingItem(row.original)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Xóa">
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ghi chú vận chuyển</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý các ghi chú giao nhận, yêu cầu giao lại, đổi địa chỉ từ shipper và bưu tá</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Thêm mới ghi chú
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo mã đơn, mã ghi chú, nội dung..."
          className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} />

      {/* Modal Xem chi tiết */}
      <Modal
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        title={selectedNote ? `Chi tiết ghi chú: ${selectedNote.noteCode}` : 'Thông tin ghi chú'}
        width="max-w-xl"
      >
        {selectedNote && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-xs text-gray-500">Mã đơn vận chuyển:</span>
              <span className="font-mono font-bold text-primary">{selectedNote.orderCode}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-xs text-gray-500">Loại ghi chú:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedNote.noteType.replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Nội dung chi tiết:</span>
              <p className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-800 dark:text-gray-200 text-xs italic border border-gray-200 dark:border-gray-800">
                {selectedNote.content}
              </p>
            </div>
            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setSelectedNote(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 font-medium rounded-lg text-sm text-gray-700 dark:text-gray-300">
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
        title={modalMode === 'create' ? 'Thêm mới ghi chú vận chuyển' : 'Cập nhật ghi chú vận chuyển'}
        width="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã ghi chú *</label>
              <input
                type="text"
                value={editingItem.noteCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, noteCode: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã đơn hàng *</label>
              <input
                type="text"
                value={editingItem.orderCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, orderCode: e.target.value })}
                required
                placeholder="Ví dụ: SO-88101"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn vị / shipper</label>
              <input
                type="text"
                value={editingItem.shipperName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, shipperName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại ghi chú</label>
              <select
                value={editingItem.noteType || 'GIAO_LAI'}
                onChange={(e) => setEditingItem({ ...editingItem, noteType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="GIAO_LAI">Giao lại</option>
                <option value="KHIẾU_NẠI">Khiếu nại</option>
                <option value="LƯU_KHO">Lưu kho</option>
                <option value="ĐỔI_ĐỊA_CHỈ">Đổi địa chỉ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung ghi chú *</label>
            <textarea
              value={editingItem.content || ''}
              onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
              required
              rows={3}
              placeholder="Nhập ghi chú giao nhận..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium">
              Hủy bỏ
            </button>
            <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg text-sm shadow-sm">
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa ghi chú vận chuyển"
        description={`Bạn có chắc chắn muốn xóa ghi chú "${deletingItem?.noteCode}" của đơn hàng "${deletingItem?.orderCode}" không?`}
      />
    </div>
  );
}
export default ShippingNotesPage;

