export interface SalesReportData {
  totalOrdersCount: number;
  paidOrdersCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  revenueTrend: Array<{
    date: string;
    fullDate?: string;
    revenue: number;
    cost: number;
    orders: number;
  }>;
  topProducts: Array<{
    name: string;
    sales: number;
  }>;
  recentTransactions: Array<{
    id: string;
    customerName: string;
    store: string;
    amount: number;
    status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
    paymentStatus?: string;
    date: string;
  }>;
}

export interface InventoryReportData {
  totalProductsCount: number;
  totalItemsInStock: number;
  totalInventoryValue: number;
  outOfStockCount: number;
  lowStockCount: number;
  categoryStock: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  topStocked: Array<{
    name: string;
    stock: number;
  }>;
  lowStockItems: Array<{
    sku: string;
    name: string;
    category: string;
    currentStock: number;
    minStock: number;
    supplier: string;
  }>;
}

export interface FinanceReportData {
  totalReceipts: number;
  totalReceiptAmount: number;
  totalPayments: number;
  totalPaymentAmount: number;
  netCashFlow: number;
  recentExpenses: Array<{
    id: string;
    category: string;
    description: string;
    amount: number;
    date: string;
    status: 'PAID' | 'UNPAID';
  }>;
  profitLossMonthly?: Array<{
    month: string;
    income: number;
    expense: number;
    profit: number;
  }>;
}

export interface CrmReportData {
  totalCustomers: number;
  activeLoyalCustomers: number;
  totalSpend: number;
  totalPoints: number;
  feedbackResponseRate?: string;
  tierDistribution: Array<{
    tier: string;
    count: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    phone: string;
    tier: string;
    totalSpent: number;
    points: number;
    lastVisit: string;
  }>;
  growthTrend?: Array<{
    month: string;
    newCustomer: number;
    returningCustomer: number;
  }>;
}
