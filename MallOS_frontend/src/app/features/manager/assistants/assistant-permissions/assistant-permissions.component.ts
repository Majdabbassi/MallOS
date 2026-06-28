import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AssistantService } from '../../../../core/services/assistant.service';
import { UIService } from '../../../../core/services/ui.service';
import { PERMISSION_DEFINITIONS } from '../../../../core/models/permission.model';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-assistant-permissions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule
  ],
  template: `
    <div class="assistant-permissions" *ngIf="assistant">
      <div class="page-header">
        <div class="header-left">
          <h1>Permissions</h1>
          <p class="text-secondary">Manage access for {{ assistant.fullName }}</p>
        </div>
        <button class="btn btn-secondary" (click)="goBack()">
          <i class="pi pi-arrow-left"></i>
          <span>Back</span>
        </button>
      </div>

      <form [formGroup]="permissionsForm" (ngSubmit)="onSubmit()" class="permissions-form">
        <div class="permissions-grid">
          <div class="permission-group" *ngFor="let group of permissionGroups">
            <div class="group-header">
              <h3>{{ group.name }}</h3>
              <div class="group-toggle">
                <label class="toggle-label">
                  <input type="checkbox" [checked]="isGroupAllGranted(group.permissions)" (change)="toggleGroup(group.permissions)" />
                  <span>All</span>
                </label>
              </div>
            </div>
            <div class="permission-item" *ngFor="let perm of group.permissions">
              <label class="checkbox-label">
                <input type="checkbox" [formControlName]="perm.key" />
                <span>{{ perm.label }}</span>
                <span class="permission-desc">{{ perm.description }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="isLoading">
            <i class="pi" [class]="isLoading ? 'pi-spinner spin' : 'pi-check'"></i>
            <span>{{ isLoading ? 'Saving...' : 'Save Permissions' }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .assistant-permissions {
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }

    .header-left h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 8px 0;
    }

    .permissions-form {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .permissions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
    }

    .permission-group {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 20px;
    }

    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-border);
    }

    .group-header h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-secondary);
      cursor: pointer;
    }

    .toggle-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: var(--color-primary);
    }

    .permission-item {
      margin-bottom: 12px;
    }

    .permission-item:last-child {
      margin-bottom: 0;
    }

    .checkbox-label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: var(--color-primary);
    }

    .checkbox-label > span:first-of-type {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .permission-desc {
      font-size: 12px;
      color: var(--color-text-muted);
      margin-left: 24px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid var(--color-border);
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .permissions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AssistantPermissionsComponent implements OnInit {
  assistant: any;
  permissionsForm: FormGroup;
  isLoading = false;
  permissionGroups: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private assistantService: AssistantService,
    private uiService: UIService
  ) {
    this.permissionGroups = this.groupPermissions();
    this.permissionsForm = this.fb.group({});

    PERMISSION_DEFINITIONS.forEach(perm => {
      this.permissionsForm.addControl(perm.key, this.fb.control(false));
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
        assistant.permissions.forEach((perm: any) => {
          if (this.permissionsForm.contains(perm.key)) {
            this.permissionsForm.get(perm.key)?.setValue(perm.granted);
          }
        });
      }
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

  isGroupAllGranted(permissions: any[]): boolean {
    return permissions.every(perm => this.permissionsForm.get(perm.key)?.value === true);
  }

  toggleGroup(permissions: any[]): void {
    const allGranted = this.isGroupAllGranted(permissions);
    permissions.forEach(perm => {
      this.permissionsForm.get(perm.key)?.setValue(!allGranted);
    });
  }

  onSubmit(): void {
    if (!this.assistant) {
      return;
    }

    this.isLoading = true;

    const permissions = PERMISSION_DEFINITIONS.map(perm => ({
      key: perm.key,
      granted: this.permissionsForm.get(perm.key)?.value || false
    }));

    this.assistantService.updatePermissions(this.assistant.id, permissions);
    this.assistantService.updateLastActive(this.assistant.id);
    this.uiService.showSuccess('Permissions updated successfully');
    this.router.navigate(['/mall/assistants']);
  }

  goBack(): void {
    this.router.navigate(['/mall/assistants']);
  }
}
