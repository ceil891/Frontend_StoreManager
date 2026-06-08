import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, MapPin, Globe, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface AreaItem {
  id: string;
  areaCode: string;
  name: string;
  level: 'TỈNH_THÀNH' | 'QUẬN_HUYỆN' | 'PHƯỜNG_XÃ';
  parentId: string | null;
  parentName?: string;
  status: 'KÍCH_HOẠT' | 'KHOÁ';
  createdAt: string;
  description?: string;
}

const MOCK_DATA: AreaItem[] = [
  { id: '1', areaCode: 'KV_HN', name: 'Thành phố Hà Nội', level: 'TỈNH_THÀNH', parentId: null, status: 'KÍCH_HOẠT', createdAt: '2026-01-01', description: 'Khu vực quản lý trọng điểm phía Bắc' },
  { id: '2', areaCode: 'KV_HCM', name: 'Thành phố Hồ Chí Minh', level: 'TỈNH_THÀNH', parentId: null, status: 'KÍCH_HOẠT', createdAt: '2026-01-01', description: 'Khu vực trung tâm thương mại lớn phía Nam' },
  { id: '3', areaCode: 'KV_HN_CG', name: 'Quận Cầu Giấy', level: 'QUẬN_HUYỆN', parentId: '1', parentName: 'Thành phố Hà Nội', status: 'KÍCH_HOẠT', createdAt: '2026-01-05', description: 'Khu vực tập trung nhiều văn phòng và trường đại học' },
  { id: '4', areaCode: 'KV_HCM_Q1', name: 'Quận 1', level: 'QUẬN_HUYỆN', parentId: '2', parentName: 'Thành phố Hồ Chí Minh', status: 'KÍCH_HOẠT', createdAt: '2026-01-06', description: 'Quận tài chính trung tâm TP.HCM' },
  { id: '5', areaCode: 'KV_HN_CG_DV', name: 'Phường Dịch Vọng', level: 'PHƯỜNG_XÃ', parentId: '3', parentName: 'Quận Cầu Giấy', status: 'KÍCH_HOẠT', createdAt: '2026-01-10', description: 'Thuộc địa bàn Cầu Giấy' },
  { id: '6', areaCode: 'KV_HCM_Q1_BN', name: 'Phường Bến Nghé', level: 'PHƯỜNG_XÃ', parentId: '4', parentName: 'Quận 1', status: 'KÍCH_HOẠT', createdAt: '2026-01-11', description: 'Thuộc địa bàn trung tâm Quận 1' },
  { id: '7', areaCode: 'KV_DN', name: 'Thành phố Đà Nẵng', level: 'TỈNH_THÀNH', parentId: null, status: 'KHOÁ', createdAt: '2026-02-01', description: 'Khu vực miền Trung đang tạm ngưng quản lý do tái cấu trúc' }
];

