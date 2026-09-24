import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { StoreService } from '../../../../core/services/store.service';
import { UIService } from '../../../../core/services/ui.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { SkeletonTableComponent } from '../../../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { Store, StoreStatus, StoreCategory } from '../../../../core/models/store.model';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    ProgressBarModule,
    StatusBadgeComponent,
    SkeletonTableComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="store-list">
      <div class="page-header">
        <h1>Stores</h1>
        <button class="btn btn-primary" (click)="goToCreate()">
          <i class="pi pi-plus"></i>
          <span>Add Store</span>
        </button>
      </div>

      <div class="occupancy-bar-section" *ngIf="!loading">
        <div class="occupancy-info">
          <span class="occupancy-text">{{ occupiedCount }} / {{ totalCount }} stores occupied</span>
          <span class="occupancy-pct">{{ occupancyPct }}% occupancy</span>
        </div>
        <div class="occupancy-track">
          <div class="occupancy-fill" [style.width]="occupancyPct + '%'"></div>
        </div>
      </div>

      <div class="filters">
        <p-dropdown
          [options]="categoryOptions"
          [(ngModel)]="selectedCategory"
          (onChange)="filterStores()"
          placeholder="All Categories"
          [style]="{ width: '200px' }">
        </p-dropdown>
        <p-dropdown
          [options]="statusOptions"
          [(ngModel)]="selectedStatus"
          (onChange)="filterStores()"
          placeholder="All Statuses"
          [style]="{ width: '200px' }">
        </p-dropdown>
        <input
          type="text"
          pInputText
          [(ngModel)]="searchQuery"
          (input)="filterStores()"
          placeholder="Search stores..."
          [style]="{ width: '300px' }">
      </div>

      <app-skeleton-table *ngIf="loading" [columns]="9" [rows]="10"></app-skeleton-table>

      <p-table
        *ngIf="!loading && filteredStores.length > 0"
        [value]="filteredStores"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[10, 20, 50]"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} stores"
        [styleClass]="'store-table'">
        
        <ng-template pTemplate="header">
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Category</th>
            <th>Floor</th>
            <th>Zone</th>
            <th>Surface</th>
            <th>Status</th>
            <th>Owner</th>
            <th>Rent</th>
            <th>Actions</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-store>
          <tr>
            <td><span class="code-badge">{{ store.code }}</span></td>
            <td>{{ store.name }}</td>
            <td>{{ store.category }}</td>
            <td>{{ store.floor }}</td>
            <td>{{ store.zone }}</td>
            <td>{{ store.surface }} m²</td>
            <td><app-status-badge [status]="store.status" [label]="store.status"></app-status-badge></td>
            <td>{{ store.ownerName || '-' }}</td>
            <td>{{ store.monthlyRent.toLocaleString() }} TND</td>
            <td>
              <div class="action-buttons">
                <button pButton pRipple type="button" icon="pi pi-eye" class="p-button-rounded p-button-text" (click)="viewStore(store.id)" title="View"></button>
                <button pButton pRipple type="button" icon="pi pi-pencil" class="p-button-rounded p-button-text" (click)="editStore(store.id)" title="Edit"></button>
                <button pButton pRipple type="button" icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" (click)="deleteStore(store)" title="Delete"></button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <app-empty-state
        *ngIf="!loading && filteredStores.length === 0"
        icon="pi pi-shop"
        title="No stores found"
        description="There are no stores matching your criteria. Add your first store to get started."
        [actionLabel]="stores.length === 0 ? 'Add Store' : undefined"
        (actionClick)="goToCreate()">
      </app-empty-state>
    </div>
  `,
  styles: [`
    .store-list {
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

    .occupancy-bar-section {
      margin-bottom: 24px;
      padding: 16px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }

    .occupancy-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .occupancy-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .occupancy-pct {
      font-size: 14px;
      font-weight: 600;
      color: #10B981;
    }

    .occupancy-track {
      height: 6px;
      background: #1C2333;
      border-radius: 3px;
      overflow: hidden;
    }

    .occupancy-fill {
      height: 100%;
      background: #10B981;
      border-radius: 3px;
      transition: width 0.6s ease;
    }

    .code-badge {
      font-family: var(--font-mono);
      font-size: 12px;
      padding: 2px 8px;
      background: var(--color-bg-elevated);
      border-radius: var(--radius-sm);
      color: var(--color-text-primary);
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    ::ng-deep .store-table .p-table-thead > tr > th {
      padding: 12px 16px;
    }

    ::ng-deep .store-table .p-table-tbody > tr > td {
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
export class StoreListComponent implements OnInit {
  loading = true;
  stores: Store[] = [];
  filteredStores: Store[] = [];
  selectedCategory: StoreCategory | null = null;
  selectedStatus: StoreStatus | null = null;
  searchQuery = '';
  occupiedCount = 0;
  totalCount = 0;
  occupancyPct = 0;
  categoryOptions = [
    { label: 'All Categories', value: null },
    { label: 'Fashion', value: 'FASHION' },
    { label: 'Electronics', value: 'ELECTRONICS' },
    { label: 'Food & Beverage', value: 'FOOD_BEVERAGE' },
    { label: 'Entertainment', value: 'ENTERTAINMENT' },
    { label: 'Services', value: 'SERVICES' },
    { label: 'Health & Beauty', value: 'HEALTH_BEAUTY' },
    { label: 'Other', value: 'OTHER' }
  ];
  statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Open', value: 'OPEN' },
    { label: 'Closed', value: 'CLOSED' },
    { label: 'Under Renovation', value: 'UNDER_RENOVATION' },
    { label: 'Vacant', value: 'VACANT' }
  ];

  constructor(
    private storeService: StoreService,
    private router: Router,
    private uiService: UIService
  ) {}

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.storeService.getAll().subscribe(stores => {
      this.stores = stores;
      this.filteredStores = [...stores];
      this.calculateOccupancy();
      setTimeout(() => {
        this.loading = false;
      }, 600);
    });
  }

  calculateOccupancy(): void {
    this.totalCount = this.stores.length;
    this.occupiedCount = this.stores.filter(s => s.status === 'OPEN').length;
    this.occupancyPct = this.totalCount > 0 ? Math.round((this.occupiedCount / this.totalCount) * 100) : 0;
  }

  filterStores(): void {
    this.filteredStores = this.stores.filter(store => {
      const matchesCategory = !this.selectedCategory || store.category === this.selectedCategory;
      const matchesStatus = !this.selectedStatus || store.status === this.selectedStatus;
      const matchesSearch = !this.searchQuery || 
        store.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        store.code.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }

  goToCreate(): void {
    this.router.navigate(['/mall/stores/create']);
  }

  viewStore(id: string): void {
    this.router.navigate(['/mall/stores', id]);
  }

  editStore(id: string): void {
    this.router.navigate(['/mall/stores', id, 'edit']);
  }

  deleteStore(store: Store): void {
    if (confirm(`Delete store "${store.name}"? This action cannot be undone.`)) {
      this.storeService.delete(store.id).subscribe({
        next: () => {
          this.uiService.showSuccess('Store deleted successfully');
          this.loadStores();
        },
        error: () => {
          // The global error interceptor already surfaced the failure toast.
        }
      });
    }
  }
}
