import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../shared/ui/card/card';
import { Badge } from '../../../../shared/ui/badge/badge';
import { TextInput } from '../../../../shared/ui/text-input/text-input';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { Button } from '../../../../shared/ui/button/button';
import { selectUser } from '../../../../core/store/session/session.selectors';
import { SessionActions } from '../../../../core/store/session/session.actions';
import { AuthService } from '../../../../core/store/session/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ApiError } from '../../../../core/services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeader, Card, Badge, TextInput, FormField, Button],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  user = toSignal(this.store.select(selectUser), { initialValue: null });
  submitted = signal(false);
  saving = signal(false);

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  changePassword(): void {
    this.submitted.set(true);
    if (this.passwordForm.invalid) return;
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.saving.set(true);
    this.authService.changePassword({ currentPassword: currentPassword!, newPassword: newPassword! }).subscribe({
      next: () => {
        this.saving.set(false);
        this.submitted.set(false);
        this.passwordForm.reset();
        this.toast.success('Mot de passe modifié avec succès.');
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.error(e instanceof ApiError ? e.message : 'Échec de la modification.');
      },
    });
  }

  logout(): void {
    this.store.dispatch(SessionActions.logout());
  }
}
