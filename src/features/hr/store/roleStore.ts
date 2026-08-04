import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface SecurityRoleRecord {
  id: string;
  roleCode: string;
  roleTitle: string;
  description: string;
  assignedUsersCount: number;
  permissionScope: 'GLOBAL_SUPERADMIN' | 'DIVISION_MANAGER' | 'BRANCH_OPERATIONS' | 'RESTRICTED_CASHIER' | 'AUDIT_READONLY';
  dataScopeBranchIds?: string[];
  isSystemRole?: boolean;
  mfaEnforced: boolean;
  sessionTimeoutMinutes: number;
  status: 'ACTIVE' | 'DEPRECATED' | 'AUDIT_HOLD';
  createdDate: string;
  grantedPermissions: string[];
  color?: string;
}

export interface RoleUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  isAssigned: boolean;
}

export interface PermissionItem {
  key: string;
  name: string;
  group: string;
  module: string;
  action: string;
}

// ── Module definitions ──────────────────────────────────────────
export const MODULE_GROUPS = [
  { key: 'Dashboard', label: 'Dashboard', icon: '📊', color: 'bg-blue-500' },
  { key: 'Product', label: 'Sản phẩm', icon: '📦', color: 'bg-emerald-500' },
  { key: 'Category', label: 'Danh mục', icon: '🏷️', color: 'bg-teal-500' },
  { key: 'Inventory', label: 'Kho hàng', icon: '🏭', color: 'bg-amber-500' },
  { key: 'Sales', label: 'Bán hàng', icon: '🛒', color: 'bg-orange-500' },
  { key: 'POS', label: 'Điểm bán (POS)', icon: '💳', color: 'bg-pink-500' },
  { key: 'Purchase', label: 'Mua hàng', icon: '📋', color: 'bg-violet-500' },
  { key: 'CRM', label: 'Khách hàng (CRM)', icon: '👥', color: 'bg-cyan-500' },
  { key: 'Finance', label: 'Tài chính', icon: '💰', color: 'bg-yellow-500' },
  { key: 'Logistics', label: 'Vận chuyển', icon: '🚚', color: 'bg-indigo-500' },
  { key: 'HR', label: 'Nhân sự', icon: '👔', color: 'bg-rose-500' },
  { key: 'Report', label: 'Báo cáo', icon: '📈', color: 'bg-sky-500' },
  { key: 'System', label: 'Hệ thống', icon: '⚙️', color: 'bg-gray-500' },
] as const;

export const ACTION_VIETNAMESE_MAP: Record<string, string> = {
  Activate: 'Kích hoạt',
  Adjust: 'Điều chỉnh',
  Approve: 'Phê duyệt',
  AssignPerm: 'Gán phân quyền',
  Cancel: 'Hủy bỏ',
  CheckIn: 'Vào ca',
  CheckOut: 'Tan ca',
  Confirm: 'Xác nhận',
  Convert: 'Chuyển đổi',
  Create: 'Tạo mới',
  Deduct: 'Trừ tồn kho',
  Delete: 'Xóa',
  LowStock: 'Cảnh báo hết',
  Receive: 'Nhập kho',
  Renew: 'Gia hạn',
  ResetPass: 'Đổi mật khẩu',
  Restore: 'Khôi phục',
  Search: 'Tìm kiếm',
  Submit: 'Gửi duyệt',
  Terminate: 'Chấm dứt',
  Update: 'Chỉnh sửa',
  UpdateStatus: 'Cập nhật trạng thái',
  View: 'Xem',
};

export const MODULE_VIETNAMESE_MAP: Record<string, string> = {
  Product: 'Sản phẩm',
  Category: 'Danh mục',
  Inventory: 'Tồn kho',
  Sales: 'Bán hàng',
  POS: 'POS Bán quầy',
  Purchase: 'Mua hàng',
  CRM: 'Khách hàng',
  Finance: 'Tài chính',
  Logistics: 'Vận chuyển',
  HR: 'Nhân sự',
  Report: 'Báo cáo',
  System: 'Hệ thống',
  User: 'Tài khoản',
  Role: 'Vai trò',
  Branch: 'Chi nhánh',
  Department: 'Phòng ban',
  Color: 'Màu sắc',
  Size: 'Kích thước',
  Combo: 'Combo',
  Unit: 'Đơn vị tính',
  AuditLog: 'Nhật ký',
  Attendance: 'Chấm công',
  Invoice: 'Hóa đơn',
  Quote: 'Báo giá',
  Return: 'Trả hàng',
  Bank: 'Ngân hàng',
  Order: 'Đơn mua',
  Request: 'Yêu cầu',
  Contract: 'Hợp đồng',
};

