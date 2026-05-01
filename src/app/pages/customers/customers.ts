import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CreateCustomerRequest,
  Customer,
  CustomerFilters,
  CustomerType,
  UpdateCustomerRequest
} from '../../models/business.model';
import { CustomerService } from '../../services/customer.service';
import { getApiErrorMessage } from '../../utils/http.util';

@Component({
  selector: 'app-customers',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './customers.html',
  styleUrl: './customers.css'
})
export class CustomersComponent implements OnInit {
  protected readonly customers = signal<Customer[]>([]);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly loading = signal(false);
  protected readonly showForm = signal(false);
  protected readonly editingCustomer = signal<Customer | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly customerTypes: CustomerType[] = ['INDIVIDUAL', 'COMPANY'];

  readonly filterForm: FormGroup;
  readonly customerForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly customerService: CustomerService
  ) {
    this.filterForm = this.fb.group({
      query: [''],
      active: ['all']
    });

    this.customerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      phone: [''],
      type: ['COMPANY', [Validators.required]],
      street: [''],
      city: [''],
      postalCode: [''],
      country: [''],
      taxId: ['']
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(page = this.page()): void {
    this.loading.set(true);
    this.page.set(page);

    const filters = this.buildFilters(page);
    this.customerService.getCustomers(filters).subscribe({
      next: (response) => {
        this.customers.set(response.content);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement des clients'));
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.loadCustomers(0);
  }

  clearFilters(): void {
    this.filterForm.reset({ query: '', active: 'all' });
    this.loadCustomers(0);
  }

  openCreateForm(): void {
    this.editingCustomer.set(null);
    this.customerForm.reset({
      name: '',
      email: '',
      phone: '',
      type: 'COMPANY',
      street: '',
      city: '',
      postalCode: '',
      country: '',
      taxId: ''
    });
    this.showForm.set(true);
    this.clearMessages();
  }

  openEditForm(customer: Customer): void {
    this.editingCustomer.set(customer);
    this.customerForm.reset({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      type: customer.type,
      street: customer.street,
      city: customer.city,
      postalCode: customer.postalCode,
      country: customer.country,
      taxId: customer.taxId
    });
    this.showForm.set(true);
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingCustomer.set(null);
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    const raw = this.customerForm.getRawValue();
    const request$ = this.editingCustomer()
      ? this.customerService.updateCustomer(this.editingCustomer()!.id, {
          name: raw.name,
          email: raw.email,
          phone: raw.phone,
          street: raw.street,
          city: raw.city,
          postalCode: raw.postalCode,
          country: raw.country,
          taxId: raw.taxId
        } as UpdateCustomerRequest)
      : this.customerService.createCustomer({
          name: raw.name,
          email: raw.email,
          phone: raw.phone,
          type: raw.type,
          street: raw.street,
          city: raw.city,
          postalCode: raw.postalCode,
          country: raw.country,
          taxId: raw.taxId
        } as CreateCustomerRequest);

    request$.subscribe({
      next: () => {
        this.successMessage.set(
          this.editingCustomer() ? 'Client modifié avec succès' : 'Client créé avec succès'
        );
        this.cancelForm();
        this.loadCustomers(this.page());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de l\'enregistrement du client'));
        this.loading.set(false);
      }
    });
  }

  deleteCustomer(customer: Customer): void {
    if (!confirm(`Supprimer le client "${customer.name}" ?`)) {
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    this.customerService.deleteCustomer(customer.id).subscribe({
      next: () => {
        this.successMessage.set('Client supprimé avec succès');
        this.loadCustomers(this.page());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de la suppression du client'));
        this.loading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.page()) {
      return;
    }

    this.loadCustomers(page);
  }

  private buildFilters(page: number): CustomerFilters {
    const raw = this.filterForm.getRawValue();

    return {
      page,
      size: 10,
      query: raw.query,
      active: raw.active === 'all' ? null : raw.active === 'true'
    };
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
