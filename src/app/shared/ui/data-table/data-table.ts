import { Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { EmptyState } from '../empty-state/empty-state';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Optional custom cell rendering; defaults to String(row[key]). */
  cell?: (row: T) => string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  /** Exclude this column from the searchTerm filter (e.g. a raw ID/foreign key). */
  excludeFromSearch?: boolean;
}

/**
 * A domain verb offered per row, beyond view/edit/delete — validating an
 * avoir, deactivating a user, flagging a warehouse. `visible` lets a row hide
 * an action that its current state forbids, which is what keeps the table from
 * offering transitions the backend would refuse.
 */
export interface DataTableAction<T> {
  icon: string;
  label: string;
  run: (row: T) => void;
  visible?: (row: T) => boolean;
  danger?: boolean;
}

/**
 * Generic list table used across every entity (produits, clients, factures…).
 * Row-level actions (voir/modifier/supprimer) are emitted as events so the
 * parent page decides what to do — typically opening a DialogService modal.
 *
 * `searchTerm`, when set, filters `rows` client-side across every column's
 * *rendered* value (post-`cell()`, so it matches exactly what's on screen) —
 * this is independent of whatever the backend's own search support is, so it
 * always works regardless of API query-param support.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [Icon, EmptyState, LoadingSkeleton],
  template: `
    @if (loading()) {
      <app-loading-skeleton [count]="5" [rowHeight]="40" />
    } @else if (filteredRows().length === 0) {
      <app-empty-state icon="inbox"
        [title]="rows().length === 0 ? emptyTitle() : 'Aucun résultat'"
        [message]="rows().length === 0 ? emptyMessage() : 'Aucune ligne ne correspond à votre recherche.'" />
    } @else {
      <div class="table-wrap u-scroll">
        <table class="table">
          <thead>
            <tr>
              @for (col of columns(); track col.key) {
                <th [style.width]="col.width" [class]="'table__th--' + (col.align ?? 'left')">
                  {{ col.header }}
                </th>
              }
              @if (showActions()) { <th class="table__th--right">Actions</th> }
            </tr>
          </thead>
          <tbody>
            @for (row of filteredRows(); track trackByFn(row)) {
              <tr class="table__row" (click)="rowClick.emit(row)">
                @for (col of columns(); track col.key) {
                  <td [class]="'table__td--' + (col.align ?? 'left')">
                    {{ col.cell ? col.cell(row) : (asRecord(row)[col.key] ?? '—') }}
                  </td>
                }
                @if (showActions()) {
                  <td class="table__td--right table__actions" (click)="$event.stopPropagation()">
                    @for (action of actions(); track action.label) {
                      @if (!action.visible || action.visible(row)) {
                        <button class="table__action" [class.table__action--danger]="action.danger"
                                (click)="action.run(row)" [attr.aria-label]="action.label" [title]="action.label">
                          <app-icon [name]="action.icon" [size]="16" />
                        </button>
                      }
                    }
                    @if (canView()) {
                      <button class="table__action" (click)="view.emit(row)" aria-label="Voir">
                        <app-icon name="eye" [size]="16" />
                      </button>
                    }
                    @if (canEdit()) {
                      <button class="table__action" (click)="edit.emit(row)" aria-label="Modifier">
                        <app-icon name="pencil" [size]="16" />
                      </button>
                    }
                    @if (canDelete()) {
                      <button class="table__action table__action--danger" (click)="delete.emit(row)" aria-label="Supprimer">
                        <app-icon name="trash" [size]="16" />
                      </button>
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styleUrl: './data-table.css',
})
export class DataTable<T> {
  columns = input.required<DataTableColumn<T>[]>();
  rows = input.required<T[]>();
  loading = input<boolean>(false);
  emptyTitle = input<string>('Aucune donnée');
  emptyMessage = input<string>('Il n’y a rien à afficher pour le moment.');
  /** Free-text search applied across every non-excluded column's rendered value. */
  searchTerm = input<string>('');

  canView = input<boolean>(true);
  canEdit = input<boolean>(true);
  canDelete = input<boolean>(true);
  showActions = input<boolean>(true);
  /** Extra per-row verbs, rendered before view/edit/delete. */
  actions = input<DataTableAction<T>[]>([]);

  rowClick = output<T>();
  view = output<T>();
  edit = output<T>();
  delete = output<T>();

  filteredRows = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.rows();
    const cols = this.columns().filter((c) => !c.excludeFromSearch);
    return this.rows().filter((row) =>
      cols.some((col) => {
        const value = col.cell ? col.cell(row) : this.asRecord(row)[col.key];
        return String(value ?? '').toLowerCase().includes(term);
      }),
    );
  });

  asRecord(row: T): Record<string, unknown> { return row as unknown as Record<string, unknown>; }
  trackByFn(row: T): unknown { return (row as { id?: unknown }).id ?? row; }
}
