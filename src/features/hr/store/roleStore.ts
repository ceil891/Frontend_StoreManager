import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface SecurityRoleRecord {
  id: string;
  roleCode: string; // e.g. "SUPER_ADMIN", "STORE_MANAGER", "STAFF"
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
  grantedPermissions: string[]; // Permission keys
}

export interface PermissionItem {
  key: string;
  name: string;
  group: string;
}

// Master list of system permissions in Vietnamese for ease of editing
export const ALL_SYSTEM_PERMISSIONS: PermissionItem[] = [
  // POS
  { key: 'pos:access', name: 'Truy cập màn hình bán hàng POS', group: 'Điểm bán hàng (POS)' },
  { key: 'pos:sessions:view', name: 'Xem phiên giao dịch POS', group: 'Điểm bán hàng (POS)' },
  { key: 'pos:sessions:manage', name: 'Mở/Đóng/Khai báo phiên POS', group: 'Điểm bán hàng (POS)' },
  { key: 'pos:payments:manage', name: 'Cấu hình phương thức thanh toán', group: 'Điểm bán hàng (POS)' },
  
  // Sales
  { key: 'sales:orders:view', name: 'Xem đơn bán hàng (Sale Orders)', group: 'Quản lý bán hàng' },
  { key: 'sales:orders:create', name: 'Tạo mới đơn bán hàng', group: 'Quản lý bán hàng' },
  { key: 'sales:quotes:manage', name: 'Quản lý báo giá (Quotations)', group: 'Quản lý bán hàng' },
  { key: 'sales:invoices:manage', name: 'Quản lý hóa đơn xuất khẩu', group: 'Quản lý bán hàng' },
  { key: 'sales:returns:manage', name: 'Xử lý khách hàng trả hàng', group: 'Quản lý bán hàng' },

  // Inventory
  { key: 'inventory:products:view', name: 'Xem sản phẩm & SKUs', group: 'Kiểm soát kho hàng' },
  { key: 'inventory:products:write', name: 'Thêm mới/Cập nhật sản phẩm', group: 'Kiểm soát kho hàng' },
  { key: 'inventory:transfers:manage', name: 'Điều chuyển kho hàng', group: 'Kiểm soát kho hàng' },
  { key: 'inventory:checks:manage', name: 'Kiểm kê tồn kho', group: 'Kiểm soát kho hàng' },
  { key: 'inventory:imports:manage', name: 'Quản lý phiếu nhập kho', group: 'Kiểm soát kho hàng' },
  { key: 'inventory:returns:manage', name: 'Trả hàng nhà cung cấp', group: 'Kiểm soát kho hàng' },
  { key: 'inventory:writeoff:manage', name: 'Hủy hàng / Xuất thanh lý', group: 'Kiểm soát kho hàng' },
  { key: 'inventory:ledger:view', name: 'Xem sổ kho / Thẻ kho', group: 'Kiểm soát kho hàng' },
  { key: 'inventory:categories:manage', name: 'Quản lý Danh mục & Đơn vị tính', group: 'Kiểm soát kho hàng' },

  // Purchase
  { key: 'purchase:suppliers:manage', name: 'Quản lý nhà cung cấp', group: 'Mua hàng & Nhập kho' },
  { key: 'purchase:orders:manage', name: 'Quản lý đơn mua hàng (PO)', group: 'Mua hàng & Nhập kho' },

  // Finance
  { key: 'finance:receipts:manage', name: 'Quản lý phiếu thu', group: 'Tài chính & Thu chi' },
  { key: 'finance:payments:manage', name: 'Quản lý phiếu chi', group: 'Tài chính & Thu chi' },
  { key: 'finance:debts:view', name: 'Theo dõi sổ nợ công nợ', group: 'Tài chính & Thu chi' },
  { key: 'finance:costs:manage', name: 'Quản lý chi phí vận hành', group: 'Tài chính & Thu chi' },
  { key: 'finance:banks:manage', name: 'Quản lý tài khoản ngân hàng', group: 'Tài chính & Thu chi' },
  { key: 'finance:journal:manage', name: 'Quản lý bút toán sổ nhật ký', group: 'Tài chính & Thu chi' },
  { key: 'finance:reasons:manage', name: 'Quản lý lý do giao dịch & mã GL', group: 'Tài chính & Thu chi' },

  // CRM
  { key: 'crm:customers:manage', name: 'Quản lý danh sách khách hàng', group: 'Chăm sóc khách hàng (CRM)' },
  { key: 'crm:loyalty:manage', name: 'Cấu hình hạng thành viên', group: 'Chăm sóc khách hàng (CRM)' },
  { key: 'crm:vouchers:manage', name: 'Quản lý Voucher & Khuyến mãi', group: 'Chăm sóc khách hàng (CRM)' },
  { key: 'crm:feedback:manage', name: 'Xem phản hồi & Hỗ trợ (Tickets)', group: 'Chăm sóc khách hàng (CRM)' },

  // Logistics
  { key: 'logistics:shippers:manage', name: 'Quản lý đơn vị vận chuyển', group: 'Vận chuyển & Logistics' },
  { key: 'logistics:trips:manage', name: 'Điều phối chuyến giao hàng', group: 'Vận chuyển & Logistics' },
  { key: 'logistics:prices:manage', name: 'Quản lý bảng giá & Khuyến mãi vận chuyển', group: 'Vận chuyển & Logistics' },

  // Administration & System Security
  { key: 'admin:users:manage', name: 'Quản lý tài khoản người dùng', group: 'Quản trị hệ thống' },
  { key: 'admin:roles:manage', name: 'Quản lý vai trò & Phân quyền', group: 'Quản trị hệ thống' },
  { key: 'admin:departments:manage', name: 'Quản lý phòng ban', group: 'Quản trị hệ thống' },
  { key: 'admin:positions:manage', name: 'Quản lý chức danh / vị trí công việc', group: 'Quản trị hệ thống' },
  { key: 'admin:logs:view', name: 'Xem nhật ký hoạt động (Audit Logs)', group: 'Quản trị hệ thống' },
  { key: 'system:settings:manage', name: 'Cài đặt hệ thống lõi', group: 'Quản trị hệ thống' },
  { key: 'system:vat:manage', name: 'Cấu hình Thuế suất & VAT', group: 'Quản trị hệ thống' },
  { key: 'system:errors:view', name: 'Xem báo cáo lỗi & Diagnostic Logs', group: 'Quản trị hệ thống' },
];

