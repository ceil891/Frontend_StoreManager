import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Edit, Eye, Trash2, Copy, Users, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { useRoleStore, type SecurityRoleRecord, ROLE_COLORS } from '../store/roleStore';
import { RolePermissionMatrix } from '../components/RolePermissionMatrix';
import { ModuleGroupSidebar } from '../components/ModuleGroupSidebar';
import { CloneRoleDialog } from '../components/CloneRoleDialog';
import { RoleUserAssignment } from '../components/RoleUserAssignment';
import { PermissionSearch } from '../components/PermissionSearch';
import { PermissionSummary } from '../components/PermissionSummary';
import { useUserStore } from '../store/userStore';
import type { ColumnDef } from '@tanstack/react-table';

const statusBadgeStyles = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  DEPRECATED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200',
  AUDIT_HOLD: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
};

export function RolesPage() {
  const { roles, systemPermissions, fetchRoles, fetchSystemPermissions, addRole, updateRole, deleteRole } = useRoleStore();
  const { fetchUsers } = useUserStore(); // pre-fetch users for assignment
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    fetchRoles();
    fetchUsers();
    fetchSystemPermissions();
  }, [fetchRoles, fetchUsers, fetchSystemPermissions]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  // States for Dialogs
  const [cloneRoleTarget, setCloneRoleTarget] = useState<SecurityRoleRecord | null>(null);
  const [assignRoleTarget, setAssignRoleTarget] = useState<SecurityRoleRecord | null>(null);
  const [deletingRole, setDeletingRole] = useState<SecurityRoleRecord | null>(null);

  // Form State
  const [editingRole, setEditingRole] = useState<Partial<SecurityRoleRecord>>({
    roleCode: '',
    roleTitle: '',
    description: '',
    status: 'ACTIVE',
    color: '#10b981',
    grantedPermissions: []
  });
  const [activeModule, setActiveModule] = useState<string | undefined>(undefined);

  const filteredRoles = useMemo(() => {
    if (!search) return roles;
    const lowerSearch = search.toLowerCase();
    return roles.filter(r => 
      r.roleCode.toLowerCase().includes(lowerSearch) || 
      r.roleTitle.toLowerCase().includes(lowerSearch) ||
      (r.description && r.description.toLowerCase().includes(lowerSearch))
    );
  }, [roles, search]);

  const handleOpenForm = (mode: 'create' | 'edit' | 'view', role?: SecurityRoleRecord) => {
    setFormMode(mode);
    if (role) {
      setEditingRole({ ...role });
    } else {
      setEditingRole({
        roleCode: '',
        roleTitle: '',
        description: '',
        status: 'ACTIVE',
        color: '#10b981',
        grantedPermissions: []
      });
    }
    setFormOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === 'view') {
      setFormOpen(false);
      return;
    }
    try {
      if (formMode === 'create') {
        await addRole(editingRole as SecurityRoleRecord);
        toast.success('Thêm vai trò mới thành công');
      } else {
        await updateRole(editingRole as SecurityRoleRecord);
        toast.success('Cập nhật vai trò thành công');
      }
      setFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu vai trò');
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    try {
      await deleteRole(deletingRole.id);
      toast.success('Xóa vai trò thành công');
      setDeletingRole(null);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa vai trò');
    }
  };

  const togglePermission = (key: string) => {
    if (formMode === 'view') return;
    const current = editingRole.grantedPermissions || [];
    if (current.includes(key)) {
      setEditingRole({ ...editingRole, grantedPermissions: current.filter(p => p !== key) });
    } else {
      setEditingRole({ ...editingRole, grantedPermissions: [...current, key] });
    }
  };

  const updatePermissions = (newPermissions: string[]) => {
    if (formMode === 'view') return;
    setEditingRole({ ...editingRole, grantedPermissions: newPermissions });
  };

  const columns = useMemo<ColumnDef<SecurityRoleRecord>[]>(
    () => [
      {
        header: 'Vai trò (Role)',
        accessorKey: 'roleTitle',
        cell: (info) => {
          const role = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: `${role.color || '#10b981'}15`, color: role.color || '#10b981' }}
              >
                {role.isSystemRole ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2 leading-tight">
                  {role.roleTitle}
                  {role.isSystemRole && (
                    <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Hệ thống</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{role.roleCode}</p>
              </div>
            </div>
          );
        },
      },
      {
        header: 'Mô tả',
        accessorKey: 'description',
        cell: (info) => <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{info.getValue<string>() || '-'}</div>,
      },
      {
        header: 'Số quyền',
        accessorKey: 'grantedPermissions',
        cell: (info) => {
          const perms = info.getValue<string[]>() || [];
          const isSuper = perms.includes('*');
          return (
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${isSuper ? 'bg-red-500 w-full' : 'bg-primary'}`} 
                  style={{ width: isSuper ? '100%' : `${Math.min(100, (perms.length / (systemPermissions.length || 1)) * 100)}%` }} 
                />
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {isSuper ? 'Tất cả' : `${perms.length}/${systemPermissions.length}`}
              </span>
            </div>
          );
        },
      },
      {
        header: 'Người dùng',
        accessorKey: 'assignedUsersCount',
        cell: (info) => {
          const count = info.getValue<number>();
          return (
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 w-fit px-2.5 py-1 rounded-md">
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{count}</span>
            </div>
          );
        },
      },
      {
        header: 'Trạng thái',
        accessorKey: 'status',
        cell: (info) => {
          const status = info.getValue<string>();
          const label = status === 'ACTIVE' ? 'Hoạt động' : status === 'DEPRECATED' ? 'Vô hiệu hóa' : 'Tạm khóa';
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadgeStyles[status as keyof typeof statusBadgeStyles]}`}>
              {label}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: (info) => {
          const role = info.row.original;
          return (
            <div className="flex items-center gap-2">
              <button 
                title="Xem chi tiết"
                onClick={() => handleOpenForm('view', role)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button 
                title="Sửa vai trò"
                onClick={() => handleOpenForm('edit', role)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                title="Sao chép vai trò"
                onClick={() => setCloneRoleTarget(role)}
                className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                title="Gán người dùng"
                onClick={() => setAssignRoleTarget(role)}
                className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
              </button>
              {!role.isSystemRole && (
                <button 
                  title="Xóa vai trò"
                  onClick={() => setDeletingRole(role)}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" /> Quản lý Vai trò & Phân quyền
          </h1>
          <p className="text-gray-500 mt-1">Cấu hình quyền truy cập và chức năng cho các nhóm người dùng trong hệ thống (Enterprise IAM).</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-semibold text-sm">
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
          <button
            onClick={() => handleOpenForm('create')}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg shadow font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Thêm Role
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm mã, tên vai trò..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>
        </div>
        
        <ReusableDataTable columns={columns} data={filteredRoles} />
      </div>

      {/* Role Form (Create/Edit/View) */}
      <Modal 
        isOpen={formOpen} 
        onClose={() => setFormOpen(false)} 
        title={formMode === 'create' ? 'Tạo Vai Trò Mới' : formMode === 'edit' ? 'Chỉnh Sửa Vai Trò' : 'Chi Tiết Vai Trò'}
        width="w-[95vw] max-w-7xl"
      >
        <form onSubmit={handleSaveRole} className="flex flex-col h-[75vh]">
          <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
            
            {/* Left Column: Role Details */}
            <div className="lg:w-1/4 flex flex-col gap-5 overflow-y-auto pr-2 scrollbar-thin">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <Shield className="w-4 h-4 text-primary" /> Thông tin cơ bản
                </h3>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã vai trò {formMode !== 'view' && '*'}</label>
                  <input
                    type="text"
                    required
                    value={editingRole.roleCode}
                    onChange={(e) => setEditingRole({ ...editingRole, roleCode: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    readOnly={formMode === 'view' || !!editingRole.isSystemRole}
                    placeholder="VD: STORE_MANAGER"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary read-only:bg-gray-100 dark:read-only:bg-gray-800"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên hiển thị {formMode !== 'view' && '*'}</label>
                  <input
                    type="text"
                    required
                    value={editingRole.roleTitle}
                    onChange={(e) => setEditingRole({ ...editingRole, roleTitle: e.target.value })}
                    readOnly={formMode === 'view'}
                    placeholder="VD: Quản lý cửa hàng"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary read-only:bg-gray-100 dark:read-only:bg-gray-800"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả</label>
                  <textarea
                    value={editingRole.description}
                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                    readOnly={formMode === 'view'}
                    rows={3}
                    placeholder="Mô tả quyền hạn của vai trò này..."
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary read-only:bg-gray-100 dark:read-only:bg-gray-800 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Màu sắc</label>
                    <select
                      value={editingRole.color || '#10b981'}
                      onChange={(e) => setEditingRole({ ...editingRole, color: e.target.value })}
                      disabled={formMode === 'view'}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary disabled:opacity-70"
                    >
                      {ROLE_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng thái</label>
                    <select
                      value={editingRole.status}
                      onChange={(e) => setEditingRole({ ...editingRole, status: e.target.value as any })}
                      disabled={formMode === 'view'}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary disabled:opacity-70"
                    >
                      <option value="ACTIVE">Hoạt động</option>
                      <option value="DEPRECATED">Vô hiệu hóa</option>
                      <option value="AUDIT_HOLD">Tạm khóa</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Module Groups Navigation */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-3 overflow-y-auto scrollbar-thin hidden lg:block">
                <ModuleGroupSidebar activeModule={activeModule} onSelectModule={setActiveModule} />
              </div>
            </div>

            {/* Right Column: Permission Configuration */}
            <div className="lg:w-3/4 flex flex-col min-h-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-t-xl">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Cấu hình quyền hạn 
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                      {editingRole.grantedPermissions?.length || 0} quyền đã chọn
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Tích chọn các quyền được phép thực hiện.</p>
                </div>
                <div className="w-full sm:w-auto">
                  <PermissionSearch 
                    selectedPermissions={editingRole.grantedPermissions || []} 
                    onTogglePermission={togglePermission} 
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                {formMode === 'view' ? (
                  <PermissionSummary 
                    roleCode={editingRole.roleCode!} 
                    roleTitle={editingRole.roleTitle!} 
                    grantedPermissions={editingRole.grantedPermissions || []} 
                  />
                ) : (
                  <RolePermissionMatrix 
                    selectedPermissions={editingRole.grantedPermissions || []}
                    onChange={updatePermissions}
                    isReadOnly={false}
                    activeModule={activeModule}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-semibold transition-colors"
            >
              Đóng
            </button>
            {formMode !== 'view' && (
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow transition-colors"
              >
                Lưu vai trò
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* Dialogs */}
      <CloneRoleDialog 
        isOpen={!!cloneRoleTarget} 
        onClose={() => setCloneRoleTarget(null)} 
        sourceRole={cloneRoleTarget} 
      />
      
      <RoleUserAssignment 
        isOpen={!!assignRoleTarget} 
        onClose={() => setAssignRoleTarget(null)} 
        role={assignRoleTarget} 
      />

      <Modal isOpen={!!deletingRole} onClose={() => setDeletingRole(null)} title="Xác nhận xóa vai trò" isDestructive width="max-w-md">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Bạn có chắc chắn muốn xóa vai trò <span className="font-bold text-gray-900 dark:text-white">{deletingRole?.roleTitle}</span>? 
          </p>
          {deletingRole?.assignedUsersCount ? (
             <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm text-red-800 dark:text-red-300 flex items-start gap-2 border border-red-200 dark:border-red-800">
               <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
               <p>Cảnh báo: Vai trò này đang được gán cho <strong>{deletingRole.assignedUsersCount} người dùng</strong>. Các người dùng này sẽ bị mất quyền nếu xóa vai trò.</p>
             </div>
          ) : null}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingRole(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-semibold"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Xóa vai trò
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
