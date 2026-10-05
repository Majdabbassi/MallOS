import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StoreService } from '../../../../core/services/store.service';
import { UIService } from '../../../../core/services/ui.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CreateStoreRequest } from '../../../../core/models/store.model';

@Component({
  selector: 'app-store-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule
  ],
  template: `
    <div class="store-create">
      <div class="page-header">
        <h1>Add Store</h1>
        <button class="btn btn-secondary" (click)="goBack()">
          <i class="pi pi-arrow-left"></i>
          <span>Back</span>
        </button>
      </div>

      <form [formGroup]="storeForm" (ngSubmit)="onSubmit()" class="store-form">
        <div class="form-sections">
          <div class="form-section">
            <h2>Store Information</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="code">Store Code *</label>
                <input id="code" type="text" formControlName="code" class="input" placeholder="e.g., STR-001" />
                <div class="input-error" *ngIf="storeForm.get('code')?.invalid && attemptedSubmit">Store code is required</div>
              </div>

              <div class="form-group">
                <label for="name">Store Name *</label>
                <input id="name" type="text" formControlName="name" class="input" placeholder="Enter store name" />
                <div class="input-error" *ngIf="storeForm.get('name')?.invalid && attemptedSubmit">Store name is required</div>
              </div>

              <div class="form-group">
                <label for="category">Category *</label>
                <p-dropdown
                  id="category"
                  [options]="categoryOptions"
                  formControlName="category"
                  placeholder="Select category">
                </p-dropdown>
                <div class="input-error" *ngIf="storeForm.get('category')?.invalid && attemptedSubmit">Category is required</div>
              </div>

              <div class="form-group">
                <label for="status">Status *</label>
                <p-dropdown
                  id="status"
                  [options]="statusOptions"
                  formControlName="status"
                  placeholder="Select status">
                </p-dropdown>
                <div class="input-error" *ngIf="storeForm.get('status')?.invalid && attemptedSubmit">Status is required</div>
              </div>

              <div class="form-group">
                <label for="floor">Floor *</label>
                <p-inputNumber id="floor" formControlName="floor" [min]="1" [style]="{ width: '100%' }" placeholder="Enter floor number"></p-inputNumber>
                <div class="input-error" *ngIf="storeForm.get('floor')?.invalid && attemptedSubmit">Floor is required</div>
              </div>

              <div class="form-group">
                <label for="zone">Zone *</label>
                <input id="zone" type="text" formControlName="zone" class="input" placeholder="e.g., A, B, C" />
                <div class="input-error" *ngIf="storeForm.get('zone')?.invalid && attemptedSubmit">Zone is required</div>
              </div>

              <div class="form-group">
                <label for="surface">Surface Area (m²) *</label>
                <p-inputNumber id="surface" formControlName="surface" [min]="1" [style]="{ width: '100%' }" placeholder="Enter surface area"></p-inputNumber>
                <div class="input-error" *ngIf="storeForm.get('surface')?.invalid && attemptedSubmit">Surface area is required</div>
              </div>

              <div class="form-group">
                <label for="monthlyRent">Monthly Rent (TND) *</label>
                <p-inputNumber id="monthlyRent" formControlName="monthlyRent" [min]="0" [style]="{ width: '100%' }" placeholder="Enter monthly rent"></p-inputNumber>
                <div class="input-error" *ngIf="storeForm.get('monthlyRent')?.invalid && attemptedSubmit">Monthly rent is required</div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h2>Owner Information</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="ownerName">Owner Name</label>
                <input id="ownerName" type="text" formControlName="ownerName" class="input" placeholder="Enter owner name" />
              </div>

              <div class="form-group">
                <label for="ownerPhone">Owner Phone</label>
                <input id="ownerPhone" type="text" formControlName="ownerPhone" class="input" placeholder="Enter owner phone" />
              </div>

              <div class="form-group">
                <label for="ownerEmail">Owner Email</label>
                <input id="ownerEmail" type="email" formControlName="ownerEmail" class="input" placeholder="Enter owner email" />
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="goBack()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="isLoading">
            <i class="pi" [class]="isLoading ? 'pi-spinner spin' : 'pi-check'"></i>
            <span>{{ isLoading ? 'Adding...' : 'Add Store' }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .store-create {
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

    .store-form {
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
export class StoreCreateComponent {
  storeForm: FormGroup;
  isLoading = false;
  attemptedSubmit = false;
  categoryOptions = [
    { label: 'Fashion', value: 'FASHION' },
    { label: 'Electronics', value: 'ELECTRONICS' },
    { label: 'Food & Beverage', value: 'FOOD_BEVERAGE' },
    { label: 'Entertainment', value: 'ENTERTAINMENT' },
    { label: 'Services', value: 'SERVICES' },
    { label: 'Health & Beauty', value: 'HEALTH_BEAUTY' },
    { label: 'Other', value: 'OTHER' }
  ];
  statusOptions = [
    { label: 'Open', value: 'OPEN' },
    { label: 'Closed', value: 'CLOSED' },
    { label: 'Under Renovation', value: 'UNDER_RENOVATION' },
    { label: 'Vacant', value: 'VACANT' }
  ];

  constructor(
    private fb: FormBuilder,
    private storeService: StoreService,
    private router: Router,
    private uiService: UIService
  ) {
    this.storeForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      category: ['', Validators.required],
      status: ['VACANT', Validators.required],
      floor: ['', [Validators.required, Validators.min(1)]],
      zone: ['', Validators.required],
      surface: ['', [Validators.required, Validators.min(1)]],
      monthlyRent: ['', [Validators.required, Validators.min(0)]],
      ownerName: [''],
      ownerPhone: [''],
      ownerEmail: ['', Validators.email]
    });
  }

  onSubmit(): void {
    this.attemptedSubmit = true;

    if (this.storeForm.invalid) {
      return;
    }

    this.isLoading = true;

    const formValue = this.storeForm.value;
    const newStore: CreateStoreRequest = {
      ...formValue
    };

    this.storeService.create(newStore).subscribe({
      next: () => {
        this.uiService.showSuccess('Store added successfully');
        this.router.navigate(['/mall/stores']);
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/mall/stores']);
  }
}
