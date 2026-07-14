import { InjectionToken, Injectable, Type, signal } from '@angular/core';
import { Subject } from 'rxjs';

/** Injected into dialog content components to read their input data. */
export const DIALOG_DATA = new InjectionToken<unknown>('DIALOG_DATA');
/** Injected into dialog content components to close themselves with a result. */
export const DIALOG_REF = new InjectionToken<DialogRef>('DIALOG_REF');

export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogConfig<D = unknown> {
  data?: D;
  /** Modal width preset — maps to max-width tokens in the outlet (Batch 2). */
  size?: DialogSize;
  title?: string;
  /** Allow closing by backdrop click / Escape. Default true. */
  dismissable?: boolean;
}

/** Handle returned from DialogService.open(); resolves when the dialog closes. */
export class DialogRef<R = unknown> {
  private readonly _closed = new Subject<R | undefined>();
  /** Emits once with the dialog result, then completes. */
  readonly closed$ = this._closed.asObservable();

  constructor(readonly id: number) {}

  close(result?: R): void {
    this._closed.next(result);
    this._closed.complete();
  }
}

export interface OpenDialog {
  id: number;
  component: Type<unknown>;
  config: DialogConfig;
  ref: DialogRef;
}

/**
 * Global modal controller. Any feature calls `open(FormComponent, { data })`
 * to render a CRUD form/confirm inside the shared modal chrome. The rendering
 * host <app-modal-outlet> (Batch 2) subscribes to `dialogs()` and instantiates
 * each component, providing DIALOG_DATA + DIALOG_REF.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly dialogs = signal<OpenDialog[]>([]);
  private seq = 0;

  open<D = unknown, R = unknown>(
    component: Type<unknown>,
    config: DialogConfig<D> = {},
  ): DialogRef<R> {
    const id = ++this.seq;
    const ref = new DialogRef<R>(id);
    const entry: OpenDialog = {
      id,
      component,
      config: { size: 'md', dismissable: true, ...config },
      ref: ref as DialogRef,
    };
    this.dialogs.update((list) => [...list, entry]);
    // Remove from the open list once the consumer closes it.
    ref.closed$.subscribe({ complete: () => this.remove(id) });
    return ref;
  }

  /** Close the top-most dialog (used by Escape / backdrop in the outlet). */
  closeTop(): void {
    const list = this.dialogs();
    list[list.length - 1]?.ref.close();
  }

  private remove(id: number): void {
    this.dialogs.update((list) => list.filter((d) => d.id !== id));
  }
}
