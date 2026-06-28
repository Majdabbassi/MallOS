import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UIService } from '../../../core/services/ui.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-manager-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AvatarComponent,
    ButtonModule,
    InputTextModule,
    PasswordModule
  ],
  template: `
    <div class="manager-profile">
      <div class="page-header">
        <h1>My Profile</h1>
      </div>

      <div class="profile-layout">
        <div class="profile-card">
          <div class="profile-avatar">
            <app-avatar [name]="user?.fullName || ''" [size]="'large'"></app-avatar>
          </div>
          <div class="profile-info">
            <h2>{{ user?.fullName }}</h2>
            <p class="profile-role">Mall Manager</p>
            <div class="profile-meta">
              <div class="meta-item">
                <i class="pi pi-envelope"></i>
                <span>{{ user?.email }}</span>
              </div>
              <div class="meta-item" *ngIf="user?.phone">
                <i class="pi pi-phone"></i>
                <span>{{ user?.phone }}</span>
              </div>
            </div>
          </div>
        </div>

        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="profile-form">
          <div class="form-section">
            <h2>Personal Information</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="fullName">Full Name *</label>
                <input id="fullName" type="text" formControlName="fullName" class="input" />
                <div class="input-error" *ngIf="profileForm.get('fullName')?.invalid && attemptedSubmit">Full name is required</div>
              </div>

              <div class="form-group">
                <label for="email">Email</label>
                <input id="email" type="email" formControlName="email" class="input" [disabled]="true" />
              </div>

              <div class="form-group">
                <label for="phone">Phone</label>
                <input id="phone" type="text" formControlName="phone" class="input" />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h2>Change Password</h2>
            <p class="form-hint">Leave blank to keep your current password.</p>
            <div class="form-grid">
              <div class="form-group">
                <label for="currentPassword">Current Password</label>
                <p-password
                  id="currentPassword"
                  formControlName="currentPassword"
                  [toggleMask]="true"
                  [style]="{ width: '100%' }"
                  placeholder="Enter current password">
                </p-password>
              </div>

              <div class="form-group">
                <label for="newPassword">New Password</label>
                <p-password
                  id="newPassword"
                  formControlName="newPassword"
                  [toggleMask]="true"
                  [style]="{ width: '100%' }"
                  placeholder="Enter new password (min 8 characters)">
                </p-password>
              </div>

              <div class="form-group">
                <label for="confirmPassword">Confirm New Password</label>
                <p-password
                  id="confirmPassword"
                  formControlName="confirmPassword"
                  [toggleMask]="true"
                  [style]="{ width: '100%' }"
                  placeholder="Confirm new password">
                </p-password>
                <div class="input-error" *ngIf="passwordMismatch && attemptedSubmit">Passwords do not match</div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="isLoading">
              <i class="pi" [class]="isLoading ? 'pi-spinner spin' : 'pi-check'"></i>
              <span>{{ isLoading ? 'Saving...' : 'Save Changes' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .manager-profile {
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .profile-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 32px;
    }

    .profile-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 32px;
      text-align: center;
      height: fit-content;
    }

    .profile-avatar {
      margin-bottom: 20px;
    }

    .profile-info h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 4px 0;
    }

    .profile-role {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin: 0 0 20px 0;
    }

    .profile-meta {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .form-section {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .form-section h2 {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 20px 0;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--color-border);
    }

    .form-hint {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin: 0 0 20px 0;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
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
      color: var(--color-text-primary);
    }

    .form-group label::after {
      content: ' *';
      color: var(--color-danger);
    }

    .form-group label:not(:has(::after))::after {
      content: '';
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid var(--color-border);
    }

    @media (max-width: 1024px) {
      .profile-layout {
        grid-template-columns: 1fr;
      }

      .profile-card {
        text-align: center;
      }

      .profile-meta {
        align-items: center;
      }
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .form-actions .btn {
        width: 100%;
      }
    }
  `]
})
export class ManagerProfileComponent implements OnInit {
  user = this.auth.user;
  profileForm: FormGroup;
  isLoading = false;
  attemptedSubmit = false;

  get passwordMismatch(): boolean {
    const newPassword = this.profileForm.get('newPassword')?.value;
    const confirmPassword = this.profileForm.get('confirmPassword')?.value;
    return newPassword && confirmPassword && newPassword !== confirmPassword;
  }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private uiService: UIService
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(8)]],
      confirmPassword: ['']
    });
  }

  ngOnInit(): void {
    if (this.user) {
      this.profileForm.patchValue({
        fullName: this.user.fullName,
        email: this.user.email,
        phone: this.user.phone || ''
      });
    }
  }

  onSubmit(): void {
    this.attemptedSubmit = true;

    if (this.profileForm.invalid || this.passwordMismatch) {
      return;
    }

    this.isLoading = true;

    const formValue = this.profileForm.value;
    if (this.user) {
      this.auth.updateUser({
        ...this.user,
        fullName: formValue.fullName,
        phone: formValue.phone
      });
    }

    this.uiService.showSuccess('Profile updated successfully');
    this.isLoading = false;
    this.attemptedSubmit = false;
    this.profileForm.patchValue({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  }
}
