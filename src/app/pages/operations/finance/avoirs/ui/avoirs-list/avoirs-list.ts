import { Component, OnInit, inject, signal } from '@angular/core';
import { PageHeader } from '../../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../../shared/ui/card/card';
import { Button } from '../../../../../../shared/ui/button/button';
import { SearchInput } from '../../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableAction, DataTableColumn } from '../../../../../../shared/ui/data-table/data-table';
import { DialogService } from '../../../../../../core/services/dialog.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { ApiError } from '../../../../../../core/services/api.service';
import { documentStatusMeta } from '../../../../../../core/models/status.model';
import { formatMoney } from '../../../../../../core/utils/format';
import { ConfirmDialog, ConfirmDialogData } from '../../../../../../shared/ui/confirm-dialog/confirm-dialog';
import { PromptDialog, PromptDialogData } from '../../../../../../shared/ui/prompt-dialog/prompt-dialog';
import { CREDIT_NOTE_KINDS, CreditNote } from '../../data/credit-note.model';
import { CreditNoteService } from '../../data/credit-note.service';
import { AvoirForm } from '../avoir-form/avoir-form';

/**
 * Credit notes are created then validated in two steps — validation is what
 * moves stock back in for a `RETURN` and posts the accounting entry, so it is
 * never implicit.
 */
@Component({
  selector: 'app-avoirs-list',
  standalone: true,
  imports: [PageHeader, Card, Button, SearchInput, DataTable],
  templateUrl: './avoirs-list.html',
})
export class AvoirsList implements OnInit {
  private readonly service = inject(CreditNoteService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  creditNotes = signal<CreditNote[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  columns: DataTableColumn<CreditNote>[] = [
    { key: 'reference', header: 'Référence', width: '150px' },
    { key: 'type', header: 'Portée', cell: (r) => (r.type === 'FULL' ? 'Total' : 'Partiel') },
    { key: 'kind', header: 'Nature', cell: (r) => this.kindLabel(r.kind) },
    { key: 'reason', header: 'Motif' },
    { key: 'status', header: 'Statut', cell: (r) => documentStatusMeta(r.status).label },
    { key: 'totalAmount', header: 'Montant', align: 'right', cell: (r) => formatMoney(r.totalAmount) },
  ];

  actions: DataTableAction<CreditNote>[] = [
    {
      icon: 'check-circle',
      label: 'Valider',
      visible: (r) => r.status === 'DRAFT',
      run: (r) => this.validate(r),
    },
    {
      icon: 'link',
      label: 'Envoyer par courriel',
      visible: (r) => r.status !== 'DRAFT',
      run: (r) => this.send(r),
    },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.list({ page: 0, size: 100 }).subscribe({
      next: (res) => { this.creditNotes.set(res.content); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    const ref = this.dialog.open(AvoirForm, { title: 'Nouvel avoir', size: 'lg' });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }

  private validate(note: CreditNote): void {
    const isReturn = note.kind === 'RETURN';
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmDialog, {
      title: `Valider l’avoir ${note.reference} ?`,
      data: {
        message: isReturn
          ? 'La marchandise sera réintégrée en stock et le coût des ventes contre-passé. Cette opération est définitive.'
          : 'L’écriture comptable sera générée. Cette opération est définitive.',
        confirmLabel: 'Valider',
      },
    });
    ref.closed$.subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.validate(note.id).subscribe({
        next: () => { this.toast.success('Avoir validé.'); this.load(); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Validation impossible.'),
      });
    });
  }

  private send(note: CreditNote): void {
    const ref = this.dialog.open<PromptDialogData, string>(PromptDialog, {
      title: `Envoyer l’avoir ${note.reference}`,
      data: { label: 'Adresse du destinataire', type: 'email', placeholder: 'client@exemple.com', confirmLabel: 'Envoyer' },
    });
    ref.closed$.subscribe((email) => {
      if (!email) return;
      this.service.send(note.id, email).subscribe({
        next: () => { this.toast.success(`Avoir envoyé à ${email}.`); this.load(); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Envoi impossible.'),
      });
    });
  }

  private kindLabel(kind: string): string {
    return CREDIT_NOTE_KINDS.find((k) => k.value === kind)?.label ?? kind ?? '—';
  }
}
