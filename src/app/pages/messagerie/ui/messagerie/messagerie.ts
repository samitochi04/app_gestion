import { Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../shared/ui/card/card';
import { Button } from '../../../../shared/ui/button/button';
import { Icon } from '../../../../shared/ui/icon/icon';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { DialogService } from '../../../../core/services/dialog.service';
import { ToastService } from '../../../../core/services/toast.service';
import { selectUser } from '../../../../core/store/session/session.selectors';
import { formatDateTime } from '../../../../core/utils/format';
import { Conversation, Correspondent, Message } from '../../data/messaging.model';
import { MessagingService } from '../../data/messaging.service';
import { NouvelleConversation } from '../nouvelle-conversation/nouvelle-conversation';

@Component({
  selector: 'app-messagerie',
  standalone: true,
  imports: [FormsModule, PageHeader, Card, Button, Icon, EmptyState],
  templateUrl: './messagerie.html',
  styleUrl: './messagerie.css',
})
export class Messagerie implements OnInit, OnDestroy {
  private readonly service = inject(MessagingService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  private readonly currentUser = toSignal(this.store.select(selectUser), { initialValue: null });
  currentUserId = computed(() => (this.currentUser() as { id?: string } | null)?.id ?? '');

  conversations = signal<Conversation[]>([]);
  loadingList = signal(true);
  active = signal<Conversation | null>(null);
  messages = signal<Message[]>([]);
  loadingThread = signal(false);
  draft = signal('');

  /** Group management panel */
  showMembers = signal(false);
  correspondents = signal<Correspondent[]>([]);
  memberSearch = signal('');
  filteredCorrespondents = computed(() => {
    const term = this.memberSearch().trim().toLowerCase();
    const activeConv = this.active();
    const participantIds = new Set((activeConv?.participants ?? []).map((p) => p.userId));
    // Only show correspondents who are NOT already participants
    const available = this.correspondents().filter((c) => !participantIds.has(c.id));
    if (!term) return available;
    return available.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(term));
  });

  private source?: EventSource;
  private poll?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.loadConversations();
    this.connectStream();
    this.poll = setInterval(() => { if (this.active()) this.loadMessages(this.active()!.id, true); }, 15000);
    this.destroyRef.onDestroy(() => this.teardown());
    // Load correspondents for member management
    this.service.correspondents().subscribe({
      next: (list) => this.correspondents.set(list),
      error: () => {},
    });
  }

  ngOnDestroy(): void { this.teardown(); }

  private teardown(): void {
    this.source?.close();
    if (this.poll) clearInterval(this.poll);
  }

  loadConversations(): void {
    this.loadingList.set(true);
    this.service.conversations().subscribe({
      next: (list) => {
        this.conversations.set([...list].sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? '')));
        this.loadingList.set(false);
      },
      error: () => this.loadingList.set(false),
    });
  }

  title(c: Conversation): string {
    if (c.subject) return c.subject;
    if (c.displayName) return c.displayName;
    return c.type === 'DIRECT' ? 'Conversation' : c.type === 'SUPPORT' ? 'Support' : 'Groupe';
  }

  typeLabel(c: Conversation): string {
    return c.type === 'DIRECT' ? 'Direct' : c.type === 'SUPPORT' ? 'Support' : 'Groupe';
  }

  select(c: Conversation): void {
    this.active.set(c);
    this.showMembers.set(false);
    this.loadMessages(c.id);
    // Reload conversation details to get participants
    this.service.conversation(c.id).subscribe({
      next: (full) => this.active.set(full),
      error: () => {},
    });
    this.service.markRead(c.id).subscribe({
      next: () => this.conversations.update((list) => list.map((x) => (x.id === c.id ? { ...x, unreadCount: 0 } : x))),
      error: () => {},
    });
  }

  private loadMessages(id: number, silent = false): void {
    if (!silent) { this.loadingThread.set(true); this.messages.set([]); }
    this.service.messages(id).subscribe({
      next: (list) => {
        const ordered = [...list].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
        this.messages.set(ordered);
        this.loadingThread.set(false);
        queueMicrotask(() => this.scrollToBottom());
      },
      error: () => this.loadingThread.set(false),
    });
  }

  send(): void {
    const c = this.active();
    const body = this.draft().trim();
    if (!c || !body) return;
    this.draft.set('');
    this.service.send(c.id, { body }).subscribe({
      next: (msg) => {
        this.messages.update((list) => [...list, msg]);
        queueMicrotask(() => this.scrollToBottom());
        this.loadConversations();
      },
      error: () => { this.draft.set(body); this.toast.error('Envoi impossible.'); },
    });
  }

  newConversation(): void {
    const ref = this.dialog.open<unknown, Conversation | undefined>(NouvelleConversation, { title: 'Nouvelle conversation', size: 'md' });
    ref.closed$.subscribe((c) => {
      if (!c) return;
      this.loadConversations();
      this.select(c);
    });
  }

  toggleMembers(): void {
    this.showMembers.update((v) => !v);
    this.memberSearch.set('');
  }

  /** Add a correspondent to the active group. */
  addMember(userId: string): void {
    const conv = this.active();
    if (!conv) return;
    this.service.addParticipant(conv.id, userId).subscribe({
      next: () => {
        this.toast.success('Membre ajouté.');
        // Reload conversation to get updated participants
        this.service.conversation(conv.id).subscribe({
          next: (full) => this.active.set(full),
          error: () => {},
        });
      },
      error: (e) => this.toast.error('Impossible d\'ajouter le membre.'),
    });
  }

  /** Remove a participant from the active group. */
  removeMember(userId: string): void {
    const conv = this.active();
    if (!conv) return;
    this.service.removeParticipant(conv.id, userId).subscribe({
      next: () => {
        this.toast.success('Membre retiré.');
        this.service.conversation(conv.id).subscribe({
          next: (full) => this.active.set(full),
          error: () => {},
        });
      },
      error: () => this.toast.error('Impossible de retirer le membre.'),
    });
  }

  isMine(m: Message): boolean { return m.senderId === this.currentUserId(); }
  when(iso: string): string { return formatDateTime(iso); }

  isGroup(): boolean { return this.active()?.type === 'GROUP'; }

  activeParticipants(): { userId: string; name?: string; role?: string; leftAt?: string }[] {
    return (this.active()?.participants ?? []).filter((p) => !p.leftAt);
  }

  private scrollToBottom(): void {
    const el = document.querySelector('.msg__thread');
    if (el) el.scrollTop = el.scrollHeight;
  }

  // ---- SSE ----
  private connectStream(): void {
    if (!this.service.hasToken()) return;
    this.service.streamTicket().subscribe({
      next: (t) => {
        try {
          this.source = this.service.openStream(t.ticket);
          const onChange = () => {
            this.loadConversations();
            if (this.active()) this.loadMessages(this.active()!.id, true);
          };
          this.source.addEventListener('MESSAGE_POSTED', onChange);
          this.source.addEventListener('MESSAGE_CHANGED', onChange);
          this.source.addEventListener('CONVERSATION_CHANGED', onChange);
          this.source.onerror = () => { this.source?.close(); this.source = undefined; };
        } catch { /* SSE unavailable; the poll covers it */ }
      },
      error: () => {},
    });
  }
}
