import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, Eye, Calendar, User, TrendingUp, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useFinanceStore, type DebtRecord } from '../store/financeStore';
import { toast } from 'sonner';
import { exportToCsv } from '@/shared/utils/exportCsv';

const entityTypeMap: Record<string, string> = {
  CUSTOMER: 'Khách hàng',
  SUPPLIER: 'Nhà cung cấp',
  PARTNER: 'Đối tác',
};

const statusMapFull: Record<string, string> = {
  NORMAL: 'Bình thường',
  DUE_SOON: 'Sắp đến hạn',
  OVERDUE: 'Quá hạn',
  SETTLED: 'Đã tất toán',
};

export function DebtLedgerPage() {
  const data = useFinanceStore((s) => s.debts);
  const addDebt = useFinanceStore((s) => s.addDebt);
  const updateDebt = useFinanceStore((s) => s.updateDebt);
  const deleteDebt = useFinanceStore((s) => s.deleteDebt);
  const fetchDebts = useFinanceStore((s) => s.fetchDebts);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const [search, setSearch] = useState('');
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingDebt, setEditingDebt] = useState<Partial<DebtRecord>>({});
  const [deletingDebt, setDeletingDebt] = useState<DebtRecord | null>(null);

  const filtered = data.filter((item) =>
    item.entityName.toLowerCase().includes(search.toLowerCase()) ||
    item.debtCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingDebt({
      debtCode: `DBT-2024-${Math.floor(100 + Math.random() * 900)}`,
      entityName: '',
      entityType: 'CUSTOMER',
      totalDebt: 0,
      dueAmount: 0,
      dueDate: new Date().toISOString().substring(0, 10),
      status: 'NORMAL',
      lastPaymentDate: new Date().toISOString().substring(0, 10),
      accountManager: 'Sarah Jenkins',
      branchId: 'BR-001',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: DebtRecord) => {
    setModalMode('edit');
    setEditingDebt(record);
    setIsModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt.debtCode || !editingDebt.entityName) return;

    if (modalMode === 'create') {
      addDebt({
        debtCode: editingDebt.debtCode || `DBT-2024-${Math.floor(100 + Math.random() * 900)}`,
        entityName: editingDebt.entityName || 'Đối tác',
        entityType: editingDebt.entityType || 'CUSTOMER',
        totalDebt: Number(editingDebt.totalDebt) || 0,
        dueAmount: Number(editingDebt.dueAmount) || 0,
        dueDate: editingDebt.dueDate || new Date().toISOString().substring(0, 10),
        status: editingDebt.status || 'NORMAL',
        lastPaymentDate: editingDebt.lastPaymentDate,
        accountManager: editingDebt.accountManager || 'Quản lý viên',
        branchId: editingDebt.branchId || 'BR-001',
        notes: editingDebt.notes,
      });
    } else if (editingDebt.id) {
      updateDebt(editingDebt.id, editingDebt);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingDebt) return;
    deleteDebt(deletingDebt.id);
    setDeletingDebt(null);
  };

  const columns = useMemo<ColumnDef<DebtRecord>[]>(
    () => [
      {
        accessorKey: 'debtCode',
        header: 'Mã số',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'entityName',
        header: 'Đối tác / Doanh nghiệp',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'entityType',
        header: 'Loại hình',
        cell: (info) => {
          const type = info.getValue() as string;
          return <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">{entityTypeMap[type] || type}</span>;
        },
      },
      {
        accessorKey: 'referenceDoc',
        header: 'Chứng từ gốc',
        cell: (info) => <span className="font-mono text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer">{info.getValue() as string || '-'}</span>,
      },
      {
        accessorKey: 'totalDebt',
        header: 'Tổng công nợ',
        cell: ({ row }) => {
          const val = row.original.totalDebt;
          const curr = row.original.currency || 'VND';
          const prefix = curr === 'USD' ? '$' : '';
          const suffix = curr === 'VND' ? ' ₫' : curr !== 'USD' ? ` ${curr}` : '';
          return <span className={`font-bold font-mono ${val >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{val >= 0 ? `+${prefix}${val.toLocaleString('en-US')}${suffix}` : `-${prefix}${Math.abs(val).toLocaleString('en-US')}${suffix}`}</span>;
        },
      },
      {
        accessorKey: 'incurredDate',
        header: 'Ngày phát sinh',
        cell: (info) => <span className="text-gray-500 text-sm font-mono">{info.getValue() as string || '-'}</span>,
      },
      {
        accessorKey: 'dueDate',
        header: 'Hạn thanh toán',
        cell: (info) => <span className="text-gray-500 text-sm font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'SETTLED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'NORMAL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'DUE_SOON' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {statusMapFull[status] || status}
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
              onClick={(e) => { e.stopPropagation(); setSelectedDebt(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
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
              onClick={(e) => { e.stopPropagation(); setDeletingDebt(row.original); }}
              title="Xóa"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sổ công nợ (receivable / payable ledger)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý và giám sát công nợ phải thu của khách hàng và công nợ phải trả nhà cung cấp. Số dương: Khách hàng nợ doanh nghiệp. Số âm: Doanh nghiệp nợ đối tác.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                exportToCsv('so_cong_no', filtered, [
                  { header: 'Mã công nợ', accessor: r => r.debtCode },
                  { header: 'Tên đối tác', accessor: r => r.entityName },
                  { header: 'Loại đối tác', accessor: r => entityTypeMap[r.entityType] || r.entityType },
                  { header: 'Tổng công nợ (VND)', accessor: r => r.totalDebt },
                  { header: 'Đến hạn (VND)', accessor: r => r.dueAmount },
                  { header: 'Hạn thanh toán', accessor: r => r.dueDate },
                  { header: 'Trạng thái', accessor: r => statusMapFull[r.status] || r.status },
                  { header: 'Phụ trách', accessor: r => r.accountManager },
                ]);
                toast.success('Đã xuất sổ công nợ dạng CSV!');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất sổ công nợ
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Ghi nhận khoản nợ mới
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
              placeholder="Tìm kiếm theo mã số công nợ hoặc tên doanh nghiệp đối tác..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm">
            <Filter className="w-4 h-4" /> Bộ lọc
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedDebt(row)} />
      </div>

      <Modal
        isOpen={!!selectedDebt}
        onClose={() => setSelectedDebt(null)}
        title={selectedDebt ? `Hồ Sơ Công Nợ: ${selectedDebt.debtCode}` : 'Chi tiết công nợ'}
        width="max-w-lg"
      >
        {selectedDebt && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedDebt.totalDebt >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedDebt.totalDebt >= 0 ? 'bg-emerald-600' : 'bg-red-600'
                }`}>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${
                    selectedDebt.totalDebt >= 0 ? 'text-emerald-800 dark:text-emerald-400' : 'text-red-800 dark:text-red-400'
                  }`}>{selectedDebt.totalDebt >= 0 ? 'Khoản phải thu (receivable)' : 'Khoản phải trả (payable)'}</p>
                  <p className={`text-xl font-bold font-mono mt-0.5 ${
                    selectedDebt.totalDebt >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                  }`}>
                    {(() => {
                      const curr = selectedDebt.currency || 'VND';
                      const val = selectedDebt.totalDebt;
                      const prefix = curr === 'USD' ? '$' : '';
                      const suffix = curr === 'VND' ? ' ₫' : curr !== 'USD' ? ` ${curr}` : '';
                      return val >= 0
                        ? `+${prefix}${val.toLocaleString('vi-VN')}${suffix}`
                        : `-${prefix}${Math.abs(val).toLocaleString('vi-VN')}${suffix}`;
                    })()}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedDebt.status === 'SETTLED' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedDebt.status === 'NORMAL' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                selectedDebt.status === 'DUE_SOON' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {statusMapFull[selectedDebt.status] || selectedDebt.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <User className="w-4 h-4 text-blue-500" /> Tên đối tác
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedDebt.entityName}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-amber-500" /> Ngày đáo hạn
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedDebt.dueDate}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Phân loại đối tác:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{entityTypeMap[selectedDebt.entityType] || selectedDebt.entityType}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Đã thanh toán (lũy kế):</span>
                <span className="font-semibold font-mono text-emerald-600">
                  {selectedDebt.paidAmount !== undefined ? `${selectedDebt.paidAmount.toLocaleString('vi-VN')} ${selectedDebt.currency || 'VND'}` : '0'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Còn lại (Chưa thanh toán):</span>
                <span className={`font-semibold font-mono ${selectedDebt.dueAmount === 0 ? 'text-gray-500' : selectedDebt.dueAmount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {selectedDebt.dueAmount >= 0 ? `+${selectedDebt.dueAmount.toLocaleString('vi-VN')} ${selectedDebt.currency || 'VND'}` : `-${Math.abs(selectedDebt.dueAmount).toLocaleString('vi-VN')} ${selectedDebt.currency || 'VND'}`}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Giao dịch thanh toán gần nhất:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedDebt.lastPaymentDate || 'Chưa ghi nhận'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Nhân viên phụ trách đối tác:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedDebt.accountManager}</span>
              </div>

              {selectedDebt.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú tín dụng & Thỏa thuận</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedDebt.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                Thực hiện đối trừ quyết toán
              </button>
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <AlertCircle className="w-4 h-4 inline mr-1 text-amber-500" /> Gửi thông báo nhắc nợ
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Thêm / Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Ghi nhận công nợ mới' : 'Chỉnh sửa thông tin công nợ'}
        width="max-w-xl"
      >
        <form onSubmit={handleSaveDebt} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã số công nợ *</label>
              <input
                type="text"
                value={editingDebt.debtCode || ''}
                onChange={(e) => setEditingDebt({ ...editingDebt, debtCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại hình đối tác</label>
              <select
                value={editingDebt.entityType || 'CUSTOMER'}
                onChange={(e) => setEditingDebt({ ...editingDebt, entityType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="CUSTOMER">Khách hàng (Khoản phải thu)</option>
                <option value="SUPPLIER">Nhà cung cấp (Khoản phải trả)</option>
                <option value="PARTNER">Đối tác liên doanh / Dịch vụ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên đối tác / Doanh nghiệp *</label>
            <input
              type="text"
              value={editingDebt.entityName || ''}
              onChange={(e) => setEditingDebt({ ...editingDebt, entityName: e.target.value })}
              placeholder="Apex Hypermarkets, Global Tech Suppliers..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng dư nợ (Dương: Phải thu, Âm: Phải trả)</label>
              <input
                type="number"
                value={editingDebt.totalDebt ?? 0}
                onChange={(e) => setEditingDebt({ ...editingDebt, totalDebt: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền thanh toán đợt này</label>
              <input
                type="number"
                value={editingDebt.dueAmount ?? 0}
                onChange={(e) => setEditingDebt({ ...editingDebt, dueAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày đến hạn thanh toán</label>
              <input
                type="date"
                value={editingDebt.dueDate || ''}
                onChange={(e) => setEditingDebt({ ...editingDebt, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái công nợ</label>
              <select
                value={editingDebt.status || 'NORMAL'}
                onChange={(e) => setEditingDebt({ ...editingDebt, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="NORMAL">Bình thường (Normal)</option>
                <option value="DUE_SOON">Sắp đến hạn (Due soon)</option>
                <option value="OVERDUE">Quá hạn (Overdue)</option>
                <option value="SETTLED">Đã tất toán (Settled)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày giao dịch gần nhất</label>
              <input
                type="date"
                value={editingDebt.lastPaymentDate || ''}
                onChange={(e) => setEditingDebt({ ...editingDebt, lastPaymentDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhân viên phụ trách đối tác</label>
            <input
              type="text"
              value={editingDebt.accountManager || ''}
              onChange={(e) => setEditingDebt({ ...editingDebt, accountManager: e.target.value })}
              placeholder="Họ tên quản lý viên..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú & Thỏa thuận thanh toán</label>
            <textarea
              rows={2}
              value={editingDebt.notes || ''}
              onChange={(e) => setEditingDebt({ ...editingDebt, notes: e.target.value })}
              placeholder="Ghi chú về hạn mức, thỏa thuận gia hạn hoặc thông tin giao dịch cụ thể..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              {modalMode === 'create' ? 'Tạo Mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xác nhận xóa */}
      <Modal
        isOpen={!!deletingDebt}
        onClose={() => setDeletingDebt(null)}
        title="Xác nhận gỡ bỏ hồ sơ công nợ"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ công nợ <strong className="text-gray-900 dark:text-white">{deletingDebt?.debtCode}</strong> của đối tác <span className="font-semibold">{deletingDebt?.entityName}</span>?
          </p>
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-200 dark:border-red-800/40">
            Thao tác này sẽ xóa toàn bộ số dư đối chiếu sổ sách của đối tác này trong hệ thống. Hãy đảm bảo khoản nợ đã được tất toán hoặc có biên bản đồng ý xóa nợ hợp lệ.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setDeletingDebt(null)}
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
