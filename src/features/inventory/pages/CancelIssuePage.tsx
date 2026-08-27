import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, AlertCircle, Building2, Calendar, FileText, CheckCircle2, Edit, Trash2, X, User, ImageIcon, RefreshCw } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { exportToCsv } from '@/shared/utils/exportCsv';
import { useInventoryStore, type CancelIssueRecord } from '../store/inventoryStore';

export function CancelIssuePage() {
  const {
    cancelIssues: data,
    fetchCancelIssues,
    fetchProducts,
    addCancelIssue,
    updateCancelIssue,
    deleteCancelIssue,
    products,
  } = useInventoryStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchCancelIssues(), fetchProducts()]).finally(() => setIsLoading(false));
  }, [fetchCancelIssues, fetchProducts]);

  const [search, setSearch] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<CancelIssueRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingIssue, setEditingIssue] = useState<Partial<CancelIssueRecord>>({});
  const [deletingIssue, setDeletingIssue] = useState<CancelIssueRecord | null>(null);

  const filtered = data.filter((item) => {
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.issueCode.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.locationHub.toLowerCase().includes(q)
      );
    }
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setSaveError(null);
    setFormMode('create');
    const firstProduct = products[0];
    setEditingIssue({
      issueCode: `CI-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      sku: firstProduct?.sku || '',
      productName: firstProduct?.name || '',
      category: 'Chung',
      quantity: 1,
      totalValuation: firstProduct?.price || 0,
      reason: 'DAMAGED',
      locationHub: 'Chi nhánh chính',
      loggedDate: new Date().toISOString().split('T')[0],
      reportedBy: '',
      authorizedBy: '',
      proofImages: [],
      status: 'PENDING_APPROVAL',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (issue: CancelIssueRecord) => {
    setSaveError(null);
    setFormMode('edit');
    setEditingIssue(issue);
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIssue.sku || !editingIssue.quantity || !editingIssue.reason) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      const selectedProduct = products.find(p => p.sku === editingIssue.sku);
      const payload: Omit<CancelIssueRecord, 'id'> = {
        issueCode: editingIssue.issueCode || `CI-${Date.now()}`,
        sku: editingIssue.sku!,
        productName: selectedProduct?.name || editingIssue.productName || '',
        category: editingIssue.category || 'Chung',
        quantity: Number(editingIssue.quantity),
        totalValuation: (selectedProduct?.price || 0) * Number(editingIssue.quantity),
        reason: editingIssue.reason as any,
        locationHub: editingIssue.locationHub || 'Chi nhánh chính',
        loggedDate: editingIssue.loggedDate || new Date().toISOString().split('T')[0],
        reportedBy: editingIssue.reportedBy || '',
        authorizedBy: editingIssue.authorizedBy || '',
        proofImages: editingIssue.proofImages || [],
        status: editingIssue.status as any || 'PENDING_APPROVAL',
        notes: editingIssue.notes || '',
      };

      if (formMode === 'create') {
        await addCancelIssue(payload);
      } else if (editingIssue.id) {
        await updateCancelIssue(editingIssue.id, editingIssue);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingIssue) return;
    await deleteCancelIssue(deletingIssue.id);
    setDeletingIssue(null);
  };

  const columns = useMemo<ColumnDef<CancelIssueRecord>[]>(
    () => [
      {
        accessorKey: 'issueCode',
        header: 'Mã phiếu',
        cell: (info) => <span className="font-mono font-bold text-red-600 dark:text-red-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Sản phẩm / SKU',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{row.original.productName}</p>
            <p className="text-xs font-mono text-gray-500">{row.original.sku}</p>
          </div>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Số lượng hủy',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white">{((info.getValue() as number) || 0).toLocaleString('vi-VN')}</span>,
      },
      {
        accessorKey: 'totalValuation',
        header: 'Tổng tổn thất',
        cell: (info) => (
          <span className="font-mono text-red-600 font-semibold">
            {((info.getValue() as number) || 0).toLocaleString('vi-VN')} đ
          </span>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Lý do hủy',
        cell: (info) => {
          const reason = info.getValue() as string;
          const reasonMap: Record<string, string> = {
            DAMAGED: 'Hư hỏng vật lý',
            EXPIRED: 'Hết hạn sử dụng',
            QUALITY_DEFECT: 'Lỗi nhà sản xuất',
            LOST: 'Thất lạc kho',
            THEFT: 'Thất thoát / Mất cắp',
          };
          return <span className="text-gray-700 dark:text-gray-300 text-xs">{reasonMap[reason] || reason}</span>;
        },
      },
      {
        accessorKey: 'locationHub',
        header: 'Vị trí kho',
        cell: (info) => <span className="text-gray-700 dark:text-gray-300 text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, { label: string; class: string }> = {
            PENDING_APPROVAL: { label: 'Chờ duyệt', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
            APPROVED: { label: 'Đã duyệt', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
            REJECTED: { label: 'Từ chối', class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
            PROCESSED: { label: 'Đã hạch toán', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
          };
          const item = statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
          return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.class}`}>{item.label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedIssue(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingIssue(row.original); }}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ghi nhận hủy hàng & thất thoát</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lập biên bản hàng hư hỏng, hết hạn, thất thoát và hạch toán giảm trừ tồn kho</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                exportToCsv('danh-sach-huy-hang', filtered, [
                  { header: 'Mã phiếu', accessor: r => r.issueCode },
                  { header: 'Mã SKU', accessor: r => r.sku },
                  { header: 'Tên sản phẩm', accessor: r => r.productName },
                  { header: 'Số lượng', accessor: r => r.quantity },
                  { header: 'Tổng trị giá', accessor: r => r.totalValuation },
                  { header: 'Lý do', accessor: r => r.reason },
                  { header: 'Vị trí kho', accessor: r => r.locationHub },
                  { header: 'Người báo cáo', accessor: r => r.reportedBy },
                  { header: 'Người duyệt', accessor: r => r.authorizedBy || '' },
                  { header: 'Trạng thái', accessor: r => r.status },
                  { header: 'Ngày lập', accessor: r => r.loggedDate },
                ]);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tạo phiếu hủy hàng
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm theo mã phiếu, tên sản phẩm, SKU hoặc kho..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PENDING_APPROVAL">Chờ duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Từ chối</option>
                <option value="PROCESSED">Đã hạch toán</option>
              </select>
            </div>

            {(statusFilter !== 'all' || search) && (
              <button
                onClick={() => { setStatusFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Đang tải dữ liệu từ hệ thống...</span>
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedIssue(row)} />
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        title={selectedIssue ? `Chi tiết hủy hàng: ${selectedIssue.issueCode}` : 'Chi tiết phiếu'}
        width="max-w-lg"
      >
        {selectedIssue && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-red-800 dark:text-red-400 font-semibold uppercase tracking-wider">Tổn thất ước tính</p>
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">{(selectedIssue.totalValuation || 0).toLocaleString('vi-VN')} đ</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedIssue.status === 'APPROVED' || selectedIssue.status === 'PROCESSED' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedIssue.status === 'PENDING_APPROVAL' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedIssue.status === 'APPROVED' ? 'Đã duyệt' :
                 selectedIssue.status === 'PROCESSED' ? 'Đã hạch toán' :
                 selectedIssue.status === 'PENDING_APPROVAL' ? 'Chờ duyệt' : 'Từ chối'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  Ngày báo cáo
                </div>
                <p className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                  {selectedIssue.loggedDate}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-primary" />
                  Số lượng hủy
                </div>
                <p className="text-lg font-bold text-red-600">
                  {selectedIssue.quantity.toLocaleString('vi-VN')} đơn vị
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Sản phẩm</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedIssue.productName} ({selectedIssue.sku})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Vị trí kho</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedIssue.locationHub}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Người báo cáo</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedIssue.reportedBy}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Người phê duyệt</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedIssue.authorizedBy || 'Chưa duyệt'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 dark:text-gray-400">Lý do hủy</span>
                <span className="font-medium text-red-600">{selectedIssue.reason}</span>
              </div>
            </div>

            {selectedIssue.notes && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Ghi chú chi tiết</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                  {selectedIssue.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setSelectedIssue(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'create' ? 'Tạo phiếu hủy hàng & thất thoát mới' : 'Cập nhật phiếu hủy hàng'}
        width="max-w-xl"
      >
        <form onSubmit={handleSaveForm} className="space-y-4">
          {saveError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {saveError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Mã phiếu *</label>
                {formMode === 'create' && (
                  <button
                    type="button"
                    onClick={() => setEditingIssue(prev => ({ ...prev, issueCode: `CI-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}` }))}
                    className="text-[10px] text-primary hover:underline font-semibold"
                  >
                    Tự sinh mã
                  </button>
                )}
              </div>
              <input
                type="text"
                value={editingIssue.issueCode || ''}
                onChange={(e) => setEditingIssue({ ...editingIssue, issueCode: e.target.value })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                readOnly={formMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày ghi nhận *</label>
              <input
                type="date"
                value={editingIssue.loggedDate || ''}
                onChange={(e) => setEditingIssue({ ...editingIssue, loggedDate: e.target.value })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chọn sản phẩm *</label>
              <select
                value={editingIssue.sku || ''}
                onChange={(e) => {
                  const p = products.find(prod => prod.sku === e.target.value);
                  const qty = editingIssue.quantity || 1;
                  const price = p?.price || 0;
                  setEditingIssue({
                    ...editingIssue,
                    sku: e.target.value,
                    productName: p?.name || '',
                    totalValuation: price * qty
                  });
                }}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">-- Chọn sản phẩm hủy --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.sku}>{p.sku} — {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng hủy *</label>
              <input
                type="number"
                min={1}
                value={editingIssue.quantity || ''}
                onChange={(e) => {
                  const qty = Number(e.target.value) || 0;
                  const p = products.find(prod => prod.sku === editingIssue.sku);
                  const price = p?.price || 0;
                  setEditingIssue({
                    ...editingIssue,
                    quantity: qty,
                    totalValuation: price * qty
                  });
                }}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng tổn thất dự tính (đ)</label>
              <input
                type="number"
                value={editingIssue.totalValuation || 0}
                onChange={(e) => setEditingIssue({ ...editingIssue, totalValuation: Number(e.target.value) })}
                className="w-full p-2.5 border border-red-300 dark:border-red-700 rounded-lg font-mono bg-red-50 dark:bg-red-950/30 text-red-600 font-bold text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lý do hủy hàng *</label>
              <select
                value={editingIssue.reason || 'DAMAGED'}
                onChange={(e) => setEditingIssue({ ...editingIssue, reason: e.target.value as any })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                required
              >
                <option value="DAMAGED">Hư hỏng vật lý / vỡ nát</option>
                <option value="EXPIRED">Hết hạn sử dụng (expired)</option>
                <option value="QUALITY_DEFECT">Lỗi nhà sản xuất / biến chất</option>
                <option value="LOST">Thất lạc trong kho</option>
                <option value="THEFT">Mất cắp / thất thoát</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Vị trí kho xuất hủy</label>
              <input
                type="text"
                value={editingIssue.locationHub || ''}
                onChange={(e) => setEditingIssue({ ...editingIssue, locationHub: e.target.value })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                placeholder="Ví dụ: Kho tổng..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người báo cáo *</label>
              <input
                type="text"
                value={editingIssue.reportedBy || ''}
                onChange={(e) => setEditingIssue({ ...editingIssue, reportedBy: e.target.value })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                placeholder="Tên thủ kho báo cáo..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người duyệt</label>
              <input
                type="text"
                value={editingIssue.authorizedBy || ''}
                onChange={(e) => setEditingIssue({ ...editingIssue, authorizedBy: e.target.value })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                placeholder="Tên quản lý duyệt..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
            <select
              value={editingIssue.status || 'PENDING_APPROVAL'}
              onChange={(e) => setEditingIssue({ ...editingIssue, status: e.target.value as any })}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="PENDING_APPROVAL">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Từ chối</option>
              <option value="PROCESSED">Đã hạch toán</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú biên bản</label>
            <textarea
              rows={2}
              value={editingIssue.notes || ''}
              onChange={(e) => setEditingIssue({ ...editingIssue, notes: e.target.value })}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary resize-none"
              placeholder="Nhập ghi chú chi tiết về tình trạng hàng hóa..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Đang lưu...' : (formMode === 'create' ? 'Tạo phiếu hủy' : 'Lưu cập nhật')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deletingIssue}
        onClose={() => setDeletingIssue(null)}
        title="Xác nhận xóa phiếu hủy hàng"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4 text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            Bạn có chắc chắn muốn xóa phiếu hủy hàng <strong>{deletingIssue?.issueCode}</strong>? Thao tác này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setDeletingIssue(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium">Hủy bỏ</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
export default CancelIssuePage;
