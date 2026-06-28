import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { MallService } from '../../../../core/services/mall.service';
import { UIService } from '../../../../core/services/ui.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { SkeletonTableComponent } from '../../../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { Mall, MallStatus } from '../../../../core/models/mall.model';

@Component({
  selector: 'app-mall-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    TagModule,
    ProgressBarModule,
    StatusBadgeComponent,
    SkeletonTableComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="mall-list">
      <div class="page-header">
        <h1>Malls</h1>
        <button class="btn btn-primary" (click)="goToCreate()">
          <i class="pi pi-plus"></i>
          <span>Create Mall</span>
        </button>
      </div>

      <div class="filters">
        <p-dropdown
          [options]="statusOptions"
          [(ngModel)]="selectedStatus"
          (onChange)="filterMalls()"
          placeholder="All Statuses"
          [style]="{ width: '200px' }">
        </p-dropdown>
        <input
          type="text"
          pInputText
          [(ngModel)]="searchQuery"
          (input)="filterMalls()"
          placeholder="Search malls..."
          [style]="{ width: '300px' }">
      </div>

      <app-skeleton-table *ngIf="loading" [columns]="8" [rows]="10"></app-skeleton-table>

      <p-table
        *ngIf="!loading && filteredMalls.length > 0"
        [value]="filteredMalls"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[10, 20, 50]"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} malls"
        [styleClass]="'mall-table'">
        
        <ng-template pTemplate="header">
          <tr>
            <th>Name</th>
            <th>City</th>
            <th>Company</th>
            <th>Manager</th>
            <th>Status</th>
            <th>Stores</th>
            <th>Occupancy</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-mall>
          <tr>
            <td>
              <div class="mall-name">{{ mall.name }}</div>
            </td>
            <td>{{ mall.city }}</td>
            <td>{{ mall.companyName }}</td>
            <td>{{ getManagerName(mall.managerId) }}</td>
            <td>
              <app-status-badge [status]="mall.status" [label]="mall.status"></app-status-badge>
            </td>
            <td>{{ mall.totalStores }}</td>
            <td>
              <div class="occupancy-cell">
                <p-progressBar [value]="getOccupancyPercentage(mall)" [showValue]="false"></p-progressBar>
                <span>{{ getOccupancyPercentage(mall) }}%</span>
              </div>
            </td>
            <td>{{ formatDate(mall.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button pButton pRipple type="button" icon="pi pi-eye" class="p-button-rounded p-button-text" (click)="viewMall(mall.id)" title="View"></button>
                <button pButton pRipple type="button" icon="pi pi-pencil" class="p-button-rounded p-button-text" (click)="editMall(mall.id)" title="Edit"></button>
                <button pButton pRipple type="button" icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" (click)="deleteMall(mall)" title="Delete"></button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <app-empty-state
        *ngIf="!loading && filteredMalls.length === 0"
        icon="pi pi-building"
        title="No malls found"
        description="There are no malls matching your criteria. Create your first mall to get started."
        [actionLabel]="malls.length === 0 ? 'Create Mall' : undefined"
        (actionClick)="goToCreate()">
      </app-empty-state>
    </div>
  `,
  styles: [`
    .mall-list {
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

    .mall-name {
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .occupancy-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .occupancy-cell span {
      font-size: 12px;
      color: var(--color-text-secondary);
      min-width: 35px;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    ::ng-deep .mall-table .p-table-thead > tr > th {
      padding: 12px 16px;
    }

    ::ng-deep .mall-table .p-table-tbody > tr > td {
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

      .filters ::ng-deep .p-dropdown,
      .filters ::ng-deep .p-inputtext {
        width: 100% !important;
      }
    }
  `]
})
export class MallListComponent implements OnInit {
  loading = true;
  malls: Mall[] = [];
  filteredMalls: Mall[] = [];
  selectedStatus: MallStatus | null = null;
  searchQuery = '';
  statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Suspended', value: 'SUSPENDED' }
  ];

  constructor(
    private mallService: MallService,
    private router: Router,
    private uiService: UIService
  ) {}

  ngOnInit(): void {
    this.loadMalls();
  }

  loadMalls(): void {
    this.mallService.getAll().subscribe(malls => {
      this.malls = malls;
      this.filteredMalls = [...malls];
      setTimeout(() => {
        this.loading = false;
      }, 600);
    });
  }

  filterMalls(): void {
    this.filteredMalls = this.malls.filter(mall => {
      const matchesStatus = !this.selectedStatus || mall.status === this.selectedStatus;
      const matchesSearch = !this.searchQuery || 
        mall.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        mall.city.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        mall.companyName.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }

  getManagerName(managerId: string): string {
    return managerId ? 'Assigned' : 'Unassigned';
  }

  getOccupancyPercentage(mall: Mall): number {
    if (mall.totalStores === 0) return 0;
    return Math.round((mall.occupiedStores / mall.totalStores) * 100);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  goToCreate(): void {
    this.router.navigate(['/admin/malls/create']);
  }

  viewMall(id: string): void {
    this.router.navigate(['/admin/malls', id]);
  }

  editMall(id: string): void {
    this.router.navigate(['/admin/malls', id, 'edit']);
  }

  deleteMall(mall: Mall): void {
    if (confirm(`Delete mall "${mall.name}"? This action cannot be undone.`)) {
      this.mallService.delete(mall.id);
      this.uiService.showSuccess('Mall deleted successfully');
      this.loadMalls();
    }
  }
}