export function parseApiPermission(p: any): PermissionItem {
  const key = p.permissionCode || p.key || '';
  const parts = key.split(':');
  
  let moduleName = 'General';
  let action = 'Unknown';
  if (parts.length >= 3) {
    moduleName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    action = parts[2].split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  } else if (parts.length === 2) {
    moduleName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    action = parts[1].split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  }

  // Must match MODULE_GROUPS keys exactly: Dashboard, Product, Category, Inventory, Sales, POS, Purchase, CRM, Finance, Logistics, HR, Report, System
  let group = 'System';
  const prefix = parts[0]?.toLowerCase();
  const subPrefix = parts[1]?.toLowerCase();

  if (prefix === 'dashboard') group = 'Dashboard';
  else if (prefix === 'sales') group = 'Sales';
  else if (prefix === 'pos') group = 'POS';
  else if (prefix === 'purchase') group = 'Purchase';
  else if (prefix === 'crm') group = 'CRM';
  else if (prefix === 'finance') group = 'Finance';
  else if (prefix === 'logistics') group = 'Logistics';
  else if (prefix === 'hrm' || prefix === 'hr') group = 'HR';
  else if (prefix === 'report') group = 'Report';
  else if (prefix === 'catalog') {
    if (subPrefix === 'inventory') group = 'Inventory';
    else if (subPrefix === 'category' || subPrefix === 'department' || subPrefix === 'attribute') group = 'Category';
    else group = 'Product';
  } else if (prefix === 'system' || prefix === 'admin') {
    group = 'System';
  }

  const actionVi = ACTION_VIETNAMESE_MAP[action] || action;
  const moduleVi = MODULE_VIETNAMESE_MAP[moduleName] || moduleName;
  let name = p.description || `${actionVi} ${moduleVi}`;

  return { key, name, group, module: moduleName, action };
}

