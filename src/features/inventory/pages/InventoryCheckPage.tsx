import { useMemo, useState } from 'react';
import {
  Plus, Download, Search, Eye, ClipboardCheck, Building2, Calendar,
  FileText, Edit, Trash2, X, AlertTriangle,
  TrendingDown, Clock, CheckSquare,
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

// ── Types ─────────────────────────────────────────────────────────────────────
interface InventoryAuditSession {
  id: string;
  auditNumber: string;
  storeLocation: string;
  scheduledDate: string;
  executionDate?: string;
  type: 'FULL_STORE' | 'CYCLE_COUNT' | 'CATEGORY_SPECIFIC' | 'DISCREPANCY_SPOT_CHECK';
  totalSkusCounted: number;
  discrepancySkusCount: number;
  netValuationVariance: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'RECONCILED_CLOSED';
  leadAuditor: string;
  notes?: string;
}

// Chi tiết sản phẩm được kiểm kê (mock)
interface AuditLineItem {
  sku: string;
  name: string;
  systemQty: number;
  actualQty: number;
  variance: number;
  unitCost: number;
}

const MOCK_LINE_ITEMS: AuditLineItem[] = [
  { sku: 'SV-001', name: 'Sữa Vinamilk 1L', systemQty: 120, actualQty: 118, variance: -2, unitCost: 29000 },
  { sku: 'BH-002', name: 'Bia Heineken 330ml', systemQty: 200, actualQty: 200, variance: 0, unitCost: 14000 },
  { sku: 'GS-003', name: 'Gạo ST25 5kg', systemQty: 45, actualQty: 42, variance: -3, unitCost: 155000 },
  { sku: 'NM-004', name: 'Nước mắm Chinsu 500ml', systemQty: 88, actualQty: 90, variance: +2, unitCost: 22000 },
  { sku: 'MG-005', name: 'Mì gói Hảo Hảo', systemQty: 500, actualQty: 488, variance: -12, unitCost: 5500 },
  { sku: 'CF-009', name: 'Cà phê G7 3in1', systemQty: 60, actualQty: 60, variance: 0, unitCost: 52000 },
];

const INITIAL_AUDITS: InventoryAuditSession[] = [
  { id: '1', auditNumber: 'KK-2024-501', storeLocation: 'CH Quận 1 – Trung tâm', scheduledDate: '2024-05-15', executionDate: '2024-05-16', type: 'FULL_STORE', totalSkusCounted: 4500, discrepancySkusCount: 12, netValuationVariance: -350000, status: 'RECONCILED_CLOSED', leadAuditor: 'Nguyễn Minh Châu', notes: 'Kiểm kê toàn bộ kho tháng 5. Chênh lệch nhỏ ở khu hàng đóng gói.' },
  { id: '2', auditNumber: 'KK-2024-502', storeLocation: 'Kho Trung tâm phân phối', scheduledDate: '2024-05-17', executionDate: '2024-05-17', type: 'CYCLE_COUNT', totalSkusCounted: 1850, discrepancySkusCount: 15, netValuationVariance: -123000, status: 'UNDER_REVIEW', leadAuditor: 'Trần Đức Anh', notes: 'Kiểm định kỳ khu hàng giá trị cao. Đang chờ phê duyệt kết quả.' },
  { id: '3', auditNumber: 'KK-2024-503', storeLocation: 'CH Tân Bình', scheduledDate: '2024-05-18', type: 'CATEGORY_SPECIFIC', totalSkusCounted: 350, discrepancySkusCount: 0, netValuationVariance: 0, status: 'IN_PROGRESS', leadAuditor: 'Lê Thị Hương', notes: 'Kiểm danh mục đồ uống và hàng mới nhập tháng 5.' },
  { id: '4', auditNumber: 'KK-2024-504', storeLocation: 'CH Quận 7', scheduledDate: '2024-05-20', type: 'DISCREPANCY_SPOT_CHECK', totalSkusCounted: 0, discrepancySkusCount: 0, netValuationVariance: 0, status: 'SCHEDULED', leadAuditor: 'Phạm Văn Bình', notes: 'Kiểm tra đột xuất sau cảnh báo lệch số liệu từ POS.' },
];

const EMPTY_AUDIT: Omit<InventoryAuditSession, 'id'> = {
  auditNumber: '',
  storeLocation: '',
  scheduledDate: new Date().toISOString().slice(0, 10),
  type: 'FULL_STORE',
  totalSkusCounted: 0,
  discrepancySkusCount: 0,
  netValuationVariance: 0,
  status: 'SCHEDULED',
  leadAuditor: '',
  notes: '',
};

const TYPE_MAP: Record<string, string> = {
  FULL_STORE: 'Toàn bộ kho',
  CYCLE_COUNT: 'Kiểm kê định kỳ',
  CATEGORY_SPECIFIC: 'Theo danh mục',
  DISCREPANCY_SPOT_CHECK: 'Kiểm tra đột xuất',
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  SCHEDULED:         { label: 'Đã lên lịch', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  IN_PROGRESS:       { label: 'Đang thực hiện', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  UNDER_REVIEW:      { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  RECONCILED_CLOSED: { label: 'Đã cân bằng', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
};

const fmtVND = (n: number) =>
  (n < 0 ? '-' : n > 0 ? '+' : '') + Math.abs(n).toLocaleString('vi-VN') + 'đ';

// ─────────────────────────────────────────────────────────────────────────────
export function InventoryCheckPage() {
  const [audits, setAudits] = useState<InventoryAuditSession[]>(INITIAL_AUDITS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedAudit, setSelectedAudit] = useState<InventoryAuditSession | null>(null);
  const [drawerTab, setDrawerTab] = useState<'info' | 'items'>('info');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingAudit, setEditingAudit] = useState<Partial<InventoryAuditSession>>(EMPTY_AUDIT);
  const [deletingAudit, setDeletingAudit] = useState<InventoryAuditSession | null>(null);

  // Filter
  const filtered = audits.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.auditNumber.toLowerCase().includes(q) || a.storeLocation.toLowerCase().includes(q) || a.leadAuditor.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // CRUD
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingAudit({
      ...EMPTY_AUDIT,
      auditNumber: `KK-${new Date().getFullYear()}-${Math.floor(500 + Math.random() * 500)}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: InventoryAuditSession) => {
    setModalMode('edit');
    setEditingAudit({ ...a });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAudit.auditNumber || !editingAudit.storeLocation) return;
    if (modalMode === 'create') {
      const newAudit: InventoryAuditSession = {
        id: Date.now().toString(),
        auditNumber: editingAudit.auditNumber!,
        storeLocation: editingAudit.storeLocation!,
        scheduledDate: editingAudit.scheduledDate || new Date().toISOString().slice(0, 10),
        type: editingAudit.type || 'FULL_STORE',
        totalSkusCounted: editingAudit.totalSkusCounted || 0,
        discrepancySkusCount: editingAudit.discrepancySkusCount || 0,
        netValuationVariance: editingAudit.netValuationVariance || 0,
        status: editingAudit.status || 'SCHEDULED',
        leadAuditor: editingAudit.leadAuditor || '',
        notes: editingAudit.notes,
      };
      setAudits([...audits, newAudit]);
    } else {
      setAudits(audits.map(a => a.id === editingAudit.id ? { ...a, ...editingAudit } as InventoryAuditSession : a));
    }
    setIsModalOpen(false);
  };

  const handleApprove = (id: string) => {
    setAudits(audits.map(a => a.id === id ? { ...a, status: 'RECONCILED_CLOSED' } : a));
    setSelectedAudit(null);
  };

  // KPI
  const totalDiscrepancy = audits.reduce((s, a) => s + a.discrepancySkusCount, 0);
  const totalVarianceValue = audits.reduce((s, a) => s + a.netValuationVariance, 0);
  const pendingReview = audits.filter(a => a.status === 'UNDER_REVIEW').length;

  const columns = useMemo<ColumnDef<InventoryAuditSession>[]>(() => [
    {
      accessorKey: 'auditNumber',
      header: 'Mã kỳ kiểm kê',
      cell: info => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'storeLocation',
      header: 'Chi nhánh / Kho',
      cell: info => (
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="font-medium text-gray-900 dark:text-white text-sm">{info.getValue() as string}</span>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Loại kiểm kê',
      cell: info => (
        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md font-semibold">
          {TYPE_MAP[info.getValue() as string] || info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'totalSkusCounted',
      header: 'SKU đã kiểm',
      cell: ({ row }) => (
        <div className="text-sm">
          <span className="font-bold text-gray-900 dark:text-white">{row.original.totalSkusCounted.toLocaleString()}</span>
          {row.original.discrepancySkusCount > 0 && (
            <span className="ml-1.5 text-xs text-red-600 font-semibold">({row.original.discrepancySkusCount} lệch)</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'netValuationVariance',
      header: 'Chênh lệch giá trị',
      cell: ({ row }) => {
        const val = row.original.netValuationVariance;
        return (
          <span className={`font-mono font-bold text-sm ${val > 0 ? 'text-emerald-600' : val < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {val === 0 ? 'Không có' : fmtVND(val)}
          </span>
        );
      },
    },
    {
      accessorKey: 'scheduledDate',
      header: 'Ngày lên lịch',
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
              <p className="text-xs text-gray-400 font-medium">Chờ phê duyệt</p>
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
            <option value="SCHEDULED">Đã lên lịch</option>
            <option value="IN_PROGRESS">Đang thực hiện</option>
            <option value="UNDER_REVIEW">Chờ phê duyệt</option>
            <option value="RECONCILED_CLOSED">Đã cân bằng</option>
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

      {/* ═══ Drawer: Chi tiết kỳ kiểm kê ═══ */}
      <Drawer
        isOpen={!!selectedAudit}
        onClose={() => setSelectedAudit(null)}
        title={selectedAudit ? `Chi tiết kiểm kê: ${selectedAudit.auditNumber}` : 'Chi tiết kỳ kiểm kê'}
        width="max-w-xl"
      >
        {selectedAudit && (() => {
          const cfg = STATUS_MAP[selectedAudit.status];
          const varVal = selectedAudit.netValuationVariance;
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
                {[{ key: 'info' as const, label: 'Thông tin chung' }, { key: 'items' as const, label: 'Chi tiết sản phẩm' }].map(tab => (
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
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedAudit.storeLocation}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><Calendar className="w-3.5 h-3.5" />Ngày lên lịch</div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedAudit.scheduledDate}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 text-sm overflow-hidden">
                    {[
                      { label: 'Loại kiểm kê', value: TYPE_MAP[selectedAudit.type] },
                      { label: 'Tổng SKU đã kiểm', value: `${selectedAudit.totalSkusCounted.toLocaleString()} SKU` },
                      { label: 'Số SKU lệch số', value: selectedAudit.discrepancySkusCount > 0 ? <span className="text-red-600 font-bold">{selectedAudit.discrepancySkusCount} SKU</span> : <span className="text-emerald-600 font-semibold">Không có</span> },
                      { label: 'Ngày thực hiện', value: selectedAudit.executionDate || 'Chưa thực hiện' },
                      { label: 'Kiểm toán viên', value: selectedAudit.leadAuditor },
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
                    {selectedAudit.status === 'UNDER_REVIEW' && (
                      <button onClick={() => handleApprove(selectedAudit.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-colors shadow">
                        <CheckSquare className="w-4 h-4" /> Phê duyệt & Đóng kỳ kiểm kê
                      </button>
                    )}
                    <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 text-sm transition-colors">
                      <FileText className="w-4 h-4 inline mr-1" /> In biên bản
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: Chi tiết sản phẩm */}
              {drawerTab === 'items' && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">So sánh tồn kho Thực tế vs Hệ thống</p>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {MOCK_LINE_ITEMS.map(item => (
                      <div key={item.sku} className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${item.variance !== 0 ? 'border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{item.sku}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-gray-500">HT: <span className="font-bold text-gray-700 dark:text-gray-300">{item.systemQty}</span></span>
                            <span className="text-gray-500">TT: <span className="font-bold text-gray-700 dark:text-gray-300">{item.actualQty}</span></span>
                            <span className={`font-black text-sm ${item.variance > 0 ? 'text-emerald-600' : item.variance < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                              {item.variance === 0 ? '±0' : item.variance > 0 ? `+${item.variance}` : item.variance}
                            </span>
                          </div>
                          {item.variance !== 0 && (
                            <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                              {fmtVND(item.variance * item.unitCost)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Drawer>

      {/* Modal: Tạo / Sửa */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Lên lịch Kiểm kê mới' : `Chỉnh sửa: ${editingAudit.auditNumber}`}
        width="max-w-xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Mã kỳ kiểm kê *</label>
              <input required type="text" value={editingAudit.auditNumber || ''} onChange={e => setEditingAudit({ ...editingAudit, auditNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Ngày lên lịch</label>
              <input type="date" value={editingAudit.scheduledDate || ''} onChange={e => setEditingAudit({ ...editingAudit, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Chi nhánh / Kho kiểm *</label>
            <input required type="text" value={editingAudit.storeLocation || ''} onChange={e => setEditingAudit({ ...editingAudit, storeLocation: e.target.value })}
              placeholder="VD: CH Quận 1, Kho Trung tâm..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Loại kiểm kê</label>
              <select value={editingAudit.type || 'FULL_STORE'} onChange={e => setEditingAudit({ ...editingAudit, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
                {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Trạng thái</label>
              <select value={editingAudit.status || 'SCHEDULED'} onChange={e => setEditingAudit({ ...editingAudit, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Kiểm toán viên chủ trì</label>
            <input type="text" value={editingAudit.leadAuditor || ''} onChange={e => setEditingAudit({ ...editingAudit, leadAuditor: e.target.value })}
              placeholder="Họ tên kiểm toán viên..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Ghi chú</label>
            <textarea rows={2} value={editingAudit.notes || ''} onChange={e => setEditingAudit({ ...editingAudit, notes: e.target.value })}
              placeholder="Phạm vi kiểm kê, ghi chú đặc biệt..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
              Bạn có chắc muốn xóa kỳ kiểm kê <strong className="text-gray-900 dark:text-white">"{deletingAudit?.auditNumber}"</strong>? Hành động này không thể hoàn tác.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setDeletingAudit(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 font-medium rounded-lg text-sm">
              Hủy bỏ
            </button>
            <button type="button"
              onClick={() => { setAudits(audits.filter(a => a.id !== deletingAudit?.id)); setDeletingAudit(null); }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm">
              Xóa kỳ kiểm kê
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
