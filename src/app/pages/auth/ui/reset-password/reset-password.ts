import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TextInput } from '../../../../shared/ui/text-input/text-input';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { Button } from '../../../../shared/ui/button/button';
import { SessionActions } from '../../../../core/store/session/session.actions';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TextInput, FormField, Button],
  templateUrl: './reset-password.html',
  styleUrl: '../login/login.css',
})
export class ResetPassword {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  submitted = signal(false);

  form = this.fb.group({
    email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]],
    code: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const { email, code, newPassword } = this.form.getRawValue();
    this.store.dispatch(SessionActions.resetPassword({
      payload: { email: email!, code: code!, newPassword: newPassword! },
    }));
  }
}
