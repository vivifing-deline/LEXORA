import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IconComponent,
    ModalComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isSubmitting = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);
  readonly isForgotModalOpen = signal<boolean>(false);
  readonly resetEmail = signal<string>('');

  readonly loginForm = this.fb.group({
    email: ['admin@lexora.demo', [Validators.required, Validators.email]],
    password: ['Demo@123', [Validators.required]]
  });

  readonly demoAccounts = [
    { role: 'Firm Admin', email: 'admin@lexora.demo', name: 'Barrister Zafar Iqbal', desc: 'Full workspace administration' },
    { role: 'Senior Advocate', email: 'senior@lexora.demo', name: 'Aitzaz Hussain', desc: 'Supervision & Senior Litigation' },
    { role: 'Associate', email: 'associate@lexora.demo', name: 'Mahnoor Rehman', desc: 'Case work & Commercial drafting' },
    { role: 'Junior Advocate', email: 'junior@lexora.demo', name: 'Hamza Tariq', desc: 'Legal research & pleadings' },
    { role: 'Clerk', email: 'clerk@lexora.demo', name: 'Muhammad Rashid', desc: 'Cause lists & registry filing' },
    { role: 'Accountant', email: 'accountant@lexora.demo', name: 'Fatima Bilal', desc: 'Billing, Invoices & Payments' },
    { role: 'Client', email: 'client@lexora.demo', name: 'Kamran Siddiqui', desc: 'Restricted personal client portal' }
  ];

  selectDemoAccount(email: string): void {
    this.loginForm.patchValue({
      email,
      password: 'Demo@123'
    });
    this.onSubmit();
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  openForgotPassword(): void {
    this.resetEmail.set(this.loginForm.value.email || '');
    this.isForgotModalOpen.set(true);
  }

  closeForgotPassword(): void {
    this.isForgotModalOpen.set(false);
  }

  handlePasswordReset(): void {
    if (!this.resetEmail()) {
      this.toastService.warning('Please enter your email address');
      return;
    }
    this.toastService.success(
      `Password reset instructions for ${this.resetEmail()} have been recorded. In demo mode, use Demo@123.`
    );
    this.closeForgotPassword();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const { email, password } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toastService.success(`Welcome back, ${res.data.user.fullName}!`);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Invalid email or password';
        this.toastService.error(msg, 'Authentication Failed');
      }
    });
  }
}

