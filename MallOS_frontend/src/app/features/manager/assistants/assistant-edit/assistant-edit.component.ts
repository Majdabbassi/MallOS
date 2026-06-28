import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AssistantService } from '../../../../core/services/assistant.service';
import { UIService } from '../../../../core/services/ui.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-assistant-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule
  ],
  template: `
    <div class="assistant-edit" *ngIf="assistant">
      <div class="page-header">
        <h1>Edit Assistant</h1>
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
              <input id="fullName" type="text" formControlName="fullName" class="input" />
              <div class="input-error" *ngIf="assistantForm.get('fullName')?.invalid && attemptedSubmit">Full name is required</div>
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input id="email" type="email" formControlName="email" class="input" [disabled]="true" />
            </div>

            <div class="form-group">
              <label for="phone">Phone *</label>
              <input id="phone" type="text" formControlName="phone" class="input" />
              <div class="input-error" *ngIf="assistantForm.get('phone')?.invalid && attemptedSubmit">Phone is required</div>
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
    .assistant-edit {
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
export class AssistantEditComponent implements OnInit {
  assistant: any;
  assistantForm: FormGroup;
  isLoading = false;
  attemptedSubmit = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private assistantService: AssistantService,
    private uiService: UIService
  ) {
    this.assistantForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAssistant(id);
    }
  }

  loadAssistant(id: string): void {
    this.assistantService.getById(id).subscribe(assistant => {
      this.assistant = assistant;
      if (assistant) {
        this.assistantForm.patchValue({
          fullName: assistant.fullName,
          email: assistant.email,
          phone: assistant.phone
        });
      }
    });
  }

  onSubmit(): void {
    this.attemptedSubmit = true;

    if (this.assistantForm.invalid || !this.assistant) {
      return;
    }

    this.isLoading = true;

    this.assistantService.update(this.assistant.id, this.assistantForm.value);
    this.uiService.showSuccess('Assistant updated successfully');
    this.router.navigate(['/mall/assistants']);
  }

  goBack(): void {
    this.router.navigate(['/mall/assistants']);
  }
}
