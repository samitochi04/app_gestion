import { CurrencyPipe, DecimalPipe, NgClass, PercentPipe, SlicePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { InvoiceService } from '../../services/invoice.service';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { QuoteService } from '../../services/quote.service';
import { StockService } from '../../services/stock.service';
import { Product, ProductType, StockCurrent } from '../../models/business.model';
import { Invoice, Order, Quote } from '../../models/commercial.model';
import { FinancialDashboard, SalesDashboard, StockAlert, StockDashboard, TopEntry } from '../../models/dashboard.model';

interface DashboardFilters {
  startDate: string;
  endDate: string;
  productType: ProductType | '';
  minStockThreshold: number;
}

interface ProductTypeSummary {
  type: ProductType;
  label: string;
  count: number;
}

interface ModuleNavItem {
  label: string;
  description: string;
  route: string;
  icon: string;
  permissions: string[];
}

interface ModuleNavGroup {
  label: string;
  items: ModuleNavItem[];
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, ReactiveFormsModule, CurrencyPipe, DecimalPipe, NgClass, PercentPipe, SlicePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly dashboardError = signal('');
  protected readonly accessDenied = signal(false);
  protected readonly copyMessage = signal('');
  protected readonly stockDashboard = signal<StockDashboard | null>(null);
  protected readonly salesDashboard = signal<SalesDashboard | null>(null);
  protected readonly financialDashboard = signal<FinancialDashboard | null>(null);
  protected readonly productTypeBreakdown = signal<ProductTypeSummary[]>([]);
  protected readonly productTypes: ProductType[] = ['STOCKABLE', 'CONSUMABLE', 'SERVICE'];
  protected readonly filters = signal<DashboardFilters>(this.defaultFilters());
  private readonly formBuilder = inject(FormBuilder);
  protected readonly dashboardFiltersForm: FormGroup;

  protected readonly moduleGroups: ModuleNavGroup[] = [
    {
      label: 'Pilotage',
      items: [
        {
          label: 'Tableau de bord',
          description: 'Vue d\'ensemble des ventes, du stock et de la tresorerie.',
          route: '/dashboard',
          icon: 'bi-speedometer2',
          permissions: ['DASHBOARD_READ']
        },
        {
          label: 'Audit',
          description: 'Journal des actions et tracabilite des operations.',
          route: '/audit',
          icon: 'bi-clipboard-data',
          permissions: ['AUDIT_READ']
        }
      ]
    },
    {
      label: 'Ventes',
      items: [
        {
          label: 'Clients',
          description: 'Fiches clients, adresses et activite commerciale.',
          route: '/customers',
          icon: 'bi-people',
          permissions: ['CUSTOMER_READ']
        },
        {
          label: 'Devis',
          description: 'Cycle complet des devis commerciaux et conversions.',
          route: '/quotes',
          icon: 'bi-file-earmark-text',
          permissions: ['QUOTE_READ']
        },
        {
          label: 'Commandes',
          description: 'Suivi des commandes, preparation et livraison.',
          route: '/orders',
          icon: 'bi-basket',
          permissions: ['ORDER_READ']
        },
        {
          label: 'Pro-formas',
          description: 'Factures pro-forma, conversion et envoi client.',
          route: '/pro-formas',
          icon: 'bi-file-earmark-ruled',
          permissions: ['PRO_FORMA_READ']
        },
        {
          label: 'Factures',
          description: 'Validation, paiement et suivi des echeances.',
          route: '/invoices',
          icon: 'bi-receipt',
          permissions: ['INVOICE_READ']
        },
        {
          label: 'Avoirs',
          description: 'Gestions des avoirs partiels et complets.',
          route: '/credit-notes',
          icon: 'bi-arrow-counterclockwise',
          permissions: ['CREDIT_NOTE_READ']
        }
      ]
    },
    {
      label: 'Stock',
      items: [
        {
          label: 'Produits',
          description: 'Catalogue, tarifs, categories et suivi des stocks.',
          route: '/products',
          icon: 'bi-box-seam',
          permissions: ['PRODUCT_READ']
        },
        {
          label: 'Categories',
          description: 'Structuration du catalogue par familles de produits.',
          route: '/categories',
          icon: 'bi-tags',
          permissions: ['CATEGORY_READ']
        },
        {
          label: 'Entrepots',
          description: 'Gestion des depots et disponibilites multi-sites.',
          route: '/warehouses',
          icon: 'bi-building',
          permissions: ['WAREHOUSE_READ']
        },
        {
          label: 'Stock',
          description: 'Entrees, sorties, reserves et niveaux disponibles.',
          route: '/stock',
          icon: 'bi-boxes',
          permissions: ['STOCK_READ']
        }
      ]
    },
    {
      label: 'Comptabilite',
      items: [
        {
          label: 'Tresorerie',
          description: 'Reglements, encours et indicateurs financiers.',
          route: '/payments',
          icon: 'bi-cash-stack',
          permissions: ['PAYMENT_READ']
        }
      ]
    },
    {
      label: 'Administration',
      items: [
        {
          label: 'Utilisateurs',
          description: 'Comptes, roles et habilitations de la plateforme.',
          route: '/users',
          icon: 'bi-person-gear',
          permissions: ['USER_READ']
        },
        {
          label: 'Roles',
          description: 'Parametrage des roles et permissions applicatives.',
          route: '/roles',
          icon: 'bi-shield-lock',
          permissions: ['ROLE_READ']
        }
      ]
    }
  ];

  protected readonly kpis = computed(() => {
    const stock = this.stockDashboard();
    const sales = this.salesDashboard();
    const financial = this.financialDashboard();

    return [
      {
        label: 'Produits filtres',
        value: stock?.totalProducts ?? 0,
        hint: 'Selon le type selectionne',
        icon: 'bi-box-seam'
      },
      {
        label: 'Produits actifs',
        value: stock?.activeProducts ?? 0,
        hint: 'Produits encore vendables',
        icon: 'bi-check2-circle'
      },
      {
        label: 'Stock disponible',
        value: stock?.totalAvailableQuantity ?? 0,
        hint: 'Unites disponibles',
        icon: 'bi-stack'
      },
      {
        label: 'Alertes stock',
        value: stock?.productsLowStock ?? 0,
        hint: 'Sous le seuil defini',
        icon: 'bi-exclamation-triangle'
      },
      {
        label: 'Commandes en cours',
        value: sales?.ordersPending ?? 0,
        hint: 'A traiter ou a expedier',
        icon: 'bi-truck'
      },
      {
        label: 'Creances echeues',
        value: financial?.overdueReceivables ?? 0,
        hint: 'Factures a regler',
        icon: 'bi-hourglass-split'
      }
    ];
  });

  protected readonly filterSummary = computed(() => {
    const current = this.filters();
    const parts: string[] = [];

    if (current.startDate || current.endDate) {
      const start = current.startDate ? this.formatDate(current.startDate) : 'debut';
      const end = current.endDate ? this.formatDate(current.endDate) : 'aujourd\'hui';
      parts.push(`${start} -> ${end}`);
    } else {
      parts.push('toutes les periodes');
    }

    parts.push(current.productType ? this.productTypeLabel(current.productType) : 'tous les types');
    parts.push(`seuil stock ${current.minStockThreshold}`);

    return parts.join(' • ');
  });

  private readonly products = signal<Product[]>([]);
  private readonly stocks = signal<StockCurrent[]>([]);
  private readonly orders = signal<Order[]>([]);
  private readonly quotes = signal<Quote[]>([]);
  private readonly invoices = signal<Invoice[]>([]);

  constructor(
    protected readonly authService: AuthService,
    private readonly productService: ProductService,
    private readonly stockService: StockService,
    private readonly orderService: OrderService,
    private readonly quoteService: QuoteService,
    private readonly invoiceService: InvoiceService,
    private readonly route: ActivatedRoute
  ) {
    this.dashboardFiltersForm = this.formBuilder.group({
      startDate: [''],
      endDate: [''],
      productType: [''],
      minStockThreshold: [10]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['accessDenied'] === '1') {
        this.accessDenied.set(true);
      }
    });

    this.loadDashboardData();
  }

  protected applyFilters(): void {
    this.filters.set(this.normalizeFilters(this.dashboardFiltersForm.getRawValue()));
    this.rebuildDashboard();
  }

  protected resetFilters(): void {
    const defaults = this.defaultFilters();
    this.dashboardFiltersForm.reset(defaults);
    this.filters.set(defaults);
    this.rebuildDashboard();
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected copyUserEmail(email: string | null | undefined): void {
    if (!email || email.trim().length === 0) {
      this.copyMessage.set('Email indisponible.');
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(email).then(() => {
        this.copyMessage.set('Email copie.');
        setTimeout(() => this.copyMessage.set(''), 2000);
      });
      return;
    }

    this.copyMessage.set('Copie non disponible sur ce navigateur.');
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.dashboardError.set('');

    let hasPartialError = false;

    forkJoin({
      products: this.productService
        .getProducts({ page: 0, size: 500, active: null })
        .pipe(
          map((response) => response.content),
          catchError(() => {
            hasPartialError = true;
            return of([] as Product[]);
          })
        ),
      stocks: this.stockService
        .getCurrent(0, 500)
        .pipe(
          map((response) => response.content),
          catchError(() => {
            hasPartialError = true;
            return of([] as StockCurrent[]);
          })
        ),
      orders: this.orderService
        .getOrders({ page: 0, size: 500 })
        .pipe(
          map((response) => response.content),
          catchError(() => {
            hasPartialError = true;
            return of([] as Order[]);
          })
        ),
      quotes: this.quoteService
        .getQuotes({ page: 0, size: 500 })
        .pipe(
          map((response) => response.content),
          catchError(() => {
            hasPartialError = true;
            return of([] as Quote[]);
          })
        ),
      invoices: this.invoiceService
        .getInvoices({ page: 0, size: 500 })
        .pipe(
          map((response) => response.content),
          catchError(() => {
            hasPartialError = true;
            return of([] as Invoice[]);
          })
        )
    }).subscribe({
      next: ({ products, stocks, orders, quotes, invoices }) => {
        this.products.set(products);
        this.stocks.set(stocks);
        this.orders.set(orders);
        this.quotes.set(quotes);
        this.invoices.set(invoices);
        this.rebuildDashboard();
        this.dashboardError.set(hasPartialError ? 'Certaines donnees n\'ont pas pu etre chargees, mais le tableau de bord reste exploitable.' : '');
        this.loading.set(false);
      },
      error: () => {
        this.dashboardError.set('Impossible de charger le tableau de bord. Reessayez plus tard.');
        this.loading.set(false);
      }
    });
  }

  private rebuildDashboard(): void {
    const filters = this.filters();
    const productList = this.products();
    const stockList = this.stocks();
    const orderList = this.orders();
    const quoteList = this.quotes();
    const invoiceList = this.invoices();

    const filteredProducts = productList.filter((product) => !filters.productType || product.type === filters.productType);
    const productMap = new Map(filteredProducts.map((product) => [product.id, product]));
    const filteredStocks = stockList.filter((stock) => productMap.has(stock.productId));
    const stockByProduct = this.groupStockByProduct(filteredStocks);

    const lowStockEntries = filteredProducts
      .map((product) => {
        const entries = stockByProduct.get(product.id) ?? [];
        const availableQuantity = entries.reduce((total, entry) => total + entry.availableQuantity, 0);
        const totalQuantity = entries.reduce((total, entry) => total + entry.totalQuantity, 0);
        const totalValue = entries.reduce((total, entry) => total + entry.totalValue, 0);

        return {
          product,
          availableQuantity,
          totalQuantity,
          totalValue,
          warehouseId: entries[0]?.warehouseId ?? null
        };
      })
      .sort((left, right) => left.availableQuantity - right.availableQuantity);

    const lowStockThreshold = filters.minStockThreshold;
    const stockAlerts: StockAlert[] = lowStockEntries
      .filter((entry) => entry.availableQuantity <= lowStockThreshold)
      .slice(0, 5)
      .map((entry) => ({
        productId: entry.product.id,
        productName: entry.product.name,
        productCode: entry.product.sku,
        currentQuantity: entry.availableQuantity,
        alertType: entry.availableQuantity <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        warehouseName: entry.warehouseId ? `Entrepot #${entry.warehouseId}` : 'Stock global',
        minQuantity: lowStockThreshold
      }));

    const topStockEntries: TopEntry[] = lowStockEntries
      .slice()
      .sort((left, right) => right.totalValue - left.totalValue)
      .slice(0, 5)
      .map((entry) => ({
        id: entry.product.id,
        name: entry.product.name,
        value: entry.totalValue,
        count: entry.totalQuantity
      }));

    const filteredOrders = orderList.filter((order) => this.withinFilterDate(order.createdAt, filters));
    const filteredQuotes = quoteList.filter((quote) => this.withinFilterDate(quote.createdAt, filters));
    const filteredInvoices = invoiceList.filter((invoice) => this.withinFilterDate(invoice.issueDate ?? invoice.createdAt, filters));
    const invoiceRevenue = filteredInvoices.reduce((total, invoice) => total + (invoice.totalAmountTTC ?? 0), 0);
    const invoiceCollected = filteredInvoices.reduce((total, invoice) => total + (invoice.paidAmount ?? 0), 0);
    const invoiceReceivables = filteredInvoices.reduce((total, invoice) => total + Math.max(0, invoice.remainingAmount ?? 0), 0);
    const overdueReceivables = filteredInvoices.reduce((total, invoice) => {
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
      const isOverdue = invoice.status === 'OVERDUE' || (dueDate !== null && !Number.isNaN(dueDate.getTime()) && dueDate < new Date() && (invoice.remainingAmount ?? 0) > 0);
      return total + (isOverdue ? Math.max(0, invoice.remainingAmount ?? 0) : 0);
    }, 0);

    this.stockDashboard.set({
      activeProducts: filteredProducts.filter((product) => product.active).length,
      totalProducts: filteredProducts.length,
      totalStockValue: filteredStocks.reduce((total, stock) => total + (stock.totalValue ?? 0), 0),
      totalAvailableQuantity: filteredStocks.reduce((total, stock) => total + (stock.availableQuantity ?? 0), 0),
      totalReservedQuantity: filteredStocks.reduce((total, stock) => total + (stock.reservedQuantity ?? 0), 0),
      productsLowStock: stockAlerts.length,
      productsOutOfStock: lowStockEntries.filter((entry) => entry.availableQuantity <= 0).length,
      alerts: stockAlerts,
      topReceivedProducts: topStockEntries,
      topIssuedProducts: topStockEntries,
      averageStockRotation: filteredStocks.length > 0 ? filteredStocks.reduce((total, stock) => total + (stock.availableQuantity ?? 0), 0) / filteredStocks.length : 0
    });

    const ordersPending = filteredOrders.filter((order) => ['DRAFT', 'CONFIRMED', 'PREPARING'].includes(order.status)).length;
    const ordersShipped = filteredOrders.filter((order) => ['SHIPPED', 'DELIVERED'].includes(order.status)).length;
    const quotesPending = filteredQuotes.filter((quote) => ['DRAFT', 'SENT'].includes(quote.status)).length;
    const quotesAccepted = filteredQuotes.filter((quote) => quote.status === 'ACCEPTED').length;

    this.salesDashboard.set({
      caToday: this.sumInvoicesByDate(invoiceList, new Date()),
      caThisWeek: this.sumInvoicesSince(invoiceList, 7),
      caThisMonth: invoiceRevenue,
      caThisYear: this.sumInvoicesSince(invoiceList, 365),
      ordersToday: this.countOrdersByDate(orderList, new Date()),
      ordersPending,
      ordersShipped,
      ordersThisMonth: filteredOrders.length,
      quotesPending,
      quotesConversionRate: filteredQuotes.length > 0 ? Math.round((quotesAccepted / filteredQuotes.length) * 100) : 0,
      topCustomers: [],
      topProducts: topStockEntries,
      monthlyRevenue: []
    });

    this.financialDashboard.set({
      totalCash: invoiceCollected,
      totalMobileMoney: 0,
      totalCaisse: 0,
      totalReceivables: invoiceReceivables,
      overdueReceivables,
      invoicesDraft: filteredInvoices.filter((invoice) => invoice.status === 'DRAFT').length,
      invoicesPending: filteredInvoices.filter((invoice) => ['VALIDATED', 'SENT', 'PARTIALLY_PAID'].includes(invoice.status)).length,
      invoicesOverdue: filteredInvoices.filter((invoice) => invoice.status === 'OVERDUE').length,
      invoicesPaid: filteredInvoices.filter((invoice) => invoice.status === 'PAID').length,
      invoicedThisMonth: invoiceRevenue,
      collectedThisMonth: invoiceCollected,
      totalRevenue: invoiceRevenue,
      totalCharges: 0,
      netResult: invoiceCollected,
      trend: []
    });

    this.productTypeBreakdown.set(
      this.productTypes.map((type) => ({
        type,
        label: this.productTypeLabel(type),
        count: filteredProducts.filter((product) => product.type === type).length
      }))
    );
  }

  private groupStockByProduct(stocks: StockCurrent[]): Map<number, StockCurrent[]> {
    const grouped = new Map<number, StockCurrent[]>();

    for (const stock of stocks) {
      const current = grouped.get(stock.productId) ?? [];
      current.push(stock);
      grouped.set(stock.productId, current);
    }

    return grouped;
  }

  private withinFilterDate(value: string | null | undefined, filters: DashboardFilters): boolean {
    if (!value) {
      return true;
    }

    const currentDate = new Date(value);
    if (Number.isNaN(currentDate.getTime())) {
      return true;
    }

    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;

    if (startDate) {
      startDate.setHours(0, 0, 0, 0);
    }

    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    return (!startDate || currentDate >= startDate) && (!endDate || currentDate <= endDate);
  }

  private sumInvoicesByDate(invoices: Invoice[], referenceDate: Date): number {
    const dateKey = this.dateKey(referenceDate);

    return invoices.reduce((total, invoice) => {
      const invoiceDate = this.dateKey(new Date(invoice.issueDate ?? invoice.createdAt));
      return total + (invoiceDate === dateKey ? invoice.totalAmountTTC ?? 0 : 0);
    }, 0);
  }

  private sumInvoicesSince(invoices: Invoice[], days: number): number {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    fromDate.setHours(0, 0, 0, 0);

    return invoices.reduce((total, invoice) => {
      const currentDate = new Date(invoice.issueDate ?? invoice.createdAt);
      return total + (!Number.isNaN(currentDate.getTime()) && currentDate >= fromDate ? invoice.totalAmountTTC ?? 0 : 0);
    }, 0);
  }

  private countOrdersByDate(orders: Order[], referenceDate: Date): number {
    const dateKey = this.dateKey(referenceDate);

    return orders.filter((order) => this.dateKey(new Date(order.createdAt)) === dateKey).length;
  }

  private dateKey(value: Date): string {
    return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'), String(value.getDate()).padStart(2, '0')].join('-');
  }

  private defaultFilters(): DashboardFilters {
    return {
      startDate: '',
      endDate: '',
      productType: '',
      minStockThreshold: 10
    };
  }

  private normalizeFilters(rawValue: Record<string, unknown>): DashboardFilters {
    return {
      startDate: typeof rawValue['startDate'] === 'string' ? rawValue['startDate'] : '',
      endDate: typeof rawValue['endDate'] === 'string' ? rawValue['endDate'] : '',
      productType: this.isProductType(rawValue['productType']) ? rawValue['productType'] : '',
      minStockThreshold: this.toNumber(rawValue['minStockThreshold'], 10)
    };
  }

  private isProductType(value: unknown): value is ProductType {
    return value === 'STOCKABLE' || value === 'CONSUMABLE' || value === 'SERVICE';
  }

  private toNumber(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('fr-FR');
  }

  private productTypeLabel(type: ProductType): string {
    switch (type) {
      case 'STOCKABLE':
        return 'Stockable';
      case 'CONSUMABLE':
        return 'Consommable';
      case 'SERVICE':
        return 'Service';
      default:
        return type;
    }
  }
}
