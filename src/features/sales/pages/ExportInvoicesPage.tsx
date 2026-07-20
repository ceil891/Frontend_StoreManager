import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, Eye, Calendar, CheckCircle2, Send, Building2, FileText, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore, type ExportInvoiceItem, formatMoney } from '../store/salesStore';
import { resolveCustomerName, paymentTermsToDueDate } from '../store/salesHelpers';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { CustomerSelect } from '@/shared/components/sales/CustomerSelect';
import { usePermission } from '@/shared/hooks/usePermission';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

export function ExportInvoicesPage() {
  const canManage = usePermission('sales:invoices:manage');
  const customers = useCrmStore((s) => s.customers);
  const { exportInvoices, addExportInvoice, updateExportInvoice, deleteExportInvoice, fetchExportInvoices } = useSalesStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchExportInvoices();
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách hóa đơn xuất');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchExportInvoices]);

  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<ExportInvoiceItem | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Partial<ExportInvoiceItem>>({});
  const [deleting, setDeleting] = useState<ExportInvoiceItem | null>(null);

  const filtered = exportInvoices.filter(
    (item) =>
      resolveCustomerName(item.customerId, customers).toLowerCase().includes(search.toLowerCase()) ||
      item.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.taxId.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditing({
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customerId: '',
      taxId: '',
      billingAddress: '',
      orderIds: [],
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: paymentTermsToDueDate(new Date().toISOString().split('T')[0], 'Net 30'),
      subtotal: 0,
      vatAmount: 0,
      totalAmount: 0,
      status: 'ISSUED',
      paymentTerms: 'Net 30',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv: ExportInvoiceItem) => {
    setModalMode('edit');
    setEditing(inv);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.invoiceNumber || !editing.customerId) return;
    const subtotal = Number(editing.subtotal) || 0;
    const vat = Number(editing.vatAmount) || 0;
    const total = Number(editing.totalAmount) || subtotal + vat;
    const issueDate = editing.issueDate || new Date().toISOString().split('T')[0];
    const paymentTerms = editing.paymentTerms || 'Net 30';
    const dueDate = editing.dueDate || paymentTermsToDueDate(issueDate, paymentTerms);
    try {
      if (modalMode === 'create') {
        await addExportInvoice({
          invoiceNumber: editing.invoiceNumber,
          customerId: editing.customerId,
          taxId: editing.taxId || '—',
          billingAddress: editing.billingAddress || '—',
          orderIds: editing.orderIds || [],
          issueDate,
          dueDate,
          subtotal,
          vatAmount: vat,
          totalAmount: total,
          status: (editing.status as ExportInvoiceItem['status']) || 'ISSUED',
          paymentTerms,
          notes: editing.notes,
        });
        toast.success('Thêm hóa đơn xuất thành công!');
      } else if (editing.id) {
        await updateExportInvoice(editing.id, {
          ...editing,
          subtotal,
          vatAmount: vat,
          totalAmount: total,
          dueDate,
        } as Partial<ExportInvoiceItem>);
        toast.success('Cập nhật hóa đơn xuất thành công!');
      }
      setIsModalOpen(false);
      fetchExportInvoices();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu hóa đơn xuất.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    try {
      await deleteExportInvoice(deleting.id);
      toast.success('Đã xóa hóa đơn xuất!');
      if (selectedInvoice?.id === deleting.id) setSelectedInvoice(null);
      setDeleting(null);
      fetchExportInvoices();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa hóa đơn xuất.');
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedInvoice) return;
    try {
      await updateExportInvoice(selectedInvoice.id, { status: 'PAID' });
      setSelectedInvoice({ ...selectedInvoice, status: 'PAID' });
      toast.success('Đã đánh dấu đã thanh toán!');
      fetchExportInvoices();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cập nhật trạng thái thanh toán.');
    }
  };

  const columns = useMemo<ColumnDef<ExportInvoiceItem>[]>(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: 'Mã hóa đơn',
        cell: (info) => <span className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        id: 'customer',
        header: 'Khách hàng B2B',
        cell: ({ row }) => <span className="font-medium text-gray-900 dark:text-white">{resolveCustomerName(row.original.customerId, customers)}</span>,
      },
      {
        accessorKey: 'taxId',
        header: 'Mã số thuế',
        cell: (info) => <span className="font-mono text-gray-500 text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'issueDate',
        header: 'Ngày phát hành',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng tiền (gồm VAT)',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{formatMoney(info.getValue() as number, 'VND')}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : status === 'ISSUED'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                    : status === 'OVERDUE'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
              }`}
            >
              {status === 'PAID' ? 'Đã thanh toán' : status === 'ISSUED' ? 'Đã phát hành' : status === 'OVERDUE' ? 'Quá hạn' : 'Đã hủy'}
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
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedInvoice(row.original);
              }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            {canManage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit(row.original);
                }}
                title="Chỉnh sửa"
                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canManage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleting(row.original);
                }}
                title="Xóa"
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hóa đơn xuất bán (Export Invoices)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý hóa đơn VAT điện tử xuất bán sỉ và doanh nghiệp. Nhấp vào dòng để xem chi tiết.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            {canManage && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" /> Thêm hóa đơn
              </button>
            )}
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
              placeholder="Tìm kiếm theo mã hóa đơn, tên công ty hoặc MST..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button
            type="button"
            title="Bộ lọc"
            className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm"
          >
            <Filter className="w-4 h-4" /> Bộ lọc
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-gray-500">Đang tải danh sách hóa đơn xuất...</span>
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedInvoice(row)} />
        )}
      </div>

      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Chi tiết hóa đơn: ${selectedInvoice.invoiceNumber}` : 'Chi tiết hóa đơn'}
        width="max-w-lg"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-blue-800 dark:text-blue-400 font-semibold uppercase tracking-wider">Tổng thanh toán</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatMoney(selectedInvoice.totalAmount, 'VND')}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedInvoice.status === 'PAID'
                    ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100'
                    : selectedInvoice.status === 'ISSUED'
                      ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
                      : selectedInvoice.status === 'OVERDUE'
                        ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
                        : 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
                }`}
              >
                {selectedInvoice.status === 'PAID' ? 'Đã thanh toán' : selectedInvoice.status === 'ISSUED' ? 'Đã phát hành' : selectedInvoice.status === 'OVERDUE' ? 'Quá hạn' : 'Đã hủy'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Khách B2B
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{resolveCustomerName(selectedInvoice.customerId, customers)}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Ngày & điều khoản
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {selectedInvoice.issueDate} (Due: {selectedInvoice.dueDate})
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Mã số thuế:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedInvoice.taxId}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Địa chỉ xuất HĐ:</span>
                <span className="font-semibold text-gray-900 dark:text-white text-right">{selectedInvoice.billingAddress}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tạm tính:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatMoney(selectedInvoice.subtotal, 'VND')}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-gray-500 dark:text-gray-400">Thuế VAT:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatMoney(selectedInvoice.vatAmount, 'VND')}</span>
              </div>
              <div className="flex justify-between items-center text-base font-bold pt-1">
                <span className="text-gray-900 dark:text-white">Tổng cộng:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(selectedInvoice.totalAmount, 'VND')}</span>
              </div>

              {selectedInvoice.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {canManage && selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={handleMarkPaid}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Đánh dấu đã thanh toán
                </button>
              )}
              <button
                type="button"
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm"
              >
                <Send className="w-4 h-4 inline mr-1.5" /> Gửi PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm hóa đơn xuất' : 'Sửa hóa đơn'}
        width="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số hóa đơn *</label>
              <input
                type="text"
                value={editing.invoiceNumber || ''}
                onChange={(e) => setEditing({ ...editing, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày phát hành *</label>
              <input
                type="date"
                value={editing.issueDate || ''}
                onChange={(e) => setEditing({ ...editing, issueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khách hàng (CRM) *</label>
            <CustomerSelect
              value={editing.customerId || ''}
              onChange={(customerId) => setEditing({ ...editing, customerId })}
              allowWalkIn={false}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã số thuế</label>
            <input
              type="text"
              value={editing.taxId || ''}
              onChange={(e) => setEditing({ ...editing, taxId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ xuất hóa đơn</label>
            <input
              type="text"
              value={editing.billingAddress || ''}
              onChange={(e) => setEditing({ ...editing, billingAddress: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Order IDs</label>
            <input
              type="text"
              value={(editing.orderIds || []).join(', ')}
              onChange={(e) => setEditing({ ...editing, orderIds: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
              placeholder="SO-001, SO-002"
            />          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tạm tính (₫)</label>
              <input
                type="text"
                value={(editing.subtotal ?? 0) === 0 ? '' : Math.round(editing.subtotal ?? 0).toLocaleString('vi-VN')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  const parsed = digits === '' ? 0 : parseInt(digits, 10);
                  setEditing({ ...editing, subtotal: parsed });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thuế VAT (₫)</label>
              <input
                type="text"
                value={(editing.vatAmount ?? 0) === 0 ? '' : Math.round(editing.vatAmount ?? 0).toLocaleString('vi-VN')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  const parsed = digits === '' ? 0 : parseInt(digits, 10);
                  setEditing({ ...editing, vatAmount: parsed });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng cộng (₫)</label>
              <input
                type="text"
                value={(editing.totalAmount ?? ((editing.subtotal ?? 0) + (editing.vatAmount ?? 0))) === 0 ? '' : Math.round(editing.totalAmount ?? ((editing.subtotal ?? 0) + (editing.vatAmount ?? 0))).toLocaleString('vi-VN')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  const parsed = digits === '' ? 0 : parseInt(digits, 10);
                  setEditing({ ...editing, totalAmount: parsed });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select
                value={editing.status || 'ISSUED'}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as ExportInvoiceItem['status'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              >
                <option value="ISSUED">Đã phát hành</option>
                <option value="PAID">Đã thanh toán</option>
                <option value="OVERDUE">Quá hạn</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Điều khoản TT</label>
              <input
                type="text"
                value={editing.paymentTerms || ''}
                onChange={(e) => setEditing({ ...editing, paymentTerms: e.target.value, dueDate: paymentTermsToDueDate(editing.issueDate || new Date().toISOString().split('T')[0], e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hạn thanh toán</label>
              <input
                type="date"
                value={editing.dueDate || ''}
                onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
            <textarea
              value={editing.notes || ''}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold">
              Lưu
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Xóa hóa đơn" width="max-w-md">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Xóa hóa đơn {deleting.invoiceNumber}?</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleting(null)} className="px-4 py-2 border rounded-lg text-sm">
                Hủy
              </button>
              <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                Xóa
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

