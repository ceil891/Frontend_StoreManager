import { useMemo, useState, useEffect } from 'react';
import {
  Plus, Download, Search, Eye, ClipboardCheck, Building2, Calendar,
  FileText, Edit, Trash2, X, AlertTriangle,
  TrendingDown, Clock, CheckSquare, Play
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useInventoryStore,
  VARIANCE_REASON_LABELS,
  type InventoryCheckRecord,
} from '../store/inventoryStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { toast } from 'sonner';

const EMPTY_CHECK: Omit<InventoryCheckRecord, 'id'> = {
  checkCode: '',
  branchId: '1',
  branchName: 'Chi nhánh Quận 1',
  checkDate: new Date().toISOString().slice(0, 10),
  status: 'DRAFT',
  totalItems: 0,
  discrepancyCount: 0,
  netVariance: 0,
  checkedBy: '',
  notes: '',
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT:             { label: 'Bản nháp', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  IN_PROGRESS:       { label: 'Đang thực hiện', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  COMPLETED:         { label: 'Đã hoàn thành', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  CANCELLED:         { label: 'Đã hủy', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' },
};

const fmtVND = (n: number) =>
  (n < 0 ? '-' : n > 0 ? '+' : '') + Math.abs(n).toLocaleString('vi-VN') + 'đ';

export interface FormCheckLine {
  productId: number;
  sku: string;
  productName: string;
  expectedQty: number;
  actualQty: number;
  reason: string;
}

export function InventoryCheckPage() {
  const {
    inventoryChecks: audits,
    fetchInventoryChecks,
    addInventoryCheck,
    updateInventoryCheck,
    deleteInventoryCheck,
    startInventoryCheck,
    completeInventoryCheck,
    products,
    fetchProducts,
  } = useInventoryStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedAudit, setSelectedAudit] = useState<InventoryCheckRecord | null>(null);
  const [drawerTab, setDrawerTab] = useState<'info' | 'items'>('info');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingAudit, setEditingAudit] = useState<Partial<InventoryCheckRecord>>(EMPTY_CHECK);
  const [editingLines, setEditingLines] = useState<FormCheckLine[]>([]);
  const [deletingAudit, setDeletingAudit] = useState<InventoryCheckRecord | null>(null);

  useEffect(() => {
    fetchInventoryChecks();
    fetchProducts();
  }, [fetchInventoryChecks, fetchProducts]);

  // Filter
  const filtered = audits.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.checkCode.toLowerCase().includes(q) || a.branchName.toLowerCase().includes(q) || a.checkedBy.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const { branches, currentBranch } = useBranchStore();
  const currentUser = useAuthStore((s) => s.user);

  // CRUD
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingAudit({
      ...EMPTY_CHECK,
      checkCode: `CHK-${new Date().getFullYear()}-${Math.floor(500 + Math.random() * 500)}`,
      branchId: currentBranch ? String(currentBranch.id) : (branches[0] ? String(branches[0].id) : '1'),
      branchName: currentBranch ? currentBranch.branchName : (branches[0] ? branches[0].branchName : 'Chi nhánh chính'),
      checkedBy: currentUser?.fullName || currentUser?.name || 'Nhân viên kho',
    });
    setEditingLines([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: InventoryCheckRecord) => {
    setModalMode('edit');
    setEditingAudit({ ...a });
    setEditingLines(
      a.lines && a.lines.length > 0
        ? a.lines.map((l) => ({
            productId: l.productId || 0,
            sku: l.sku || '',
            productName: l.productName || '',
            expectedQty: l.expectedQty ?? 0,
            actualQty: l.actualQty ?? 0,
            reason: l.reason || '',
          }))
        : []
    );
    setIsModalOpen(true);
  };

  const resolveBranchId = (name?: string): number => {
    if (!name) return currentBranch?.id ? Number(currentBranch.id) : 1;
    const match = branches.find(
      (b) => b.branchName.toLowerCase() === name.toLowerCase() || String(b.id) === name
    );
    if (match) return Number(match.id);
    return currentBranch?.id ? Number(currentBranch.id) : 1;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAudit.checkCode || !editingAudit.branchName) {
      toast.error('Vui lòng nhập mã kiểm kê và chọn chi nhánh');
      return;
    }

    const checkLines = editingLines.map((line) => ({
      productId: line.productId,
      sku: line.sku,
      productName: line.productName,
      systemQty: Number(line.expectedQty || 0),
      actualQty: Number(line.actualQty || 0),
      diffQty: Number(line.actualQty || 0) - Number(line.expectedQty || 0),
      reason: line.reason || 'Kiểm kê',
    }));

    const payload = {
      checkCode: editingAudit.checkCode,
      branchId: resolveBranchId(editingAudit.branchName),
      checkDate: editingAudit.checkDate || new Date().toISOString().slice(0, 10),
      notes: editingAudit.notes || '',
      checkLines,
    };
    try {
      if (modalMode === 'create') {
        await addInventoryCheck(payload);
        toast.success('Tạo đợt kiểm kê thành công!');
      } else if (editingAudit.id) {
        await updateInventoryCheck(editingAudit.id, payload);
        toast.success('Cập nhật đợt kiểm kê thành công!');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Không thể lưu đợt kiểm kê');
    }
  };

  const handleStart = async (id: string) => {
    await startInventoryCheck(id);
    setSelectedAudit(null);
  };

  const handleComplete = async (id: string) => {
    await completeInventoryCheck(id);
    setSelectedAudit(null);
  };

  // KPI
  const totalDiscrepancy = audits.reduce((s, a) => s + (a.discrepancyCount || 0), 0);
  const totalVarianceValue = audits.reduce((s, a) => s + (a.netVariance || 0), 0);
  const pendingReview = audits.filter(a => a.status === 'IN_PROGRESS').length;

  const columns = useMemo<ColumnDef<InventoryCheckRecord>[]>(() => [
    {
      accessorKey: 'checkCode',
      header: 'Mã kỳ kiểm kê',
      cell: info => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'branchName',
      header: 'Chi nhánh / Kho',
      cell: info => (
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="font-medium text-gray-900 dark:text-white text-sm">{info.getValue() as string}</span>
        </div>
      ),
    },
    {
      accessorKey: 'totalItems',
      header: 'Số lượng sản phẩm',
      cell: ({ row }) => (
        <div className="text-sm">
          <span className="font-bold text-gray-900 dark:text-white">{(row.original.totalItems || 0).toLocaleString()}</span>
          {(row.original.discrepancyCount || 0) > 0 && (
            <span className="ml-1.5 text-xs text-red-600 font-semibold">({row.original.discrepancyCount} lệch)</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'netVariance',
      header: 'Chênh lệch giá trị',
      cell: ({ row }) => {
        const val = row.original.netVariance || 0;
        return (
          <span className={`font-mono font-bold text-sm ${val > 0 ? 'text-emerald-600' : val < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {val === 0 ? 'Không có' : fmtVND(val)}
          </span>
        );
      },
    },
    {
      accessorKey: 'checkDate',
      header: 'Ngày kiểm kê',
      cell: info => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: info => {
        const cfg = STATUS_MAP[info.getValue() as string];
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg?.cls || ''}`}>{cfg?.label || info.getValue() as string}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={e => { e.stopPropagation(); setDrawerTab('info'); setSelectedAudit(row.original); }}
            className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={e => { e.stopPropagation(); handleOpenEdit(row.original); }}
            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={e => { e.stopPropagation(); setDeletingAudit(row.original); }}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], [audits]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kiểm kê & Đối soát Tồn kho</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Lên lịch kiểm kê, so sánh tồn kho thực tế và hệ thống, xử lý chênh lệch số liệu.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Lên lịch kiểm kê
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Tổng kỳ kiểm kê</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{audits.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Đang thực hiện</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{pendingReview}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Tổng SKU lệch</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{totalDiscrepancy}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${totalVarianceValue <= 0 ? 'bg-red-50 dark:bg-red-900/30 text-red-600' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'}`}>
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Giá trị chênh lệch</p>
              <p className={`text-sm font-black ${totalVarianceValue <= 0 ? 'text-red-500' : 'text-emerald-600'}`}>{fmtVND(totalVarianceValue)}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo mã kiểm kê, chi nhánh, kiểm toán viên..."
              className="block w-full sm:max-w-md pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 sm:text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="IN_PROGRESS">Đang thực hiện</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          {(search || statusFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="flex items-center gap-1 px-3 py-2 text-xs text-red-500 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 font-semibold transition-colors">
              <X className="w-3.5 h-3.5" /> Xóa lọc
            </button>
          )}
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={row => { setDrawerTab('info'); setSelectedAudit(row); }} />
      </div>

      {/* ═══ Modal: Chi tiết kỳ kiểm kê ═══ */}
      <Modal
        isOpen={!!selectedAudit}
        onClose={() => setSelectedAudit(null)}
        title={selectedAudit ? `Chi tiết kiểm kê: ${selectedAudit.checkCode}` : 'Chi tiết kỳ kiểm kê'}
        width="max-w-xl"
      >
        {selectedAudit && (() => {
          const cfg = STATUS_MAP[selectedAudit.status];
          const varVal = selectedAudit.netVariance || 0;
          return (
            <div className="space-y-5">
              {/* Header card */}
              <div className={`flex items-center justify-between p-4 rounded-xl border ${varVal < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${varVal < 0 ? 'bg-red-600' : 'bg-emerald-600'}`}>
                    <ClipboardCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${varVal < 0 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>Giá trị chênh lệch</p>
                    <p className={`text-xl font-black ${varVal < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {varVal === 0 ? 'Không có chênh lệch' : fmtVND(varVal)}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>{cfg.label}</span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                {[
                  { key: 'info' as const, label: 'Thông tin chung' },
                  { key: 'items' as const, label: 'Danh sách sản phẩm kiểm kê' },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setDrawerTab(tab.key)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${drawerTab === tab.key ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB: Thông tin */}
              {drawerTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><Building2 className="w-3.5 h-3.5" />Chi nhánh / Kho</div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedAudit.branchName}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><Calendar className="w-3.5 h-3.5" />Ngày kiểm kê</div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedAudit.checkDate}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 text-sm overflow-hidden">
                    {[
                      { label: 'Tổng số lượng sản phẩm', value: `${selectedAudit.totalItems.toLocaleString()} items` },
                      { label: 'Số lượng sản phẩm lệch', value: selectedAudit.discrepancyCount > 0 ? <span className="text-red-600 font-bold">{selectedAudit.discrepancyCount} items</span> : <span className="text-emerald-600 font-semibold">Không có</span> },
                      { label: 'Người thực hiện', value: selectedAudit.checkedBy || 'Chưa xác định' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center px-4 py-2.5">
                        <span className="text-gray-500 dark:text-gray-400">{label}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
                      </div>
                    ))}
                  </div>

                  {selectedAudit.notes && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 rounded-xl p-3">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Ghi chú kiểm kê</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedAudit.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    {selectedAudit.status === 'DRAFT' && (
                      <button onClick={() => handleStart(selectedAudit.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors shadow animate-pulse">
                        <Play className="w-4 h-4" /> Bắt đầu kiểm kê thực tế
                      </button>
                    )}
                    {selectedAudit.status === 'IN_PROGRESS' && (
                      <button onClick={() => handleComplete(selectedAudit.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-colors shadow">
                        <CheckSquare className="w-4 h-4" /> Hoàn tất & Điều chỉnh tồn kho
                      </button>
                    )}
                    <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 text-sm transition-colors">
                      <FileText className="w-4 h-4 inline mr-1" /> In biên bản
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: Danh sách sản phẩm kiểm kê */}
              {drawerTab === 'items' && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-xs text-left text-gray-700 dark:text-gray-300">
                      <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 uppercase font-semibold text-[10px]">
                        <tr>
                          <th className="px-3 py-2.5">Sản phẩm / SKU</th>
                          <th className="px-3 py-2.5 text-center">Tồn hệ thống</th>
                          <th className="px-3 py-2.5 text-center">Tồn thực tế</th>
                          <th className="px-3 py-2.5 text-center">Chênh lệch</th>
                          <th className="px-3 py-2.5">Ghi chú / Lý do</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono">
                        {(!selectedAudit?.lines || selectedAudit.lines.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-gray-400 dark:text-gray-500 italic">
                              Chưa có dữ liệu sản phẩm trong đợt kiểm kê này.
                            </td>
                          </tr>
                        ) : (
                          selectedAudit.lines.map((item: any, idx: number) => {
                            const diff = (item.actualQty ?? 0) - (item.expectedQty ?? 0);
                            return (
                              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-3 py-2.5 font-sans font-medium">
                                  <p className="font-bold text-gray-900 dark:text-white">{item.productName || item.sku || 'Sản phẩm'}</p>
                                  <span className="text-[10px] text-gray-400 font-mono">{item.sku}</span>
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold">{item.expectedQty ?? 0}</td>
                                <td className="px-3 py-2.5 text-center font-bold text-blue-600 dark:text-blue-400">{item.actualQty ?? 0}</td>
                                <td className={`px-3 py-2.5 text-center font-bold ${diff < 0 ? 'text-red-600 dark:text-red-400' : diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                                  {diff > 0 ? `+${diff}` : diff}
                                </td>
                                <td className="px-3 py-2.5 font-sans text-gray-500 italic text-[11px]">{item.reason || 'Khớp'}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Modal: Tạo / Sửa */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Lên lịch Kiểm kê mới' : `Chỉnh sửa: ${editingAudit.checkCode}`}
        width="max-w-3xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Mã kỳ kiểm kê *</label>
              <input required type="text" value={editingAudit.checkCode || ''} onChange={e => setEditingAudit({ ...editingAudit, checkCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Ngày kiểm kê</label>
              <input type="date" value={editingAudit.checkDate || ''} onChange={e => setEditingAudit({ ...editingAudit, checkDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Chi nhánh / Kho kiểm *</label>
            {branches && branches.length > 0 ? (
              <select
                value={editingAudit.branchId || (branches[0] ? String(branches[0].id) : '')}
                onChange={(e) => {
                  const selectedBranch = branches.find(b => String(b.id) === e.target.value);
                  setEditingAudit({
                    ...editingAudit,
                    branchId: e.target.value,
                    branchName: selectedBranch ? selectedBranch.branchName : e.target.value,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {branches.map(b => (
                  <option key={b.id} value={String(b.id)}>{b.branchName}</option>
                ))}
              </select>
            ) : (
              <input required type="text" value={editingAudit.branchName || ''} onChange={e => setEditingAudit({ ...editingAudit, branchName: e.target.value })}
                placeholder="VD: Chi nhánh Quận 1, Chi nhánh Quận 2..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500" />
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Ghi chú</label>
            <textarea rows={2} value={editingAudit.notes || ''} onChange={e => setEditingAudit({ ...editingAudit, notes: e.target.value })}
              placeholder="Phạm vi kiểm kê, ghi chú đặc biệt..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>

          {/* Danh sách sản phẩm kiểm kê */}
          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Danh sách mặt hàng kiểm kê ({editingLines.length})
              </label>
              <button
                type="button"
                onClick={() => {
                  const available = products.find(p => !editingLines.some(l => Number(l.productId) === Number(p.id)));
                  const prod = available || products[0];
                  if (prod) {
                    const sysQty = prod.stockQuantity ?? (prod as any).stock ?? (prod as any).onHand ?? 0;
                    setEditingLines([
                      ...editingLines,
                      {
                        productId: Number(prod.id),
                        sku: prod.sku || '',
                        productName: prod.name || '',
                        expectedQty: Number(sysQty),
                        actualQty: Number(sysQty),
                        reason: '',
                      }
                    ]);
                  } else {
                    toast.info('Không tìm thấy sản phẩm trong danh mục');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm sản phẩm
              </button>
            </div>

            {editingLines.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-3 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                Chưa có mặt hàng nào. Nhấn "+ Thêm sản phẩm" để thêm mặt hàng cần kiểm kê.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase text-[10px]">
                    <tr>
                      <th className="px-2.5 py-2">Sản phẩm</th>
                      <th className="px-2.5 py-2 text-center w-20">Tồn HT</th>
                      <th className="px-2.5 py-2 text-center w-24">Tồn TT</th>
                      <th className="px-2.5 py-2 text-center w-20">Lệch</th>
                      <th className="px-2.5 py-2">Lý do</th>
                      <th className="px-1 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {editingLines.map((line, idx) => {
                      const diff = line.actualQty - line.expectedQty;
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                          <td className="px-2.5 py-1.5">
                            <select
                              value={line.productId}
                              onChange={(e) => {
                                const selectedProd = products.find(p => Number(p.id) === Number(e.target.value));
                                if (selectedProd) {
                                  const sysQty = selectedProd.stockQuantity ?? (selectedProd as any).stock ?? (selectedProd as any).onHand ?? 0;
                                  const updated = [...editingLines];
                                  updated[idx] = {
                                    ...updated[idx],
                                    productId: Number(selectedProd.id),
                                    sku: selectedProd.sku || '',
                                    productName: selectedProd.name || '',
                                    expectedQty: Number(sysQty),
                                    actualQty: Number(sysQty),
                                  };
                                  setEditingLines(updated);
                                }
                              }}
                              className="w-full max-w-[200px] text-xs p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 truncate"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2.5 py-1.5 text-center font-bold font-mono">
                            {line.expectedQty}
                          </td>
                          <td className="px-2.5 py-1.5 text-center">
                            <input
                              type="number"
                              min="0"
                              value={line.actualQty}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = [...editingLines];
                                updated[idx] = { ...updated[idx], actualQty: val };
                                setEditingLines(updated);
                              }}
                              className="w-20 px-1.5 py-1 text-center font-mono font-bold text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                            />
                          </td>
                          <td className={`px-2.5 py-1.5 text-center font-mono font-bold ${diff < 0 ? 'text-red-500' : diff > 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                            {diff > 0 ? `+${diff}` : diff}
                          </td>
                          <td className="px-2.5 py-1.5">
                            <input
                              type="text"
                              placeholder="Lý do..."
                              value={line.reason}
                              onChange={(e) => {
                                const updated = [...editingLines];
                                updated[idx] = { ...updated[idx], reason: e.target.value };
                                setEditingLines(updated);
                              }}
                              className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                            />
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLines(editingLines.filter((_, i) => i !== idx));
                              }}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 font-medium rounded-lg text-sm">
              Hủy bỏ
            </button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow text-sm">
              {modalMode === 'create' ? 'Tạo kỳ kiểm kê' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xóa */}
      <Modal isOpen={!!deletingAudit} onClose={() => setDeletingAudit(null)} title="Xác nhận xóa kỳ kiểm kê" isDestructive width="max-w-md">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Bạn có chắc muốn xóa kỳ kiểm kê <strong className="text-gray-900 dark:text-white">"{deletingAudit?.checkCode}"</strong>? Hành động này không thể hoàn tác.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setDeletingAudit(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 font-medium rounded-lg text-sm">
              Hủy bỏ
            </button>
            <button type="button"
              onClick={() => { if (deletingAudit) deleteInventoryCheck(deletingAudit.id); setDeletingAudit(null); }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm">
              Xóa kỳ kiểm kê
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