// ── Default/Fallback System Permissions List ─────────────────────
export const DEFAULT_SYSTEM_PERMISSIONS: PermissionItem[] = [
  // Product & Catalog
  { key: 'catalog:product:view', name: 'Xem sản phẩm', group: 'Product', module: 'Product', action: 'View' },
  { key: 'catalog:product:create', name: 'Thêm sản phẩm', group: 'Product', module: 'Product', action: 'Create' },
  { key: 'catalog:product:update', name: 'Sửa sản phẩm', group: 'Product', module: 'Product', action: 'Update' },
  { key: 'catalog:product:delete', name: 'Xóa sản phẩm', group: 'Product', module: 'Product', action: 'Delete' },
  { key: 'catalog:product:update-status', name: 'Cập nhật trạng thái', group: 'Product', module: 'Product', action: 'UpdateStatus' },
  { key: 'catalog:color:view', name: 'Xem màu sắc', group: 'Product', module: 'Color', action: 'View' },
  { key: 'catalog:color:create', name: 'Thêm màu sắc', group: 'Product', module: 'Color', action: 'Create' },
  { key: 'catalog:color:update', name: 'Sửa màu sắc', group: 'Product', module: 'Color', action: 'Update' },
  { key: 'catalog:color:delete', name: 'Xóa màu sắc', group: 'Product', module: 'Color', action: 'Delete' },
  { key: 'catalog:size:view', name: 'Xem kích thước', group: 'Product', module: 'Size', action: 'View' },
  { key: 'catalog:size:create', name: 'Thêm kích thước', group: 'Product', module: 'Size', action: 'Create' },
  { key: 'catalog:size:update', name: 'Sửa kích thước', group: 'Product', module: 'Size', action: 'Update' },
  { key: 'catalog:size:delete', name: 'Xóa kích thước', group: 'Product', module: 'Size', action: 'Delete' },
  { key: 'catalog:combo:view', name: 'Xem combo', group: 'Product', module: 'Combo', action: 'View' },
  { key: 'catalog:combo:create', name: 'Thêm combo', group: 'Product', module: 'Combo', action: 'Create' },
  { key: 'catalog:combo:update', name: 'Sửa combo', group: 'Product', module: 'Combo', action: 'Update' },
  { key: 'catalog:combo:delete', name: 'Xóa combo', group: 'Product', module: 'Combo', action: 'Delete' },

  // Category
  { key: 'catalog:category:create', name: 'Thêm danh mục', group: 'Category', module: 'Category', action: 'Create' },
  { key: 'catalog:category:update', name: 'Sửa danh mục', group: 'Category', module: 'Category', action: 'Update' },
  { key: 'catalog:category:delete', name: 'Xóa danh mục', group: 'Category', module: 'Category', action: 'Delete' },
  { key: 'catalog:department:view', name: 'Xem ngành hàng', group: 'Category', module: 'Department', action: 'View' },
  { key: 'catalog:department:create', name: 'Thêm ngành hàng', group: 'Category', module: 'Department', action: 'Create' },
  { key: 'catalog:attribute:view', name: 'Xem thuộc tính', group: 'Category', module: 'Attribute', action: 'View' },
  { key: 'catalog:attribute:create', name: 'Thêm thuộc tính', group: 'Category', module: 'Attribute', action: 'Create' },

  // Inventory
  { key: 'catalog:inventory:view', name: 'Xem tồn kho', group: 'Inventory', module: 'Inventory', action: 'View' },
  { key: 'catalog:inventory:adjust', name: 'Điều chỉnh tồn kho', group: 'Inventory', module: 'Inventory', action: 'Adjust' },
  { key: 'catalog:inventory:search', name: 'Tìm kiếm tồn kho', group: 'Inventory', module: 'Inventory', action: 'Search' },
  { key: 'catalog:inventory:low-stock', name: 'Cảnh báo sắp hết', group: 'Inventory', module: 'Inventory', action: 'LowStock' },

  // Sales
  { key: 'sales:invoice:view', name: 'Xem hóa đơn', group: 'Sales', module: 'Invoice', action: 'View' },
  { key: 'sales:invoice:create', name: 'Tạo hóa đơn', group: 'Sales', module: 'Invoice', action: 'Create' },
  { key: 'sales:invoice:update', name: 'Sửa hóa đơn', group: 'Sales', module: 'Invoice', action: 'Update' },
  { key: 'sales:invoice:delete', name: 'Xóa hóa đơn', group: 'Sales', module: 'Invoice', action: 'Delete' },
  { key: 'sales:quote:view', name: 'Xem báo giá', group: 'Sales', module: 'Quote', action: 'View' },
  { key: 'sales:quote:create', name: 'Tạo báo giá', group: 'Sales', module: 'Quote', action: 'Create' },
  { key: 'sales:return:view', name: 'Xem đơn trả hàng', group: 'Sales', module: 'Return', action: 'View' },
  { key: 'sales:return:create', name: 'Tạo đơn trả hàng', group: 'Sales', module: 'Return', action: 'Create' },

  // Finance
  { key: 'finance:bank:view', name: 'Xem NH', group: 'Finance', module: 'Bank', action: 'View' },
  { key: 'finance:bank:create', name: 'Thêm NH', group: 'Finance', module: 'Bank', action: 'Create' },
  { key: 'finance:bank:update', name: 'Sửa NH', group: 'Finance', module: 'Bank', action: 'Update' },
  { key: 'finance:bank:delete', name: 'Xóa NH', group: 'Finance', module: 'Bank', action: 'Delete' },

  // Purchase
  { key: 'purchase:order:view', name: 'Xem đơn mua', group: 'Purchase', module: 'Order', action: 'View' },
  { key: 'purchase:order:create', name: 'Tạo đơn mua', group: 'Purchase', module: 'Order', action: 'Create' },
  { key: 'purchase:order:approve', name: 'Duyệt đơn mua', group: 'Purchase', module: 'Order', action: 'Approve' },
  { key: 'purchase:request:view', name: 'Xem YC mua', group: 'Purchase', module: 'Request', action: 'View' },
  { key: 'purchase:contract:view', name: 'Xem hợp đồng', group: 'Purchase', module: 'Contract', action: 'View' },

  // HR
  { key: 'hrm:attendance:view', name: 'Xem chấm công', group: 'HR', module: 'Attendance', action: 'View' },
  { key: 'hrm:attendance:create', name: 'Tạo bảng chấm công', group: 'HR', module: 'Attendance', action: 'Create' },
  { key: 'hrm:attendance:adjust', name: 'Điều chỉnh chấm công', group: 'HR', module: 'Attendance', action: 'Adjust' },

  // System
  { key: 'system:user:view', name: 'Xem người dùng', group: 'System', module: 'User', action: 'View' },
  { key: 'system:user:create', name: 'Tạo người dùng', group: 'System', module: 'User', action: 'Create' },
  { key: 'system:user:update', name: 'Sửa người dùng', group: 'System', module: 'User', action: 'Update' },
  { key: 'system:user:delete', name: 'Xóa người dùng', group: 'System', module: 'User', action: 'Delete' },
  { key: 'system:role:view', name: 'Xem vai trò', group: 'System', module: 'Role', action: 'View' },
  { key: 'system:role:create', name: 'Tạo vai trò', group: 'System', module: 'Role', action: 'Create' },
  { key: 'system:role:update', name: 'Sửa vai trò', group: 'System', module: 'Role', action: 'Update' },
  { key: 'system:role:delete', name: 'Xóa vai trò', group: 'System', module: 'Role', action: 'Delete' },
  { key: 'system:role:assign-permissions', name: 'Gán quyền', group: 'System', module: 'Role', action: 'AssignPerm' },
  { key: 'system:branch:view', name: 'Xem chi nhánh', group: 'System', module: 'Branch', action: 'View' },
  { key: 'system:branch:create', name: 'Thêm chi nhánh', group: 'System', module: 'Branch', action: 'Create' },
];

