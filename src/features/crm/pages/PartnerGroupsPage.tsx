import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Users, Layers, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface PartnerGroupItem {
  id: string;
  groupCode: string;
  name: string;
  type: 'KHÁCH_HÀNG' | 'NHÀ_CUNG_CẤP';
  description: string;
  memberCount: number;
  status: 'KÍCH_HOẠT' | 'KHOÁ';
  createdAt: string;
}

const MOCK_DATA: PartnerGroupItem[] = [
  { id: '1', groupCode: 'VIP_GOLD', name: 'Khách Hàng Thân Thiết Gold', type: 'KHÁCH_HÀNG', description: 'Nhóm khách hàng có tích lũy từ 50 triệu trở lên, hưởng ưu đãi chiết khấu 5% khi mua hàng', memberCount: 154, status: 'KÍCH_HOẠT', createdAt: '2026-01-15' },
  { id: '2', groupCode: 'SUP_FMCG', name: 'Nhà Cung Cấp Hàng Tiêu Dùng', type: 'NHÀ_CUNG_CẤP', description: 'Các đối tác cung ứng nhóm sản phẩm tiêu dùng nhanh (FMCG), chu kỳ thanh toán công nợ 30 ngày', memberCount: 18, status: 'KÍCH_HOẠT', createdAt: '2026-02-10' },
  { id: '3', groupCode: 'VIP_DIAMOND', name: 'Khách Hàng Kim Cương', type: 'KHÁCH_HÀNG', description: 'Khách hàng đặc biệt VIP có tích lũy từ 150 triệu trở lên, chiết khấu 10%', memberCount: 42, status: 'KÍCH_HOẠT', createdAt: '2026-01-20' },
  { id: '4', groupCode: 'SUP_FRESH', name: 'Nhà Cung Cấp Thực Phẩm Tươi Sống', type: 'NHÀ_CUNG_CẤP', description: 'Các hộ nông trại và hợp tác xã cung cấp thực phẩm rau củ quả tươi sống, giao hàng hàng ngày', memberCount: 12, status: 'KHOÁ', createdAt: '2026-03-01' },
  { id: '5', groupCode: 'WHOLESALE_CUST', name: 'Khách Hàng Mua Sỉ', type: 'KHÁCH_HÀNG', description: 'Nhóm khách hàng mua buôn với số lượng lớn, bảng giá chiết khấu riêng theo hợp đồng đại lý', memberCount: 88, status: 'KÍCH_HOẠT', createdAt: '2026-02-18' }
];

