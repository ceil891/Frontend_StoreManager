
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Link, useRouteError } from 'react-router';
import { PrivateRoute } from './PrivateRoute';
import { RoleGuard } from './RoleGuard';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { MainLayout } from '@/layouts/MainLayout';
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
const SalesInvoicesPage  = lz(() => import('@/features/sales/pages/SalesInvoicesPage'), 'SalesInvoicesPage');
const SalesPaymentsPage  = lz(() => import('@/features/sales/pages/SalesPaymentsPage'), 'SalesPaymentsPage');
const ReceivablesPage    = lz(() => import('@/features/sales/pages/ReceivablesPage'), 'ReceivablesPage');
const InvoiceListsPage   = lz(() => import('@/features/sales/pages/InvoiceListsPage'), 'InvoiceListsPage');
const SaleOffersPage     = lz(() => import('@/features/sales/pages/SaleOffersPage'), 'SaleOffersPage');
const DeliveryListsPage  = lz(() => import('@/features/sales/pages/DeliveryListsPage'), 'DeliveryListsPage');
const DeliveryNotesPage  = lz(() => import('@/features/sales/pages/DeliveryNotesPage'), 'DeliveryNotesPage');
const ReturnsListsPage   = lz(() => import('@/features/sales/pages/ReturnsListsPage'), 'ReturnsListsPage');
const ReturnsPage        = lz(() => import('@/features/sales/pages/ReturnsPage'), 'ReturnsPage');
const MarketOrdersPage   = lz(() => import('@/features/sales/pages/MarketOrdersPage'), 'MarketOrdersPage');

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
const StockKeepingPage         = lz(() => import('@/features/inventory/pages/StockKeepingPage'), 'StockKeepingPage');
const StockOutsPage            = lz(() => import('@/features/inventory/pages/StockOutsPage'), 'StockOutsPage');
const InventoryAdjustmentsPage = lz(() => import('@/features/inventory/pages/InventoryAdjustmentsPage'), 'InventoryAdjustmentsPage');
const InventoryTransfersPage   = lz(() => import('@/features/inventory/pages/InventoryTransfersPage'), 'InventoryTransfersPage');
const ProductDetailsPage       = lz(() => import('@/features/inventory/pages/ProductDetailsPage'), 'ProductDetailsPage');
const InventoryDashboardPage   = lz(() => import('@/features/inventory/pages/InventoryDashboardPage'), 'default');
const ProductInStoragesPage    = lz(() => import('@/features/inventory/pages/ProductInStoragesPage'), 'ProductInStoragesPage');
const ProductWarehousesPage    = lz(() => import('@/features/inventory/pages/ProductWarehousesPage'), 'ProductWarehousesPage');
const SupplierProductsPage     = lz(() => import('@/features/inventory/pages/SupplierProductsPage'), 'SupplierProductsPage');
const SupplierStoragesPage     = lz(() => import('@/features/inventory/pages/SupplierStoragesPage'), 'SupplierStoragesPage');
const SupplierWarehousesPage    = lz(() => import('@/features/inventory/pages/SupplierWarehousesPage'), 'SupplierWarehousesPage');
const StorageAreasPage         = lz(() => import('@/features/inventory/pages/StorageAreasPage'), 'StorageAreasPage');
const WarehouseAreasPage       = lz(() => import('@/features/inventory/pages/WarehouseAreasPage'), 'WarehouseAreasPage');
const WarehouseZonesPage       = lz(() => import('@/features/inventory/pages/WarehouseZonesPage'), 'WarehouseZonesPage');
const WarehouseBinsPage        = lz(() => import('@/features/inventory/pages/WarehouseBinsPage'), 'WarehouseBinsPage');
const StockTransferRequestsPage = lz(() => import('@/features/inventory/pages/StockTransferRequestsPage'), 'StockTransferRequestsPage');

