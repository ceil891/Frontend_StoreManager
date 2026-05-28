import { useState, useMemo } from 'react';
import { useBannerStore, type Banner } from '../store/bannerStore';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Image as ImageIcon, Link as LinkIcon, Calendar, Edit, Trash2, Power, PowerOff, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

export default function BannerManagementPage() {
  const { banners, addBanner, updateBanner, deleteBanner, toggleBannerStatus } = useBannerStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingBanner, setEditingBanner] = useState<Partial<Banner>>({});
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);

  const columns = useMemo<ColumnDef<Banner>[]>(
    () => [
      {
        id: 'dragHandle',
        header: '',
        cell: () => <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />,
        size: 40,
      },
      {
        accessorKey: 'imageUrl',
        header: 'Hình ảnh',
        cell: (info) => (
          <div className="w-24 h-12 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700">
            {info.getValue() ? (
              <img src={info.getValue() as string} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Tiêu đề Banner',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'linkUrl',
        header: 'Đường dẫn (URL)',
        cell: (info) => (
          <a href={info.getValue() as string} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline flex items-center gap-1 text-xs">
            <LinkIcon className="w-3 h-3" />
            {info.getValue() as string}
          </a>
        ),
      },
      {
        id: 'validity',
        header: 'Thời gian áp dụng',
        cell: ({ row }) => (
          <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Từ: {row.original.validFrom}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Đến: {row.original.validUntil}</span>
          </div>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Trạng thái',
        cell: (info) => {
          const isActive = info.getValue() as boolean;
          return (
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
              isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {isActive ? 'Đang chạy' : 'Đã ẩn'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleBannerStatus(row.original.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                row.original.isActive 
                  ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' 
                  : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
              }`}
              title={row.original.isActive ? 'Tạm ẩn banner' : 'Kích hoạt banner'}
            >
              {row.original.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingBanner(row.original)}
              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [toggleBannerStatus]
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingBanner({
      title: '',
      imageUrl: '',
      linkUrl: '',
      isActive: true,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      order: banners.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setModalMode('edit');
    setEditingBanner({ ...banner });
    setIsModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      addBanner(editingBanner as Omit<Banner, 'id'>);
      toast.success('Thêm banner thành công!');
    } else if (editingBanner.id) {
      updateBanner(editingBanner.id, editingBanner);
      toast.success('Cập nhật banner thành công!');
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingBanner) {
      deleteBanner(deletingBanner.id);
      toast.success('Xóa banner thành công!');
      setDeletingBanner(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingBanner(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Banner</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Thiết lập banner quảng cáo cho POS và ứng dụng khách hàng.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Thêm Banner
        </button>
      </div>

      <ReusableDataTable
        data={banners}
        columns={columns}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Banner Mới' : 'Cập Nhật Banner'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSaveBanner} className="space-y-5">
          {/* Image Drag & Drop Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hình ảnh Banner *</label>
            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 group">
              {editingBanner.imageUrl ? (
                <div className="relative w-full h-40">
                  <img src={editingBanner.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-sm font-medium flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Đổi ảnh khác
                    </span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              ) : (
                <div className="w-full h-40 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <ImageIcon className="w-8 h-8 mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-medium">Kéo thả hoặc Click để tải ảnh</p>
                  <p className="text-xs mt-1">PNG, JPG, WEBP (Tỉ lệ khuyến nghị: 16:9)</p>
                  <input type="file" accept="image/*" onChange={handleImageUpload} required className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tiêu đề Banner *</label>
              <input
                type="text"
                value={editingBanner.title || ''}
                onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-900"
                required
                placeholder="VD: Khuyến mãi mùa Hè 2026"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Đường dẫn khi click (Link URL)</label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={editingBanner.linkUrl || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, linkUrl: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-900"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bắt đầu áp dụng</label>
              <input
                type="date"
                value={editingBanner.validFrom || ''}
                onChange={(e) => setEditingBanner({ ...editingBanner, validFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kết thúc</label>
              <input
                type="date"
                value={editingBanner.validUntil || ''}
                onChange={(e) => setEditingBanner({ ...editingBanner, validUntil: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-900"
                required
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={editingBanner.isActive}
                onChange={(e) => setEditingBanner({ ...editingBanner, isActive: e.target.checked })}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Kích hoạt hiển thị Banner ngay lập tức
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
            >
              {modalMode === 'create' ? 'Tạo Banner' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingBanner}
        onClose={() => setDeletingBanner(null)}
        title="Xác nhận xóa Banner"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc chắn muốn xóa banner <strong className="text-gray-900 dark:text-white">{deletingBanner?.title}</strong> không? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={() => setDeletingBanner(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Hủy</button>
            <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm">Xác nhận Xóa</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