export function PartnerGroupsPage() {
  const [data, setData] = useState<PartnerGroupItem[]>(MOCK_DATA);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('Tất cả');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  
  const [selectedItem, setSelectedItem] = useState<PartnerGroupItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<PartnerGroupItem>>({});
  const [deletingItem, setDeletingItem] = useState<PartnerGroupItem | null>(null);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.groupCode.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'Tất cả' || item.type === typeFilter;
      const matchesStatus = statusFilter === 'Tất cả' || item.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [data, search, typeFilter, statusFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      groupCode: '',
      name: '',
      type: 'KHÁCH_HÀNG',
      description: '',
      memberCount: 0,
      status: 'KÍCH_HOẠT',
      createdAt: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PartnerGroupItem) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.groupCode || !editingItem.name || !editingItem.type) return;

    if (modalMode === 'create') {
      const newItem: PartnerGroupItem = {
        id: String(data.length + 1),
        groupCode: editingItem.groupCode.toUpperCase(),
        name: editingItem.name,
        type: editingItem.type as any,
        description: editingItem.description || '',
        memberCount: Number(editingItem.memberCount) || 0,
        status: editingItem.status || 'KÍCH_HOẠT',
        createdAt: editingItem.createdAt || new Date().toISOString().split('T')[0],
      };
      setData([...data, newItem]);
    } else if (editingItem.id) {
      setData(data.map((item) => (item.id === editingItem.id ? (editingItem as PartnerGroupItem) : item)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deletingItem) return;
    setData(data.filter((item) => item.id !== deletingItem.id));
    setDeletingItem(null);
  };

  const columns = useMemo<ColumnDef<PartnerGroupItem>[]>(
    () => [
      {
        accessorKey: 'groupCode',
        header: 'Mã Nhóm',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Tên Nhóm Đối Tác',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'type',
        header: 'Phân Loại',
        cell: (info) => {
          const type = info.getValue() as string;
          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${
                type === 'KHÁCH_HÀNG'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
              }`}
            >
              {type}
            </span>
          );
        },
      },
      {
        accessorKey: 'description',
        header: 'Mô Tả',
        cell: (info) => (
          <span className="text-gray-500 text-sm whitespace-normal max-w-xs block truncate" title={info.getValue() as string}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'memberCount',
        header: 'Số Thành Viên',
        cell: (info) => (
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {(info.getValue() as number).toLocaleString()}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nhóm Đối Tác (Khách hàng / Nhà cung cấp)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý phân loại nhóm đối tác để tối ưu chính sách chiết khấu, công nợ và chăm sóc khách hàng.
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
              <Plus className="w-4 h-4" /> Thêm nhóm đối tác
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
              placeholder="Tìm theo mã nhóm, tên hoặc mô tả..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Phân loại:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-2"
              >
                <option value="Tất cả">Tất cả phân loại</option>
                <option value="KHÁCH_HÀNG">KHÁCH HÀNG</option>
                <option value="NHÀ_CUNG_CẤP">NHÀ CUNG CẤP</option>
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
        title={selectedItem ? `Chi tiết nhóm đối tác: ${selectedItem.groupCode}` : 'Thông tin chi tiết'}
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs text-gray-500">Phân loại đối tác</p>
                <p className="text-base font-bold text-emerald-800 dark:text-emerald-400">{selectedItem.type}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Mã nhóm:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedItem.groupCode}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tên nhóm đối tác:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Số thành viên hiện tại:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedItem.memberCount.toLocaleString()} đối tác</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Ngày lập nhóm:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.createdAt}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Trạng thái áp dụng:</span>
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
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Mô tả & Định hướng chính sách</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedItem.description || 'Chưa cập nhật mô tả.'}</p>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal Thêm / Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Nhóm Đối Tác Mới' : 'Cập Nhật Nhóm Đối Tác'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã Nhóm *</label>
            <input
              type="text"
              value={editingItem.groupCode || ''}
              onChange={(e) => setEditingItem({ ...editingItem, groupCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Ví dụ: VIP_GOLD, SUP_FMCG"
              required
              disabled={modalMode === 'edit'}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên Nhóm Đối Tác *</label>
            <input
              type="text"
              value={editingItem.name || ''}
              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Nhập tên đầy đủ của nhóm..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phân Loại *</label>
            <select
              value={editingItem.type || 'KHÁCH_HÀNG'}
              onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="KHÁCH_HÀNG">KHÁCH HÀNG</option>
              <option value="NHÀ_CUNG_CẤP">NHÀ CUNG CẤP</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số Thành Viên Ban Đầu</label>
              <input
                type="number"
                min="0"
                value={editingItem.memberCount ?? 0}
                onChange={(e) => setEditingItem({ ...editingItem, memberCount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái hoạt động</label>
              <select
                value={editingItem.status || 'KÍCH_HOẠT'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="KÍCH_HOẠT">KÍCH HOẠT</option>
                <option value="KHOÁ">KHOÁ (Tạm ngưng)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả / Chính sách áp dụng</label>
            <textarea
              rows={3}
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Quyền lợi của nhóm đối tác này..."
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
        title="Xác nhận xóa nhóm đối tác"
        isDestructive
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa nhóm đối tác <strong className="text-gray-900 dark:text-white">{deletingItem?.name} ({deletingItem?.groupCode})</strong> không? 
            Thành viên của nhóm này sẽ được đưa về nhóm mặc định và không ảnh hưởng đến hồ sơ gốc.
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
