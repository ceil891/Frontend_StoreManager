import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, Eye, Calendar, Building, FileText, TrendingDown, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { useFinanceStore, type OperatingCost } from '../store/financeStore';
import { exportToCsv } from '@/shared/utils/exportCsv';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { CreateButton, SecondaryButton, PrimaryButton, DangerButton } from '@/shared/components/ui/Button';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import { toast } from 'sonner';

const categoryMap: Record<string, string> = {
  RENTAL: 'Thuê mặt bằng',
  UTILITIES: 'Điện nước & Tiện ích',
  SALARY: 'Lương nhân sự',
  MARKETING: 'Tiếp thị & Quảng cáo',
  MAINTENANCE: 'Bảo trì & Sửa chữa',
  INSURANCE: 'Bảo hiểm',
  SUPPLIES: 'Văn phòng phẩm / Công cụ',
};

const paymentStatusMap: Record<string, string> = {
  PAID: 'Đã thanh toán',
  SCHEDULED: 'Đã lên lịch',
  PENDING: 'Đang chờ xử lý',
  OVERDUE: 'Quá hạn',
};

export function OperatingCostsPage() {
  const data = useFinanceStore((s) => s.operatingCosts);
  const addOperatingCost = useFinanceStore((s) => s.addOperatingCost);
  const updateOperatingCost = useFinanceStore((s) => s.updateOperatingCost);
  const deleteOperatingCost = useFinanceStore((s) => s.deleteOperatingCost);
  const fetchOperatingCosts = useFinanceStore((s) => s.fetchOperatingCosts);

  useEffect(() => {
    fetchOperatingCosts();
  }, [fetchOperatingCosts]);

  const [search, setSearch] = useState('');
  const [selectedCost, setSelectedCost] = useState<OperatingCost | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingCost, setEditingCost] = useState<Partial<OperatingCost>>({});
  const [deletingCost, setDeletingCost] = useState<OperatingCost | null>(null);

  const filtered = data.filter((item) =>
    item.costName.toLowerCase().includes(search.toLowerCase()) ||
    item.costCode.toLowerCase().includes(search.toLowerCase()) ||
    item.branch.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingCost({
      costCode: `OPC-2024-${Math.floor(500 + Math.random() * 500)}`,
      costName: '',
      category: 'RENTAL',
      amount: 0,
      incurredDate: new Date().toISOString().substring(0, 10),
      branch: 'Hội sở chính',
      branchId: 'BR-001',
      paymentStatus: 'PENDING',
      assignedBudget: 'Ngân sách vận hành chung',
      authorizedBy: 'Super Admin',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cost: OperatingCost) => {
    setModalMode('edit');
    setEditingCost(cost);
    setIsModalOpen(true);
  };

  const handleSaveCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCost.costCode || !editingCost.costName) {
      toast.error('Vui lòng nhập đầy đủ mã và tên chi phí');
      return;
    }

    try {
      if (modalMode === 'create') {
        await addOperatingCost({
          costCode: editingCost.costCode || `OPC-2024-${Math.floor(500 + Math.random() * 500)}`,
          costName: editingCost.costName || 'Chi phí vận hành',
          category: editingCost.category || 'RENTAL',
          amount: Number(editingCost.amount) || 0,
          incurredDate: editingCost.incurredDate || new Date().toISOString().substring(0, 10),
          branch: editingCost.branch || 'Hội sở chính',
          branchId: editingCost.branchId || 'BR-001',
          paymentStatus: editingCost.paymentStatus || 'PENDING',
          assignedBudget: editingCost.assignedBudget || 'Ngân sách vận hành',
          authorizedBy: editingCost.authorizedBy || 'Super Admin',
          description: editingCost.description,
        });
        toast.success('Thêm mới chi phí vận hành thành công!');
      } else if (editingCost.id) {
        await updateOperatingCost(editingCost.id, editingCost);
        toast.success('Cập nhật chi phí vận hành thành công!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi lưu chi phí: ' + (err?.message || 'Thất bại'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCost) return;
    try {
      await deleteOperatingCost(deletingCost.id);
      toast.success('Xóa khoản chi phí thành công!');
      setDeletingCost(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi xóa chi phí: ' + (err?.message || 'Thất bại'));
    }
  };

  const columns = useMemo<ColumnDef<OperatingCost>[]>(
    () => [
      {
        accessorKey: 'costCode',
        header: 'Mã chi phí',
        cell: (info) => <span className="font-mono font-bold text-red-600 dark:text-red-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'costName',
        header: 'Nội dung khoản chi',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'category',
        header: 'Danh mục',
        cell: (info) => {
          const cat = info.getValue() as string;
          return <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-semibold">{categoryMap[cat] || cat}</span>;
        },
      },
      {
        accessorKey: 'branch',
        header: 'Chi nhánh / Phòng ban',
      },
      {
        accessorKey: 'amount',
        header: 'Số tiền chi',
        cell: (info) => <span className="font-bold font-mono text-red-600 dark:text-red-400">-${(info.getValue() as number).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>,
      },
      {
        accessorKey: 'paymentVoucherCode',
        header: 'Phiếu chi liên quan',
        cell: (info) => {
          const doc = (info.getValue() as string) || `PAY-2026-${Math.floor(100 + Math.random() * 900)}`;
          return (
            <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              {doc}
            </span>
          );
        },
      },
      {
        accessorKey: 'incurredDate',
        header: 'Ngày phát sinh',
        cell: (info) => <span className="text-gray-500 text-sm font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Trạng thái chi',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {paymentStatusMap[status] || status}
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
              onClick={(e) => { e.stopPropagation(); setSelectedCost(row.original); }}
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
              onClick={(e) => { e.stopPropagation(); setDeletingCost(row.original); }}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chi phí vận hành & quản lý (operating costs)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ghi nhận các chi phí hoạt động thường xuyên, tiền thuê mặt bằng, ngân sách tiếp thị và bảo trì khẩn cấp. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                exportToCsv('chi_phi_van_hanh', filtered, [
                  { header: 'Mã chi phí', accessor: r => r.costCode },
                  { header: 'Tên khoản chi', accessor: r => r.costName },
                  { header: 'Phân loại', accessor: r => categoryMap[r.category] || r.category },
                  { header: 'Số tiền (VND)', accessor: r => r.amount },
                  { header: 'Ngày phát sinh', accessor: r => r.incurredDate },
                  { header: 'Chi nhánh', accessor: r => r.branch },
                  { header: 'Trạng thái thanh toán', accessor: r => paymentStatusMap[r.paymentStatus] || r.paymentStatus },
                  { header: 'Người duyệt', accessor: r => r.authorizedBy },
                ]);
                toast.success('Đã xuất báo cáo chi phí dạng CSV!');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất Dữ Liệu chi phí
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Ghi nhận khoản chi mới
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
              placeholder="Tìm kiếm theo mã chi phí, nội dung hoặc phòng ban..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm">
            <Filter className="w-4 h-4" /> Lọc chi phí
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedCost(row)} />
      </div>

      <Modal
        isOpen={!!selectedCost}
        onClose={() => setSelectedCost(null)}
        title={selectedCost ? `Khoản Chi: ${selectedCost.costCode}` : 'Chi tiết khoản chi'}
        width="max-w-lg"
      >
        {selectedCost && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-red-800 dark:text-red-400 font-semibold uppercase tracking-wider">Tổng khoản chi</p>
                  <p className="text-xl font-bold font-mono text-red-700 dark:text-red-400">-${selectedCost.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedCost.paymentStatus === 'PAID' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedCost.paymentStatus === 'SCHEDULED' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                selectedCost.paymentStatus === 'PENDING' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {paymentStatusMap[selectedCost.paymentStatus] || selectedCost.paymentStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building className="w-4 h-4 text-blue-500" /> Phòng ban / Đơn vị
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedCost.branch}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-amber-500" /> Ngày phát sinh
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedCost.incurredDate}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Nội dung chi:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedCost.costName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Danh mục phân bổ:</span>
                <span className="font-semibold px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100">{categoryMap[selectedCost.category] || selectedCost.category}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Nguồn ngân sách:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedCost.assignedBudget}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Người phê duyệt:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedCost.authorizedBy}</span>
              </div>

              {selectedCost.description && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Mô tả chi tiết</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedCost.description}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedCost.paymentStatus !== 'PAID' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  Duyệt & Thực hiện chi
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <FileText className="w-4 h-4 inline mr-1" /> Xem hóa đơn đính kèm
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Thêm / Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Ghi nhận chi phí vận hành mới' : 'Chỉnh sửa thông tin chi phí'}
        width="max-w-xl"
      >
        <form onSubmit={handleSaveCost} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã chi phí *</label>
              <input
                type="text"
                value={editingCost.costCode || ''}
                onChange={(e) => setEditingCost({ ...editingCost, costCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục chi phí</label>
              <select
                value={editingCost.category || 'RENTAL'}
                onChange={(e) => setEditingCost({ ...editingCost, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="RENTAL">Thuê mặt bằng</option>
                <option value="UTILITIES">Điện nước & Tiện ích</option>
                <option value="SALARY">Lương nhân sự</option>
                <option value="MARKETING">Tiếp thị & Quảng cáo</option>
                <option value="MAINTENANCE">Bảo trì & Sửa chữa</option>
                <option value="INSURANCE">Bảo hiểm</option>
                <option value="SUPPLIES">Văn phòng phẩm / Công cụ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung khoản chi *</label>
            <input
              type="text"
              value={editingCost.costName || ''}
              onChange={(e) => setEditingCost({ ...editingCost, costName: e.target.value })}
              placeholder="Tiền thuê văn phòng, Quảng cáo tháng 5..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh / Phòng ban phát sinh *</label>
              <input
                type="text"
                value={editingCost.branch || ''}
                onChange={(e) => setEditingCost({ ...editingCost, branch: e.target.value })}
                placeholder="Phòng marketing, chi nhánh quận 1..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền chi ($)</label>
              <input
                type="number"
                value={editingCost.amount ?? 0}
                onChange={(e) => setEditingCost({ ...editingCost, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày phát sinh</label>
              <input
                type="date"
                value={editingCost.incurredDate || ''}
                onChange={(e) => setEditingCost({ ...editingCost, incurredDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái thanh toán</label>
              <select
                value={editingCost.paymentStatus || 'PENDING'}
                onChange={(e) => setEditingCost({ ...editingCost, paymentStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="PAID">Đã thanh toán (Paid)</option>
                <option value="SCHEDULED">Đã lên lịch (Scheduled)</option>
                <option value="PENDING">Đang chờ xử lý (Pending)</option>
                <option value="OVERDUE">Quá hạn (Overdue)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nguồn ngân sách phân bổ</label>
              <input
                type="text"
                value={editingCost.assignedBudget || ''}
                onChange={(e) => setEditingCost({ ...editingCost, assignedBudget: e.target.value })}
                placeholder="Q2 Overhead..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người phê duyệt / Thẩm định</label>
            <input
              type="text"
              value={editingCost.authorizedBy || ''}
              onChange={(e) => setEditingCost({ ...editingCost, authorizedBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả chi tiết</label>
            <textarea
              rows={2}
              value={editingCost.description || ''}
              onChange={(e) => setEditingCost({ ...editingCost, description: e.target.value })}
              placeholder="Chi tiết về lý do chi, nhà cung cấp dịch vụ..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
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
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              {modalMode === 'create' ? 'Tạo Mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xác nhận xóa */}
      <ConfirmDeleteModal
        isOpen={!!deletingCost}
        onClose={() => setDeletingCost(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận hủy khoản chi"
        description="Bạn có chắc chắn muốn xóa hồ sơ khoản chi này không? Thao tác này sẽ gỡ bỏ dữ liệu khoản chi khỏi các báo cáo tổng hợp."
        itemName={`${deletingCost?.costCode} - ${deletingCost?.costName}`}
      />
    </>
  );
}
