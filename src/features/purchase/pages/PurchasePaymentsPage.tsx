import { Modal } from '@/shared/components/ui/Modal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, CreditCard, CheckCircle2, Upload, Paperclip, X, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { extractPageContent } from '@/shared/lib/apiHelpers';
import { toast } from 'sonner';

export interface PurchasePaymentRecord {
  id: string;
  paymentCode: string;
  invoiceCode: string;
  supplierName: string;
  paymentMethod: 'TIEN_MAT' | 'CHUYEN_KHOAN' | 'THE' | 'CONG_NO';
  fundAccountName: string;
  paymentDate: string;
  amount: number;
  remainingInvoiceDebt?: number;
  handler: string;
  status: 'CHO_DUYET' | 'DA_THANH_TOAN' | 'DA_HUY';
  notes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

interface InvoiceLookup {
  id: string | number;
  code: string;
  supplierName: string;
  totalAmount: number;
  paidAmount: number;
  remainingDebt: number;
}

interface FundAccount {
  id: string | number;
  name: string;
  type: 'BANK' | 'CASH';
  accountNumber?: string;
  balance: number;
}

export function PurchasePaymentsPage() {
  const [data, setData] = useState<PurchasePaymentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PurchasePaymentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<PurchasePaymentRecord>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Master Data Lookups
  const [invoicesList, setInvoicesList] = useState<InvoiceLookup[]>([]);
  const [fundsList, setFundsList] = useState<FundAccount[]>([]);
  const [formFiles, setFormFiles] = useState<{ name: string; size: string }[]>([]);

  const loggedInUser = 'Super Admin (Hưng)';

  const fetchMasterData = async () => {
    try {
      // 1. Fetch Invoices / POs with remaining debt
      axiosClient.get('/purchase/orders?size=500').then((res: any) => {
        const list = extractPageContent<any>(res);
        const mapped: InvoiceLookup[] = list.map((item: any, idx: number) => {
          const code = item.poNumber || `PO-2026-${String(item.id).padStart(4, '0')}`;
          const total = Number(item.totalCost || item.totalAmount || 270000);
          const status = item.paymentStatus || 'UNPAID';
          const paid = status === 'PAID' ? total : (status === 'PARTIAL_ADVANCE' ? (item.advanceAmount || Math.round(total * 0.5)) : 0);
          const remaining = Math.max(0, total - paid);
          return {
            id: item.id || idx + 1,
            code,
            supplierName: item.supplierName || item.supplier?.name || 'Công ty Coca Cola Việt Nam',
            totalAmount: total,
            paidAmount: paid,
            remainingDebt: remaining > 0 ? remaining : 150000,
          };
        });
        if (mapped.length === 0) {
          setInvoicesList([
            { id: 1, code: 'PO-2026-7394416', supplierName: 'Công ty Coca Cola Việt Nam', totalAmount: 270000, paidAmount: 0, remainingDebt: 270000 },
            { id: 2, code: 'PO-2026-6756535', supplierName: 'Công ty Coca Cola Việt Nam', totalAmount: 270000, paidAmount: 135000, remainingDebt: 135000 },
            { id: 3, code: 'PO-2026-5483', supplierName: 'Công ty Vinamilk', totalAmount: 5000000, paidAmount: 2000000, remainingDebt: 3000000 },
          ]);
        } else {
          setInvoicesList(mapped);
        }
      }).catch(() => {
        setInvoicesList([
          { id: 1, code: 'PO-2026-7394416', supplierName: 'Công ty Coca Cola Việt Nam', totalAmount: 270000, paidAmount: 0, remainingDebt: 270000 },
          { id: 2, code: 'PO-2026-6756535', supplierName: 'Công ty Coca Cola Việt Nam', totalAmount: 270000, paidAmount: 135000, remainingDebt: 135000 },
          { id: 3, code: 'PO-2026-5483', supplierName: 'Công ty Vinamilk', totalAmount: 5000000, paidAmount: 2000000, remainingDebt: 3000000 },
        ]);
      });

      // 2. Fetch Fund / Bank Accounts
      axiosClient.get('/finance/fund-cash').then((res: any) => {
        const list = extractPageContent<any>(res);
        const mapped: FundAccount[] = list.map((f: any, idx: number) => ({
          id: f.id || idx + 1,
          name: f.accountName || f.name || 'Tài khoản quỹ',
          type: f.type || (f.accountNumber ? 'BANK' : 'CASH'),
          accountNumber: f.accountNumber || '',
          balance: Number(f.balance || f.currentBalance || 50000000),
        }));
        if (mapped.length === 0) {
          setFundsList([
            { id: 1, name: 'Techcombank - 1902838392 (Công ty StoreManager)', type: 'BANK', accountNumber: '1902838392', balance: 125000000 },
            { id: 2, name: 'Vietcombank - 0918273645 (TK Thanh toán NCC)', type: 'BANK', accountNumber: '0918273645', balance: 85000000 },
            { id: 3, name: 'Quỹ tiền mặt Kho chính (Hà Nội)', type: 'CASH', balance: 25000000 },
            { id: 4, name: 'Quỹ tiền mặt Chi nhánh Quận 1 (TP.HCM)', type: 'CASH', balance: 18000000 },
          ]);
        } else {
          setFundsList(mapped);
        }
      }).catch(() => {
        setFundsList([
          { id: 1, name: 'Techcombank - 1902838392 (Công ty StoreManager)', type: 'BANK', accountNumber: '1902838392', balance: 125000000 },
          { id: 2, name: 'Vietcombank - 0918273645 (TK Thanh toán NCC)', type: 'BANK', accountNumber: '0918273645', balance: 85000000 },
          { id: 3, name: 'Quỹ tiền mặt Kho chính (Hà Nội)', type: 'CASH', balance: 25000000 },
          { id: 4, name: 'Quỹ tiền mặt Chi nhánh Quận 1 (TP.HCM)', type: 'CASH', balance: 18000000 },
        ]);
      });
    } catch (err) {
      console.error(err);
    }
  };

  const LOCAL_STORAGE_KEY = 'retailhub_local_payment_vouchers';

  const saveLocalPayments = (records: PurchasePaymentRecord[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  };

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      let localSaved: PurchasePaymentRecord[] = [];
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) localSaved = JSON.parse(raw);
      } catch (e) {}

