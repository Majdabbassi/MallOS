import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UIService } from '../../../core/services/ui.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container" [class.shake]="hasError">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">
            <div class="logo-icon">
              <i class="pi pi-building"></i>
            </div>
            <h1 class="logo-text">Mall OS</h1>
          </div>
          <h2 class="login-title">Welcome back</h2>
          <p class="login-subtitle">Sign in to your workspace</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="input"
              placeholder="Enter your email"
              [class.ng-invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
            />
            <div class="input-error" *ngIf="loginForm.get('email')?.invalid && attemptedSubmit">
              Please enter a valid email address
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-input">
              <input
                id="password"
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                class="input"
                placeholder="Enter your password"
                [class.ng-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              />
              <button type="button" class="password-toggle" (click)="togglePassword()">
                <i class="pi" [class]="showPassword ? 'pi-eye-slash' : 'pi-eye'"></i>
              </button>
            </div>
            <div class="input-error" *ngIf="loginForm.get('password')?.invalid && attemptedSubmit">
              Password is required
            </div>
          </div>

          <div class="form-error" *ngIf="errorMessage">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <button type="submit" class="btn btn-primary login-btn" [disabled]="isLoading">
            <i class="pi" [class]="isLoading ? 'pi-spinner spin' : 'pi-sign-in'"></i>
            <span>{{ isLoading ? 'Signing in...' : 'Sign in' }}</span>
          </button>
        </form>

        <div class="login-footer">
          <p class="demo-hint">
            <i class="pi pi-info-circle"></i>
            Demo: admin&#64;mallas.com / Admin&#64;123
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0A0F1E;
      padding: 24px;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background: rgba(17, 24, 39, 0.95);
      border: 1px solid #1F2D45;
      border-radius: 16px;
      padding: 48px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .login-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4F8EF7, #7C3AED);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: 700;
      font-family: 'Space Grotesk', sans-serif;
    }

    .logo-text {
      font-size: 28px;
      font-weight: 700;
      font-family: 'Space Grotesk', sans-serif;
      color: #fff;
      margin: 0;
    }

    .login-title {
      font-size: 24px;
      font-weight: 600;
      color: #fff;
      margin: 0 0 8px 0;
    }

    .login-subtitle {
      font-size: 14px;
      color: #9CA3AF;
      margin: 0;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 500;
      color: #E5E7EB;
    }

    .form-group label::after {
      content: ' *';
      color: #EF4444;
    }

    .input {
      height: 44px;
      background: #0A0F1E;
      border: 1px solid #1F2D45;
      border-radius: 8px;
      padding: 0 16px;
      color: #fff;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .input:focus {
      outline: none;
      border-color: #4F8EF7;
      box-shadow: 0 0 0 3px rgba(79, 142, 247, 0.15);
    }

    .input::placeholder {
      color: #6B7280;
    }

    .password-input {
      position: relative;
    }

    .password-input .input {
      padding-right: 48px;
    }

    .password-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: #6B7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .password-toggle:hover {
      color: #E5E7EB;
      background: rgba(255, 255, 255, 0.05);
    }

    .form-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      color: #EF4444;
      font-size: 14px;
    }

    .login-btn {
      width: 100%;
      height: 44px;
      background: #4F8EF7;
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 8px;
    }

    .login-btn:hover {
      background: #3D7BE5;
    }

    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .login-footer {
      margin-top: 24px;
      text-align: center;
    }

    .demo-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      color: #6B7280;
      margin: 0;
    }

    .demo-hint i {
      color: #4F8EF7;
    }

    .shake {
      animation: shake 0.3s ease-in-out;
    }

    @keyframes shake {
      0%, 100% {
        transform: translateX(0);
      }
      25% {
        transform: translateX(-8px);
      }
      75% {
        transform: translateX(8px);
      }
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 32px 24px;
      }

      .login-title {
        font-size: 20px;
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  attemptedSubmit = false;
  hasError = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private uiService: UIService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.attemptedSubmit = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;

    const { email, password } = this.loginForm.value;

    // Simulate network delay
    setTimeout(() => {
      const success = this.auth.login(email, password);

      if (success) {
        this.uiService.showSuccess('Welcome back!');
        const user = this.auth.user;
        if (user?.role === 'SUPER_ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (user?.role === 'MALL_MANAGER') {
          this.router.navigate(['/mall/dashboard']);
        }
      } else {
        this.hasError = true;
        this.errorMessage = 'Invalid email or password';
        this.uiService.showError('Invalid credentials');
        
        setTimeout(() => {
          this.hasError = false;
        }, 300);
      }

      this.isLoading = false;
    }, 500);
  }
}
