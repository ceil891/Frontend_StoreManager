import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, Eye, Calendar, User, FileText, ArrowDownLeft, Edit, Trash2, Building2, Lock, CheckCircle2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useFinanceStore, type ReceiptVoucher } from '../store/financeStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { extractPageContent } from '@/shared/lib/apiHelpers';
import { toast } from 'sonner';
import { exportToCsv } from '@/shared/utils/exportCsv';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { CreateButton, SecondaryButton, PrimaryButton, DangerButton } from '@/shared/components/ui/Button';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';

const categoryMap: Record<string, string> = {
  SALES_REVENUE: 'Doanh thu bán hàng',
  DEBT_COLLECTION: 'Thu hồi công nợ',
  INVESTMENT: 'Vốn góp / Đầu tư',
  OTHER: 'Khoản thu khác',
};

const methodMap: Record<string, string> = {
  CASH: 'Tiền mặt tại quỹ',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  CREDIT_CARD: 'Thẻ thanh toán POS',
};

interface CustomerOption {
  id: string | number;
  name: string;
  phone: string;
  code: string;
  debt: number;
}

interface SalesInvoiceOption {
  code: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingDebt: number;
}

interface FundAccountOption {
  id: string | number;
  name: string;
  type: 'BANK' | 'CASH';
  accountNumber?: string;
  balance: number;
}

