import { lazy, Suspense, useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Link, useRouteError, useNavigate } from 'react-router';
import { PrivateRoute } from './PrivateRoute';
import { RoleGuard } from './RoleGuard';
import { LegacyRedirect } from './LegacyRedirect';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { MainLayout } from '@/layouts/MainLayout';
import { Home, ShieldAlert, FileQuestion, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/store/authStore';

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

// ── Route Error Boundary ──────────────────────────────────────
function RouteErrorBoundary() {
  const error = useRouteError() as any;
  console.error("Route error boundary caught an error:", error);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-red-100 bg-white p-8 shadow-xl dark:border-red-950/30 dark:bg-gray-900/50 dark:backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 mb-6">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Đã xảy ra sự cố ứng dụng!
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Hệ thống gặp lỗi không mong muốn khi tải hoặc hiển thị trang này.
        </p>
        
        <div className="mt-6 rounded-lg bg-gray-50 p-4 font-mono text-xs text-gray-600 dark:bg-gray-950 dark:text-gray-400 border border-gray-100 dark:border-gray-900 max-h-40 overflow-y-auto">
          <p className="font-semibold text-red-600 dark:text-red-400">
            {error?.statusText || error?.message || "Lỗi không xác định"}
          </p>
          {error?.stack && (
            <pre className="mt-2 whitespace-pre-wrap text-[10px] leading-relaxed opacity-75">
              {error.stack}
            </pre>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Tải lại trang
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
          >
            <Home className="w-4 h-4" /> Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Lazy Page Helper ──────────────────────────────────────────
const lz = <T extends Record<string, unknown>>(loader: () => Promise<T>, key: keyof T) =>
  lazy(() =>
    loader().then((m) => {
      const comp = (m[key] || (m as any).default || Object.values(m)[0]) as React.ComponentType;
      if (!comp) {
        console.error(`[Router Lazy Load Error] Component not found for key '${String(key)}'`, m);
      }
      return { default: comp };
    })
  );

// 1. Auth & Base
const DashboardPage = lz(() => import('@/features/dashboard/pages/DashboardPage'), 'DashboardPage');
const AccountSettingsPage = lz(() => import('@/features/settings/pages/AccountSettingsPage'), 'AccountSettingsPage');

// 2. POS
const PosTerminalPage = lz(() => import('@/features/pos/pages/PosTerminalPage'), 'PosTerminalPage');
const PosSessionsPage = lz(() => import('@/features/pos/pages/PosSessionsPage'), 'PosSessionsPage');
const PaymentMethodsPage = lz(() => import('@/features/pos/pages/PaymentMethodsPage'), 'PaymentMethodsPage');

// 3. Sales Containers
const SalesOrdersTabbedPage = lz(() => import('@/features/sales/pages/SalesOrdersTabbedPage'), 'SalesOrdersTabbedPage');
const SalesInvoicesTabbedPage = lz(() => import('@/features/sales/pages/SalesInvoicesTabbedPage'), 'SalesInvoicesTabbedPage');
const SalesReturnsTabbedPage = lz(() => import('@/features/sales/pages/SalesReturnsTabbedPage'), 'SalesReturnsTabbedPage');
const SalesReceivablesTabbedPage = lz(() => import('@/features/sales/pages/SalesReceivablesTabbedPage'), 'SalesReceivablesTabbedPage');
const SalesDeliveriesTabbedPage = lz(() => import('@/features/sales/pages/SalesDeliveriesTabbedPage'), 'SalesDeliveriesTabbedPage');

// 4. Inventory Containers
const InventoryDashboardPage = lz(() => import('@/features/inventory/pages/InventoryDashboardPage'), 'InventoryDashboardPage');
const InventoryProductsTabbedPage = lz(() => import('@/features/inventory/pages/InventoryProductsTabbedPage'), 'InventoryProductsTabbedPage');
const InventoryAttributesTabbedPage = lz(() => import('@/features/inventory/pages/InventoryAttributesTabbedPage'), 'InventoryAttributesTabbedPage');
const InventoryLocationsTabbedPage = lz(() => import('@/features/inventory/pages/InventoryLocationsTabbedPage'), 'InventoryLocationsTabbedPage');
const InventoryStockStatusTabbedPage = lz(() => import('@/features/inventory/pages/InventoryStockStatusTabbedPage'), 'InventoryStockStatusTabbedPage');
const InventoryOperationsTabbedPage = lz(() => import('@/features/inventory/pages/InventoryOperationsTabbedPage'), 'InventoryOperationsTabbedPage');
const StockLedgerPage = lz(() => import('@/features/inventory/pages/StockLedgerPage'), 'StockLedgerPage');
const InventoryTrackingTabbedPage = lz(() => import('@/features/inventory/pages/InventoryTrackingTabbedPage'), 'InventoryTrackingTabbedPage');

// 5. Purchase Containers
const PurchaseSuppliersTabbedPage = lz(() => import('@/features/purchase/pages/PurchaseSuppliersTabbedPage'), 'PurchaseSuppliersTabbedPage');
const PurchaseOrdersTabbedPage = lz(() => import('@/features/purchase/pages/PurchaseOrdersTabbedPage'), 'PurchaseOrdersTabbedPage');
const PurchaseReceiptsInvoicesTabbedPage = lz(() => import('@/features/purchase/pages/PurchaseReceiptsInvoicesTabbedPage'), 'PurchaseReceiptsInvoicesTabbedPage');
const PurchasePaymentsPage = lz(() => import('@/features/purchase/pages/PurchasePaymentsPage'), 'PurchasePaymentsPage');
const PurchaseReturnsTabbedPage = lz(() => import('@/features/purchase/pages/PurchaseReturnsTabbedPage'), 'PurchaseReturnsTabbedPage');

// 6. Finance Containers
const VouchersTabbedPage = lz(() => import('@/features/finance/pages/VouchersTabbedPage'), 'VouchersTabbedPage');
const DebtLedgerPage = lz(() => import('@/features/finance/pages/DebtLedgerPage'), 'DebtLedgerPage');
const FinanceFundCashTabbedPage = lz(() => import('@/features/finance/pages/FinanceFundCashTabbedPage'), 'FinanceFundCashTabbedPage');
const FinanceAccountingTabbedPage = lz(() => import('@/features/finance/pages/FinanceAccountingTabbedPage'), 'FinanceAccountingTabbedPage');
const FixedAssetsTabbedPage = lz(() => import('@/features/finance/pages/FixedAssetsTabbedPage'), 'FixedAssetsTabbedPage');

// 7. CRM Containers
const CrmCustomersTabbedPage = lz(() => import('@/features/crm/pages/CrmCustomersTabbedPage'), 'CrmCustomersTabbedPage');
const CrmLoyaltyTabbedPage = lz(() => import('@/features/crm/pages/CrmLoyaltyTabbedPage'), 'CrmLoyaltyTabbedPage');
const VouchersCRMTabbedPage = lz(() => import('@/features/crm/pages/VouchersTabbedPage'), 'VouchersTabbedPage');
const WarrantiesTabbedPage = lz(() => import('@/features/crm/pages/WarrantiesTabbedPage'), 'WarrantiesTabbedPage');
const CrmSupportTabbedPage = lz(() => import('@/features/crm/pages/CrmSupportTabbedPage'), 'CrmSupportTabbedPage');
const MarketingCampaignsPage = lz(() => import('@/features/crm/pages/MarketingCampaignsPage'), 'default');

// 8. Logistics Containers
const LogisticsPartnersPage = lz(() => import('@/features/logistics/pages/LogisticsPartnersPage'), 'LogisticsPartnersPage');
const LogisticsOrdersTabbedPage = lz(() => import('@/features/logistics/pages/LogisticsOrdersTabbedPage'), 'LogisticsOrdersTabbedPage');
const LogisticsDeliveriesTabbedPage = lz(() => import('@/features/logistics/pages/LogisticsDeliveriesTabbedPage'), 'LogisticsDeliveriesTabbedPage');

// 8.1 Omnichannel Containers
const SalesChannelsPage = lz(() => import('@/features/omnichannel/pages/SalesChannelsPage'), 'SalesChannelsPage');
const ChannelProductMappingPage = lz(() => import('@/features/omnichannel/pages/ChannelProductMappingPage'), 'ChannelProductMappingPage');
const WebhookLogsPage = lz(() => import('@/features/omnichannel/pages/WebhookLogsPage'), 'WebhookLogsPage');

// 9. Reports
const SalesReportPage = lz(() => import('@/features/reports/pages/SalesReportPage'), 'SalesReportPage');
const InventoryReportPage = lz(() => import('@/features/reports/pages/InventoryReportPage'), 'InventoryReportPage');
const FinanceReportPage = lz(() => import('@/features/reports/pages/FinanceReportPage'), 'FinanceReportPage');
const CrmReportPage = lz(() => import('@/features/reports/pages/CrmReportPage'), 'CrmReportPage');

// 10. HR Containers
const HrEmployeesTabbedPage = lz(() => import('@/features/hr/pages/HrEmployeesTabbedPage'), 'HrEmployeesTabbedPage');
const HrRolesPermissionsTabbedPage = lz(() => import('@/features/hr/pages/HrRolesPermissionsTabbedPage'), 'HrRolesPermissionsTabbedPage');
const TimekeepingTabbedPage = lz(() => import('@/features/hr/pages/TimekeepingTabbedPage'), 'TimekeepingTabbedPage');
const PayrollPage = lz(() => import('@/features/hr/pages/PayrollPage'), 'PayrollPage');

// 11. System Containers
const SystemOrganizationTabbedPage = lz(() => import('@/features/system/pages/SystemOrganizationTabbedPage'), 'SystemOrganizationTabbedPage');
const SystemConfigTabbedPage = lz(() => import('@/features/system/pages/SystemConfigTabbedPage'), 'SystemConfigTabbedPage');
const NotificationsPage = lz(() => import('@/features/system/pages/NotificationsPage'), 'NotificationsPage');

// Helper for protected child route
function protect(element: React.ReactNode, permission?: string) {
  if (!permission) return { element: <L>{element}</L> };
  return {
    element: <RoleGuard requiredPermission={permission} />,
    children: [{ index: true, element: <L>{element}</L> }],
  };
}

// ── Forbidden 403 Page ─────────────────────────────────────────
function ForbiddenPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    toast.error('Bạn cần đăng nhập lại hoặc tài khoản không có quyền truy cập.');
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      logout().then(() => {
        navigate('/login', { replace: true });
      });
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, logout, navigate]);

  const handleLoginAgain = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
          Truy cập bị từ chối (403)
        </h1>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
          Tài khoản của bạn đã bị vô hiệu hóa hoặc không có quyền truy cập vào trang này.
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-6">
          Bạn cần đăng nhập bằng tài khoản hợp lệ để tiếp tục. Tự động quay lại trang đăng nhập sau{' '}
          <span className="font-bold text-base">{countdown}s</span>...
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleLoginAgain}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            Đăng nhập lại ngay
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorBoundary /> },

  // POS Fullscreen
  {
    path: '/pos',
    element: <PrivateRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '',
        element: <RoleGuard requiredPermission="pos:terminal:access" />,
        children: [{ index: true, element: <L><PosTerminalPage /></L> }],
      },
    ],
  },

  // Main App (Sidebar Layout)
  {
    path: '/',
    element: <PrivateRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <MainLayout />,
        children: [
          // ── 1. Base & Auth Canonical Routes ──────────────────────
          { index: true, element: <L><DashboardPage /></L> },
          { path: 'settings/account', element: <L><AccountSettingsPage /></L> },
          { path: 'pos/sessions', ...protect(<PosSessionsPage />, 'pos:session:view') },
          { path: 'pos/payment-methods', ...protect(<PaymentMethodsPage />, 'pos:payment-method:view') },

          // ── 2. Sales Canonical Routes (5 Routes) ─────────────────
          { path: 'sales/orders', ...protect(<SalesOrdersTabbedPage />, 'sales:order:view') },
          { path: 'sales/invoices', ...protect(<SalesInvoicesTabbedPage />, 'sales:invoice:view') },
          { path: 'sales/returns', ...protect(<SalesReturnsTabbedPage />, 'sales:return-request:view') },
          { path: 'sales/receivables', ...protect(<SalesReceivablesTabbedPage />, 'sales:receivable:view') },
          { path: 'sales/deliveries', ...protect(<SalesDeliveriesTabbedPage />, 'sales:delivery-note:view') },

          // Sales Legacy Redirects
          { path: 'sales', element: <LegacyRedirect targetCanonical="/sales/orders" defaultTab="orders" /> },
          { path: 'sales/online', element: <LegacyRedirect targetCanonical="/sales/orders" defaultTab="online" /> },
          { path: 'sales/quotes', element: <LegacyRedirect targetCanonical="/sales/orders" defaultTab="quotes" /> },
          { path: 'sales/offers', element: <LegacyRedirect targetCanonical="/sales/orders" defaultTab="offers" /> },
          { path: 'sales/invoices-list', element: <LegacyRedirect targetCanonical="/sales/invoices" defaultTab="retail" /> },
          { path: 'sales/invoice-lists', element: <LegacyRedirect targetCanonical="/sales/invoices" defaultTab="list" /> },
          { path: 'sales/returns-list', element: <LegacyRedirect targetCanonical="/sales/returns" defaultTab="requests" /> },
          { path: 'sales/returns-history', element: <LegacyRedirect targetCanonical="/sales/returns" defaultTab="history" /> },
          { path: 'sales/payments', element: <LegacyRedirect targetCanonical="/sales/receivables" defaultTab="payments" /> },
          { path: 'sales/delivery-lists', element: <LegacyRedirect targetCanonical="/sales/deliveries" defaultTab="lists" /> },
          { path: 'sales/delivery-notes', element: <LegacyRedirect targetCanonical="/sales/deliveries" defaultTab="notes" /> },

          // ── 3. Inventory Canonical Routes (9 Routes) ─────────────
          { path: 'inventory/dashboard', ...protect(<InventoryDashboardPage />, 'inventory:dashboard:view') },
          { path: 'inventory/products', ...protect(<InventoryProductsTabbedPage />, 'catalog:product:view') },
          { path: 'inventory/attributes', ...protect(<InventoryAttributesTabbedPage />, 'catalog:unit:view') },
          { path: 'inventory/locations', ...protect(<InventoryLocationsTabbedPage />, 'inventory:storage-area:view') },
          { path: 'inventory/stock-status', ...protect(<InventoryStockStatusTabbedPage />, 'inventory:stock-keeping:view') },
          { path: 'inventory/operations', ...protect(<InventoryOperationsTabbedPage />, 'inventory:import:view') },
          { path: 'inventory/ledger', ...protect(<StockLedgerPage />, 'inventory:ledger:view') },
          { path: 'inventory/tracking', ...protect(<InventoryTrackingTabbedPage />, 'inventory:batch:view') },

          // Inventory Legacy Redirects
          { path: 'inventory', element: <LegacyRedirect targetCanonical="/inventory/products" defaultTab="products" /> },
          { path: 'inventory/import-excel', element: <LegacyRedirect targetCanonical="/inventory/products" defaultTab="import-excel" /> },
          { path: 'inventory/variants', element: <LegacyRedirect targetCanonical="/inventory/products" defaultTab="variants" /> },

          { path: 'inventory/categories', element: <LegacyRedirect targetCanonical="/inventory/products" defaultTab="categories" /> },
          { path: 'inventory/combos', element: <LegacyRedirect targetCanonical="/inventory/products" defaultTab="combos" /> },
          { path: 'inventory/units', element: <LegacyRedirect targetCanonical="/inventory/attributes" defaultTab="units" /> },
          { path: 'inventory/colors', element: <LegacyRedirect targetCanonical="/inventory/attributes" defaultTab="colors" /> },
          { path: 'inventory/sizes', element: <LegacyRedirect targetCanonical="/inventory/attributes" defaultTab="sizes" /> },
          { path: 'inventory/storage-areas', element: <LegacyRedirect targetCanonical="/inventory/locations" defaultTab="stores" /> },
          { path: 'inventory/warehouse-areas', element: <LegacyRedirect targetCanonical="/inventory/locations" defaultTab="warehouses" /> },
          { path: 'inventory/warehouse-zones', element: <LegacyRedirect targetCanonical="/inventory/locations" defaultTab="zones" /> },
          { path: 'inventory/warehouse-bins', element: <LegacyRedirect targetCanonical="/inventory/locations" defaultTab="bins" /> },
          { path: 'inventory/supplier-locations', element: <LegacyRedirect targetCanonical="/inventory/locations" defaultTab="suppliers" /> },
          { path: 'inventory/supplier-storages', element: <LegacyRedirect targetCanonical="/inventory/locations" defaultTab="suppliers" /> },
          { path: 'inventory/supplier-warehouses', element: <LegacyRedirect targetCanonical="/inventory/locations" defaultTab="suppliers" /> },
          { path: 'inventory/stock-keeping', element: <LegacyRedirect targetCanonical="/inventory/stock-status" defaultTab="stock-keeping" /> },
          { path: 'inventory/product-storages', element: <LegacyRedirect targetCanonical="/inventory/stock-status" defaultTab="storages" /> },
          { path: 'inventory/product-warehouses', element: <LegacyRedirect targetCanonical="/inventory/stock-status" defaultTab="warehouses" /> },
          { path: 'inventory/supplier-products', element: <LegacyRedirect targetCanonical="/inventory/stock-status" defaultTab="supplier-products" /> },
          { path: 'inventory/imports', element: <LegacyRedirect targetCanonical="/inventory/operations" defaultTab="imports" /> },
          { path: 'inventory/stock-outs', element: <LegacyRedirect targetCanonical="/inventory/operations" defaultTab="stock-outs" /> },
          { path: 'inventory/transfers', element: <LegacyRedirect targetCanonical="/inventory/operations" defaultTab="transfers" /> },
          { path: 'inventory/transfer-requests', element: <LegacyRedirect targetCanonical="/inventory/operations" defaultTab="transfer-requests" /> },
          { path: 'inventory/transfers-list', element: <LegacyRedirect targetCanonical="/inventory/operations" defaultTab="transfers-list" /> },
          { path: 'inventory/adjustments', element: <LegacyRedirect targetCanonical="/inventory/operations" defaultTab="adjustments" /> },
          { path: 'inventory/checks', element: <LegacyRedirect targetCanonical="/inventory/operations" defaultTab="checks" /> },
          { path: 'inventory/returns', element: <LegacyRedirect targetCanonical="/inventory/operations" defaultTab="returns" /> },
          { path: 'inventory/cancel', element: <LegacyRedirect targetCanonical="/inventory/operations" defaultTab="cancel" /> },
          { path: 'inventory/batches', element: <LegacyRedirect targetCanonical="/inventory/tracking" defaultTab="batches" /> },
          { path: 'inventory/serials', element: <LegacyRedirect targetCanonical="/inventory/tracking" defaultTab="serials" /> },

          // ── 4. Purchase Canonical Routes (5 Main Modules) ─────────
          { path: 'purchase/suppliers', ...protect(<PurchaseSuppliersTabbedPage />, 'purchase:supplier:view') },
          { path: 'purchase/orders', ...protect(<PurchaseOrdersTabbedPage />, 'purchase:order:view') },
          { path: 'purchase/deliveries', ...protect(<PurchaseReceiptsInvoicesTabbedPage />, 'purchase:delivery:view') },
          { path: 'purchase/invoices', element: <LegacyRedirect targetCanonical="/purchase/deliveries" defaultTab="invoices" /> },
          { path: 'purchase/payments', ...protect(<PurchasePaymentsPage />, 'purchase:payment:view') },
          { path: 'purchase/returns', ...protect(<PurchaseReturnsTabbedPage />, 'purchase:return-list:view') },

          // Purchase Legacy Redirects
          { path: 'purchase/contracts', element: <LegacyRedirect targetCanonical="/purchase/suppliers" defaultTab="contracts" /> },
          { path: 'purchase/evaluations', element: <LegacyRedirect targetCanonical="/purchase/suppliers" defaultTab="evaluations" /> },
          { path: 'purchase/requests', element: <LegacyRedirect targetCanonical="/purchase/orders" defaultTab="requests" /> },
          { path: 'purchase/supplier-requests', element: <LegacyRedirect targetCanonical="/purchase/orders" defaultTab="supplier-requests" /> },
          { path: 'purchase/returns-list', element: <LegacyRedirect targetCanonical="/purchase/returns" defaultTab="returns" /> },
          { path: 'purchase/returns-history', element: <LegacyRedirect targetCanonical="/purchase/returns" defaultTab="history" /> },

          // ── 5. Finance Canonical Routes ───────────────────────────
          { path: 'finance/vouchers', ...protect(<VouchersTabbedPage />, 'finance:receipt:view') },
          { path: 'finance/debts', ...protect(<DebtLedgerPage />, 'finance:debt:view') },
          { path: 'finance/fund-cash', ...protect(<FinanceFundCashTabbedPage />, 'finance:bank:view') },
          { path: 'finance/accounting', ...protect(<FinanceAccountingTabbedPage />, 'finance:journal:view') },
          { path: 'finance/fixed-assets', ...protect(<FixedAssetsTabbedPage />, 'finance:fixed-asset:view') },

          // Finance Legacy Redirects
          { path: 'finance/receipts', element: <LegacyRedirect targetCanonical="/finance/vouchers" defaultTab="receipts" /> },
          { path: 'finance/payments', element: <LegacyRedirect targetCanonical="/finance/vouchers" defaultTab="payments" /> },
          { path: 'finance/costs', element: <LegacyRedirect targetCanonical="/finance/vouchers" defaultTab="costs" /> },
          { path: 'finance/operating-costs', element: <LegacyRedirect targetCanonical="/finance/vouchers" defaultTab="costs" /> },
          { path: 'finance/cost-centers', element: <LegacyRedirect targetCanonical="/finance/accounting" defaultTab="cost-centers" /> },
          { path: 'finance/banks', element: <LegacyRedirect targetCanonical="/finance/fund-cash" defaultTab="banks" /> },
          { path: 'finance/fund-balances', element: <LegacyRedirect targetCanonical="/finance/fund-cash" defaultTab="balances" /> },
          { path: 'finance/journal-entries', element: <LegacyRedirect targetCanonical="/finance/accounting" defaultTab="journal" /> },
          { path: 'finance/chart-of-accounts', element: <LegacyRedirect targetCanonical="/finance/accounting" defaultTab="coa" /> },
          { path: 'finance/tax-duties', element: <LegacyRedirect targetCanonical="/finance/accounting" defaultTab="tax" /> },
          { path: 'finance/depreciation', element: <LegacyRedirect targetCanonical="/finance/fixed-assets" defaultTab="depreciation" /> },

          // ── 6. CRM Canonical Routes (6 Routes) ───────────────────
          { path: 'crm/customers', ...protect(<CrmCustomersTabbedPage />, 'crm:customer:view') },
          { path: 'crm/loyalty', ...protect(<CrmLoyaltyTabbedPage />, 'crm:tier:view') },
          { path: 'crm/vouchers', ...protect(<VouchersCRMTabbedPage />, 'crm:voucher:view') },
          { path: 'crm/warranties', ...protect(<WarrantiesTabbedPage />, 'crm:warranty:view') },
          { path: 'crm/support', ...protect(<CrmSupportTabbedPage />, 'crm:ticket:view') },
          { path: 'crm/campaigns', ...protect(<MarketingCampaignsPage />, 'crm:campaign:view') },

          // CRM Legacy Redirects
          { path: 'crm', element: <LegacyRedirect targetCanonical="/crm/customers" defaultTab="customers" /> },
          { path: 'crm/partner-groups', element: <LegacyRedirect targetCanonical="/crm/customers" defaultTab="groups" /> },
          { path: 'crm/areas', element: <LegacyRedirect targetCanonical="/crm/customers" defaultTab="areas" /> },
          { path: 'crm/tiers', element: <LegacyRedirect targetCanonical="/crm/loyalty" defaultTab="tiers" /> },
          { path: 'crm/loyalty-history', element: <LegacyRedirect targetCanonical="/crm/loyalty" defaultTab="history" /> },
          { path: 'crm/customer-vouchers', element: <LegacyRedirect targetCanonical="/crm/vouchers" defaultTab="customer-vouchers" /> },
          { path: 'crm/warranty-claims', element: <LegacyRedirect targetCanonical="/crm/warranties" defaultTab="claims" /> },
          { path: 'crm/tickets', element: <LegacyRedirect targetCanonical="/crm/support" defaultTab="tickets" /> },
          { path: 'crm/ticket-messages', element: <LegacyRedirect targetCanonical="/crm/support" defaultTab="messages" /> },
          { path: 'crm/feedback', element: <LegacyRedirect targetCanonical="/crm/support" defaultTab="feedback" /> },

          // ── 7. Logistics Canonical Routes ─────────────────────────
          { path: 'logistics/partners', ...protect(<LogisticsPartnersPage />, 'logistics:shipper:view') },
          { path: 'logistics/orders', ...protect(<LogisticsOrdersTabbedPage />, 'logistics:order:view') },
          { path: 'logistics/deliveries', ...protect(<LogisticsDeliveriesTabbedPage />, 'logistics:shipment:view') },

          // ── 7.1 Omnichannel Canonical Routes ───────────────────────
          { path: 'omnichannel/channels', ...protect(<SalesChannelsPage />, 'omnichannel:channel:view') },
          { path: 'omnichannel/mapping', ...protect(<ChannelProductMappingPage />, 'omnichannel:mapping:view') },
          { path: 'omnichannel/webhooks', ...protect(<WebhookLogsPage />, 'omnichannel:webhook:view') },

          // Logistics Legacy Redirects
          { path: 'logistics/shippers', element: <LegacyRedirect targetCanonical="/logistics/partners" defaultTab="shippers" /> },
          { path: 'logistics/carriers', element: <LegacyRedirect targetCanonical="/logistics/partners" defaultTab="carriers" /> },
          { path: 'logistics/batches', element: <LegacyRedirect targetCanonical="/logistics/orders" defaultTab="batches" /> },
          { path: 'logistics/packing-lists', element: <LegacyRedirect targetCanonical="/logistics/orders" defaultTab="packing-lists" /> },
          { path: 'logistics/notes', element: <LegacyRedirect targetCanonical="/logistics/deliveries" defaultTab="notes" /> },
          { path: 'logistics/shipments', element: <LegacyRedirect targetCanonical="/logistics/deliveries" defaultTab="shipments" /> },
          { path: 'logistics/delivery-notes', element: <LegacyRedirect targetCanonical="/logistics/deliveries" defaultTab="delivery-notes" /> },
          { path: 'logistics/attempts', element: <LegacyRedirect targetCanonical="/logistics/deliveries" defaultTab="delivery-notes" /> },
          { path: 'logistics/pod', element: <LegacyRedirect targetCanonical="/logistics/deliveries" defaultTab="delivery-notes" /> },

          // ── 8. Reports Canonical Routes (4 Routes) ───────────────
          { path: 'reports/sales', ...protect(<SalesReportPage />, 'reports:sales:view') },
          { path: 'reports/inventory', ...protect(<InventoryReportPage />, 'reports:inventory:view') },
          { path: 'reports/finance', ...protect(<FinanceReportPage />, 'reports:finance:view') },
          { path: 'reports/crm', ...protect(<CrmReportPage />, 'reports:crm:view') },

          // ── 9. HR Canonical Routes ────────────────────────────────
          { path: 'hr/employees', ...protect(<HrEmployeesTabbedPage />, 'system:user:view') },
          { path: 'hr/roles-permissions', ...protect(<HrRolesPermissionsTabbedPage />, 'system:role:view') },
          { path: 'hr/timekeeping', ...protect(<TimekeepingTabbedPage />, 'hrm:attendance:view') },
          { path: 'hr/payroll', ...protect(<PayrollPage />, 'finance:payroll:view') },

          // HR Legacy Redirects
          { path: 'hr/users', element: <LegacyRedirect targetCanonical="/hr/employees" defaultTab="users" /> },
          { path: 'hr/departments', element: <LegacyRedirect targetCanonical="/hr/employees" defaultTab="departments" /> },
          { path: 'hr/positions', element: <LegacyRedirect targetCanonical="/hr/employees" defaultTab="positions" /> },
          { path: 'hr/contracts', element: <LegacyRedirect targetCanonical="/hr/employees" defaultTab="contracts" /> },
          { path: 'hr/attendance', element: <LegacyRedirect targetCanonical="/hr/timekeeping" defaultTab="attendance" /> },
          { path: 'hr/leave-requests', element: <LegacyRedirect targetCanonical="/hr/timekeeping" defaultTab="leave-requests" /> },
          { path: 'hr/shift-swaps', element: <LegacyRedirect targetCanonical="/hr/timekeeping" defaultTab="shift-swaps" /> },
          { path: 'hr/kpis', element: <LegacyRedirect targetCanonical="/hr/employees" defaultTab="kpis" /> },
          { path: 'hr/logs', element: <LegacyRedirect targetCanonical="/hr/employees" defaultTab="logs" /> },
          { path: 'hr/roles', element: <LegacyRedirect targetCanonical="/hr/roles-permissions" defaultTab="roles" /> },

          // ── 10. System Canonical Routes ───────────────────────────
          { path: 'system/organization', ...protect(<SystemOrganizationTabbedPage />, 'system:branch:view') },
          { path: 'system/config', ...protect(<SystemConfigTabbedPage />, 'system:config:view') },
          { path: 'system/notifications', ...protect(<NotificationsPage />, 'system:notification:view') },

          // System Legacy Redirects
          { path: 'system/branches', element: <LegacyRedirect targetCanonical="/system/organization" defaultTab="branches" /> },
          { path: 'system/banners', element: <LegacyRedirect targetCanonical="/system/organization" defaultTab="banners" /> },
          { path: 'system/settings', element: <LegacyRedirect targetCanonical="/system/config" defaultTab="settings" /> },
          { path: 'system/vat', element: <LegacyRedirect targetCanonical="/system/config" defaultTab="vat" /> },
          { path: 'system/permissions', element: <LegacyRedirect targetCanonical="/hr/roles-permissions" defaultTab="permissions" /> },
        ],
      },
    ],
  },

  {
    path: '/403',
    element: <ForbiddenPage />,
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
