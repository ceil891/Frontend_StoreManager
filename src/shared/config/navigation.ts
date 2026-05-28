// Update this file to control sidebar navigation per permission.

import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  Users,
  Settings,
  Truck,
  BarChart2,
  DollarSign,
  ClipboardList,
  FileText,
  Tag,
  UserCheck,
  Shield,
  Activity,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Layers,
  Smartphone,
  Bell,
  Printer,
  Percent,
  Hash,
  Boxes,
  Archive,
  Store,
  Briefcase,
  Image as ImageIcon,
} from 'lucide-react';
import type { RoleType } from '@/features/auth/types';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  roles?: RoleType[]; // deprecated: left for backwards compatibility
  permission?: string; // New permission key
  children?: NavItem[];
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Tổng quan',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Bán hàng (POS)',
    items: [
      { name: 'Màn hình POS', href: '/pos', icon: ShoppingCart, permission: 'pos:access' },
      { name: 'Ca làm việc POS', href: '/pos/sessions', icon: Activity, permission: 'pos:sessions:view' },
      { name: 'Phương thức TT', href: '/pos/payment-methods', icon: CreditCard, permission: 'pos:payments:manage' },
    ],
  },
  {
    group: 'Quản lý Đơn hàng',
    items: [
      { name: 'Đơn bán hàng', href: '/sales', icon: ShoppingBag, permission: 'sales:orders:view' },
      { name: 'Đơn hàng Online', href: '/sales/online', icon: ShoppingBag, permission: 'sales:orders:view' },
      { name: 'Báo giá', href: '/sales/quotes', icon: FileText, permission: 'sales:quotes:manage' },
      { name: 'Xuất Hóa đơn', href: '/sales/invoices', icon: ClipboardList, permission: 'sales:invoices:manage' },
      { name: 'Khách trả hàng', href: '/sales/returns', icon: RotateCcw, permission: 'sales:returns:manage' },
    ],
  },
  {
    group: 'Quản lý Kho',
    items: [
      { name: 'Danh sách Sản phẩm', href: '/inventory', icon: Package, permission: 'inventory:products:view' },
      { name: 'Lô hàng', href: '/inventory/batches', icon: Archive, permission: 'inventory:ledger:view' },
      { name: 'Số Serial', href: '/inventory/serials', icon: Hash, permission: 'inventory:products:view' },
      { name: 'Combo Sản phẩm', href: '/inventory/combos', icon: Boxes, permission: 'inventory:products:view' },
      { name: 'Chuyển kho', href: '/inventory/transfers', icon: Truck, permission: 'inventory:transfers:manage' },
      { name: 'Kiểm kê kho', href: '/inventory/checks', icon: ClipboardList, permission: 'inventory:checks:manage' },
      { name: 'Phiếu Nhập kho', href: '/inventory/imports', icon: Layers, permission: 'inventory:imports:manage' },
      { name: 'Trả hàng NCC', href: '/inventory/returns', icon: RotateCcw, permission: 'inventory:returns:manage' },
      { name: 'Hủy hàng', href: '/inventory/cancel', icon: AlertTriangle, permission: 'inventory:writeoff:manage' },
      { name: 'Thẻ kho', href: '/inventory/ledger', icon: Activity, permission: 'inventory:ledger:view' },
      { name: 'Danh mục', href: '/inventory/categories', icon: Tag, permission: 'inventory:categories:manage' },
      { name: 'Đơn vị tính', href: '/inventory/units', icon: Layers, permission: 'inventory:categories:manage' },
      { name: 'Xem trên Mobile', href: '/inventory/mobile', icon: Smartphone, permission: 'inventory:products:view' },
    ],
  },
  {
    group: 'Mua hàng',
    items: [
      { name: 'Nhà cung cấp', href: '/purchase/suppliers', icon: UserCheck, permission: 'purchase:suppliers:manage' },
      { name: 'Đơn mua hàng', href: '/purchase/orders', icon: ShoppingBag, permission: 'purchase:orders:manage' },
    ],
  },
  {
    group: 'Kế toán & Tài chính',
    items: [
      { name: 'Phiếu thu', href: '/finance/receipts', icon: DollarSign, permission: 'finance:receipts:manage' },
      { name: 'Phiếu chi', href: '/finance/payments', icon: DollarSign, permission: 'finance:payments:manage' },
      { name: 'Sổ nợ', href: '/finance/debts', icon: Activity, permission: 'finance:debts:view' },
      { name: 'Chi phí vận hành', href: '/finance/costs', icon: BarChart2, permission: 'finance:costs:manage' },
      { name: 'Tài khoản Ngân hàng', href: '/finance/banks', icon: CreditCard, permission: 'finance:banks:manage' },
      { name: 'Sổ nhật ký', href: '/finance/journal', icon: FileText, permission: 'finance:journal:manage' },
      { name: 'Lý do giao dịch', href: '/finance/transaction-reasons', icon: ClipboardList, permission: 'finance:reasons:manage' },
    ],
  },
  {
    group: 'Khách hàng (CRM)',
    items: [
      { name: 'Khách hàng', href: '/crm', icon: Users, permission: 'crm:customers:manage' },
      { name: 'Hạng thành viên', href: '/crm/tiers', icon: Tag, permission: 'crm:loyalty:manage' },
      { name: 'Voucher', href: '/crm/vouchers', icon: Tag, permission: 'crm:vouchers:manage' },
      { name: 'Phản hồi', href: '/crm/feedback', icon: Activity, permission: 'crm:feedback:manage' },
      { name: 'Hỗ trợ Tickets', href: '/crm/tickets', icon: AlertTriangle, permission: 'crm:feedback:manage' },
    ],
  },
  {
    group: 'Vận chuyển',
    items: [
      { name: 'Đối tác giao hàng', href: '/logistics/shippers', icon: Truck, permission: 'logistics:shippers:manage' },
      { name: 'Chuyến xe', href: '/logistics/trips', icon: Truck, permission: 'logistics:trips:manage' },
      { name: 'Bảng giá', href: '/logistics/prices', icon: Tag, permission: 'logistics:prices:manage' },
      { name: 'Khuyến mãi', href: '/logistics/promotions', icon: Tag, permission: 'logistics:prices:manage' },
    ],
  },
  {
    group: 'Báo cáo',
    items: [
      { name: 'Báo cáo Bán hàng', href: '/reports/sales', icon: BarChart2, permission: 'sales:orders:view' },
      { name: 'Báo cáo Tồn kho', href: '/reports/inventory', icon: BarChart2, permission: 'inventory:ledger:view' },
      { name: 'Báo cáo Tài chính', href: '/reports/finance', icon: BarChart2, permission: 'finance:debts:view' },
      { name: 'Báo cáo CRM', href: '/reports/crm', icon: BarChart2, permission: 'crm:customers:manage' },
    ],
  },
  {
    group: 'Hệ thống',
    items: [
      { name: 'Quản lý Chi nhánh', href: '/system/branches', icon: Store, permission: 'system:settings:manage' },
      { name: 'Nhân viên', href: '/hr/users', icon: Users, permission: 'admin:users:manage' },
      { name: 'Phân quyền', href: '/hr/roles', icon: Shield, permission: 'admin:roles:manage' },
      { name: 'Phòng ban', href: '/hr/departments', icon: Users, permission: 'admin:departments:manage' },
      { name: 'Chức danh', href: '/hr/positions', icon: Briefcase, permission: 'admin:positions:manage' },
      { name: 'Lịch sử hoạt động', href: '/hr/logs', icon: Activity, permission: 'admin:logs:view' },
      { name: 'Cài đặt chung', href: '/settings', icon: Settings, permission: 'system:settings:manage' },
      { name: 'Cấu hình Hệ thống', href: '/system/config', icon: Settings, permission: 'system:settings:manage' },
      { name: 'Cấu hình Thuế', href: '/system/vat', icon: Percent, permission: 'system:vat:manage' },
      { name: 'Mẫu in', href: '/system/templates', icon: Printer, permission: 'system:settings:manage' },
      { name: 'Quản lý Banner', href: '/system/banners', icon: ImageIcon, permission: 'system:settings:manage' },
      { name: 'Luật thông báo', href: '/system/notifications', icon: Bell, permission: 'system:settings:manage' },
      { name: 'Lịch sử lỗi', href: '/system/errors', icon: AlertTriangle, permission: 'system:errors:view' },
    ],
  },
];
