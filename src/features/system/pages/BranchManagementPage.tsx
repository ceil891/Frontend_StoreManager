import { useMemo, useState, useEffect } from 'react';
import {
  Plus, Download, Store, MapPin, Users, Activity, Search,
  Edit, Trash2, Phone, Target, TrendingUp, X, CheckCircle2,
  AlertTriangle, Wrench,
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { recordActivity } from '@/shared/utils/activityLogger';
import { useBranchStore } from '../store/branchStore';
import { useUserStore } from '@/features/hr/store/userStore';

// --- TYPES ---
interface Branch {
  id: string;
  name: string;
  location: string;
  phone: string;
  manager: string;
  managerId?: string;
  employeesCount: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  revenueTarget: number;
  currentRevenue: number;
  openedDate: string;
  branchCode: string;
}

// --- INITIAL DATA ---
const INITIAL_BRANCHES: Branch[] = [];

const EMPTY_BRANCH: Omit<Branch, 'id'> = {
  name: '',
  location: '',
  phone: '',
  manager: '',
  managerId: '',
  employeesCount: 0,
  status: 'ACTIVE',
  revenueTarget: 0,
  currentRevenue: 0,
  openedDate: new Date().toISOString().slice(0, 10),
  branchCode: '',
};

// --- HELPERS ---
const fmt = (n: number) => `${(n / 1000000).toFixed(0)} tr`;
const fmtFull = (n: number) => n.toLocaleString('vi-VN') + 'đ';

const STATUS_CONFIG = {
  ACTIVE:      { label: 'Hoạt động',  className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  INACTIVE:    { label: 'Đóng cửa',   className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: X },
  MAINTENANCE: { label: 'Bảo trì',    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Wrench },
};

export function BranchManagementPage() {
  const { branches, fetchBranches, addBranch, updateBranch, deleteBranch } = useBranchStore();
  const { users, fetchUsers } = useUserStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchBranches();
    fetchUsers();
  }, [fetchBranches, fetchUsers]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingBranch, setEditingBranch] = useState<Partial<Branch>>(EMPTY_BRANCH);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [viewingBranch, setViewingBranch] = useState<Branch | null>(null);

  // --- Filter ---
  const filteredData = branches.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.location.toLowerCase().includes(search.toLowerCase()) ||
      b.manager.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // --- CRUD Handlers ---
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingBranch({
      ...EMPTY_BRANCH,
      branchCode: `BR-${String(branches.length + 1).padStart(3, '0')}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setModalMode('edit');
    setEditingBranch({ ...branch });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch.name || !editingBranch.location) return;

    const selectedManager = users.find(u => u.id === editingBranch.managerId);
    const managerName = selectedManager ? selectedManager.fullName : '—';

    if (modalMode === 'create') {
      await addBranch({
        branchCode: editingBranch.branchCode || `BR-${Date.now().toString().slice(-4)}`,
        name: editingBranch.name,
        location: editingBranch.location,
        phone: editingBranch.phone || '',
        manager: managerName,
        managerId: editingBranch.managerId,
        status: editingBranch.status || 'ACTIVE',
        revenueTarget: editingBranch.revenueTarget || 300000000,
        openedDate: editingBranch.openedDate || new Date().toISOString().split('T')[0],
      });
      recordActivity({
        actionType: 'CREATE',
        moduleName: 'Hệ thống',
        pageName: 'Quản lý chi nhánh',
        entityType: 'Branch',
        entityId: editingBranch.branchCode || 'NEW',
        entityLabel: editingBranch.name,
        description: `Thêm chi nhánh ${editingBranch.name}, QL ${managerName}.`,
        changedFields: ['name', 'location', 'manager', 'status'],
      });
    } else {
      if (editingBranch.id) {
        await updateBranch(editingBranch.id, {
          branchCode: editingBranch.branchCode,
          name: editingBranch.name,
          location: editingBranch.location,
          phone: editingBranch.phone,
          manager: managerName,
          managerId: editingBranch.managerId,
          status: editingBranch.status,
          revenueTarget: editingBranch.revenueTarget,
          openedDate: editingBranch.openedDate,
        });
        recordActivity({
          actionType: 'UPDATE',
          moduleName: 'Hệ thống',
          pageName: 'Quản lý chi nhánh',
          entityType: 'Branch',
          entityId: editingBranch.id,
          entityLabel: editingBranch.name,
          description: `Sửa thông tin chi nhánh ${editingBranch.name}.`,
          changedFields: ['name', 'location', 'manager', 'status', 'revenueTarget'],
        });
      }
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBranch) return;
    await deleteBranch(deletingBranch.id);
    recordActivity({
      actionType: 'DELETE',
      moduleName: 'Hệ thống',
      pageName: 'Quản lý chi nhánh',
      entityType: 'Branch',
      entityId: deletingBranch.id,
      entityLabel: deletingBranch.name,
      description: `Xóa chi nhánh ${deletingBranch.name}.`,
    });
    setDeletingBranch(null);
  };

  const handleViewBranch = (branch: Branch) => {
    setViewingBranch(branch);
    recordActivity({
      actionType: 'VIEW',
      moduleName: 'Hệ thống',
      pageName: 'Quản lý chi nhánh',
      entityType: 'Branch',
      entityId: branch.id,
      entityLabel: branch.name,
      description: `Xem chi tiết chi nhánh ${branch.name}.`,
    });
  };

  // --- KPI summary ---
  const totalRevenue = branches.reduce((s, b) => s + b.currentRevenue, 0);
  const totalTarget = branches.reduce((s, b) => s + b.revenueTarget, 0);
  const activeCount = branches.filter(b => b.status === 'ACTIVE').length;
  const totalEmployees = branches.reduce((s, b) => s + b.employeesCount, 0);

  // --- Columns ---
  const columns = useMemo<ColumnDef<Branch>[]>(() => [
    {
      accessorKey: 'id',
      header: 'Mã CH',
      cell: info => <span className="font-mono text-xs font-bold text-gray-400">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Tên chi nhánh',
      cell: info => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">{info.getValue() as string}</p>
            <p className="text-[11px] text-gray-400 font-mono">{info.row.original.phone}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Địa chỉ',
      cell: info => (
        <div className="flex items-start gap-1.5 text-gray-600 dark:text-gray-400 text-sm max-w-[200px]">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-400" />
          <span className="truncate">{info.getValue() as string}</span>
        </div>
      ),
    },
    {
      accessorKey: 'manager',
      header: 'Cửa hàng trưởng',
      cell: info => (
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-bold">
            {(info.getValue() as string).charAt(0)}
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{info.getValue() as string}</span>
        </div>
      ),
    },
    {
      accessorKey: 'employeesCount',
      header: 'Nhân sự',
      cell: info => (
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
          <Users className="w-3.5 h-3.5" />
          <span className="font-semibold">{info.getValue() as number}</span>
          <span className="text-xs text-gray-400">NV</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: info => {
        const status = info.getValue() as keyof typeof STATUS_CONFIG;
        const cfg = STATUS_CONFIG[status];
        const Icon = cfg.icon;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
        );
      },
    },
    {
      id: 'performance',
      header: 'KPI Doanh thu',
      cell: ({ row }) => {
        const { currentRevenue, revenueTarget } = row.original;
        const percent = revenueTarget > 0 ? Math.min((currentRevenue / revenueTarget) * 100, 100) : 0;
        const color = percent >= 100 ? 'bg-emerald-500' : percent >= 70 ? 'bg-indigo-500' : percent >= 40 ? 'bg-amber-400' : 'bg-red-500';
        return (
          <div className="w-36">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-gray-700 dark:text-gray-300">{fmt(currentRevenue)}</span>
              <span className={`font-bold text-xs ${percent >= 100 ? 'text-emerald-500' : 'text-gray-400'}`}>{percent.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percent}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Mục tiêu: {fmt(revenueTarget)}</p>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleViewBranch(row.original); }}
            title="Xem chi tiết"
            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); handleOpenEdit(row.original); }}
            title="Chỉnh sửa"
            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setDeletingBranch(row.original); }}
            title="Xóa"
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], [branches]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Chi nhánh</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý và theo dõi hiệu suất toàn bộ hệ thống chuỗi cửa hàng.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
              <Download className="w-4 h-4" />
              Xuất excel
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Thêm chi nhánh
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Store className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs text-gray-500 font-medium">Tổng chi nhánh</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{branches.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs text-gray-500 font-medium">Đang hoạt động</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{activeCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Users className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs text-gray-500 font-medium">Tổng nhân sự</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{totalEmployees}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs text-gray-500 font-medium">Tổng doanh thu</span>
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-white">{fmt(totalRevenue)}đ</p>
            <p className="text-xs text-gray-400 mt-0.5">/ {fmt(totalTarget)}đ mục tiêu</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, địa chỉ, quản lý..."
              className="block w-full sm:max-w-md pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="MAINTENANCE">Đang bảo trì</option>
            <option value="INACTIVE">Đóng cửa</option>
          </select>
          {(search || statusFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-500 hover:text-red-600 font-semibold border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Xóa lọc
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">
              Danh sách chi nhánh <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold">{filteredData.length}</span>
            </h3>
          </div>
          <ReusableDataTable columns={columns} data={filteredData} onRowClick={handleViewBranch} />
        </div>
      </div>

      {/* === Modal: Thêm / Sửa === */}
      {/* === Modal: Thêm / Sửa === */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '🏢 Khai báo Chi nhánh mới' : `⚙️ Cấu hình chi nhánh: ${editingBranch.name}`}
        width="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          {/* Card 1: Vị trí & Liên hệ */}
          <div className="p-3.5 bg-gray-50/70 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3 animate-fade-in">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-650" /> 1. Vị trí địa lý & Liên hệ
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tên chi nhánh *</label>
                <input
                  required
                  type="text"
                  value={editingBranch.name || ''}
                  onChange={e => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  placeholder="Ví dụ: Chi nhánh Quận 3, CH Tân Bình..."
                  className="w-full p-2 border rounded text-xs dark:bg-gray-950 dark:border-gray-700 bg-white dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Số điện thoại liên hệ</label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={editingBranch.phone || ''}
                    onChange={e => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                    placeholder="Ví dụ: 028-3822-xxxx"
                    className="w-full pl-8 pr-2 py-2 border rounded text-xs dark:bg-gray-955 dark:border-gray-700 bg-white dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Địa chỉ chi nhánh *</label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                <input
                  required
                  type="text"
                  value={editingBranch.location || ''}
                  onChange={e => setEditingBranch({ ...editingBranch, location: e.target.value })}
                  placeholder="Ví dụ: 123 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM"
                  className="w-full pl-8 pr-2 py-2 border rounded text-xs dark:bg-gray-955 dark:border-gray-700 bg-white dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Quản lý & Nhân sự */}
          <div className="p-3.5 bg-gray-50/70 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" /> 2. Phân nhiệm Quản lý & Nhân sự
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cửa hàng trưởng (Branch Manager)</label>
                <select
                  value={editingBranch.managerId || ''}
                  onChange={e => setEditingBranch({ ...editingBranch, managerId: e.target.value })}
                  className="w-full p-2 border rounded text-xs dark:bg-gray-955 dark:border-gray-700 bg-white dark:text-white font-medium"
                >
                  <option value="">-- Chọn Cửa hàng trưởng --</option>
                  {(users && users.length > 0 ? users : [
                    { id: '1', fullName: 'Nguyễn Minh Quân (Admin)' },
                    { id: '2', fullName: 'Trần Thị Lan (Store Manager)' },
                    { id: '3', fullName: 'Lê Hoàng Nam (Staff)' },
                  ]).map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Quy mô Nhân sự (Nhân viên)</label>
                <input
                  type="number"
                  min={0}
                  value={editingBranch.employeesCount === 0 ? '' : (editingBranch.employeesCount || '')}
                  onChange={e => setEditingBranch({ ...editingBranch, employeesCount: parseInt(e.target.value) || 0 })}
                  placeholder="Ví dụ: 10"
                  className="w-full p-2 border rounded text-xs dark:bg-gray-955 dark:border-gray-700 bg-white dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Tài chính & Vận hành */}
          <div className="p-3.5 bg-gray-50/70 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-orange-500" /> 3. Chỉ tiêu Tài chính & Vận hành
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trạng thái hoạt động</label>
                <select
                  value={editingBranch.status || 'ACTIVE'}
                  onChange={e => setEditingBranch({ ...editingBranch, status: e.target.value as Branch['status'] })}
                  className="w-full p-2 border rounded text-xs dark:bg-gray-955 dark:border-gray-700 bg-white dark:text-white font-semibold"
                >
                  <option value="ACTIVE">🟢 Hoạt động</option>
                  <option value="MAINTENANCE">🟡 Đang bảo trì</option>
                  <option value="INACTIVE">🔴 Đóng cửa tạm thời</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chỉ tiêu Doanh thu (₫)</label>
                <div className="relative">
                  <Target className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="number"
                    min={0}
                    value={editingBranch.revenueTarget || ''}
                    onChange={e => setEditingBranch({ ...editingBranch, revenueTarget: parseInt(e.target.value) || 0 })}
                    placeholder="Ví dụ: 300,000,000"
                    className="w-full pl-8 pr-2 py-2 border rounded text-xs dark:bg-gray-955 dark:border-gray-700 bg-white dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày khai trương</label>
                <input
                  type="date"
                  value={editingBranch.openedDate || ''}
                  onChange={e => setEditingBranch({ ...editingBranch, openedDate: e.target.value })}
                  className="w-full p-2 border rounded text-xs dark:bg-gray-955 dark:border-gray-700 bg-white dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition text-gray-700 dark:text-gray-300 text-xs font-semibold"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-all hover:scale-[1.01] text-xs"
            >
              {modalMode === 'create' ? 'Tạo chi nhánh' : 'Lưu cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

      {/* === Modal: Xem chi tiết === */}
      <Modal
        isOpen={!!viewingBranch}
        onClose={() => setViewingBranch(null)}
        title={`Chi tiết: ${viewingBranch?.name}`}
        width="max-w-lg"
      >
        {viewingBranch && (() => {
          const pct = viewingBranch.revenueTarget > 0 ? Math.min((viewingBranch.currentRevenue / viewingBranch.revenueTarget) * 100, 100) : 0;
          const cfg = STATUS_CONFIG[viewingBranch.status];
          const StatusIcon = cfg.icon;
          return (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{viewingBranch.name}</p>
                    <p className="text-xs text-gray-500">{viewingBranch.phone}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.className}`}>
                  <StatusIcon className="w-3 h-3" /> {cfg.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Địa chỉ</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{viewingBranch.location}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Cửa hàng trưởng</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{viewingBranch.manager}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Nhân sự</p>
                  <p className="font-bold text-gray-900 dark:text-white">{viewingBranch.employeesCount} nhân viên</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Ngày khai trương</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{viewingBranch.openedDate}</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">KPI Doanh thu tháng này</p>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{fmtFull(viewingBranch.currentRevenue)}</p>
                    <p className="text-xs text-gray-400">Mục tiêu: {fmtFull(viewingBranch.revenueTarget)}</p>
                  </div>
                  <p className={`text-3xl font-black ${pct >= 100 ? 'text-emerald-500' : pct >= 70 ? 'text-indigo-500' : 'text-amber-500'}`}>{pct.toFixed(0)}%</p>
                </div>
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-indigo-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setViewingBranch(null); handleOpenEdit(viewingBranch); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors">
                  <Edit className="w-4 h-4" /> Chỉnh sửa
                </button>
                <button onClick={() => { setViewingBranch(null); setDeletingBranch(viewingBranch); }}
                  className="px-4 py-2.5 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold rounded-lg text-sm transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* === Modal: Xác nhận xóa === */}
      <Modal
        isOpen={!!deletingBranch}
        onClose={() => setDeletingBranch(null)}
        title="Xác nhận xóa chi nhánh"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Bạn có chắc muốn xóa chi nhánh <strong className="text-gray-900 dark:text-white">"{deletingBranch?.name}"</strong>? Hành động này không thể hoàn tác.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setDeletingBranch(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">
              Hủy bỏ
            </button>
            <button type="button" onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow text-sm">
              Xóa chi nhánh
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
