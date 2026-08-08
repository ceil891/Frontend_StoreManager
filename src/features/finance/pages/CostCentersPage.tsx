import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash, Info } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

const columns = [
  {
    header: 'Mã trung tâm',
    accessorKey: 'id',
    cell: ({ row }: any) => (
      <div className="flex items-center space-x-2">
        <Info size={16} className="text-gray-500" />
        <span>{row.original.id}</span>
      </div>
    ),
  },
  { header: 'Tên trung tâm chi phí', accessorKey: 'name' },
  { header: 'Mô tả', accessorKey: 'description' },
  { header: 'Chi nhánh quản lý', accessorKey: 'branch' },
  {
    header: 'Trạng thái',
    accessorKey: 'isActive',
    cell: ({ row }: any) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
      >
        {row.original.isActive ? 'HOẠT ĐỘNG' : 'NGỪNG HOẠT ĐỘNG'}
      </span>
    ),
  },
  {
    header: 'Thao tác',
    id: 'actions',
    cell: ({ row }: any) => (
      <div className="flex space-x-2">
        <button
          onClick={() => row.original && row.original.onEdit(row.original)}
          className="p-1 text-blue-600 hover:text-blue-800"
          title="Chỉnh sửa"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={() => row.original && row.original.onDelete(row.original.id)}
          className="p-1 text-red-600 hover:text-red-800"
          title="Xóa"
        >
          <Trash size={16} />
        </button>
      </div>
    ),
  },
];

const CostCentersPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCostCenters = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get('/accounting/cost-centers');
      const list = (res as any).content || res || [];
      const mapped = (Array.isArray(list) ? list : []).map((item: any) => ({
        dbId: item.id, // Lưu ID thực tế của database để gọi PUT/DELETE
        id: item.centerCode || `CC-${item.id}`,
        name: item.centerName || '',
        description: item.description || item.note || '',
        branch: 'Chi nhánh mặc định', // backend CostCenter chưa có branch, lưu tạm
        isActive: item.isDeleted !== true,
      }));
      setData(mapped);
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu trung tâm chi phí:', err);
      toast.error('Không thể tải danh sách trung tâm chi phí');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCostCenters();
  }, [fetchCostCenters]);

  // Xử lý mở Drawer chi tiết
  const handleRowClick = (item: any) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  // Mở Modal thêm mới
  const handleAddNew = () => {
    setSelectedItem({ id: '', name: '', description: '', branch: '', isActive: true });
    setEditMode(false);
    setModalOpen(true);
  };

  // Mở Modal chỉnh sửa
  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setEditMode(true);
    setModalOpen(true);
  };

  // Xóa
  const handleDelete = async (id: string) => {
    const item = data.find(c => c.id === id);
    if (!item) return;

    if (confirm('Bạn có chắc muốn xóa trung tâm chi phí này?')) {
      try {
        await axiosClient.delete(`/accounting/cost-centers/${item.dbId}`);
        toast.success('Xóa trung tâm chi phí thành công');
        await fetchCostCenters();
      } catch (err) {
        console.error('Lỗi khi xóa trung tâm chi phí:', err);
        toast.error('Không thể xóa trung tâm chi phí');
      }
    }
  };

  // Lưu (thêm hoặc cập nhật)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem.id || !selectedItem.name) {
      alert('Vui lòng nhập đầy đủ Mã và Tên trung tâm');
      return;
    }

    try {
      const payload = {
        centerCode: selectedItem.id,
        centerName: selectedItem.name,
        description: selectedItem.description || '',
      };

      if (isEditMode) {
        await axiosClient.put(`/accounting/cost-centers/${selectedItem.dbId}`, payload);
        toast.success('Cập nhật trung tâm chi phí thành công');
      } else {
        // Kiểm tra trùng mã
        if (data.some(c => c.id === selectedItem.id)) {
          alert('Mã trung tâm đã tồn tại');
          return;
        }
        await axiosClient.post('/accounting/cost-centers', payload);
        toast.success('Thêm trung tâm chi phí thành công');
      }
      setModalOpen(false);
      await fetchCostCenters();
    } catch (err) {
      console.error('Lỗi khi lưu trung tâm chi phí:', err);
      toast.error('Lỗi khi lưu trung tâm chi phí');
    }
  };

  // Gắn các hàm thao tác vào mỗi dòng để ReusableDataTable có thể gọi
  const enrichedData = data.map(item => ({
    ...item,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onRowClick: () => handleRowClick(item),
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Quản lý Trung tâm chi phí</h1>
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-gray-600">Tổng số trung tâm: {data.length}</div>
        <button
          onClick={handleAddNew}
          className="flex items-center space-x-1 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
        >
          <Plus size={16} />
          <span>Thêm Mới</span>
        </button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <ReusableDataTable
          columns={columns}
          data={enrichedData}
          onRowClick={(row: any) => row.original.onRowClick && row.original.onRowClick()}
        />
      )}

      {/* Drawer chi tiết */}
      <Modal isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} title="Chi tiết Trung tâm chi phí" width="max-w-lg">
        {selectedItem && (
          <div className="space-y-2 text-sm">
            <p><strong>Mã trung tâm:</strong> {selectedItem.id}</p>
            <p><strong>Tên:</strong> {selectedItem.name}</p>
            <p><strong>Mô tả:</strong> {selectedItem.description}</p>
            <p><strong>Chi nhánh:</strong> {selectedItem.branch}</p>
            <p><strong>Trạng thái:</strong> {selectedItem.isActive ? 'HOẠT ĐỘNG' : 'NGỪNG HOẠT ĐỘNG'}</p>
          </div>
        )}
      </Modal>

      {/* Modal thêm / sửa */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={isEditMode ? 'Chỉnh sửa Trung tâm chi phí' : 'Thêm Mới Trung tâm chi phí'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã trung tâm</label>
            <input
              type="text"
              value={selectedItem?.id || ''}
              onChange={e => setSelectedItem({ ...selectedItem, id: e.target.value })}
              className="w-full border rounded px-3 py-2"
              disabled={isEditMode}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên trung tâm</label>
            <input
              type="text"
              value={selectedItem?.name || ''}
              onChange={e => setSelectedItem({ ...selectedItem, name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={selectedItem?.description || ''}
              onChange={e => setSelectedItem({ ...selectedItem, description: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
            <input
              type="text"
              value={selectedItem?.branch || ''}
              onChange={e => setSelectedItem({ ...selectedItem, branch: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedItem?.isActive ?? true}
              onChange={e => setSelectedItem({ ...selectedItem, isActive: e.target.checked })}
              id="activeToggle"
            />
            <label htmlFor="activeToggle" className="text-sm">Kích hoạt</label>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Lưu</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CostCentersPage;
