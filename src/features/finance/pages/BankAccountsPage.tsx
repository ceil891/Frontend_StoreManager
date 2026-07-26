import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, Eye, Building2, CreditCard, Building, ShieldCheck, DollarSign, Lock, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import { CurrencyInput } from '@/shared/components/ui/CurrencyInput';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import type { ColumnDef } from '@tanstack/react-table';
import { useFinanceStore, type CorporateBankAccount } from '../store/financeStore';
import { toast } from 'sonner';
import { exportToCsv } from '@/shared/utils/exportCsv';

const formatBalance = (amount: number, currency: string) => {
  if (currency === 'VND') {
    return `${amount.toLocaleString('vi-VN')} ₫`;
  }
  if (currency === 'EUR') {
    return `${amount.toLocaleString('de-DE')} €`;
  }
  if (currency === 'GBP') {
    return `£${amount.toLocaleString('en-GB')}`;
  }
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

const typeBadgeStyles = {
  PRIMARY_OPERATING: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  PAYROLL_DISBURSEMENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  MERCHANT_SETTLEMENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
  ESCROW_RESERVE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
};

const accountTypeMap: Record<string, string> = {
  PRIMARY_OPERATING: 'Hoạt động chính',
  PAYROLL_DISBURSEMENT: 'Quỹ chi lương',
  MERCHANT_SETTLEMENT: 'Quyết toán thanh toán',
  ESCROW_RESERVE: 'Quỹ dự phòng Ký quỹ',
};

const statusMapFull: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  RESTRICTED: 'Bị hạn chế',
  CLOSING: 'Đang đóng',
  AUDIT_HOLD: 'Tạm khóa kiểm toán',
};

