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
    groupName: 'Đơn hàng nhỏ (Dưới 500k)',
    minOrderValueVnd: 0,
    flatFeeVnd: 30000,
    status: 'ACTIVE',
    notes: 'Phí đồng giá 30.000đ cho đơn hàng giá trị thấp'
  },
  {
    id: '2',
    groupCode: 'GRP-02',
    groupName: 'Đơn hàng trung bình (500k - 2 Tr)',
    minOrderValueVnd: 500000,
    flatFeeVnd: 15000,
    status: 'ACTIVE',
    notes: 'Hỗ trợ 50% phí ship cho khách mua đơn từ 500.000đ'
  },
  {
    id: '3',
    groupCode: 'GRP-03',
    groupName: 'Miễn phí vận chuyển VIP (Từ 2 Tr)',
    minOrderValueVnd: 2000000,
    flatFeeVnd: 0,
    status: 'ACTIVE',
    notes: 'Freeship 100% cho mọi đơn hàng giá trị trên 2 triệu'
  }
];

export function ShippingFeeGroupsPage() {
  const [data, setData] = useState<FeeGroupRecord[]>(DEFAULT_GROUPS);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<FeeGroupRecord | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<FeeGroupRecord>>({});

  const formatCurrency = (val: number) => `${Math.round(val).toLocaleString('vi-VN')} VNĐ`;

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
    setSelectedGroup(null); // Ensure detail modal does NOT open when clicking delete (TC-SHIP-27)
    if (item.status === 'ACTIVE') {
      toast.error('Nhóm phí đang ở trạng thái Hoạt động. Vui lòng chuyển sang Tạm ngưng trước khi xóa!');
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
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
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
              {val === 0 ? 'Miễn phí (0đ)' : formatCurrency(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => (
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
            info.getValue() === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {info.getValue() === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); setSelectedGroup(row.original); }} className="p-1 text-gray-400 hover:text-emerald-600">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }} className="p-1 text-gray-400 hover:text-blue-600">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(row.original); }} className="p-1 text-gray-400 hover:text-red-600">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nhóm phí vận chuyển</h1>
          <p className="text-sm text-gray-500 mt-1">Phân loại nhóm cước phí theo giá trị đơn hàng và chính sách ưu đãi freeship.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm Nhóm Phí Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã nhóm, tên nhóm phí vận chuyển..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} />

      {/* Modal Xem chi tiết căn giữa (TC-ALL-1) */}
      <Modal
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        title={selectedGroup ? `Chi tiết nhóm phí: ${selectedGroup.groupName}` : 'Thông tin nhóm phí'}
        width="max-w-md"
      >
        {selectedGroup && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Mã nhóm phí:</span>
              <span className="font-mono font-bold text-emerald-600">{selectedGroup.groupCode}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Tên nhóm:</span>
              <span className="font-bold">{selectedGroup.groupName}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 border-b pb-2">
              <div>
                <span className="text-gray-500 block">Đơn tối thiểu:</span>
                <span className="font-mono font-bold text-gray-800">{formatCurrency(selectedGroup.minOrderValueVnd)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Phí ship áp dụng:</span>
                <span className="font-mono font-bold text-emerald-600">{formatCurrency(selectedGroup.flatFeeVnd)}</span>
              </div>
            </div>
            {selectedGroup.notes && (
              <div>
                <span className="text-xs text-gray-400 block mb-1">Ghi chú chính sách:</span>
                <p className="p-2.5 bg-gray-50 rounded-lg italic text-gray-700">{selectedGroup.notes}</p>
              </div>
            )}
            <div className="flex justify-end pt-3 border-t">
              <button onClick={() => setSelectedGroup(null)} className="px-4 py-2 bg-gray-100 font-bold rounded-lg">
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
        title={modalMode === 'create' ? 'Thêm Nhóm Phí Vận Chuyển Mới' : 'Cập Nhật Nhóm Phí'}
        width="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Mã nhóm *</label>
              <input
                type="text"
                value={editingItem.groupCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, groupCode: e.target.value })}
                required
                className="w-full p-2.5 border rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Tên nhóm phí *</label>
              <input
                type="text"
                value={editingItem.groupName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, groupName: e.target.value })}
                required
                placeholder="VD: Đơn dưới 500k"
                className="w-full p-2.5 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Giá trị đơn tối thiểu (VNĐ)</label>
              <input
                type="text"
                value={editingItem.minOrderValueVnd ?? 0}
                onChange={(e) => {
                  const clean = e.target.value.replace(/^0+(?=\d)/, '');
                  setEditingItem({ ...editingItem, minOrderValueVnd: parseFloat(clean) || 0 });
                }}
                className="w-full p-2.5 border rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Mức phí áp dụng (VNĐ)</label>
              <input
                type="text"
                value={editingItem.flatFeeVnd ?? 0}
                onChange={(e) => {
                  const clean = e.target.value.replace(/^0+(?=\d)/, '');
                  setEditingItem({ ...editingItem, flatFeeVnd: parseFloat(clean) || 0 });
                }}
                className="w-full p-2.5 border rounded-lg font-mono text-emerald-600 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Trạng thái *</label>
            <select
              value={editingItem.status || 'ACTIVE'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2.5 border rounded-lg"
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Tạm ngưng</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              rows={2}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg">
              Hủy Bỏ
            </button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg">
              Lưu Nhóm Phí
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingFeeGroupsPage;

