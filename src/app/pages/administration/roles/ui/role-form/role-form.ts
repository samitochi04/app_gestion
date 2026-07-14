import { Component, inject, signal } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../core/services/dialog.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ApiError } from '../../../../../core/services/api.service';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../shared/ui/text-input/text-input';
import { Button } from '../../../../../shared/ui/button/button';
import { Role } from '../../data/role.model';
import { RoleService } from '../../data/role.service';

export interface RoleFormData { role?: Role; }

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Button, KeyValuePipe],
  templateUrl: './role-form.html',
  styleUrl: './role-form.css',
})
export class RoleForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(RoleService);
  private readonly toast = inject(ToastService);

  data = inject(DIALOG_DATA) as RoleFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  isEdit = !!this.data?.role;
  submitted = signal(false);
  saving = signal(false);

  permissionGroups = signal<Map<string, { id: number; name: string; description: string }[]>>(new Map());
  selected = signal<Set<string>>(new Set(this.data?.role?.permissions ?? []));

  form = this.fb.group({
    name: [this.data?.role?.name ?? '', Validators.required],
    description: [this.data?.role?.description ?? ''],
  });

  constructor() {
    this.service.permissionsCatalog().subscribe((list) => {
      const groups = new Map<string, { id: number; name: string; description: string }[]>();
      for (const p of list) {
        const arr = groups.get(p.module) ?? [];
        arr.push({ id: p.id, name: p.name, description: p.description });
        groups.set(p.module, arr);
      }
      this.permissionGroups.set(groups);
    });
  }

  toggle(name: string): void {
    this.selected.update((set) => {
      const next = new Set(set);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  isChecked(name: string): boolean { return this.selected().has(name); }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = { name: v.name!, description: v.description ?? '', permissions: Array.from(this.selected()) };
    this.saving.set(true);
    const req$ = this.isEdit ? this.service.update(this.data.role!.id, payload) : this.service.create(payload);
    req$.subscribe({
      next: () => { this.toast.success(this.isEdit ? 'Rôle modifié.' : 'Rôle créé.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Échec de l’enregistrement.'); },
    });
  }
}
