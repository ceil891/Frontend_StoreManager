import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Eye, Edit, Trash2, Search, Palette } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { useColorStore, type ColorRecord } from '../store/colorStore';

export function ColorsPage() {
  const { colors: data, fetchColors, addColor, updateColor, deleteColor } = useColorStore();

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ColorRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingColor, setEditingColor] = useState<Partial<ColorRecord>>({});
  const [deletingColor, setDeletingColor] = useState<ColorRecord | null>(null);

  const filtered = data.filter(
    (c) =>
      c.colorCode.toLowerCase().includes(search.toLowerCase()) ||
      c.colorName.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingColor({ colorCode: `CLR-${String(data.length + 1).padStart(3, '0')}`, hexCode: '#000000', status: 'ACTIVE' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (color: ColorRecord) => {
    setModalMode('edit');
    setEditingColor(color);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColor.colorName || !editingColor.colorCode) return;
    if (modalMode === 'create') {
      await addColor({
        colorCode: editingColor.colorCode!,
        colorName: editingColor.colorName!,
        hexCode: editingColor.hexCode || '#000000',
        description: editingColor.description,
        status: editingColor.status || 'ACTIVE',
      });
    } else if (editingColor.id) {
      await updateColor(editingColor.id, editingColor);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingColor) return;
    await deleteColor(deletingColor.id);
    setDeletingColor(null);
  };

  const columns = useMemo<ColumnDef<ColorRecord>[]>(
    () => [
      {
        accessorKey: 'colorCode',
        header: 'Mã màu',
        cell: (info) => (
          <span className="font-mono font-bold text-sm text-gray-700 dark:text-gray-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'colorName',
        header: 'Tên màu',
        cell: (info) => (
          <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'hexCode',
        header: 'Mã hex',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm flex-shrink-0"
              style={{ backgroundColor: row.original.hexCode }}
            />
            <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{row.original.hexCode}</span>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Mô tả',
        cell: (info) => (
          <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px] block">
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
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                s === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
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
            <button
              onClick={() => setSelected(row.original)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
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
              onClick={() => setDeletingColor(row.original)}
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
              <Palette className="w-6 h-6 text-emerald-500" />
              Quản lý màu sắc
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý danh mục màu sắc sản phẩm. Mỗi màu có mã hex để đồng bộ hiển thị trên toàn hệ thống.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Xuất danh sách
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thêm Màu Sắc
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Tổng màu sắc', value: data.length, color: 'text-gray-900 dark:text-white' },
            { label: 'Đang sử dụng', value: data.filter((c) => c.status === 'ACTIVE').length, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Ngừng sử dụng', value: data.filter((c) => c.status === 'INACTIVE').length, color: 'text-red-600 dark:text-red-400' },
            { label: 'Cập nhật gần đây', value: 3, color: 'text-blue-600 dark:text-blue-400' },
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
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã màu hoặc tên màu..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all"
            />
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      </div>

      {/* Drawer chi tiết */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Chi tiết: ${selected.colorName}` : ''}>
        {selected && (
          <div className="space-y-6 p-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-md flex-shrink-0"
                style={{ backgroundColor: selected.hexCode }}
              />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selected.colorName}</h3>
                <p className="text-sm font-mono text-gray-500">{selected.hexCode}</p>
                <span
                  className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selected.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {selected.status === 'ACTIVE' ? 'Đang dùng' : 'Ngừng dùng'}
                </span>
              </div>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              {[
                ['Mã màu', selected.colorCode],
                ['Tên màu', selected.colorName],
                ['Mã hex', selected.hexCode],
                ['Mô tả', selected.description || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{k}:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setSelected(null); handleOpenEdit(selected); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-colors"
              >
                <Edit className="w-4 h-4" /> Chỉnh sửa
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Màu Sắc mới' : 'Chỉnh sửa màu sắc'}
        width="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã màu *</label>
              <input
                required
                value={editingColor.colorCode || ''}
                onChange={(e) => setEditingColor({ ...editingColor, colorCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
                placeholder="CLR-001"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên màu *</label>
              <input
                required
                value={editingColor.colorName || ''}
                onChange={(e) => setEditingColor({ ...editingColor, colorName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Tên màu..."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã màu Hex *</label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center shrink-0">
                  <input
                    type="color"
                    id="colorPickerInput"
                    value={editingColor.hexCode?.startsWith('#') ? editingColor.hexCode : '#000000'}
                    onChange={(e) => setEditingColor({ ...editingColor, hexCode: e.target.value.toUpperCase() })}
                    className="w-12 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5 bg-white dark:bg-gray-800 shadow-sm"
                  />
                </div>
                <input
                  type="text"
                  value={editingColor.hexCode || ''}
                  onChange={(e) => {
                    let val = e.target.value.toUpperCase();
                    if (val && !val.startsWith('#') && /^[0-9A-F]{1,6}$/i.test(val)) {
                      val = '#' + val;
                    }
                    setEditingColor({ ...editingColor, hexCode: val });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="#000000"
                />
              </div>

              {/* Quick Preset Colors */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-gray-400 font-medium">Gợi ý màu:</span>
                {[
                  { name: 'Đen', hex: '#000000' },
                  { name: 'Trắng', hex: '#FFFFFF' },
                  { name: 'Đỏ', hex: '#EF4444' },
                  { name: 'Xanh dương', hex: '#3B82F6' },
                  { name: 'Xanh lá', hex: '#10B981' },
                  { name: 'Vàng', hex: '#F59E0B' },
                  { name: 'Tím', hex: '#8B5CF6' },
                  { name: 'Xám', hex: '#6B7280' },
                ].map(p => (
                  <button
                    key={p.hex}
                    type="button"
                    title={p.name}
                    onClick={() => setEditingColor({ ...editingColor, hexCode: p.hex })}
                    className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 shadow-xs hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: p.hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
            <textarea
              rows={2}
              value={editingColor.description || ''}
              onChange={(e) => setEditingColor({ ...editingColor, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Mô tả màu sắc..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
            <select
              value={editingColor.status || 'ACTIVE'}
              onChange={(e) => setEditingColor({ ...editingColor, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ACTIVE">Đang sử dụng</option>
              <option value="INACTIVE">Ngừng sử dụng</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm transition-colors">
              Hủy bỏ
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors">
              {modalMode === 'create' ? 'Tạo Mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal xóa */}
      <Modal isOpen={!!deletingColor} onClose={() => setDeletingColor(null)} title="Xác nhận xóa màu sắc" isDestructive width="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc muốn xóa màu <strong className="text-gray-900 dark:text-white">{deletingColor?.colorName}</strong> ({deletingColor?.colorCode})?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setDeletingColor(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
