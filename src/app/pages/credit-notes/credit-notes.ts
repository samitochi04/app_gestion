import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/business.model';
import { BillingLine, CreateCreditNoteRequest, CreditNote, CreditNoteType } from '../../models/commercial.model';
import { AuthService } from '../../services/auth.service';
import { CreditNoteService } from '../../services/credit-note.service';
import { ProductService } from '../../services/product.service';
import { getApiErrorMessage } from '../../utils/http.util';

@Component({
  selector: 'app-credit-notes',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './credit-notes.html',
  styleUrl: './credit-notes.css'
})
export class CreditNotesComponent implements OnInit {
  protected readonly creditNotes = signal<CreditNote[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(false);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly showForm = signal(false);
  protected readonly showSendModal = signal(false);
  protected readonly selectedCreditNote = signal<CreditNote | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly creditNoteTypes: CreditNoteType[] = ['PARTIAL', 'FULL'];
  protected readonly canCreateCreditNote = signal(true);
  protected readonly canSendCreditNoteAction = signal(true);

  readonly filterForm: FormGroup;
  readonly creditNoteForm: FormGroup;
  readonly sendForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    protected readonly authService: AuthService,
    private readonly creditNoteService: CreditNoteService,
    private readonly productService: ProductService
  ) {
    this.filterForm = this.fb.group({
      invoiceId: ['']
    });

    this.creditNoteForm = this.fb.group({
      invoiceId: ['', Validators.required],
      type: ['PARTIAL', Validators.required],
      reason: ['', Validators.required],
      lines: this.fb.array([])
    });

    this.sendForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.canCreateCreditNote.set(this.authService.hasRoleOrPermission('ADMIN', ['INVOICE_CANCEL', 'INVOICE_UPDATE']));
    this.canSendCreditNoteAction.set(this.authService.hasRoleOrPermission('ADMIN', ['INVOICE_SEND', 'INVOICE_UPDATE']));
  }

  get lines(): FormArray {
    return this.creditNoteForm.get('lines') as FormArray;
  }

  ngOnInit(): void {
    this.productService.getProducts({ page: 0, size: 100, active: true }).subscribe({
      next: (response) => this.products.set(response.content),
      error: (error) => this.errorMessage.set(getApiErrorMessage(error, 'Erreur chargement produits'))
    });
    this.loadCreditNotes();
  }

  loadCreditNotes(page = this.page()): void {
    this.loading.set(true);
    this.page.set(page);

    const raw = this.filterForm.getRawValue();
    this.creditNoteService
      .getCreditNotes({ page, size: 10, invoiceId: raw.invoiceId ? Number(raw.invoiceId) : null })
      .subscribe({
        next: (response) => {
          this.creditNotes.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement des avoirs'));
          this.loading.set(false);
        }
      });
  }

  applyFilters(): void {
    this.loadCreditNotes(0);
  }

  clearFilters(): void {
    this.filterForm.reset({ invoiceId: '' });
    this.loadCreditNotes(0);
  }

  openCreateForm(): void {
    this.creditNoteForm.reset({ invoiceId: '', type: 'PARTIAL', reason: '' });
    this.lines.clear();
    this.addLine();
    this.showForm.set(true);
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.lines.clear();
  }

  addLine(): void {
    this.lines.push(
      this.fb.group({
        productId: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(0.01)]],
        unitPrice: [0, [Validators.required, Validators.min(0)]],
        discount: [0, [Validators.min(0)]],
        vatRate: [0, [Validators.min(0)]]
      })
    );
  }

  removeLine(index: number): void {
    if (this.lines.length === 1) {
      return;
    }

    this.lines.removeAt(index);
  }

  onSubmit(): void {
    if (this.creditNoteForm.invalid || this.lines.length === 0) {
      this.creditNoteForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    const raw = this.creditNoteForm.getRawValue();
    const lines = (raw.lines as Array<Record<string, unknown>>).map((line) => {
      const productId = Number(line['productId']);
      const product = this.products().find((item) => item.id === productId);

      return {
        productId,
        productName: product?.name ?? '',
        productSku: product?.sku,
        quantity: Number(line['quantity']),
        unitPrice: Number(line['unitPrice']),
        discount: Number(line['discount'] ?? 0),
        vatRate: Number(line['vatRate'] ?? 0)
      } as BillingLine;
    });

    this.creditNoteService
      .createCreditNote({
        invoiceId: Number(raw.invoiceId),
        type: raw.type,
        reason: raw.reason,
        lines
      } as CreateCreditNoteRequest)
      .subscribe({
        next: () => {
          this.successMessage.set('Avoir créé avec succès');
          this.loading.set(false);
          this.cancelForm();
          this.loadCreditNotes(this.page());
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de la création de l\'avoir'));
          this.loading.set(false);
        }
      });
  }

  sendCreditNote(note: CreditNote): void {
    this.selectedCreditNote.set(note);
    this.sendForm.reset({ email: '' });
    this.showSendModal.set(true);
  }

  closeSendModal(): void {
    this.showSendModal.set(false);
    this.selectedCreditNote.set(null);
    this.sendForm.reset({ email: '' });
  }

  submitSendCreditNote(): void {
    if (this.sendForm.invalid || !this.selectedCreditNote()) {
      this.sendForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();
    const note = this.selectedCreditNote()!;

    this.creditNoteService.sendCreditNote(note.id, this.sendForm.get('email')?.value).subscribe({
      next: () => {
        this.successMessage.set(`Avoir ${note.reference} envoyé`);
        this.loading.set(false);
        this.closeSendModal();
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de l\'envoi de l\'avoir'));
        this.loading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.page()) {
      return;
    }

    this.loadCreditNotes(page);
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}