// ── Helpers ──────────────────────────────────────────────────────
/** Group permissions by module/group */
export function getPermissionsByModule(permissions: PermissionItem[]): Record<string, PermissionItem[]> {
  const groups: Record<string, PermissionItem[]> = {};
  permissions.forEach(p => {
    const groupKey = p.group || p.module;
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(p);
  });
  return groups;
}

/** Get display format: Module.Action */
export function getPermissionDisplayKey(perm: PermissionItem): string {
  return `${perm.module}.${perm.action}`;
}

// ── Role colors ─────────────────────────────────────────────────
export const ROLE_COLORS = [
  { value: '#10b981', label: 'Xanh lá' },
  { value: '#3b82f6', label: 'Xanh dương' },
  { value: '#f59e0b', label: 'Vàng cam' },
  { value: '#ef4444', label: 'Đỏ' },
  { value: '#8b5cf6', label: 'Tím' },
  { value: '#ec4899', label: 'Hồng' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#6b7280', label: 'Xám' },
] as const;

// ── Store ────────────────────────────────────────────────────────
interface RoleStore {
  roles: SecurityRoleRecord[];
  roleUsers: RoleUser[];
  systemPermissions: PermissionItem[];
  isLoading: boolean;
  error: string | null;

  fetchRoles: () => Promise<void>;
  fetchSystemPermissions: () => Promise<void>;
  addRole: (role: Omit<SecurityRoleRecord, 'id' | 'createdDate' | 'assignedUsersCount'>) => Promise<void>;
  updateRole: (role: SecurityRoleRecord) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  cloneRole: (sourceRoleId: string, newRoleCode: string, newRoleTitle: string, newDescription: string) => Promise<void>;
  fetchRoleUsers: (roleId: string) => Promise<void>;
  getRolePermissions: (roleCode: string) => string[];
  checkPermission: (roleCode: string, permissionKey: string) => boolean;
}

export const useRoleStore = create<RoleStore>()(
  persist(
    (set, get) => ({
      roles: [],
      roleUsers: [],
      systemPermissions: DEFAULT_SYSTEM_PERMISSIONS,
      isLoading: false,
      error: null,

      fetchSystemPermissions: async () => {
        try {
          const response = await axiosClient.get<any, any>('/permissions');
          const rawList = Array.isArray(response) ? response : (response?.content || response?.data || response?.items || []);
          if (Array.isArray(rawList) && rawList.length > 0) {
            const mapped = rawList.map(parseApiPermission);
            set({ systemPermissions: mapped });
          }
        } catch (err: any) {
          console.error('Failed to fetch system permissions:', err);
        }
      },

      fetchRoles: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosClient.get<any, any>('/roles');
          const rawRoles = Array.isArray(response) ? response : (response?.content || response?.data || response?.items || []);
          const mapped = (Array.isArray(rawRoles) ? rawRoles : []).map((r: any) => ({
            id: String(r.id),
            roleCode: r.roleCode || r.roleName || '',
            roleTitle: r.roleName || r.roleCode || 'Vai trò',
            description: r.description || '',
            assignedUsersCount: r.userCount ?? 1,
            permissionScope: (r.roleCode === 'SUPER_ADMIN' || r.roleName === 'SUPER_ADMIN' ? 'GLOBAL_SUPERADMIN' : 'BRANCH_OPERATIONS') as any,
            dataScopeBranchIds: r.dataScopeBranchIds || ['BR-001'],
            isSystemRole: r.roleCode === 'SUPER_ADMIN' || r.roleName === 'SUPER_ADMIN' || r.isSystemRole,
            mfaEnforced: r.roleCode === 'SUPER_ADMIN' || r.roleName === 'SUPER_ADMIN',
            sessionTimeoutMinutes: r.roleCode === 'SUPER_ADMIN' ? 15 : 60,
            status: (r.isActive !== false ? 'ACTIVE' : 'DEPRECATED') as 'ACTIVE' | 'DEPRECATED' | 'AUDIT_HOLD',
            createdDate: r.createdAt ? r.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            grantedPermissions: r.permissions || [],
            color: r.color || '#10b981',
          }));
          set({ roles: mapped, isLoading: false });
        } catch (err: any) {
          console.error('Failed to fetch roles:', err);
          set({ isLoading: false, error: err.message || 'Lỗi khi tải danh sách vai trò' });
        }
      },

      addRole: async (newRole) => {
        set({ isLoading: true, error: null });
        try {
          const payload = {
            roleName: newRole.roleCode,
            description: newRole.description,
            isActive: newRole.status === 'ACTIVE',
          };
          const created: any = await axiosClient.post('/roles', payload);
          const roleId = created.id;

          if (newRole.grantedPermissions?.length) {
            const allPerms = await axiosClient.get<any, any[]>('/permissions');
            const permIds = allPerms
              .filter((p: any) => newRole.grantedPermissions.includes(p.permissionCode))
              .map((p: any) => p.id);
            if (permIds.length) {
              await axiosClient.post(`/roles/${roleId}/permissions`, { permissionIds: permIds });
            }
          }

          await get().fetchRoles();
        } catch (err: any) {
          console.error('Failed to add role:', err);
          set({ isLoading: false, error: err.message || 'Lỗi khi thêm vai trò mới' });
          throw err;
        }
      },

      updateRole: async (updatedRole) => {
        set({ isLoading: true, error: null });
        try {
          const roleId = updatedRole.id;
          const payload = {
            roleName: updatedRole.roleCode,
            description: updatedRole.description,
          };
          await axiosClient.put(`/roles/${roleId}`, payload);
          await axiosClient.put(`/roles/${roleId}/status?isActive=${updatedRole.status === 'ACTIVE'}`);

          const allPerms = await axiosClient.get<any, any[]>('/permissions');
          const permIds = allPerms
            .filter((p: any) => updatedRole.grantedPermissions.includes(p.permissionCode))
            .map((p: any) => p.id);
          await axiosClient.post(`/roles/${roleId}/permissions`, { permissionIds: permIds });

          await get().fetchRoles();
        } catch (err: any) {
          console.error('Failed to update role:', err);
          set({ isLoading: false, error: err.message || 'Lỗi khi cập nhật vai trò' });
          throw err;
        }
      },

      deleteRole: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await axiosClient.put(`/roles/${id}/status?isActive=false`);
          await axiosClient.delete(`/roles/${id}`);
          await get().fetchRoles();
        } catch (err: any) {
          console.error('Failed to delete role:', err);
          const msg = err.response?.data?.message || err.message || 'Lỗi khi xóa vai trò';
          set({ isLoading: false, error: msg });
          throw err;
        }
      },

      cloneRole: async (sourceRoleId, newRoleCode, newRoleTitle, newDescription) => {
        set({ isLoading: true, error: null });
        try {
          const sourceRole = get().roles.find(r => r.id === sourceRoleId);
          if (!sourceRole) throw new Error('Không tìm thấy vai trò nguồn');

          // Create new role
          const payload = {
            roleName: newRoleCode,
            description: newDescription || sourceRole.description,
            isActive: true,
          };
          const created: any = await axiosClient.post('/roles', payload);
          const newRoleId = created.id;

          // Copy permissions from source
          if (sourceRole.grantedPermissions?.length) {
            const allPerms = await axiosClient.get<any, any[]>('/permissions');
            const permIds = allPerms
              .filter((p: any) => sourceRole.grantedPermissions.includes(p.permissionCode))
              .map((p: any) => p.id);
            if (permIds.length) {
              await axiosClient.post(`/roles/${newRoleId}/permissions`, { permissionIds: permIds });
            }
          }

          await get().fetchRoles();
        } catch (err: any) {
          console.error('Failed to clone role:', err);
          set({ isLoading: false, error: err.message || 'Lỗi khi sao chép vai trò' });
          throw err;
        }
      },

      fetchRoleUsers: async (_roleId: string) => {
        // Placeholder — backend may or may not have this endpoint
        // For now, return empty array; the UI can show all users with checkbox
        set({ roleUsers: [] });
      },

      getRolePermissions: (roleCode) => {
        const role = get().roles.find(r => r.roleCode === roleCode);
        return role ? role.grantedPermissions : [];
      },

      checkPermission: (roleCode, permissionKey) => {
        const permissions = get().getRolePermissions(roleCode);
        if (permissions.includes('*')) return true;
        return permissions.includes(permissionKey);
      },
    }),
    {
      name: 'retailhub-roles',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