export const DEFAULT_MOCK_ROLES: SecurityRoleRecord[] = [
  {
    id: '1',
    roleCode: 'SUPER_ADMIN',
    roleTitle: 'Quản trị viên toàn hệ thống',
    description: 'Quyền root toàn năng. Cho phép cấu hình hệ thống, quản lý tài chính doanh nghiệp và chính sách an ninh mạng.',
    assignedUsersCount: 1,
    permissionScope: 'GLOBAL_SUPERADMIN',
    dataScopeBranchIds: ['*'],
    isSystemRole: true,
    mfaEnforced: true,
    sessionTimeoutMinutes: 15,
    status: 'ACTIVE',
    createdDate: '2020-01-01',
    grantedPermissions: ['*'] // Represents all system permissions
  },
  {
    id: '2',
    roleCode: 'STORE_MANAGER',
    roleTitle: 'Quản lý chi nhánh cửa hàng',
    description: 'Giám sát bán hàng tại quầy POS, phê duyệt nhập xuất kho, quản lý danh sách sản phẩm và khách hàng chi nhánh.',
    assignedUsersCount: 1,
    permissionScope: 'BRANCH_OPERATIONS',
    dataScopeBranchIds: ['BR-001'],
    isSystemRole: false,
    mfaEnforced: true,
    sessionTimeoutMinutes: 60,
    status: 'ACTIVE',
    createdDate: '2022-02-15',
    grantedPermissions: [
      // Allow store manager to manage employee accounts (HR users page)
      'admin:users:manage',
      'pos:access',
      'pos:sessions:view',
      'pos:sessions:manage',
      'sales:orders:view',
      'sales:orders:create',
      'sales:quotes:manage',
      'sales:invoices:manage',
      'sales:returns:manage',
      'finance:receipts:manage',
      'finance:payments:manage',
      'finance:debts:view',
      'finance:costs:manage',
      'finance:banks:manage',
      'finance:journal:manage',
      'finance:reasons:manage',
      'admin:positions:manage',
      'inventory:products:view',
      'inventory:transfers:manage',
      'inventory:checks:manage',
      'inventory:imports:manage',
      'inventory:returns:manage',
      'inventory:ledger:view',
      'purchase:suppliers:manage',
      'purchase:orders:manage',
      'crm:customers:manage',
      'crm:vouchers:manage',
      'crm:feedback:manage',
      'logistics:shippers:manage',
      'logistics:trips:manage',
      'logistics:prices:manage',
    ]
  },
  {
    id: '3',
    roleCode: 'INVENTORY_STAFF',
    roleTitle: 'Nhân viên quản lý kho',
    description: 'Thực hiện kiểm kê kho hàng vật lý, tạo phiếu nhập/xuất kho và kiểm tra hạn sử dụng lô hàng.',
    assignedUsersCount: 1,
    permissionScope: 'BRANCH_OPERATIONS',
    dataScopeBranchIds: ['BR-002'],
    isSystemRole: false,
    mfaEnforced: false,
    sessionTimeoutMinutes: 120,
    status: 'ACTIVE',
    createdDate: '2023-01-10',
    grantedPermissions: [
      'inventory:products:view',
      'inventory:products:write',
      'inventory:checks:manage',
      'inventory:imports:manage',
      'inventory:ledger:view',
    ]
  },
  {
    id: '4',
    roleCode: 'STAFF',
    roleTitle: 'Nhân viên thu ngân bán hàng',
    description: 'Mở ca bán hàng, tạo hóa đơn bán lẻ tại quầy POS. Không có quyền sửa đổi cài đặt hệ thống hoặc phê duyệt kho.',
    assignedUsersCount: 1,
    permissionScope: 'RESTRICTED_CASHIER',
    dataScopeBranchIds: ['BR-001'],
    isSystemRole: false,
    mfaEnforced: false,
    sessionTimeoutMinutes: 240,
    status: 'ACTIVE',
    createdDate: '2022-02-15',
    grantedPermissions: [
      'pos:access',
      'sales:orders:view',
      'sales:orders:create',
      'crm:customers:manage',
    ]
  }
];

