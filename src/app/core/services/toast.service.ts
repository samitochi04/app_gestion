import { Injectable, signal } from '@angular/core';
import { StatusTone } from '../models/status.model';

export interface Toast {
  id: number;
  tone: Exclude<StatusTone, 'neutral'>;
  message: string;
  /** Optional title above the message. */
  title?: string;
}

/**
 * App-wide toast notifications. Kept as a lightweight signal store (not NgRx)
 * — it's transient UI state. The <app-toast-host> (Batch 2) renders `toasts()`.
 * The error interceptor pushes here on failed requests.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private seq = 0;

  success(message: string, title?: string) { this.push('success', message, title); }
  info(message: string, title?: string)    { this.push('info', message, title); }
  warning(message: string, title?: string) { this.push('warning', message, title); }
  error(message: string, title?: string)   { this.push('danger', message, title, 6000); }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(tone: Toast['tone'], message: string, title?: string, ttl = 4000): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { id, tone, message, title }]);
    if (ttl > 0) setTimeout(() => this.dismiss(id), ttl);
  }
}