export function AreasPage() {
  const [data, setData] = useState<AreaItem[]>(MOCK_DATA);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('Tất cả');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');

  const [selectedItem, setSelectedItem] = useState<AreaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<AreaItem>>({});
  const [deletingItem, setDeletingItem] = useState<AreaItem | null>(null);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.areaCode.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.parentName && item.parentName.toLowerCase().includes(search.toLowerCase()));
      const matchesLevel = levelFilter === 'Tất cả' || item.level === levelFilter;
      const matchesStatus = statusFilter === 'Tất cả' || item.status === statusFilter;
      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [data, search, levelFilter, statusFilter]);

  // Options for parent area selection (only show TỈNH_THÀNH or QUẬN_HUYỆN)
  const parentOptions = useMemo(() => {
    return data.filter(item => item.level !== 'PHƯỜNG_XÃ');
  }, [data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      areaCode: '',
      name: '',
      level: 'TỈNH_THÀNH',
      parentId: '',
      description: '',
      status: 'KÍCH_HOẠT',
      createdAt: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AreaItem) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.areaCode || !editingItem.name || !editingItem.level) return;

    // Resolve parent name
    let resolvedParentName = '';
    const parentIdVal = editingItem.parentId || null;
    if (parentIdVal) {
      const parentObj = data.find(item => item.id === parentIdVal);
      if (parentObj) {
        resolvedParentName = parentObj.name;
      }
    }

    if (modalMode === 'create') {
      const newItem: AreaItem = {
        id: String(data.length + 1),
        areaCode: editingItem.areaCode.toUpperCase(),
        name: editingItem.name,
        level: editingItem.level as any,
        parentId: parentIdVal,
        parentName: resolvedParentName || undefined,
        description: editingItem.description || '',
        status: editingItem.status || 'KÍCH_HOẠT',
        createdAt: editingItem.createdAt || new Date().toISOString().split('T')[0],
      };
      setData([...data, newItem]);
    } else if (editingItem.id) {
      setData(data.map((item) => (item.id === editingItem.id ? {
        ...(editingItem as AreaItem),
        parentId: parentIdVal,
        parentName: resolvedParentName || undefined
      } : item)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deletingItem) return;
    setData(data.filter((item) => item.id !== deletingItem.id));
    setDeletingItem(null);
  };

  const columns = useMemo<ColumnDef<AreaItem>[]>(
    () => [
      {
        accessorKey: 'areaCode',
        header: 'Mã Khu Vực',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Tên Khu Vực',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'level',
        header: 'Cấp Quản Lý',
        cell: (info) => {
          const val = info.getValue() as string;
          const levelMap: Record<string, { label: string; color: string }> = {
            TỈNH_THÀNH: { label: 'Tỉnh/Thành phố', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
            QUẬN_HUYỆN: { label: 'Quận/Huyện', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
            PHƯỜNG_XÃ: { label: 'Phường/Xã', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
          };
          const resolved = levelMap[val] || { label: val, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${resolved.color}`}>
              {resolved.label}
            </span>
          );
        },
      },
      {
        accessorKey: 'parentName',
        header: 'Khu Vực Cha',
        cell: (info) => (
          <span className="text-gray-600 dark:text-gray-400 font-medium">
            {info.getValue() as string || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                status === 'KÍCH_HOẠT'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'KÍCH_HOẠT' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors shrink-0"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Khu Vực Địa Lý (Địa Bàn Kinh Doanh)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý phân cấp địa lý hành chính phục vụ định tuyến giao hàng, phân công nhân sự và phân tích doanh thu khu vực.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thêm khu vực
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã, tên hoặc khu vực cha..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Cấp quản lý:</span>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-2"
              >
                <option value="Tất cả">Tất cả cấp độ</option>
                <option value="TỈNH_THÀNH">Tỉnh / Thành phố</option>
                <option value="QUẬN_HUYỆN">Quận / Huyện</option>
                <option value="PHƯỜNG_XÃ">Phường / Xã</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-2"
              >
                <option value="Tất cả">Tất cả trạng thái</option>
                <option value="KÍCH_HOẠT">KÍCH HOẠT</option>
                <option value="KHOÁ">KHOÁ</option>
              </select>
            </div>
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={setSelectedItem} />
      </div>

      {/* Drawer Chi tiết */}
      <Drawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem ? `Chi tiết địa bàn: ${selectedItem.name}` : 'Thông tin chi tiết'}
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <MapPin className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs text-gray-500">Mã định danh khu vực</p>
                <p className="text-base font-bold text-emerald-800 dark:text-emerald-400">{selectedItem.areaCode}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tên khu vực:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedItem.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Cấp quản lý hành chính:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedItem.level === 'TỈNH_THÀNH' ? 'Tỉnh / Thành phố' : selectedItem.level === 'QUẬN_HUYỆN' ? 'Quận / Huyện' : 'Phường / Xã'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Khu vực quản lý cấp trên (Cha):</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.parentName || 'Không có (Cấp cao nhất)'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Ngày tạo:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.createdAt}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Trạng thái địa lý:</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    selectedItem.status === 'KÍCH_HOẠT'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                  }`}
                >
                  {selectedItem.status}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Mô tả / Phạm vi địa lý</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedItem.description || 'Chưa có mô tả chi tiết cho khu vực này.'}</p>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal Thêm / Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Khu Vực Mới' : 'Cập Nhật Khu Vực'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã Khu Vực *</label>
            <input
              type="text"
              value={editingItem.areaCode || ''}
              onChange={(e) => setEditingItem({ ...editingItem, areaCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Ví dụ: KV_DN, KV_HN_CG_DV"
              required
              disabled={modalMode === 'edit'}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên Khu Vực Địa Lý *</label>
            <input
              type="text"
              value={editingItem.name || ''}
              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Nhập tên tỉnh/thành, quận/huyện, phường/xã..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cấp Quản Lý *</label>
            <select
              value={editingItem.level || 'TỈNH_THÀNH'}
              onChange={(e) => setEditingItem({ ...editingItem, level: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="TỈNH_THÀNH">Tỉnh / Thành phố</option>
              <option value="QUẬN_HUYỆN">Quận / Huyện</option>
              <option value="PHƯỜNG_XÃ">Phường / Xã</option>
            </select>
          </div>

          {editingItem.level !== 'TỈNH_THÀNH' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khu Vực Cha (Cấp trên)</label>
              <select
                value={editingItem.parentId || ''}
                onChange={(e) => setEditingItem({ ...editingItem, parentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Chọn khu vực cha --</option>
                {parentOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} ({opt.level === 'TỈNH_THÀNH' ? 'Tỉnh' : 'Quận'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng Thái</label>
            <select
              value={editingItem.status || 'KÍCH_HOẠT'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="KÍCH_HOẠT">KÍCH HOẠT (Hoạt động)</option>
              <option value="KHOÁ">KHOÁ (Ngưng dùng)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả chi tiết / Ghi chú</label>
            <textarea
              rows={3}
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Thông tin thêm về địa bàn..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              {modalMode === 'create' ? 'Tạo mới' : 'Lưu cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Xác nhận Xóa */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="Xác nhận xóa khu vực địa lý"
        isDestructive
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa địa bàn <strong className="text-gray-900 dark:text-white">{deletingItem?.name} ({deletingItem?.areaCode})</strong> không?
            Các khu vực con trực thuộc (nếu có) cũng cần được điều chỉnh sang địa bàn quản lý mới để tránh mất định tuyến.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingItem(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
