import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, Eye, Building2, Phone, Mail, MapPin, Star, FileText, CheckCircle2, User, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { usePurchaseStore, type SupplierRecord } from '../store/purchaseStore';
import { toast } from 'sonner';
import { CurrencyInput } from '@/shared/components/ui/CurrencyInput';
import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import { AddressCascadeSelect } from '@/shared/components/ui/AddressCascadeSelect';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';

export function SuppliersPage() {
  const { suppliers: data, addSupplier, updateSupplier, deleteSupplier, fetchSuppliers, isLoadingSuppliers } = usePurchaseStore();
  
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoCode, setIsAutoCode] = useState(true);
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
    setIsAutoCode(true);
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
    setIsAutoCode(false);
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier.supplierName || !editingSupplier.code) return;

    try {
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
        await addSupplier(newSupplier);
        toast.success('Đã thêm nhà cung cấp mới thành công');
      } else if (editingSupplier.id) {
        await updateSupplier(editingSupplier.id, editingSupplier);
        toast.success('Đã cập nhật thông tin nhà cung cấp');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Lưu nhà cung cấp thất bại');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSupplier) return;
    try {
      await deleteSupplier(deletingSupplier.id);
      toast.success('Đã xóa nhà cung cấp');
    } catch (err) {
      console.error(err);
      toast.error('Xóa nhà cung cấp thất bại');
    }
    setDeletingSupplier(null);
  };

  const categoryLabels: Record<string, string> = {
    GENERAL: 'Hàng hóa chung',
    ELECTRONICS: 'Thiết bị điện tử',
    APPAREL: 'Thời trang & May mặc',
    FOOD_BEVERAGE: 'Thực phẩm & Đồ uống',
    HARDWARE: 'Công cụ & Phần cứng',
    PACKAGING: 'Bao bì & Đóng gói',
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
        cell: (info) => <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-semibold">{categoryLabels[info.getValue() as string] || String(info.getValue())}</span>,
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh mục nhà cung cấp</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý đối tác nhà cung cấp, chỉ số hiệu suất và điều khoản hợp tác. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.success('Xuất danh sách nhà cung cấp thành công!')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-semibold shadow-sm hover:shadow active:scale-95 whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-all text-sm font-bold shadow hover:shadow-lg active:scale-95 whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" /> Thêm Nhà Cung Cấp Mới
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

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedSupplier(row)} isLoading={isLoadingSuppliers}/>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
        title={selectedSupplier ? `Hồ sơ nhà cung cấp: ${selectedSupplier.code}` : 'Chi tiết nhà cung cấp'}
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
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">{categoryLabels[selectedSupplier.category] || selectedSupplier.category}</p>
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
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Thông tin liên hệ trực tiếp</h3>
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
                <span className="text-gray-500 dark:text-gray-400">Đánh giá mức độ tin cậy:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500" /> {selectedSupplier.rating.toFixed(1)} / 5.0
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Thời gian giao hàng dự kiến:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedSupplier.leadTimeDays} ngày</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Điều khoản thanh toán:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedSupplier.paymentTerms}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Đơn mua hàng đang xử lý:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedSupplier.activeOrdersCount} POs</span>
              </div>

              {selectedSupplier.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Thỏa thuận mua hàng & Ghi chú</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedSupplier.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button
                onClick={() => toast.info('Đang chuyển hướng sang trang tạo đơn mua PO...')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
              >
                <FileText className="w-4 h-4" /> Tạo đơn đặt hàng mua (PO)
              </button>
              {selectedSupplier.status !== 'ACTIVE' && (
                <button
                  onClick={() => {
                    updateSupplier(selectedSupplier.id, { status: 'ACTIVE' });
                    setSelectedSupplier({ ...selectedSupplier, status: 'ACTIVE' });
                    toast.success('Đã khôi phục trạng thái hoạt động thành công!');
                  }}
                  className="px-4 py-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 inline mr-1" /> Khôi phục hoạt động
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm nhà cung cấp' : 'Cập nhật nhà cung cấp'}
        size="erp"
      >
        <form onSubmit={handleSaveSupplier}>
          <div className="erp-form-body">
            {/* Section 1: Thông tin doanh nghiệp */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Thông tin doanh nghiệp</h3>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Mã nhà cung cấp *</label>
                  {modalMode === 'create' && (
                    <label className="flex items-center gap-1 text-[10px] text-emerald-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAutoCode}
                        onChange={(e) => {
                          setIsAutoCode(e.target.checked);
                          if (e.target.checked) {
                            setEditingSupplier(prev => ({
                              ...prev,
                              code: `SUP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
                            }));
                          }
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-550 w-3 h-3"
                      />
                      <span>Tự động sinh</span>
                    </label>
                  )}
                </div>
                <input
                  type="text"
                  value={editingSupplier.code || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, code: e.target.value })}
                  disabled={modalMode === 'create' && isAutoCode}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên công ty / Tên đối tác *</label>
                  <input
                    type="text"
                    value={editingSupplier.supplierName || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, supplierName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên viết tắt (Short Name)</label>
                  <input
                    type="text"
                    value={(editingSupplier as any).shortName || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, shortName: e.target.value } as any)}
                    placeholder="VD: Vinamilk..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã số thuế (Tax Code)</label>
                  <input
                    type="text"
                    value={editingSupplier.taxCode || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, taxCode: e.target.value })}
                    placeholder="Mã số thuế doanh nghiệp"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thẻ phân loại (Tags)</label>
                  <input
                    type="text"
                    value={(editingSupplier as any).tags || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, tags: e.target.value } as any)}
                    placeholder="VD: Chien-Luoc, Uu-Tien, Nhap-Khau..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhóm nhà cung cấp</label>
                  <SearchLookupModal
                    title="Chọn Nhóm Nhà Cung Cấp"
                    iconType="building"
                    placeholder="Chọn nhóm NCC..."
                    value={editingSupplier.groupId}
                    options={[
                      { id: 'SUP-GRP-RAW', code: 'SUP-GRP-RAW', name: 'NCC Nguyên vật liệu thô', subtitle: 'Chiết khấu 10%' },
                      { id: 'SUP-GRP-IMP', code: 'SUP-GRP-IMP', name: 'NCC Hàng nhập khẩu', subtitle: 'Thanh toán LC/Net30' },
                      { id: 'SUP-GRP-LOCAL', code: 'SUP-GRP-LOCAL', name: 'NCC Đơn vị nội địa', subtitle: 'Giao hàng nhanh' },
                    ]}
                    onChange={(val) => setEditingSupplier(prev => ({ ...prev, groupId: val }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khu vực phân phối</label>
                  <SearchLookupModal
                    title="Chọn Khu Vực"
                    iconType="location"
                    placeholder="Chọn khu vực..."
                    value={editingSupplier.areaId}
                    options={[
                      { id: 'AREA-MIEN-BAC', code: 'AREA-MB', name: 'Khu vực Miền Bắc (Hà Nội, Hải Phòng...)' },
                      { id: 'AREA-MIEN-NAM', code: 'AREA-MN', name: 'Khu vực Miền Nam (TP.HCM, Cần Thơ...)' },
                      { id: 'AREA-OVERSEAS', code: 'AREA-OS', name: 'Nhà cung cấp Quốc tế' },
                    ]}
                    onChange={(val) => setEditingSupplier(prev => ({ ...prev, areaId: val }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Danh mục hàng hóa chính (Chọn nhiều)</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900/40 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                  {[
                    { id: 'GENERAL', label: 'Hàng hóa chung' },
                    { id: 'ELECTRONICS', label: 'Thiết bị điện tử' },
                    { id: 'APPAREL', label: 'Thời trang & Phụ kiện' },
                    { id: 'FOOD_BEVERAGE', label: 'Thực phẩm & Đồ uống' },
                    { id: 'HARDWARE', label: 'Công cụ & Phần cứng' },
                    { id: 'PACKAGING', label: 'Bao bì & Đóng gói' },
                  ].map((cat) => {
                    const currentCats = (editingSupplier.category || 'GENERAL').split(',').map(c => c.trim());
                    const isChecked = currentCats.includes(cat.id);
                    return (
                      <label key={cat.id} className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let updated: string[];
                            if (e.target.checked) {
                              updated = [...currentCats, cat.id].filter(Boolean);
                            } else {
                              updated = currentCats.filter(c => c !== cat.id);
                            }
                            if (updated.length === 0) updated = ['GENERAL'];
                            setEditingSupplier({ ...editingSupplier, category: Array.from(new Set(updated)).join(',') });
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                        />
                        {cat.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái giao dịch</label>
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

            {/* Section 2: Liên hệ & Công nợ */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Liên hệ & Công nợ</h3>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người đại diện liên hệ (Contact Person)</label>
                <input
                  type="text"
                  value={editingSupplier.contactPerson || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, contactPerson: e.target.value })}
                  placeholder="Họ tên người phụ trách kinh doanh..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editingSupplier.phone || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email liên hệ</label>
                  <input
                    type="email"
                    value={editingSupplier.email || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <AddressCascadeSelect
                  addressDetail={editingSupplier.address || ''}
                  onChange={({ province, district, ward, addressDetail }) => {
                    const fullAddr = [addressDetail, ward, district, province].filter(Boolean).join(', ');
                    setEditingSupplier(prev => ({ ...prev, address: fullAddr }));
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Điều khoản thanh toán (Payment Terms)</label>
                  <select
                    value={editingSupplier.paymentTerm ?? 30}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, paymentTerm: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={0}>COD - Thanh toán ngay khi nhận hàng</option>
                    <option value={7}>Net 7 - Thanh toán trong 7 ngày</option>
                    <option value={15}>Net 15 - Thanh toán trong 15 ngày</option>
                    <option value={30}>Net 30 - Thanh toán trong 30 ngày (Tiêu chuẩn)</option>
                    <option value={60}>Net 60 - Thanh toán trong 60 ngày</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hạn mức nợ (Credit Limit)</label>
                  <CurrencyInput
                    value={editingSupplier.creditLimit ?? 0}
                    onChange={(val) => setEditingSupplier(prev => ({ ...prev, creditLimit: val }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <FileDropzone
                  label="Hồ sơ hợp tác & Giấy phép đăng ký kinh doanh (PDF/Image)"
                />
              </div>
            </div>

            {/* Section 3: Ngân hàng & Ghi chú */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Thanh toán & Ghi chú</h3>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên ngân hàng</label>
                <input
                  type="text"
                  value={editingSupplier.bankName || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, bankName: e.target.value })}
                  placeholder="Ví dụ: Vietcombank, Techcombank..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Thông tin các Tài khoản Ngân hàng (Cho phép nhập 2-3+ TK)
                </label>
                <textarea
                  rows={2}
                  value={editingSupplier.bankAccount || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, bankAccount: e.target.value })}
                  placeholder="Ví dụ:&#10;TK 1: 1902838392 - Vietcombank (Chủ TK: CTY VINAMILK)&#10;TK 2: 0918273645 - Techcombank (Chủ TK: CTY VINAMILK)..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú & Thỏa thuận</label>
                <textarea
                  rows={2}
                  value={editingSupplier.notes || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, notes: e.target.value })}
                  placeholder="Ghi chú về chiết khấu, thời gian giao hàng, điều khoản hợp đồng..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="erp-form-footer">
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
          <div className="flex justify-end gap-3 pt-4">
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
