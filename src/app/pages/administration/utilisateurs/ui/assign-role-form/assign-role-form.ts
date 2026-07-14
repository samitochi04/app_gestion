import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../core/services/dialog.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ApiError } from '../../../../../core/services/api.service';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { Select, SelectOption } from '../../../../../shared/ui/select/select';
import { Button } from '../../../../../shared/ui/button/button';
import { AppUser } from '../../data/user.model';
import { UserService } from '../../data/user.service';
import { RoleService } from '../../../roles/data/role.service';

export interface AssignRoleFormData { user: AppUser; }

@Component({
  selector: 'app-assign-role-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, Select, Button],
  templateUrl: './assign-role-form.html',
})
export class AssignRoleForm {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly toast = inject(ToastService);

  data = inject(DIALOG_DATA) as AssignRoleFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  submitted = signal(false);
  saving = signal(false);
  roleOptions = signal<SelectOption[]>([]);

  form = this.fb.group({ roleId: [null as number | null, Validators.required] });

  constructor() {
    this.roleService.list().subscribe((roles) => {
      this.roleOptions.set(roles.map((r) => ({ value: r.id, label: r.name })));
    });
  }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.saving.set(true);
    this.userService.assignRole(this.data.user.id, this.form.getRawValue().roleId!).subscribe({
      next: () => { this.toast.success('Rôle assigné.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Échec de l’assignation.'); },
    });
  }
}
