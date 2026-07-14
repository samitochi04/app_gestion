import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TextInput } from '../../../../shared/ui/text-input/text-input';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { Button } from '../../../../shared/ui/button/button';
import { SessionActions } from '../../../../core/store/session/session.actions';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TextInput, FormField, Button],
  templateUrl: './forgot-password.html',
  styleUrl: '../login/login.css',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  submitted = signal(false);
  sent = signal(false);

  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const email = this.form.getRawValue().email!;
    this.store.dispatch(SessionActions.forgotPassword({ payload: { email } }));
    this.sent.set(true);
  }

  goToReset(): void {
    this.router.navigate(['/reset-password'], { queryParams: { email: this.form.getRawValue().email } });
  }
}
