import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuditAction, AuditLog } from '../../models/commercial.model';
import { AuditService } from '../../services/audit.service';
import { getApiErrorMessage } from '../../utils/http.util';

@Component({
  selector: 'app-audit',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, JsonPipe],
  templateUrl: './audit.html',
  styleUrl: './audit.css'
})
export class AuditComponent implements OnInit {
  protected readonly logs = signal<AuditLog[]>([]);
  protected readonly loading = signal(false);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly errorMessage = signal('');
  protected readonly auditActions: AuditAction[] = [
    'CREATE',
    'UPDATE',
    'DELETE',
    'ACTIVATE',
    'DEACTIVATE',
    'STATUS_CHANGE',
    'LOGIN',
    'LOGOUT',
    'PASSWORD_CHANGE',
    'ROLE_ASSIGNED',
    'ROLE_REMOVED',
    'STOCK_MOVEMENT',
    'RESERVATION_CREATED',
    'RESERVATION_RELEASED',
    'ORDER_CONFIRMED',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
    'ORDER_CANCELLED',
    'INVOICE_VALIDATED',
    'INVOICE_SENT',
    'PAYMENT_RECORDED'
  ];

  readonly filterForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auditService: AuditService
  ) {
    this.filterForm = this.fb.group({
      module: [''],
      entityType: [''],
      entityId: [''],
      userId: [''],
      action: ['']
    });
  }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(page = this.page()): void {
    this.loading.set(true);
    this.page.set(page);

    const raw = this.filterForm.getRawValue();
    this.auditService
      .getLogs({
        page,
        size: 20,
        module: raw.module,
        entityType: raw.entityType,
        entityId: raw.entityId,
        userId: raw.userId,
        action: raw.action
      })
      .subscribe({
        next: (response) => {
          this.logs.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement du journal d\'audit'));
          this.loading.set(false);
        }
      });
  }

  applyFilters(): void {
    this.loadLogs(0);
  }

  clearFilters(): void {
    this.filterForm.reset({ module: '', entityType: '', entityId: '', userId: '', action: '' });
    this.loadLogs(0);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.page()) {
      return;
    }

    this.loadLogs(page);
  }
}