export function BankAccountsPage() {
  const data = useFinanceStore((s) => s.bankAccounts);
  const addBankAccount = useFinanceStore((s) => s.addBankAccount);
  const updateBankAccount = useFinanceStore((s) => s.updateBankAccount);
  const deleteBankAccount = useFinanceStore((s) => s.deleteBankAccount);
  const fetchBankAccounts = useFinanceStore((s) => s.fetchBankAccounts);

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<CorporateBankAccount | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingAccount, setEditingAccount] = useState<Partial<CorporateBankAccount>>({});
  const [deletingAccount, setDeletingAccount] = useState<CorporateBankAccount | null>(null);

  const filtered = data.filter((item) =>
    item.bankName.toLowerCase().includes(search.toLowerCase()) ||
    item.accountNumberMasked.includes(search) ||
    item.swiftBic.toLowerCase().includes(search.toLowerCase()) ||
    item.accountType.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingAccount({
      accountNumberMasked: '•••• •••• ' + Math.floor(1000 + Math.random() * 9000),
      bankName: '',
      branchName: '',
      swiftBic: 'BANKVN' + Math.floor(100 + Math.random() * 900) + 'XXX',
      currency: 'VND',
      currentBalance: 0,
      availableWorkingCapital: 0,
      accountType: 'PRIMARY_OPERATING',
      status: 'ACTIVE',
      openedDate: new Date().toISOString().substring(0, 10),
      authorizedSignatories: ['CFO Sarah Jenkins'],
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: CorporateBankAccount) => {
    setModalMode('edit');
    setEditingAccount(acc);
    setIsModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount.bankName || !editingAccount.accountNumberMasked) return;

    if (modalMode === 'create') {
      addBankAccount({
        accountNumberMasked: editingAccount.accountNumberMasked || '•••• •••• 9999',
        bankName: editingAccount.bankName || 'Ngân hàng',
        branchName: editingAccount.branchName || 'Chi nhánh Hội sở chính',
        swiftBic: editingAccount.swiftBic || 'SWIFTVNXXX',
        currency: editingAccount.currency || 'VND',
        currentBalance: Number(editingAccount.currentBalance) || 0,
        availableWorkingCapital: Number(editingAccount.availableWorkingCapital) || 0,
        accountType: editingAccount.accountType || 'PRIMARY_OPERATING',
        status: editingAccount.status || 'ACTIVE',
        openedDate: editingAccount.openedDate || new Date().toISOString().substring(0, 10),
        authorizedSignatories:
          editingAccount.authorizedSignatories && editingAccount.authorizedSignatories.length > 0
            ? editingAccount.authorizedSignatories
            : ['CFO Sarah Jenkins'],
        notes: editingAccount.notes,
      });
    } else if (editingAccount.id) {
      updateBankAccount(editingAccount.id, editingAccount);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingAccount) return;
    deleteBankAccount(deletingAccount.id);
    setDeletingAccount(null);
  };

  const columns = useMemo<ColumnDef<CorporateBankAccount>[]>(
    () => [
      {
        accessorKey: 'accountNumberMasked',
        header: 'Số tài khoản (Đã ẩn)',
        cell: (info) => <span className="font-mono font-bold text-primary px-2.5 py-1 bg-primary/10 rounded border border-primary/20 shadow-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'bankName',
        header: 'Ngân hàng & Chi nhánh',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.bankName}</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">SWIFT/BIC: {row.original.swiftBic} ({row.original.branchName})</p>
          </div>
        ),
      },
      {
        accessorKey: 'accountType',
        header: 'Mục đích sử dụng',
        cell: (info) => {
          const t = info.getValue() as keyof typeof typeBadgeStyles;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeBadgeStyles[t]}`}>
              {accountTypeMap[t] || t.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'currency',
        header: 'Tiền tệ',
        cell: (info) => <span className="font-mono font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'currentBalance',
        header: 'Tổng số dư sổ sách',
        cell: ({ row }) => <span className="font-mono font-bold text-gray-900 dark:text-white">{formatBalance(row.original.currentBalance, row.original.currency)}</span>,
      },
      {
        accessorKey: 'availableWorkingCapital',
        header: 'Vốn lưu động khả dụng',
        cell: ({ row }) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatBalance(row.original.availableWorkingCapital, row.original.currency)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'RESTRICTED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
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
              onClick={(e) => { e.stopPropagation(); setSelectedAccount(row.original); }}
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
              onClick={(e) => { e.stopPropagation(); setDeletingAccount(row.original); }}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tài khoản ngân hàng & kho bạc (treasury accounts)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý các tài khoản liên kết với các định chế tài chính, giám sát số dư vốn lưu động khả dụng, lịch trình giải ngân và người được ủy quyền ký quỹ. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                exportToCsv('tai_khoan_ngan_hang', filtered, [
                  { header: 'Tên tài khoản', accessor: r => r.accountName || '' },
                  { header: 'Số tài khoản', accessor: r => r.accountNumber || r.accountNumberMasked },
                  { header: 'Ngân hàng', accessor: r => `${r.bankName} - ${r.branchName}` },
                  { header: 'Loại tài khoản', accessor: r => accountTypeMap[r.accountType] || r.accountType },
                  { header: 'Số dư hiện tại', accessor: r => r.currentBalance },
                  { header: 'Loại tiền', accessor: r => r.currency },
                  { header: 'Trạng thái', accessor: r => statusMapFull[r.status] || r.status },
                ]);
                toast.success('Đã xuất danh sách tài khoản ngân hàng dạng CSV!');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất dữ liệu số dư
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Liên kết tài khoản mới
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
              placeholder="Tìm kiếm tài khoản theo tên ngân hàng, số tài khoản hoặc mã SWIFT/BIC..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm">
            <Filter className="w-4 h-4" /> Lọc tài khoản
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedAccount(row)} />
      </div>

      <Drawer
        isOpen={!!selectedAccount}
        onClose={() => setSelectedAccount(null)}
        title={selectedAccount ? `Chi Tiết Tài Khoản: ${selectedAccount.bankName}` : 'Chi tiết thông tin'}
        width="max-w-lg"
      >
        {selectedAccount && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedAccount.status === 'ACTIVE'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : selectedAccount.status === 'RESTRICTED'
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedAccount.status === 'ACTIVE' ? 'bg-emerald-600' : selectedAccount.status === 'RESTRICTED' ? 'bg-amber-600' : 'bg-red-600'
                }`}>
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Thanh khoản vốn lưu động</p>
                  <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatBalance(selectedAccount.availableWorkingCapital, selectedAccount.currency)}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedAccount.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedAccount.status === 'RESTRICTED' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {statusMapFull[selectedAccount.status] || selectedAccount.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <CreditCard className="w-4 h-4 text-primary" /> Tổng số dư sổ sách
                </div>
                <p className="text-lg font-mono font-bold text-gray-900 dark:text-white truncate">
                  {formatBalance(selectedAccount.currentBalance, selectedAccount.currency)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-blue-500" /> Mục đích tài khoản
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate uppercase">{accountTypeMap[selectedAccount.accountType] || selectedAccount.accountType}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Thông tin số tài khoản</span>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-base font-bold text-primary" title={selectedAccount.accountNumber || selectedAccount.accountNumberMasked}>
                    {selectedAccount.accountNumber || selectedAccount.accountNumberMasked}
                  </span>
                  <span className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-2 py-0.5 rounded text-xs">SWIFT: {selectedAccount.swiftBic}</span>
                </div>
                {selectedAccount.accountName && (
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-2 uppercase">{selectedAccount.accountName}</p>
                )}
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <p>Chi nhánh: {selectedAccount.branchName}</p>
                  {selectedAccount.bankCountry && <p>Quốc gia: {selectedAccount.bankCountry}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Hạn mức thấu chi</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedAccount.overdraftLimit !== undefined ? formatBalance(selectedAccount.overdraftLimit, selectedAccount.currency) : 'Không cấp'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ngày đối soát cuối</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedAccount.lastReconciledDate || 'Chưa đối soát'}
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Chữ ký ủy quyền hợp lệ</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedAccount.authorizedSignatories.map((sig, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-xs px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> {sig}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700 text-xs font-mono">
                <span className="text-gray-500 dark:text-gray-400 font-sans">Ngày mở tài khoản:</span>
                <span className="text-gray-800 dark:text-gray-200">{selectedAccount.openedDate}</span>
              </div>
              
              {selectedAccount.updatedBy && (
                <div className="flex justify-between items-center pt-1 text-xs font-mono">
                  <span className="text-gray-500 dark:text-gray-400 font-sans">Cập nhật lần cuối bởi:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">{selectedAccount.updatedBy}</span>
                </div>
              )}

              {selectedAccount.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú quản trị kho bạc</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedAccount.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedAccount.status === 'ACTIVE' && (
                <button
                  onClick={() => toast.success('Đã gửi yêu cầu chuyển khoản thanh khoản nội bộ!')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow transition-colors text-sm"
                >
                  <DollarSign className="w-4 h-4" /> Chuyển khoản thanh khoản nội bộ
                </button>
              )}
              <button
                onClick={() => toast.info('Chức năng đang được phát triển!')}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm"
              >
                <Lock className="w-4 h-4 inline mr-1" /> Kiểm tra nhật ký ký quỹ
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal: Thêm / Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Liên kết tài khoản ngân hàng mới' : 'Chỉnh sửa thông tin tài khoản'}
        size="erp"
      >
        <form onSubmit={handleSaveAccount}>
          <div className="erp-form-body">
            {/* Section 1: Định danh ngân hàng */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Định danh ngân hàng</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên ngân hàng *</label>
                <input
                  type="text"
                  value={editingAccount.bankName || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, bankName: e.target.value })}
                  placeholder="Vietcombank, BIDV, Techcombank..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên chi nhánh *</label>
                <input
                  type="text"
                  value={editingAccount.branchName || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, branchName: e.target.value })}
                  placeholder="Chi nhánh TP.HCM, Hội sở chính..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số tài khoản *</label>
                <input
                  type="text"
                  value={editingAccount.accountNumberMasked || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, accountNumberMasked: e.target.value })}
                  placeholder="•••• •••• 8810 2450"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã SWIFT / BIC *</label>
                <input
                  type="text"
                  value={editingAccount.swiftBic || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, swiftBic: e.target.value })}
                  placeholder="BFTVVNVX..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Section 2: Hạch toán & Tiền tệ */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Hạch toán & Tiền tệ</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn vị tiền tệ</label>
                <select
                  value={editingAccount.currency || 'VND'}
                  onChange={(e) => setEditingAccount({ ...editingAccount, currency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="VND">VND - Đồng Việt Nam</option>
                  <option value="USD">USD - Đô la Mỹ</option>
                  <option value="EUR">EUR - Đồng Euro</option>
                  <option value="GBP">GBP - Bảng Anh</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng số dư sổ sách</label>
                <CurrencyInput
                  value={editingAccount.currentBalance ?? 0}
                  onChange={(val) => setEditingAccount(prev => ({ ...prev, currentBalance: val }))}
                  currencySymbol={editingAccount.currency === 'USD' ? '$' : editingAccount.currency === 'EUR' ? '€' : '₫'}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Vốn lưu động khả dụng</label>
                <CurrencyInput
                  value={editingAccount.availableWorkingCapital ?? 0}
                  onChange={(val) => setEditingAccount(prev => ({ ...prev, availableWorkingCapital: val }))}
                  currencySymbol={editingAccount.currency === 'USD' ? '$' : editingAccount.currency === 'EUR' ? '€' : '₫'}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mục đích sử dụng</label>
                <select
                  value={editingAccount.accountType || 'PRIMARY_OPERATING'}
                  onChange={(e) => setEditingAccount({ ...editingAccount, accountType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="PRIMARY_OPERATING">Hoạt động chính (Primary Operating)</option>
                  <option value="PAYROLL_DISBURSEMENT">Quỹ chi lương (Payroll)</option>
                  <option value="MERCHANT_SETTLEMENT">Quyết toán thanh toán (Merchant)</option>
                  <option value="ESCROW_RESERVE">Quỹ ký quỹ (Escrow Reserve)</option>
                </select>
              </div>
              <div>
                <FileDropzone
                  label="Giấy ủy quyền tài khoản & Đăng ký chủ tài khoản (PDF/Image)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái tài khoản</label>
                <select
                  value={editingAccount.status || 'ACTIVE'}
                  onChange={(e) => setEditingAccount({ ...editingAccount, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="ACTIVE">Đang hoạt động (Active)</option>
                  <option value="RESTRICTED">Bị hạn chế (Restricted)</option>
                  <option value="CLOSING">Đang đóng (Closing)</option>
                  <option value="AUDIT_HOLD">Tạm khóa kiểm toán (Audit Hold)</option>
                </select>
              </div>
            </div>

            {/* Section 3: Ủy quyền & Quản trị */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Ủy quyền & Ghi chú</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày mở tài khoản</label>
                <input
                  type="date"
                  value={editingAccount.openedDate || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, openedDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người ký ủy quyền (Phẩy để phân cách)</label>
                <input
                  type="text"
                  value={editingAccount.authorizedSignatories?.join(', ') || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, authorizedSignatories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="CEO Johnathan Vance, CFO Sarah Jenkins..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú quản trị</label>
                <textarea
                  rows={3}
                  value={editingAccount.notes || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, notes: e.target.value })}
                  placeholder="Ghi chú quy tắc sweep tự động, hạn mức giải ngân..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </div>

          <div className="erp-form-footer border-t border-gray-200 dark:border-gray-700 pt-4">
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
              {modalMode === 'create' ? 'Liên kết mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xác nhận xóa */}
      <Modal
        isOpen={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        title="Xác nhận hủy liên kết tài khoản"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Bạn có chắc chắn muốn gỡ bỏ liên kết tài khoản <strong className="text-gray-900 dark:text-white">{deletingAccount?.accountNumberMasked}</strong> của ngân hàng <span className="font-semibold">{deletingAccount?.bankName}</span> khỏi kho bạc hệ thống?
          </p>
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-200 dark:border-red-800/40">
            Thao tác này sẽ ngắt kết nối đồng bộ sao kê tự động với hệ thống kế toán doanh nghiệp. Bạn vẫn có thể liên kết lại bất kỳ lúc nào nếu cần.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingAccount(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Đồng ý gỡ
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
