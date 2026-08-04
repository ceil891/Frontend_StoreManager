import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, Eye, Tag, DollarSign, Calendar, CheckCircle2, ShieldCheck, Copy, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { useFinanceStore, type TransactionReasonRecord } from '../store/financeStore';
import { toast } from 'sonner';
import { exportToCsv } from '@/shared/utils/exportCsv';

const categoryBadgeStyles = {
  OPERATING_REVENUE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  COST_OF_GOODS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  PAYROLL_EXPENSE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
  CAPEX_EQUIPMENT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  TAX_VAT_SETTLEMENT: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200',
  INTEREST_FEES: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
};

const categoryMap: Record<string, string> = {
  OPERATING_REVENUE: 'Doanh thu hoạt động',
  COST_OF_GOODS: 'Giá vốn hàng bán',
  PAYROLL_EXPENSE: 'Chi phí nhân sự',
  CAPEX_EQUIPMENT: 'Chi phí vốn tài sản',
  TAX_VAT_SETTLEMENT: 'Thuế & Nghĩa vụ tài chính',
  INTEREST_FEES: 'Lãi vay & Phí tài chính',
};

const impactMap: Record<string, string> = {
  INFLOW_DEBIT: 'Dòng tiền vào (Inflow)',
  OUTFLOW_CREDIT: 'Dòng tiền ra (Outflow)',
  NEUTRAL_TRANSFER: 'Chuyển quỹ nội bộ',
};

const statusMap: Record<string, string> = {
  ACTIVE: 'Đang áp dụng (Active)',
  ARCHIVED: 'Đã lưu trữ (Archived)',
  REQUIRES_CFO_REVIEW: 'Chờ duyệt (CFO Review)',
};

