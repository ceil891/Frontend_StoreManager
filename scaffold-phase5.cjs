/**
 * RetailHub ERP — Phase 5 Scaffold Generator
 * Generates all 50+ module pages, types, and route stubs.
 * Run: node scaffold-phase5.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

// ────────────────────────────────────────────────────────────
// MODULE DEFINITIONS
// Each entry: { feature, pages: [{ name, title, subtitle }] }
// ────────────────────────────────────────────────────────────
const MODULES = [
  // ── FINANCE ─────────────────────────────────────────────
  {
    feature: 'finance',
    pages: [
      { name: 'ReceiptVouchersPage', title: 'Receipt Vouchers', subtitle: 'Manage incoming payment receipts.' },
      { name: 'PaymentVouchersPage', title: 'Payment Vouchers', subtitle: 'Manage outgoing payment records.' },
      { name: 'DebtLedgerPage', title: 'Debt Ledger', subtitle: 'Track customer and supplier debts.' },
      { name: 'OperatingCostsPage', title: 'Operating Costs', subtitle: 'Monitor daily operational expenses.' },
      { name: 'BankAccountsPage', title: 'Bank Accounts', subtitle: 'Manage linked bank accounts.' },
      { name: 'TransactionReasonsPage', title: 'Transaction Reasons', subtitle: 'Configure reason codes for transactions.' },
    ],
  },

  // ── PURCHASE ─────────────────────────────────────────────
  {
    feature: 'purchase',
    pages: [
      { name: 'SuppliersPage', title: 'Suppliers', subtitle: 'Manage your supplier directory.' },
      { name: 'PurchaseOrdersPage', title: 'Purchase Orders', subtitle: 'Create and track purchase orders.' },
      { name: 'ImportReceiptsPage', title: 'Import Receipts', subtitle: 'Record goods received from suppliers.' },
      { name: 'ReturnToSupplierPage', title: 'Return to Supplier', subtitle: 'Manage goods returned to suppliers.' },
    ],
  },

  // ── ADVANCED INVENTORY ───────────────────────────────────
  {
    feature: 'inventory',
    pages: [
      { name: 'InventoryCheckPage', title: 'Inventory Check', subtitle: 'Conduct stock counts and reconciliation.' },
      { name: 'StockTransferPage', title: 'Stock Transfer', subtitle: 'Transfer stock between branches.' },
      { name: 'ProductBatchesPage', title: 'Product Batches', subtitle: 'Manage batches and expiry dates.' },
      { name: 'SerialNumbersPage', title: 'Serial Numbers', subtitle: 'Track individual item serial numbers.' },
      { name: 'StockLedgerPage', title: 'Stock Ledger', subtitle: 'Full audit trail of stock movements.' },
      { name: 'CancelIssuePage', title: 'Cancel / Write-off', subtitle: 'Record damaged or lost stock.' },
      { name: 'UnitsPage', title: 'Units of Measure', subtitle: 'Configure product units.' },
      { name: 'CategoriesPage', title: 'Product Categories', subtitle: 'Manage product classification.' },
    ],
  },

  // ── SALES (additional) ──────────────────────────────────
  {
    feature: 'sales',
    pages: [
      { name: 'QuotesPage', title: 'Quotations', subtitle: 'Create and manage sales quotes.' },
      { name: 'ExportInvoicesPage', title: 'Export Invoices', subtitle: 'Issue and track export invoices.' },
      { name: 'CustomerReturnsPage', title: 'Customer Returns', subtitle: 'Process goods returned by customers.' },
    ],
  },

  // ── LOGISTICS ────────────────────────────────────────────
  {
    feature: 'logistics',
    pages: [
      { name: 'ShippersPage', title: 'Shippers', subtitle: 'Manage delivery partners and couriers.' },
      { name: 'DeliveryTripsPage', title: 'Delivery Trips', subtitle: 'Plan and track delivery routes.' },
      { name: 'PriceListsPage', title: 'Price Lists', subtitle: 'Manage customer and branch price lists.' },
      { name: 'PromotionsPage', title: 'Promotions', subtitle: 'Configure discount campaigns and offers.' },
    ],
  },

  // ── CRM (additional) ─────────────────────────────────────
  {
    feature: 'crm',
    pages: [
      { name: 'LoyaltyTiersPage', title: 'Loyalty Tiers', subtitle: 'Configure membership tiers and benefits.' },
      { name: 'VouchersPage', title: 'Vouchers', subtitle: 'Create and manage discount vouchers.' },
      { name: 'FeedbackPage', title: 'Customer Feedback', subtitle: 'View and respond to customer feedback.' },
      { name: 'SupportTicketsPage', title: 'Support Tickets', subtitle: 'Manage customer support requests.' },
    ],
  },

  // ── HR & USERS ────────────────────────────────────────────
  {
    feature: 'hr',
    pages: [
      { name: 'UsersPage', title: 'User Management', subtitle: 'Manage system users and accounts.' },
      { name: 'RolesPage', title: 'Roles & Permissions', subtitle: 'Configure role-based access control.' },
      { name: 'DepartmentsPage', title: 'Departments', subtitle: 'Manage company departments.' },
      { name: 'PositionsPage', title: 'Positions', subtitle: 'Define staff positions and hierarchy.' },
      { name: 'ActivityLogsPage', title: 'Activity Logs', subtitle: 'Audit trail of all user actions.' },
    ],
  },

  // ── REPORTS ──────────────────────────────────────────────
  {
    feature: 'reports',
    pages: [
      { name: 'SalesReportPage', title: 'Sales Report', subtitle: 'Revenue and order analytics.' },
      { name: 'InventoryReportPage', title: 'Inventory Report', subtitle: 'Stock movement and valuation.' },
      { name: 'FinanceReportPage', title: 'Finance Report', subtitle: 'Cash flow and profit & loss.' },
      { name: 'CrmReportPage', title: 'CRM Report', subtitle: 'Customer analytics and loyalty KPIs.' },
    ],
  },

  // ── SYSTEM ────────────────────────────────────────────────
  {
    feature: 'system',
    pages: [
      { name: 'SystemConfigPage', title: 'System Configuration', subtitle: 'Global system settings.' },
      { name: 'VatConfigPage', title: 'VAT / Tax Configuration', subtitle: 'Configure tax rates and rules.' },
      { name: 'PrintTemplatesPage', title: 'Print Templates', subtitle: 'Customize receipt and invoice templates.' },
      { name: 'NotificationsPage', title: 'Notifications', subtitle: 'Manage system notifications.' },
      { name: 'SystemErrorLogPage', title: 'System Error Log', subtitle: 'View and diagnose system errors.' },
    ],
  },

  // ── POS (additional) ─────────────────────────────────────
  {
    feature: 'pos',
    pages: [
      { name: 'PosSessionsPage', title: 'POS Sessions', subtitle: 'View and manage cashier shift sessions.' },
      { name: 'PaymentMethodsPage', title: 'Payment Methods', subtitle: 'Configure accepted payment methods.' },
    ],
  },
];

// ────────────────────────────────────────────────────────────
// TEMPLATE GENERATOR
// ────────────────────────────────────────────────────────────
function generatePageTemplate(name, title, subtitle) {
  return `import { useMemo, useState } from 'react';
import { Plus, Download, Search, Filter } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';

// TODO: Replace with real API type
interface ${name.replace('Page', '')}Item {
  id: string;
  name: string;
  createdAt: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// TODO: Replace with TanStack Query (useQuery hook)
const MOCK_DATA: ${name.replace('Page', '')}Item[] = [
  { id: '1', name: 'Sample Item A', createdAt: '2024-05-01', status: 'ACTIVE' },
  { id: '2', name: 'Sample Item B', createdAt: '2024-05-10', status: 'ACTIVE' },
  { id: '3', name: 'Sample Item C', createdAt: '2024-05-15', status: 'INACTIVE' },
];

export function ${name}() {
  const [data] = useState(MOCK_DATA);
  const [search, setSearch] = useState('');

  const filtered = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = useMemo<ColumnDef<${name.replace('Page', '')}Item>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: (info) => (
          <span className="font-mono text-xs text-gray-500">#{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: (info) => (
          <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: (info) => (
          <span className="text-gray-500 text-sm">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span
              className={\`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium \${
                status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }\`}
            >
              <span className={\`w-1.5 h-1.5 rounded-full \${status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}\`} />
              {status}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">${title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">${subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Data Table */}
      <ReusableDataTable columns={columns} data={filtered} />
    </div>
  );
}
`;
}

// ────────────────────────────────────────────────────────────
// FILE SYSTEM OPERATIONS
// ────────────────────────────────────────────────────────────
let pagesCreated = 0;
let dirsCreated = 0;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    dirsCreated++;
  }
}

function writeIfNotExists(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf8');
    pagesCreated++;
    console.log(`  ✅ Created: ${path.relative(ROOT, filePath)}`);
  } else {
    console.log(`  ⏭  Exists:  ${path.relative(ROOT, filePath)}`);
  }
}

// ────────────────────────────────────────────────────────────
// SIDEBAR NAVIGATION CONFIG GENERATOR
// ────────────────────────────────────────────────────────────
function generateNavConfig() {
  return `// AUTO-GENERATED by scaffold-phase5.cjs
