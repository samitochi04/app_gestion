import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DashboardService } from '../../pages/dashboard/data/dashboard.service';

export type NotificationTone = 'success' | 'warning' | 'danger';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  tone: NotificationTone;
  read: boolean;
  createdAt: string;
}

/**
 * Real, data-driven notifications — no backend notifications endpoint exists
 * (confirmed against test-backend.md), so these are derived client-side from
 * data the backend already computes: stock alerts (rupture/bas) from the
 * stock dashboard, and overdue/pending invoices from the financial dashboard.
 * Each item is colored by severity (danger/warning/success) so the person can
 * triage at a glance. Throttled to avoid hammering the two endpoints.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly dashboardService = inject(DashboardService);

  readonly items = signal<NotificationItem[]>([]);
  readonly loading = signal(false);
  readonly unreadCount = signal(0);

  private lastRefresh = 0;
  private readonly THROTTLE_MS = 60_000;

  refresh(force = false): void {
    const now = Date.now();
    if (!force && now - this.lastRefresh < this.THROTTLE_MS) return;
    this.lastRefresh = now;
    this.loading.set(true);

    forkJoin({
      stock: this.dashboardService.stock().pipe(catchError(() => of(null))),
      financial: this.dashboardService.financial().pipe(catchError(() => of(null))),
    }).subscribe(({ stock, financial }) => {
      const list: NotificationItem[] = [];
      const now = new Date().toISOString();

      (stock?.alerts ?? []).slice(0, 15).forEach((a, i) => {
        const tone = this.stockAlertTone(a.alertType);
        list.push({
          id: `stock-${a.productId}-${i}`,
          title: tone === 'danger' ? 'Rupture de stock' : 'Stock bas',
          message: `${a.productName} — ${a.warehouseName} (qté ${a.currentQuantity ?? 0} / min ${a.minQuantity ?? 0})`,
          tone, read: false, createdAt: now,
        });
      });

      const overdue = financial?.invoicesOverdue ?? 0;
      if (overdue > 0) {
        list.push({
          id: 'invoices-overdue',
          title: 'Factures en retard',
          message: `${overdue} facture${overdue > 1 ? 's' : ''} en retard de paiement.`,
          tone: 'danger', read: false, createdAt: now,
        });
      }

      const pending = financial?.invoicesPending ?? 0;
      if (pending > 0) {
        list.push({
          id: 'invoices-pending',
          title: 'Factures en attente',
          message: `${pending} facture${pending > 1 ? 's' : ''} en attente de validation ou d’envoi.`,
          tone: 'warning', read: false, createdAt: now,
        });
      }

      if (list.length === 0) {
        list.push({
          id: 'all-clear',
          title: 'Tout va bien',
          message: 'Aucune alerte de stock ou de facturation pour le moment.',
          tone: 'success', read: true, createdAt: now,
        });
      }

      this.items.set(list);
      this.unreadCount.set(list.filter((n) => !n.read).length);
      this.loading.set(false);
    });
  }

  markAllRead(): void {
    this.items.update((list) => list.map((n) => ({ ...n, read: true })));
    this.unreadCount.set(0);
  }

  private stockAlertTone(alertType: string): NotificationTone {
    const t = (alertType || '').toUpperCase();
    if (t.includes('OUT') || t.includes('RUPTURE')) return 'danger';
    return 'warning';
  }
}
