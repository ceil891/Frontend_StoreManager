import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, ShieldAlert, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { usePermissionStore, type Permission as PermissionItem } from '../store/permissionStore';
import { toast } from 'sonner';

export function PermissionsPage() {
  const { 
    permissions, 
    fetchPermissions,
    addPermission,
    updatePermission,
    deletePermission,
  } = usePermissionStore();
  const [data, setData] = useState<PermissionItem[]>([]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    setData(permissions as PermissionItem[]);
  }, [permissions]);

  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('Tất cả');
  const [selectedItem, setSelectedItem] = useState<PermissionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<PermissionItem>>({});
  const [deletingItem, setDeletingItem] = useState<PermissionItem | null>(null);

  const modules = useMemo(() => ['Tất cả', ...Array.from(new Set(data.map((item) => item.module)))], [data]);

  const filtered = data.filter((item) => {
    const matchesSearch =
      item.permissionCode.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesModule = moduleFilter === 'Tất cả' || item.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      permissionCode: '',
      module: 'Bán hàng (POS)',
      description: '',
      status: 'KÍCH_HOẠT',
      tenantId: 'tenant-1',
      version: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PermissionItem) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.permissionCode || !editingItem.module) {
      toast.error('Vui lòng nhập Mã quyền và Phân hệ');
      return;
    }

    try {
      if (modalMode === 'create') {
        await addPermission(editingItem);
        toast.success(`Thêm quyền ${editingItem.permissionCode} thành công!`);
      } else if (editingItem.id) {
        await updatePermission(editingItem.id, editingItem);
        toast.success(`Cập nhật quyền ${editingItem.permissionCode} thành công!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Lỗi khi lưu thông tin quyền.');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deletePermission(deletingItem.id);
      toast.success(`Đã xóa quyền ${deletingItem.permissionCode}`);
      setDeletingItem(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Lỗi khi xóa quyền.');
    }
  };

  const columns = useMemo<ColumnDef<PermissionItem>[]>(
    () => [
      {
        accessorKey: 'permissionCode',
        header: 'Mã quyền',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'module',
        header: 'Phân hệ',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'description',
        header: 'Mô tả quyền',
        cell: (info) => <span className="text-gray-500 text-sm whitespace-normal max-w-xs block">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
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
        header: 'Thao tác',
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quyền chi tiết hệ thống</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý và cấp quyền chi tiết của các tính năng hoạt động trên toàn hệ thống RetailHub.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Khai báo Quyền mới
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm items-stretch sm:items-center">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã quyền hoặc mô tả..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Lọc Phân hệ:</span>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2"
            >
              {modules.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedItem(row)} />
      </div>

      {/* Drawer Chi tiết */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem ? `Chi tiết quyền: ${selectedItem.permissionCode}` : 'Thông tin chi tiết'}
        width="max-w-lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs text-gray-500">Mã phân hệ ứng dụng</p>
                <p className="text-base font-bold text-emerald-800 dark:text-emerald-400">{selectedItem.module}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Mã định danh:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedItem.permissionCode}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Ngày tạo hệ thống:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.createdAt}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Mã phân mảnh (Tenant):</span>
                <span className="font-mono text-gray-900 dark:text-white">{selectedItem.tenantId}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Phiên bản (Version):</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.version}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Trạng thái:</span>
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
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Mô tả tác vụ</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedItem.description}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Khai báo / Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Khai báo Quyền truy cập mới' : 'Cập nhật thông tin Quyền'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã quyền *</label>
            <input
              type="text"
              value={editingItem.permissionCode || ''}
              onChange={(e) => setEditingItem({ ...editingItem, permissionCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Ví dụ: sales:orders:delete"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phân hệ *</label>
            <input
              type="text"
              value={editingItem.module || ''}
              onChange={(e) => setEditingItem({ ...editingItem, module: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Ví dụ: Bán hàng (POS), Kho vận"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả Quyền</label>
            <textarea
              rows={3}
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Giải thích chi tiết phạm vi quyền lợi của mã này..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
            <select
              value={editingItem.status || 'KÍCH_HOẠT'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="KÍCH_HOẠT">Kích hoạt hoạt động</option>
              <option value="KHOÁ">Khóa quyền tạm thời</option>
            </select>
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
              {modalMode === 'create' ? 'Tạo Mới' : 'Lưu cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Xác nhận Xóa */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="Xác nhận xóa mã quyền"
        isDestructive
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa mã quyền <strong className="text-gray-900 dark:text-white">{deletingItem?.permissionCode}</strong> không? Các phân quyền liên quan trong Nhóm quyền sẽ bị hủy bỏ tương ứng.
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
