import { useMemo, useState } from 'react';
import { Plus, Download, Search, Filter, Eye, User, Calendar, CheckCircle2, RefreshCw, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore, type CustomerReturnItem } from '../store/salesStore';
import { usePermission } from '@/shared/hooks/usePermission';
import { OrderLinesEditor, sumOrderLines } from '@/shared/components/sales/OrderLinesEditor';

export function CustomerReturnsPage() {
  const canManage = usePermission('sales:returns:manage');
  const customerReturns = useSalesStore((s) => s.customerReturns);
  const addCustomerReturn = useSalesStore((s) => s.addCustomerReturn);
  const updateCustomerReturn = useSalesStore((s) => s.updateCustomerReturn);
  const deleteCustomerReturn = useSalesStore((s) => s.deleteCustomerReturn);

  const [search, setSearch] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<CustomerReturnItem | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Partial<CustomerReturnItem>>({});
  const [deleting, setDeleting] = useState<CustomerReturnItem | null>(null);

  const filtered = customerReturns.filter(
    (item) =>
      item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.returnCode.toLowerCase().includes(search.toLowerCase()) ||
      item.orderCode.toLowerCase().includes(search.toLowerCase())
  );

  const syncSelected = (updated: CustomerReturnItem) => {
    setSelectedReturn((prev) => (prev?.id === updated.id ? updated : prev));
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditing({
      returnCode: `RET-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      orderCode: '',
      customerName: '',
      refundAmount: 0,
      returnDate: new Date().toISOString().split('T')[0],
      reason: '',
      condition: 'UNOPENED',
      status: 'PENDING_INSPECTION',
      inspector: '—',
      notes: '',
      returnLines: [],
    });
    setIsModalOpen(true);
  };

  const applyReturnLines = (lines: NonNullable<CustomerReturnItem['returnLines']>) => {
    setEditing((prev) => ({
      ...prev,
      returnLines: lines,
      refundAmount: sumOrderLines(lines) || prev.refundAmount,
    }));
  };

  const handleOpenEdit = (row: CustomerReturnItem) => {
    setModalMode('edit');
    setEditing(row);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.returnCode || !editing.customerName || !editing.orderCode) return;
    const lines = editing.returnLines ?? [];
    const refundFromLines = sumOrderLines(lines);
    const refundAmount = lines.length ? refundFromLines : Number(editing.refundAmount) || 0;

    if (modalMode === 'create') {
      addCustomerReturn({
        returnCode: editing.returnCode,
        orderCode: editing.orderCode,
        customerName: editing.customerName,
        refundAmount,
        returnLines: lines,
        returnDate: editing.returnDate || new Date().toISOString().split('T')[0],
        reason: editing.reason || '',
        condition: (editing.condition as CustomerReturnItem['condition']) || 'UNOPENED',
        status: (editing.status as CustomerReturnItem['status']) || 'PENDING_INSPECTION',
        inspector: editing.inspector || '—',
        notes: editing.notes,
      });
    } else if (editing.id) {
      updateCustomerReturn(editing.id, { ...editing, refundAmount, returnLines: lines } as Partial<CustomerReturnItem>);
      const merged = customerReturns.find((r) => r.id === editing.id);
      if (merged) syncSelected({ ...merged, ...editing } as CustomerReturnItem);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deleting) return;
    deleteCustomerReturn(deleting.id);
    if (selectedReturn?.id === deleting.id) setSelectedReturn(null);
    setDeleting(null);
  };

  const handleApprove = () => {
    if (!selectedReturn) return;
    updateCustomerReturn(selectedReturn.id, { status: 'APPROVED_REFUNDED' });
    syncSelected({ ...selectedReturn, status: 'APPROVED_REFUNDED' });
  };

  const handleReject = () => {
    if (!selectedReturn) return;
    updateCustomerReturn(selectedReturn.id, { status: 'REJECTED' });
    syncSelected({ ...selectedReturn, status: 'REJECTED' });
  };

  const columns = useMemo<ColumnDef<CustomerReturnItem>[]>(
    () => [
      {
        accessorKey: 'returnCode',
        header: 'Mã hoàn trả',
        cell: (info) => <span className="font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'orderCode',
        header: 'Mã đơn gốc',
        cell: (info) => <span className="font-mono text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'reason',
        header: 'Lý do',
        cell: (info) => <span className="text-gray-600 dark:text-gray-300 truncate max-w-xs block">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'refundAmount',
        header: 'Số tiền hoàn',
        cell: (info) => <span className="font-bold text-red-600 dark:text-red-400">-${(info.getValue() as number).toFixed(2)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                status === 'APPROVED_REFUNDED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : status === 'PENDING_INSPECTION'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
              }`}
            >
              {status === 'APPROVED_REFUNDED' ? 'Đã duyệt hoàn tiền' : status === 'PENDING_INSPECTION' ? 'Chờ kiểm tra' : 'Từ chối'}
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
                setSelectedReturn(row.original);
              }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hoàn trả & Hoàn tiền (Customer Returns)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Xử lý hàng hoàn trả, kiểm định và hoàn tiền. Nhấp vào dòng để xem chi tiết.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất log
            </button>
            {canManage && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" /> Tạo phiếu hoàn trả
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
              placeholder="Tìm theo mã hoàn trả, mã đơn gốc hoặc tên khách..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent sm:text-sm transition-all"
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

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedReturn(row)} />
      </div>

      <Drawer
        isOpen={!!selectedReturn}
        onClose={() => setSelectedReturn(null)}
        title={selectedReturn ? `Phiếu hoàn: ${selectedReturn.returnCode}` : 'Chi tiết'}
        width="max-w-lg"
      >
        {selectedReturn && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-amber-800 dark:text-amber-400 font-semibold uppercase tracking-wider">Hoàn tiền</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">-${selectedReturn.refundAmount.toFixed(2)}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedReturn.status === 'APPROVED_REFUNDED'
                    ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100'
                    : selectedReturn.status === 'PENDING_INSPECTION'
                      ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
                      : 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
                }`}
              >
                {selectedReturn.status === 'APPROVED_REFUNDED'
                  ? 'Đã duyệt'
                  : selectedReturn.status === 'PENDING_INSPECTION'
                    ? 'Chờ kiểm tra'
                    : 'Từ chối'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <User className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Khách hàng
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedReturn.customerName}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Ngày hoàn
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedReturn.returnDate}</p>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Mã đơn gốc:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedReturn.orderCode}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tình trạng hàng:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-xs ${
                    selectedReturn.condition === 'UNOPENED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : selectedReturn.condition === 'DEFECTIVE'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                  }`}
                >
                  {selectedReturn.condition}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Người kiểm tra:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedReturn.inspector}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Lý do</span>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-2.5 rounded border border-gray-200 dark:border-gray-700">
                  {selectedReturn.reason}
                </p>
              </div>
              {selectedReturn.notes && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedReturn.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-3">
              {canManage && selectedReturn.status === 'PENDING_INSPECTION' && (
                <>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Duyệt hoàn tiền
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
                  >
                    <AlertTriangle className="w-4 h-4" /> Từ chối
                  </button>
                </>
              )}
              <button
                type="button"
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm"
              >
                In phiếu hoàn
              </button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo phiếu hoàn trả' : 'Sửa phiếu hoàn trả'}
        width="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã hoàn trả *</label>
              <input
                type="text"
                value={editing.returnCode || ''}
                onChange={(e) => setEditing({ ...editing, returnCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã đơn gốc *</label>
              <input
                type="text"
                value={editing.orderCode || ''}
                onChange={(e) => setEditing({ ...editing, orderCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khách hàng *</label>
            <input
              type="text"
              value={editing.customerName || ''}
              onChange={(e) => setEditing({ ...editing, customerName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
              required
            />
          </div>
          <OrderLinesEditor
            lines={editing.returnLines ?? []}
            currency="USD"
            onChange={applyReturnLines}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hoàn</label>
              <input
                type="date"
                value={editing.returnDate || ''}
                onChange={(e) => setEditing({ ...editing, returnDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền hoàn ($)</label>
              <input
                type="number"
                step="0.01"
                readOnly={!!(editing.returnLines?.length)}
                value={editing.refundAmount ?? 0}
                onChange={(e) => setEditing({ ...editing, refundAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lý do</label>
            <textarea
              value={editing.reason || ''}
              onChange={(e) => setEditing({ ...editing, reason: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tình trạng hàng</label>
              <select
                value={editing.condition || 'UNOPENED'}
                onChange={(e) => setEditing({ ...editing, condition: e.target.value as CustomerReturnItem['condition'] })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
              >
                <option value="UNOPENED">Chưa mở</option>
                <option value="DEFECTIVE">Lỗi / hỏng</option>
                <option value="USED_DAMAGED">Đã dùng / trầy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select
                value={editing.status || 'PENDING_INSPECTION'}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as CustomerReturnItem['status'] })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
              >
                <option value="PENDING_INSPECTION">Chờ kiểm tra</option>
                <option value="APPROVED_REFUNDED">Đã duyệt hoàn tiền</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người kiểm tra</label>
            <input
              type="text"
              value={editing.inspector || ''}
              onChange={(e) => setEditing({ ...editing, inspector: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
            <textarea
              value={editing.notes || ''}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold">
              Lưu
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Xóa phiếu hoàn" width="max-w-md">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Xóa {deleting.returnCode}?</p>
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
