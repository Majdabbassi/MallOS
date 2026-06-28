import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MallService } from '../../../../core/services/mall.service';
import { UIService } from '../../../../core/services/ui.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MallStatus } from '../../../../core/models/mall.model';

@Component({
  selector: 'app-mall-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule
  ],
  template: `
    <div class="mall-create">
      <div class="page-header">
        <h1>Create Mall</h1>
        <button class="btn btn-secondary" (click)="goBack()">
          <i class="pi pi-arrow-left"></i>
          <span>Back</span>
        </button>
      </div>

      <form [formGroup]="mallForm" (ngSubmit)="onSubmit()" class="mall-form">
        <div class="form-sections">
          <div class="form-section">
            <h2>Mall Information</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="name">Mall Name *</label>
                <input id="name" type="text" formControlName="name" class="input" placeholder="Enter mall name" />
                <div class="input-error" *ngIf="mallForm.get('name')?.invalid && attemptedSubmit">Mall name is required</div>
              </div>

              <div class="form-group">
                <label for="companyName">Company Name *</label>
                <input id="companyName" type="text" formControlName="companyName" class="input" placeholder="Enter company name" />
                <div class="input-error" *ngIf="mallForm.get('companyName')?.invalid && attemptedSubmit">Company name is required</div>
              </div>

              <div class="form-group">
                <label for="address">Address *</label>
                <input id="address" type="text" formControlName="address" class="input" placeholder="Enter address" />
                <div class="input-error" *ngIf="mallForm.get('address')?.invalid && attemptedSubmit">Address is required</div>
              </div>

              <div class="form-group">
                <label for="city">City *</label>
                <input id="city" type="text" formControlName="city" class="input" placeholder="Enter city" />
                <div class="input-error" *ngIf="mallForm.get('city')?.invalid && attemptedSubmit">City is required</div>
              </div>

              <div class="form-group">
                <label for="country">Country *</label>
                <input id="country" type="text" formControlName="country" class="input" placeholder="Enter country" />
                <div class="input-error" *ngIf="mallForm.get('country')?.invalid && attemptedSubmit">Country is required</div>
              </div>

              <div class="form-group">
                <label for="phone">Phone *</label>
                <input id="phone" type="text" formControlName="phone" class="input" placeholder="Enter phone number" />
                <div class="input-error" *ngIf="mallForm.get('phone')?.invalid && attemptedSubmit">Phone is required</div>
              </div>

              <div class="form-group">
                <label for="email">Email *</label>
                <input id="email" type="email" formControlName="email" class="input" placeholder="Enter email" />
                <div class="input-error" *ngIf="mallForm.get('email')?.invalid && attemptedSubmit">Valid email is required</div>
              </div>

              <div class="form-group">
                <label for="website">Website</label>
                <input id="website" type="text" formControlName="website" class="input" placeholder="Enter website URL" />
              </div>

              <div class="form-group">
                <label for="totalArea">Total Area (m²) *</label>
                <input id="totalArea" type="number" formControlName="totalArea" class="input" placeholder="Enter total area" />
                <div class="input-error" *ngIf="mallForm.get('totalArea')?.invalid && attemptedSubmit">Total area is required</div>
              </div>

              <div class="form-group">
                <label for="floorCount">Floor Count *</label>
                <input id="floorCount" type="number" formControlName="floorCount" class="input" placeholder="Enter floor count" />
                <div class="input-error" *ngIf="mallForm.get('floorCount')?.invalid && attemptedSubmit">Floor count is required</div>
              </div>

              <div class="form-group">
                <label for="openedYear">Opened Year *</label>
                <input id="openedYear" type="number" formControlName="openedYear" class="input" placeholder="Enter opened year" />
                <div class="input-error" *ngIf="mallForm.get('openedYear')?.invalid && attemptedSubmit">Opened year is required</div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h2>Configuration</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="status">Status *</label>
                <p-dropdown
                  id="status"
                  [options]="statusOptions"
                  formControlName="status"
                  placeholder="Select status">
                </p-dropdown>
                <div class="input-error" *ngIf="mallForm.get('status')?.invalid && attemptedSubmit">Status is required</div>
              </div>

              <div class="form-group">
                <label for="managerId">Assign Manager</label>
                <p-dropdown
                  id="managerId"
                  [options]="availableManagers"
                  formControlName="managerId"
                  [optionLabel]="'fullName'"
                  [optionValue]="'id'"
                  placeholder="Select manager">
                </p-dropdown>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="goBack()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="isLoading">
            <i class="pi" [class]="isLoading ? 'pi-spinner spin' : 'pi-check'"></i>
            <span>{{ isLoading ? 'Creating...' : 'Create Mall' }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .mall-create {
      max-width: var(--content-max-width);
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

    .mall-form {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .form-sections {
      display: grid;
      grid-template-columns: 1fr 1fr;
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

    @media (max-width: 1024px) {
      .form-sections {
        grid-template-columns: 1fr;
      }
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
export class MallCreateComponent {
  mallForm: FormGroup;
  isLoading = false;
  attemptedSubmit = false;
  availableManagers: any[] = [];
  statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Suspended', value: 'SUSPENDED' }
  ];

  constructor(
    private fb: FormBuilder,
    private mallService: MallService,
    private router: Router,
    private uiService: UIService,
    private auth: AuthService
  ) {
    this.mallForm = this.fb.group({
      name: ['', Validators.required],
      companyName: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      website: [''],
      totalArea: ['', [Validators.required, Validators.min(1)]],
      floorCount: ['', [Validators.required, Validators.min(1)]],
      openedYear: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 5)]],
      status: ['PENDING', Validators.required],
      managerId: ['']
    });

    this.loadAvailableManagers();
  }

  loadAvailableManagers(): void {
    this.mallService.getManagersWithoutMall().subscribe(managers => {
      this.availableManagers = managers;
    });
  }

  onSubmit(): void {
    this.attemptedSubmit = true;

    if (this.mallForm.invalid) {
      return;
    }

    this.isLoading = true;

    const formValue = this.mallForm.value;
    const newMall = {
      ...formValue,
      totalStores: 0,
      occupiedStores: 0,
      totalAssistants: 0,
      visitorsToday: 0,
      salesToday: 0
    };

    this.mallService.create(newMall);
    this.uiService.showSuccess('Mall created successfully');
    this.router.navigate(['/admin/malls']);
  }

  goBack(): void {
    this.router.navigate(['/admin/malls']);
  }
}
