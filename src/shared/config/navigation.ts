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
  Box,
} from 'lucide-react';
import type { RoleType } from '@/features/auth/types';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  roles?: RoleType[]; // deprecated: left for backwards compatibility
  permission?: string; // New permission key — must match backend permissionCode
  children?: NavItem[];
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

// ----------------------------------------------------------------
// Mapping permission → backend permissionCode thực tế:
//   catalog:product:view      = xem sản phẩm
//   catalog:inventory:view    = xem tồn kho
//   catalog:inventory:adjust  = điều chỉnh tồn kho
//   catalog:inventory:search  = tìm kiếm mã vạch
//   catalog:pricelist:view    = xem bảng giá
//   catalog:category:view     = xem danh mục
//   catalog:unit:view         = xem đơn vị tính
//   catalog:color:view        = xem màu sắc
//   catalog:size:view         = xem kích thước
//   catalog:combo:view        = xem combo
//   catalog:department:view   = xem phòng ban
//   system:user:view          = xem nhân viên
//   system:role:view          = xem phân quyền
//   system:branch:view        = xem chi nhánh
//   system:permission:view    = xem quyền hệ thống
//   hrm:attendance:view       = xem chấm công
// ----------------------------------------------------------------

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
      // pos chưa có backend riêng → dùng catalog:pricelist:view làm gate
      { name: 'Màn hình POS', href: '/pos', icon: ShoppingCart, permission: 'catalog:pricelist:view' },
      { name: 'Ca làm việc POS', href: '/pos/sessions', icon: Activity, permission: 'catalog:pricelist:view' },
      { name: 'Phương thức TT', href: '/pos/payment-methods', icon: CreditCard, permission: 'catalog:pricelist:view' },
    ],
  },
  {
    group: 'Quản lý Đơn hàng',
    items: [
      // sales chưa có backend riêng → dùng catalog:inventory:view làm gate
      { name: 'Đơn bán hàng', href: '/sales', icon: ShoppingBag, permission: 'catalog:inventory:view' },
      { name: 'Đơn hàng Online', href: '/sales/online', icon: ShoppingBag, permission: 'catalog:inventory:view' },
      { name: 'Báo giá', href: '/sales/quotes', icon: FileText, permission: 'catalog:pricelist:view' },
      { name: 'Xuất Hóa đơn', href: '/sales/invoices', icon: ClipboardList, permission: 'catalog:inventory:view' },
      { name: 'Khách trả hàng', href: '/sales/returns', icon: RotateCcw, permission: 'catalog:inventory:adjust' },
      { name: 'Khảo sát báo giá', href: '/sales/offers', icon: FileText, permission: 'catalog:pricelist:view' },
      { name: 'Hóa đơn bán lẻ', href: '/sales/invoices-list', icon: ClipboardList, permission: 'catalog:inventory:view' },
      { name: 'Thanh toán khách', href: '/sales/payments', icon: CreditCard, permission: 'catalog:inventory:view' },
      { name: 'Công nợ Phải thu', href: '/sales/receivables', icon: DollarSign, permission: 'catalog:inventory:view' },
      { name: 'Danh sách Hóa đơn', href: '/sales/invoice-lists', icon: FileText, permission: 'catalog:inventory:view' },
      { name: 'Phiếu xuất giao hàng', href: '/sales/delivery-lists', icon: Truck, permission: 'catalog:inventory:view' },
      { name: 'Biên bản Giao nhận', href: '/sales/delivery-notes', icon: FileText, permission: 'catalog:inventory:view' },
      { name: 'Yêu cầu trả hàng', href: '/sales/returns-list', icon: RotateCcw, permission: 'catalog:inventory:adjust' },
      { name: 'Lịch sử khách trả', href: '/sales/returns-history', icon: RotateCcw, permission: 'catalog:inventory:adjust' },
      { name: 'Đơn sale đi tuyến', href: '/sales/market-orders', icon: ShoppingBag, permission: 'catalog:inventory:view' },
    ],
  },
  {
    group: 'Quản lý Kho',
    items: [
      { name: 'Danh sách Sản phẩm', href: '/inventory', icon: Package, permission: 'catalog:product:view' },
      { name: 'Biến thể Sản phẩm', href: '/inventory/variants', icon: Boxes, permission: 'catalog:product:view' },
      { name: 'Lô hàng', href: '/inventory/batches', icon: Archive, permission: 'catalog:inventory:view' },
      { name: 'Số serial', href: '/inventory/serials', icon: Hash, permission: 'catalog:product:view' },
      { name: 'Combo Sản phẩm', href: '/inventory/combos', icon: Boxes, permission: 'catalog:combo:view' },
      { name: 'Chuyển kho', href: '/inventory/transfers', icon: Truck, permission: 'catalog:inventory:adjust' },
      { name: 'Kiểm kê kho', href: '/inventory/checks', icon: ClipboardList, permission: 'catalog:inventory:adjust' },
      { name: 'Phiếu Nhập kho', href: '/inventory/imports', icon: Layers, permission: 'catalog:inventory:adjust' },
      { name: 'Trả hàng NCC', href: '/inventory/returns', icon: RotateCcw, permission: 'catalog:inventory:adjust' },
      { name: 'Hủy hàng', href: '/inventory/cancel', icon: AlertTriangle, permission: 'catalog:inventory:adjust' },
      { name: 'Thẻ kho', href: '/inventory/ledger', icon: Activity, permission: 'catalog:inventory:view' },
      { name: 'Danh mục', href: '/inventory/categories', icon: Tag, permission: 'catalog:category:view' },
      { name: 'Đơn vị tính', href: '/inventory/units', icon: Layers, permission: 'catalog:unit:view' },
      { name: 'Màu sắc', href: '/inventory/colors', icon: Tag, permission: 'catalog:color:view' },
      { name: 'Kích thước', href: '/inventory/sizes', icon: Layers, permission: 'catalog:size:view' },
      { name: 'Xem trên Mobile', href: '/inventory/mobile', icon: Smartphone, permission: 'catalog:product:view' },
      { name: 'Kiểm kê mã vạch', href: '/inventory/stock-keeping', icon: Hash, permission: 'catalog:inventory:search' },
      { name: 'Yêu cầu xuất kho', href: '/inventory/stock-outs', icon: Truck, permission: 'catalog:inventory:adjust' },
      { name: 'Phiếu điều chỉnh tồn', href: '/inventory/adjustments', icon: ClipboardList, permission: 'catalog:inventory:adjust' },
      { name: 'Chi tiết sản phẩm kho', href: '/inventory/details', icon: Package, permission: 'catalog:product:view' },
      { name: 'Dashboard tồn kho', href: '/inventory/dashboard', icon: LayoutDashboard, permission: 'catalog:inventory:view' },
      { name: 'Hàng hoá trong kho', href: '/inventory/product-storages', icon: Layers, permission: 'catalog:inventory:view' },
      { name: 'Tồn kho chi nhánh', href: '/inventory/product-warehouses', icon: Store, permission: 'catalog:inventory:view' },
      { name: 'Sản phẩm NCC cấp', href: '/inventory/supplier-products', icon: UserCheck, permission: 'catalog:product:view' },
      { name: 'Kho bãi NCC cấp', href: '/inventory/supplier-storages', icon: Layers, permission: 'catalog:inventory:view' },
      { name: 'Nhà kho NCC cấp', href: '/inventory/supplier-warehouses', icon: Store, permission: 'catalog:inventory:view' },
      { name: 'Khu vực lưu trữ', href: '/inventory/storage-areas', icon: Archive, permission: 'catalog:category:view' },
      { name: 'Vị trí kho hàng', href: '/inventory/warehouse-areas', icon: Store, permission: 'catalog:category:view' },
      { name: 'Phân khu kho bãi', href: '/inventory/warehouse-zones', icon: Store, permission: 'catalog:category:view' },
      { name: 'Vị trí ô kệ hàng', href: '/inventory/warehouse-bins', icon: Layers, permission: 'catalog:category:view' },
      { name: 'Phiếu chuyển kho', href: '/inventory/transfers-list', icon: Truck, permission: 'catalog:inventory:adjust' },
      { name: 'Yêu cầu chuyển hàng', href: '/inventory/transfer-requests', icon: Truck, permission: 'catalog:inventory:adjust' },
    ],
  },
  {
    group: 'Mua hàng',
    items: [
      // purchase chưa có backend riêng → dùng catalog:product:view làm gate
      { name: 'Nhà cung cấp', href: '/purchase/suppliers', icon: UserCheck, permission: 'catalog:product:view' },
      { name: 'Đơn mua hàng', href: '/purchase/orders', icon: ShoppingBag, permission: 'catalog:inventory:adjust' },
      { name: 'Đề xuất Mua hàng', href: '/purchase/requests', icon: FileText, permission: 'catalog:inventory:adjust' },
      { name: 'Hợp đồng NCC', href: '/purchase/contracts', icon: ClipboardList, permission: 'catalog:product:view' },
      { name: 'Đánh giá NCC', href: '/purchase/evaluations', icon: UserCheck, permission: 'catalog:product:view' },
      { name: 'Lịch sử nhận hàng', href: '/purchase/deliveries', icon: Truck, permission: 'catalog:inventory:adjust' },
      { name: 'Hóa đơn Mua hàng', href: '/purchase/invoices', icon: ClipboardList, permission: 'catalog:inventory:adjust' },
      { name: 'Thanh toán NCC', href: '/purchase/payments', icon: DollarSign, permission: 'catalog:inventory:adjust' },
      { name: 'Phiếu trả hàng NCC', href: '/purchase/returns-list', icon: RotateCcw, permission: 'catalog:inventory:adjust' },
      { name: 'Lịch sử trả hàng NCC', href: '/purchase/returns-history', icon: RotateCcw, permission: 'catalog:inventory:adjust' },
      { name: 'Yêu cầu báo giá NCC', href: '/purchase/supplier-requests', icon: FileText, permission: 'catalog:pricelist:view' },
    ],
  },
  {
    group: 'Kế toán & Tài chính',
    items: [
      // finance chưa có backend riêng → dùng catalog:inventory:view làm gate
      { name: 'Phiếu thu', href: '/finance/receipts', icon: DollarSign, permission: 'catalog:inventory:view' },
      { name: 'Phiếu chi', href: '/finance/payments', icon: DollarSign, permission: 'catalog:inventory:view' },
      { name: 'Sổ nợ', href: '/finance/debts', icon: Activity, permission: 'catalog:inventory:view' },
      { name: 'Chi phí vận hành', href: '/finance/costs', icon: BarChart2, permission: 'catalog:inventory:view' },
      { name: 'Tài khoản Ngân hàng', href: '/finance/banks', icon: CreditCard, permission: 'system:branch:view' },
      { name: 'Sổ nhật ký', href: '/finance/journal', icon: FileText, permission: 'catalog:inventory:view' },
      { name: 'Lý do giao dịch', href: '/finance/transaction-reasons', icon: ClipboardList, permission: 'catalog:inventory:view' },
      { name: 'Nghĩa vụ thuế', href: '/finance/tax-duties', icon: FileText, permission: 'catalog:inventory:view' },
      { name: 'Chốt số dư quỹ', href: '/finance/fund-balances', icon: DollarSign, permission: 'catalog:inventory:view' },
      { name: 'Tài khoản kế toán', href: '/finance/chart-of-accounts', icon: Layers, permission: 'catalog:inventory:view' },
      { name: 'Tài sản cố định', href: '/finance/fixed-assets', icon: Archive, permission: 'catalog:inventory:view' },
      { name: 'Khấu hao TSCĐ', href: '/finance/depreciation-history', icon: Activity, permission: 'catalog:inventory:view' },
      { name: 'Thanh toán đơn hàng', href: '/finance/order-payments', icon: DollarSign, permission: 'catalog:inventory:view' },
      { name: 'Trung tâm chi phí', href: '/finance/cost-centers', icon: BarChart2, permission: 'catalog:inventory:view' },
    ],
  },
  {
    group: 'Khách hàng (CRM)',
    items: [
      // crm chưa có backend riêng → dùng catalog:product:view làm gate
      { name: 'Khách hàng', href: '/crm', icon: Users, permission: 'catalog:product:view' },
      { name: 'Hạng thành viên', href: '/crm/tiers', icon: Tag, permission: 'catalog:pricelist:view' },
      { name: 'Voucher', href: '/crm/vouchers', icon: Tag, permission: 'catalog:pricelist:view' },
      { name: 'Phản hồi', href: '/crm/feedback', icon: Activity, permission: 'catalog:product:view' },
      { name: 'Hỗ trợ Tickets', href: '/crm/tickets', icon: AlertTriangle, permission: 'catalog:product:view' },
      { name: 'Tin nhắn hỗ trợ', href: '/crm/ticket-messages', icon: FileText, permission: 'catalog:product:view' },
      { name: 'Ví Voucher khách', href: '/crm/customer-vouchers', icon: Tag, permission: 'catalog:pricelist:view' },
      { name: 'Sổ bảo hành sản phẩm', href: '/crm/warranties', icon: FileText, permission: 'catalog:product:view' },
      { name: 'Yêu cầu bảo hành', href: '/crm/warranty-claims', icon: AlertTriangle, permission: 'catalog:product:view' },
      { name: 'Nhóm Đối tác', href: '/crm/partner-groups', icon: Users, permission: 'catalog:product:view' },
      { name: 'Khu vực địa lý', href: '/crm/areas', icon: Store, permission: 'catalog:product:view' },
      { name: 'Lịch sử tích/tiêu điểm', href: '/crm/loyalty-history', icon: Activity, permission: 'catalog:pricelist:view' },
      { name: 'Chiến dịch Marketing', href: '/crm/campaigns', icon: Tag, permission: 'catalog:pricelist:view' },
    ],
  },
  {
    group: 'Vận chuyển & Logistics',
    items: [
      // logistics chưa có backend riêng → dùng catalog:inventory:view làm gate
      { name: 'Đối tác giao hàng', href: '/logistics/shippers', icon: Truck, permission: 'catalog:inventory:view' },
      { name: 'Chuyến xe', href: '/logistics/trips', icon: Truck, permission: 'catalog:inventory:view' },
      { name: 'Bảng giá', href: '/logistics/prices', icon: Tag, permission: 'catalog:pricelist:view' },
      { name: 'Khuyến mãi', href: '/logistics/promotions', icon: Tag, permission: 'catalog:pricelist:view' },
      { name: 'Đối tác vận chuyển', href: '/logistics/carriers', icon: Truck, permission: 'catalog:inventory:view' },
      { name: 'Phương thức vận chuyển', href: '/logistics/methods', icon: Truck, permission: 'catalog:inventory:view' },
      { name: 'Cước phí vận chuyển', href: '/logistics/charges', icon: DollarSign, permission: 'catalog:pricelist:view' },
      { name: 'Biểu phí giao hàng', href: '/logistics/fees', icon: DollarSign, permission: 'catalog:pricelist:view' },
      { name: 'Tỷ lệ cước phí', href: '/logistics/fee-rates', icon: DollarSign, permission: 'catalog:pricelist:view' },
      { name: 'Nhóm biểu phí', href: '/logistics/fee-groups', icon: Layers, permission: 'catalog:pricelist:view' },
      { name: 'Lô hàng vận chuyển', href: '/logistics/shipments', icon: Truck, permission: 'catalog:inventory:view' },
      { name: 'Ghi chú vận chuyển', href: '/logistics/notes', icon: FileText, permission: 'catalog:inventory:view' },
      { name: 'Đơn vận chuyển', href: '/logistics/orders', icon: FileText, permission: 'catalog:inventory:view' },
      { name: 'Khu vực giao hàng', href: '/logistics/locations', icon: Store, permission: 'catalog:inventory:view' },
      { name: 'Danh bạ vận chuyển', href: '/logistics/contacts', icon: Users, permission: 'catalog:inventory:view' },
      { name: 'Địa chỉ giao hàng', href: '/logistics/addresses', icon: Store, permission: 'catalog:inventory:view' },
      { name: 'Lô đơn vận chuyển', href: '/logistics/batches', icon: Layers, permission: 'catalog:inventory:view' },
      { name: 'Phiếu đóng gói', href: '/logistics/packing-lists', icon: Box, permission: 'catalog:inventory:view' },
      { name: 'Biên bản giao nhận hàng', href: '/logistics/delivery-notes', icon: FileText, permission: 'catalog:inventory:view' },
    ],
  },
  {
    group: 'Kênh bán (Omnichannel)',
    items: [
      { name: 'Kênh bán sàn TMĐT', href: '/omnichannel/channels', icon: Store, permission: 'system:branch:view' },
      { name: 'Liên kết sản phẩm sàn', href: '/omnichannel/mappings', icon: Layers, permission: 'system:branch:view' },
      { name: 'Nhật ký Webhook', href: '/omnichannel/webhook-logs', icon: Activity, permission: 'system:branch:view' },
    ],
  },
  {
    group: 'Báo cáo',
    items: [
      { name: 'Báo cáo Bán hàng', href: '/reports/sales', icon: BarChart2, permission: 'catalog:inventory:view' },
      { name: 'Báo cáo Tồn kho', href: '/reports/inventory', icon: BarChart2, permission: 'catalog:inventory:view' },
      { name: 'Báo cáo Tài chính', href: '/reports/finance', icon: BarChart2, permission: 'catalog:inventory:view' },
      { name: 'Báo cáo CRM', href: '/reports/crm', icon: BarChart2, permission: 'catalog:product:view' },
    ],
  },
  {
    group: 'Hệ thống',
    items: [
      { name: 'Quản lý Chi nhánh', href: '/system/branches', icon: Store, permission: 'system:branch:view' },
      { name: 'Nhân viên', href: '/hr/users', icon: Users, permission: 'system:user:view' },
      { name: 'Phân quyền', href: '/hr/roles', icon: Shield, permission: 'system:role:view' },
      { name: 'Phòng ban', href: '/hr/departments', icon: Users, permission: 'catalog:department:view' },
      { name: 'Chức danh', href: '/hr/positions', icon: Briefcase, permission: 'catalog:department:view' },
      { name: 'Lịch sử hoạt động', href: '/hr/logs', icon: Activity, permission: 'system:user:view' },
      { name: 'Hợp đồng lao động', href: '/hr/contracts', icon: FileText, permission: 'system:user:view' },
      { name: 'Chấm công hàng ngày', href: '/hr/attendance', icon: UserCheck, permission: 'hrm:attendance:view' },
      { name: 'Đơn xin nghỉ phép', href: '/hr/leave-requests', icon: FileText, permission: 'hrm:attendance:view' },
      { name: 'Đánh giá KPI', href: '/hr/kpis', icon: Activity, permission: 'system:user:view' },
      { name: 'Bảng lương nhân sự', href: '/hr/payroll', icon: DollarSign, permission: 'system:user:view' },
      { name: 'Bảo mật quyền hệ thống', href: '/system/permissions', icon: Shield, permission: 'system:permission:view' },
      { name: 'Phiên đăng nhập thiết bị', href: '/system/device-sessions', icon: Smartphone, permission: 'system:branch:view' },
      { name: 'Lịch sử đổi mật khẩu', href: '/system/password-history', icon: Activity, permission: 'system:user:view' },
      { name: 'Cài đặt chung', href: '/settings', icon: Settings, permission: 'system:branch:view' },
      { name: 'Cấu hình Hệ thống', href: '/system/config', icon: Settings, permission: 'system:branch:view' },
      { name: 'Cấu hình Thuế', href: '/system/vat', icon: Percent, permission: 'system:branch:view' },
      { name: 'Mẫu in', href: '/system/templates', icon: Printer, permission: 'system:branch:view' },
      { name: 'Quản lý Banner', href: '/system/banners', icon: ImageIcon, permission: 'system:branch:view' },
      { name: 'Luật thông báo', href: '/system/notifications', icon: Bell, permission: 'system:branch:view' },
      { name: 'Lịch sử lỗi', href: '/system/errors', icon: AlertTriangle, permission: 'system:branch:view' },
    ],
  },
];
