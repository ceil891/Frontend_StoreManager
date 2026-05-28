import { useMemo, useState } from 'react';
import { Plus, Download, Search, Filter, Eye, Building2, Phone, Mail, MapPin, Star, FileText, CheckCircle2, User, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { usePurchaseStore, type SupplierRecord } from '../store/purchaseStore';

export function SuppliersPage() {
  const { suppliers: data, addSupplier, updateSupplier, deleteSupplier } = usePurchaseStore();
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingSupplier, setEditingSupplier] = useState<Partial<SupplierRecord>>({});
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierRecord | null>(null);

  const filtered = data.filter((item) =>
    item.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    item.code.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingSupplier({
      code: `SUP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      supplierName: '',
      category: 'GENERAL',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      rating: 5.0,
      leadTimeDays: 7,
      paymentTerms: 'Net 30',
      activeOrdersCount: 0,
      status: 'ACTIVE',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: SupplierRecord) => {
    setModalMode('edit');
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier.supplierName || !editingSupplier.code) return;

    if (modalMode === 'create') {
      const newSupplier: Omit<SupplierRecord, 'id'> = {
        code: editingSupplier.code,
        supplierName: editingSupplier.supplierName,
        category: editingSupplier.category as any || 'GENERAL',
        contactPerson: editingSupplier.contactPerson || '',
        phone: editingSupplier.phone || '',
        email: editingSupplier.email || '',
        address: editingSupplier.address || '',
        rating: Number(editingSupplier.rating) || 5.0,
        leadTimeDays: Number(editingSupplier.leadTimeDays) || 7,
        paymentTerms: editingSupplier.paymentTerms || 'Net 30',
        activeOrdersCount: Number(editingSupplier.activeOrdersCount) || 0,
        status: editingSupplier.status as any || 'ACTIVE',
        notes: editingSupplier.notes || ''
      };
      addSupplier(newSupplier);
    } else if (editingSupplier.id) {
      updateSupplier(editingSupplier.id, editingSupplier);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingSupplier) return;
    deleteSupplier(deletingSupplier.id);
    setDeletingSupplier(null);
  };

  const columns = useMemo<ColumnDef<SupplierRecord>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Mã nhà cung cấp',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Tên nhà cung cấp',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'category',
        header: 'Danh mục',
        cell: (info) => <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-semibold">{String(info.getValue()).replace('_', ' ')}</span>,
      },
      {
        accessorKey: 'contactPerson',
        header: 'Người liên hệ',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{row.original.contactPerson}</p>
            <p className="text-xs text-gray-500">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: 'rating',
        header: 'Đánh giá',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 font-semibold text-amber-500 text-sm">
            <Star className="w-3.5 h-3.5 fill-amber-500" /> {Number(info.getValue()).toFixed(1)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            ACTIVE: 'Hoạt động',
            ON_HOLD: 'Tạm ngưng',
            INACTIVE: 'Ngừng giao dịch',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'ON_HOLD' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {statusMap[status] || status}
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
              onClick={(e) => { e.stopPropagation(); setSelectedSupplier(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors shrink-0"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingSupplier(row.original); }}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh mục Nhà cung cấp</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý đối tác nhà cung cấp, chỉ số hiệu suất và điều khoản hợp tác. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0">
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" /> Thêm nhà cung cấp
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
              placeholder="Tìm kiếm theo tên nhà cung cấp, mã hoặc danh mục..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button title="Bộ lọc" className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm whitespace-nowrap shrink-0">
            <Filter className="w-4 h-4" /> Bộ lọc
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedSupplier(row)} />
      </div>

      {/* Details Drawer */}
      <Drawer
        isOpen={!!selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
        title={selectedSupplier ? `Vendor Card: ${selectedSupplier.code}` : 'Vendor Details'}
        width="max-w-lg"
      >
        {selectedSupplier && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">{selectedSupplier.category.replace('_', ' ')}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedSupplier.supplierName}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedSupplier.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedSupplier.status === 'ON_HOLD' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedSupplier.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Direct Contact Information</h3>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="font-semibold">{selectedSupplier.contactPerson}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <a href={`tel:${selectedSupplier.phone}`} className="hover:underline">{selectedSupplier.phone}</a>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <a href={`mailto:${selectedSupplier.email}`} className="hover:underline">{selectedSupplier.email}</a>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{selectedSupplier.address}</span>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Vendor Reliability Rating:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500" /> {selectedSupplier.rating.toFixed(1)} / 5.0
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Est. Fulfillment Lead Time:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedSupplier.leadTimeDays} business days</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Agreed Payment Terms:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedSupplier.paymentTerms}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">In-Flight Active Purchase Orders:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedSupplier.activeOrdersCount} POs</span>
              </div>

              {selectedSupplier.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Procurement Agreements & Notes</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedSupplier.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                <FileText className="w-4 h-4" /> Create Purchase Order
              </button>
              {selectedSupplier.status !== 'ACTIVE' && (
                <button className="px-4 py-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" /> Restore Active Status
                </button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Nhà Cung Cấp' : 'Cập Nhật Nhà Cung Cấp'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã nhà cung cấp *</label>
              <input
                type="text"
                value={editingSupplier.code || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên công ty / Đối tác *</label>
              <input
                type="text"
                value={editingSupplier.supplierName || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, supplierName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục hàng hóa</label>
              <select
                value={editingSupplier.category || 'GENERAL'}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="GENERAL">Hàng hóa chung (General)</option>
                <option value="ELECTRONICS">Thiết bị điện tử (Electronics)</option>
                <option value="APPAREL">Thời trang (Apparel)</option>
                <option value="FOOD_BEVERAGE">Thực phẩm & Đồ uống</option>
                <option value="HARDWARE">Công cụ & Phần cứng</option>
                <option value="PACKAGING">Bao bì & Đóng gói</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select
                value={editingSupplier.status || 'ACTIVE'}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ACTIVE">Đang giao dịch (Active)</option>
                <option value="ON_HOLD">Tạm ngưng (On Hold)</option>
                <option value="INACTIVE">Ngừng giao dịch (Inactive)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người đại diện (Contact Person)</label>
              <input
                type="text"
                value={editingSupplier.contactPerson || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, contactPerson: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đánh giá (1-5 sao)</label>
              <input
                type="number"
                min="1" max="5" step="0.1"
                value={editingSupplier.rating || 5}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, rating: parseFloat(e.target.value) || 5 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={editingSupplier.phone || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={editingSupplier.email || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ kho / trụ sở</label>
            <input
              type="text"
              value={editingSupplier.address || ''}
              onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian giao hàng dự kiến (Ngày)</label>
              <input
                type="number"
                value={editingSupplier.leadTimeDays || 0}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, leadTimeDays: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Điều khoản thanh toán</label>
              <input
                type="text"
                value={editingSupplier.paymentTerms || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, paymentTerms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="VD: Net 30, Due on Receipt..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú (Tùy chọn)</label>
            <textarea
              rows={2}
              value={editingSupplier.notes || ''}
              onChange={(e) => setEditingSupplier({ ...editingSupplier, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
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
              {modalMode === 'create' ? 'Lưu thông tin' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingSupplier}
        onClose={() => setDeletingSupplier(null)}
        title="Xác nhận xóa nhà cung cấp"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa nhà cung cấp <strong className="text-gray-900 dark:text-white">{deletingSupplier?.supplierName}</strong> khỏi hệ thống? 
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingSupplier(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Đồng ý xóa
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