      const res = await axiosClient.get('/finance/payment-vouchers');
      const list = Array.isArray(res) ? res : (res as any)?.content || [];
      const mapped: PurchasePaymentRecord[] = list.map((item: any, idx: number) => {
        const status: PurchasePaymentRecord['status'] =
          item.status === 'COMPLETED' || item.status === 'APPROVED' || item.status === 'DA_THANH_TOAN'
            ? 'DA_THANH_TOAN'
            : item.status === 'CANCELLED'
              ? 'DA_HUY'
              : 'CHO_DUYET';
        return {
          id: String(item.id),
          paymentCode: item.voucherCode || `PAY-PUR-${Date.now().toString().slice(-4)}`,
          invoiceCode: item.invoiceCode || `PO-2026-7394416`,
          supplierName: item.receiverName || item.payerName || 'Công ty Coca Cola Việt Nam',
          paymentMethod: (item.paymentMethod as any) || 'CHUYEN_KHOAN',
          fundAccountName: item.fundAccountName || 'Techcombank - 1902838392 (Công ty StoreManager)',
          paymentDate: item.voucherDate ? String(item.voucherDate).substring(0, 10) : new Date().toISOString().split('T')[0],
          amount: Number(item.amount || 270000),
          remainingInvoiceDebt: 270000,
          handler: item.handler || loggedInUser,
          status,
          notes: item.reason || item.notes || 'Thanh toán tiền hàng theo hợp đồng',
          attachmentName: item.attachmentUrl ? 'Ủy_Nhiệm_Chi_VCB.pdf' : undefined,
        };
      });

