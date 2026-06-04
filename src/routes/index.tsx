
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { PrivateRoute } from './PrivateRoute';
import { RoleGuard } from './RoleGuard';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { MainLayout } from '@/layouts/MainLayout';
import { Link } from 'react-router';
import { Home, ShieldAlert, FileQuestion } from 'lucide-react';

// ── Suspense Fallback ─────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}
function L({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// ── Lazy Page Imports ─────────────────────────────────────────
const lz = <T extends Record<string, unknown>>(loader: () => Promise<T>, key: keyof T) =>
  lazy(() => loader().then((m) => ({ default: m[key] as React.ComponentType })));

// Dashboard
const DashboardPage      = lz(() => import('@/features/dashboard/pages/DashboardPage'), 'DashboardPage');

// POS
const PosTerminalPage    = lz(() => import('@/features/pos/pages/PosTerminalPage'), 'PosTerminalPage');
const PosSessionsPage    = lz(() => import('@/features/pos/pages/PosSessionsPage'), 'PosSessionsPage');
const PaymentMethodsPage = lz(() => import('@/features/pos/pages/PaymentMethodsPage'), 'PaymentMethodsPage');

// Sales
const SaleOrdersPage     = lz(() => import('@/features/sales/pages/SaleOrdersPage'), 'SaleOrdersPage');
const OnlineOrdersPage   = lz(() => import('@/features/sales/pages/OnlineOrdersPage'), 'OnlineOrdersPage');
const QuotesPage         = lz(() => import('@/features/sales/pages/QuotesPage'), 'QuotesPage');
const ExportInvoicesPage = lz(() => import('@/features/sales/pages/ExportInvoicesPage'), 'ExportInvoicesPage');
const CustomerReturnsPage = lz(() => import('@/features/sales/pages/CustomerReturnsPage'), 'CustomerReturnsPage');

// Inventory
const InventoryPage      = lz(() => import('@/features/inventory/pages/InventoryPage'), 'InventoryPage');
const InventoryCheckPage = lz(() => import('@/features/inventory/pages/InventoryCheckPage'), 'InventoryCheckPage');
const StockTransferPage  = lz(() => import('@/features/inventory/pages/StockTransferPage'), 'StockTransferPage');
const ImportReceiptsPage = lz(() => import('@/features/purchase/pages/ImportReceiptsPage'), 'ImportReceiptsPage');
const ReturnToSupplierPage = lz(() => import('@/features/purchase/pages/ReturnToSupplierPage'), 'ReturnToSupplierPage');
const CancelIssuePage    = lz(() => import('@/features/inventory/pages/CancelIssuePage'), 'CancelIssuePage');
const StockLedgerPage    = lz(() => import('@/features/inventory/pages/StockLedgerPage'), 'StockLedgerPage');
const ProductBatchesPage = lz(() => import('@/features/inventory/pages/ProductBatchesPage'), 'ProductBatchesPage');
const SerialNumbersPage  = lz(() => import('@/features/inventory/pages/SerialNumbersPage'), 'SerialNumbersPage');
const CombosPage         = lz(() => import('@/features/inventory/pages/CombosPage'), 'CombosPage');
const CategoriesPage     = lz(() => import('@/features/inventory/pages/CategoriesPage'), 'CategoriesPage');
const UnitsPage          = lz(() => import('@/features/inventory/pages/UnitsPage'), 'UnitsPage');
const MobileInventoryPage = lz(() => import('@/features/inventory/pages/MobileInventoryPage'), 'MobileInventoryPage');


// Purchase
const SuppliersPage      = lz(() => import('@/features/purchase/pages/SuppliersPage'), 'SuppliersPage');
const PurchaseOrdersPage = lz(() => import('@/features/purchase/pages/PurchaseOrdersPage'), 'PurchaseOrdersPage');

// Finance
const ReceiptVouchersPage  = lz(() => import('@/features/finance/pages/ReceiptVouchersPage'), 'ReceiptVouchersPage');
const PaymentVouchersPage  = lz(() => import('@/features/finance/pages/PaymentVouchersPage'), 'PaymentVouchersPage');
const DebtLedgerPage       = lz(() => import('@/features/finance/pages/DebtLedgerPage'), 'DebtLedgerPage');
const OperatingCostsPage   = lz(() => import('@/features/finance/pages/OperatingCostsPage'), 'OperatingCostsPage');
const BankAccountsPage     = lz(() => import('@/features/finance/pages/BankAccountsPage'), 'BankAccountsPage');
const JournalEntriesPage   = lz(() => import('@/features/finance/pages/JournalEntriesPage'), 'JournalEntriesPage');
const TransactionReasonsPage = lz(() => import('@/features/finance/pages/TransactionReasonsPage'), 'TransactionReasonsPage');

// CRM
const CustomersPage     = lz(() => import('@/features/crm/pages/CustomersPage'), 'CustomersPage');
const LoyaltyTiersPage  = lz(() => import('@/features/crm/pages/LoyaltyTiersPage'), 'LoyaltyTiersPage');
const VouchersPage      = lz(() => import('@/features/crm/pages/VouchersPage'), 'VouchersPage');
const FeedbackPage      = lz(() => import('@/features/crm/pages/FeedbackPage'), 'FeedbackPage');
const SupportTicketsPage = lz(() => import('@/features/crm/pages/SupportTicketsPage'), 'SupportTicketsPage');

// Logistics
const ShippersPage      = lz(() => import('@/features/logistics/pages/ShippersPage'), 'ShippersPage');
const DeliveryTripsPage = lz(() => import('@/features/logistics/pages/DeliveryTripsPage'), 'DeliveryTripsPage');
const PriceListsPage    = lz(() => import('@/features/logistics/pages/PriceListsPage'), 'PriceListsPage');
const PromotionsPage    = lz(() => import('@/features/logistics/pages/PromotionsPage'), 'PromotionsPage');

// Reports
const SalesReportPage     = lz(() => import('@/features/reports/pages/SalesReportPage'), 'SalesReportPage');
const InventoryReportPage = lz(() => import('@/features/reports/pages/InventoryReportPage'), 'InventoryReportPage');
const FinanceReportPage   = lz(() => import('@/features/reports/pages/FinanceReportPage'), 'FinanceReportPage');
const CrmReportPage       = lz(() => import('@/features/reports/pages/CrmReportPage'), 'CrmReportPage');

// HR
const UsersPage        = lz(() => import('@/features/hr/pages/UsersPage'), 'UsersPage');
const RolesPage        = lz(() => import('@/features/hr/pages/RolesPage'), 'RolesPage');
const DepartmentsPage  = lz(() => import('@/features/hr/pages/DepartmentsPage'), 'DepartmentsPage');
const PositionsPage    = lz(() => import('@/features/hr/pages/PositionsPage'), 'PositionsPage');
const ActivityLogsPage = lz(() => import('@/features/hr/pages/ActivityLogsPage'), 'ActivityLogsPage');

// System
const BranchManagementPage = lz(() => import('@/features/system/pages/BranchManagementPage'), 'BranchManagementPage');
const SettingsPage       = lz(() => import('@/features/settings/pages/SettingsPage'), 'SettingsPage');
const SystemConfigPage   = lz(() => import('@/features/system/pages/SystemConfigPage'), 'SystemConfigPage');
const VatConfigPage      = lz(() => import('@/features/system/pages/VatConfigPage'), 'VatConfigPage');
const PrintTemplatesPage = lz(() => import('@/features/system/pages/PrintTemplatesPage'), 'PrintTemplatesPage');
const NotificationsPage  = lz(() => import('@/features/system/pages/NotificationsPage'), 'NotificationsPage');
const SystemErrorLogPage = lz(() => import('@/features/system/pages/SystemErrorLogPage'), 'SystemErrorLogPage');
const BannerManagementPage = lz(() => import('@/features/system/pages/BannerManagementPage'), 'default');
const AccountSettingsPage = lz(() => import('@/features/settings/pages/AccountSettingsPage'), 'AccountSettingsPage');

// ── Helper: protected child route ────────────────────────────
function protect(element: React.ReactNode, permission?: string) {
  if (!permission) return { element: <L>{element}</L> };
  return {
    element: <RoleGuard requiredPermission={permission} />,
    children: [{ index: true, element: <L>{element}</L> }],
  };
}

// ── Router ────────────────────────────────────────────────────
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  // POS — fullscreen, no sidebar
  {
    path: '/pos',
    element: <PrivateRoute />,
    children: [
      {
        path: '',
        element: <RoleGuard requiredPermission="pos:access" />,
        children: [{ index: true, element: <L><PosTerminalPage /></L> }],
      },
    ],
  },

  // Main App (sidebar layout)
  {
    path: '/',
    element: <PrivateRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          // Dashboard
          { index: true, element: <L><DashboardPage /></L> },

          // Account
          { path: 'settings/account', element: <L><AccountSettingsPage /></L> },

          // POS sub-pages
          { path: 'pos/sessions', ...protect(<PosSessionsPage />, 'pos:sessions:view') },
          { path: 'pos/payment-methods', ...protect(<PaymentMethodsPage />, 'pos:payments:manage') },

          // Sales
          { path: 'sales', ...protect(<SaleOrdersPage />, 'sales:orders:view') },
          { path: 'sales/online', ...protect(<OnlineOrdersPage />, 'sales:orders:view') },
          { path: 'sales/quotes', ...protect(<QuotesPage />, 'sales:quotes:manage') },
          { path: 'sales/invoices', ...protect(<ExportInvoicesPage />, 'sales:invoices:manage') },
          { path: 'sales/returns', ...protect(<CustomerReturnsPage />, 'sales:returns:manage') },

          // Inventory
          { path: 'inventory', ...protect(<InventoryPage />, 'inventory:products:view') },
          { path: 'inventory/transfers', ...protect(<StockTransferPage />, 'inventory:transfers:manage') },
          { path: 'inventory/checks', ...protect(<InventoryCheckPage />, 'inventory:checks:manage') },
          { path: 'inventory/imports', ...protect(<ImportReceiptsPage />, 'inventory:imports:manage') },
          { path: 'inventory/returns', ...protect(<ReturnToSupplierPage />, 'inventory:returns:manage') },
          { path: 'inventory/cancel', ...protect(<CancelIssuePage />, 'inventory:writeoff:manage') },
          { path: 'inventory/ledger', ...protect(<StockLedgerPage />, 'inventory:ledger:view') },
          { path: 'inventory/batches', ...protect(<ProductBatchesPage />, 'inventory:ledger:view') },
          { path: 'inventory/serials', ...protect(<SerialNumbersPage />, 'inventory:products:view') },
          { path: 'inventory/categories', ...protect(<CategoriesPage />, 'inventory:categories:manage') },
          { path: 'inventory/units', ...protect(<UnitsPage />, 'inventory:categories:manage') },
          { path: 'inventory/combos', ...protect(<CombosPage />, 'inventory:products:view') },
          { path: 'inventory/mobile', ...protect(<MobileInventoryPage />, 'inventory:products:view') },


          // Purchase
          { path: 'purchase/suppliers', ...protect(<SuppliersPage />, 'purchase:suppliers:manage') },
          { path: 'purchase/orders', ...protect(<PurchaseOrdersPage />, 'purchase:orders:manage') },

          // Finance
          { path: 'finance/receipts', ...protect(<ReceiptVouchersPage />, 'finance:receipts:manage') },
          { path: 'finance/payments', ...protect(<PaymentVouchersPage />, 'finance:payments:manage') },
          { path: 'finance/debts', ...protect(<DebtLedgerPage />, 'finance:debts:view') },
          { path: 'finance/costs', ...protect(<OperatingCostsPage />, 'finance:costs:manage') },
          { path: 'finance/banks', ...protect(<BankAccountsPage />, 'finance:banks:manage') },
          { path: 'finance/journal', ...protect(<JournalEntriesPage />, 'finance:journal:manage') },
          { path: 'finance/transaction-reasons', ...protect(<TransactionReasonsPage />, 'finance:reasons:manage') },

          // CRM
          { path: 'crm', ...protect(<CustomersPage />, 'crm:customers:manage') },
          { path: 'crm/tiers', ...protect(<LoyaltyTiersPage />, 'crm:loyalty:manage') },
          { path: 'crm/vouchers', ...protect(<VouchersPage />, 'crm:vouchers:manage') },
          { path: 'crm/feedback', ...protect(<FeedbackPage />, 'crm:feedback:manage') },
          { path: 'crm/tickets', ...protect(<SupportTicketsPage />, 'crm:feedback:manage') },

          // Logistics
          { path: 'logistics/shippers', ...protect(<ShippersPage />, 'logistics:shippers:manage') },
          { path: 'logistics/trips', ...protect(<DeliveryTripsPage />, 'logistics:trips:manage') },
          { path: 'logistics/prices', ...protect(<PriceListsPage />, 'logistics:prices:manage') },
          { path: 'logistics/promotions', ...protect(<PromotionsPage />, 'logistics:prices:manage') },

          // Reports
          { path: 'reports/sales', ...protect(<SalesReportPage />, 'sales:orders:view') },
          { path: 'reports/inventory', ...protect(<InventoryReportPage />, 'inventory:ledger:view') },
          { path: 'reports/finance', ...protect(<FinanceReportPage />, 'finance:debts:view') },
          { path: 'reports/crm', ...protect(<CrmReportPage />, 'crm:customers:manage') },

          // HR
          { path: 'hr/users', ...protect(<UsersPage />, 'admin:users:manage') },
          { path: 'hr/roles', ...protect(<RolesPage />, 'admin:roles:manage') },
          { path: 'hr/departments', ...protect(<DepartmentsPage />, 'admin:departments:manage') },
          { path: 'hr/positions', ...protect(<PositionsPage />, 'admin:positions:manage') },
          { path: 'hr/logs', ...protect(<ActivityLogsPage />, 'admin:logs:view') },

          // System
          { path: 'system/branches', ...protect(<BranchManagementPage />, 'system:branches:manage') },
          { path: 'system/settings', ...protect(<SettingsPage />, 'system:settings:manage') },
          { path: 'system/config', ...protect(<SystemConfigPage />, 'system:settings:manage') },
          { path: 'system/vat', ...protect(<VatConfigPage />, 'system:settings:manage') },
          { path: 'system/templates', ...protect(<PrintTemplatesPage />, 'system:settings:manage') },
          { path: 'system/notifications', ...protect(<NotificationsPage />, 'system:settings:manage') },
          { path: 'system/errors', ...protect(<SystemErrorLogPage />, 'system:settings:manage') },
          { path: 'system/banners', ...protect(<BannerManagementPage />, 'system:settings:manage') },
        ],
      },
    ],
  },


  {
    path: '/403',
    element: (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Truy cập bị từ chối</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            Bạn không có quyền (Permission) để truy cập vào trang này. Vui lòng liên hệ Quản trị viên để được cấp quyền.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Home className="w-5 h-5" />
            Về trang chủ
          </Link>
        </div>
      </div>
    ),
  },
  {
    path: '*',
    element: (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileQuestion className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Lỗi 404</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            Trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc đổi địa chỉ.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Home className="w-5 h-5" />
            Về trang chủ
          </Link>
        </div>
      </div>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
