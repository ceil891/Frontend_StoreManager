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
  ArrowLeftRight,
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
  Send,
  FileCheck,
  FilePlus,
  PackageCheck,
  Navigation,
  Compass,
  Ticket,
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
    group: 'Quản lý Đơn hàng',
    items: [
      {
        name: 'Đơn bán & Báo giá',
        icon: ShoppingBag,
        children: [
          { name: 'Đơn bán hàng', href: '/sales', icon: ShoppingBag, permission: 'sales:order:view' },
          { name: 'Đơn hàng Online', href: '/sales/online', icon: ShoppingBag, permission: 'sales:online-order:view' },
          { name: 'Báo giá', href: '/sales/quotes', icon: FileText, permission: 'sales:quote:view' },
          { name: 'Khảo sát báo giá', href: '/sales/offers', icon: FileText, permission: 'sales:offer:view' },
          { name: 'Hóa đơn bán lẻ', href: '/sales/invoices-list', icon: ClipboardList, permission: 'sales:invoice-retail:view' },
          { name: 'Đơn sale đi tuyến', href: '/sales/market-orders', icon: ShoppingBag, permission: 'sales:market-order:view' },
        ],
      },
      {
        name: 'Hóa đơn & Thanh toán',
        icon: ClipboardList,
        children: [
          { name: 'Xuất Hóa đơn', href: '/sales/invoices', icon: ClipboardList, permission: 'sales:invoice:view' },
          { name: 'Thanh toán khách', href: '/sales/payments', icon: CreditCard, permission: 'sales:payment:view' },
          { name: 'Công nợ Phải thu', href: '/sales/receivables', icon: DollarSign, permission: 'sales:receivable:view' },
          { name: 'Danh sách Hóa đơn', href: '/sales/invoice-lists', icon: FileText, permission: 'sales:invoice-list:view' },
        ],
      },
      {
        name: 'Giao nhận & Trả hàng',
        icon: Truck,
        children: [
          { name: 'Phiếu xuất giao hàng', href: '/sales/delivery-lists', icon: PackageCheck, permission: 'sales:delivery-list:view' },
          { name: 'Biên bản Giao nhận', href: '/sales/delivery-notes', icon: FileText, permission: 'sales:delivery-note:view' },
          { name: 'Khách trả hàng', href: '/sales/returns', icon: RotateCcw, permission: 'sales:return:view' },
          { name: 'Yêu cầu trả hàng', href: '/sales/returns-list', icon: RotateCcw, permission: 'sales:return-request:view' },
          { name: 'Lịch sử khách trả', href: '/sales/returns-history', icon: RotateCcw, permission: 'sales:return-history:view' },
        ],
      },
    ],
  },
  {
    group: 'Quản lý Kho',
    items: [
      {
        name: 'Quản lý Sản phẩm',
        icon: Package,
        children: [
          { name: 'Danh sách sản phẩm', href: '/inventory', icon: Package, permission: 'catalog:product:view' },
          { name: 'Chi tiết sản phẩm kho', href: '/inventory/details', icon: Package, permission: 'inventory:product-detail:view' },
          { name: 'Biến thể sản phẩm', href: '/inventory/variants', icon: Boxes, permission: 'inventory:variant:view' },
          { name: 'Combo sản phẩm', href: '/inventory/combos', icon: Boxes, permission: 'catalog:combo:view' },
          { name: 'Lô hàng', href: '/inventory/batches', icon: Archive, permission: 'inventory:batch:view' },
          { name: 'Số serial', href: '/inventory/serials', icon: Hash, permission: 'inventory:serial:view' },
          { name: 'Danh mục', href: '/inventory/categories', icon: Tag, permission: 'catalog:category:view' },
          { name: 'Đơn vị tính', href: '/inventory/units', icon: Layers, permission: 'catalog:unit:view' },
          { name: 'Màu sắc', href: '/inventory/colors', icon: Tag, permission: 'catalog:color:view' },
          { name: 'Kích thước', href: '/inventory/sizes', icon: Layers, permission: 'catalog:size:view' },
          { name: 'Sản phẩm NCC cấp', href: '/inventory/supplier-products', icon: UserCheck, permission: 'inventory:supplier-product:view' },
        ],
      },
      {
        name: 'Tồn kho & Kiểm kê',
        icon: Activity,
        children: [
          { name: 'Dashboard tồn kho', href: '/inventory/dashboard', icon: LayoutDashboard, permission: 'inventory:dashboard:view' },
          { name: 'Hàng hoá trong kho', href: '/inventory/product-storages', icon: Layers, permission: 'inventory:product-storage:view' },
          { name: 'Tồn kho chi nhánh', href: '/inventory/product-warehouses', icon: Store, permission: 'inventory:product-warehouse:view' },
          { name: 'Thẻ kho', href: '/inventory/ledger', icon: Activity, permission: 'inventory:ledger:view' },
          { name: 'Phiếu điều chỉnh tồn', href: '/inventory/adjustments', icon: ClipboardList, permission: 'inventory:adjustment:view' },
          { name: 'Kiểm kê kho', href: '/inventory/checks', icon: ClipboardList, permission: 'inventory:check:view' },
          { name: 'Kiểm kê mã vạch', href: '/inventory/stock-keeping', icon: Hash, permission: 'inventory:stock-keeping:view' },
          { name: 'Xem trên Mobile', href: '/inventory/mobile', icon: Smartphone, permission: 'inventory:mobile:view' },
        ],
      },
      {
        name: 'Xuất nhập & Điều chuyển',
        icon: Truck,
        children: [
          { name: 'Phiếu nhập kho', href: '/inventory/imports', icon: Layers, permission: 'inventory:import:view' },
          { name: 'Yêu cầu xuất kho', href: '/inventory/stock-outs', icon: Send, permission: 'inventory:stock-out:view' },
          { name: 'Chuyển kho', href: '/inventory/transfers', icon: ArrowLeftRight, permission: 'inventory:transfer:view' },
          { name: 'Phiếu chuyển kho', href: '/inventory/transfers-list', icon: FileCheck, permission: 'inventory:transfer-list:view' },
          { name: 'Yêu cầu chuyển hàng', href: '/inventory/transfer-requests', icon: FilePlus, permission: 'inventory:transfer-request:view' },
          { name: 'Trả hàng NCC', href: '/inventory/returns', icon: RotateCcw, permission: 'inventory:return-supplier:view' },
          { name: 'Hủy hàng', href: '/inventory/cancel', icon: AlertTriangle, permission: 'inventory:cancel:view' },
        ],
      },
      {
        name: 'Sơ đồ Kho & WMS',
        icon: Store,
        children: [
          { name: 'Khu vực lưu trữ', href: '/inventory/storage-areas', icon: Archive, permission: 'inventory:storage-area:view' },
          { name: 'Vị trí kho hàng', href: '/inventory/warehouse-areas', icon: Store, permission: 'inventory:warehouse-area:view' },
          { name: 'Phân khu kho bãi', href: '/inventory/warehouse-zones', icon: Store, permission: 'inventory:warehouse-zone:view' },
          { name: 'Vị trí ô kệ hàng', href: '/inventory/warehouse-bins', icon: Layers, permission: 'inventory:warehouse-bin:view' },
          { name: 'Kho bãi NCC cấp', href: '/inventory/supplier-storages', icon: Layers, permission: 'inventory:supplier-storage:view' },
          { name: 'Nhà kho NCC cấp', href: '/inventory/supplier-warehouses', icon: Store, permission: 'inventory:supplier-warehouse:view' },
        ],
      },
    ],
  },
  {
    group: 'Mua hàng',
    items: [
      {
        name: 'Nhà cung cấp & Đơn mua',
        icon: ShoppingBag,
        children: [
          { name: 'Nhà cung cấp', href: '/purchase/suppliers', icon: UserCheck, permission: 'purchase:supplier:view' },
          { name: 'Đơn mua hàng', href: '/purchase/orders', icon: ShoppingBag, permission: 'purchase:order:view' },
          { name: 'Đề xuất mua hàng', href: '/purchase/requests', icon: FileText, permission: 'purchase:request:view' },
          { name: 'Hợp đồng NCC', href: '/purchase/contracts', icon: ClipboardList, permission: 'purchase:contract:view' },
          { name: 'Đánh giá NCC', href: '/purchase/evaluations', icon: UserCheck, permission: 'purchase:evaluation:view' },
          { name: 'Yêu cầu báo giá NCC', href: '/purchase/supplier-requests', icon: FileText, permission: 'purchase:supplier-request:view' },
        ],
      },
      {
        name: 'Nhận hàng & Thanh toán',
        icon: DollarSign,
        children: [
          { name: 'Lịch sử nhận hàng', href: '/purchase/deliveries', icon: Truck, permission: 'purchase:delivery:view' },
          { name: 'Hóa đơn mua hàng', href: '/purchase/invoices', icon: ClipboardList, permission: 'purchase:invoice:view' },
          { name: 'Thanh toán NCC', href: '/purchase/payments', icon: DollarSign, permission: 'purchase:payment:view' },
          { name: 'Phiếu trả hàng NCC', href: '/purchase/returns-list', icon: RotateCcw, permission: 'purchase:return-list:view' },
          { name: 'Lịch sử trả hàng NCC', href: '/purchase/returns-history', icon: RotateCcw, permission: 'purchase:return-history:view' },
        ],
      },
    ],
  },
  {
    group: 'Kế toán & Tài chính',
    items: [
      {
        name: 'Thu chi & Sổ quỹ',
        icon: DollarSign,
        children: [
          { name: 'Phiếu thu', href: '/finance/receipts', icon: DollarSign, permission: 'finance:receipt:view' },
          { name: 'Phiếu chi', href: '/finance/payments', icon: DollarSign, permission: 'finance:payment:view' },
          { name: 'Sổ nợ', href: '/finance/debts', icon: Activity, permission: 'finance:debt:view' },
          { name: 'Chốt số dư quỹ', href: '/finance/fund-balances', icon: DollarSign, permission: 'finance:fund-balance:view' },
          { name: 'Tài khoản Ngân hàng', href: '/finance/banks', icon: CreditCard, permission: 'finance:bank:view' },
          { name: 'Thanh toán đơn hàng', href: '/finance/order-payments', icon: DollarSign, permission: 'finance:order-payment:view' },
        ],
      },
      {
        name: 'Sổ sách & Chi phí',
        icon: BarChart2,
        children: [
          { name: 'Sổ nhật ký', href: '/finance/journal', icon: FileText, permission: 'finance:journal:view' },
          { name: 'Lý do giao dịch', href: '/finance/transaction-reasons', icon: ClipboardList, permission: 'finance:transaction-reason:view' },
          { name: 'Nghĩa vụ thuế', href: '/finance/tax-duties', icon: FileText, permission: 'finance:tax-duty:view' },
          { name: 'Chi phí vận hành', href: '/finance/costs', icon: BarChart2, permission: 'finance:cost:view' },
          { name: 'Tài khoản kế toán', href: '/finance/chart-of-accounts', icon: Layers, permission: 'finance:chart-of-accounts:view' },
          { name: 'Trung tâm chi phí', href: '/finance/cost-centers', icon: BarChart2, permission: 'finance:cost-center:view' },
        ],
      },
      {
        name: 'Tài sản cố định',
        icon: Archive,
        children: [
          { name: 'Tài sản cố định', href: '/finance/fixed-assets', icon: Archive, permission: 'finance:fixed-asset:view' },
          { name: 'Lịch sử khấu hao', href: '/finance/depreciation-history', icon: Activity, permission: 'finance:depreciation-history:view' },
        ],
      },
    ],
  },
  {
    group: 'Khách hàng (CRM)',
    items: [
      {
        name: 'Quản lý Khách hàng',
        icon: Users,
        children: [
          { name: 'Danh sách khách hàng', href: '/crm', icon: Users, permission: 'crm:customer:view' },
          { name: 'Hạng thành viên', href: '/crm/tiers', icon: Shield, permission: 'crm:tier:view' },
          { name: 'Lịch sử tích điểm', href: '/crm/loyalty-history', icon: Activity, permission: 'crm:loyalty-history:view' },
          { name: 'Khảo sát & Phản hồi', href: '/crm/feedback', icon: FileText, permission: 'crm:feedback:view' },
          { name: 'Khu vực khách hàng', href: '/crm/areas', icon: Compass, permission: 'crm:area:view' },
          { name: 'Nhóm đối tác khách', href: '/crm/partner-groups', icon: Users, permission: 'crm:partner-group:view' },
        ],
      },
      {
        name: 'Voucher & Khuyến mãi',
        icon: Percent,
        children: [
          { name: 'Mã giảm giá (Voucher)', href: '/crm/vouchers', icon: Percent, permission: 'crm:voucher:view' },
          { name: 'Voucher của khách', href: '/crm/customer-vouchers', icon: Ticket, permission: 'crm:customer-voucher:view' },
          { name: 'Chiến dịch Marketing', href: '/crm/campaigns', icon: Send, permission: 'crm:campaign:view' },
        ],
      },
      {
        name: 'Bảo hành & Hỗ trợ',
        icon: Shield,
        children: [
          { name: 'Sản phẩm Bảo hành', href: '/crm/warranties', icon: Shield, permission: 'crm:warranty:view' },
          { name: 'Yêu cầu bảo hành', href: '/crm/warranty-claims', icon: AlertTriangle, permission: 'crm:warranty-claim:view' },
          { name: 'Phiếu hỗ trợ (Tickets)', href: '/crm/tickets', icon: Bell, permission: 'crm:ticket:view' },
          { name: 'Tin nhắn hỗ trợ', href: '/crm/ticket-messages', icon: Send, permission: 'crm:ticket-message:view' },
        ],
      },
    ],
  },
  {
    group: 'Vận chuyển & Logistics',
    items: [
      {
        name: 'Đối tác & Chuyến giao',
        icon: Truck,
        children: [
          { name: 'Đội ngũ Shipper', href: '/logistics/shippers', icon: Users, permission: 'logistics:shipper:view' },
          { name: 'Chuyến giao hàng', href: '/logistics/trips', icon: Truck, permission: 'logistics:trip:view' },
          { name: 'Hãng vận chuyển (Carrier)', href: '/logistics/carriers', icon: Store, permission: 'logistics:carrier:view' },
          { name: 'Phương thức vận chuyển', href: '/logistics/methods', icon: Navigation, permission: 'logistics:method:view' },
        ],
      },
      {
        name: 'Vận đơn & Giao nhận',
        icon: Package,
        children: [
          { name: 'Danh sách Vận đơn', href: '/logistics/shipments', icon: Package, permission: 'logistics:shipment:view' },
          { name: 'Đơn hàng vận chuyển', href: '/logistics/orders', icon: ShoppingBag, permission: 'logistics:order:view' },
          { name: 'Lô đơn vận chuyển', href: '/logistics/batches', icon: Boxes, permission: 'logistics:batch:view' },
          { name: 'Danh sách đóng gói', href: '/logistics/packing-lists', icon: ClipboardList, permission: 'logistics:packing-list:view' },
          { name: 'Ghi chú vận chuyển', href: '/logistics/notes', icon: FileText, permission: 'logistics:note:view' },
          { name: 'Biên bản giao hàng', href: '/logistics/delivery-notes', icon: FileCheck, permission: 'logistics:delivery-note:view' },
        ],
      },
      {
        name: 'Giá cước &Địa điểm',
        icon: DollarSign,
        children: [
          { name: 'Bảng giá cước', href: '/logistics/prices', icon: DollarSign, permission: 'logistics:price:view' },
          { name: 'Khuyến mãi phí giao', href: '/logistics/promotions', icon: Percent, permission: 'logistics:promotion:view' },
          { name: 'Phụ phí giao hàng', href: '/logistics/charges', icon: CreditCard, permission: 'logistics:charge:view' },
          { name: 'Cấu hình Phí giao', href: '/logistics/fees', icon: Settings, permission: 'logistics:fee:view' },
          { name: 'Tỷ lệ cước vận chuyển', href: '/logistics/fee-rates', icon: Activity, permission: 'logistics:fee-rate:view' },
          { name: 'Nhóm phí giao hàng', href: '/logistics/fee-groups', icon: Layers, permission: 'logistics:fee-group:view' },
          { name: 'Địa điểm giao hàng', href: '/logistics/locations', icon: Compass, permission: 'logistics:location:view' },
          { name: 'Danh bạ giao nhận', href: '/logistics/contacts', icon: Users, permission: 'logistics:contact:view' },
          { name: 'Sổ địa chỉ kho nhận', href: '/logistics/addresses', icon: Store, permission: 'logistics:address:view' },
        ],
      },
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
      { name: 'Nhân viên', href: '/hr/users', icon: Users, permission: 'system:user:view' },
      { name: 'Vai trò & Phân quyền', href: '/hr/roles', icon: Shield, permission: 'system:role:view' },
      { name: 'Bảng Danh mục Quyền', href: '/system/permissions', icon: Shield, permission: 'system:permission:view' },
      { name: 'Phòng ban', href: '/hr/departments', icon: Briefcase, permission: 'catalog:department:view' },
      { name: 'Chức vụ', href: '/hr/positions', icon: Briefcase, permission: 'hr:position:view' },
      { name: 'Hợp đồng lao động', href: '/hr/contracts', icon: FileText, permission: 'hr:contract:view' },
      { name: 'Chấm công & Ca làm', href: '/hr/attendance', icon: Activity, permission: 'hrm:attendance:view' },
      { name: 'Đơn xin nghỉ phép', href: '/hr/leave-requests', icon: FileText, permission: 'hr:leave-request:view' },
      { name: 'Đổi ca làm việc', href: '/hr/shift-swaps', icon: ArrowLeftRight, permission: 'hr:shift-swap:view' },
      { name: 'Đánh giá KPI', href: '/hr/kpis', icon: BarChart2, permission: 'hr:kpi:view' },
      { name: 'Tính lương (Payroll)', href: '/hr/payroll', icon: DollarSign, permission: 'hr:payroll:view' },
      { name: 'Nhật ký hoạt động', href: '/hr/logs', icon: Activity, permission: 'hr:log:view' },
    ],
  },
  {
    group: 'Cấu hình Hệ thống',
    items: [
      { name: 'Chi nhánh', href: '/system/branches', icon: Store, permission: 'system:branch:view' },
      { name: 'Cấu hình chung', href: '/system/settings', icon: Settings, permission: 'system:settings:view' },
      { name: 'Tham số hệ thống', href: '/system/config', icon: Settings, permission: 'system:config:view' },
      { name: 'Cấu hình Thuế VAT', href: '/system/vat', icon: Percent, permission: 'system:vat:view' },
      { name: 'Mẫu in hóa đơn', href: '/system/templates', icon: Printer, permission: 'system:template:view' },
      { name: 'Banners & Quảng cáo', href: '/system/banners', icon: ImageIcon, permission: 'system:banner:view' },
      { name: 'Thông báo', href: '/system/notifications', icon: Bell, permission: 'system:notification:view' },
      { name: 'Phiên thiết bị', href: '/system/device-sessions', icon: Smartphone, permission: 'system:device-session:view' },
      { name: 'Lịch sử mật khẩu', href: '/system/password-history', icon: Shield, permission: 'system:password-history:view' },
      { name: 'Lỗi hệ thống', href: '/system/errors', icon: AlertTriangle, permission: 'system:error-log:view' },
    ],
  },
];