// Purchase
const SuppliersPage      = lz(() => import('@/features/purchase/pages/SuppliersPage'), 'SuppliersPage');
const PurchaseOrdersPage = lz(() => import('@/features/purchase/pages/PurchaseOrdersPage'), 'PurchaseOrdersPage');
const SupplierDeliveriesPage = lz(() => import('@/features/purchase/pages/SupplierDeliveriesPage'), 'SupplierDeliveriesPage');
const PurchaseInvoicesPage   = lz(() => import('@/features/purchase/pages/PurchaseInvoicesPage'), 'PurchaseInvoicesPage');
const PurchasePaymentsPage   = lz(() => import('@/features/purchase/pages/PurchasePaymentsPage'), 'PurchasePaymentsPage');
const PurchaseReturnsListsPage = lz(() => import('@/features/purchase/pages/PurchaseReturnsListsPage'), 'PurchaseReturnsListsPage');
const SupplierRequestsPage   = lz(() => import('@/features/purchase/pages/SupplierRequestsPage'), 'SupplierRequestsPage');
const PurchaseReturnsPage    = lz(() => import('@/features/purchase/pages/PurchaseReturnsPage'), 'PurchaseReturnsPage');
const PurchaseRequestsPage   = lz(() => import('@/features/purchase/pages/PurchaseRequestsPage'), 'PurchaseRequestsPage');
const SupplierContractsPage  = lz(() => import('@/features/purchase/pages/SupplierContractsPage'), 'SupplierContractsPage');
const SupplierEvaluationsPage = lz(() => import('@/features/purchase/pages/SupplierEvaluationsPage'), 'SupplierEvaluationsPage');

// Finance
const ReceiptVouchersPage  = lz(() => import('@/features/finance/pages/ReceiptVouchersPage'), 'ReceiptVouchersPage');
const PaymentVouchersPage  = lz(() => import('@/features/finance/pages/PaymentVouchersPage'), 'PaymentVouchersPage');
const DebtLedgerPage       = lz(() => import('@/features/finance/pages/DebtLedgerPage'), 'DebtLedgerPage');
const OperatingCostsPage   = lz(() => import('@/features/finance/pages/OperatingCostsPage'), 'OperatingCostsPage');
const BankAccountsPage     = lz(() => import('@/features/finance/pages/BankAccountsPage'), 'BankAccountsPage');
const JournalEntriesPage   = lz(() => import('@/features/finance/pages/JournalEntriesPage'), 'JournalEntriesPage');
const TransactionReasonsPage = lz(() => import('@/features/finance/pages/TransactionReasonsPage'), 'TransactionReasonsPage');
const TaxDutiesPage         = lz(() => import('@/features/finance/pages/TaxDutiesPage'), 'TaxDutiesPage');
const FundBalancesPage      = lz(() => import('@/features/finance/pages/FundBalancesPage'), 'FundBalancesPage');
const ChartOfAccountsPage   = lz(() => import('@/features/finance/pages/ChartOfAccountsPage'), 'default');
const FixedAssetsPage       = lz(() => import('@/features/finance/pages/FixedAssetsPage'), 'FixedAssetsPage');
const CostCentersPage       = lz(() => import('@/features/finance/pages/CostCentersPage'), 'default');

// CRM
const CustomersPage     = lz(() => import('@/features/crm/pages/CustomersPage'), 'CustomersPage');
const LoyaltyTiersPage  = lz(() => import('@/features/crm/pages/LoyaltyTiersPage'), 'LoyaltyTiersPage');
const VouchersPage      = lz(() => import('@/features/crm/pages/VouchersPage'), 'VouchersPage');
const CustomerVouchersPage = lz(() => import('@/features/crm/pages/CustomerVouchersPage'), 'CustomerVouchersPage');
const ProductWarrantiesPage = lz(() => import('@/features/crm/pages/ProductWarrantiesPage'), 'ProductWarrantiesPage');
const WarrantyClaimsPage = lz(() => import('@/features/crm/pages/WarrantyClaimsPage'), 'WarrantyClaimsPage');
const FeedbackPage      = lz(() => import('@/features/crm/pages/FeedbackPage'), 'FeedbackPage');
const SupportTicketsPage = lz(() => import('@/features/crm/pages/SupportTicketsPage'), 'SupportTicketsPage');
const PartnerGroupsPage  = lz(() => import('@/features/crm/pages/PartnerGroupsPage'), 'PartnerGroupsPage');
const AreasPage          = lz(() => import('@/features/crm/pages/AreasPage'), 'AreasPage');
const LoyaltyPointHistoryPage = lz(() => import('@/features/crm/pages/LoyaltyPointHistoryPage'), 'LoyaltyPointHistoryPage');
const MarketingCampaignsPage  = lz(() => import('@/features/crm/pages/MarketingCampaignsPage'), 'default');

