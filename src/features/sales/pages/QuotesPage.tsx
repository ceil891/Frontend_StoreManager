import { useState, useMemo } from 'react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Download, Search, Filter, Eye, FileText, User, Calendar, CheckCircle2, Edit, Trash2 } from 'lucide-react';
import { useSalesStore, type QuoteItem } from '../store/salesStore';
import { usePermission } from '@/shared/hooks/usePermission';
import { OrderLinesEditor, sumOrderLines } from '@/shared/components/sales/OrderLinesEditor';

export function QuotesPage() {
  const { quotes: data, addQuote, updateQuote, deleteQuote } = useSalesStore();
  const canManage = usePermission('sales:quotes:manage');
  const [search, setSearch] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<QuoteItem | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingQuote, setEditingQuote] = useState<Partial<QuoteItem>>({});
  const [deletingQuote, setDeletingQuote] = useState<QuoteItem | null>(null);

  const filtered = data.filter((item) =>
    item.customerName.toLowerCase().includes(search.toLowerCase()) ||
    item.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    setEditingQuote({
      code: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: '',
      total: 0,
      validUntil: nextMonth.toISOString().split('T')[0],
      status: 'DRAFT',
      salesRep: 'System User',
      itemsCount: 0,
      orderLines: [],
      notes: ''
    });
    setIsModalOpen(true);
  };

  const applyOrderLines = (lines: NonNullable<QuoteItem['orderLines']>) => {
    const total = sumOrderLines(lines);
    setEditingQuote((prev) => ({
      ...prev,
      orderLines: lines,
      total,
      itemsCount: lines.filter((l) => l.productName.trim()).length,
    }));
  };

  const handleOpenEdit = (quote: QuoteItem) => {
    setModalMode('edit');
    setEditingQuote(quote);
    setIsModalOpen(true);
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote.customerName || !editingQuote.code) return;

    const lines = editingQuote.orderLines ?? [];
    const lineTotal = sumOrderLines(lines);
    const linePayload = {
      orderLines: lines,
      total: lines.length ? lineTotal : Number(editingQuote.total) || 0,
      itemsCount: lines.filter((l) => l.productName.trim()).length || Number(editingQuote.itemsCount) || 0,
    };

    if (modalMode === 'create') {
      const newQuote: Omit<QuoteItem, 'id'> = {
        code: editingQuote.code,
        customerName: editingQuote.customerName,
        validUntil: editingQuote.validUntil || new Date().toISOString().split('T')[0],
        status: editingQuote.status as any || 'DRAFT',
        salesRep: editingQuote.salesRep || 'System User',
        notes: editingQuote.notes || '',
        ...linePayload,
      };
      addQuote(newQuote);
    } else if (editingQuote.id) {
      updateQuote(editingQuote.id, { ...editingQuote, ...linePayload });
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingQuote) return;
    deleteQuote(deletingQuote.id);
    setDeletingQuote(null);
  };

  const columns = useMemo<ColumnDef<QuoteItem>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Mã báo giá',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng / Đối tác',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'total',
        header: 'Tổng giá trị',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">${(info.getValue() as number).toFixed(2)}</span>,
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
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'SENT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'DRAFT' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {status === 'ACCEPTED' ? 'Đã chấp nhận' : status === 'SENT' ? 'Đã gửi' : status === 'DRAFT' ? 'Nháp' : 'Hết hạn'}
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
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
            >
              <Eye className="w-4 h-4" />
            </button>
            {canManage && (
              <button
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
                title="Chỉnh sửa"
                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors shrink-0"
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
    [canManage]
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Báo giá (Sales Quotations)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tạo, theo dõi và quản lý các bảng báo giá sản phẩm. Nhấp vào dòng để xem trước đề xuất.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0">
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            {canManage && (
              <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm whitespace-nowrap shrink-0">
                <Plus className="w-4 h-4" /> Tạo báo giá
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã báo giá hoặc tên khách hàng..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button title="Bộ lọc" className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm whitespace-nowrap shrink-0">
            <Filter className="w-4 h-4" /> Bộ lọc
          </button>
        </div>

        {/* Table */}
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedQuote(row)} />
      </div>

      {/* Drawer Details */}
      <Drawer
        isOpen={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
        title={selectedQuote ? `Quotation: ${selectedQuote.code}` : 'Quotation Details'}
        width="max-w-lg"
      >
        {selectedQuote && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">Total Proposed</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">${selectedQuote.total.toFixed(2)}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedQuote.status === 'ACCEPTED' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedQuote.status === 'SENT' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                selectedQuote.status === 'DRAFT' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedQuote.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Client
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedQuote.customerName}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-amber-500" /> Validity
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">Until {selectedQuote.validUntil}</p>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Sales Representative:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedQuote.salesRep}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Included Line Items:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedQuote.itemsCount} products</span>
              </div>
              {selectedQuote.notes && (
               <div className="pt-2 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Terms & Notes</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedQuote.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedQuote.status !== 'ACCEPTED' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Convert to Sale Order
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                Download PDF
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo Báo Giá Mới' : 'Cập Nhật Báo Giá'}
        width="max-w-xl"
      >
        <form onSubmit={handleSaveQuote} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã báo giá *</label>
              <input
                type="text"
                value={editingQuote.code || ''}
                onChange={(e) => setEditingQuote({ ...editingQuote, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khách hàng *</label>
              <input
                type="text"
                value={editingQuote.customerName || ''}
                onChange={(e) => setEditingQuote({ ...editingQuote, customerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                required
                placeholder="Tên khách hàng hoặc công ty..."
              />
            </div>
          </div>

          <OrderLinesEditor
            lines={editingQuote.orderLines ?? []}
            currency="USD"
            onChange={applyOrderLines}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng tiền ($)</label>
              <input
                type="number"
                step="0.01"
                readOnly={!!(editingQuote.orderLines?.length)}
                value={editingQuote.total || 0}
                onChange={(e) => setEditingQuote({ ...editingQuote, total: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng mục</label>
              <input
                type="number"
                readOnly
                value={editingQuote.itemsCount || 0}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hiệu lực đến</label>
              <input
                type="date"
                value={editingQuote.validUntil || ''}
                onChange={(e) => setEditingQuote({ ...editingQuote, validUntil: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select
                value={editingQuote.status || 'DRAFT'}
                onChange={(e) => setEditingQuote({ ...editingQuote, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="DRAFT">Nháp (Draft)</option>
                <option value="SENT">Đã gửi (Sent)</option>
                <option value="ACCEPTED">Đã chấp nhận (Accepted)</option>
                <option value="EXPIRED">Hết hạn (Expired)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhân viên phụ trách</label>
              <input
                type="text"
                value={editingQuote.salesRep || ''}
                onChange={(e) => setEditingQuote({ ...editingQuote, salesRep: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú / Điều khoản</label>
            <textarea
              rows={3}
              value={editingQuote.notes || ''}
              onChange={(e) => setEditingQuote({ ...editingQuote, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Nhập ghi chú hoặc điều khoản bán hàng..."
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              {modalMode === 'create' ? 'Tạo báo giá' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingQuote}
        onClose={() => setDeletingQuote(null)}
        title="Xác nhận xóa báo giá"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa báo giá <strong className="text-gray-900 dark:text-white">{deletingQuote?.code}</strong> không? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingQuote(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Xóa báo giá
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
