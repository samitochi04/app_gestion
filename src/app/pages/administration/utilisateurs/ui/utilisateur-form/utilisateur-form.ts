import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_REF, DialogRef } from '../../../../../core/services/dialog.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ApiError } from '../../../../../core/services/api.service';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../shared/ui/text-input/text-input';
import { Button } from '../../../../../shared/ui/button/button';
import { UserService } from '../../data/user.service';

/**
 * Account creation is administrative: the password entered here is provisional
 * and the holder is forced to change it at first sign-in.
 */
@Component({
  selector: 'app-utilisateur-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Button],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="row-2">
        <app-form-field label="Prénom" [required]="true"
          [error]="submitted() && form.controls.firstName.invalid ? 'Prénom requis.' : ''">
          <app-text-input formControlName="firstName" />
        </app-form-field>
        <app-form-field label="Nom" [required]="true"
          [error]="submitted() && form.controls.lastName.invalid ? 'Nom requis.' : ''">
          <app-text-input formControlName="lastName" />
        </app-form-field>
      </div>

      <app-form-field label="Adresse e-mail" [required]="true"
        [error]="submitted() && form.controls.email.invalid ? 'Adresse e-mail invalide.' : ''">
        <app-text-input type="email" formControlName="email" autocomplete="off" />
      </app-form-field>

      <app-form-field label="Mot de passe provisoire" [required]="true"
        hint="Le titulaire devra le changer à sa première connexion."
        [error]="submitted() && form.controls.temporaryPassword.invalid ? '8 caractères minimum.' : ''">
        <app-text-input type="password" formControlName="temporaryPassword" autocomplete="new-password" />
      </app-form-field>

      <div class="form-actions">
        <app-button type="submit" [loading]="saving()">Créer le compte</app-button>
      </div>
    </form>
  `,
})
export class UtilisateurForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(UserService);
  private readonly toast = inject(ToastService);

  ref = inject(DIALOG_REF) as DialogRef<boolean>;
  submitted = signal(false);
  saving = signal(false);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    temporaryPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service.create({
      firstName: v.firstName!,
      lastName: v.lastName!,
      email: v.email!,
      temporaryPassword: v.temporaryPassword!,
    }).subscribe({
      next: () => { this.toast.success('Compte créé. Communiquez le mot de passe provisoire au titulaire.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Création impossible.'); },
    });
  }
}