export function TransactionReasonsPage() {
  const data = useFinanceStore((s) => s.transactionReasons);
  const addTransactionReason = useFinanceStore((s) => s.addTransactionReason);
  const updateTransactionReason = useFinanceStore((s) => s.updateTransactionReason);
  const deleteTransactionReason = useFinanceStore((s) => s.deleteTransactionReason);
  const fetchTransactionReasons = useFinanceStore((s) => s.fetchTransactionReasons);

  useEffect(() => {
    fetchTransactionReasons();
  }, [fetchTransactionReasons]);

  const [search, setSearch] = useState('');
  const [selectedReason, setSelectedReason] = useState<TransactionReasonRecord | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingReason, setEditingReason] = useState<Partial<TransactionReasonRecord>>({});
  const [deletingReason, setDeletingReason] = useState<TransactionReasonRecord | null>(null);

  const filtered = data.filter((item) =>
    item.reasonCode.toLowerCase().includes(search.toLowerCase()) ||
    item.reasonName.toLowerCase().includes(search.toLowerCase()) ||
    item.accountingGLCode.toLowerCase().includes(search.toLowerCase()) ||
    item.applicableDepartments.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingReason({
      reasonCode: `RSN-NEW-${Math.floor(100 + Math.random() * 900)}`,
      reasonName: '',
      category: 'OPERATING_REVENUE',
      accountingGLCode: 'GL-40100',
      cashFlowImpact: 'INFLOW_DEBIT',
      isTaxDeductible: false,
      requiresReceiptUpload: false,
      totalLoggedVolumeUsd: 0,
      status: 'REQUIRES_CFO_REVIEW',
      applicableDepartments: 'Tất cả phòng ban',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: TransactionReasonRecord) => {
    setModalMode('edit');
    setEditingReason(record);
    setIsModalOpen(true);
  };

  const handleSaveReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReason.reasonCode || !editingReason.reasonName) return;

    if (modalMode === 'create') {
      addTransactionReason({
        reasonCode: editingReason.reasonCode || `RSN-NEW-${Math.floor(100 + Math.random() * 900)}`,
        reasonName: editingReason.reasonName || 'Lý do giao dịch',
        category: editingReason.category || 'OPERATING_REVENUE',
        accountingGLCode: editingReason.accountingGLCode || 'GL-40100',
        cashFlowImpact: editingReason.cashFlowImpact || 'INFLOW_DEBIT',
        isTaxDeductible: !!editingReason.isTaxDeductible,
        requiresReceiptUpload: !!editingReason.requiresReceiptUpload,
        totalLoggedVolumeUsd: Number(editingReason.totalLoggedVolumeUsd) || 0,
        status: editingReason.status || 'REQUIRES_CFO_REVIEW',
        applicableDepartments: editingReason.applicableDepartments || 'Phòng ban chung',
        description: editingReason.description,
      });
    } else if (editingReason.id) {
      updateTransactionReason(editingReason.id, editingReason);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingReason) return;
    deleteTransactionReason(deletingReason.id);
    setDeletingReason(null);
  };

  const columns = useMemo<ColumnDef<TransactionReasonRecord>[]>(
    () => [
      {
        accessorKey: 'reasonCode',
        header: 'Mã lý do',
        cell: (info) => <span className="font-mono font-bold text-primary hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'reasonName',
        header: 'Mô tả & Định khoản GL',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.reasonName}</p>
            <p className="text-xs text-gray-500 font-mono">Tài khoản kế toán: {row.original.accountingGLCode} ({row.original.applicableDepartments})</p>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Nhóm hạch toán',
        cell: (info) => {
          const cat = info.getValue() as keyof typeof categoryBadgeStyles;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${categoryBadgeStyles[cat]}`}>
              {categoryMap[cat] || cat}
            </span>
          );
        },
      },
      {
        accessorKey: 'cashFlowImpact',
        header: 'Ảnh hưởng dòng tiền',
        cell: (info) => {
          const impact = info.getValue() as string;
          return (
            <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
              impact === 'INFLOW_DEBIT' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200' :
              impact === 'OUTFLOW_CREDIT' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200' :
              'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}>
              {impactMap[impact] || impact}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalLoggedVolumeUsd',
        header: 'Tổng phát sinh ($)',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white">${(info.getValue() as number).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>,
      },
      {
        accessorKey: 'requiresReceiptUpload',
        header: 'Kiểm duyệt chứng từ',
        cell: (info) => (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            info.getValue() as boolean ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 font-bold' : 'text-gray-400 font-mono'
          }`}>
            {info.getValue() as boolean ? 'BẮT BUỘC KÈM HÓA ĐƠN' : 'KHÔNG BẮT BUỘC'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'REQUIRES_CFO_REVIEW' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
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
              onClick={(e) => { e.stopPropagation(); setSelectedReason(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingReason(row.original); }}
              title="Xóa mã lý do"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mã lý do hạch toán kế toán (GL reason codes)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Thiết lập danh mục lý do giao dịch, liên kết mã tài khoản tổng hợp (General Ledger), và quản lý quy định kiểm duyệt chứng từ.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                exportToCsv('danh_muc_ly_do_gl', filtered, [
                  { header: 'Mã lý do', accessor: r => r.reasonCode },
                  { header: 'Tên lý do', accessor: r => r.reasonName },
                  { header: 'Phân loại', accessor: r => categoryMap[r.category] || r.category },
                  { header: 'Mã tài khoản GL', accessor: r => r.accountingGLCode },
                  { header: 'Dòng tiền', accessor: r => impactMap[r.cashFlowImpact] || r.cashFlowImpact },
                  { header: 'Tài khoản khấu trừ', accessor: r => r.isTaxDeductible ? 'Có' : 'Không' },
                  { header: 'Trạng thái', accessor: r => statusMap[r.status] || r.status },
                ]);
                toast.success('Đã xuất danh mục lý do GL dạng CSV!');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất bảng ánh xạ GL
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tạo mã lý do mới
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
              placeholder="Tìm kiếm theo mã, tên lý do, mã tài khoản GL hoặc phòng ban..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm">
            <Filter className="w-4 h-4" /> Lọc danh mục
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedReason(row)} />
      </div>

      <Modal
        isOpen={!!selectedReason}
        onClose={() => setSelectedReason(null)}
        title={selectedReason ? `Quy Cài Đặt Lý Do: ${selectedReason.reasonCode}` : 'Chi tiết lý do giao dịch'}
        width="max-w-lg"
      >
        {selectedReason && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedReason.status === 'ACTIVE'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : selectedReason.status === 'REQUIRES_CFO_REVIEW'
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedReason.status === 'ACTIVE' ? 'bg-emerald-600' : selectedReason.status === 'REQUIRES_CFO_REVIEW' ? 'bg-amber-600' : 'bg-gray-600'
                }`}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tổng giao dịch lũy kế</p>
                  <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                    ${selectedReason.totalLoggedVolumeUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedReason.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedReason.status === 'REQUIRES_CFO_REVIEW' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              }`}>
                {statusMap[selectedReason.status] || selectedReason.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Tag className="w-4 h-4 text-primary" /> Mã tài khoản kế toán (GL)
                </div>
                <p className="text-lg font-mono font-bold text-gray-900 dark:text-white truncate">{selectedReason.accountingGLCode}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Khấu trừ thuế (VAT/TNDN)
                </div>
                <p className={`text-base font-bold truncate ${selectedReason.isTaxDeductible ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>
                  {selectedReason.isTaxDeductible ? 'CÓ (Hợp lệ khấu trừ)' : 'KHÔNG (Chi phí không được trừ)'}
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Nội dung diễn giải lý do</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedReason.reasonName}</h3>
                <span className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-bold border ${categoryBadgeStyles[selectedReason.category]}`}>
                  Nhóm: {categoryMap[selectedReason.category] || selectedReason.category}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Phòng ban áp dụng:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedReason.applicableDepartments}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-sans">Tác động báo cáo lưu chuyển tiền tệ:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{impactMap[selectedReason.cashFlowImpact] || selectedReason.cashFlowImpact}</span>
              </div>

              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">TK đối ứng mặc định:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedReason.defaultOffsetGLCode || 'Không thiết lập'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Giới hạn ngân sách:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedReason.budgetLimit !== undefined ? `$${selectedReason.budgetLimit.toLocaleString('en-US')}` : 'Không giới hạn'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Yêu cầu đính kèm hóa đơn kiểm toán:</span>
                <span className={`font-bold ${selectedReason.requiresReceiptUpload ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'}`}>
                  {selectedReason.requiresReceiptUpload ? 'BẮT BUỘC TRÊN PHIẾU' : 'KHÔNG YÊU CẦU BẮT BUỘC'}
                </span>
              </div>

              {selectedReason.description && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú & Quy định kế toán</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedReason.description}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedReason.status === 'REQUIRES_CFO_REVIEW' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Phê duyệt & Ban hành mã lý do
                </button>
              )}
              <button
                onClick={() => navigator.clipboard.writeText(selectedReason.reasonCode)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow transition-colors text-sm"
              >
                <Copy className="w-4 h-4" /> Sao chép mã GL
              </button>
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <ShieldCheck className="w-4 h-4 inline mr-1" /> Xem các giao dịch liên kết
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Thêm / Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo mã lý do kế toán mới' : 'Chỉnh sửa mã lý do hạch toán'}
        width="max-w-xl"
      >
        <form onSubmit={handleSaveReason} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã lý do (Code) *</label>
              <input
                type="text"
                value={editingReason.reasonCode || ''}
                onChange={(e) => setEditingReason({ ...editingReason, reasonCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tài khoản kế toán GL *</label>
              <input
                type="text"
                value={editingReason.accountingGLCode || ''}
                onChange={(e) => setEditingReason({ ...editingReason, accountingGLCode: e.target.value })}
                placeholder="GL-40100..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung mô tả lý do *</label>
            <input
              type="text"
              value={editingReason.reasonName || ''}
              onChange={(e) => setEditingReason({ ...editingReason, reasonName: e.target.value })}
              placeholder="Doanh thu bán hàng POS, Chi phí bảo trì..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhóm hạch toán</label>
              <select
                value={editingReason.category || 'OPERATING_REVENUE'}
                onChange={(e) => setEditingReason({ ...editingReason, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="OPERATING_REVENUE">Doanh thu hoạt động (Operating Revenue)</option>
                <option value="COST_OF_GOODS">Giá vốn hàng bán (Cost of Goods)</option>
                <option value="PAYROLL_EXPENSE">Chi phí nhân sự (Payroll)</option>
                <option value="CAPEX_EQUIPMENT">Chi phí đầu tư tài sản (Capex)</option>
                <option value="TAX_VAT_SETTLEMENT">Thuế & Nghĩa vụ tài chính (Taxes)</option>
                <option value="INTEREST_FEES">Lãi vay & Phí dịch vụ (Interest)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tác động dòng tiền</label>
              <select
                value={editingReason.cashFlowImpact || 'INFLOW_DEBIT'}
                onChange={(e) => setEditingReason({ ...editingReason, cashFlowImpact: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="INFLOW_DEBIT">Dòng tiền vào (Inflow)</option>
                <option value="OUTFLOW_CREDIT">Dòng tiền ra (Outflow)</option>
                <option value="NEUTRAL_TRANSFER">Chuyển quỹ nội bộ (Neutral)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phòng ban áp dụng</label>
              <input
                type="text"
                value={editingReason.applicableDepartments || ''}
                onChange={(e) => setEditingReason({ ...editingReason, applicableDepartments: e.target.value })}
                placeholder="Phòng Kế toán, Kinh doanh..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái phê duyệt</label>
              <select
                value={editingReason.status || 'ACTIVE'}
                onChange={(e) => setEditingReason({ ...editingReason, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="ACTIVE">Đang áp dụng (Active)</option>
                <option value="REQUIRES_CFO_REVIEW">Chờ giám đốc duyệt (CFO Review)</option>
                <option value="ARCHIVED">Đã lưu trữ (Archived)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 py-2 border-y border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editingReason.isTaxDeductible || false}
                onChange={(e) => setEditingReason({ ...editingReason, isTaxDeductible: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
              />
              Khoản mục hợp lệ khấu trừ thuế (Tax Deductible)
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editingReason.requiresReceiptUpload || false}
                onChange={(e) => setEditingReason({ ...editingReason, requiresReceiptUpload: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
              />
              Bắt buộc đính kèm hóa đơn kiểm toán
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú & Hướng dẫn hạch toán</label>
            <textarea
              rows={2}
              value={editingReason.description || ''}
              onChange={(e) => setEditingReason({ ...editingReason, description: e.target.value })}
              placeholder="Ghi chú về quy định thuế và hướng dẫn nhập liệu cho kế toán viên..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
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
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              {modalMode === 'create' ? 'Tạo mã lý do' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xác nhận xóa */}
      <Modal
        isOpen={!!deletingReason}
        onClose={() => setDeletingReason(null)}
        title="Xác nhận vô hiệu hóa mã lý do"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa mã hạch toán <strong className="text-gray-900 dark:text-white">{deletingReason?.reasonCode}</strong>: <span className="font-semibold">{deletingReason?.reasonName}</span>?
          </p>
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-200 dark:border-red-800/40">
            Hành động này sẽ ngăn không cho các phiếu thu/chi mới sử dụng mã lý do này nữa. Các chứng từ cũ đã liên kết vẫn được bảo lưu dữ liệu.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingReason(null)}
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
