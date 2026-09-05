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
import { toast } from 'sonner';
import { AddressCascadeSelect } from '@/shared/components/ui/AddressCascadeSelect';

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
  taxCode?: string;
  openingHours?: string;
  isHeadquarters?: boolean;
  email?: string;
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

  const parseAddressParts = (fullAddr?: string) => {
    if (!fullAddr) return { province: '', district: '', ward: '', addressDetail: '' };
    const parts = fullAddr.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return { province: '', district: '', ward: '', addressDetail: '' };

    let province = '';
    let district = '';
    let ward = '';

    // Find province (usually has "Tỉnh", "Thành phố", "TP")
    const provIdx = parts.findIndex(p => /^(tỉnh|thành phố|tp\.)/i.test(p));
    // Find district (usually has "Quận", "Huyện", "Thị xã")
    const distIdx = parts.findIndex((p, idx) => idx !== provIdx && /^(quận|huyện|thị xã|tp\.|thành phố)/i.test(p));
    // Find ward (usually has "Phường", "Xã", "Thị trấn")
    const wardIdx = parts.findIndex((p, idx) => idx !== provIdx && idx !== distIdx && /^(phường|xã|thị trấn|p\.|x\.)/i.test(p));

    if (provIdx !== -1) province = parts[provIdx];
    if (distIdx !== -1) district = parts[distIdx];
    if (wardIdx !== -1) ward = parts[wardIdx];

    // Fallback based on standard backward order: [addressDetail], [ward], [district], [province]
    if (!province && parts.length >= 1) {
      province = parts[parts.length - 1];
    }
    if (!district && parts.length >= 2) {
      district = parts[parts.length - 2];
    }
    if (!ward && parts.length >= 3) {
      ward = parts[parts.length - 3];
    }

    // Filter out parts that duplicate province, district, ward or are lonely keywords like "Huyện", "Tỉnh", "Xã"
    const matchedIndices = new Set([provIdx, distIdx, wardIdx].filter(i => i !== -1));
    const detailParts = parts.filter((p, idx) => {
      if (matchedIndices.has(idx)) return false;
      const lower = p.toLowerCase();
      if (province && lower === province.toLowerCase()) return false;
      if (district && lower === district.toLowerCase()) return false;
      if (ward && lower === ward.toLowerCase()) return false;
      if (/^(tỉnh|huyện|quận|xã|phường|thị trấn)$/i.test(lower)) return false;
      return true;
    });

    const addressDetail = detailParts.join(', ');

    return { province, district, ward, addressDetail };
  };

  // --- CRUD Handlers ---
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingBranch({
      ...EMPTY_BRANCH,
      branchCode: `BR-${String(branches.length + 1).padStart(3, '0')}`,
      province: '',
      district: '',
      ward: '',
      addressDetail: '',
      location: '',
    } as any);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setModalMode('edit');
    const parsedAddr = parseAddressParts(branch.location);
    setEditingBranch({ ...branch, ...parsedAddr } as any);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch.name?.trim()) {
      toast.error('Tên chi nhánh không được để trống!');
      return;
    }
    if (!editingBranch.branchCode?.trim()) {
      toast.error('Mã chi nhánh không được để trống!');
      return;
    }
    if (!editingBranch.location?.trim()) {
      toast.error('Vui lòng chọn địa chỉ cho chi nhánh!');
      return;
    }

    const isDuplicateCode = branches.some(
      b => b.branchCode?.trim().toLowerCase() === editingBranch.branchCode?.trim().toLowerCase() && (modalMode === 'create' || b.id !== editingBranch.id)
    );
    if (isDuplicateCode) {
      toast.error(`Mã chi nhánh "${editingBranch.branchCode}" đã tồn tại trong hệ thống. Vui lòng đổi mã khác!`);
      return;
    }

    const selectedManager = users.find(u => u.id === editingBranch.managerId);
    const managerName = selectedManager ? selectedManager.fullName : '—';

    try {
      if (modalMode === 'create') {
        await addBranch({
          branchCode: editingBranch.branchCode.trim(),
          name: editingBranch.name.trim(),
          location: editingBranch.location.trim(),
          phone: editingBranch.phone || '',
          manager: managerName,
          managerId: editingBranch.managerId,
          status: editingBranch.status || 'ACTIVE',
          revenueTarget: editingBranch.revenueTarget || 300000000,
          openedDate: editingBranch.openedDate || new Date().toISOString().split('T')[0],
        });
        toast.success(`Đã thêm mới chi nhánh ${editingBranch.name} thành công!`);
        recordActivity({
          actionType: 'CREATE',
          moduleName: 'Hệ thống',
          pageName: 'Quản lý chi nhánh',
          entityType: 'Branch',
          entityId: editingBranch.branchCode || 'NEW',
          entityLabel: editingBranch.name,
          description: `Thêm Chi Nhánh ${editingBranch.name}, QL ${managerName}.`,
          changedFields: ['name', 'location', 'manager', 'status'],
        });
      } else {
        if (editingBranch.id) {
          await updateBranch(editingBranch.id, {
            branchCode: editingBranch.branchCode.trim(),
            name: editingBranch.name.trim(),
            location: editingBranch.location.trim(),
            phone: editingBranch.phone,
            manager: managerName,
            managerId: editingBranch.managerId,
            status: editingBranch.status,
            revenueTarget: editingBranch.revenueTarget,
            openedDate: editingBranch.openedDate,
          });
          toast.success(`Đã cập nhật chi nhánh ${editingBranch.name} thành công!`);
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
    } catch (err: any) {
      console.error('Lỗi lưu chi nhánh:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu chi nhánh. Vui lòng kiểm tra lại!';
      toast.error(msg);
    }
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
  const totalRevenue = branches.reduce((s, b) => s + (b.currentRevenue || 0), 0);
  const totalTarget = branches.reduce((s, b) => s + (b.revenueTarget || 0), 0);
  const activeCount = branches.filter(b => b.status === 'ACTIVE').length;
  const totalEmployees = users.length;

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
            <p className="text-[11px] text-gray-400 font-mono">{info.row.original.phone || 'Chưa có SĐT'}</p>
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
          <span className="truncate">{info.getValue() as string || 'Chưa cập nhật'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'manager',
      header: 'Cửa hàng trưởng',
      cell: ({ row }) => {
        const managerUser = users.find(u => String(u.id) === String(row.original.managerId) || u.fullName === row.original.manager);
        const managerName = managerUser ? managerUser.fullName : (row.original.manager && row.original.manager !== '—' ? row.original.manager : 'Chưa phân công');
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-bold shrink-0">
              {managerName.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{managerName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'employeesCount',
      header: 'Nhân sự',
      cell: ({ row }) => {
        const branchId = String(row.original.id);
        const count = users.filter(u => String(u.branchId) === branchId).length;
        return (
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <Users className="w-3.5 h-3.5" />
            <span className="font-semibold">{count}</span>
            <span className="text-xs text-gray-400">NV</span>
          </div>
        );
      },
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
              Xuất Excel
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Thêm Chi Nhánh
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Khai báo Chi nhánh mới' : `Cấu hình chi nhánh: ${editingBranch.name}`}
        size="erp"
      >
        <form onSubmit={handleSave}>
          <div className="erp-form-body">
            {/* Section 1: Định danh & Địa lý */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Vị trí & Liên hệ</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã chi nhánh *</label>
                  <input
                    required
                    type="text"
                    value={editingBranch.branchCode || ''}
                    onChange={e => setEditingBranch({ ...editingBranch, branchCode: e.target.value })}
                    placeholder="VD: CN-Q3, STORE-01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên chi nhánh *</label>
                  <input
                    required
                    type="text"
                    value={editingBranch.name || ''}
                    onChange={e => setEditingBranch({ ...editingBranch, name: e.target.value })}
                    placeholder="Chi nhánh Quận 3..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <AddressCascadeSelect
                  province={(editingBranch as any).province}
                  district={(editingBranch as any).district}
                  ward={(editingBranch as any).ward}
                  addressDetail={(editingBranch as any).addressDetail || ''}
                  onChange={({ province, district, ward, addressDetail }) => {
                    const fullAddr = [addressDetail, ward, district, province].filter(Boolean).join(', ');
                    setEditingBranch(prev => ({
                      ...prev,
                      province,
                      district,
                      ward,
                      addressDetail,
                      location: fullAddr
                    } as any));
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editingBranch.phone || ''}
                    onChange={e => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                    placeholder="028-3822-xxxx"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email chi nhánh</label>
                  <input
                    type="email"
                    value={editingBranch.email || ''}
                    onChange={e => setEditingBranch({ ...editingBranch, email: e.target.value })}
                    placeholder="chinhanh@retailhub.vn"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!editingBranch.isHeadquarters}
                    onChange={e => setEditingBranch({ ...editingBranch, isHeadquarters: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Đây là Trụ sở chính / Kho tổng của công ty</span>
                </label>
              </div>
            </div>

            {/* Section 2: Nhân sự & Vận hành */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Quản lý & Nhân sự</h3>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cửa hàng trưởng (Branch Manager)</label>
                <select
                  value={editingBranch.managerId || ''}
                  onChange={e => setEditingBranch({ ...editingBranch, managerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">-- Chọn Cửa hàng trưởng từ nhân sự hệ thống --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} {u.userCode ? `(${u.userCode})` : ''} - {u.assignedRole || u.emailAddress}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số nhân viên</label>
                  <input
                    type="number"
                    min={0}
                    value={editingBranch.employeesCount === 0 ? '' : (editingBranch.employeesCount || '')}
                    onChange={e => setEditingBranch({ ...editingBranch, employeesCount: parseInt(e.target.value) || 0 })}
                    placeholder="VD: 10"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giờ mở cửa</label>
                  <input
                    type="text"
                    value={editingBranch.openingHours || '08:00 - 22:00'}
                    onChange={e => setEditingBranch({ ...editingBranch, openingHours: e.target.value })}
                    placeholder="VD: 08:00 - 22:00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái hoạt động</label>
                <select
                  value={editingBranch.status || 'ACTIVE'}
                  onChange={e => setEditingBranch({ ...editingBranch, status: e.target.value as Branch['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                  <option value="MAINTENANCE">Đang bảo trì (MAINTENANCE)</option>
                  <option value="INACTIVE">Đóng cửa (INACTIVE)</option>
                </select>
              </div>
            </div>

            {/* Section 3: Chỉ tiêu & Pháp lý */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Tài chính & Pháp lý</h3>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã số thuế chi nhánh</label>
                <input
                  type="text"
                  value={editingBranch.taxCode || ''}
                  onChange={e => setEditingBranch({ ...editingBranch, taxCode: e.target.value })}
                  placeholder="MST địa điểm kinh doanh"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chỉ tiêu Doanh thu (₫)</label>
                <input
                  type="number"
                  min={0}
                  value={editingBranch.revenueTarget || ''}
                  onChange={e => setEditingBranch({ ...editingBranch, revenueTarget: parseInt(e.target.value) || 0 })}
                  placeholder="Ví dụ: 300,000,000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày khai trương</label>
                <input
                  type="date"
                  value={editingBranch.openedDate || ''}
                  onChange={e => setEditingBranch({ ...editingBranch, openedDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="erp-form-footer border-t border-gray-200 dark:border-gray-700 pt-4">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow text-sm"
            >
              {modalMode === 'create' ? 'Khai báo chi nhánh' : 'Lưu cập nhật'}
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
