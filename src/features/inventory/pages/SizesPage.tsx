import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Eye, Edit, Trash2, Search, Ruler, Loader2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { toast } from 'sonner';
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
    const autoCode = `SZ-${Math.floor(100 + Math.random() * 900)}`;
    setEditingSize({ sizeCode: autoCode, status: 'ACTIVE', sizeGroup: 'GENERAL', sortOrder: data.length + 1 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (size: SizeRecord) => {
    setModalMode('edit');
    setEditingSize(size);
    setIsModalOpen(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSize.sizeName || !editingSize.sizeCode || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await addSize({
          sizeCode: editingSize.sizeCode.toUpperCase().trim(),
          sizeName: editingSize.sizeName.trim(),
          sizeGroup: editingSize.sizeGroup || 'GENERAL',
          sortOrder: editingSize.sortOrder || 1,
          description: editingSize.description,
          status: editingSize.status || 'ACTIVE',
        });
        toast.success('Đã thêm kích thước mới thành công!');
      } else if (editingSize.id) {
        await updateSize(editingSize.id, {
          ...editingSize,
          sizeCode: editingSize.sizeCode.toUpperCase().trim(),
          sizeName: editingSize.sizeName.trim(),
        });
        toast.success('Đã cập nhật kích thước thành công!');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi lưu kích thước');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSize) return;
    if (deletingSize.status === 'ACTIVE') {
      toast.error(`Kích thước "${deletingSize.sizeName}" đang ở trạng thái hoạt động. Vui lòng chuyển sang ngừng sử dụng trước khi xóa!`);
      setDeletingSize(null);
      return;
    }
    await deleteSize(deletingSize.id);
    toast.success(`Đã xóa kích thước "${deletingSize.sizeName}" thành công!`);
    setDeletingSize(null);
  };

  const columns = useMemo<ColumnDef<SizeRecord>[]>(
    () => [
      {
        accessorKey: 'sizeCode',
        header: 'Mã kích thước',
        cell: (info) => (
          <span className="font-mono font-bold text-sm text-primary">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'sizeName',
        header: 'Tên kích thước',
        cell: (info) => (
          <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'sizeGroup',
        header: 'Nhóm kích thước',
        cell: (info) => {
          const grp = (info.getValue() as string) || 'GENERAL';
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${groupStyles[grp] || groupStyles.GENERAL}`}>
              {groupLabels[grp] || grp}
            </span>
          );
        },
      },
      {
        accessorKey: 'sortOrder',
        header: 'Thứ tự',
        cell: (info) => <span className="font-mono text-gray-600 dark:text-gray-400">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'description',
        header: 'Mô tả',
        cell: (info) => (
          <span className="text-gray-500 dark:text-gray-400 text-xs">{info.getValue() as string || '—'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {status === 'ACTIVE' ? 'Đang sử dụng' : 'Ngừng sử dụng'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingSize(row.original)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Ruler className="w-6 h-6 text-primary" />
              Quản lý kích thước (size)
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý danh mục kích cỡ sản phẩm theo nhóm ngành hàng (quần áo, giày dép, phụ kiện)
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thêm mới kích thước
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Tổng số kích thước', value: data.length, color: 'text-gray-900 dark:text-white' },
            { label: 'Đang sử dụng', value: data.filter((s) => s.status === 'ACTIVE').length, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Ngừng sử dụng', value: data.filter((s) => s.status === 'INACTIVE').length, color: 'text-red-600 dark:text-red-400' },
            { label: 'Nhóm kích thước', value: Object.keys(groupLabels).length, color: 'text-primary' },
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
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã hoặc tên kích thước..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary text-sm" />
          </div>
          <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary">
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
              <div className="w-16 h-16 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                <span className="text-2xl font-black text-primary">{selected.sizeName}</span>
              </div>
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${groupStyles[selected.sizeGroup]}`}>{groupLabels[selected.sizeGroup]}</span>
                <p className="text-sm text-gray-500 mt-1">Thứ tự hiển thị: #{selected.sortOrder}</p>
              </div>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              {[['Mã kích thước', selected.sizeCode], ['Tên kích thước', selected.sizeName], ['Nhóm', groupLabels[selected.sizeGroup]], ['Mô tả', selected.description || 'Chưa cập nhật'], ['Trạng thái', selected.status === 'ACTIVE' ? 'Đang sử dụng' : 'Ngừng sử dụng']].map(([k, v]) => (
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Thêm mới kích thước' : 'Chỉnh sửa kích thước'} width="max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã kích thước *</label>
              <input required value={editingSize.sizeCode || ''} onChange={(e) => setEditingSize({ ...editingSize, sizeCode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono focus:ring-2 focus:ring-primary" placeholder="SZ-M" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên kích thước *</label>
              <input required value={editingSize.sizeName || ''} onChange={(e) => setEditingSize({ ...editingSize, sizeName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary" placeholder="M, L, XL, 39..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhóm hàng *</label>
              <select value={editingSize.sizeGroup || 'CLOTHING'} onChange={(e) => setEditingSize({ ...editingSize, sizeGroup: e.target.value as SizeRecord['sizeGroup'] })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary">
                <option value="CLOTHING">Quần áo</option>
                <option value="SHOES">Giày dép</option>
                <option value="ACCESSORIES">Phụ kiện</option>
                <option value="GENERAL">Chung</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thứ tự sắp xếp</label>
              <input type="number" min={1} value={editingSize.sortOrder || 1} onChange={(e) => setEditingSize({ ...editingSize, sortOrder: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
            <textarea rows={2} value={editingSize.description || ''} onChange={(e) => setEditingSize({ ...editingSize, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary resize-none" placeholder="Thông tin chi tiết kích thước..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
            <select value={editingSize.status || 'ACTIVE'} onChange={(e) => setEditingSize({ ...editingSize, status: e.target.value as 'ACTIVE' | 'INACTIVE' })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary">
              <option value="ACTIVE">Đang sử dụng</option>
              <option value="INACTIVE">Ngừng sử dụng</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium rounded-lg text-sm flex items-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {modalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Xóa */}
      <Modal isOpen={!!deletingSize} onClose={() => setDeletingSize(null)} title="Xác nhận xóa kích thước" isDestructive width="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa kích thước <strong className="text-gray-900 dark:text-white">{deletingSize?.sizeName}</strong> ({deletingSize?.sizeCode})?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setDeletingSize(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
