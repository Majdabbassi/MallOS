import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { UIService } from '../../../../core/services/ui.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { User, UserRole } from '../../../../core/models/user.model';
import { MallService } from '../../../../core/services/mall.service';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    DropdownModule
  ],
  template: `
    <div class="user-edit" *ngIf="user">
      <div class="page-header">
        <h1>Edit User</h1>
        <button class="btn btn-secondary" (click)="goBack()">
          <i class="pi pi-arrow-left"></i>
          <span>Back</span>
        </button>
      </div>

      <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="user-form">
        <div class="form-section">
          <h2>User Information</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="fullName">Full Name *</label>
              <input id="fullName" type="text" formControlName="fullName" class="input" />
              <div class="input-error" *ngIf="userForm.get('fullName')?.invalid && attemptedSubmit">Full name is required</div>
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input id="email" type="email" formControlName="email" class="input" [disabled]="true" />
            </div>

            <div class="form-group">
              <label for="role">Role *</label>
              <p-dropdown
                id="role"
                [options]="roleOptions"
                formControlName="role"
                (onChange)="onRoleChange()"
                placeholder="Select role">
              </p-dropdown>
              <div class="input-error" *ngIf="userForm.get('role')?.invalid && attemptedSubmit">Role is required</div>
            </div>

            <div class="form-group" *ngIf="userForm.get('role')?.value === 'MALL_USER' || userForm.get('role')?.value === 'MALL_MANAGER'">
              <label for="mallId">Assign Mall</label>
              <p-dropdown
                id="mallId"
                [options]="availableMalls"
                formControlName="mallId"
                [optionLabel]="'name'"
                [optionValue]="'id'"
                placeholder="Select mall">
              </p-dropdown>
            </div>

            <div class="form-group">
              <label for="phone">Phone</label>
              <input id="phone" type="text" formControlName="phone" class="input" />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Reset Password</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="newPassword">New Password</label>
              <p-password
                id="newPassword"
                formControlName="newPassword"
                [toggleMask]="true"
                [style]="{ width: '100%' }"
                placeholder="Enter new password (leave empty to keep current)">
              </p-password>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
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
          <button type="button" class="btn btn-secondary" (click)="goBack()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="isLoading">
            <i class="pi" [class]="isLoading ? 'pi-spinner spin' : 'pi-check'"></i>
            <span>{{ isLoading ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .user-edit {
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .user-form {
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
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid var(--color-border);
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
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
export class UserEditComponent implements OnInit {
  user: User | null = null;
  userForm: FormGroup;
  isLoading = false;
  attemptedSubmit = false;
  availableMalls: any[] = [];
  roleOptions = [
    { label: 'Super Admin', value: 'SUPER_ADMIN' },
    { label: 'Mall Manager', value: 'MALL_USER' }
  ];

  get passwordMismatch(): boolean {
    const newPassword = this.userForm.get('newPassword')?.value;
    const confirmPassword = this.userForm.get('confirmPassword')?.value;
    return newPassword && confirmPassword && newPassword !== confirmPassword;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private uiService: UIService,
    private mallService: MallService,
    private userService: UserService
  ) {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      mallId: [''],
      phone: [''],
      newPassword: [''],
      confirmPassword: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUser(id);
    }
  }

  loadUser(id: string): void {
    this.userService.getById(id).subscribe(u => {
      this.user = u || null;
      if (this.user) {
        this.userForm.patchValue({
          fullName: this.user.fullName,
          email: this.user.email,
          role: this.user.role as any,
          mallId: (this.user as any).mallId || '',
          phone: this.user.phone || ''
        });
      }
    });
  }

  onRoleChange(): void {
        if (this.userForm.get('role')?.value !== 'MALL_USER' && this.userForm.get('role')?.value !== 'MALL_MANAGER') {
      this.userForm.get('mallId')?.setValue('');
    }
  }

  onSubmit(): void {
    this.attemptedSubmit = true;

    if (this.userForm.invalid || this.passwordMismatch || !this.user) {
      return;
    }

    this.isLoading = true;

    this.uiService.showSuccess('User updated successfully');
    this.router.navigate(['/admin/users']);
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }
}
