import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, Eye, Calendar, Building, FileText, ArrowUpRight, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useFinanceStore, type PaymentVoucher } from '../store/financeStore';
import { toast } from 'sonner';
import { exportToCsv } from '@/shared/utils/exportCsv';

const formatNumberString = (val: string | number | undefined | null) => {
  if (val === undefined || val === null || val === '') return '';
  const num = String(val).replace(/[^0-9]/g, '');
  return num ? Number(num).toLocaleString('vi-VN') : '';
};
const parseNumberString = (val: string) => {
  return Number(val.replace(/[^0-9]/g, '')) || 0;
};

const categoryMap: Record<string, string> = {
  SUPPLIER_PAYMENT: 'Thanh toán nhà cung cấp',
  UTILITIES: 'Điện nước & Tiện ích',
  PAYROLL: 'Chi trả lương nhân viên',
  TAXES: 'Thuế & Lệ phí nhà nước',
  LOGISTICS: 'Vận chuyển & Kho bãi',
};

const statusMapFull: Record<string, string> = {
  COMPLETED: 'Đã hoàn thành chi',
  PENDING_APPROVAL: 'Chờ kiểm duyệt',
  REJECTED: 'Đã từ chối',
};

export function PaymentVouchersPage() {
  const data = useFinanceStore((s) => s.payments);
  const addPayment = useFinanceStore((s) => s.addPayment);
  const updatePayment = useFinanceStore((s) => s.updatePayment);
  const deletePayment = useFinanceStore((s) => s.deletePayment);
  const fetchPayments = useFinanceStore((s) => s.fetchPayments);

  const [unpaidInvoices, setUnpaidInvoices] = useState<{ code: string; supplierName: string; remainingDebt: number }[]>([]);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; name: string }[]>([]);
  const [cashFunds, setCashFunds] = useState<{ id: string; name: string }[]>([]);
  const [isPayeeLocked, setIsPayeeLocked] = useState(false);

  useEffect(() => {
    fetchPayments();

    import('@/shared/lib/axiosClient').then(({ axiosClient }) => {
      // 1. Fetch unpaid purchase orders
      axiosClient.get('/purchase/orders').then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.content || res?.data || []);
        const filteredUnpaid = list.map((p: any) => {
          const total = Number(p.totalAmount || p.totalCost || 0);
          const paid = Number(p.advanceAmount || p.paidAmount || 0);
          const isPaid = p.paymentStatus === 'PAID' || (total > 0 && paid >= total);
          const remaining = isPaid ? 0 : Math.max(0, total - paid);
          return {
            code: p.poCode || p.poNumber || `INV-PUR-${p.id}`,
            supplierName: p.supplierName || p.supplier?.name || 'Nhà cung cấp',
            totalAmount: total,
            remainingDebt: remaining,
            isPaid,
            status: p.status,
          };
        });
        setUnpaidInvoices(filteredUnpaid);
      }).catch(() => setUnpaidInvoices([]));

      // 2. Fetch real bank accounts from API
      axiosClient.get('/finance/bank-accounts').then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.content || res?.data || []);
        const mapped = list.map((f: any) => ({
          id: String(f.id),
          name: `[${f.bankName || 'NGÂN HÀNG'}] ${f.accountHolder || f.accountName || 'Doanh nghiệp'} - ${f.accountNumber || ''}`,
        }));
        if (mapped.length > 0) {
          setBankAccounts(mapped);
        } else {
          setBankAccounts([
            { id: 'bank-001', name: '[Techcombank] Công ty RetailHub - 1902838392 (Kho chính)' },
            { id: 'bank-002', name: '[Vietcombank] Công ty RetailHub - 0918273645 (TK Thanh toán NCC)' },
            { id: 'bank-003', name: '[MB Bank] Quỹ chi tiêu doanh nghiệp - 8888999922' },
          ]);
        }
      }).catch(() => {
        setBankAccounts([
          { id: 'bank-001', name: '[Techcombank] Công ty RetailHub - 1902838392 (Kho chính)' },
          { id: 'bank-002', name: '[Vietcombank] Công ty RetailHub - 0918273645 (TK Thanh toán NCC)' },
          { id: 'bank-003', name: '[MB Bank] Quỹ chi tiêu doanh nghiệp - 8888999922' },
        ]);
      });

      // 3. Fetch real cash funds from API
      axiosClient.get('/finance/fund-cash').then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.content || res?.data || []);
        const mapped = list.map((f: any) => ({
          id: String(f.id),
          name: f.fundName || f.name || `Quỹ tiền mặt ${f.branchName || ''}`,
        }));
        if (mapped.length > 0) {
          setCashFunds(mapped);
        } else {
          setCashFunds([
            { id: 'cash-001', name: 'Quỹ tiền mặt Trung Tâm (HQ)' },
            { id: 'cash-002', name: 'Quỹ tiền mặt Chi nhánh chính' },
          ]);
        }
      }).catch(() => {
        setCashFunds([
          { id: 'cash-001', name: 'Quỹ tiền mặt Trung Tâm (HQ)' },
          { id: 'cash-002', name: 'Quỹ tiền mặt Chi nhánh chính' },
        ]);
      });
    });
  }, [fetchPayments]);

  const [search, setSearch] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<PaymentVoucher | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoCode, setIsAutoCode] = useState(true);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingVoucher, setEditingVoucher] = useState<Partial<PaymentVoucher>>({});
  const [deletingVoucher, setDeletingVoucher] = useState<PaymentVoucher | null>(null);
  const [cancelVoucher, setCancelVoucher] = useState<PaymentVoucher | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const allowedFunds = useMemo(() => {
    if (editingVoucher.paymentMethod === 'CASH') {
      return cashFunds.length > 0 ? cashFunds : [
        { id: 'cash-001', name: 'Quỹ tiền mặt Trung Tâm (HQ)' },
        { id: 'cash-002', name: 'Quỹ tiền mặt Chi nhánh 1' },
      ];
    } else {
      return bankAccounts.length > 0 ? bankAccounts : [
        { id: 'bank-001', name: '[Techcombank] Công ty RetailHub - 1902838392 (Kho chính)' },
        { id: 'bank-002', name: '[Vietcombank] Công ty RetailHub - 0918273645 (TK Thanh toán NCC)' },
      ];
    }
  }, [editingVoucher.paymentMethod, bankAccounts, cashFunds]);

  const filtered = data.filter((item) =>
    (item.payeeName || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.voucherNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.bankAccountRef || '').toLowerCase().includes(search.toLowerCase())
  );

  const generateAutoCode = () => {
    const todayStr = new Date().toISOString().substring(0, 10).replace(/-/g, '');
    return `PAY-PUR-${todayStr}-${Math.floor(100 + Math.random() * 900)}`;
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setIsAutoCode(true);
    setIsPayeeLocked(false);
    const defaultBank = bankAccounts[0]?.name || '';
    setEditingVoucher({
      voucherNumber: generateAutoCode(),
      payeeName: '',
      category: 'SUPPLIER_PAYMENT',
      amount: 0,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date().toISOString().substring(0, 10),
      bankAccountRef: defaultBank,
      approver: 'Super Admin',
      status: 'PENDING_APPROVAL',
      branchId: 'BR-001',
      referenceDoc: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (voucher: PaymentVoucher) => {
    setModalMode('edit');
    setIsAutoCode(false);
    setIsPayeeLocked(!!voucher.referenceDoc);
    setEditingVoucher(voucher);
    setIsModalOpen(true);
  };

  const handleSelectInvoice = (invCode: string) => {
    const matched = unpaidInvoices.find(i => i.code === invCode);
    if (matched) {
      setEditingVoucher(prev => ({
        ...prev,
        referenceDoc: matched.code,
        payeeName: matched.supplierName,
        amount: matched.remainingDebt > 0 ? matched.remainingDebt : (prev.amount && prev.amount > 0 ? prev.amount : (matched as any).totalAmount || 0),
      }));
      setIsPayeeLocked(true);
    } else {
      setEditingVoucher(prev => ({
        ...prev,
        referenceDoc: invCode,
      }));
      setIsPayeeLocked(false);
    }
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoucher.voucherNumber || !editingVoucher.payeeName) return;

    if (!editingVoucher.attachments || editingVoucher.attachments.length === 0 || !editingVoucher.attachments[0]) {
      toast.error('Bắt buộc đính kèm ảnh chụp biên lai giao dịch!');
      return;
    }

    try {
      if (modalMode === 'create') {
        await addPayment({
          voucherNumber: editingVoucher.voucherNumber || generateAutoCode(),
          payeeName: editingVoucher.payeeName || 'Đơn vị thụ hưởng',
          category: editingVoucher.category || 'SUPPLIER_PAYMENT',
          amount: Number(editingVoucher.amount) || 0,
          paymentMethod: editingVoucher.paymentMethod || 'BANK_TRANSFER',
          paymentDate: editingVoucher.paymentDate || new Date().toISOString().substring(0, 10),
          bankAccountRef: editingVoucher.bankAccountRef || (allowedFunds[0]?.name || ''),
          approver: editingVoucher.approver || 'Super Admin',
          status: editingVoucher.status || 'PENDING_APPROVAL',
          branchId: editingVoucher.branchId || 'BR-001',
          referenceDoc: editingVoucher.referenceDoc,
          notes: editingVoucher.notes,
          attachments: editingVoucher.attachments,
        });
        toast.success(`Đã lập phiếu chi ${editingVoucher.voucherNumber} thành công!`);
      } else if (editingVoucher.id) {
        await updatePayment(editingVoucher.id, editingVoucher);
        toast.success(`Đã cập nhật phiếu chi ${editingVoucher.voucherNumber}`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu phiếu chi';
      toast.error(msg);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingVoucher) return;
    deletePayment(deletingVoucher.id);
    setDeletingVoucher(null);
  };

  const columns = useMemo<ColumnDef<PaymentVoucher>[]>(
    () => [
      {
        accessorKey: 'voucherNumber',
        header: 'Số phiếu chi',
        cell: (info) => <span className="font-mono font-bold text-red-600 dark:text-red-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'payeeName',
        header: 'Đơn vị thụ hưởng',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{(info.getValue() as string) || 'Đơn vị thụ hưởng'}</span>,
      },
      {
        accessorKey: 'category',
        header: 'Nhóm chi phí',
        cell: (info) => {
          const cat = info.getValue() as string;
          return <span className="text-gray-700 dark:text-gray-300 font-medium text-xs bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded">{categoryMap[cat] || cat}</span>;
        },
      },
      {
        accessorKey: 'amount',
        header: 'Số tiền giải ngân',
        cell: (info) => {
          const val = Number(info.getValue() || 0);
          return <span className="font-bold font-mono text-red-600 dark:text-red-400">-{ val.toLocaleString('vi-VN') } ₫</span>;
        },
      },
      {
        accessorKey: 'referenceDoc',
        header: 'Chứng từ liên quan',
        cell: (info) => {
          const doc = (info.getValue() as string)?.trim();
          if (!doc) {
            return <span className="text-gray-400 font-mono text-xs">—</span>;
          }
          return (
            <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {doc}
            </span>
          );
        },
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Kênh / Nguồn chi',
        cell: ({ row }) => (
          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">
            {row.original.bankAccountRef || (row.original.paymentMethod === 'CASH' ? 'Quỹ tiền mặt' : 'Tài khoản ngân hàng')}
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
              status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
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
              onClick={(e) => { e.stopPropagation(); setSelectedVoucher(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
              onClick={(e) => { e.stopPropagation(); setDeletingVoucher(row.original); }}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phiếu chi</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lập và quản lý các phiếu giải ngân thanh toán cho nhà cung cấp, chi phí điện nước và các khoản thanh toán qua hệ thống ngân hàng.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                exportToCsv('danh_sach_phieu_chi', filtered, [
                  { header: 'Số phiếu chi', accessor: r => r.voucherNumber },
                  { header: 'Đơn vị nhận', accessor: r => r.payeeName },
                  { header: 'Hạng mục chi', accessor: r => categoryMap[r.category] || r.category },
                  { header: 'Số tiền (VND)', accessor: r => r.amount },
                  { header: 'Ngày chi', accessor: r => r.paymentDate },
                  { header: 'Người duyệt', accessor: r => r.approver || '' },
                  { header: 'Trạng thái', accessor: r => statusMapFull[r.status] || r.status },
                ]);
                toast.success('Đã xuất sổ nhật ký chi dạng CSV!');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất sổ nhật ký chi
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Lập phiếu chi mới
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
              placeholder="Tìm kiếm theo mã phiếu chi, đơn vị thụ hưởng hoặc tài khoản..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm font-medium shrink-0">
            <Filter className="w-4 h-4" /> Lọc dữ liệu
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedVoucher(row)} />
      </div>

      <Modal
        isOpen={!!selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        title={selectedVoucher ? `Hồ Sơ Phiếu Chi: ${selectedVoucher.voucherNumber}` : 'Chi tiết phiếu chi'}
        width="max-w-lg"
      >
        {selectedVoucher && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-red-800 dark:text-red-400 font-semibold uppercase tracking-wider">Tổng tiền giải ngân</p>
                  <p className="text-xl font-bold font-mono text-red-700 dark:text-red-400">-{selectedVoucher.amount.toLocaleString('vi-VN')} ₫</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedVoucher.status === 'COMPLETED' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedVoucher.status === 'PENDING_APPROVAL' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {statusMapFull[selectedVoucher.status] || selectedVoucher.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building className="w-4 h-4 text-red-600 dark:text-red-400" /> Đối tác thụ hưởng
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedVoucher.payeeName}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Ngày thanh toán
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedVoucher.paymentDate}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Nhóm phân loại:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{categoryMap[selectedVoucher.category] || selectedVoucher.category}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tài khoản người nhận (Payee):</span>
                <span className="font-semibold font-mono text-gray-900 dark:text-white">{selectedVoucher.payeeBankAccount || 'Không xác định'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Kênh giải ngân / Ngân hàng (Payer):</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedVoucher.bankAccountRef}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Người lập phiếu:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedVoucher.creator || 'Chưa rõ'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Người phê duyệt / Thẩm định:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedVoucher.approver}</span>
              </div>

              {selectedVoucher.attachments && selectedVoucher.attachments.length > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Tệp chứng từ đính kèm</span>
                  <div className="flex flex-col gap-2">
                    {selectedVoucher.attachments.map((att, i) => (
                      <a key={i} href="#" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        <FileText className="w-4 h-4" /> {att.split('/').pop()}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedVoucher.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Lý do & Thuyết minh chi tiết</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedVoucher.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedVoucher.status === 'PENDING_APPROVAL' && (
                <button
                  onClick={async () => {
                    await updatePayment(selectedVoucher.id, { ...selectedVoucher, status: 'COMPLETED' });
                    setSelectedVoucher({ ...selectedVoucher, status: 'COMPLETED' });
                    toast.success('Đã phê duyệt & thực hiện lệnh chuyển thành công!');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
                >
                  Phê duyệt & Thực hiện lệnh chuyển
                </button>
              )}
              <button
                onClick={() => toast.success('Đã gửi yêu cầu in ủy nhiệm chi!')}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm"
              >
                <FileText className="w-4 h-4 inline mr-1" /> In ủy nhiệm chi
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Thêm / Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Lập Phiếu Chi Mới (Gửi Chờ Duyệt)' : (editingVoucher.status === 'COMPLETED' || editingVoucher.status === 'APPROVED' ? 'Chi tiết Phiếu Chi (Đã duyệt)' : 'Xét duyệt & Chỉnh sửa Phiếu Chi')}
        size="erp"
      >
        {(() => {
          const isVoucherLocked = editingVoucher.status === 'COMPLETED' || editingVoucher.status === 'APPROVED';
          return (
            <form onSubmit={handleSaveVoucher} className="space-y-4">
              {isVoucherLocked && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs font-semibold">
                  Chứng từ này đã được duyệt và ở trạng thái chỉ đọc . Không thể chỉnh sửa các thông tin tài chính/đối tác.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Số phiếu chi *</label>
                    {modalMode === 'create' && (
                      <label className="flex items-center gap-1 text-[10px] text-red-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isAutoCode}
                          onChange={(e) => {
                            setIsAutoCode(e.target.checked);
                            if (e.target.checked) {
                              setEditingVoucher(prev => ({
                                ...prev,
                                voucherNumber: `PAY-2024-${Math.floor(100 + Math.random() * 900)}`
                              }));
                            }
                          }}
                          className="rounded text-red-600 focus:ring-red-550 w-3 h-3"
                          disabled={isVoucherLocked}
                        />
                        <span>Tự động sinh</span>
                      </label>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editingVoucher.voucherNumber || ''}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, voucherNumber: e.target.value })}
                    disabled={(modalMode === 'create' && isAutoCode) || isVoucherLocked}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhóm chi phí</label>
                  <select
                    value={editingVoucher.category || 'SUPPLIER_PAYMENT'}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={isVoucherLocked}
                  >
                    <option value="SUPPLIER_PAYMENT">Thanh toán nhà cung cấp </option>
                    <option value="UTILITIES">Điện nước & Tiện ích </option>
                    <option value="PAYROLL">Chi trả lương nhân viên </option>
                    <option value="TAXES">Thuế & Lệ phí nhà nước </option>
                    <option value="LOGISTICS">Vận chuyển & Kho bãi </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mã Hóa đơn mua hàng / Chứng từ liên quan 
                </label>
                <select
                  value={editingVoucher.referenceDoc || ''}
                  onChange={(e) => handleSelectInvoice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 font-mono font-medium"
                  disabled={isVoucherLocked}
                >
                  <option value="">-- Chọn Hóa đơn mua hàng cần thanh toán --</option>
                  {editingVoucher.referenceDoc && (
                    <option value={editingVoucher.referenceDoc}>
                      {editingVoucher.referenceDoc} — {editingVoucher.payeeName} {isVoucherLocked ? `(Đã chi: ${new Intl.NumberFormat('vi-VN').format(editingVoucher.amount || 0)}đ)` : `(Đang liên kết)`}
                    </option>
                  )}
                  {unpaidInvoices
                    .filter((inv) => inv.code !== editingVoucher.referenceDoc && (modalMode === 'edit' || (inv.remainingDebt > 0 && !inv.isPaid)))
                    .map((inv) => (
                      <option key={inv.code} value={inv.code}>
                        {inv.code} — {inv.supplierName} {inv.remainingDebt === 0 || inv.isPaid ? '(Đã thanh toán)' : `(Còn nợ: ${new Intl.NumberFormat('vi-VN').format(inv.remainingDebt)}đ)`}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Đơn vị thụ hưởng (Payee) *</label>
                  {isPayeeLocked && <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">🔒 Đã khóa (Theo Hóa đơn)</span>}
                </div>
                <input
                  type="text"
                  value={editingVoucher.payeeName || ''}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, payeeName: e.target.value })}
                  readOnly={isPayeeLocked || isVoucherLocked}
                  placeholder="Tên công ty / nhà cung cấp..."
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 ${
                    (isPayeeLocked || isVoucherLocked) ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold cursor-not-allowed' : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền chi (₫) *</label>
                  <input
                    type="text"
                    value={formatNumberString(editingVoucher.amount ?? 0)}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, amount: parseNumberString(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-bold"
                    disabled={isVoucherLocked}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phương thức thanh toán</label>
                  <select
                    value={editingVoucher.paymentMethod || 'BANK_TRANSFER'}
                    onChange={(e) => {
                      const method = e.target.value as any;
                      const defaultRef = method === 'CASH' 
                        ? 'Quỹ tiền mặt Trung Tâm (HQ)' 
                        : (bankAccounts[0]?.name || '');
                      setEditingVoucher({ ...editingVoucher, paymentMethod: method, bankAccountRef: defaultRef });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={isVoucherLocked}
                  >
                    <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                    <option value="CREDIT_CARD">Thẻ tín dụng doanh nghiệp</option>
                    <option value="CASH">Tiền mặt quỹ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày lập phiếu</label>
                  <input
                    type="date"
                    value={editingVoucher.paymentDate || ''}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                    disabled={isVoucherLocked}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái phê duyệt</label>
                  {modalMode === 'create' ? (
                    <div className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-sm font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Chờ duyệt (Mặc định)
                    </div>
                  ) : (
                    <select
                      value={editingVoucher.status || 'PENDING_APPROVAL'}
                      onChange={(e) => setEditingVoucher({ ...editingVoucher, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-semibold"
                      disabled={isVoucherLocked}
                    >
                      <option value="PENDING_APPROVAL">Chờ duyệt (Pending)</option>
                      <option value="COMPLETED"> Duyệt & Đã chi (Completed)</option>
                      <option value="REJECTED"> Từ chối chi (Rejected)</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tài khoản / Quỹ xuất tiền *</label>
                  <select
                    value={editingVoucher.bankAccountRef || (allowedFunds[0]?.name || '')}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, bankAccountRef: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-semibold"
                    disabled={isVoucherLocked}
                    required
                  >
                    {allowedFunds.length > 0 ? (
                      allowedFunds.map((f) => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))
                    ) : (
                      <option value="">-- Chưa có tài khoản/quỹ nào --</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ảnh biên lai / Tệp minh chứng giao dịch *</label>
                <input
                  type="text"
                  value={editingVoucher.attachments?.[0] || ''}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, attachments: [e.target.value] })}
                  placeholder="Nhập link ảnh biên lai (ví dụ: https://retailhub.vn/receipts/PAY123.jpg)..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={isVoucherLocked}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người phê duyệt / Thẩm định</label>
                <input
                  type="text"
                  value={editingVoucher.approver || ''}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, approver: e.target.value })}
                  placeholder="Họ tên người duyệt..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={isVoucherLocked}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lý do giải ngân & Ghi chú</label>
                <textarea
                  rows={2}
                  value={editingVoucher.notes || ''}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, notes: e.target.value })}
                  placeholder="Ghi chú chi tiết về mục đích thanh toán, số hợp đồng liên đới..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  disabled={isVoucherLocked}
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <div>
                  {isVoucherLocked && modalMode === 'edit' && editingVoucher.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      onClick={() => {
                        setCancelVoucher(editingVoucher as PaymentVoucher);
                        setCancelReason('');
                      }}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-semibold rounded-lg text-xs transition-colors border border-red-200 dark:border-red-800"
                    >
                      🚫 Hủy phiếu chi
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
                  >
                    {isVoucherLocked ? 'Đóng' : 'Hủy bỏ'}
                  </button>
                  {!isVoucherLocked && (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm font-semibold"
                    >
                      {modalMode === 'create' ? 'Lập phiếu chi' : 'Lưu thay đổi'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* Modal: Xác nhận Hủy phiếu chi và nhập lý do */}
      <Modal
        isOpen={!!cancelVoucher}
        onClose={() => setCancelVoucher(null)}
        title="Xác nhận hủy phiếu chi đã duyệt"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Bạn đang yêu cầu hủy phiếu chi <strong className="text-gray-900 dark:text-white">{cancelVoucher?.voucherNumber}</strong> (Số tiền: <span className="font-bold text-red-600 font-mono">{formatNumberString(cancelVoucher?.amount || 0)} ₫</span>).
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-bold">⚠️ Hệ quả nghiệp vụ khi hủy phiếu:</p>
            <p>1. Phiếu chi sẽ chuyển trạng thái sang <strong>ĐÃ HỦY (CANCELLED)</strong>.</p>
            <p>2. Tự động hoàn trả công nợ cho Đơn mua hàng / Hóa đơn liên kết.</p>
            <p>3. Ghi nhận bút toán hoàn nhập (Storno) trên sổ cái kế toán.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Lý do hủy phiếu chi *</label>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy bỏ phiếu chi (giao dịch lỗi, sai thông tin ngân hàng...)..."
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setCancelVoucher(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-xs"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={!cancelReason.trim()}
              onClick={async () => {
                if (!cancelVoucher) return;
                try {
                  await updatePayment(cancelVoucher.id, {
                    ...cancelVoucher,
                    status: 'CANCELLED',
                    notes: `${cancelVoucher.notes || ''} [LÝ DO HỦY: ${cancelReason.trim()}]`,
                  });
                  toast.success(`Đã hủy phiếu chi ${cancelVoucher.voucherNumber} và hoàn trả công nợ cho đơn hàng!`);
                  setCancelVoucher(null);
                  setIsModalOpen(false);
                } catch (e: any) {
                  toast.error(e?.message || 'Không thể hủy phiếu chi');
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs disabled:opacity-50"
            >
              Xác nhận hủy phiếu
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Xác nhận xóa */}
      <Modal
        isOpen={!!deletingVoucher}
        onClose={() => setDeletingVoucher(null)}
        title="Xác nhận hủy phiếu chi"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Bạn có chắc chắn muốn hủy bỏ phiếu chi <strong className="text-gray-900 dark:text-white">{deletingVoucher?.voucherNumber}</strong> giải ngân cho <span className="font-semibold">{deletingVoucher?.payeeName}</span>?
          </p>
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-200 dark:border-red-800/40">
            Hành động này sẽ gỡ bỏ chứng từ khỏi hệ thống kế toán tổng hợp. Chỉ nên thực hiện nếu lệnh chuyển khoản chưa thực sự được ngân hàng xử lý hoặc đây là phiếu tạo nhầm.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setDeletingVoucher(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Đồng ý hủy
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
