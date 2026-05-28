import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Shield, Key, Users, CheckCircle2, Lock, Trash2, X, Edit, AlertOctagon } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import { useRoleStore, ALL_SYSTEM_PERMISSIONS, type SecurityRoleRecord } from '../store/roleStore';
import type { ColumnDef } from '@tanstack/react-table';

const scopeBadgeStyles = {
  GLOBAL_SUPERADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200',
  DIVISION_MANAGER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
  BRANCH_OPERATIONS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  RESTRICTED_CASHIER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  AUDIT_READONLY: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
};

type SearchField = 'all' | 'roleCode' | 'roleTitle' | 'description' | 'permissionScope';

export function RolesPage() {
  const { roles, addRole, updateRole, deleteRole } = useRoleStore();

  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [selectedRole, setSelectedRole] = useState<SecurityRoleRecord | null>(null);
  const [deletingRole, setDeletingRole] = useState<SecurityRoleRecord | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Filter states
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Omit<SecurityRoleRecord, 'id' | 'createdDate' | 'assignedUsersCount'>>({
    roleCode: '',
    roleTitle: '',
    description: '',
    permissionScope: 'BRANCH_OPERATIONS',
    mfaEnforced: false,
    sessionTimeoutMinutes: 60,
    status: 'ACTIVE',
    grantedPermissions: [],
  });

  const filtered = roles.filter((item) => {
    // 1. Text search filter
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      switch (searchField) {
        case 'roleCode':
          matchesSearch = item.roleCode.toLowerCase().includes(q);
          break;
        case 'roleTitle':
          matchesSearch = item.roleTitle.toLowerCase().includes(q);
          break;
        case 'description':
          matchesSearch = item.description.toLowerCase().includes(q);
          break;
        case 'permissionScope':
          matchesSearch = item.permissionScope.toLowerCase().includes(q);
          break;
        case 'all':
        default:
          matchesSearch = (
            item.roleCode.toLowerCase().includes(q) ||
            item.roleTitle.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.permissionScope.toLowerCase().includes(q)
          );
      }
    }

    // 2. Scope filter
    const matchesScope = scopeFilter === 'all' || item.permissionScope === scopeFilter;

    // 3. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesScope && matchesStatus;
  });

  const searchPlaceholder = useMemo(() => {
    switch (searchField) {
      case 'roleCode':
        return 'Tìm theo mã vai trò (ví dụ: SUPER_ADMIN)...';
      case 'roleTitle':
        return 'Tìm theo tên vai trò hệ thống...';
      case 'description':
        return 'Tìm kiếm mô tả vai trò...';
      case 'permissionScope':
        return 'Tìm theo phạm vi bảo mật (ví dụ: GLOBAL)...';
      case 'all':
      default:
        return 'Nhập từ khóa tìm kiếm theo mọi thuộc tính vai trò...';
    }
  }, [searchField]);

  const handleExportCSV = () => {
    const headers = ['Mã vai trò', 'Tên vai trò', 'Phạm vi bảo mật', 'Số lượng tài khoản', 'Enforce 2FA', 'Hết hạn phiên (Phút)', 'Trạng thái', 'Danh sách quyền'];
    const rows = roles.map(r => [
      r.roleCode,
      r.roleTitle,
      r.permissionScope,
      r.assignedUsersCount.toString(),
      r.mfaEnforced ? 'Bắt buộc' : 'Không bắt buộc',
      r.sessionTimeoutMinutes.toString(),
      r.status,
      r.grantedPermissions.join('; ')
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ma_Tran_Phan_Quyen_RBAC_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setFormData({
      roleCode: '',
      roleTitle: '',
      description: '',
      permissionScope: 'BRANCH_OPERATIONS',
      mfaEnforced: false,
      sessionTimeoutMinutes: 60,
      status: 'ACTIVE',
      grantedPermissions: [],
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (role: SecurityRoleRecord) => {
    setSelectedRole(null);
    setFormMode('edit');
    setFormData({
      roleCode: role.roleCode,
      roleTitle: role.roleTitle,
      description: role.description,
      permissionScope: role.permissionScope,
      mfaEnforced: role.mfaEnforced,
      sessionTimeoutMinutes: role.sessionTimeoutMinutes,
      status: role.status,
      grantedPermissions: role.grantedPermissions,
    });
    (window as any).__editingRoleId = role.id;
    (window as any).__editingRoleUsers = role.assignedUsersCount;
    (window as any).__editingRoleDate = role.createdDate;
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === 'create') {
      addRole(formData);
    } else {
      const id = (window as any).__editingRoleId;
      const assignedUsersCount = (window as any).__editingRoleUsers || 0;
      const createdDate = (window as any).__editingRoleDate || new Date().toISOString().split('T')[0];
      if (id) {
        updateRole({
          ...formData,
          id,
          assignedUsersCount,
          createdDate,
        });
      }
    }
    setFormOpen(false);
  };

  const handleDelete = (role: SecurityRoleRecord) => {
    if (role.roleCode === 'SUPER_ADMIN') {
      setErrorNotice('Không thể xóa vai trò SUPER_ADMIN hệ thống để tránh khóa tài khoản root!');
      return;
    }
    setDeletingRole(role);
  };

  const handleDeleteConfirm = () => {
    if (!deletingRole) return;
    deleteRole(deletingRole.id);
    setDeletingRole(null);
    setSelectedRole(null);
  };

  const togglePermission = (key: string) => {
    setFormData(prev => {
      const hasPerm = prev.grantedPermissions.includes(key);
      const updated = hasPerm 
        ? prev.grantedPermissions.filter(k => k !== key)
        : [...prev.grantedPermissions, key];
      return { ...prev, grantedPermissions: updated };
    });
  };

  const toggleSelectAllPermissions = () => {
    setFormData(prev => {
      const allKeys = ALL_SYSTEM_PERMISSIONS.map(p => p.key);
      const isAllSelected = prev.grantedPermissions.length === allKeys.length;
      return {
        ...prev,
        grantedPermissions: isAllSelected ? [] : allKeys,
      };
    });
  };

  // Group permissions for checklist grouping
  const permissionGroups = useMemo(() => {
    const groups: Record<string, typeof ALL_SYSTEM_PERMISSIONS> = {};
    ALL_SYSTEM_PERMISSIONS.forEach(p => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });
    return groups;
  }, []);

  const columns = useMemo<ColumnDef<SecurityRoleRecord>[]>(
    () => [
      {
        accessorKey: 'roleCode',
        header: 'Mã vai trò',
        cell: (info) => <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'roleTitle',
        header: 'Tên vai trò & Mô tả',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.roleTitle}</p>
            <p className="text-xs text-gray-500 truncate max-w-xs">{row.original.description}</p>
          </div>
        ),
      },
      {
        accessorKey: 'permissionScope',
        header: 'Phạm vi bảo mật',
        cell: (info) => {
          const s = info.getValue() as keyof typeof scopeBadgeStyles;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${scopeBadgeStyles[s]}`}>
              {s.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'assignedUsersCount',
        header: 'Tài khoản liên kết',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white">{info.getValue() as number} tài khoản</span>,
      },
      {
        accessorKey: 'mfaEnforced',
        header: 'Bắt buộc 2FA',
        cell: (info) => (
          <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
            info.getValue() as boolean ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200'
          }`}>
            {info.getValue() as boolean ? 'BẮT BUỘC 2FA' : 'TÙY CHỌN'}
          </span>
        ),
      },
      {
        accessorKey: 'sessionTimeoutMinutes',
        header: 'Thời gian phiên tối đa',
        cell: (info) => <span className="font-mono text-gray-600 dark:text-gray-400">{info.getValue() as number} phút</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'DEPRECATED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {status === 'ACTIVE' ? 'HIỆU LỰC' : status === 'DEPRECATED' ? 'HẾT HẠN' : 'TẠM KHÓA'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedRole(row.original)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Sửa quyền hạn"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              disabled={row.original.roleCode === 'SUPER_ADMIN'}
              className={`p-1.5 rounded-lg transition-colors ${
                row.original.roleCode === 'SUPER_ADMIN' 
                  ? 'text-gray-200 dark:text-gray-800 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
              title="Xóa vai trò"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cấu hình ma trận Phân Quyền Vai Trò (RBAC)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Định nghĩa vai trò bảo mật hệ thống, cấu hình phạm vi thao tác module chuyên biệt và kiểm soát thời gian phiên đăng nhập người dùng.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none shrink-0">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" /> Xuất ma trận chính sách
            </button>
            <button 
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" /> Định nghĩa vai trò mới
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Vietnamese Attribute Dropdown */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-2 shrink-0">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Tìm kiếm theo:</span>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as SearchField)}
                className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-transparent border-none py-1 focus:ring-0 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="roleCode">Mã vai trò</option>
                <option value="roleTitle">Tên vai trò</option>
                <option value="description">Mô tả vai trò</option>
                <option value="permissionScope">Phạm vi bảo mật</option>
              </select>
            </div>

            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Phạm vi bảo mật:</span>
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả phạm vi</option>
                <option value="GLOBAL_SUPERADMIN">GLOBAL SUPERADMIN</option>
                <option value="DIVISION_MANAGER">DIVISION MANAGER</option>
                <option value="BRANCH_OPERATIONS">BRANCH OPERATIONS</option>
                <option value="RESTRICTED_CASHIER">RESTRICTED CASHIER</option>
                <option value="AUDIT_READONLY">AUDIT READONLY</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Lọc Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DEPRECATED">DEPRECATED</option>
              </select>
            </div>

            {(scopeFilter !== 'all' || statusFilter !== 'all' || search) && (
              <button
                onClick={() => { setScopeFilter('all'); setStatusFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedRole(row)} />
      </div>

      {/* Details View Drawer */}
      <Drawer
        isOpen={!!selectedRole}
        onClose={() => setSelectedRole(null)}
        title={selectedRole ? `RBAC Profile: ${selectedRole.roleCode}` : 'Chi tiết vai trò'}
        width="max-w-lg"
      >
        {selectedRole && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedRole.status === 'ACTIVE'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedRole.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-amber-600'
                }`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Phân hạng bảo mật an ninh</p>
                  <p className="text-sm font-bold font-mono text-gray-900 dark:text-white mt-0.5">{selectedRole.permissionScope.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedRole.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
              }`}>
                {selectedRole.status === 'ACTIVE' ? 'HIỆU LỰC' : 'TẠM DỪNG'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Users className="w-4 h-4 text-primary" /> Tài khoản liên kết hoạt động
                </div>
                <p className="text-xl font-mono font-bold text-gray-900 dark:text-white truncate">{selectedRole.assignedUsersCount} Accounts</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Key className="w-4 h-4 text-amber-500" /> Bắt buộc 2FA/MFA
                </div>
                <p className={`text-sm font-bold truncate font-mono ${selectedRole.mfaEnforced ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {selectedRole.mfaEnforced ? 'YÊU CẦU BẮT BUỘC' : 'TÙY CHỌN BẬT TẮT'}
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tên vai trò & Bản tả mô tả nhiệm vụ</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedRole.roleTitle}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{selectedRole.description}</p>
              </div>

              <div className="pt-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Danh sách quyền thao tác được gán</span>
                <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-xs max-h-48 overflow-y-auto p-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
                  {selectedRole.grantedPermissions.includes('*') ? (
                    <span className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-2 py-1 rounded border border-red-200 dark:border-red-900/40 font-bold w-full text-center">
                      * QUYỀN CAO NHẤT (SUPER ADMIN ROOT OVERRIDE)
                    </span>
                  ) : selectedRole.grantedPermissions.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">Không được gán quyền hạn nào</span>
                  ) : (
                    selectedRole.grantedPermissions.map((permKey, i) => {
                      const match = ALL_SYSTEM_PERMISSIONS.find(p => p.key === permKey);
                      return (
                        <span key={i} className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded border border-blue-100 dark:border-blue-800 font-semibold" title={permKey}>
                          {match ? match.name : permKey}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700 text-xs font-mono">
                <span className="text-gray-500 dark:text-gray-400 font-sans">Thời gian kết thúc phiên (Timeout):</span>
                <span className="text-gray-800 dark:text-gray-200 font-bold">{selectedRole.sessionTimeoutMinutes} phút</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button 
                onClick={() => handleOpenEdit(selectedRole)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow transition-colors text-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> Chỉnh sửa phân quyền
              </button>
              <button 
                onClick={() => handleDelete(selectedRole)}
                disabled={selectedRole.roleCode === 'SUPER_ADMIN'}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-700 dark:text-gray-300 hover:text-red-600 rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 inline mr-1" /> Gỡ bỏ vai trò
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create / Edit Drawer Form */}
      <Drawer
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'create' ? 'Định nghĩa vai trò hệ thống mới' : 'Chỉnh sửa ma trận phân quyền'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã Code vai trò *</label>
              <input
                type="text"
                required
                disabled={formMode === 'edit' && formData.roleCode === 'SUPER_ADMIN'}
                placeholder="Ví dụ: STORE_MANAGER"
                value={formData.roleCode}
                onChange={(e) => setFormData(p => ({ ...p, roleCode: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên nhãn vai trò *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Giám sát bán hàng chi nhánh"
                value={formData.roleTitle}
                onChange={(e) => setFormData(p => ({ ...p, roleTitle: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bản mô tả nhiệm vụ vai trò *</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Phê duyệt đơn mua và quản lý ca làm việc của thu ngân tại cửa hàng chi nhánh."
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phân hạng an ninh bảo mật *</label>
              <select
                value={formData.permissionScope}
                onChange={(e) => setFormData(p => ({ ...p, permissionScope: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="GLOBAL_SUPERADMIN">Quản trị toàn năng (GLOBAL_SUPERADMIN)</option>
                <option value="DIVISION_MANAGER">Quản lý khối phòng ban (DIVISION_MANAGER)</option>
                <option value="BRANCH_OPERATIONS">Vận hành chi nhánh (BRANCH_OPERATIONS)</option>
                <option value="RESTRICTED_CASHIER">Nhân viên thu ngân (RESTRICTED_CASHIER)</option>
                <option value="AUDIT_READONLY">Độc giả kiểm toán (AUDIT_READONLY)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Timeout hết hạn phiên (Phút) *</label>
              <input
                type="number"
                required
                min="5"
                max="1440"
                value={formData.sessionTimeoutMinutes}
                onChange={(e) => setFormData(p => ({ ...p, sessionTimeoutMinutes: parseInt(e.target.value) || 60 }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 py-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.mfaEnforced}
                onChange={(e) => setFormData(p => ({ ...p, mfaEnforced: e.target.checked }))}
                className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 select-none">Bắt buộc xác thực đa yếu tố 2FA/MFA?</span>
            </label>

            <div>
              <span className="text-xs font-bold text-gray-500 uppercase mr-2">Trạng thái:</span>
              <select
                value={formData.status}
                onChange={(e) => setFormData(p => ({ ...p, status: e.target.value as any }))}
                className="px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-bold"
              >
                <option value="ACTIVE">KÍCH HOẠT (ACTIVE)</option>
                <option value="DEPRECATED">HẾT HẠN (DEPRECATED)</option>
                <option value="AUDIT_HOLD">TẠM NGHƯNG (AUDIT_HOLD)</option>
              </select>
            </div>
          </div>

          {/* Granular checklist grid */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" /> Thiết lập ma trận Quyền Hạn chi tiết
              </span>
              <button
                type="button"
                onClick={toggleSelectAllPermissions}
                className="text-xs bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-md font-bold transition-all shadow-xs"
              >
                {formData.grantedPermissions.length === ALL_SYSTEM_PERMISSIONS.map(p => p.key).length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            {formData.roleCode === 'SUPER_ADMIN' ? (
              <div className="bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 p-4 rounded-xl text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 animate-pulse text-red-600" /> VAI TRÒ SUPER_ADMIN CHỨA QUYỀN ROOT (*)
                </p>
                <p className="text-gray-600 dark:text-gray-400">Vai trò quản trị viên tối cao tự động thừa hưởng toàn bộ danh sách quyền thao tác phần mềm mà không cần gán thủ công.</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-4 pr-1.5 scrollbar-thin">
                {Object.entries(permissionGroups).map(([groupTitle, perms]) => (
                  <div key={groupTitle} className="space-y-2">
                    <h4 className="text-xs font-extrabold text-primary uppercase tracking-wider border-l-2 border-primary pl-2 mb-1">{groupTitle}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map(p => {
                        const checked = formData.grantedPermissions.includes(p.key);
                        return (
                          <div 
                            key={p.key}
                            onClick={() => togglePermission(p.key)}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                              checked 
                                ? 'bg-primary/5 dark:bg-primary/10 border-primary shadow-2xs' 
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              readOnly
                              className="rounded border-gray-300 text-primary focus:ring-primary w-3.5 h-3.5 mt-0.5 pointer-events-none"
                            />
                            <div className="leading-tight">
                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{p.name}</p>
                              <span className="text-[10px] font-mono text-gray-400 block mt-0.5">{p.key}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow"
            >
              Lưu thay đổi vai trò
            </button>
          </div>
        </form>
      </Drawer>

      <Modal
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        title="Xóa Vai Trò Phân Quyền"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Bạn có chắc chắn muốn xóa vai trò <strong>{deletingRole?.roleTitle}</strong>? Tài khoản người dùng được gán vai trò này sẽ mất các quyền truy cập tương ứng.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setDeletingRole(null)} className="px-4 py-2 border rounded-lg text-sm dark:border-gray-700">Hủy</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!errorNotice}
        onClose={() => setErrorNotice(null)}
        title="Thông Báo"
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{errorNotice}</p>
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setErrorNotice(null)} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold">Đóng</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
