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
  UserCheck,
  Shield,
  Activity,
  CreditCard,
  RotateCcw,
  Layers,
  Smartphone,
  Bell,
  Printer,
  Percent,
  Boxes,
  Archive,
  Store,
  Briefcase,
  Image as ImageIcon,
  PackageCheck,
  Navigation,
  Compass,
  MapPin,
  Key,
  Sliders,
  LifeBuoy,
  AlertTriangle,
} from 'lucide-react';
import type { RoleType } from '@/features/auth/types';

export interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  roles?: RoleType[];
  permission?: string;
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
      { name: 'Màn hình POS', href: '/pos', icon: ShoppingCart, permission: 'pos:terminal:access' },
      { name: 'Ca làm việc POS', href: '/pos/sessions', icon: Activity, permission: 'pos:session:view' },
      { name: 'Phương thức TT', href: '/pos/payment-methods', icon: CreditCard, permission: 'pos:payment-method:view' },
    ],
  },
  {
    group: 'Quản lý Bán hàng',
    items: [
      { name: 'Đơn bán & Chào hàng', href: '/sales/orders', icon: ShoppingBag, permission: 'sales:order:view' },
      { name: 'Hóa đơn Bán hàng', href: '/sales/invoices', icon: ClipboardList, permission: 'sales:invoice:view' },
      { name: 'Khách hàng Trả hàng', href: '/sales/returns', icon: RotateCcw, permission: 'sales:return-request:view' },
      { name: 'Công nợ Phải thu', href: '/sales/receivables', icon: DollarSign, permission: 'sales:receivable:view' },
      { name: 'Giao nhận & Xuất hàng', href: '/sales/deliveries', icon: PackageCheck, permission: 'sales:delivery-note:view' },
    ],
  },
  {
    group: 'Quản lý Kho',
    items: [
      { name: 'Dashboard tồn kho', href: '/inventory/dashboard', icon: LayoutDashboard, permission: 'inventory:dashboard:view' },
      { name: 'Quản lý Sản phẩm', href: '/inventory/products', icon: Package, permission: 'catalog:product:view' },
      { name: 'Thuộc tính Sản phẩm', href: '/inventory/attributes', icon: Layers, permission: 'catalog:unit:view' },
      { name: 'Sơ đồ & Vị trí Kho', href: '/inventory/locations', icon: MapPin, permission: 'inventory:storage-area:view' },
      { name: 'Trạng thái Tồn kho', href: '/inventory/stock-status', icon: Boxes, permission: 'inventory:stock-keeping:view' },
      { name: 'Thao tác & Nghiệp vụ Kho', href: '/inventory/operations', icon: Truck, permission: 'inventory:import:view' },
      { name: 'Thẻ kho (Sổ nhật ký)', href: '/inventory/ledger', icon: Activity, permission: 'inventory:ledger:view' },
      { name: 'Nguồn gốc & Lô / Serial', href: '/inventory/tracking', icon: Archive, permission: 'inventory:batch:view' },
    ],
  },
  {
    group: 'Mua hàng',
    items: [
      { name: 'Nhà cung cấp', href: '/purchase/suppliers', icon: UserCheck, permission: 'purchase:supplier:view' },
      { name: 'Đơn mua hàng & Đề xuất', href: '/purchase/orders', icon: ShoppingBag, permission: 'purchase:order:view' },
      { name: 'Nhận hàng & Hóa đơn', href: '/purchase/deliveries', icon: Truck, permission: 'purchase:delivery:view' },
      { name: 'Thanh toán NCC', href: '/purchase/payments', icon: DollarSign, permission: 'purchase:payment:view' },
      { name: 'Trả hàng NCC', href: '/purchase/returns', icon: RotateCcw, permission: 'purchase:return-list:view' },
    ],
  },
  {
    group: 'Kế toán & Tài chính',
    items: [
      { name: 'Phiếu Thu / Chi', href: '/finance/vouchers', icon: DollarSign, permission: 'finance:receipt:view' },
      { name: 'Sổ nợ & Công nợ', href: '/finance/debts', icon: Activity, permission: 'finance:debt:view' },
      { name: 'Ngân hàng & Quỹ tiền', href: '/finance/fund-cash', icon: CreditCard, permission: 'finance:bank:view' },
    ],
  },
  {
    group: 'Khách hàng (CRM)',
    items: [
      { name: 'Danh sách Khách hàng', href: '/crm/customers', icon: Users, permission: 'crm:customer:view' },
      { name: 'Hạng thành viên & Điểm', href: '/crm/loyalty', icon: Shield, permission: 'crm:tier:view' },
      { name: 'Mã giảm giá & Voucher', href: '/crm/vouchers', icon: Percent, permission: 'crm:voucher:view' },
      { name: 'Quản lý Bảo hành', href: '/crm/warranties', icon: Shield, permission: 'crm:warranty:view' },
      { name: 'Chăm sóc & Hỗ trợ', href: '/crm/support', icon: LifeBuoy, permission: 'crm:ticket:view' },
      { name: 'Chiến dịch Marketing', href: '/crm/campaigns', icon: BarChart2, permission: 'crm:campaign:view' },
    ],
  },
  {
    group: 'Vận chuyển & Logistics',
    items: [
      { name: 'Đơn vị vận chuyển', href: '/logistics/partners', icon: Users, permission: 'logistics:shipper:view' },
      { name: 'Quản lý vận đơn', href: '/logistics/deliveries', icon: Truck, permission: 'logistics:shipment:view' },
    ],
  },
  {
    group: 'Báo cáo & Thống kê',
    items: [
      { name: 'Báo cáo Bán hàng', href: '/reports/sales', icon: BarChart2, permission: 'reports:sales:view' },
      { name: 'Báo cáo Tồn kho', href: '/reports/inventory', icon: BarChart2, permission: 'reports:inventory:view' },
      { name: 'Báo cáo Tài chính', href: '/reports/finance', icon: BarChart2, permission: 'reports:finance:view' },
      { name: 'Báo cáo Khách hàng', href: '/reports/crm', icon: BarChart2, permission: 'reports:crm:view' },
    ],
  },
  {
    group: 'Nhân sự & Phân quyền',
    items: [
      { name: 'Hồ sơ Nhân sự', href: '/hr/employees', icon: UserCheck, permission: 'system:user:view' },
      { name: 'Vai trò & Phân quyền', href: '/hr/roles-permissions', icon: Shield, permission: 'system:role:view' },
    ],
  },
  {
    group: 'Cấu hình Hệ thống',
    items: [
      { name: 'Chi nhánh & Banners', href: '/system/organization', icon: Store, permission: 'system:branch:view' },
      { name: 'Cấu hình & Cài đặt', href: '/system/config', icon: Sliders, permission: 'system:config:view' },
      { name: 'Thông báo', href: '/system/notifications', icon: Bell, permission: 'system:notification:view' },
      { name: 'Danh mục Quyền hạn', href: '/hr/roles-permissions?tab=permissions', icon: Shield, permission: 'system:permission:view' },
    ],
  },
];
