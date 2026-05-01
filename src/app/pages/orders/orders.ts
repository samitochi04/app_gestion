import { Component, OnInit, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Customer, Product, Warehouse } from '../../models/business.model';
import {
  CreateOrderRequest,
  Order,
  OrderLine,
  OrderStatus,
  UpdateOrderRequest
} from '../../models/commercial.model';
import { AuthService } from '../../services/auth.service';
import { CustomerService } from '../../services/customer.service';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { WarehouseService } from '../../services/warehouse.service';
import { getApiErrorMessage } from '../../utils/http.util';

@Component({
  selector: 'app-orders',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class OrdersComponent implements OnInit {
  protected readonly orders = signal<Order[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly warehouses = signal<Warehouse[]>([]);
  protected readonly loading = signal(false);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly showForm = signal(false);
  protected readonly showCancelModal = signal(false);
  protected readonly editingOrder = signal<Order | null>(null);
  protected readonly selectedOrderForCancel = signal<Order | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly orderStatuses: OrderStatus[] = ['DRAFT', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  protected readonly canCreateOrder = computed(() =>
    this.authService.hasRoleOrPermission('ADMIN', ['ORDER_CREATE'])
  );
  protected readonly canEditOrder = computed(() =>
    this.authService.hasRoleOrPermission('ADMIN', ['ORDER_UPDATE'])
  );
  protected readonly canConfirmOrder = computed(() =>
    this.authService.hasRoleOrPermission('ADMIN', ['ORDER_VALIDATE'])
  );
  protected readonly canPrepareOrder = computed(() =>
    this.authService.hasRoleOrPermission('ADMIN', ['ORDER_VALIDATE'])
  );
  protected readonly canShipOrder = computed(() =>
    this.authService.hasRoleOrPermission('ADMIN', ['ORDER_VALIDATE'])
  );
  protected readonly canDeliverOrder = computed(() =>
    this.authService.hasRoleOrPermission('ADMIN', ['ORDER_DELIVER'])
  );
  protected readonly canCancelOrderAction = computed(() =>
    this.authService.hasRoleOrPermission('ADMIN', ['ORDER_CANCEL'])
  );
  protected readonly summary = computed(() => {
    const items = this.orders();
    return {
      total: this.totalElements(),
      open: items.filter((order) => ['DRAFT', 'CONFIRMED', 'PREPARING'].includes(order.status)).length,
      shipped: items.filter((order) => order.status === 'SHIPPED').length
    };
  });

  readonly filterForm: FormGroup;
  readonly orderForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    protected readonly authService: AuthService,
    private readonly orderService: OrderService,
    private readonly customerService: CustomerService,
    private readonly productService: ProductService,
    private readonly warehouseService: WarehouseService
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      customerId: ['']
    });

    this.orderForm = this.fb.group({
      customerId: ['', Validators.required],
      quoteId: [''],
      street: [''],
      city: [''],
      postalCode: [''],
      country: [''],
      notes: [''],
      lines: this.fb.array([])
    });
  }

  get lines(): FormArray {
    return this.orderForm.get('lines') as FormArray;
  }

  ngOnInit(): void {
    this.loadLookups();
    this.loadOrders();
  }

  loadLookups(): void {
    this.customerService.getCustomers({ page: 0, size: 100 }).subscribe({
      next: (response) => this.customers.set(response.content),
      error: (error) => this.errorMessage.set(getApiErrorMessage(error, 'Erreur chargement clients'))
    });

    this.productService.getProducts({ page: 0, size: 100, active: true }).subscribe({
      next: (response) => this.products.set(response.content),
      error: (error) => this.errorMessage.set(getApiErrorMessage(error, 'Erreur chargement produits'))
    });

    this.warehouseService.getWarehouses(false).subscribe({
      next: (warehouses) => this.warehouses.set(warehouses),
      error: (error) => this.errorMessage.set(getApiErrorMessage(error, 'Erreur chargement entrepôts'))
    });
  }

  loadOrders(page = this.page()): void {
    this.loading.set(true);
    this.page.set(page);

    const raw = this.filterForm.getRawValue();
    this.orderService
      .getOrders({
        page,
        size: 10,
        status: raw.status || null,
        customerId: raw.customerId ? Number(raw.customerId) : null
      })
      .subscribe({
        next: (response) => {
          this.orders.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement des commandes'));
          this.loading.set(false);
        }
      });
  }

  applyFilters(): void {
    this.loadOrders(0);
  }

  clearFilters(): void {
    this.filterForm.reset({ status: '', customerId: '' });
    this.loadOrders(0);
  }

  openCreateForm(): void {
    this.editingOrder.set(null);
    this.orderForm.reset({
      customerId: '',
      quoteId: '',
      street: '',
      city: '',
      postalCode: '',
      country: '',
      notes: ''
    });
    this.lines.clear();
    this.addLine();
    this.orderForm.get('customerId')?.enable();
    this.showForm.set(true);
    this.clearMessages();
  }

  openEditForm(order: Order): void {
    this.editingOrder.set(order);
    this.orderForm.reset({
      customerId: order.customerId,
      quoteId: order.quoteId ?? '',
      street: order.shippingStreet,
      city: order.shippingCity,
      postalCode: order.shippingPostalCode,
      country: order.shippingCountry,
      notes: order.notes
    });
    this.lines.clear();
    order.lines.forEach((line) => this.lines.push(this.createLineGroup(line)));
    this.orderForm.get('customerId')?.disable();
    this.showForm.set(true);
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingOrder.set(null);
    this.lines.clear();
    this.orderForm.get('customerId')?.enable();
  }

  addLine(): void {
    this.lines.push(this.createLineGroup());
  }

  removeLine(index: number): void {
    if (this.lines.length === 1) {
      return;
    }

    this.lines.removeAt(index);
  }

  onSubmit(): void {
    if (this.orderForm.invalid || this.lines.length === 0) {
      this.orderForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    const raw = this.orderForm.getRawValue();
    const lines = this.mapOrderLines(raw.lines);
    const request$ = this.editingOrder()
      ? this.orderService.updateOrder(this.editingOrder()!.id, {
          street: raw.street,
          city: raw.city,
          postalCode: raw.postalCode,
          country: raw.country,
          notes: raw.notes,
          lines
        } as UpdateOrderRequest)
      : this.orderService.createOrder({
          customerId: Number(raw.customerId),
          quoteId: raw.quoteId ? Number(raw.quoteId) : null,
          street: raw.street,
          city: raw.city,
          postalCode: raw.postalCode,
          country: raw.country,
          notes: raw.notes,
          lines
        } as CreateOrderRequest);

    request$.subscribe({
      next: () => {
        this.successMessage.set(this.editingOrder() ? 'Commande modifiée avec succès' : 'Commande créée avec succès');
        this.loading.set(false);
        this.cancelForm();
        this.loadOrders(this.page());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de l\'enregistrement de la commande'));
        this.loading.set(false);
      }
    });
  }

  confirmOrder(order: Order): void {
    this.runWorkflow(order.id, 'confirmOrder', `Commande ${order.reference} confirmée`);
  }

  prepareOrder(order: Order): void {
    this.runWorkflow(order.id, 'prepareOrder', `Commande ${order.reference} préparée`);
  }

  shipOrder(order: Order): void {
    this.runWorkflow(order.id, 'shipOrder', `Commande ${order.reference} expédiée`);
  }

  deliverOrder(order: Order): void {
    this.runWorkflow(order.id, 'deliverOrder', `Commande ${order.reference} livrée`);
  }

  cancelOrder(order: Order): void {
    this.selectedOrderForCancel.set(order);
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
    this.selectedOrderForCancel.set(null);
  }

  confirmCancelOrder(): void {
    const order = this.selectedOrderForCancel();
    if (!order) {
      return;
    }

    this.runWorkflow(order.id, 'cancelOrder', `Commande ${order.reference} annulée`);
    this.closeCancelModal();
  }

  getCustomerName(customerId: number): string {
    return this.customers().find((customer) => customer.id === customerId)?.name ?? `Client #${customerId}`;
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.page()) {
      return;
    }

    this.loadOrders(page);
  }

  private createLineGroup(line?: Partial<OrderLine>): FormGroup {
    return this.fb.group({
      productId: [line?.productId ?? '', Validators.required],
      quantity: [line?.quantity ?? 1, [Validators.required, Validators.min(0.01)]],
      unitSalePrice: [line?.unitSalePrice ?? 0, [Validators.required, Validators.min(0)]],
      discount: [line?.discount ?? 0, [Validators.min(0)]],
      vatRate: [line?.vatRate ?? 0, [Validators.min(0)]],
      warehouseId: [line?.warehouseId ?? '', Validators.required]
    });
  }

  private mapOrderLines(lines: Array<Record<string, unknown>>): OrderLine[] {
    return lines.map((line) => ({
      productId: Number(line['productId']),
      productName: this.products().find((product) => product.id === Number(line['productId']))?.name ?? '',
      quantity: Number(line['quantity']),
      unitSalePrice: Number(line['unitSalePrice']),
      discount: Number(line['discount'] ?? 0),
      vatRate: Number(line['vatRate'] ?? 0),
      warehouseId: Number(line['warehouseId'])
    }));
  }

  private runWorkflow(orderId: number, method: 'confirmOrder' | 'prepareOrder' | 'shipOrder' | 'deliverOrder' | 'cancelOrder', successMessage: string): void {
    this.loading.set(true);
    this.clearMessages();

    this.orderService[method](orderId).subscribe({
      next: () => {
        this.successMessage.set(successMessage);
        this.loading.set(false);
        this.loadOrders(this.page());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du changement de statut'));
        this.loading.set(false);
      }
    });
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}