interface RoleStore {
  roles: SecurityRoleRecord[];
  isLoading: boolean;
  error: string | null;
  fetchRoles: () => Promise<void>;
  addRole: (role: Omit<SecurityRoleRecord, 'id' | 'createdDate' | 'assignedUsersCount'>) => Promise<void>;
  updateRole: (role: SecurityRoleRecord) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  getRolePermissions: (roleCode: string) => string[];
  checkPermission: (roleCode: string, permissionKey: string) => boolean;
}

export const useRoleStore = create<RoleStore>()(
  persist(
    (set, get) => ({
      roles: [],
      isLoading: false,
      error: null,

      fetchRoles: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosClient.get<any, any[]>('/roles?includeDeleted=false');
          const mapped = response.map((r: any) => ({
            id: String(r.id),
            roleCode: r.roleName || '', // e.g. "SUPER_ADMIN"
            roleTitle: r.roleName === 'SUPER_ADMIN' ? 'Quản trị viên toàn hệ thống' : r.roleName,
            description: r.description || '',
            assignedUsersCount: 1, // Fallback
            permissionScope: (r.roleName === 'SUPER_ADMIN' ? 'GLOBAL_SUPERADMIN' : 'BRANCH_OPERATIONS') as any,
            mfaEnforced: r.roleName === 'SUPER_ADMIN',
            sessionTimeoutMinutes: r.roleName === 'SUPER_ADMIN' ? 15 : 60,
            status: (r.isActive ? 'ACTIVE' : 'DEPRECATED') as 'ACTIVE' | 'DEPRECATED' | 'AUDIT_HOLD',
            createdDate: r.createdAt ? r.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            grantedPermissions: r.permissions || [],
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
          // 1. Tạo vai trò mới
          const payload = {
            roleName: newRole.roleCode,
            description: newRole.description,
            isActive: newRole.status === 'ACTIVE',
          };
          const created: any = await axiosClient.post('/roles', payload);
          const roleId = created.id;

          // 2. Gán quyền
          if (newRole.grantedPermissions?.length) {
            // Lấy tất cả permissions trong DB để map code -> ID
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
          // 1. Cập nhật thông tin vai trò
          const payload = {
            roleName: updatedRole.roleCode,
            description: updatedRole.description,
          };
          await axiosClient.put(`/roles/${roleId}`, payload);
          await axiosClient.put(`/roles/${roleId}/status?isActive=${updatedRole.status === 'ACTIVE'}`);

          // 2. Cập nhật quyền (xóa hết quyền cũ, gán lại quyền mới)
          const allPerms = await axiosClient.get<any, any[]>('/permissions');
          const permIds = allPerms
            .filter((p: any) => updatedRole.grantedPermissions.includes(p.permissionCode))
            .map((p: any) => p.id);

          // Gọi API assignPermissions để lưu danh sách quyền mới (API assign của backend xóa toàn bộ rồi gán lại, rất phù hợp!)
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
          // Trước tiên cần tắt hoạt động
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

      getRolePermissions: (roleCode) => {
        const role = get().roles.find(r => r.roleCode === roleCode);
        return role ? role.grantedPermissions : [];
      },

      checkPermission: (roleCode, permissionKey) => {
        const permissions = get().getRolePermissions(roleCode);
        if (permissions.includes('*')) return true; // Super admin overrides everything
        return permissions.includes(permissionKey);
      }
    }),
    {
      name: 'retailhub-roles',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
