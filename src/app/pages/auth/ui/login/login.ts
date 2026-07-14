import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { TextInput } from '../../../../shared/ui/text-input/text-input';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { Button } from '../../../../shared/ui/button/button';
import { SessionActions } from '../../../../core/store/session/session.actions';
import { selectError, selectIsLoading } from '../../../../core/store/session/session.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TextInput, FormField, Button],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  loading = toSignal(this.store.select(selectIsLoading), { initialValue: false });
  error = toSignal(this.store.select(selectError), { initialValue: null });
  submitted = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    this.store.dispatch(SessionActions.login({ credentials: { email: email!, password: password! } }));
  }
}