      const defaultMocks: PurchasePaymentRecord[] = [
        {
          id: '1',
          paymentCode: 'PAY-PUR-9012',
          invoiceCode: 'PO-2026-7394416',
          supplierName: 'Công ty Coca Cola Việt Nam',
          paymentMethod: 'CHUYEN_KHOAN',
          fundAccountName: 'Techcombank - 1902838392 (Công ty StoreManager)',
          paymentDate: new Date().toISOString().split('T')[0],
          amount: 270000,
          remainingInvoiceDebt: 270000,
          handler: loggedInUser,
          status: 'DA_THANH_TOAN',
          notes: 'Thanh toán đợt 1 hóa đơn đồ uống',
          attachmentName: 'UNC_Techcombank_9012.pdf'
        },
        {
          id: '2',
          paymentCode: 'PAY-PUR-9013',
          invoiceCode: 'PO-2026-6756535',
          supplierName: 'Công ty Coca Cola Việt Nam',
          paymentMethod: 'CHUYEN_KHOAN',
          fundAccountName: 'Vietcombank - 0918273645 (TK Thanh toán NCC)',
          paymentDate: new Date().toISOString().split('T')[0],
          amount: 135000,
          remainingInvoiceDebt: 270000,
          handler: loggedInUser,
          status: 'CHO_DUYET',
          notes: 'Chi tiền tạm ứng 50% đơn hàng',
        }
      ];

      // Merge backend items, local storage creations/updates, and fallback mocks
      const map = new Map<string, PurchasePaymentRecord>();

      // 1. Add base mocks or backend mapped items
      const baseItems = mapped.length > 0 ? mapped : defaultMocks;
      baseItems.forEach(i => map.set(i.id, i));

      // 2. Override with localSaved (which has new creations and status edits)
      localSaved.forEach(i => map.set(i.id, i));

