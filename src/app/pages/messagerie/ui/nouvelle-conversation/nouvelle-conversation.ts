import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DIALOG_REF, DialogRef } from '../../../../core/services/dialog.service';
import { ApiError } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../shared/ui/text-input/text-input';
import { Button } from '../../../../shared/ui/button/button';
import { SegmentedTabs, TabOption } from '../../../../shared/ui/segmented-tabs/segmented-tabs';
import { Correspondent, Conversation } from '../../data/messaging.model';
import { MessagingService } from '../../data/messaging.service';

const TABS: TabOption[] = [
  { value: 'direct', label: 'Message direct' },
  { value: 'group', label: 'Groupe' },
  { value: 'support', label: 'Support' },
];

@Component({
  selector: 'app-nouvelle-conversation',
  standalone: true,
  imports: [FormsModule, FormField, TextInput, Button, SegmentedTabs],
  templateUrl: './nouvelle-conversation.html',
  styleUrl: './nouvelle-conversation.css',
})
export class NouvelleConversation {
  private readonly service = inject(MessagingService);
  private readonly toast = inject(ToastService);

  ref = inject(DIALOG_REF) as DialogRef<Conversation | undefined>;

  tabs = TABS;
  mode = signal('direct');
  saving = signal(false);

  correspondents = signal<Correspondent[]>([]);
  search = signal('');
  selected = signal<Set<string>>(new Set());
  subject = signal('');

  filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const list = this.correspondents();
    if (!term) return list;
    return list.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(term));
  });

  constructor() {
    this.service.correspondents().subscribe({
      next: (list) => this.correspondents.set(list),
      error: () => this.toast.error('Impossible de charger les correspondants.'),
    });
  }

  isSelected(id: string): boolean { return this.selected().has(id); }

  setMode(mode: string): void {
    this.mode.set(mode);
    this.selected.set(new Set());
  }

  toggle(id: string): void {
    const next = new Set(this.selected());
    if (this.mode() === 'direct') { next.clear(); next.add(id); }
    else { next.has(id) ? next.delete(id) : next.add(id); }
    this.selected.set(next);
  }

  create(): void {
    const ids = [...this.selected()];
    this.saving.set(true);
    const done = (c: Conversation) => { this.saving.set(false); this.ref.close(c); };
    const fail = (e: unknown) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Création impossible.'); };

    if (this.mode() === 'direct') {
      if (!ids.length) { this.saving.set(false); return; }
      this.service.createDirect({ participantId: ids[0] }).subscribe({ next: done, error: fail });
    } else if (this.mode() === 'group') {
      if (!this.subject().trim() || ids.length === 0) { this.saving.set(false); return; }
      this.service.createGroup({ subject: this.subject().trim(), participantIds: ids }).subscribe({ next: done, error: fail });
    } else {
      if (!this.subject().trim()) { this.saving.set(false); return; }
      this.service.createSupport({ subject: this.subject().trim() }).subscribe({ next: done, error: fail });
    }
  }
}
