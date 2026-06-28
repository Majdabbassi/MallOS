import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { AssistantService } from '../../../../core/services/assistant.service';
import { UIService } from '../../../../core/services/ui.service';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { SkeletonTableComponent } from '../../../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PERMISSION_DEFINITIONS as PERMISSION_DEFS } from '../../../../core/models/permission.model';

@Component({
  selector: 'app-assistant-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    ToggleButtonModule,
    AvatarComponent,
    SkeletonTableComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="assistant-list">
      <div class="page-header">
        <h1>Assistants</h1>
        <button class="btn btn-primary" (click)="goToCreate()">
          <i class="pi pi-plus"></i>
          <span>Add Assistant</span>
        </button>
      </div>

      <div class="filters">
        <input
          type="text"
          pInputText
          [(ngModel)]="searchQuery"
          (input)="filterAssistants()"
          placeholder="Search assistants..."
          [style]="{ width: '300px' }">
      </div>

      <app-skeleton-table *ngIf="loading" [columns]="5" [rows]="10"></app-skeleton-table>

      <p-table
        *ngIf="!loading && filteredAssistants.length > 0"
        [value]="filteredAssistants"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[10, 20, 50]"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} assistants"
        [styleClass]="'assistant-table'">
        
        <ng-template pTemplate="header">
          <tr>
            <th>Assistant</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Permissions</th>
            <th>Last Active</th>
            <th>Actions</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-assistant>
          <tr>
            <td>
              <div class="user-cell">
                <app-avatar [name]="assistant.fullName" [size]="'small'"></app-avatar>
                <span class="user-name">{{ assistant.fullName }}</span>
              </div>
            </td>
            <td>{{ assistant.email }}</td>
            <td>{{ assistant.phone }}</td>
            <td>
              <span class="permissions-count">{{ getGrantedCount(assistant) }} / {{ permissionDefsLength }}</span>
            </td>
            <td>{{ assistant.lastActive ? formatDate(assistant.lastActive) : 'Never' }}</td>
            <td>
              <div class="action-buttons">
                <button pButton pRipple type="button" icon="pi pi-cog" class="p-button-rounded p-button-text" (click)="editPermissions(assistant)" title="Permissions"></button>
                <button pButton pRipple type="button" icon="pi pi-pencil" class="p-button-rounded p-button-text" (click)="editAssistant(assistant)" title="Edit"></button>
                <button pButton pRipple type="button" icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" (click)="deleteAssistant(assistant)" title="Delete"></button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <app-empty-state
        *ngIf="!loading && filteredAssistants.length === 0"
        icon="pi pi-users"
        title="No assistants found"
        description="There are no assistants matching your criteria. Add your first assistant to get started."
        [actionLabel]="assistants.length === 0 ? 'Add Assistant' : undefined"
        (actionClick)="goToCreate()">
      </app-empty-state>
    </div>
  `,
  styles: [`
    .assistant-list {
      max-width: var(--content-max-width);
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-name {
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .permissions-count {
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    ::ng-deep .assistant-table .p-table-thead > tr > th {
      padding: 12px 16px;
    }

    ::ng-deep .assistant-table .p-table-tbody > tr > td {
      padding: 12px 16px;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .filters {
        flex-direction: column;
      }

      .filters ::ng-deep .p-inputtext {
        width: 100% !important;
      }
    }
  `]
})
export class AssistantListComponent implements OnInit {
  loading = true;
  assistants: any[] = [];
  filteredAssistants: any[] = [];
  searchQuery = '';
  readonly permissionDefsLength = PERMISSION_DEFS.length;

  constructor(
    private assistantService: AssistantService,
    private router: Router,
    private uiService: UIService
  ) {}

  ngOnInit(): void {
    this.loadAssistants();
  }

  loadAssistants(): void {
    this.assistantService.getAll().subscribe(assistants => {
      this.assistants = assistants;
      this.filteredAssistants = [...assistants];
      setTimeout(() => {
        this.loading = false;
      }, 600);
    });
  }

  filterAssistants(): void {
    this.filteredAssistants = this.assistants.filter(assistant => {
      const matchesSearch = !this.searchQuery || 
        assistant.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        assistant.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesSearch;
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getGrantedCount(assistant: any): number {
    return assistant.permissions.filter((p: any) => p.granted).length;
  }

  goToCreate(): void {
    this.router.navigate(['/mall/assistants/create']);
  }

  editPermissions(assistant: any): void {
    this.router.navigate(['/mall/assistants', assistant.id, 'permissions']);
  }

  editAssistant(assistant: any): void {
    this.router.navigate(['/mall/assistants', assistant.id, 'edit']);
  }

  deleteAssistant(assistant: any): void {
    if (confirm(`Delete assistant "${assistant.fullName}"? This action cannot be undone.`)) {
      this.assistantService.delete(assistant.id);
      this.uiService.showSuccess('Assistant deleted successfully');
      this.loadAssistants();
    }
  }
}
