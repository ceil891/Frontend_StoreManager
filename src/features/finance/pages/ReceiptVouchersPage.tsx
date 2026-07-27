import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, Eye, Calendar, User, FileText, ArrowDownLeft, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useFinanceStore, type ReceiptVoucher } from '../store/financeStore';
import { toast } from 'sonner';
import { exportToCsv } from '@/shared/utils/exportCsv';

const categoryMap: Record<string, string> = {
  SALES_REVENUE: 'Doanh thu bán hàng',
  DEBT_COLLECTION: 'Thu hồi công nợ',
  INVESTMENT: 'Vốn góp / Đầu tư',
  OTHER: 'Khoản thu khác',
};

const methodMap: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  CREDIT_CARD: 'Thẻ thanh toán',
};

export function ReceiptVouchersPage() {
  const data = useFinanceStore((s) => s.receipts);
  const addReceipt = useFinanceStore((s) => s.addReceipt);
  const updateReceipt = useFinanceStore((s) => s.updateReceipt);
  const deleteReceipt = useFinanceStore((s) => s.deleteReceipt);
  const fetchReceipts = useFinanceStore((s) => s.fetchReceipts);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const [search, setSearch] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<ReceiptVoucher | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoCode, setIsAutoCode] = useState(true);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingVoucher, setEditingVoucher] = useState<Partial<ReceiptVoucher>>({});
  const [deletingVoucher, setDeletingVoucher] = useState<ReceiptVoucher | null>(null);

  const filtered = data.filter((item) =>
    item.payerName.toLowerCase().includes(search.toLowerCase()) ||
    item.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
    (item.referenceDoc && item.referenceDoc.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setIsAutoCode(true);
    setEditingVoucher({
      voucherNumber: `REC-2024-${Math.floor(100 + Math.random() * 900)}`,
      payerName: '',
      category: 'SALES_REVENUE',
      amount: 0,
      paymentMethod: 'BANK_TRANSFER',
      receivedDate: new Date().toISOString().substring(0, 10),
      referenceDoc: '',
      cashier: 'Super Admin',
      branchId: 'BR-001',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (voucher: ReceiptVoucher) => {
    setModalMode('edit');
    setIsAutoCode(false);
    setEditingVoucher(voucher);
    setIsModalOpen(true);
  };

  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoucher.voucherNumber || !editingVoucher.payerName) return;

    if (modalMode === 'create') {
      addReceipt({
        voucherNumber: editingVoucher.voucherNumber || `REC-2024-${Math.floor(100 + Math.random() * 900)}`,
        payerName: editingVoucher.payerName || 'Người nộp tiền',
        category: editingVoucher.category || 'SALES_REVENUE',
        amount: Number(editingVoucher.amount) || 0,
        paymentMethod: editingVoucher.paymentMethod || 'BANK_TRANSFER',
        receivedDate: editingVoucher.receivedDate || new Date().toISOString().substring(0, 10),
        referenceDoc: editingVoucher.referenceDoc,
        cashier: editingVoucher.cashier || 'Super Admin',
        branchId: editingVoucher.branchId || 'BR-001',
        notes: editingVoucher.notes,
      });
    } else if (editingVoucher.id) {
      updateReceipt(editingVoucher.id, editingVoucher);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingVoucher) return;
    deleteReceipt(deletingVoucher.id);
    setDeletingVoucher(null);
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
        header: 'Người nộp / Nguồn thu',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'category',
        header: 'Nhóm doanh thu',
        cell: (info) => {
          const cat = info.getValue() as string;
          return <span className="text-gray-700 dark:text-gray-300 font-medium text-xs bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded">{categoryMap[cat] || cat}</span>;
        },
      },
      {
        accessorKey: 'amount',
        header: 'Số tiền thực thu',
        cell: (info) => <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">+{ (info.getValue() as number).toLocaleString('vi-VN') } ₫</span>,
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Hình thức',
        cell: (info) => {
          const method = info.getValue() as string;
          return <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">{methodMap[method] || method}</span>;
        },
      },
      {
        accessorKey: 'receivedDate',
        header: 'Ngày lập',
        cell: (info) => <span className="text-gray-500 text-sm font-mono">{info.getValue() as string}</span>,
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phiếu thu doanh thu (receipt vouchers)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ghi nhận và quản lý dòng tiền vào từ hoạt động bán hàng, thu hồi công nợ đối tác và tiền mặt ký quỹ.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                exportToCsv('danh_sach_phieu_thu', filtered, [
                  { header: 'Số phiếu thu', accessor: r => r.voucherNumber },
                  { header: 'Người nộp', accessor: r => r.payerName },
                  { header: 'Nhóm doanh thu', accessor: r => categoryMap[r.category] || r.category },
                  { header: 'Số tiền (VND)', accessor: r => r.amount },
                  { header: 'Hình thức', accessor: r => methodMap[r.paymentMethod] || r.paymentMethod },
                  { header: 'Ngày thu', accessor: r => r.receivedDate },
                  { header: 'Chứng từ gốc', accessor: r => r.referenceDoc || '' },
                ]);
                toast.success('Đã xuất sổ quỹ thu dạng CSV!');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất sổ quỹ thu
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Lập phiếu thu mới
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
              placeholder="Tìm kiếm theo số phiếu thu, tên đối tác nộp hoặc mã chứng từ..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm">
            <Filter className="w-4 h-4" /> Lọc tìm kiếm
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedVoucher(row)} />
      </div>

      <Modal
        isOpen={!!selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        title={selectedVoucher ? `Hồ Sơ Phiếu Thu: ${selectedVoucher.voucherNumber}` : 'Chi tiết phiếu thu'}
        width="max-w-lg"
      >
        {selectedVoucher && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">Tổng tiền thực thu</p>
                  <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">+{selectedVoucher.amount.toLocaleString('vi-VN')} ₫</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                ĐÃ VÀO KHO QUỸ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Đơn vị / Người nộp
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedVoucher.payerName}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Ngày thu tiền
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedVoucher.receivedDate}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Nhóm phân loại:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{categoryMap[selectedVoucher.category] || selectedVoucher.category}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Hình thức thu:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{methodMap[selectedVoucher.paymentMethod] || selectedVoucher.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tài khoản nhận tiền:</span>
                <span className="font-semibold font-mono text-gray-900 dark:text-white">{selectedVoucher.receivingAccount || 'Tiền mặt'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Chứng từ / Hóa đơn tham chiếu:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedVoucher.referenceDoc || 'Không có'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Liên hệ người nộp:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedVoucher.payerContact || 'Chưa ghi nhận'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Nhân viên thu ngân / Kế toán:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedVoucher.cashier}</span>
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
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú & Thuyết minh</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedVoucher.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button
                onClick={() => toast.success('Đã gửi yêu cầu in biên lai thu tiền!')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
              >
                <FileText className="w-4 h-4" /> In biên lai thu tiền
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Thêm / Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Lập phiếu thu mới' : 'Chỉnh sửa thông tin phiếu thu'}
        width="max-w-xl"
      >
        <form onSubmit={handleSaveVoucher} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Số phiếu thu *</label>
                {modalMode === 'create' && (
                  <label className="flex items-center gap-1 text-[10px] text-emerald-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAutoCode}
                      onChange={(e) => {
                        setIsAutoCode(e.target.checked);
                        if (e.target.checked) {
                          setEditingVoucher(prev => ({
                            ...prev,
                            voucherNumber: `REC-2024-${Math.floor(100 + Math.random() * 900)}`
                          }));
                        }
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-550 w-3 h-3"
                    />
                    <span>Tự động sinh</span>
                  </label>
                )}
              </div>
              <input
                type="text"
                value={editingVoucher.voucherNumber || ''}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, voucherNumber: e.target.value })}
                disabled={modalMode === 'create' && isAutoCode}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-60"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhóm khoản thu</label>
              <select
                value={editingVoucher.category || 'SALES_REVENUE'}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="SALES_REVENUE">Doanh thu bán hàng (Sales)</option>
                <option value="DEBT_COLLECTION">Thu hồi công nợ (Debt Collection)</option>
                <option value="INVESTMENT">Vốn góp / Đầu tư (Investment)</option>
                <option value="OTHER">Khoản thu khác (Other)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn vị / Người nộp tiền *</label>
            <input
              type="text"
              value={editingVoucher.payerName || ''}
              onChange={(e) => setEditingVoucher({ ...editingVoucher, payerName: e.target.value })}
              placeholder="Tên đối tác / khách hàng..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền thực thu (₫) *</label>
              <input
                type="number"
                value={editingVoucher.amount ?? 0}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hình thức thu</label>
              <select
                value={editingVoucher.paymentMethod || 'BANK_TRANSFER'}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, paymentMethod: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                <option value="CASH">Tiền mặt tại quỹ</option>
                <option value="CREDIT_CARD">Thẻ thanh toán POS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày lập phiếu</label>
              <input
                type="date"
                value={editingVoucher.receivedDate || ''}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, receivedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chứng từ / Hợp đồng tham chiếu</label>
              <input
                type="text"
                value={editingVoucher.referenceDoc || ''}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, referenceDoc: e.target.value })}
                placeholder="INV-2024..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thu ngân / Kế toán lập phiếu</label>
            <input
              type="text"
              value={editingVoucher.cashier || ''}
              onChange={(e) => setEditingVoucher({ ...editingVoucher, cashier: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú & Diễn giải</label>
            <textarea
              rows={2}
              value={editingVoucher.notes || ''}
              onChange={(e) => setEditingVoucher({ ...editingVoucher, notes: e.target.value })}
              placeholder="Diễn giải nội dung khoản thu..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              {modalMode === 'create' ? 'Lập phiếu thu' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xác nhận xóa */}
      <Modal
        isOpen={!!deletingVoucher}
        onClose={() => setDeletingVoucher(null)}
        title="Xác nhận hủy phiếu thu"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Bạn có chắc chắn muốn hủy bỏ phiếu thu <strong className="text-gray-900 dark:text-white">{deletingVoucher?.voucherNumber}</strong> từ nguồn <span className="font-semibold">{deletingVoucher?.payerName}</span>?
          </p>
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-200 dark:border-red-800/40">
            Hành động này sẽ gỡ bỏ số liệu khỏi sổ quỹ doanh thu thực nhận. Chỉ thực hiện khi chứng từ nhập liệu sai hoặc giao dịch bị hủy bỏ thực tế.
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