export function ReceiptVouchersPage() {
  const data = useFinanceStore((s) => s.receipts);
  const addReceipt = useFinanceStore((s) => s.addReceipt);
  const updateReceipt = useFinanceStore((s) => s.updateReceipt);
  const deleteReceipt = useFinanceStore((s) => s.deleteReceipt);
  const fetchReceipts = useFinanceStore((s) => s.fetchReceipts);

  const [search, setSearch] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<ReceiptVoucher | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoCode, setIsAutoCode] = useState(true);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingVoucher, setEditingVoucher] = useState<Partial<ReceiptVoucher> & { fundAccountName?: string }>({});
  const [deletingVoucher, setDeletingVoucher] = useState<ReceiptVoucher | null>(null);

  // Master Data Lookups
  const [customersList, setCustomersList] = useState<CustomerOption[]>([]);
  const [invoicesList, setInvoicesList] = useState<SalesInvoiceOption[]>([]);
  const [fundsList, setFundsList] = useState<FundAccountOption[]>([]);

  const fetchMasterData = async () => {
    // 1. Fetch Customers from real API
    axiosClient.get('/partnerarea/customers?size=500').then((res: any) => {
      const list = extractPageContent<any>(res);
      const mapped: CustomerOption[] = list.map((c: any, idx: number) => ({
        id: c.id || idx + 1,
        name: c.name || c.fullName || c.customerName || 'Khách hàng',
        phone: c.phone || c.phoneNumber || '',
        code: c.code || c.customerCode || `CUST-${idx + 1}`,
        debt: Number(c.debtBalance || c.debt || 0),
      }));
      setCustomersList(mapped);
    }).catch(() => setCustomersList([]));

    // 2. Fetch Sales Invoices (hóa đơn bán hàng còn công nợ)
    axiosClient.get('/sales/invoices?size=500').then((res: any) => {
      const list = extractPageContent<any>(res);
      const mapped: SalesInvoiceOption[] = list.map((inv: any) => {
        const code = inv.invoiceCode || inv.code || `INV-${inv.id}`;
        const total = Number(inv.totalAmount || inv.total || 0);
        const paid = Number(inv.paidAmount || 0);
        const remaining = Math.max(0, total - paid);
        return {
          code,
          customerName: inv.customerName || inv.customer?.name || '',
          totalAmount: total,
          paidAmount: paid,
          remainingDebt: remaining,
        };
      });
      setInvoicesList(mapped);
    }).catch(() => setInvoicesList([]));

    // 3. Fetch Fund/Bank accounts from real API
    axiosClient.get('/finance/bank-accounts').then((res: any) => {
      const list = Array.isArray(res) ? res : (res?.content || []);
      const mapped: FundAccountOption[] = list.map((f: any) => ({
        id: f.id,
        name: `[${f.bankName || 'NGÂN HÀNG'}] ${f.accountHolder || f.accountName || ''} - ${f.accountNumber || ''}`,
        type: 'BANK' as const,
        accountNumber: f.accountNumber || '',
        balance: Number(f.currentBalance || f.balance || 0),
      }));
      setFundsList(mapped);
    }).catch(() => setFundsList([]));
  };

  useEffect(() => {
    fetchReceipts();
    fetchMasterData();
  }, [fetchReceipts]);

  const filtered = data.filter((item) =>
    item.payerName.toLowerCase().includes(search.toLowerCase()) ||
    item.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
    (item.referenceDoc && item.referenceDoc.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setIsAutoCode(true);
    const defaultFund = fundsList[0]?.name || '';
    const firstInvoice = invoicesList[0];

    setEditingVoucher({
      voucherNumber: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      payerName: firstInvoice?.customerName || customersList[0]?.name || '',
      category: 'SALES_REVENUE',
      amount: firstInvoice?.remainingDebt || 0,
      paymentMethod: 'BANK_TRANSFER',
      fundAccountName: defaultFund,
      receivedDate: new Date().toISOString().substring(0, 10),
      referenceDoc: firstInvoice?.code || '',
      cashier: 'Super Admin (Hưng)',
      branchId: 'BR-001',
      notes: 'Thu tiền bán hàng theo hóa đơn'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (voucher: ReceiptVoucher) => {
    setModalMode('edit');
    setIsAutoCode(false);
    setEditingVoucher({
      ...voucher,
      fundAccountName: (voucher as any).fundAccountName || fundsList[0]?.name || ''
    });
    setIsModalOpen(true);
  };

  // 3. INVOICE SELECTION AUTO-FILL
  const handleSelectInvoice = (invCode: string) => {
    const matched = invoicesList.find(i => i.code === invCode);
    if (matched) {
      setEditingVoucher(prev => ({
        ...prev,
        referenceDoc: invCode,
        payerName: matched.customerName,
        amount: matched.remainingDebt,
      }));
      toast.info(`Đã liên kết Hóa đơn ${invCode}. Khách hàng: ${matched.customerName} - Dư nợ: ${matched.remainingDebt.toLocaleString('vi-VN')} ₫`);
    } else {
      setEditingVoucher(prev => ({ ...prev, referenceDoc: invCode }));
    }
  };

  // 2. CUSTOMER SELECTION AUTO-FILL
  const handleSelectCustomer = (custName: string) => {
    const matched = customersList.find(c => c.name === custName);
    setEditingVoucher(prev => ({
      ...prev,
      payerName: custName,
      amount: matched?.debt || prev.amount || 0,
    }));
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoucher.voucherNumber || !editingVoucher.payerName) {
      toast.error('Vui lòng chọn Người nộp tiền / Khách hàng');
      return;
    }
    const recAmount = Number(editingVoucher.amount) || 0;
    if (recAmount <= 0) {
      toast.error('Số tiền thu phải lớn hơn 0 ₫');
      return;
    }

    const payload = {
      voucherNumber: editingVoucher.voucherNumber || `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      payerName: editingVoucher.payerName || 'Khách hàng',
      category: editingVoucher.category || 'SALES_REVENUE',
      amount: recAmount,
      paymentMethod: editingVoucher.paymentMethod || 'BANK_TRANSFER',
      fundAccountName: editingVoucher.fundAccountName || fundsList[0]?.name || 'Techcombank - 1902838392',
      receivedDate: editingVoucher.receivedDate || new Date().toISOString().substring(0, 10),
      referenceDoc: editingVoucher.referenceDoc || 'INV-2026-1024',
      cashier: editingVoucher.cashier || 'Super Admin (Hưng)',
      branchId: editingVoucher.branchId || 'BR-001',
      notes: editingVoucher.notes || '',
    };

    try {
      if (modalMode === 'create') {
        await addReceipt(payload as any);
        toast.success(
          `Đã lập Phiếu Thu ${payload.voucherNumber} (+${payload.amount.toLocaleString('vi-VN')} ₫)!\n` +
          `✓ Tăng số dư ${payload.fundAccountName}\n` +
          `✓ Trừ ${payload.amount.toLocaleString('vi-VN')} ₫ công nợ phải thu của ${payload.payerName}`
        );
      } else if (editingVoucher.id) {
        await updateReceipt(editingVoucher.id, payload as any);
        toast.success('Cập nhật phiếu thu thành công');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Lỗi khi lưu phiếu thu:', err);
      toast.error('Không thể lưu phiếu thu: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVoucher) return;
    try {
      await deleteReceipt(deletingVoucher.id);
      toast.success(`Đã hủy phiếu thu ${deletingVoucher.voucherNumber}`);
      setDeletingVoucher(null);
    } catch (err: any) {
      console.error('Lỗi khi xóa phiếu thu:', err);
      toast.error('Không thể xóa phiếu thu: ' + (err?.response?.data?.message || err?.message || 'Chứng từ đã duyệt hoặc bị khóa'));
    }
  };

  const columns = useMemo<ColumnDef<ReceiptVoucher>[]>(
    () => [
      {
        accessorKey: 'voucherNumber',
        header: 'Số phiếu thu',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'payerName',
        header: 'Người nộp / Khách hàng',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'category',
        header: 'Nhóm khoản thu',
        cell: (info) => {
          const cat = info.getValue() as string;
          return <span className="text-gray-700 dark:text-gray-300 font-medium text-xs bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded">{categoryMap[cat] || cat}</span>;
        },
      },
      {
        accessorKey: 'amount',
        header: 'Số tiền thực thu',
        cell: (info) => <span className="font-bold font-mono text-emerald-600 text-sm">+{ (info.getValue() as number).toLocaleString('vi-VN') } ₫</span>,
      },
      {
        accessorKey: 'referenceDoc',
        header: 'Hóa đơn / Hợp đồng',
        cell: (info) => {
          const doc = (info.getValue() as string) || 'INV-2026-1024';
          return (
            <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {doc}
            </span>
          );
        },
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Hình thức & Nguồn quỹ nhận',
        cell: ({ row }) => {
          const method = row.original.paymentMethod;
          const fundName = (row.original as any).fundAccountName || 'Techcombank - 1902838392 (Công ty StoreManager)';
          return (
            <div className="space-y-0.5">
              <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded font-bold inline-block">
                {methodMap[method] || method}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-mono truncate max-w-xs">{fundName}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'receivedDate',
        header: 'Ngày lập',
        cell: (info) => <span className="text-gray-500 text-xs font-mono">{info.getValue() as string}</span>,
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedVoucher(row.original); }}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phiếu thu & dòng tiền vào (Receipt Vouchers)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Ghi nhận dòng tiền thu bán hàng, thu hồi công nợ khách hàng và hạch toán tự động tăng số dư Quỹ tiền mặt / Ngân hàng.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SecondaryButton
              onClick={() => {
                exportToCsv('danh_sach_phieu_thu', filtered, [
                  { header: 'Số phiếu thu', accessor: r => r.voucherNumber },
                  { header: 'Người nộp', accessor: r => r.payerName },
                  { header: 'Nhóm khoản thu', accessor: r => categoryMap[r.category] || r.category },
                  { header: 'Số tiền', accessor: r => r.amount },
                  { header: 'Chứng từ gốc', accessor: r => r.referenceDoc || '' },
                  { header: 'Hình thức', accessor: r => methodMap[r.paymentMethod] || r.paymentMethod },
                  { header: 'Ngày thu', accessor: r => r.receivedDate },
                ]);
              }}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Xuất Excel
            </SecondaryButton>
            <CreateButton
              onClick={handleOpenCreate}
            >
              Lập phiếu thu mới
            </CreateButton>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Tìm kiếm mã phiếu thu, người nộp tiền, hóa đơn liên quan..."
            containerClassName="w-full sm:max-w-md"
          />
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedVoucher(row)} />
      </div>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={!!selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        title={selectedVoucher ? `📑 Chi tiết Phiếu Thu: ${selectedVoucher.voucherNumber}` : 'Chi tiết Phiếu Thu'}
        width="max-w-2xl"
      >
        {selectedVoucher && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase block">Số tiền thực thu nhận</span>
                <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">+{selectedVoucher.amount.toLocaleString('vi-VN')} ₫</p>
              </div>
              <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                selectedVoucher.status === 'PENDING_APPROVAL'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
              }`}>
                {selectedVoucher.status === 'PENDING_APPROVAL' ? 'Chờ phê duyệt' : 'Đã thu tiền & Ghi nhận sổ quỹ'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Người nộp / Khách hàng:</span>
                <span className="font-bold text-gray-900 dark:text-white text-xs block">{selectedVoucher.payerName}</span>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Mã Hóa đơn / Hợp đồng:</span>
                <span className="font-mono font-bold text-emerald-600 text-xs block">{selectedVoucher.referenceDoc || 'INV-2026-1024'}</span>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Ngày lập phiếu:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white text-xs block">{selectedVoucher.receivedDate}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1">
              <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase block">🏦 TÀI KHOẢN / QUỸ NHẬN TIỀN CỘNG SỐ DƯ</span>
              <p className="font-bold text-blue-700 dark:text-blue-300 text-xs">{(selectedVoucher as any).fundAccountName || 'Techcombank - 1902838392 (Công ty StoreManager)'}</p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400">Hình thức: <strong>{methodMap[selectedVoucher.paymentMethod] || selectedVoucher.paymentMethod}</strong></p>
            </div>

            {selectedVoucher.notes && (
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="font-semibold text-gray-500 block mb-1">Ghi chú diễn giải:</span>
                <p className="text-gray-700 dark:text-gray-300">{selectedVoucher.notes}</p>
              </div>
            )}

            {selectedVoucher.status === 'PENDING_APPROVAL' && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      await updateReceipt(selectedVoucher.id, { status: 'COMPLETED' } as any);
                      setSelectedVoucher({ ...selectedVoucher, status: 'COMPLETED' });
                      toast.success('Đã phê duyệt phiếu thu và ghi nhận tăng số dư quỹ thành công!');
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || err?.message || 'Phê duyệt thất bại');
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-xs cursor-pointer"
                >
                  Phê duyệt & Ghi nhận sổ quỹ
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* FORM CREATE / EDIT RECEIPT VOUCHER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '📗 Lập Phiếu Thu Doanh Thu Mới' : '⚙️ Chỉnh sửa Phiếu Thu'}
        width="max-w-3xl"
      >
        <form onSubmit={handleSaveVoucher} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã phiếu thu *</label>
              </div>
              <input
                type="text"
                value={editingVoucher.voucherNumber || ''}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, voucherNumber: e.target.value })}
                readOnly={modalMode === 'create' && isAutoCode}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-gray-100 dark:bg-gray-900 text-emerald-600 font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Kế toán / Thu ngân * (Tự động)</label>
              <input
                type="text"
                value={editingVoucher.cashier || 'Super Admin (Hưng)'}
                readOnly
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nhóm khoản thu *</label>
              <select
                value={editingVoucher.category || 'SALES_REVENUE'}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, category: e.target.value as any })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
              >
                <option value="SALES_REVENUE">Doanh thu bán hàng (Sales Revenue)</option>
                <option value="DEBT_COLLECTION">Thu hồi công nợ khách hàng (Debt Collection)</option>
                <option value="INVESTMENT">Vốn góp / Đầu tư (Investment)</option>
                <option value="OTHER">Khoản thu khác (Other)</option>
              </select>
            </div>
          </div>

          {/* 3. CHỨNG TỪ / HỢP ĐỒNG THAM CHIẾU (LOOKUP INVOICE & AUTO-SUGGEST) */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900 space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase flex items-center gap-1">
                🔗 CHỌN HÓA ĐƠN XUẤT BÁN NỢ (Lookup Auto-fill & Gợi ý tiền) *
              </label>
              <span className="text-[10px] text-emerald-700 font-mono">Chỉ lọc đơn hàng còn nợ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Chọn Hóa đơn bán hàng còn nợ *</label>
                <select
                  value={editingVoucher.referenceDoc || ''}
                  onChange={(e) => handleSelectInvoice(e.target.value)}
                  className="w-full p-2 border border-emerald-300 dark:border-emerald-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono font-bold"
                >
                  <option value="">-- Tự chọn từ danh sách Hóa đơn xuất bán --</option>
                  {invoicesList.map((inv) => (
                    <option key={inv.code} value={inv.code}>
                      {inv.code} - {inv.customerName} (Nợ còn lại: {inv.remainingDebt.toLocaleString('vi-VN')} ₫)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. ĐƠN VỊ / NGƯỜI NỘP TIỀN (AUTOCOMPLETE CUSTOMER DROPDOWN) */}
              <div>
                <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" /> Chọn Khách hàng nộp tiền (Danh bạ DB) *
                </label>
                <select
                  value={editingVoucher.payerName || ''}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="w-full p-2 border border-emerald-300 dark:border-emerald-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                  required
                >
                  <option value="">-- Chọn Khách hàng từ DB --</option>
                  {customersList.map((cust) => (
                    <option key={cust.id} value={cust.name}>
                      {cust.name} - {cust.phone} (Công nợ: {cust.debt.toLocaleString('vi-VN')} ₫)
                    </option>
                  ))}
                  {!customersList.some(c => c.name === editingVoucher.payerName) && editingVoucher.payerName && (
                    <option value={editingVoucher.payerName}>{editingVoucher.payerName}</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* 1. TÀI KHOẢN / QUỸ NHẬN TIỀN (CỘNG SỐ DƯ QUỸ) */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 space-y-3">
            <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase flex items-center gap-1">
              🏦 CHỌN TÀI KHOẢN / QUỸ NHẬN TIỀN (Tự động cộng số dư phân hệ Ngân hàng & Quỹ) *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Hình thức nhận tiền *</label>
                <select
                  value={editingVoucher.paymentMethod || 'BANK_TRANSFER'}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, paymentMethod: e.target.value as any })}
                  className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                >
                  <option value="BANK_TRANSFER">Chuyển khoản Ngân hàng (TK Doanh nghiệp)</option>
                  <option value="CASH">Tiền mặt tại Quỹ</option>
                  <option value="CREDIT_CARD">Thẻ thanh toán / POS</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Tài khoản Ngân hàng / Quỹ nhận tiền *</label>
                <select
                  value={editingVoucher.fundAccountName || (fundsList[0]?.name || '')}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, fundAccountName: e.target.value })}
                  className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold"
                  required
                >
                  {fundsList.length > 0 ? (
                    fundsList.map((fund) => (
                      <option key={fund.id} value={fund.name}>
                        {fund.name} (Dư: {fund.balance.toLocaleString('vi-VN')} ₫)
                      </option>
                    ))
                  ) : (
                    <option value="">-- Chưa có tài khoản ngân hàng / quỹ --</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SỐ TIỀN THỰC THU (₫) *</label>
              <input
                type="number"
                min={1}
                value={editingVoucher.amount ?? 0}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, amount: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 border border-emerald-300 dark:border-emerald-700 rounded bg-white dark:bg-gray-900 text-emerald-600 font-mono font-black text-base text-right"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày lập phiếu thu *</label>
              <input
                type="date"
                value={editingVoucher.receivedDate || ''}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, receivedDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Diễn giải & Ghi chú khoản thu</label>
            <textarea
              rows={2}
              value={editingVoucher.notes || ''}
              onChange={(e) => setEditingVoucher({ ...editingVoucher, notes: e.target.value })}
              placeholder="Nhập nội dung diễn giải thu tiền..."
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" /> {modalMode === 'create' ? 'Lập Phiếu Thu & Ghi Sổ Quỹ' : 'Lưu Cập Nhật'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xác nhận xóa */}
      <ConfirmDeleteModal
        isOpen={!!deletingVoucher}
        onClose={() => setDeletingVoucher(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận hủy phiếu thu"
        description="Bạn có chắc chắn muốn hủy bỏ phiếu thu này không? Thao tác này sẽ cập nhật trạng thái hủy và điều chỉnh sổ quỹ liên quan."
        itemName={`${deletingVoucher?.voucherNumber} (${deletingVoucher?.payerName})`}
      />
    </>
  );
}
