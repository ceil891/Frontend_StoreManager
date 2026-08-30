import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export interface FeeGroupRecord {
  id: string;
  groupCode: string;
  groupName: string;
  minOrderValueVnd: number;
  flatFeeVnd: number;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

const DEFAULT_GROUPS: FeeGroupRecord[] = [
  {
    id: '1',
    groupCode: 'GRP-01',
    groupName: 'Đơn hàng nhỏ (dưới 500.000 đ)',
    minOrderValueVnd: 0,
    flatFeeVnd: 30000,
    status: 'ACTIVE',
    notes: 'Phí đồng giá 30.000 đ cho đơn hàng giá trị thấp'
  },
  {
    id: '2',
    groupCode: 'GRP-02',
    groupName: 'Đơn hàng trung bình (500.000 đ - 2.000.000 đ)',
    minOrderValueVnd: 500000,
    flatFeeVnd: 15000,
    status: 'ACTIVE',
    notes: 'Hỗ trợ 50% phí ship cho khách mua đơn từ 500.000 đ'
  },
  {
    id: '3',
    groupCode: 'GRP-03',
    groupName: 'Miễn phí vận chuyển (từ 2.000.000 đ)',
    minOrderValueVnd: 2000000,
    flatFeeVnd: 0,
    status: 'ACTIVE',
    notes: 'Miễn phí vận chuyển cho mọi đơn hàng giá trị trên 2.000.000 đ'
  }
];

export function ShippingFeeGroupsPage() {
  const [data, setData] = useState<FeeGroupRecord[]>(DEFAULT_GROUPS);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<FeeGroupRecord | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<FeeGroupRecord>>({});

  const formatCurrency = (val: number) => `${Math.round(val).toLocaleString('vi-VN')} đ`;

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      groupCode: `GRP-${Date.now().toString().slice(-4)}`,
      groupName: '',
      minOrderValueVnd: 0,
      flatFeeVnd: 20000,
      status: 'ACTIVE',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FeeGroupRecord) => {
    setSelectedGroup(null);
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.groupCode || !editingItem.groupName) {
      toast.error('Vui lòng điền mã nhóm và tên nhóm phí!');
      return;
    }

    const minVal = Number(editingItem.minOrderValueVnd || 0);
    const feeVal = Number(editingItem.flatFeeVnd || 0);

    if (minVal < 0 || feeVal < 0) {
      toast.error('Giá trị đơn tối thiểu và phí giao hàng không được âm!');
      return;
    }

    const newRecord: FeeGroupRecord = {
      id: editingItem.id || String(Date.now()),
      groupCode: editingItem.groupCode || `GRP-${Date.now().toString().slice(-4)}`,
      groupName: editingItem.groupName || '',
      minOrderValueVnd: minVal,
      flatFeeVnd: feeVal,
      status: editingItem.status || 'ACTIVE',
      notes: editingItem.notes || ''
    };

    if (modalMode === 'create') {
      setData(prev => [newRecord, ...prev]);
      toast.success('Thêm nhóm phí vận chuyển thành công!');
    } else {
      setData(prev => prev.map(item => item.id === newRecord.id ? newRecord : item));
      toast.success('Cập nhật nhóm phí thành công!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (item: FeeGroupRecord) => {
    setSelectedGroup(null);
    if (item.status === 'ACTIVE') {
      toast.error('Nhóm phí đang ở trạng thái hoạt động. Vui lòng chuyển sang tạm ngưng trước khi xóa!');
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa nhóm phí ${item.groupName}?`)) {
      setData(prev => prev.filter(g => g.id !== item.id));
      toast.success('Đã xóa nhóm phí vận chuyển!');
    }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      item =>
        item.groupCode.toLowerCase().includes(q) ||
        item.groupName.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns = useMemo<ColumnDef<FeeGroupRecord>[]>(
    () => [
      {
        accessorKey: 'groupCode',
        header: 'Mã nhóm phí',
        cell: (info) => <span className="font-mono font-bold text-primary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'groupName',
        header: 'Tên nhóm phí',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'minOrderValueVnd',
        header: 'Giá trị đơn tối thiểu',
        cell: (info) => <span className="font-mono text-gray-800 dark:text-gray-200">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'flatFeeVnd',
        header: 'Mức phí giao áp dụng',
        cell: (info) => {
          const val = info.getValue() as number;
          return (
            <span className={`font-mono font-bold ${val === 0 ? 'text-emerald-600' : 'text-primary'}`}>
              {val === 0 ? 'Miễn phí (0 đ)' : formatCurrency(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => (
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            info.getValue() === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            {info.getValue() === 'ACTIVE' ? 'Đang áp dụng' : 'Tạm ngưng'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); setSelectedGroup(row.original); }} className="p-1 text-gray-400 hover:text-primary rounded transition-colors" title="Xem chi tiết">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }} className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors" title="Chỉnh sửa">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(row.original); }} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors" title="Xóa">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nhóm phí vận chuyển</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Phân loại nhóm cước phí theo giá trị đơn hàng và chính sách ưu đãi miễn phí giao hàng</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm mới nhóm phí
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã nhóm, tên nhóm phí vận chuyển..."
          className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} />

      {/* Modal Xem chi tiết */}
      <Modal
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        title={selectedGroup ? `Thông tin nhóm phí: ${selectedGroup.groupName}` : 'Thông tin nhóm phí'}
        width="max-w-md"
      >
        {selectedGroup && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-gray-500">Mã nhóm phí:</span>
              <span className="font-mono font-bold text-primary">{selectedGroup.groupCode}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-gray-500">Tên nhóm:</span>
              <span className="font-bold text-gray-900 dark:text-white">{selectedGroup.groupName}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              <div>
                <span className="text-gray-500 block mb-1">Đơn tối thiểu:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{formatCurrency(selectedGroup.minOrderValueVnd)}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Phí ship áp dụng:</span>
                <span className="font-mono font-bold text-primary">{formatCurrency(selectedGroup.flatFeeVnd)}</span>
              </div>
            </div>
            {selectedGroup.notes && (
              <div>
                <span className="text-xs text-gray-400 block mb-1">Ghi chú chính sách:</span>
                <p className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-700 dark:text-gray-300 text-xs border border-gray-200 dark:border-gray-800">{selectedGroup.notes}</p>
              </div>
            )}
            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setSelectedGroup(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm">
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
        title={modalMode === 'create' ? 'Thêm mới nhóm phí vận chuyển' : 'Cập nhật nhóm phí vận chuyển'}
        width="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Mã nhóm *</label>
              <input
                type="text"
                value={editingItem.groupCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, groupCode: e.target.value })}
                required
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono font-bold text-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Tên nhóm phí *</label>
              <input
                type="text"
                value={editingItem.groupName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, groupName: e.target.value })}
                required
                placeholder="VD: Đơn dưới 500k"
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Giá trị đơn tối thiểu (đ)</label>
              <input
                type="text"
                value={editingItem.minOrderValueVnd === 0 ? '' : (editingItem.minOrderValueVnd ?? '')}
                placeholder="0"
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9]/g, '');
                  setEditingItem({ ...editingItem, minOrderValueVnd: clean === '' ? 0 : parseInt(clean, 10) || 0 });
                }}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono font-bold text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Mức phí áp dụng (đ)</label>
              <input
                type="text"
                value={editingItem.flatFeeVnd === 0 ? '' : (editingItem.flatFeeVnd ?? '')}
                placeholder="0"
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9]/g, '');
                  setEditingItem({ ...editingItem, flatFeeVnd: clean === '' ? 0 : parseInt(clean, 10) || 0 });
                }}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-primary font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái *</label>
            <select
              value={editingItem.status || 'ACTIVE'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium"
            >
              <option value="ACTIVE">Đang áp dụng</option>
              <option value="INACTIVE">Tạm ngưng</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              rows={2}
              className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Hủy bỏ
            </button>
            <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow-sm transition-colors">
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingFeeGroupsPage;