// Update this file to control sidebar navigation per role.

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
} from 'lucide-react';
import type { RoleType } from '@/features/auth/types';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  roles?: RoleType[]; // if undefined = all roles
  children?: NavItem[];
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Point of Sale',
    items: [
      { name: 'POS Terminal', href: '/pos', icon: ShoppingCart },
      { name: 'POS Sessions', href: '/pos/sessions', icon: Activity },
      { name: 'Payment Methods', href: '/pos/payment-methods', icon: CreditCard },
    ],
  },
  {
    group: 'Sales',
    items: [
      { name: 'Sale Orders', href: '/sales', icon: ShoppingBag },
      { name: 'Quotations', href: '/sales/quotes', icon: FileText },
      { name: 'Export Invoices', href: '/sales/invoices', icon: ClipboardList },
      { name: 'Customer Returns', href: '/sales/returns', icon: RotateCcw },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { name: 'Products', href: '/inventory', icon: Package, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'INVENTORY_STAFF'] },
      { name: 'Stock Transfer', href: '/inventory/transfers', icon: Truck, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
      { name: 'Inventory Check', href: '/inventory/checks', icon: ClipboardList, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
      { name: 'Import Receipts', href: '/inventory/imports', icon: Layers, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
      { name: 'Return to Supplier', href: '/inventory/returns', icon: RotateCcw, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
      { name: 'Write-off', href: '/inventory/cancel', icon: AlertTriangle, roles: ['SUPER_ADMIN'] },
      { name: 'Stock Ledger', href: '/inventory/ledger', icon: Activity, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
      { name: 'Categories', href: '/inventory/categories', icon: Tag, roles: ['SUPER_ADMIN'] },
      { name: 'Units', href: '/inventory/units', icon: Layers, roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    group: 'Purchase',
    items: [
      { name: 'Suppliers', href: '/purchase/suppliers', icon: UserCheck, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
      { name: 'Purchase Orders', href: '/purchase/orders', icon: ShoppingBag, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
    ],
  },
  {
    group: 'Finance',
    items: [
      { name: 'Receipt Vouchers', href: '/finance/receipts', icon: DollarSign, roles: ['SUPER_ADMIN'] },
      { name: 'Payment Vouchers', href: '/finance/payments', icon: DollarSign, roles: ['SUPER_ADMIN'] },
      { name: 'Debt Ledger', href: '/finance/debts', icon: Activity, roles: ['SUPER_ADMIN'] },
      { name: 'Operating Costs', href: '/finance/costs', icon: BarChart2, roles: ['SUPER_ADMIN'] },
      { name: 'Bank Accounts', href: '/finance/banks', icon: CreditCard, roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    group: 'CRM & Loyalty',
    items: [
      { name: 'Customers', href: '/crm', icon: Users, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
      { name: 'Loyalty Tiers', href: '/crm/tiers', icon: Tag, roles: ['SUPER_ADMIN'] },
      { name: 'Vouchers', href: '/crm/vouchers', icon: Tag, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
      { name: 'Feedback', href: '/crm/feedback', icon: Activity, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
      { name: 'Support Tickets', href: '/crm/tickets', icon: AlertTriangle, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
    ],
  },
  {
    group: 'Logistics',
    items: [
      { name: 'Shippers', href: '/logistics/shippers', icon: Truck, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
      { name: 'Delivery Trips', href: '/logistics/trips', icon: Truck, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
      { name: 'Price Lists', href: '/logistics/prices', icon: Tag, roles: ['SUPER_ADMIN'] },
      { name: 'Promotions', href: '/logistics/promotions', icon: Tag, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
    ],
  },
  {
    group: 'Reports',
    items: [
      { name: 'Sales Report', href: '/reports/sales', icon: BarChart2, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
      { name: 'Inventory Report', href: '/reports/inventory', icon: BarChart2, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
      { name: 'Finance Report', href: '/reports/finance', icon: BarChart2, roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    group: 'Administration',
    items: [
      { name: 'Users', href: '/hr/users', icon: Users, roles: ['SUPER_ADMIN'] },
      { name: 'Roles', href: '/hr/roles', icon: Shield, roles: ['SUPER_ADMIN'] },
      { name: 'Departments', href: '/hr/departments', icon: Users, roles: ['SUPER_ADMIN'] },
      { name: 'Activity Logs', href: '/hr/logs', icon: Activity, roles: ['SUPER_ADMIN'] },
      { name: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
      { name: 'System Config', href: '/system/config', icon: Settings, roles: ['SUPER_ADMIN'] },
      { name: 'Error Log', href: '/system/errors', icon: AlertTriangle, roles: ['SUPER_ADMIN'] },
    ],
  },
];
`;
}

// ────────────────────────────────────────────────────────────
// ROUTE STUBS GENERATOR (for routes/index.tsx additions)
// ────────────────────────────────────────────────────────────
function generateRouteStubs() {
  const lines = [];
  for (const mod of MODULES) {
    for (const page of mod.pages) {
      const importPath = `@/features/${mod.feature}/pages/${page.name}`;
      lines.push(`// lazy(() => import('${importPath}').then(m => ({ default: m.${page.name} })))`);
    }
  }
  return lines.join('\n');
}

// ────────────────────────────────────────────────────────────
// MAIN — Run
// ────────────────────────────────────────────────────────────
console.log('\n🚀 RetailHub Phase 5 — Scaffold Generator\n');

for (const mod of MODULES) {
  const featureDir = path.join(SRC, 'features', mod.feature);
  const pagesDir = path.join(featureDir, 'pages');

  ensureDir(pagesDir);
  ensureDir(path.join(featureDir, 'api'));
  ensureDir(path.join(featureDir, 'types'));
  ensureDir(path.join(featureDir, 'components'));

  for (const page of mod.pages) {
    const filePath = path.join(pagesDir, `${page.name}.tsx`);
    writeIfNotExists(filePath, generatePageTemplate(page.name, page.title, page.subtitle));
  }
}

// Write navigation config
const navConfigPath = path.join(SRC, 'shared', 'config', 'navigation.ts');
ensureDir(path.dirname(navConfigPath));
fs.writeFileSync(navConfigPath, generateNavConfig(), 'utf8');
console.log(`\n  ✅ Navigation config: src/shared/config/navigation.ts`);

// Write route stub comments for reference
const stubPath = path.join(ROOT, 'route-stubs.txt');
fs.writeFileSync(stubPath, generateRouteStubs(), 'utf8');
console.log(`  ✅ Route stubs reference: route-stubs.txt`);

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✅ Scaffold complete!`);
console.log(`   Directories created : ${dirsCreated}`);
console.log(`   Pages created       : ${pagesCreated}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
