import { useState, useMemo, useEffect } from 'react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Plus, Download, Search, Filter, Eye, FileText, User, Calendar,
  CheckCircle2, Edit, Trash2, ArrowRight, ShieldCheck, Truck, CreditCard, Clock, FileDown, Send
} from 'lucide-react';
import { useSalesStore, type QuoteItem, formatMoney } from '../store/salesStore';
import { resolveCustomerName } from '../store/salesHelpers';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { usePermission } from '@/shared/hooks/usePermission';
import { OrderLinesEditor, sumOrderLines } from '@/shared/components/sales/OrderLinesEditor';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { CreateButton, SecondaryButton } from '@/shared/components/ui/Button';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import { salesService } from '../services/salesService';
import { toast } from 'sonner';

export function QuotesPage() {
  const { quotes: data, addQuote, updateQuote, deleteQuote, fetchQuotes } = useSalesStore();
  const customers = useCrmStore((s) => s.customers);
  const fetchCustomers = useCrmStore((s) => s.fetchCustomers);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchQuotes(), fetchCustomers()]);
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách báo giá');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchQuotes, fetchCustomers]);

  const canManage = usePermission('sales:quotes:manage');
  const [search, setSearch] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<QuoteItem | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingQuote, setEditingQuote] = useState<Partial<QuoteItem>>({});
  const [deletingQuote, setDeletingQuote] = useState<QuoteItem | null>(null);
  const [sendingQuote, setSendingQuote] = useState<QuoteItem | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'items' | 'pricing' | 'terms' | 'attachments'>('info');

  const filtered = data.filter((item) =>
    resolveCustomerName(item.customerId, customers).toLowerCase().includes(search.toLowerCase()) ||
    item.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setActiveTab('info');
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    setEditingQuote({
      code: `QT-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: '',
      issueDate: new Date().toISOString().split('T')[0],
      revision: 1,
      currency: 'VND',
      paymentTerms: 'Chuyển khoản / COD trong 30 ngày',
      deliveryTerms: 'Giao hàng tận nơi trong vòng 48h từ khi xác nhận đơn hàng',
      warrantyTerms: 'Bảo hành chính hãng 12 tháng theo tiêu chuẩn nhà sản xuất',
      validityTerms: 'Báo giá có hiệu lực trong vòng 30 ngày kể từ ngày lập',
      shippingAddress: '',
      subTotal: 0,
      discountType: 'AMOUNT',
      discountValue: 0,
      discountAmount: 0,
      shippingFee: 0,
      taxRate: 10,
      taxAmount: 0,
      totalAmount: 0,
      validUntil: nextMonth.toISOString().split('T')[0],
      status: 'DRAFT',
      salesRep: 'Nguyễn Văn A (Sales)',
      warehouseName: 'Kho Tổng (Hồ Chí Minh)',
      itemsCount: 0,
      orderLines: [],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const calculateQuoteTotals = (quote: Partial<QuoteItem>) => {
    const lines = quote.orderLines ?? [];
    const subTotal = sumOrderLines(lines);
    
    let discountAmount = 0;
    if (quote.discountType === 'PERCENT' && quote.discountValue) {
      discountAmount = (subTotal * quote.discountValue) / 100;
    } else if (quote.discountValue) {
      discountAmount = Number(quote.discountValue);
    } else if (quote.discountAmount) {
      discountAmount = Number(quote.discountAmount);
    }

    const shippingFee = Number(quote.shippingFee) || 0;

    let taxAmount = Number(quote.taxAmount) || 0;
    if (quote.taxRate && quote.taxRate > 0) {
      const taxable = Math.max(0, subTotal - discountAmount);
      taxAmount = (taxable * quote.taxRate) / 100;
    }

    // Formula: total = subTotal - discount + shippingFee + tax
    const totalAmount = Math.max(0, subTotal - discountAmount + shippingFee + taxAmount);

    return {
      subTotal,
      discountAmount,
      shippingFee,
      taxAmount,
      totalAmount,
      itemsCount: lines.length,
    };
  };

  const applyOrderLines = (lines: NonNullable<QuoteItem['orderLines']>) => {
    const updated = { ...editingQuote, orderLines: lines };
    const totals = calculateQuoteTotals(updated);
    setEditingQuote({
      ...updated,
      ...totals,
    });
  };

  const handleOpenEdit = (quote: QuoteItem) => {
    setModalMode('edit');
    setActiveTab('info');
    setEditingQuote(quote);
    setIsModalOpen(true);
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote.customerId || !editingQuote.code) {
      toast.error('Vui lòng điền đầy đủ Mã báo giá và Khách hàng');
      return;
    }

    const totals = calculateQuoteTotals(editingQuote);
    const payloadQuote = {
      ...editingQuote,
      ...totals,
    };

    try {
      if (modalMode === 'create') {
        await addQuote(payloadQuote as any);
        toast.success('Tạo báo giá thành công!');
      } else if (editingQuote.id) {
        await updateQuote(editingQuote.id, payloadQuote);
        toast.success('Cập nhật báo giá thành công (Tự động tăng Revision)!');
      }
      setIsModalOpen(false);
      fetchQuotes();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu báo giá.');
    }
  };

  const handleConvertToOrder = async (quote: QuoteItem) => {
    try {
      await salesService.convertQuoteToOrder(quote.id);
      toast.success(`Đã chuyển báo giá ${quote.code} thành Đơn Bán Hàng thành công!`);
      setSelectedQuote(null);
      fetchQuotes();
    } catch (err) {
      console.error(err);
      toast.error('Không thể chuyển báo giá thành đơn bán hàng.');
    }
  };

  const handleDownloadPdf = async (quoteId: string) => {
    try {
      toast.info('Đang khởi tạo tài liệu PDF báo giá...');
      await salesService.downloadQuotePdf(quoteId);
      toast.success('Tải PDF báo giá thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải PDF báo giá');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingQuote) return;
    try {
      await deleteQuote(deletingQuote.id);
      toast.success('Đã xóa báo giá!');
      setDeletingQuote(null);
      fetchQuotes();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa báo giá.');
    }
  };

  const handleMarkAsSent = (quote: QuoteItem) => {
    setSendingQuote(quote);
  };

  const handleConfirmSend = async () => {
    if (!sendingQuote) return;
    try {
      await updateQuote(sendingQuote.id, { ...sendingQuote, status: 'SENT' });
      toast.success(`Đã gửi Báo giá ${sendingQuote.code} cho khách hàng thành công!`);
      if (selectedQuote?.id === sendingQuote.id) {
        setSelectedQuote({ ...selectedQuote, status: 'SENT' });
      }
    } catch (err) {
      console.error('Lỗi khi gửi báo giá:', err);
      toast.error('Không thể gửi Báo giá. Vui lòng thử lại!');
    } finally {
      setSendingQuote(null);
    }
  };

  const loadStandardTermsTemplate = () => {
    setEditingQuote((prev) => ({
      ...prev,
      paymentTerms: 'Đặt cọc 30% khi ký hợp đồng, 70% thanh toán trước khi giao hàng hoặc COD.',
      deliveryTerms: 'Giao hàng kho bên Mua. Phí vận chuyển tiêu chuẩn hỗ trợ 50% cho đơn vị trên 20 triệu.',
      warrantyTerms: 'Bảo hành 12 tháng tận nơi đối với lỗi sản xuất. Đổi trả trong 7 ngày nếu chưa bóc nhãn.',
      validityTerms: 'Báo giá có giá trị trong vòng 15 ngày tính từ ngày ban hành.',
    }));
    toast.success('Đã áp dụng mẫu điều khoản tiêu chuẩn');
  };

  const columns = useMemo<ColumnDef<QuoteItem>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Mã báo giá',
        cell: (info) => (
          <div>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
              Rev {info.row.original.revision}
            </span>
          </div>
        ),
      },
      {
        id: 'customer',
        header: 'Khách hàng / Đối tác',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white truncate max-w-xs">
              {resolveCustomerName(row.original.customerId, customers)}
            </p>
            {row.original.salesRep && (
              <p className="text-xs text-gray-400">Sale: {row.original.salesRep}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng thanh toán',
        cell: ({ row }) => (
          <div>
            <span className="font-extrabold text-gray-900 dark:text-white">
              {formatMoney(row.original.totalAmount, row.original.currency || 'VND')}
            </span>
            {row.original.shippingFee ? (
              <p className="text-[10px] text-gray-400">Ship: +{formatMoney(row.original.shippingFee, row.original.currency || 'VND')}</p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'validUntil',
        header: 'Hiệu lực đến',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, { label: string; cls: string }> = {
            DRAFT: { label: 'Nháp', cls: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
            SENT: { label: 'Đã gửi', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
            ACCEPTED: { label: 'Đã chấp nhận', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
            REJECTED: { label: 'Từ chối', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' },
            EXPIRED: { label: 'Hết hạn', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
            CANCELLED: { label: 'Đã hủy', cls: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400' },
          };
          const conf = statusMap[status] || { label: status, cls: 'bg-gray-100 text-gray-800' };

          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${conf.cls}`}>
              {conf.label}
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
              onClick={(e) => { e.stopPropagation(); setSelectedQuote(row.original); }}
              title="Xem chi tiết báo giá"
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleMarkAsSent(row.original); }}
              title="Gửi báo giá cho khách hàng"
              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDownloadPdf(row.original.id); }}
              title="Tải PDF báo giá"
              className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors shrink-0"
            >
              <FileDown className="w-4 h-4" />
            </button>
            {canManage && (
              <button
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
                title="Chỉnh sửa (Tăng Revision)"
                className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors shrink-0"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canManage && (
              <button
                onClick={(e) => { e.stopPropagation(); setDeletingQuote(row.original); }}
                title="Xóa"
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [canManage, customers]
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Báo giá bán hàng</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý báo giá chuyên nghiệp, tự động quản lý phiên bản, chọn mẫu sản phẩm và chuyển đổi thành đơn bán hàng.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SecondaryButton
              leftIcon={<Download className="w-4 h-4" />}
            >
              Xuất danh sách
            </SecondaryButton>
            {canManage && (
              <CreateButton onClick={handleOpenCreate}>
                Tạo báo giá mới
              </CreateButton>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Tìm kiếm mã báo giá, tên khách hàng..."
            containerClassName="flex-1 w-full"
          />
          <SecondaryButton leftIcon={<Filter className="w-4 h-4" />}>
            Bộ lọc
          </SecondaryButton>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-gray-500">Đang tải danh sách báo giá...</span>
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedQuote(row)} />
        )}
      </div>

      {/* Drawer / Detail View Modal */}
      <Modal
        isOpen={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
        title={selectedQuote ? `Chi tiết báo giá: ${selectedQuote.code} (Rev ${selectedQuote.revision})` : 'Chi tiết báo giá'}
        width="max-w-3xl"
      >
        {selectedQuote && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider">TỔNG THANH TOÁN BÁO GIÁ</p>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {formatMoney(selectedQuote.totalAmount, selectedQuote.currency || 'VND')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white dark:bg-gray-800 text-xs font-mono font-bold rounded-lg border border-emerald-300 dark:border-emerald-700">
                  Revision {selectedQuote.revision}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedQuote.status === 'ACCEPTED' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                  selectedQuote.status === 'SENT' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                  selectedQuote.status === 'DRAFT' ? 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100' :
                  selectedQuote.status === 'REJECTED' ? 'bg-rose-200 text-rose-900 dark:bg-rose-800 dark:text-rose-100' :
                  'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
                }`}>
                  {selectedQuote.status === 'ACCEPTED' ? 'Đã chấp nhận' : selectedQuote.status === 'SENT' ? 'Đã gửi' : selectedQuote.status === 'DRAFT' ? 'Nháp' : selectedQuote.status === 'REJECTED' ? 'Từ chối' : 'Hết hạn'}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Khách hàng nhận báo giá
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {resolveCustomerName(selectedQuote.customerId, customers)}
                </p>
                {selectedQuote.shippingAddress && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-gray-400" /> {selectedQuote.shippingAddress}
                  </p>
                )}
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 text-amber-500" /> Ngày lập & Thời hạn
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedQuote.issueDate} &rarr; Hạn: {selectedQuote.validUntil}
                </p>
                <p className="text-xs text-gray-500">Sale phụ trách: <strong>{selectedQuote.salesRep}</strong></p>
              </div>
            </div>

            {/* Order Items breakdown */}
            <div className="space-y-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Danh mục Variant báo giá ({selectedQuote.orderLines?.length || selectedQuote.itemsCount} dòng)</h4>
              <div className="divide-y divide-gray-200 dark:divide-gray-800 max-h-48 overflow-y-auto">
                {(selectedQuote.orderLines || []).map((line, idx) => (
                  <div key={line.id || idx} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">{line.productName}</span>
                      <span className="ml-2 font-mono text-[10px] text-gray-400">SKU: {line.sku || 'N/A'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{line.quantity} {line.unit || 'Cái'} × {formatMoney(line.unitPrice, selectedQuote.currency || 'VND')}</span>
                      <span className="block font-extrabold text-emerald-600">{formatMoney(line.lineTotal || line.quantity * line.unitPrice, selectedQuote.currency || 'VND')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Summary Breakdown */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tiền hàng (SubTotal):</span>
                <span className="font-bold">{formatMoney(selectedQuote.subTotal, selectedQuote.currency || 'VND')}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Giảm giá toàn báo giá:</span>
                <span className="font-bold text-rose-600">-{formatMoney(selectedQuote.discountAmount, selectedQuote.currency || 'VND')}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Phí vận chuyển:</span>
                <span className="font-bold">+{formatMoney(selectedQuote.shippingFee || 0, selectedQuote.currency || 'VND')}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Thuế VAT:</span>
                <span className="font-bold">+{formatMoney(selectedQuote.taxAmount, selectedQuote.currency || 'VND')}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-gray-900 dark:text-white pt-2 border-t border-emerald-200 dark:border-emerald-800">
                <span>TỔNG THANH TOÁN:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(selectedQuote.totalAmount, selectedQuote.currency || 'VND')}</span>
              </div>
            </div>

            {/* Terms Summary */}
            {(selectedQuote.paymentTerms || selectedQuote.deliveryTerms || selectedQuote.warrantyTerms) && (
              <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2 text-xs">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase">Điều khoản báo giá</h4>
                {selectedQuote.paymentTerms && <p className="text-gray-600 dark:text-gray-400"><strong>Thanh toán:</strong> {selectedQuote.paymentTerms}</p>}
                {selectedQuote.deliveryTerms && <p className="text-gray-600 dark:text-gray-400"><strong>Giao hàng:</strong> {selectedQuote.deliveryTerms}</p>}
                {selectedQuote.warrantyTerms && <p className="text-gray-600 dark:text-gray-400"><strong>Bảo hành:</strong> {selectedQuote.warrantyTerms}</p>}
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-3">
              {selectedQuote.status === 'ACCEPTED' && (
                <button
                  type="button"
                  onClick={() => handleConvertToOrder(selectedQuote)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition-all text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Tạo đơn hàng từ báo giá
                </button>
              )}
              <button
                type="button"
                onClick={() => handleMarkAsSent(selectedQuote)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition-all text-sm"
              >
                <Send className="w-4 h-4" /> Gửi báo giá cho khách hàng
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedQuote.id)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl border border-gray-300 dark:border-gray-700 transition-all text-sm"
              >
                <FileDown className="w-4 h-4" /> Tải PDF Báo Giá
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Form Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '📋 Tạo báo giá bán hàng mới' : `⚙️ Chỉnh Sửa Báo Giá (Sẽ tự động tăng Revision lên v${(editingQuote.revision || 1) + 1})`}
        width="max-w-4xl"
      >
        <form onSubmit={handleSaveQuote} className="space-y-4">
          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'info' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              1. Thông Tin Chung
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'items' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              2. Chi Tiết Sản Phẩm (Variants)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pricing')}
              className={`px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'pricing' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              3. Thanh Toán & Chiết Khấu
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'terms' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              4. Điều Khoản & Ghi Chú
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              className={`px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'attachments' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              5. Tài Liệu & PDF
            </button>
          </div>

          {/* TAB 1: THÔNG TIN CHUNG */}
          {activeTab === 'info' && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Mã báo giá *</label>
                  <input
                    type="text"
                    value={editingQuote.code || ''}
                    onChange={(e) => setEditingQuote({ ...editingQuote, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Revision (Phiên bản tự động)</label>
                  <input
                    type="text"
                    readOnly
                    value={modalMode === 'create' ? 'Revision 1 (Ban đầu)' : `v${(editingQuote.revision || 1) + 1} (Tự động tăng khi lưu sửa)`}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-mono font-bold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Tiền tệ</label>
                  <select
                    value={editingQuote.currency || 'VND'}
                    onChange={(e) => setEditingQuote({ ...editingQuote, currency: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-bold"
                  >
                    <option value="VND">VND (Việt Nam Đồng)</option>
                    <option value="USD">USD (Đô la Mỹ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Khách hàng nhận báo giá (CRM) *</label>
                  <SearchLookupModal
                    title="Chọn Khách Hàng Báo Giá"
                    iconType="user"
                    placeholder="Chọn khách hàng..."
                    value={editingQuote.customerId}
                    options={customers.length > 0 ? customers.map(c => ({
                      id: String(c.id),
                      code: (c as any).code || (c as any).customerCode || `CUST-${c.id}`,
                      name: (c as any).fullName || (c as any).name || 'Khách hàng',
                      subtitle: `SĐT: ${(c as any).phone || 'N/A'}`
                    })) : [
                      { id: 'CUST-001', code: 'CUST-001', name: 'Nguyễn Văn An', subtitle: 'SĐT: 0901234567 - VIP Gold' },
                      { id: 'CUST-002', code: 'CUST-002', name: 'Công ty TNHH Minh Phát', subtitle: 'MST: 0312456789 - Khách DN' },
                    ]}
                    onChange={(val) => {
                      const found = customers.find(c => String(c.id) === String(val) || (c as any).customerCode === val || c.id === val);
                      setEditingQuote(prev => ({
                        ...prev,
                        customerId: val,
                        customerName: found ? found.name : prev.customerName,
                        shippingAddress: (found && found.address) ? found.address : prev.shippingAddress,
                      }));
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Địa chỉ giao hàng</label>
                  <input
                    type="text"
                    value={editingQuote.shippingAddress || ''}
                    onChange={(e) => setEditingQuote({ ...editingQuote, shippingAddress: e.target.value })}
                    placeholder="Địa chỉ giao hàng nếu báo giá có giao..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Ngày lập báo giá</label>
                  <input
                    type="date"
                    value={editingQuote.issueDate || ''}
                    onChange={(e) => setEditingQuote({ ...editingQuote, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Hiệu lực đến</label>
                  <input
                    type="date"
                    value={editingQuote.validUntil || ''}
                    onChange={(e) => setEditingQuote({ ...editingQuote, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Sale phụ trách</label>
                  <input
                    type="text"
                    value={editingQuote.salesRep || ''}
                    onChange={(e) => setEditingQuote({ ...editingQuote, salesRep: e.target.value, salesPersonName: e.target.value })}
                    placeholder="Nhân viên Sale..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Trạng thái báo giá</label>
                  <select
                    value={editingQuote.status || 'DRAFT'}
                    onChange={(e) => setEditingQuote({ ...editingQuote, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="DRAFT">Nháp (Draft)</option>
                    <option value="SENT">Đã gửi (Sent)</option>
                    <option value="ACCEPTED">Đã chấp nhận (Accepted)</option>
                    <option value="REJECTED">Từ chối (Rejected)</option>
                    <option value="EXPIRED">Hết hạn (Expired)</option>
                    <option value="CANCELLED">Đã hủy (Cancelled)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Kho xuất hàng giữ hàng</label>
                  <input
                    type="text"
                    value={editingQuote.warehouseName || ''}
                    onChange={(e) => setEditingQuote({ ...editingQuote, warehouseName: e.target.value })}
                    placeholder="Kho xuất hàng..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHI TIẾT SẢN PHẨM */}
          {activeTab === 'items' && (
            <div className="pt-2">
              <OrderLinesEditor
                lines={editingQuote.orderLines ?? []}
                currency={editingQuote.currency || 'VND'}
                onChange={applyOrderLines}
              />
            </div>
          )}

          {/* TAB 3: THANH TOÁN & TỔNG TIỀN */}
          {activeTab === 'pricing' && (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex justify-between items-center text-sm font-bold border-b pb-2 dark:border-gray-700">
                  <span>Tiền hàng (SubTotal):</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">
                    {formatMoney(editingQuote.subTotal || 0, editingQuote.currency || 'VND')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Giảm giá toàn báo giá</label>
                    <div className="flex gap-2">
                      <select
                        value={editingQuote.discountType || 'AMOUNT'}
                        onChange={(e) => {
                          const updated = { ...editingQuote, discountType: e.target.value as any };
                          setEditingQuote({ ...updated, ...calculateQuoteTotals(updated) });
                        }}
                        className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-xs font-bold"
                      >
                        <option value="AMOUNT">Theo tiền ({editingQuote.currency || 'VND'})</option>
                        <option value="PERCENT">Theo % (%)</option>
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={editingQuote.discountValue || 0}
                        onChange={(e) => {
                          const updated = { ...editingQuote, discountValue: parseFloat(e.target.value) || 0 };
                          setEditingQuote({ ...updated, ...calculateQuoteTotals(updated) });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Phí vận chuyển (Shipping)</label>
                    <input
                      type="number"
                      min={0}
                      value={editingQuote.shippingFee || 0}
                      onChange={(e) => {
                        const updated = { ...editingQuote, shippingFee: parseFloat(e.target.value) || 0 };
                        setEditingQuote({ ...updated, ...calculateQuoteTotals(updated) });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Thuế VAT (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editingQuote.taxRate || 0}
                      onChange={(e) => {
                        const updated = { ...editingQuote, taxRate: parseFloat(e.target.value) || 0 };
                        setEditingQuote({ ...updated, ...calculateQuoteTotals(updated) });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-bold"
                      placeholder="10%"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Tiền thuế VAT tính toán</label>
                    <input
                      type="text"
                      readOnly
                      value={formatMoney(editingQuote.taxAmount || 0, editingQuote.currency || 'VND')}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-600"
                    />
                  </div>
                </div>

                <div className="p-4 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl border border-emerald-300 dark:border-emerald-700 flex justify-between items-center">
                  <span className="text-sm font-extrabold text-emerald-900 dark:text-emerald-100 uppercase">TỔNG THANH TOÁN (TOTAL):</span>
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {formatMoney(editingQuote.totalAmount || 0, editingQuote.currency || 'VND')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ĐIỀU KHOẢN */}
          {activeTab === 'terms' && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase">Điều khoản thương mại & hợp đồng</span>
                <button
                  type="button"
                  onClick={loadStandardTermsTemplate}
                  className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <ShieldCheck className="w-4 h-4" /> Nạp mẫu điều khoản chuẩn
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Điều khoản thanh toán</label>
                <textarea
                  rows={2}
                  value={editingQuote.paymentTerms || ''}
                  onChange={(e) => setEditingQuote({ ...editingQuote, paymentTerms: e.target.value })}
                  placeholder="COD, chuyển khoản, công nợ 30 ngày..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Điều khoản giao hàng</label>
                <textarea
                  rows={2}
                  value={editingQuote.deliveryTerms || ''}
                  onChange={(e) => setEditingQuote({ ...editingQuote, deliveryTerms: e.target.value })}
                  placeholder="Phương thức và thời gian giao hàng..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Điều khoản bảo hành</label>
                <textarea
                  rows={2}
                  value={editingQuote.warrantyTerms || ''}
                  onChange={(e) => setEditingQuote({ ...editingQuote, warrantyTerms: e.target.value })}
                  placeholder="Thời hạn và điều kiện bảo hành..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Ghi chú bổ sung</label>
                <textarea
                  rows={2}
                  value={editingQuote.notes || ''}
                  onChange={(e) => setEditingQuote({ ...editingQuote, notes: e.target.value })}
                  placeholder="Ghi chú thêm cho khách hàng..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 5: TÀI LIỆU & PDF */}
          {activeTab === 'attachments' && (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">PDF Báo giá chính thức</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Tài liệu PDF được hệ thống tự động sinh dựa trên dữ liệu báo giá chuẩn.</p>
                </div>
                {editingQuote.id && (
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(editingQuote.id!)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow flex items-center gap-1.5"
                  >
                    <FileDown className="w-4 h-4" /> Tải PDF Ngay
                  </button>
                )}
              </div>

              <div>
                <FileDropzone
                  label="Catalogue / Tài liệu đính kèm (DOCX, XLSX, PNG, JPG, PDF)"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold rounded-xl transition-colors text-sm"
            >
              Hủy bỏ
            </button>

            <div className="flex gap-3">
              <button
                type="submit"
                onClick={() => setEditingQuote((prev) => ({ ...prev, status: 'DRAFT' }))}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl transition-colors text-sm"
              >
                Lưu Nháp
              </button>
              <button
                type="submit"
                onClick={() => setEditingQuote((prev) => ({ ...prev, status: editingQuote.status === 'DRAFT' ? 'SENT' : editingQuote.status }))}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow transition-all text-sm"
              >
                {modalMode === 'create' ? 'Tạo & Gửi Báo Giá' : 'Lưu Thay Đổi (Rev +1)'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingQuote}
        onClose={() => setDeletingQuote(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa báo giá"
        description="Bạn có chắc chắn muốn xóa báo giá này không? Hành động này không thể hoàn tác."
        itemName={deletingQuote?.code}
      />

      {/* Send Confirmation Modal */}
      <Modal
        isOpen={!!sendingQuote}
        onClose={() => setSendingQuote(null)}
        title="Xác nhận gửi báo giá"
        width="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              Bạn có chắc chắn muốn gửi báo giá <strong>{sendingQuote?.code}</strong> cho khách hàng không?
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Trạng thái sẽ chuyển sang <strong>"Đã gửi"</strong> sau khi xác nhận.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setSendingQuote(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmSend}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition-colors text-sm flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" /> Xác nhận gửi
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
