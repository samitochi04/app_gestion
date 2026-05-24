export interface TopEntry {
  id: number;
  name: string;
  value: number;
  count: number;
}

export interface StockAlert {
  productId: number;
  productName: string;
  productCode: string;
  currentQuantity: number;
  minQuantity: number;
  warehouseName: string;
  alertType: string;
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  monthLabel: string;
  revenue: number;
  invoiced: number;
  collected: number;
}

export interface StockDashboard {
  totalStockValue: number;
  totalProducts: number;
  activeProducts: number;
  totalAvailableQuantity: number;
  totalReservedQuantity: number;
  productsOutOfStock: number;
  productsLowStock: number;
  alerts: StockAlert[];
  topReceivedProducts: TopEntry[];
  topIssuedProducts: TopEntry[];
  averageStockRotation: number;
}

export interface SalesDashboard {
  caToday: number;
  caThisWeek: number;
  caThisMonth: number;
  caThisYear: number;
  ordersToday: number;
  ordersPending: number;
  ordersShipped: number;
  ordersThisMonth: number;
  quotesPending: number;
  quotesConversionRate: number;
  topCustomers: TopEntry[];
  topProducts: TopEntry[];
  monthlyRevenue: MonthlyRevenue[];
}

export interface FinancialDashboard {
  totalCash: number;
  totalMobileMoney: number;
  totalCaisse: number;
  totalReceivables: number;
  overdueReceivables: number;
  invoicesDraft: number;
  invoicesPending: number;
  invoicesOverdue: number;
  invoicesPaid: number;
  invoicedThisMonth: number;
  collectedThisMonth: number;
  totalRevenue: number;
  totalCharges: number;
  netResult: number;
  trend: MonthlyRevenue[];
}