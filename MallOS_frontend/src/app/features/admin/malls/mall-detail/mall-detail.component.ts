import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MallService } from '../../../../core/services/mall.service';
import { StoreService } from '../../../../core/services/store.service';
import { AssistantService } from '../../../../core/services/assistant.service';
import { UIService } from '../../../../core/services/ui.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-mall-detail',
  standalone: true,
  imports: [
    CommonModule,
    TabViewModule,
    TableModule,
    ButtonModule,
    TagModule,
    StatusBadgeComponent,
    AvatarComponent
  ],
  template: `
    <div class="mall-detail" *ngIf="mall">
      <div class="page-header">
        <div class="header-left">
          <h1>{{ mall.name }}</h1>
          <app-status-badge [status]="mall.status" [label]="mall.status"></app-status-badge>
        </div>
        <button class="btn btn-primary" (click)="editMall()">
          <i class="pi pi-pencil"></i>
          <span>Edit Mall</span>
        </button>
      </div>

      <div class="mall-info-strip">
        <div class="info-item">
          <i class="pi pi-map-marker"></i>
          <span>{{ mall.address }}, {{ mall.city }}, {{ mall.country }}</span>
        </div>
        <div class="info-item">
          <i class="pi pi-phone"></i>
          <span>{{ mall.phone }}</span>
        </div>
        <div class="info-item">
          <i class="pi pi-envelope"></i>
          <span>{{ mall.email }}</span>
        </div>
        <div class="info-item" *ngIf="mall.website">
          <i class="pi pi-globe"></i>
          <span>{{ mall.website }}</span>
        </div>
        <div class="info-item">
          <i class="pi pi-user"></i>
          <span>Manager: {{ getManagerName(mall.managerId) }}</span>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-arrows-alt"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ mall.totalArea.toLocaleString() }} m²</div>
            <div class="stat-label">Total Area</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-shop"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ mall.totalStores }}</div>
            <div class="stat-label">Total Stores</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-chart-pie"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ getOccupancyPercentage() }}%</div>
            <div class="stat-label">Occupancy</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ mall.totalAssistants }}</div>
            <div class="stat-label">Assistants</div>
          </div>
        </div>
      </div>

      <p-tabView [styleClass]="'mall-tabs'">
        <p-tabPanel header="Stores">
          <p-table [value]="stores" [paginator]="true" [rows]="10">
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
              </tr>
            </ng-template>
          </p-table>
        </p-tabPanel>

        <p-tabPanel header="Assistants">
          <p-table [value]="assistants" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Permissions</th>
                <th>Last Active</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-assistant>
              <tr>
                <td>
                  <div class="user-cell">
                    <app-avatar [name]="assistant.fullName" [size]="'small'"></app-avatar>
                    <span>{{ assistant.fullName }}</span>
                  </div>
                </td>
                <td>{{ assistant.email }}</td>
                <td>{{ assistant.phone }}</td>
                <td>{{ getGrantedPermissionsCount(assistant) }} granted</td>
                <td>{{ assistant.lastActive ? formatDate(assistant.lastActive) : 'Never' }}</td>
              </tr>
            </ng-template>
          </p-table>
        </p-tabPanel>

        <p-tabPanel header="Manager">
          <div class="manager-card">
            <app-avatar [name]="getManagerName(mall.managerId)" [size]="'large'"></app-avatar>
            <div class="manager-info">
              <h3>{{ getManagerName(mall.managerId) }}</h3>
              <p class="text-secondary">Mall Manager</p>
              <div class="manager-details">
                <div class="detail-item">
                  <i class="pi pi-envelope"></i>
                  <span>{{ getManagerEmail(mall) }}</span>
                </div>
                <div class="detail-item">
                  <i class="pi pi-phone"></i>
                  <span>+216 XX XXX XXX</span>
                </div>
              </div>
            </div>
          </div>
        </p-tabPanel>
      </p-tabView>
    </div>
  `,
  styles: [`
    .mall-detail {
      max-width: var(--content-max-width);
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-left h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .mall-info-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      padding: 16px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      margin-bottom: 24px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .info-item i {
      color: var(--color-primary);
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: rgba(79, 142, 247, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);
      font-size: 20px;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 1.2;
    }

    .stat-label {
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .code-badge {
      font-family: var(--font-mono);
      font-size: 12px;
      padding: 2px 8px;
      background: var(--color-bg-elevated);
      border-radius: var(--radius-sm);
      color: var(--color-text-primary);
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .manager-card {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 32px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }

    .manager-info h3 {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 4px 0;
    }

    .manager-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .mall-info-strip {
        flex-direction: column;
        gap: 12px;
      }

      .manager-card {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class MallDetailComponent implements OnInit {
  mall: any;
  stores: any[] = [];
  assistants: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mallService: MallService,
    private storeService: StoreService,
    private assistantService: AssistantService,
    private uiService: UIService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMall(id);
    }
  }

  loadMall(id: string): void {
    this.mallService.getById(id).subscribe(mall => {
      this.mall = mall;
      if (mall) {
        this.loadStores(id);
        this.loadAssistants(id);
      }
    });
  }

  loadStores(mallId: string): void {
    this.storeService.getByMallId(mallId).subscribe(stores => {
      this.stores = stores;
    });
  }

  loadAssistants(mallId: string): void {
    this.assistantService.getByMallId(mallId).subscribe(assistants => {
      this.assistants = assistants;
    });
  }

  getManagerName(managerId: string): string {
    return managerId ? 'Assigned Manager' : 'Unassigned';
  }

  getOccupancyPercentage(): number {
    if (!this.mall || this.mall.totalStores === 0) return 0;
    return Math.round((this.mall.occupiedStores / this.mall.totalStores) * 100);
  }

  getGrantedPermissionsCount(assistant: any): number {
    return assistant.permissions?.filter((p: any) => p.granted).length || 0;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getManagerEmail(mall: any): string {
    return `manager@${mall.name.toLowerCase().replace(/\s+/g, '')}.tn`;
  }

  editMall(): void {
    this.router.navigate(['/admin/malls', this.mall.id, 'edit']);
  }
}