// Logistics
const ShippersPage      = lz(() => import('@/features/logistics/pages/ShippersPage'), 'ShippersPage');
const DeliveryTripsPage = lz(() => import('@/features/logistics/pages/DeliveryTripsPage'), 'DeliveryTripsPage');
const PriceListsPage    = lz(() => import('@/features/logistics/pages/PriceListsPage'), 'PriceListsPage');
const PromotionsPage    = lz(() => import('@/features/logistics/pages/PromotionsPage'), 'PromotionsPage');
const ShippingCarriersPage      = lz(() => import('@/features/logistics/pages/ShippingCarriersPage'), 'ShippingCarriersPage');
const ShippingMethodsPage       = lz(() => import('@/features/logistics/pages/ShippingMethodsPage'), 'ShippingMethodsPage');
const ShippingChargesPage       = lz(() => import('@/features/logistics/pages/ShippingChargesPage'), 'ShippingChargesPage');
const ShippingFeesPage          = lz(() => import('@/features/logistics/pages/ShippingFeesPage'), 'ShippingFeesPage');
const ShippingFeeRatesPage      = lz(() => import('@/features/logistics/pages/ShippingFeeRatesPage'), 'ShippingFeeRatesPage');
const ShippingFeeGroupsPage      = lz(() => import('@/features/logistics/pages/ShippingFeeGroupsPage'), 'ShippingFeeGroupsPage');
const ShipmentsPage             = lz(() => import('@/features/logistics/pages/ShipmentsPage'), 'ShipmentsPage');
const ShippingNotesPage         = lz(() => import('@/features/logistics/pages/ShippingNotesPage'), 'ShippingNotesPage');
const ShippingOrdersPage        = lz(() => import('@/features/logistics/pages/ShippingOrdersPage'), 'ShippingOrdersPage');
const ShippingLocationsListPage = lz(() => import('@/features/logistics/pages/ShippingLocationsListPage'), 'ShippingLocationsListPage');
const ShippingContactsPage      = lz(() => import('@/features/logistics/pages/ShippingContactsPage'), 'ShippingContactsPage');
const ShippingAddressesPage     = lz(() => import('@/features/logistics/pages/ShippingAddressesPage'), 'ShippingAddressesPage');
const ShippingOrderBatchesPage  = lz(() => import('@/features/logistics/pages/ShippingOrderBatchesPage'), 'ShippingOrderBatchesPage');
const PackingListsPage          = lz(() => import('@/features/logistics/pages/PackingListsPage'), 'PackingListsPage');
const DeliveryNotesPageLogistics = lz(() => import('@/features/logistics/pages/DeliveryNotesPage'), 'default');

