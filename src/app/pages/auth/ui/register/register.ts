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
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TextInput, FormField, Button],
  templateUrl: './register.html',
  styleUrl: '../login/login.css',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  loading = toSignal(this.store.select(selectIsLoading), { initialValue: false });
  error = toSignal(this.store.select(selectError), { initialValue: null });
  submitted = signal(false);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const { firstName, lastName, email, password } = this.form.getRawValue();
    this.store.dispatch(SessionActions.register({
      payload: { firstName: firstName!, lastName: lastName!, email: email!, password: password! },
    }));
  }
}
