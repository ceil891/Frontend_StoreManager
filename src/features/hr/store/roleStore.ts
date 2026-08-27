import { create } from 'zustand';
import { roleService } from '../services/roleService';
import { permissionService } from '../services/permissionService';

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

  let group = 'System';
  const prefix = parts[0]?.toLowerCase();
  const subPrefix = parts[1]?.toLowerCase();

  if (prefix === 'dashboard') group = 'Dashboard';
  else if (prefix === 'sales') group = 'Sales';
  else if (prefix === 'pos') {
    group = 'POS';
    if (key === 'pos:terminal:access') { moduleName = 'Màn hình POS'; action = 'Truy cập'; }
    else if (key === 'pos:session:view') { moduleName = 'Ca làm việc'; action = 'Xem ca'; }
    else if (key === 'pos:session:open') { moduleName = 'Ca làm việc'; action = 'Mở ca'; }
    else if (key === 'pos:session:close') { moduleName = 'Ca làm việc'; action = 'Chốt ca'; }
    else if (key === 'pos:payment:process') { moduleName = 'Thanh toán'; action = 'Xác nhận'; }
    else if (key === 'pos:order:discount') { moduleName = 'Bán hàng POS'; action = 'Chiết khấu'; }
    else if (key === 'pos:order:cancel') { moduleName = 'Bán hàng POS'; action = 'Hủy đơn'; }
    else if (key === 'pos:inventory:negative-sell') { moduleName = 'Tồn kho POS'; action = 'Bán âm kho'; }
    else if (key === 'pos:price:override') { moduleName = 'Giá bán POS'; action = 'Sửa giá'; }
  }
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

  return { key, name, group, module: moduleVi, action: actionVi };
}


