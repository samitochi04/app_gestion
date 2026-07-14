import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../core/services/dialog.service';
import { FormField } from '../form-field/form-field';
import { Select, SelectOption } from '../select/select';
import { DateInput } from '../date-input/date-input';
import { TextInput } from '../text-input/text-input';
import { Button } from '../button/button';

export interface FilterFieldConfig {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text';
  options?: SelectOption[];
  placeholder?: string;
}

export interface FilterDialogData {
  fields: FilterFieldConfig[];
  /** Currently-applied values, to pre-fill the form when reopening. */
  initial?: Record<string, string | number | null>;
}

/**
 * Generic filter pop-up: renders whatever fields the calling page passes in
 * (select/date/text), returns the collected non-empty values on "Appliquer",
 * or an empty object on "Réinitialiser". One component serves every list
 * page instead of a bespoke filter form per page.
 */
@Component({
  selector: 'app-filter-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, Select, DateInput, TextInput, Button],
  templateUrl: './filter-dialog.html',
  styleUrl: './filter-dialog.css',
})
export class FilterDialog {
  private readonly fb = inject(FormBuilder);

  data = inject(DIALOG_DATA) as FilterDialogData;
  ref = inject(DIALOG_REF) as DialogRef<Record<string, string | number | null>>;

  fields = this.data.fields;
  submitting = signal(false);

  form = this.fb.group(
    Object.fromEntries(this.fields.map((f) => [f.key, [this.data.initial?.[f.key] ?? null]])),
  );

  fieldControl(key: string) {
    return this.form.get(key);
  }

  apply(): void {
    const raw = this.form.getRawValue();
    const cleaned: Record<string, string | number | null> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v !== null && v !== undefined && v !== '') cleaned[k] = v as string | number;
    }
    this.ref.close(cleaned);
  }

  reset(): void {
    this.form.reset();
    this.ref.close({});
  }
}
