import { useMemo, useState } from 'react';
import { Plus, Download, Search, Filter, Eye, Calendar, CheckCircle2, Send, Building2, FileText, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore, type ExportInvoiceItem } from '../store/salesStore';
import { usePermission } from '@/shared/hooks/usePermission';

export function ExportInvoicesPage() {
  const canManage = usePermission('sales:invoices:manage');
  const exportInvoices = useSalesStore((s) => s.exportInvoices);
  const addExportInvoice = useSalesStore((s) => s.addExportInvoice);
  const updateExportInvoice = useSalesStore((s) => s.updateExportInvoice);
  const deleteExportInvoice = useSalesStore((s) => s.deleteExportInvoice);

  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<ExportInvoiceItem | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Partial<ExportInvoiceItem>>({});
  const [deleting, setDeleting] = useState<ExportInvoiceItem | null>(null);

  const filtered = exportInvoices.filter(
    (item) =>
      item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.taxId.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditing({
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customerName: '',
      taxId: '',
      issueDate: new Date().toISOString().split('T')[0],
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.invoiceNumber || !editing.customerName) return;
    const subtotal = Number(editing.subtotal) || 0;
    const vat = Number(editing.vatAmount) || 0;
    const total = Number(editing.totalAmount) || subtotal + vat;
    if (modalMode === 'create') {
      addExportInvoice({
        invoiceNumber: editing.invoiceNumber,
        customerName: editing.customerName,
        taxId: editing.taxId || '—',
        issueDate: editing.issueDate || new Date().toISOString().split('T')[0],
        subtotal,
        vatAmount: vat,
        totalAmount: total,
        status: (editing.status as ExportInvoiceItem['status']) || 'ISSUED',
        paymentTerms: editing.paymentTerms || 'Net 30',
        notes: editing.notes,
      });
    } else if (editing.id) {
      updateExportInvoice(editing.id, {
        ...editing,
        subtotal,
        vatAmount: vat,
        totalAmount: total,
      } as Partial<ExportInvoiceItem>);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deleting) return;
    deleteExportInvoice(deleting.id);
    if (selectedInvoice?.id === deleting.id) setSelectedInvoice(null);
    setDeleting(null);
  };

  const handleMarkPaid = () => {
    if (!selectedInvoice) return;
    updateExportInvoice(selectedInvoice.id, { status: 'PAID' });
    setSelectedInvoice({ ...selectedInvoice, status: 'PAID' });
  };

  const columns = useMemo<ColumnDef<ExportInvoiceItem>[]>(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: 'Mã hóa đơn',
        cell: (info) => <span className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng B2B',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
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
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">${(info.getValue() as number).toFixed(2)}</span>,
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
    [canManage]
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
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

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedInvoice(row)} />
      </div>

      <Drawer
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Hóa đơn: ${selectedInvoice.invoiceNumber}` : 'Chi tiết'}
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
                  <p className="text-xl font-bold text-gray-900 dark:text-white">${selectedInvoice.totalAmount.toFixed(2)}</p>
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
                {selectedInvoice.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Khách B2B
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedInvoice.customerName}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Ngày & điều khoản
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {selectedInvoice.issueDate} ({selectedInvoice.paymentTerms})
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Mã số thuế:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedInvoice.taxId}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Subtotal:</span>
                <span className="font-semibold text-gray-900 dark:text-white">${selectedInvoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-gray-500 dark:text-gray-400">VAT:</span>
                <span className="font-semibold text-gray-900 dark:text-white">${selectedInvoice.vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-base font-bold pt-1">
                <span className="text-gray-900 dark:text-white">Tổng cộng:</span>
                <span className="text-blue-600 dark:text-blue-400">${selectedInvoice.totalAmount.toFixed(2)}</span>
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
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
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
      </Drawer>

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
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên khách B2B *</label>
            <input
              type="text"
              value={editing.customerName || ''}
              onChange={(e) => setEditing({ ...editing, customerName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subtotal</label>
              <input
                type="number"
                step="0.01"
                value={editing.subtotal ?? 0}
                onChange={(e) => setEditing({ ...editing, subtotal: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">VAT</label>
              <input
                type="number"
                step="0.01"
                value={editing.vatAmount ?? 0}
                onChange={(e) => setEditing({ ...editing, vatAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng</label>
              <input
                type="number"
                step="0.01"
                value={editing.totalAmount ?? (Number(editing.subtotal) || 0) + (Number(editing.vatAmount) || 0)}
                onChange={(e) => setEditing({ ...editing, totalAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
                onChange={(e) => setEditing({ ...editing, paymentTerms: e.target.value })}
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
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
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