// Omnichannel
const SalesChannelsPage          = lz(() => import('@/features/omnichannel/pages/SalesChannelsPage'), 'SalesChannelsPage');
const ChannelProductMappingPage = lz(() => import('@/features/omnichannel/pages/ChannelProductMappingPage'), 'ChannelProductMappingPage');
const WebhookLogsPage            = lz(() => import('@/features/omnichannel/pages/WebhookLogsPage'), 'WebhookLogsPage');

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
const EmployeeContractsPage = lz(() => import('@/features/hr/pages/EmployeeContractsPage'), 'EmployeeContractsPage');
const AttendancePage        = lz(() => import('@/features/hr/pages/AttendancePage'), 'AttendancePage');
const LeaveRequestsPage     = lz(() => import('@/features/hr/pages/LeaveRequestsPage'), 'LeaveRequestsPage');
const KpiRecordsPage        = lz(() => import('@/features/hr/pages/KpiRecordsPage'), 'KpiRecordsPage');
const PayrollPage           = lz(() => import('@/features/hr/pages/PayrollPage'), 'PayrollPage');
const PermissionsPage       = lz(() => import('@/features/hr/pages/PermissionsPage'), 'PermissionsPage');

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
const DeviceSessionsPage   = lz(() => import('@/features/system/pages/DeviceSessionsPage'), 'DeviceSessionsPage');
const PasswordHistoryPage  = lz(() => import('@/features/system/pages/PasswordHistoryPage'), 'PasswordHistoryPage');

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
    errorElement: <RouteErrorBoundary />,
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
    errorElement: <RouteErrorBoundary />,
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
          { path: 'sales/offers', ...protect(<SaleOffersPage />, 'sales:quotes:manage') },
          { path: 'sales/invoices-list', ...protect(<SalesInvoicesPage />, 'sales:invoices:manage') },
          { path: 'sales/payments', ...protect(<SalesPaymentsPage />, 'sales:invoices:manage') },
          { path: 'sales/receivables', ...protect(<ReceivablesPage />, 'sales:orders:view') },
          { path: 'sales/invoice-lists', ...protect(<InvoiceListsPage />, 'sales:invoices:manage') },
          { path: 'sales/delivery-lists', ...protect(<DeliveryListsPage />, 'sales:orders:view') },
          { path: 'sales/delivery-notes', ...protect(<DeliveryNotesPage />, 'sales:orders:view') },
          { path: 'sales/returns-list', ...protect(<ReturnsPage />, 'sales:returns:manage') },
          { path: 'sales/returns-history', ...protect(<ReturnsListsPage />, 'sales:returns:manage') },
          { path: 'sales/market-orders', ...protect(<MarketOrdersPage />, 'sales:orders:view') },

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
          { path: 'inventory/stock-keeping', ...protect(<StockKeepingPage />, 'inventory:products:view') },
          { path: 'inventory/stock-outs', ...protect(<StockOutsPage />, 'inventory:transfers:manage') },
          { path: 'inventory/adjustments', ...protect(<InventoryAdjustmentsPage />, 'inventory:checks:manage') },
          { path: 'inventory/transfers-list', ...protect(<InventoryTransfersPage />, 'inventory:transfers:manage') },
          { path: 'inventory/details', ...protect(<ProductDetailsPage />, 'inventory:products:view') },
          { path: 'inventory/dashboard', ...protect(<InventoryDashboardPage />, 'inventory:ledger:view') },
          { path: 'inventory/product-storages', ...protect(<ProductInStoragesPage />, 'inventory:products:view') },
          { path: 'inventory/product-warehouses', ...protect(<ProductWarehousesPage />, 'inventory:products:view') },
          { path: 'inventory/supplier-products', ...protect(<SupplierProductsPage />, 'inventory:products:view') },
          { path: 'inventory/supplier-storages', ...protect(<SupplierStoragesPage />, 'inventory:products:view') },
          { path: 'inventory/supplier-warehouses', ...protect(<SupplierWarehousesPage />, 'inventory:products:view') },
          { path: 'inventory/storage-areas', ...protect(<StorageAreasPage />, 'inventory:categories:manage') },
          { path: 'inventory/warehouse-areas', ...protect(<WarehouseAreasPage />, 'inventory:categories:manage') },
          { path: 'inventory/warehouse-zones', ...protect(<WarehouseZonesPage />, 'inventory:categories:manage') },
          { path: 'inventory/warehouse-bins', ...protect(<WarehouseBinsPage />, 'inventory:categories:manage') },
          { path: 'inventory/transfer-requests', ...protect(<StockTransferRequestsPage />, 'inventory:transfers:manage') },

          // Purchase
          { path: 'purchase/suppliers', ...protect(<SuppliersPage />, 'purchase:suppliers:manage') },
          { path: 'purchase/orders', ...protect(<PurchaseOrdersPage />, 'purchase:orders:manage') },
          { path: 'purchase/requests', ...protect(<PurchaseRequestsPage />, 'purchase:orders:manage') },
          { path: 'purchase/contracts', ...protect(<SupplierContractsPage />, 'purchase:suppliers:manage') },
          { path: 'purchase/evaluations', ...protect(<SupplierEvaluationsPage />, 'purchase:suppliers:manage') },
          { path: 'purchase/deliveries', ...protect(<SupplierDeliveriesPage />, 'purchase:orders:manage') },
          { path: 'purchase/invoices', ...protect(<PurchaseInvoicesPage />, 'purchase:orders:manage') },
          { path: 'purchase/payments', ...protect(<PurchasePaymentsPage />, 'purchase:orders:manage') },
          { path: 'purchase/returns-list', ...protect(<PurchaseReturnsPage />, 'purchase:orders:manage') },
          { path: 'purchase/returns-history', ...protect(<PurchaseReturnsListsPage />, 'purchase:orders:manage') },
          { path: 'purchase/supplier-requests', ...protect(<SupplierRequestsPage />, 'purchase:orders:manage') },

          // Finance
          { path: 'finance/receipts', ...protect(<ReceiptVouchersPage />, 'finance:receipts:manage') },
          { path: 'finance/payments', ...protect(<PaymentVouchersPage />, 'finance:payments:manage') },
          { path: 'finance/debts', ...protect(<DebtLedgerPage />, 'finance:debts:view') },
          { path: 'finance/costs', ...protect(<OperatingCostsPage />, 'finance:costs:manage') },
          { path: 'finance/banks', ...protect(<BankAccountsPage />, 'finance:banks:manage') },
          { path: 'finance/journal', ...protect(<JournalEntriesPage />, 'finance:journal:manage') },
          { path: 'finance/transaction-reasons', ...protect(<TransactionReasonsPage />, 'finance:reasons:manage') },
          { path: 'finance/tax-duties', ...protect(<TaxDutiesPage />, 'finance:journal:manage') },
          { path: 'finance/fund-balances', ...protect(<FundBalancesPage />, 'finance:journal:manage') },
          { path: 'finance/chart-of-accounts', ...protect(<ChartOfAccountsPage />, 'finance:journal:manage') },
          { path: 'finance/fixed-assets', ...protect(<FixedAssetsPage />, 'finance:journal:manage') },
          { path: 'finance/cost-centers', ...protect(<CostCentersPage />, 'finance:costs:manage') },

          // CRM
          { path: 'crm', ...protect(<CustomersPage />, 'crm:customers:manage') },
          { path: 'crm/tiers', ...protect(<LoyaltyTiersPage />, 'crm:loyalty:manage') },
          { path: 'crm/vouchers', ...protect(<VouchersPage />, 'crm:vouchers:manage') },
          { path: 'crm/feedback', ...protect(<FeedbackPage />, 'crm:feedback:manage') },
          { path: 'crm/tickets', ...protect(<SupportTicketsPage />, 'crm:feedback:manage') },
          { path: 'crm/customer-vouchers', ...protect(<CustomerVouchersPage />, 'crm:vouchers:manage') },
          { path: 'crm/warranties', ...protect(<ProductWarrantiesPage />, 'crm:warranties:manage') },
          { path: 'crm/warranty-claims', ...protect(<WarrantyClaimsPage />, 'crm:warranty-claims:manage') },
          { path: 'crm/partner-groups', ...protect(<PartnerGroupsPage />, 'crm:customers:manage') },
          { path: 'crm/areas', ...protect(<AreasPage />, 'crm:customers:manage') },
          { path: 'crm/loyalty-history', ...protect(<LoyaltyPointHistoryPage />, 'crm:loyalty:manage') },
          { path: 'crm/campaigns', ...protect(<MarketingCampaignsPage />, 'crm:vouchers:manage') },

          // Logistics
          { path: 'logistics/shippers', ...protect(<ShippersPage />, 'logistics:shippers:manage') },
          { path: 'logistics/trips', ...protect(<DeliveryTripsPage />, 'logistics:trips:manage') },
          { path: 'logistics/prices', ...protect(<PriceListsPage />, 'logistics:prices:manage') },
          { path: 'logistics/promotions', ...protect(<PromotionsPage />, 'logistics:prices:manage') },
          { path: 'logistics/carriers', ...protect(<ShippingCarriersPage />, 'logistics:shippers:manage') },
          { path: 'logistics/methods', ...protect(<ShippingMethodsPage />, 'logistics:shippers:manage') },
          { path: 'logistics/charges', ...protect(<ShippingChargesPage />, 'logistics:shippers:manage') },
          { path: 'logistics/fees', ...protect(<ShippingFeesPage />, 'logistics:shippers:manage') },
          { path: 'logistics/fee-rates', ...protect(<ShippingFeeRatesPage />, 'logistics:shippers:manage') },
          { path: 'logistics/fee-groups', ...protect(<ShippingFeeGroupsPage />, 'logistics:shippers:manage') },
          { path: 'logistics/shipments', ...protect(<ShipmentsPage />, 'logistics:trips:manage') },
          { path: 'logistics/notes', ...protect(<ShippingNotesPage />, 'logistics:trips:manage') },
          { path: 'logistics/orders', ...protect(<ShippingOrdersPage />, 'logistics:trips:manage') },
          { path: 'logistics/locations', ...protect(<ShippingLocationsListPage />, 'logistics:shippers:manage') },
          { path: 'logistics/contacts', ...protect(<ShippingContactsPage />, 'logistics:shippers:manage') },
          { path: 'logistics/addresses', ...protect(<ShippingAddressesPage />, 'logistics:shippers:manage') },
          { path: 'logistics/batches', ...protect(<ShippingOrderBatchesPage />, 'logistics:trips:manage') },
          { path: 'logistics/packing-lists', ...protect(<PackingListsPage />, 'logistics:trips:manage') },
          { path: 'logistics/delivery-notes', ...protect(<DeliveryNotesPageLogistics />, 'logistics:trips:manage') },

          // Omnichannel
          { path: 'omnichannel/channels', ...protect(<SalesChannelsPage />, 'system:settings:manage') },
          { path: 'omnichannel/mappings', ...protect(<ChannelProductMappingPage />, 'system:settings:manage') },
          { path: 'omnichannel/webhook-logs', ...protect(<WebhookLogsPage />, 'system:settings:manage') },

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
          { path: 'hr/contracts', ...protect(<EmployeeContractsPage />, 'admin:users:manage') },
          { path: 'hr/attendance', ...protect(<AttendancePage />, 'admin:users:manage') },
          { path: 'hr/leave-requests', ...protect(<LeaveRequestsPage />, 'admin:users:manage') },
          { path: 'hr/kpis', ...protect(<KpiRecordsPage />, 'admin:users:manage') },
          { path: 'hr/payroll', ...protect(<PayrollPage />, 'admin:users:manage') },

          // System
          { path: 'system/branches', ...protect(<BranchManagementPage />, 'system:branches:manage') },
          { path: 'system/settings', ...protect(<SettingsPage />, 'system:settings:manage') },
          { path: 'system/config', ...protect(<SystemConfigPage />, 'system:settings:manage') },
          { path: 'system/vat', ...protect(<VatConfigPage />, 'system:settings:manage') },
          { path: 'system/templates', ...protect(<PrintTemplatesPage />, 'system:settings:manage') },
          { path: 'system/notifications', ...protect(<NotificationsPage />, 'system:settings:manage') },
          { path: 'system/errors', ...protect(<SystemErrorLogPage />, 'system:settings:manage') },
          { path: 'system/banners', ...protect(<BannerManagementPage />, 'system:settings:manage') },
          { path: 'system/permissions', ...protect(<PermissionsPage />, 'admin:roles:manage') },
          { path: 'system/device-sessions', ...protect(<DeviceSessionsPage />, 'system:settings:manage') },
          { path: 'system/password-history', ...protect(<PasswordHistoryPage />, 'system:settings:manage') },
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
