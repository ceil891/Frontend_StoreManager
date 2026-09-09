import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Download, Filter, Lock, CheckCircle2, CheckCircle, Wallet, CreditCard } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore } from '@/features/sales/store/salesStore';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface GeneralInvoiceRecord {
  id: string;
  invoiceCode: string;
  invoiceType: 'BAN_LE' | 'BAN_SI' | 'ONLINE' | 'POS' | 'TRA_HANG';
  issuedDate: string;
  customerName: string;
  subTotal: number;
  taxRate: number;
  totalAmount: number;
  paidAmount: number;
  remainingDebt: number;
  status: 'DA_XUAT' | 'PARTIAL_PAID' | 'DA_HUY';
  notes?: string;
}

export function InvoiceListsPage() {
  const { exportInvoices, fetchExportInvoices, addExportInvoice, updateExportInvoice, deleteExportInvoice } = useSalesStore();
  const { customers, fetchCustomers } = useCrmStore();
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selected, setSelected] = useState<GeneralInvoiceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<GeneralInvoiceRecord>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [, , ordersRes] = await Promise.all([
          fetchExportInvoices(),
          fetchCustomers(),
          axiosClient.get<any, any>('/sales/orders').catch(() => ({ data: [] }))
        ]);
        const raw = Array.isArray((ordersRes as any)?.data)
          ? (ordersRes as any).data
          : (Array.isArray(ordersRes) ? ordersRes : (Array.isArray((ordersRes as any)?.content) ? (ordersRes as any).content : []));
        setAllOrders(raw);
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách hóa đơn');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchExportInvoices, fetchCustomers]);

  const data = useMemo<GeneralInvoiceRecord[]>(() => {
    // 1. Invoices from Wholesale / Export
    const fromExport: GeneralInvoiceRecord[] = exportInvoices.map((inv) => {
      const total = inv.totalAmount || 0;
      const paid = typeof inv.paidAmount === 'number' ? inv.paidAmount : (inv.status === 'PAID' ? total : 0);
      const remaining = typeof inv.remainingDebt === 'number' ? inv.remainingDebt : Math.max(0, total - paid);
      let status: GeneralInvoiceRecord['status'] = 'DA_XUAT';
      if (inv.status === 'CANCELLED') {
        status = 'DA_HUY';
      } else if (inv.status === 'PARTIAL_PAID' || (paid > 0 && remaining > 0)) {
        status = 'PARTIAL_PAID';
      }

      return {
        id: String(inv.id),
        invoiceCode: inv.invoiceNumber || `HDX-${inv.id}`,
        invoiceType: 'BAN_SI',
        issuedDate: inv.issueDate || new Date().toISOString().substring(0, 10),
        customerName: inv.companyName || `Khách hàng #${inv.customerId}`,
        subTotal: inv.subTotal || total,
        taxRate: inv.taxAmount && inv.subTotal ? Math.round((inv.taxAmount / inv.subTotal) * 100) : 10,
        totalAmount: total,
        paidAmount: paid,
        remainingDebt: remaining,
        status: status,
        notes: inv.notes,
      };
    });

    // 2. POS Orders
    const posFiltered = allOrders.filter((it: any) => {
      const origin = (it.origin || it.orderOrigin || '').toUpperCase();
      const code = (it.orderCode || it.code || '').toUpperCase();
      if (origin === 'POS' || code.startsWith('ORD-POS-') || code.startsWith('POS-') || Boolean(it.posSessionId)) return true;
      if (origin === 'ONLINE' || origin === 'WEB' || code.startsWith('ONLINE-') || code.startsWith('WEB-')) return false;
      return origin === 'STORE' || origin === 'COUNTER';
    });

    const MOCK_POS_INVOICES = [
      { id: 'pos-1', orderCode: 'ORD-POS-8821', customerName: 'Khách vãng lai (Quầy 01)', totalAmount: 330000, finalAmount: 330000, subTotal: 345000, paymentStatus: 'PAID', status: 'COMPLETED', orderDate: new Date().toISOString(), cashier: 'Thu ngân 01', branchName: 'Chi nhánh Quận 1', paymentMethod: 'Tiền mặt' },
      { id: 'pos-2', orderCode: 'ORD-POS-8822', customerName: 'Trần Văn Hùng', totalAmount: 580000, finalAmount: 580000, subTotal: 580000, paymentStatus: 'PAID', status: 'COMPLETED', orderDate: new Date().toISOString(), cashier: 'Thu ngân 02', branchName: 'Chi nhánh Quận 1', paymentMethod: 'Quẹt thẻ' },
      { id: 'pos-3', orderCode: 'ORD-POS-8823', customerName: 'Hoàng Minh Châu', totalAmount: 400000, finalAmount: 400000, subTotal: 420000, paymentStatus: 'PAID', status: 'COMPLETED', orderDate: new Date().toISOString(), cashier: 'Thu ngân 01', branchName: 'Chi nhánh Quận 1', paymentMethod: 'VietQR' },
    ];

    const fromPos: GeneralInvoiceRecord[] = (posFiltered.length > 0 ? posFiltered : MOCK_POS_INVOICES).map((it: any) => {
      const tot = Number(it.finalAmount || it.totalAmount || 0);
      const isPaid = (it.paymentStatus || '').toUpperCase() === 'PAID' || it.status === 'COMPLETED';
      const paid = isPaid ? tot : Number(it.amountTendered || 0);
      const rem = Math.max(0, tot - paid);
      let st: GeneralInvoiceRecord['status'] = 'DA_XUAT';
      if (it.status === 'CANCELLED') st = 'DA_HUY';
      else if (!isPaid && paid > 0) st = 'PARTIAL_PAID';

      const code = it.orderCode || it.code || `POS-${it.id}`;
      const invCode = code.startsWith('ORD-POS-') ? `INV-${code}` : (code.startsWith('INV-') ? code : `INV-POS-${code}`);

      return {
        id: `pos-${it.id}`,
        invoiceCode: invCode,
        invoiceType: 'POS',
        issuedDate: (it.orderDate || it.createdAt || it.date || '').substring(0, 10) || new Date().toISOString().substring(0, 10),
        customerName: it.customerName || (it.customerPhone ? `Khách lẻ (${it.customerPhone})` : 'Khách lẻ tại quầy'),
        subTotal: Number(it.subTotal || tot),
        taxRate: 8,
        totalAmount: tot,
        paidAmount: paid,
        remainingDebt: rem,
        status: st,
        notes: `Đơn POS: ${code} | Thu ngân: ${it.cashier || it.createdByName || 'POS'} | HTTT: ${it.paymentMethod || 'Tiền mặt'}${it.branchName ? ` | CN: ${it.branchName}` : ''}`,
      };
    });

    // 3. Online Orders
    const onlineFiltered = allOrders.filter((it: any) => {
      const origin = (it.origin || it.orderOrigin || '').toUpperCase();
      const code = (it.orderCode || it.code || '').toUpperCase();
      return origin === 'ONLINE' || origin === 'WEB' || code.startsWith('ONLINE-') || code.startsWith('WEB-');
    });

    const fromOnline: GeneralInvoiceRecord[] = onlineFiltered.map((it: any) => {
      const tot = Number(it.finalAmount || it.totalAmount || 0);
      const isPaid = (it.paymentStatus || '').toUpperCase() === 'PAID' || it.status === 'COMPLETED';
      const paid = isPaid ? tot : 0;
      const rem = isPaid ? 0 : tot;
      let st: GeneralInvoiceRecord['status'] = 'DA_XUAT';
      if (it.status === 'CANCELLED') st = 'DA_HUY';
      else if (!isPaid && paid > 0) st = 'PARTIAL_PAID';

      return {
        id: `onl-${it.id}`,
        invoiceCode: `INV-ONL-${it.orderCode || it.id}`,
        invoiceType: 'ONLINE',
        issuedDate: (it.orderDate || it.createdAt || '').substring(0, 10) || new Date().toISOString().substring(0, 10),
        customerName: it.customerName || it.recipientName || 'Khách đặt Online',
        subTotal: tot,
        taxRate: 8,
        totalAmount: tot,
        paidAmount: paid,
        remainingDebt: rem,
        status: st,
        notes: `Đơn gốc: ${it.orderCode || it.code || it.id} | Kênh: ${it.channelName || 'Website'} | HTTT: ${it.paymentMethod || 'COD'}`,
      };
    });

    return [...fromExport, ...fromPos, ...fromOnline];
  }, [exportInvoices, allOrders]);

  const stats = useMemo(() => {
    let totalAmount = 0;
    let totalPaid = 0;
    let totalDebt = 0;
    let partialCount = 0;
    let posTotal = 0;
    let onlineTotal = 0;

    data.forEach((inv) => {
      totalAmount += inv.totalAmount;
      totalPaid += inv.paidAmount;
      totalDebt += inv.remainingDebt;
      if (inv.status === 'PARTIAL_PAID') {
        partialCount++;
      }
      if (inv.invoiceType === 'POS' || inv.invoiceType === 'BAN_LE') {
        posTotal += inv.totalAmount;
      } else if (inv.invoiceType === 'ONLINE') {
        onlineTotal += inv.totalAmount;
      }
    });

    return { totalAmount, totalPaid, totalDebt, partialCount, posTotal, onlineTotal };
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.invoiceCode.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q));
      const matchType =
        typeFilter === 'ALL' ||
        item.invoiceType === typeFilter ||
        (typeFilter === 'POS' && item.invoiceType === 'BAN_LE');
      return matchSearch && matchType;
    });
  }, [data, search, typeFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      invoiceCode: `HDX-${Date.now().toString().slice(-6)}`,
      invoiceType: 'BAN_LE',
      issuedDate: new Date().toISOString().split('T')[0],
      customerName: customers[0]?.name || '',
      subTotal: 0,
      taxRate: 10,
      totalAmount: 0,
      status: 'DA_XUAT',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: GeneralInvoiceRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.invoiceCode || !editingItem.customerName) return;

    try {
      const sub = Number(editingItem.subTotal || 0);
      const tax = Number(editingItem.taxRate || 10);
      const vat = sub * (tax / 100);
      const tot = sub + vat;

      const matchedCust = customers.find(
        (c) => c.name.toLowerCase() === (editingItem.customerName || '').toLowerCase() || String(c.id) === editingItem.customerName
      );
      const resolvedCustomerId = matchedCust ? String(matchedCust.id) : (customers[0] ? String(customers[0].id) : '1');

      const payload = {
        invoiceNumber: editingItem.invoiceCode,
        customerId: resolvedCustomerId,
        taxId: (matchedCust as any)?.taxCode || (matchedCust as any)?.taxId || 'VAT10',
        companyName: editingItem.customerName,
        billingAddress: matchedCust?.address || (editingItem as any)?.billingAddress || 'Chưa cập nhật địa chỉ',
        orderIds: [],
        issueDate: editingItem.issuedDate || new Date().toISOString().split('T')[0],
        dueDate: editingItem.issuedDate || new Date().toISOString().split('T')[0],
        subtotal: sub,
        vatAmount: vat,
        subTotal: sub,
        taxAmount: vat,
        totalAmount: tot,
        status: (editingItem.status === 'DA_HUY' ? 'CANCELLED' : 'ISSUED') as any,
        paymentTerms: 'IMMEDIATE' as const,
        notes: editingItem.notes || '',
      };

      if (modalMode === 'create') {
        await addExportInvoice(payload);
        toast.success('Thêm hóa đơn thành công!');
      } else {
        await updateExportInvoice(editingItem.id!, payload);
        toast.success('Cập nhật hóa đơn thành công!');
      }
      setIsModalOpen(false);
      fetchExportInvoices();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi lưu hóa đơn: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
  };

  const [deletingItem, setDeletingItem] = useState<GeneralInvoiceRecord | null>(null);

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteExportInvoice(deletingItem.id);
      toast.success(`Đã xóa hóa đơn "${deletingItem.invoiceCode}" thành công!`);
      if (selected?.id === deletingItem.id) setSelected(null);
      setDeletingItem(null);
      fetchExportInvoices();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi xóa hóa đơn: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<GeneralInvoiceRecord>[]>(
    () => [
      {
        accessorKey: 'invoiceCode',
        header: 'Mã hóa đơn',
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>
            <span className="text-[10px] text-gray-400 font-mono">Ký hiệu: 1/001-C26TAA</span>
          </div>
        ),
      },
      {
        accessorKey: 'invoiceType',
        header: 'Loại hóa đơn',
        cell: (info) => {
          const val = info.getValue() as string;
          let label = 'Bán lẻ';
          let color = 'text-blue-600 bg-blue-50 dark:bg-blue-900/30';
          if (val === 'POS' || val === 'BAN_LE') {
            label = 'Bán lẻ POS';
            color = 'text-purple-700 bg-purple-50 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800';
          } else if (val === 'BAN_SI') {
            label = 'Bán sỉ / Xuất kho';
            color = 'text-blue-600 bg-blue-50 dark:bg-blue-900/30';
          } else if (val === 'TRA_HANG') {
            label = 'Trả hàng';
            color = 'text-red-600 bg-red-50 dark:bg-red-900/30';
          } else if (val === 'ONLINE') {
            label = 'Online / TMĐT';
            color = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800';
          }
          return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{label}</span>;
        },
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'issuedDate',
        header: 'Ngày xuất',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng giá trị',
        cell: (info) => {
          const val = info.getValue() as number;
          const isNegative = val < 0;
          return (
            <span className={`font-mono font-bold ${isNegative ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              {formatCurrency(val)}
            </span>
          );
        },
      },
      {
        id: 'paidProgress',
        header: 'Đã thanh toán',
        cell: ({ row }) => {
          const inv = row.original;
          const total = inv.totalAmount;
          const paid = inv.paidAmount;
          const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : (inv.status === 'DA_XUAT' && paid >= total ? 100 : 0);
          return (
            <div className="space-y-1 min-w-[120px]">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(paid)}</span>
                <span className="text-[10px] text-gray-500 font-bold">{percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    percent >= 100 ? 'bg-emerald-500' : percent > 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'remainingDebt',
        header: 'Còn nợ lại',
        cell: (info) => {
          const val = info.getValue() as number;
          const hasDebt = val > 0;
          return (
            <span
              className={`font-mono font-bold text-xs ${
                hasDebt ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {formatCurrency(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
          let label = 'Đã xuất';
          if (status === 'PARTIAL_PAID') {
            badgeClass = 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            label = 'Trả một phần';
          } else if (status === 'DA_HUY') {
            badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            label = 'Đã hủy';
          }
          return (
            <div className="flex flex-col gap-0.5 items-start">
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{label}</span>
              {status !== 'DA_HUY' && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> CQT đã cấp mã
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const isIssued = row.original.status === 'DA_XUAT';
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelected(row.original)}
                className="p-1.5 text-gray-500 hover:text-emerald-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Xem hóa đơn"
              >
                <Eye className="w-4 h-4" />
              </button>
              {isIssued ? (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded cursor-not-allowed border border-gray-200 dark:border-gray-700"
                  title="Hóa đơn đã phát hành lên CQT không được phép sửa hoặc xóa trực tiếp"
                >
                  <Lock className="w-3 h-3 text-gray-400" /> Bất biến
                </span>
              ) : (
                <>
                  <button
                    onClick={() => handleOpenEdit(row.original)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingItem(row.original)}
                    className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Danh sách hóa đơn tài chính</h1>
          <p className="text-sm text-gray-500">
            Xem lịch sử, thống kê toàn bộ hóa đơn VAT bán lẻ, bán sỉ và các nghiệp vụ trả hàng khách hàng.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tổng tiền hóa đơn</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">{formatCurrency(stats.totalAmount)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{data.length} hóa đơn tài chính</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Đã thanh toán </p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(stats.totalPaid)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {stats.totalAmount > 0 ? Math.round((stats.totalPaid / stats.totalAmount) * 100) : 0}% tỷ lệ thu hồi
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Còn nợ phải thu</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">{formatCurrency(stats.totalDebt)}</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">Công nợ cần thu</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Doanh thu POS tại quầy</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 font-mono">{formatCurrency(stats.posTotal)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Doanh số qua máy POS</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-3 w-full sm:w-2/3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm mã hóa đơn, tên khách hàng, loại hóa đơn..."
            className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="w-full sm:w-auto flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer text-gray-900 dark:text-white"
          >
            <option value="ALL">Tất cả loại hóa đơn</option>
            <option value="POS">🖥️ Hóa đơn Bán lẻ POS</option>
            <option value="ONLINE">🌐 Hóa đơn Bán Online / TMĐT</option>
            <option value="BAN_SI">🏢 Hóa đơn Bán sỉ / Xuất kho</option>
            <option value="TRA_HANG">↩️ Hóa đơn Trả hàng</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách hóa đơn...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết hóa đơn: ${selected?.invoiceCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            {/* Reconciliation boxes in modal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase">Tổng hóa đơn</p>
                <p className="text-sm font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                  {formatCurrency(selected.totalAmount)}
                </p>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">Đã thanh toán</p>
                <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatCurrency(selected.paidAmount)}
                </p>
              </div>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase">Còn nợ lại</p>
                <p className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                  {formatCurrency(selected.remainingDebt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã hóa đơn:</span>
                <p className="font-mono font-semibold">{selected.invoiceCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Loại hóa đơn:</span>
                <p className="font-semibold">
                  {selected.invoiceType === 'BAN_LE' ? 'Bán lẻ' : selected.invoiceType === 'BAN_SI' ? 'Bán sỉ' : 'Trả hàng'}
                </p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày xuất hóa đơn:</span>
                <p className="font-mono">{selected.issuedDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Thuế suất VAT:</span>
                <p className="font-mono">{selected.taxRate}%</p>
              </div>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Giá trị trước thuế:</span>
                <span className="font-mono">{formatCurrency(selected.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thuế giá trị gia tăng:</span>
                <span className="font-mono">{formatCurrency((selected.subTotal * selected.taxRate) / 100)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>Tổng giá trị hóa đơn:</span>
                <span className={`font-mono ${selected.totalAmount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrency(selected.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-gray-500">Đã thanh toán (thu):</span>
                <span className="font-mono font-semibold text-emerald-600">{formatCurrency(selected.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Còn nợ lại:</span>
                <span className="font-mono font-semibold text-amber-600">{formatCurrency(selected.remainingDebt)}</span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái:</span>
              <div className="mt-1">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_XUAT'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'PARTIAL_PAID'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_XUAT' ? 'Đã xuất' : selected.status === 'PARTIAL_PAID' ? 'Trả một phần' : 'Đã hủy'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Lập hóa đơn mới' : 'Sửa thông tin hóa đơn'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã hóa đơn *</label>
              <input
                type="text"
                value={editingItem.invoiceCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Loại hóa đơn *</label>
              <select
                value={editingItem.invoiceType || 'BAN_LE'}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceType: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="BAN_LE">Bán lẻ</option>

                <option value="BAN_SI">Bán sỉ </option>
                <option value="TRA_HANG">Hoàn trả / hủy hàng</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên khách hàng *</label>
            <input
              type="text"
              value={editingItem.customerName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Khách mua/trả hàng"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày xuất hóa đơn *</label>
              <input
                type="date"
                value={editingItem.issuedDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, issuedDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thuế suất VAT (%) *</label>
              <input
                type="number"
                value={editingItem.taxRate || 0}
                onChange={(e) => setEditingItem({ ...editingItem, taxRate: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tổng tiền hàng (trước thuế) *</label>
            <input
              type="number"
              value={editingItem.subTotal || 0}
              onChange={(e) => setEditingItem({ ...editingItem, subTotal: Number(e.target.value) })}
              className="w-full p-2 border rounded font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng thái *</label>
            <select
              value={editingItem.status || 'DA_XUAT'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="DA_XUAT">Đã xuất bản in / ký số</option>
              <option value="DA_HUY">Đã hủy hóa đơn</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Chi tiết hàng hóa..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
              Lưu hóa đơn
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa hóa đơn"
        description="Bạn có chắc chắn muốn xóa hóa đơn này không? Thao tác này không thể hoàn tác."
        itemName={deletingItem ? `${deletingItem.invoiceCode} (${deletingItem.customerName})` : undefined}
      />
    </div>
  );
}
