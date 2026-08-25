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
      { name: 'Tổng quan', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Bán hàng (POS)',
    items: [
      { name: 'Màn hình POS', href: '/pos', icon: ShoppingCart, permission: 'pos:terminal:access' },
      { name: 'Ca làm việc POS', href: '/pos/sessions', icon: Activity, permission: 'pos:session:view' },
      { name: 'Phương thức thanh toán', href: '/pos/payment-methods', icon: CreditCard, permission: 'pos:payment-method:view' },
    ],
  },
  {
    group: 'Quản lý bán hàng',
    items: [
      { name: 'Đơn bán & chào hàng', href: '/sales/orders', icon: ShoppingBag, permission: 'sales:order:view' },
      { name: 'Hóa đơn bán hàng', href: '/sales/invoices', icon: ClipboardList, permission: 'sales:invoice:view' },
      { name: 'Khách hàng trả hàng', href: '/sales/returns', icon: RotateCcw, permission: 'sales:return-request:view' },
      { name: 'Công nợ phải thu', href: '/sales/receivables', icon: DollarSign, permission: 'sales:receivable:view' },
      { name: 'Giao nhận & xuất hàng', href: '/sales/deliveries', icon: PackageCheck, permission: 'sales:delivery-note:view' },
    ],
  },
  {
    group: 'Quản lý kho',
    items: [
      { name: 'Tổng quan tồn kho', href: '/inventory/dashboard', icon: LayoutDashboard, permission: 'inventory:dashboard:view' },
      { name: 'Quản lý sản phẩm', href: '/inventory/products', icon: Package, permission: 'catalog:product:view' },
      { name: 'Thuộc tính sản phẩm', href: '/inventory/attributes', icon: Layers, permission: 'catalog:unit:view' },
      { name: 'Sơ đồ & vị trí kho', href: '/inventory/locations', icon: MapPin, permission: 'inventory:storage-area:view' },
      { name: 'Trạng thái tồn kho', href: '/inventory/stock-status', icon: Boxes, permission: 'inventory:stock-keeping:view' },
      { name: 'Thao tác & nghiệp vụ kho', href: '/inventory/operations', icon: Truck, permission: 'inventory:import:view' },
      { name: 'Thẻ kho (sổ nhật ký)', href: '/inventory/ledger', icon: Activity, permission: 'inventory:ledger:view' },
      { name: 'Nguồn gốc & lô / serial', href: '/inventory/tracking', icon: Archive, permission: 'inventory:batch:view' },
    ],
  },
  {
    group: 'Mua hàng',
    items: [
      { name: 'Nhà cung cấp', href: '/purchase/suppliers', icon: UserCheck, permission: 'purchase:supplier:view' },
      { name: 'Đơn mua hàng & đề xuất', href: '/purchase/orders', icon: ShoppingBag, permission: 'purchase:order:view' },
      { name: 'Nhận hàng & hóa đơn', href: '/purchase/deliveries', icon: Truck, permission: 'purchase:delivery:view' },
      { name: 'Thanh toán nhà cung cấp', href: '/purchase/payments', icon: DollarSign, permission: 'purchase:payment:view' },
      { name: 'Trả hàng nhà cung cấp', href: '/purchase/returns', icon: RotateCcw, permission: 'purchase:return-list:view' },
    ],
  },
  {
    group: 'Kế toán & tài chính',
    items: [
      { name: 'Phiếu thu / chi', href: '/finance/vouchers', icon: DollarSign, permission: 'finance:receipt:view' },
      { name: 'Sổ nợ & công nợ', href: '/finance/debts', icon: Activity, permission: 'finance:debt:view' },
      { name: 'Ngân hàng & quỹ tiền', href: '/finance/fund-cash', icon: CreditCard, permission: 'finance:bank:view' },
    ],
  },
  {
    group: 'Khách hàng (CRM)',
    items: [
      { name: 'Danh sách Khách hàng', href: '/crm/customers', icon: Users, permission: 'crm:customer:view' },
      { name: 'Hạng thành viên & điểm thưởng', href: '/crm/loyalty', icon: Shield, permission: 'crm:tier:view' },
      { name: 'Mã giảm giá & voucher', href: '/crm/vouchers', icon: Percent, permission: 'crm:voucher:view' },
      { name: 'Quản lý Bảo hành', href: '/crm/warranties', icon: Shield, permission: 'crm:warranty:view' },
      { name: 'Chăm sóc & hỗ trợ', href: '/crm/support', icon: LifeBuoy, permission: 'crm:ticket:view' },
      { name: 'Chiến dịch marketing', href: '/crm/campaigns', icon: BarChart2, permission: 'crm:campaign:view' },
    ],
  },
  {
    group: 'Vận chuyển & logistics',
    items: [
      { name: 'Đơn vị vận chuyển', href: '/logistics/partners', icon: Users, permission: 'logistics:shipper:view' },
      { name: 'Quản lý vận đơn', href: '/logistics/deliveries', icon: Truck, permission: 'logistics:shipment:view' },
    ],
  },
  {
    group: 'Báo cáo & thống kê',
    items: [
      { name: 'Báo cáo Bán hàng', href: '/reports/sales', icon: BarChart2, permission: 'reports:sales:view' },
      { name: 'Báo cáo Tồn kho', href: '/reports/inventory', icon: BarChart2, permission: 'reports:inventory:view' },
      { name: 'Báo cáo Tài chính', href: '/reports/finance', icon: BarChart2, permission: 'reports:finance:view' },
      { name: 'Báo cáo Khách hàng', href: '/reports/crm', icon: BarChart2, permission: 'reports:crm:view' },
    ],
  },
  {
    group: 'Nhân sự & phân quyền',
    items: [
      { name: 'Hồ sơ nhân sự', href: '/hr/employees', icon: UserCheck, permission: 'system:user:view' },
      { name: 'Vai trò & phân quyền', href: '/hr/roles-permissions', icon: Shield, permission: 'system:role:view' },
    ],
  },
  {
    group: 'Cấu hình hệ thống',
    items: [
      { name: 'Chi nhánh & banner', href: '/system/organization', icon: Store, permission: 'system:branch:view' },
      { name: 'Cấu hình & cài đặt', href: '/system/config', icon: Sliders, permission: 'system:config:view' },
      { name: 'Thông báo', href: '/system/notifications', icon: Bell, permission: 'system:notification:view' },
    ],
  },
];