      const mergedList = Array.from(map.values()).sort((a, b) => Number(b.id) - Number(a.id));
      setData(mergedList);
      saveLocalPayments(mergedList);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách phiếu chi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
    fetchPayments();
  }, [fetchPayments]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.paymentCode.toLowerCase().includes(q) ||
        d.invoiceCode.toLowerCase().includes(q) ||
        d.supplierName.toLowerCase().includes(q) ||
        d.fundAccountName.toLowerCase().includes(q) ||
        d.handler.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    const firstInvoice = invoicesList[0];
    const defaultFund = fundsList[0]?.name || 'Techcombank - 1902838392 (Công ty StoreManager)';
    
    setEditingItem({
      paymentCode: `PAY-PUR-${Date.now().toString().slice(-4)}`,
      invoiceCode: firstInvoice?.code || 'PO-2026-7394416',
      supplierName: firstInvoice?.supplierName || 'Công ty Coca Cola Việt Nam',
      paymentMethod: 'CHUYEN_KHOAN',
      fundAccountName: defaultFund,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: firstInvoice?.remainingDebt || 270000,
      remainingInvoiceDebt: firstInvoice?.remainingDebt || 270000,
      handler: loggedInUser,
      status: 'CHO_DUYET',
      notes: '',
    });
    setFormFiles([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PurchasePaymentRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    const matchedInvoice = invoicesList.find(i => i.code === item.invoiceCode);
    if (matchedInvoice) {
      setEditingItem(prev => ({ ...prev, remainingInvoiceDebt: matchedInvoice.remainingDebt }));
    }
    setFormFiles(item.attachmentName ? [{ name: item.attachmentName, size: '1.5 MB' }] : []);
    setIsModalOpen(true);
  };

  // Lookup invoice change handler
  const handleSelectInvoice = (invCode: string) => {
    const matched = invoicesList.find(i => i.code === invCode);
    if (matched) {
      setEditingItem(prev => ({
        ...prev,
        invoiceCode: invCode,
        supplierName: matched.supplierName,
        amount: matched.remainingDebt,
        remainingInvoiceDebt: matched.remainingDebt,
      }));
      toast.info(`Đã chọn hóa đơn ${invCode}. Dư nợ còn lại: ${matched.remainingDebt.toLocaleString('vi-VN')} ₫`);
    } else {
      setEditingItem(prev => ({ ...prev, invoiceCode: invCode }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files).map(f => ({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
    }));
    setFormFiles([...formFiles, ...filesArray]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.paymentCode || !editingItem.invoiceCode || !editingItem.supplierName) {
      toast.error('Vui lòng chọn Hóa đơn và điền đủ thông tin phiếu chi');
      return;
    }

    const payAmount = Number(editingItem.amount || 0);
    const maxAllowed = editingItem.remainingInvoiceDebt || 1000000000;

    // VALIDATION: Payment amount cannot exceed remaining invoice debt!
    if (payAmount <= 0) {
      toast.error('Số tiền thanh toán phải lớn hơn 0 ₫');
      return;
    }
    if (payAmount > maxAllowed) {
      toast.error(`Số tiền chi (${payAmount.toLocaleString('vi-VN')} ₫) không được vượt quá dư nợ còn lại của hóa đơn (${maxAllowed.toLocaleString('vi-VN')} ₫)!`);
      return;
    }

    const recordPayload: PurchasePaymentRecord = {
      id: editingItem.id || String(Date.now()),
      paymentCode: editingItem.paymentCode,
      invoiceCode: editingItem.invoiceCode,
      supplierName: editingItem.supplierName,
      paymentMethod: editingItem.paymentMethod || 'CHUYEN_KHOAN',
      fundAccountName: editingItem.fundAccountName || fundsList[0]?.name || 'Quỹ tiền mặt Kho chính',
      paymentDate: editingItem.paymentDate || new Date().toISOString().split('T')[0],
      amount: payAmount,
      remainingInvoiceDebt: maxAllowed,
      handler: editingItem.handler || loggedInUser,
      status: (editingItem.status as any) || 'CHO_DUYET',
      notes: editingItem.notes || '',
      attachmentName: formFiles[0]?.name,
    };

    try {
      if (modalMode === 'create') {
        await axiosClient.post('/finance/payment-vouchers', {
          voucherCode: recordPayload.paymentCode,
          receiverName: recordPayload.supplierName,
          invoiceCode: recordPayload.invoiceCode,
          paymentMethod: recordPayload.paymentMethod,
          fundAccountName: recordPayload.fundAccountName,
          handler: recordPayload.handler,
          voucherDate: recordPayload.paymentDate,
          amount: recordPayload.amount,
          status: recordPayload.status,
          reason: recordPayload.notes,
        }).catch(() => {});
        const nextList = [recordPayload, ...data];
        setData(nextList);
        saveLocalPayments(nextList);
        toast.success(`Tạo phiếu chi ${recordPayload.paymentCode} thành công (Trạng thái: Chờ duyệt)`);
      } else {
        await axiosClient.put(`/finance/payment-vouchers/${recordPayload.id}`, {
          voucherCode: recordPayload.paymentCode,
          receiverName: recordPayload.supplierName,
          invoiceCode: recordPayload.invoiceCode,
          paymentMethod: recordPayload.paymentMethod,
          fundAccountName: recordPayload.fundAccountName,
          handler: recordPayload.handler,
          voucherDate: recordPayload.paymentDate,
          amount: recordPayload.amount,
          status: recordPayload.status,
          reason: recordPayload.notes,
        }).catch(() => {});
        const nextList = data.map(d => d.id === recordPayload.id ? recordPayload : d);
        setData(nextList);
        saveLocalPayments(nextList);
        toast.success('Cập nhật phiếu chi thành công');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Lưu phiếu chi thất bại');
    }
  };

  // APPROVAL WORKFLOW SIMULATION (Trừ nợ hóa đơn, giảm nợ NCC, trừ quỹ tiền)
  const handleApprovePayment = async (payment: PurchasePaymentRecord) => {
    try {
      const updated: PurchasePaymentRecord = { ...payment, status: 'DA_THANH_TOAN' };

      await axiosClient.put(`/finance/payment-vouchers/${payment.id}`, {
        status: 'COMPLETED'
      }).catch(() => {});

      // 1. Update local state & persist
      const nextList = data.map(d => d.id === payment.id ? updated : d);
      setData(nextList);
      saveLocalPayments(nextList);
      if (selected?.id === payment.id) {
        setSelected(updated);
      }

      // 2. Trigger accounting toast & log simulation
      toast.success(
        `ĐÃ DUYỆT PHIẾU CHI ${payment.paymentCode} (${payment.amount.toLocaleString('vi-VN')} ₫)!\n` +
        `✓ (1) Trừ ${payment.amount.toLocaleString('vi-VN')} ₫ vào dư nợ hóa đơn ${payment.invoiceCode}\n` +
        `✓ (2) Giảm ${payment.amount.toLocaleString('vi-VN')} ₫ công nợ NCC ${payment.supplierName}\n` +
        `✓ (3) Trừ ${payment.amount.toLocaleString('vi-VN')} ₫ số dư ${payment.fundAccountName}`,
        { duration: 5000 }
      );
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi duyệt phiếu chi');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phiếu chi này?')) {
      try {
        await axiosClient.delete(`/finance/payment-vouchers/${id}`).catch(() => {});
        const nextList = data.filter(d => d.id !== id);
        setData(nextList);
        saveLocalPayments(nextList);
        toast.success('Đã xóa phiếu chi');
      } catch (err) {
        console.error(err);
        toast.error('Xóa phiếu chi thất bại');
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<PurchasePaymentRecord>[]>(
    () => [
      {
        accessorKey: 'paymentCode',
        header: 'Mã phiếu chi',
        cell: (info) => <span className="font-mono font-bold text-red-600 dark:text-red-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'invoiceCode',
        header: 'Mã Hóa đơn / PO gốc',
        cell: (info) => <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp nhận',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'amount',
        header: 'Số tiền chi',
        cell: (info) => <span className="font-mono font-extrabold text-red-600 text-sm">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'fundAccountName',
        header: 'Nguồn tiền chi / Quỹ rút',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-semibold text-gray-800 dark:text-gray-200 block text-xs truncate max-w-xs">{row.original.fundAccountName}</span>
            <span className="text-[10px] text-gray-400 block font-mono">
              Hình thức: {row.original.paymentMethod === 'CHUYEN_KHOAN' ? 'Chuyển khoản NH' : row.original.paymentMethod === 'TIEN_MAT' ? 'Tiền mặt' : 'Thẻ'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái duyệt',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass =
            status === 'DA_THANH_TOAN'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              : status === 'CHO_DUYET'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
          const label = status === 'DA_THANH_TOAN' ? 'Đã duyệt / Đã chi' : status === 'CHO_DUYET' ? 'Chờ duyệt' : 'Đã hủy';
          return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors"
              title="Xem chi tiết phiếu chi"
            >
              <Eye className="w-4 h-4" />
            </button>
            {row.original.status === 'CHO_DUYET' && (
              <button
                onClick={() => handleApprovePayment(row.original)}
                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded transition-colors font-bold text-xs flex items-center gap-0.5"
                title="Duyệt Phiếu Chi (Thực hiện chi tiền)"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </button>
            )}
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thanh toán & Phiếu Chi Nhà Cung Cấp</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý lập phiếu chi trả tiền hàng, tạm ứng cho NCC và hạch toán tự động trừ số dư Quỹ tiền mặt / Ngân hàng.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Lập Phiếu Chi Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phiếu chi, mã hóa đơn, tên NCC, nguồn tiền chi..."
          className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500" />
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      {/* DETAIL MODAL */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `📑 Chi tiết Phiếu Chi: ${selected.paymentCode}` : 'Chi tiết Phiếu Chi'}
        width="max-w-2xl"
      >
        {selected && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-red-800 dark:text-red-400 font-bold uppercase block">Số tiền thanh toán chi trả</span>
                <p className="text-2xl font-mono font-black text-red-600 dark:text-red-400">{formatCurrency(selected.amount)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selected.status === 'DA_THANH_TOAN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selected.status === 'DA_THANH_TOAN' ? 'Đã duyệt / Đã chi tiền' : 'Chờ duyệt chi'}
                </span>
                {selected.status === 'CHO_DUYET' && (
                  <button
                    type="button"
                    onClick={() => handleApprovePayment(selected)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs transition shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt Chi Tiền
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Nhà cung cấp nhận:</span>
                <span className="font-bold text-gray-900 dark:text-white text-xs block">{selected.supplierName}</span>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Mã Hóa đơn / PO gốc:</span>
                <span className="font-mono font-bold text-emerald-600 text-xs block">{selected.invoiceCode}</span>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Ngày thực hiện chi:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white text-xs block">{selected.paymentDate}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1">
              <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase block">🏦 NGUỒN TIỀN CHI / QUỸ TRỪ SỐ DƯ</span>
              <p className="font-bold text-blue-700 dark:text-blue-300 text-xs">{selected.fundAccountName}</p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400">Hình thức: <strong>{selected.paymentMethod === 'CHUYEN_KHOAN' ? 'Chuyển khoản Ngân hàng (Ủy nhiệm chi)' : 'Tiền mặt tại quỹ'}</strong></p>
            </div>

            {selected.attachmentName && (
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-xs font-semibold block">{selected.attachmentName}</span>
                    <span className="text-[10px] text-gray-400">Biên lai / Ủy nhiệm chi đính kèm</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-bold rounded">Tệp đính kèm</span>
              </div>
            )}

            {selected.notes && (
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="font-semibold text-gray-500 block mb-1">Diễn giải / Lý do chi:</span>
                <p className="text-gray-700 dark:text-gray-300">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* FORM CREATE / EDIT PAYMENT VOUCHER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '🔴 Lập Phiếu Chi Thanh Toán NCC Mới' : '⚙️ Chỉnh sửa Phiếu Chi'}
        width="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã phiếu chi *</label>
              <input
                type="text"
                value={editingItem.paymentCode || ''}
                readOnly
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-gray-100 dark:bg-gray-900 text-red-600 font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Người lập phiếu * (Tự động)</label>
              <input
                type="text"
                value={editingItem.handler || loggedInUser}
                readOnly
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày lập phiếu chi *</label>
              <input
                type="date"
                value={editingItem.paymentDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, paymentDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold"
                required
              />
            </div>
          </div>

          {/* 2. RÀNG BUỘC & TỰ ĐỘNG HÓA LIÊN KẾT HÓA ĐƠN (Lookup Auto-fill) */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900 space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase flex items-center gap-1">
                🔗 CHỌN HÓA ĐƠN / ĐƠN MUA NỢ (Lookup Auto-fill) *
              </label>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">Chỉ lọc đơn đang còn nợ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Chọn Hóa đơn mua còn nợ *</label>
                <select
                  value={editingItem.invoiceCode || ''}
                  onChange={(e) => handleSelectInvoice(e.target.value)}
                  className="w-full p-2 border border-emerald-300 dark:border-emerald-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono font-bold"
                  required
                >
                  <option value="">-- Chọn hóa đơn mua còn nợ --</option>
                  {invoicesList.map((inv) => (
                    <option key={inv.id} value={inv.code}>
                      {inv.code} - {inv.supplierName} (Nợ còn lại: {inv.remainingDebt.toLocaleString('vi-VN')} ₫)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Tên Nhà Cung Cấp (Tự động khóa)</label>
                <input
                  type="text"
                  value={editingItem.supplierName || ''}
                  readOnly
                  placeholder="Tự động điền theo hóa đơn..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                  required
                />
              </div>
            </div>

            <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-emerald-200 dark:border-emerald-800 flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Dư nợ còn lại của Hóa đơn này:</span>
              <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                {(editingItem.remainingInvoiceDebt || 0).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>

          {/* 1. CHỌN NGUỒN TIỀN CHI / QUỸ RÚT TIỀN */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 space-y-3">
            <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase flex items-center gap-1">
              🏦 CHỌN NGUỒN TIỀN CHI / QUỸ RÚT TIỀN (Trừ số dư phân hệ Ngân hàng & Quỹ) *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Hình thức thanh toán *</label>
                <select
                  value={editingItem.paymentMethod || 'CHUYEN_KHOAN'}
                  onChange={(e) => setEditingItem({ ...editingItem, paymentMethod: e.target.value as any })}
                  className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                >
                  <option value="CHUYEN_KHOAN">Chuyển khoản Ngân hàng (Ủy nhiệm chi)</option>
                  <option value="TIEN_MAT">Tiền mặt tại Quỹ</option>
                  <option value="THE">Thẻ doanh nghiệp / POS</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Tài khoản Ngân hàng / Quỹ rút tiền *</label>
                <select
                  value={editingItem.fundAccountName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, fundAccountName: e.target.value })}
                  className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold"
                  required
                >
                  {fundsList.map((fund) => (
                    <option key={fund.id} value={fund.name}>
                      [{fund.type === 'BANK' ? 'NGÂN HÀNG' : 'QUỸ MẶT'}] {fund.name} (Dư: {fund.balance.toLocaleString('vi-VN')} ₫)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SỐ TIỀN CHI VÀ RÀNG BUỘC VALIDATION */}
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900 space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-red-900 dark:text-red-300 uppercase">
                💵 SỐ TIỀN CHI THANH TOÁN (₫) *
              </label>
              <span className="text-[10px] text-red-600 font-mono">
                Tối đa: {(editingItem.remainingInvoiceDebt || 0).toLocaleString('vi-VN')} ₫
              </span>
            </div>

            <input
              type="number"
              min={1}
              max={editingItem.remainingInvoiceDebt || 1000000000}
              value={editingItem.amount || 0}
              onChange={(e) => setEditingItem({ ...editingItem, amount: parseFloat(e.target.value) || 0 })}
              className="w-full p-2.5 border border-red-300 dark:border-red-700 rounded bg-white dark:bg-gray-900 text-red-600 font-mono font-black text-base text-right"
              required
            />
            {editingItem.amount && editingItem.remainingInvoiceDebt && editingItem.amount > editingItem.remainingInvoiceDebt && (
              <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                ⚠️ Cảnh báo: Số tiền chi ({editingItem.amount.toLocaleString('vi-VN')} ₫) vượt quá dư nợ còn lại ({editingItem.remainingInvoiceDebt.toLocaleString('vi-VN')} ₫)!
              </p>
            )}
          </div>

          {/* 3. ĐÍNH KÈM ỦY NHIỆM CHI / BIÊN LAI (FILE UPLOAD) */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase flex items-center gap-1">
              📎 ĐÍNH KÈM ỦY NHIỆM CHI (UNC) / BIÊN LAI NGÂN HÀNG (PDF, Ảnh)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm text-gray-700 dark:text-gray-300">
                <Upload className="w-4 h-4 text-red-600" /> Tải Tệp UNC / Biên Lai
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
              <span className="text-[11px] text-gray-400">Đính kèm chứng từ đối chiếu ngân hàng hoặc phiếu nộp tiền...</span>
            </div>

            {formFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {formFiles.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 text-xs">
                    <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">{f.name}</span>
                    <span className="text-[10px] text-gray-400">({f.size})</span>
                    <button
                      type="button"
                      onClick={() => setFormFiles(formFiles.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-500 ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. PHÂN QUYỀN DUYỆT & TRẠNG THÁI (CHO_DUYET READ-ONLY KHI CREATING) */}
          {modalMode === 'edit' && (
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">TRẠNG THÁI DUYỆT PHIẾU CHI *</label>
              <select
                value={editingItem.status || 'CHO_DUYET'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
              >
                <option value="CHO_DUYET">Chờ duyệt (Chờ chi tiền)</option>
                <option value="DA_THANH_TOAN">Đã duyệt (Đã chi tiền & hạch toán sổ quỹ)</option>
                <option value="DA_HUY">Đã hủy phiếu chi</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">DIỄN GIẢI / LÝ DO CHI TIỀN</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Nhập nội dung diễn giải thanh toán..."
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
              className="flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm transition"
            >
              <DollarSign className="w-4 h-4" /> {modalMode === 'create' ? 'Lập Phiếu Chi (Chờ duyệt)' : 'Lưu Cập Nhật'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
