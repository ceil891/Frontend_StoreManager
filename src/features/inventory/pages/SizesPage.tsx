import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Eye, Edit, Trash2, Search, Ruler } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { useSizeStore, type SizeRecord } from '../store/sizeStore';

const groupStyles: Record<string, string> = {
  CLOTHING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  SHOES: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  ACCESSORIES: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  GENERAL: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const groupLabels: Record<string, string> = {
  CLOTHING: 'Quần áo',
  SHOES: 'Giày dép',
  ACCESSORIES: 'Phụ kiện',
  GENERAL: 'Chung',
};

export function SizesPage() {
  const { sizes: data, fetchSizes, addSize, updateSize, deleteSize } = useSizeStore();

  useEffect(() => {
    fetchSizes();
  }, [fetchSizes]);

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [selected, setSelected] = useState<SizeRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingSize, setEditingSize] = useState<Partial<SizeRecord>>({});
  const [deletingSize, setDeletingSize] = useState<SizeRecord | null>(null);

  const filtered = data.filter((s) => {
    const matchSearch =
      s.sizeCode.toLowerCase().includes(search.toLowerCase()) ||
      s.sizeName.toLowerCase().includes(search.toLowerCase());
    const matchGroup = groupFilter === 'all' || s.sizeGroup === groupFilter;
    return matchSearch && matchGroup;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingSize({ status: 'ACTIVE', sizeGroup: 'GENERAL', sortOrder: 1 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (size: SizeRecord) => {
    setModalMode('edit');
    setEditingSize(size);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSize.sizeName || !editingSize.sizeCode) return;
    if (modalMode === 'create') {
      await addSize({
        sizeCode: editingSize.sizeCode!,
        sizeName: editingSize.sizeName!,
        sizeGroup: editingSize.sizeGroup || 'GENERAL',
        sortOrder: editingSize.sortOrder || 1,
        description: editingSize.description,
        status: editingSize.status || 'ACTIVE',
      });
    } else if (editingSize.id) {
      await updateSize(editingSize.id, editingSize);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSize) return;
    await deleteSize(deletingSize.id);
    setDeletingSize(null);
  };

  const columns = useMemo<ColumnDef<SizeRecord>[]>(
    () => [
      {
        accessorKey: 'sizeCode',
        header: 'Mã size',
        cell: (info) => <span className="font-mono font-bold text-sm text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sizeName',
        header: 'Tên size',
        cell: (info) => <span className="font-bold text-lg text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sizeGroup',
        header: 'Nhóm',
        cell: (info) => {
          const g = info.getValue() as string;
          return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${groupStyles[g]}`}>{groupLabels[g] || g}</span>;
        },
      },
      {
        accessorKey: 'sortOrder',
        header: 'Thứ tự',
        cell: (info) => (
          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">#{info.getValue() as number}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Mô tả',
        cell: (info) => (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px] block">
            {(info.getValue() as string) || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const s = info.getValue() as string;
          return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              s === 'ACTIVE'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {s === 'ACTIVE' ? 'Đang dùng' : 'Ngừng dùng'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(row.original)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
            <button onClick={() => handleOpenEdit(row.original)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
            <button onClick={() => setDeletingSize(row.original)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        ),
      },
    ],
    [data]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Ruler className="w-6 h-6 text-emerald-500" />
              Quản lý kích thước
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý danh mục kích thước sản phẩm theo từng nhóm hàng hóa (quần áo, giày dép, phụ kiện...).
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Xuất danh sách
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Thêm kích thước
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Tổng kích thước', value: data.length, color: 'text-gray-900 dark:text-white' },
            { label: 'Quần áo', value: data.filter((s) => s.sizeGroup === 'CLOTHING').length, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Giày dép', value: data.filter((s) => s.sizeGroup === 'SHOES').length, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Đang dùng', value: data.filter((s) => s.status === 'ACTIVE').length, color: 'text-emerald-600 dark:text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã hoặc tên kích thước..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 text-sm" />
          </div>
          <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
            <option value="all">Tất cả nhóm</option>
            <option value="CLOTHING">Quần áo</option>
            <option value="SHOES">Giày dép</option>
            <option value="ACCESSORIES">Phụ kiện</option>
            <option value="GENERAL">Chung</option>
          </select>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      </div>

      {/* Drawer */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Chi tiết: ${selected.sizeName}` : ''}>
        {selected && (
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{selected.sizeName}</span>
              </div>
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${groupStyles[selected.sizeGroup]}`}>{groupLabels[selected.sizeGroup]}</span>
                <p className="text-sm text-gray-500 mt-1">Thứ tự: #{selected.sortOrder}</p>
              </div>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              {[['Mã size', selected.sizeCode], ['Tên size', selected.sizeName], ['Nhóm', groupLabels[selected.sizeGroup]], ['Mô tả', selected.description || '—'], ['Trạng thái', selected.status === 'ACTIVE' ? 'Đang dùng' : 'Ngừng dùng']].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{k}:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Create/Edit */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Thêm kích thước mới' : 'Chỉnh sửa kích thước'} width="max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã size *</label>
              <input required value={editingSize.sizeCode || ''} onChange={(e) => setEditingSize({ ...editingSize, sizeCode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono focus:ring-2 focus:ring-emerald-500" placeholder="SZ-M" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên size *</label>
              <input required value={editingSize.sizeName || ''} onChange={(e) => setEditingSize({ ...editingSize, sizeName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="M, L, XL, 39..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhóm hàng *</label>
              <select value={editingSize.sizeGroup || 'CLOTHING'} onChange={(e) => setEditingSize({ ...editingSize, sizeGroup: e.target.value as SizeRecord['sizeGroup'] })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500">
                <option value="CLOTHING">Quần áo</option>
                <option value="SHOES">Giày dép</option>
                <option value="ACCESSORIES">Phụ kiện</option>
                <option value="GENERAL">Chung</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thứ tự sắp xếp</label>
              <input type="number" min={1} value={editingSize.sortOrder || 1} onChange={(e) => setEditingSize({ ...editingSize, sortOrder: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
            <textarea rows={2} value={editingSize.description || ''} onChange={(e) => setEditingSize({ ...editingSize, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="Thông tin chi tiết kích thước..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
            <select value={editingSize.status || 'ACTIVE'} onChange={(e) => setEditingSize({ ...editingSize, status: e.target.value as 'ACTIVE' | 'INACTIVE' })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500">
              <option value="ACTIVE">Đang sử dụng</option>
              <option value="INACTIVE">Ngừng sử dụng</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm">{modalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal xóa */}
      <Modal isOpen={!!deletingSize} onClose={() => setDeletingSize(null)} title="Xác nhận xóa kích thước" isDestructive width="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Bạn có chắc muốn xóa kích thước <strong className="text-gray-900 dark:text-white">{deletingSize?.sizeName}</strong> ({deletingSize?.sizeCode})?</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setDeletingSize(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
