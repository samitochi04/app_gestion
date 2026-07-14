/**
 * Numeric (and some array) fields are typed `| null` throughout this file.
 * This isn't defensive paranoia — the live backend has been observed
 * returning `null` for several of these fields (e.g. ordersPending,
 * productsOutOfStock), so the types now reflect what actually happens
 * rather than what the API contract implies. Always read these through
 * formatMoney/formatMoneyRounded/formatNumber (core/utils/format.ts) or a
 * `?? 0` guard — never assume non-null.
 */

export interface TrendPoint {
  year: number; month: number; monthLabel: string;
  revenue: number | null; invoiced: number | null; collected: number | null;
}

export interface FinancialDashboard {
  totalCash: number | null; totalMobileMoney: number | null; totalCaisse: number | null;
  totalReceivables: number | null; overdueReceivables: number | null;
  invoicesDraft: number | null; invoicesPending: number | null; invoicesOverdue: number | null;
  invoicedThisMonth: number | null; collectedThisMonth: number | null;
  totalRevenue: number | null; totalCharges: number | null; netResult: number | null;
  trend: TrendPoint[] | null;
}

export interface TopEntry { id: number; name: string; value: number | null; count: number | null; }

export interface SalesDashboard {
  caToday: number | null; caThisWeek: number | null; caThisMonth: number | null; caThisYear: number | null;
  ordersToday: number | null; ordersPending: number | null; ordersShipped: number | null; ordersThisMonth: number | null;
  quotesPending: number | null; quotesConversionRate: number | null;
  topCustomers: TopEntry[] | null; topProducts: TopEntry[] | null; monthlyRevenue: TrendPoint[] | null;
}

export interface StockAlert {
  productId: number; productName: string; productCode: string;
  currentQuantity: number | null; minQuantity: number | null; warehouseName: string; alertType: string;
}

export interface StockDashboard {
  totalStockValue: number | null; totalProducts: number | null; activeProducts: number | null;
  productsOutOfStock: number | null; productsLowStock: number | null;
  alerts: StockAlert[] | null;
  topReceivedProducts: TopEntry[] | null; topIssuedProducts: TopEntry[] | null;
  averageStockRotation: number | null;
}