// ── Default/Fallback System Permissions List ─────────────────────
export const DEFAULT_SYSTEM_PERMISSIONS: PermissionItem[] = [
  // Dashboard
  { key: 'dashboard:view', name: 'Xem tổng quan Dashboard', group: 'Dashboard', module: 'Dashboard', action: 'View' },

  // Product & Catalog
  { key: 'catalog:product:view', name: 'Xem sản phẩm', group: 'Product', module: 'Product', action: 'View' },
  { key: 'catalog:product:create', name: 'Thêm sản phẩm', group: 'Product', module: 'Product', action: 'Create' },
  { key: 'catalog:product:update', name: 'Sửa sản phẩm', group: 'Product', module: 'Product', action: 'Update' },
  { key: 'catalog:product:delete', name: 'Xóa sản phẩm', group: 'Product', module: 'Product', action: 'Delete' },
  { key: 'catalog:product:update-status', name: 'Cập nhật trạng thái sản phẩm', group: 'Product', module: 'Product', action: 'UpdateStatus' },
  { key: 'catalog:color:view', name: 'Xem màu sắc', group: 'Product', module: 'Color', action: 'View' },
  { key: 'catalog:color:create', name: 'Thêm màu sắc', group: 'Product', module: 'Color', action: 'Create' },
  { key: 'catalog:color:update', name: 'Sửa màu sắc', group: 'Product', module: 'Color', action: 'Update' },
  { key: 'catalog:color:delete', name: 'Xóa màu sắc', group: 'Product', module: 'Color', action: 'Delete' },
  { key: 'catalog:size:view', name: 'Xem kích thước', group: 'Product', module: 'Size', action: 'View' },
  { key: 'catalog:size:create', name: 'Thêm kích thước', group: 'Product', module: 'Size', action: 'Create' },
  { key: 'catalog:size:update', name: 'Sửa kích thước', group: 'Product', module: 'Size', action: 'Update' },
  { key: 'catalog:size:delete', name: 'Xóa kích thước', group: 'Product', module: 'Size', action: 'Delete' },
  { key: 'catalog:combo:view', name: 'Xem combo sản phẩm', group: 'Product', module: 'Combo', action: 'View' },
  { key: 'catalog:combo:create', name: 'Thêm combo sản phẩm', group: 'Product', module: 'Combo', action: 'Create' },
  { key: 'catalog:combo:update', name: 'Sửa combo sản phẩm', group: 'Product', module: 'Combo', action: 'Update' },
  { key: 'catalog:combo:delete', name: 'Xóa combo sản phẩm', group: 'Product', module: 'Combo', action: 'Delete' },

  // Category & Attributes
  { key: 'catalog:category:view', name: 'Xem danh mục', group: 'Category', module: 'Category', action: 'View' },
  { key: 'catalog:category:create', name: 'Thêm danh mục', group: 'Category', module: 'Category', action: 'Create' },
  { key: 'catalog:category:update', name: 'Sửa danh mục', group: 'Category', module: 'Category', action: 'Update' },
  { key: 'catalog:category:delete', name: 'Xóa danh mục', group: 'Category', module: 'Category', action: 'Delete' },
  { key: 'catalog:department:view', name: 'Xem ngành hàng', group: 'Category', module: 'Department', action: 'View' },
  { key: 'catalog:department:create', name: 'Thêm ngành hàng', group: 'Category', module: 'Department', action: 'Create' },
  { key: 'catalog:attribute:view', name: 'Xem thuộc tính', group: 'Category', module: 'Attribute', action: 'View' },
  { key: 'catalog:attribute:create', name: 'Thêm thuộc tính', group: 'Category', module: 'Attribute', action: 'Create' },
  { key: 'catalog:unit:view', name: 'Xem đơn vị tính', group: 'Category', module: 'Unit', action: 'View' },
  { key: 'catalog:unit:create', name: 'Thêm đơn vị tính', group: 'Category', module: 'Unit', action: 'Create' },

  // Inventory & WMS
  { key: 'catalog:inventory:view', name: 'Xem tồn kho', group: 'Inventory', module: 'Inventory', action: 'View' },
  { key: 'catalog:inventory:adjust', name: 'Điều chỉnh tồn kho', group: 'Inventory', module: 'Inventory', action: 'Adjust' },
  { key: 'catalog:inventory:search', name: 'Tìm kiếm tồn kho mã vạch', group: 'Inventory', module: 'Inventory', action: 'Search' },
  { key: 'catalog:inventory:low-stock', name: 'Cảnh báo sắp hết hàng', group: 'Inventory', module: 'Inventory', action: 'LowStock' },
  { key: 'catalog:inventory:transfer', name: 'Chuyển kho hàng', group: 'Inventory', module: 'Inventory', action: 'Transfer' },
  { key: 'catalog:inventory:batch', name: 'Quản lý lô hàng & HSD', group: 'Inventory', module: 'Batch', action: 'View' },

  // Sales
  { key: 'sales:order:view', name: 'Xem đơn bán hàng', group: 'Sales', module: 'Order', action: 'View' },
  { key: 'sales:order:create', name: 'Tạo đơn bán hàng', group: 'Sales', module: 'Order', action: 'Create' },
  { key: 'sales:order:update', name: 'Sửa đơn bán hàng', group: 'Sales', module: 'Order', action: 'Update' },
  { key: 'sales:invoice:view', name: 'Xem hóa đơn bán lẻ', group: 'Sales', module: 'Invoice', action: 'View' },
  { key: 'sales:invoice:create', name: 'Tạo hóa đơn bán lẻ', group: 'Sales', module: 'Invoice', action: 'Create' },
  { key: 'sales:quote:view', name: 'Xem báo giá', group: 'Sales', module: 'Quote', action: 'View' },
  { key: 'sales:quote:create', name: 'Tạo báo giá', group: 'Sales', module: 'Quote', action: 'Create' },
  { key: 'sales:return:view', name: 'Xem đơn khách trả hàng', group: 'Sales', module: 'Return', action: 'View' },
  { key: 'sales:return:create', name: 'Tạo đơn khách trả hàng', group: 'Sales', module: 'Return', action: 'Create' },

  // POS Terminal
  { key: 'pos:terminal:access', name: 'Truy cập màn hình bán hàng POS', group: 'POS', module: 'Màn hình POS', action: 'Truy cập' },
  { key: 'pos:session:view', name: 'Xem lịch sử ca làm việc POS', group: 'POS', module: 'Ca làm việc', action: 'Xem ca' },
  { key: 'pos:session:open', name: 'Mở ca làm việc POS (Vào ca)', group: 'POS', module: 'Ca làm việc', action: 'Mở ca' },
  { key: 'pos:session:close', name: 'Chốt & Kết thúc ca POS (Tan ca)', group: 'POS', module: 'Ca làm việc', action: 'Chốt ca' },
  { key: 'pos:payment:process', name: 'Thực hiện thanh toán đơn hàng POS', group: 'POS', module: 'Thanh toán', action: 'Xác nhận' },
  { key: 'pos:order:discount', name: 'Áp dụng chiết khấu / Giảm giá đơn POS', group: 'POS', module: 'Bán hàng POS', action: 'Chiết khấu' },
  { key: 'pos:order:cancel', name: 'Hủy đơn hàng bán lẻ tại quầy POS', group: 'POS', module: 'Bán hàng POS', action: 'Hủy đơn' },
  { key: 'pos:inventory:negative-sell', name: 'Cho phép bán âm tồn kho tại POS', group: 'POS', module: 'Tồn kho POS', action: 'Bán âm kho' },
  { key: 'pos:price:override', name: 'Cho phép chỉnh sửa giá bán tại quầy POS', group: 'POS', module: 'Giá bán POS', action: 'Sửa giá' },



  // Purchase
  { key: 'purchase:supplier:view', name: 'Xem nhà cung cấp', group: 'Purchase', module: 'Supplier', action: 'View' },
  { key: 'purchase:supplier:create', name: 'Thêm nhà cung cấp', group: 'Purchase', module: 'Supplier', action: 'Create' },
  { key: 'purchase:order:view', name: 'Xem đơn mua hàng', group: 'Purchase', module: 'Order', action: 'View' },
  { key: 'purchase:order:create', name: 'Tạo đơn mua hàng', group: 'Purchase', module: 'Order', action: 'Create' },
  { key: 'purchase:order:approve', name: 'Phê duyệt đơn mua hàng', group: 'Purchase', module: 'Order', action: 'Approve' },
  { key: 'purchase:request:view', name: 'Xem đề xuất mua hàng', group: 'Purchase', module: 'Request', action: 'View' },
  { key: 'purchase:contract:view', name: 'Xem hợp đồng NCC', group: 'Purchase', module: 'Contract', action: 'View' },

  // CRM
  { key: 'crm:customer:view', name: 'Xem thông tin khách hàng', group: 'CRM', module: 'Customer', action: 'View' },
  { key: 'crm:customer:create', name: 'Thêm khách hàng', group: 'CRM', module: 'Customer', action: 'Create' },
  { key: 'crm:customer:update', name: 'Sửa thông tin khách hàng', group: 'CRM', module: 'Customer', action: 'Update' },
  { key: 'crm:customer:delete', name: 'Xóa khách hàng', group: 'CRM', module: 'Customer', action: 'Delete' },
  { key: 'crm:voucher:view', name: 'Xem voucher khuyến mãi', group: 'CRM', module: 'Voucher', action: 'View' },
  { key: 'crm:voucher:create', name: 'Tạo voucher khuyến mãi', group: 'CRM', module: 'Voucher', action: 'Create' },
  { key: 'crm:warranty:view', name: 'Xem sổ bảo hành', group: 'CRM', module: 'Warranty', action: 'View' },
  { key: 'crm:ticket:view', name: 'Xem phản hồi & hỗ trợ', group: 'CRM', module: 'Ticket', action: 'View' },

  // Finance
  { key: 'finance:receipt:view', name: 'Xem phiếu thu', group: 'Finance', module: 'Receipt', action: 'View' },
  { key: 'finance:receipt:create', name: 'Tạo phiếu thu', group: 'Finance', module: 'Receipt', action: 'Create' },
  { key: 'finance:payment:view', name: 'Xem phiếu chi', group: 'Finance', module: 'Payment', action: 'View' },
  { key: 'finance:payment:create', name: 'Tạo phiếu chi', group: 'Finance', module: 'Payment', action: 'Create' },
  { key: 'finance:debt:view', name: 'Xem sổ nợ công nợ', group: 'Finance', module: 'Debt', action: 'View' },
  { key: 'finance:bank:view', name: 'Xem tài khoản ngân hàng', group: 'Finance', module: 'Bank', action: 'View' },
  { key: 'finance:bank:create', name: 'Thêm tài khoản ngân hàng', group: 'Finance', module: 'Bank', action: 'Create' },
  { key: 'finance:bank:update', name: 'Sửa tài khoản ngân hàng', group: 'Finance', module: 'Bank', action: 'Update' },
  { key: 'finance:bank:delete', name: 'Xóa tài khoản ngân hàng', group: 'Finance', module: 'Bank', action: 'Delete' },

  // Logistics
  { key: 'logistics:shipper:view', name: 'Xem đối tác giao hàng (Shipper)', group: 'Logistics', module: 'Shipper', action: 'View' },
  { key: 'logistics:shipper:create', name: 'Thêm đối tác giao hàng', group: 'Logistics', module: 'Shipper', action: 'Create' },
  { key: 'logistics:carrier:view', name: 'Xem đơn vị vận chuyển', group: 'Logistics', module: 'Carrier', action: 'View' },
  { key: 'logistics:carrier:create', name: 'Thêm đơn vị vận chuyển', group: 'Logistics', module: 'Carrier', action: 'Create' },
  { key: 'logistics:trip:view', name: 'Xem chuyến xe & tuyến đường', group: 'Logistics', module: 'Trip', action: 'View' },
  { key: 'logistics:shipment:view', name: 'Xem lô hàng vận chuyển', group: 'Logistics', module: 'Shipment', action: 'View' },
  { key: 'logistics:price:view', name: 'Xem bảng giá & cước phí', group: 'Logistics', module: 'Price', action: 'View' },

  // HR
  { key: 'hrm:attendance:view', name: 'Xem chấm công nhân sự', group: 'HR', module: 'Attendance', action: 'View' },
  { key: 'hrm:attendance:create', name: 'Tạo dữ liệu chấm công', group: 'HR', module: 'Attendance', action: 'Create' },
  { key: 'hrm:attendance:adjust', name: 'Điều chỉnh chấm công', group: 'HR', module: 'Attendance', action: 'Adjust' },
  { key: 'hrm:payroll:view', name: 'Xem bảng lương', group: 'HR', module: 'Payroll', action: 'View' },
  { key: 'hrm:kpi:view', name: 'Xem đánh giá KPI', group: 'HR', module: 'KPI', action: 'View' },

  // Report
  { key: 'report:sales:view', name: 'Xem báo cáo bán hàng', group: 'Report', module: 'SalesReport', action: 'View' },
  { key: 'report:inventory:view', name: 'Xem báo cáo tồn kho', group: 'Report', module: 'InventoryReport', action: 'View' },
  { key: 'report:finance:view', name: 'Xem báo cáo tài chính', group: 'Report', module: 'FinanceReport', action: 'View' },

  // System
  { key: 'system:user:view', name: 'Xem danh sách người dùng', group: 'System', module: 'User', action: 'View' },
  { key: 'system:user:create', name: 'Tạo tài khoản người dùng', group: 'System', module: 'User', action: 'Create' },
  { key: 'system:user:update', name: 'Sửa thông tin người dùng', group: 'System', module: 'User', action: 'Update' },
  { key: 'system:user:delete', name: 'Khóa / Xóa người dùng', group: 'System', module: 'User', action: 'Delete' },
  { key: 'system:role:view', name: 'Xem vai trò người dùng', group: 'System', module: 'Role', action: 'View' },
  { key: 'system:role:create', name: 'Tạo vai trò mới', group: 'System', module: 'Role', action: 'Create' },
  { key: 'system:role:update', name: 'Sửa vai trò & cấu hình quyền', group: 'System', module: 'Role', action: 'Update' },
  { key: 'system:role:delete', name: 'Xóa vai trò', group: 'System', module: 'Role', action: 'Delete' },
  { key: 'system:role:assign-permissions', name: 'Gán phân quyền vai trò', group: 'System', module: 'Role', action: 'AssignPerm' },
  { key: 'system:branch:view', name: 'Xem danh sách chi nhánh', group: 'System', module: 'Branch', action: 'View' },
  { key: 'system:branch:create', name: 'Thêm chi nhánh mới', group: 'System', module: 'Branch', action: 'Create' },
  { key: 'system:permission:view', name: 'Xem danh sách quyền hệ thống', group: 'System', module: 'Permission', action: 'View' },
  { key: 'system:device-session:view', name: 'Xem phiên đăng nhập thiết bị (Device ID/IP)', group: 'System', module: 'DeviceSession', action: 'View' },
  { key: 'system:device-session:revoke', name: 'Thu hồi phiên đăng nhập thiết bị', group: 'System', module: 'DeviceSession', action: 'Delete' },
];

