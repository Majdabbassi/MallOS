import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AssistantService } from '../../../../core/services/assistant.service';
import { UIService } from '../../../../core/services/ui.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PERMISSION_DEFINITIONS } from '../../../../core/models/permission.model';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-assistant-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule
  ],
  template: `
    <div class="assistant-create">
      <div class="page-header">
        <h1>Add Assistant</h1>
        <button class="btn btn-secondary" (click)="goBack()">
          <i class="pi pi-arrow-left"></i>
          <span>Back</span>
        </button>
      </div>

      <form [formGroup]="assistantForm" (ngSubmit)="onSubmit()" class="assistant-form">
        <div class="form-section">
          <h2>Assistant Information</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="fullName">Full Name *</label>
              <input id="fullName" type="text" formControlName="fullName" class="input" placeholder="Enter full name" />
              <div class="input-error" *ngIf="assistantForm.get('fullName')?.invalid && attemptedSubmit">Full name is required</div>
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input id="email" type="email" formControlName="email" class="input" placeholder="Enter email" />
              <div class="input-error" *ngIf="assistantForm.get('email')?.invalid && attemptedSubmit">Valid email is required</div>
            </div>

            <div class="form-group">
              <label for="password">Password *</label>
              <p-password
                id="password"
                formControlName="password"
                [toggleMask]="true"
                [style]="{ width: '100%' }"
                placeholder="Enter password">
              </p-password>
              <div class="input-error" *ngIf="assistantForm.get('password')?.invalid && attemptedSubmit">Password is required (min 8 characters)</div>
            </div>

            <div class="form-group">
              <label for="phone">Phone *</label>
              <input id="phone" type="text" formControlName="phone" class="input" placeholder="Enter phone number" />
              <div class="input-error" *ngIf="assistantForm.get('phone')?.invalid && attemptedSubmit">Phone is required</div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Permissions</h2>
          <p class="form-hint">Select the permissions this assistant should have access to.</p>
          <div class="permissions-grid">
            <div class="permission-group" *ngFor="let group of permissionGroups">
              <h4>{{ group.name }}</h4>
              <div class="permission-item" *ngFor="let perm of group.permissions">
                <label class="checkbox-label">
                  <input type="checkbox" [formControlName]="perm.key" />
                  <span>{{ perm.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="goBack()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="isLoading">
            <i class="pi" [class]="isLoading ? 'pi-spinner spin' : 'pi-check'"></i>
            <span>{{ isLoading ? 'Adding...' : 'Add Assistant' }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .assistant-create {
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

    .assistant-form {
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

    .permissions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
    }

    .permission-group h4 {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .permission-item {
      margin-bottom: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--color-text-secondary);
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: var(--color-primary);
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

      .permissions-grid {
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
export class AssistantCreateComponent {
  assistantForm: FormGroup;
  isLoading = false;
  attemptedSubmit = false;
  permissionGroups: any[] = [];

  constructor(
    private fb: FormBuilder,
    private assistantService: AssistantService,
    private router: Router,
    private uiService: UIService,
    private auth: AuthService
  ) {
    this.permissionGroups = this.groupPermissions();
    this.assistantForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      phone: ['', Validators.required]
    });

    // Add permission controls
    PERMISSION_DEFINITIONS.forEach(perm => {
      this.assistantForm.addControl(perm.key, this.fb.control(false));
    });
  }

  groupPermissions(): any[] {
    const groups: any[] = [];
    const groupMap = new Map<string, any[]>();

    PERMISSION_DEFINITIONS.forEach(perm => {
      if (!groupMap.has(perm.group)) {
        groupMap.set(perm.group, []);
      }
      groupMap.get(perm.group)!.push(perm);
    });

    groupMap.forEach((permissions, groupName) => {
      groups.push({ name: groupName, permissions });
    });

    return groups;
  }

  onSubmit(): void {
    this.attemptedSubmit = true;

    if (this.assistantForm.invalid) {
      return;
    }

    this.isLoading = true;

    const user = this.auth.user;
    const formValue = this.assistantForm.value;
    
    const permissions = PERMISSION_DEFINITIONS.map(perm => ({
      key: perm.key,
      granted: formValue[perm.key] || false
    }));

    const newAssistant = {
      fullName: formValue.fullName,
      email: formValue.email,
      password: formValue.password,
      phone: formValue.phone,
      mallId: user?.mallId || '',
      permissions,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      lastActive: undefined
    };

    this.assistantService.create(newAssistant);
    this.uiService.showSuccess('Assistant added successfully');
    this.router.navigate(['/mall/assistants']);
  }

  goBack(): void {
    this.router.navigate(['/mall/assistants']);
  }
}
