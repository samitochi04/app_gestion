import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../core/services/dialog.service';
import { Button } from '../button/button';
import { Badge } from '../badge/badge';
import { StatusTone } from '../../../core/models/status.model';

/** One label → value row inside a section. */
export interface DetailField {
  label: string;
  value: string;
  /** Optional badge tone: renders the value as a colored badge instead of text. */
  tone?: StatusTone;
}

/** A simple read-only table (used for document/movement lines). */
export interface DetailTable {
  columns: { header: string; align?: 'left' | 'right' | 'center' }[];
  rows: { text: string; align?: 'left' | 'right' | 'center' }[][];
  empty?: string;
}

/** A titled block: either key/value fields, a table, or both. */
export interface DetailSection {
  title?: string;
  fields?: DetailField[];
  table?: DetailTable;
}

export interface DetailDialogData {
  sections: DetailSection[];
}

/**
 * Generic, read-only "view details" modal. Every list across the app opens the
 * same chrome via an eye icon and feeds it a plain view model (sections of
 * label/value fields, plus optional line tables), so a detail popup never
 * needs a bespoke component per entity.
 */
@Component({
  selector: 'app-detail-dialog',
  standalone: true,
  imports: [Button, Badge],
  template: `
    <div class="detail">
      @for (section of data.sections; track $index) {
        <section class="detail__section">
          @if (section.title) { <p class="t-h3 detail__title">{{ section.title }}</p> }

          @if (section.fields?.length) {
            <dl class="detail__grid">
              @for (f of section.fields; track f.label) {
                <div class="detail__field">
                  <dt class="t-caption detail__label">{{ f.label }}</dt>
                  <dd class="detail__value">
                    @if (f.tone) { <app-badge [tone]="f.tone">{{ f.value }}</app-badge> }
                    @else { {{ f.value }} }
                  </dd>
                </div>
              }
            </dl>
          }

          @if (section.table) {
            @if (section.table.rows.length) {
              <div class="detail__table-wrap u-scroll">
                <table class="detail__table">
                  <thead>
                    <tr>
                      @for (c of section.table.columns; track c.header) {
                        <th [class]="'detail__th--' + (c.align ?? 'left')">{{ c.header }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of section.table.rows; track $index) {
                      <tr>
                        @for (cell of row; track $index) {
                          <td [class]="'detail__td--' + (cell.align ?? 'left')">{{ cell.text }}</td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <p class="t-caption detail__empty">{{ section.table.empty ?? 'Aucune ligne.' }}</p>
            }
          }
        </section>
      }

      <div class="form-actions">
        <app-button variant="secondary" (pressed)="ref.close()">Fermer</app-button>
      </div>
    </div>
  `,
  styleUrl: './detail-dialog.css',
})
export class DetailDialog {
  data = inject(DIALOG_DATA) as DetailDialogData;
  ref = inject(DIALOG_REF) as DialogRef;
}