// ── Helpers ──────────────────────────────────────────────────────
export function getPermissionsByModule(permissions: PermissionItem[]): Record<string, PermissionItem[]> {
  const groups: Record<string, PermissionItem[]> = {};
  permissions.forEach(p => {
    const groupKey = p.group || p.module;
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(p);
  });
  return groups;
}

export function getPermissionDisplayKey(perm: PermissionItem): string {
  return `${perm.module}.${perm.action}`;
}

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

// ── Store Interface ──────────────────────────────────────────────
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

export const useRoleStore = create<RoleStore>()((set, get) => ({
  roles: [],
  roleUsers: [],
  systemPermissions: DEFAULT_SYSTEM_PERMISSIONS,
  isLoading: false,
  error: null,

  fetchSystemPermissions: async () => {
    try {
      const perms = await permissionService.fetchPermissions();
      if (perms.length > 0) {
        const mapped = perms.map(parseApiPermission);
        set({ systemPermissions: mapped });
      }
    } catch (err: any) {
      console.error('Failed to fetch system permissions:', err);
    }
  },

  fetchRoles: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await roleService.fetchRoles();
      set({ roles: Array.isArray(data) ? data : [], isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch roles from database:', err);
      set({ roles: [], isLoading: false, error: err?.message || 'Lỗi khi tải danh sách vai trò từ Database' });
    }
  },

  addRole: async (newRole) => {
    set({ isLoading: true, error: null });
    try {
      const created = await roleService.addRole(newRole);
      set((state) => ({ roles: [created, ...state.roles], isLoading: false }));
    } catch (err: any) {
      console.error('Failed to add role:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi thêm vai trò mới' });
      throw err;
    }
  },

  updateRole: async (updatedRole) => {
    set({ isLoading: true, error: null });
    try {
      const result = await roleService.updateRole(updatedRole);
      set((state) => ({
        roles: state.roles.map((r) => (r.id === updatedRole.id ? result : r)),
        isLoading: false,
      }));
    } catch (err: any) {
      console.error('Failed to update role:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi cập nhật vai trò' });
      throw err;
    }
  },

  deleteRole: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await roleService.deleteRole(id);
      set((state) => ({
        roles: state.roles.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      console.error('Failed to delete role:', err);
      // Fallback state filter if mock API deletes
      set((state) => ({
        roles: state.roles.filter((r) => r.id !== id),
        isLoading: false,
      }));
    }
  },

  cloneRole: async (sourceRoleId, newRoleCode, newRoleTitle, newDescription) => {
    set({ isLoading: true, error: null });
    try {
      const created = await roleService.cloneRole(sourceRoleId, newRoleCode, newRoleTitle, newDescription);
      set((state) => ({ roles: [created, ...state.roles], isLoading: false }));
    } catch (err: any) {
      console.error('Failed to clone role:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi sao chép vai trò' });
      throw err;
    }
  },

  fetchRoleUsers: async (roleId: string) => {
    set({ isLoading: true, error: null });
    try {
      const users = await roleService.fetchRoleUsers(roleId);
      set({ roleUsers: users, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch role users:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi tải người dùng của vai trò' });
    }
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
}));
