import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MallService } from '../../../core/services/mall.service';
import { StoreService } from '../../../core/services/store.service';
import { AssistantService } from '../../../core/services/assistant.service';
import { AuthService } from '../../../core/services/auth.service';
import { StatsCardComponent } from '../../../shared/components/stats-card/stats-card.component';
import { SkeletonCardsComponent } from '../../../shared/components/skeleton-cards/skeleton-cards.component';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, StatsCardComponent, SkeletonCardsComponent],
  template: `
    <div class="manager-dashboard">
      <div class="dashboard-header">
        <h1>{{ greeting }}, {{ managerName }} 👋</h1>
        <p class="text-secondary">Welcome back! Here's an overview of your mall.</p>
      </div>

      <div class="stats-section">
        <app-skeleton-cards *ngIf="loading" [count]="4"></app-skeleton-cards>
        <div class="stats-grid" *ngIf="!loading">
          <app-stats-card
            [value]="totalStores"
            label="Total Stores"
            icon="pi pi-shop"
            [icon]="'pi pi-shop'">
          </app-stats-card>
          <app-stats-card
            [value]="occupiedStores"
            label="Occupied Stores"
            icon="pi pi-check-circle"
            [trend]="{ direction: 'up', value: '+2', label: 'this month' }">
          </app-stats-card>
          <app-stats-card
            [value]="totalAssistants"
            label="Active Assistants"
            icon="pi pi-users"
            [trend]="{ direction: 'up', value: '+1', label: 'this month' }">
          </app-stats-card>
          <app-stats-card
            [value]="vacantStores"
            label="Vacant Stores"
            icon="pi pi-inbox"
            [trend]="{ direction: 'down', value: '-1', label: 'from last month' }">
          </app-stats-card>
        </div>
      </div>

      <div class="occupancy-section" *ngIf="!loading">
        <div class="section-header">
          <h2>Occupancy Overview</h2>
        </div>
        <div class="occupancy-card">
          <div class="occupancy-chart">
            <div class="occupancy-circle">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-bg-elevated)" stroke-width="8"/>
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-primary)" stroke-width="8"
                  [attr.stroke-dasharray]="occupancyCircumference"
                  [attr.stroke-dashoffset]="occupancyOffset"
                  stroke-linecap="round"
                  transform="rotate(-90 50 50)"/>
              </svg>
              <div class="occupancy-value">{{ occupancyPercentage }}%</div>
              <div class="occupancy-label">Occupancy</div>
            </div>
          </div>
          <div class="occupancy-details">
            <div class="detail-item">
              <div class="detail-label">Total Area</div>
              <div class="detail-value">{{ mall?.totalArea?.toLocaleString() || 0 }} m²</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Total Floors</div>
              <div class="detail-value">{{ mall?.floorCount || 0 }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Opened Year</div>
              <div class="detail-value">{{ mall?.openedYear || '-' }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Status</div>
              <div class="detail-value">{{ mall?.status || '-' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="quick-actions" *ngIf="!loading">
        <div class="section-header">
          <h2>Quick Actions</h2>
        </div>
        <div class="actions-grid">
          <button class="action-card card-interactive" (click)="goToStores()">
            <div class="action-icon">
              <i class="pi pi-shop"></i>
            </div>
            <div class="action-content">
              <div class="action-title">Manage Stores</div>
              <div class="action-subtitle">View and manage all stores</div>
            </div>
          </button>
          <button class="action-card card-interactive" (click)="goToAssistants()">
            <div class="action-icon">
              <i class="pi pi-users"></i>
            </div>
            <div class="action-content">
              <div class="action-title">Manage Assistants</div>
              <div class="action-subtitle">Configure access permissions</div>
            </div>
          </button>
          <button class="action-card card-interactive" (click)="goToOverview()">
            <div class="action-icon">
              <i class="ph ph-cube"></i>
            </div>
            <div class="action-content">
              <div class="action-title">3D Mall View</div>
              <div class="action-subtitle">Visualize mall layout</div>
            </div>
          </button>
          <button class="action-card card-interactive" (click)="goToProfile()">
            <div class="action-icon">
              <i class="pi pi-user"></i>
            </div>
            <div class="action-content">
              <div class="action-title">My Profile</div>
              <div class="action-subtitle">Update your information</div>
            </div>
          </button>
        </div>
      </div>

      <div class="recent-activity" *ngIf="!loading">
        <div class="section-header">
          <h2>Recent Activity</h2>
        </div>
        <div class="activity-list">
          <div class="activity-item" *ngFor="let activity of activities">
            <div class="activity-dot" [style.background-color]="activity.color"></div>
            <div class="activity-content">
              <div class="activity-text">{{ activity.text }}</div>
              <div class="activity-time">{{ activity.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .manager-dashboard {
      max-width: var(--content-max-width);
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 32px;
    }

    .dashboard-header h1 {
      font-size: 32px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 8px 0;
    }

    .stats-section {
      margin-bottom: 40px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .occupancy-section,
    .quick-actions,
    .recent-activity {
      margin-bottom: 40px;
    }

    .section-header {
      margin-bottom: 24px;
    }

    .section-header h2 {
      font-size: 24px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .occupancy-card {
      display: flex;
      gap: 40px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 32px;
      align-items: center;
    }

    .occupancy-chart {
      flex-shrink: 0;
    }

    .occupancy-circle {
      position: relative;
      width: 200px;
      height: 200px;
    }

    .occupancy-circle svg {
      width: 100%;
      height: 100%;
    }

    .occupancy-value {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 36px;
      font-weight: 700;
      font-family: var(--font-display);
      color: var(--color-text-primary);
    }

    .occupancy-label {
      position: absolute;
      top: 65%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .occupancy-details {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-label {
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .detail-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
    }

    .action-card:hover {
      background: var(--color-bg-elevated);
    }

    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: rgba(79, 142, 247, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);
      font-size: 20px;
      flex-shrink: 0;
    }

    .action-icon i.ph {
      font-size: 20px;
    }

    .action-content {
      flex: 1;
    }

    .action-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .action-subtitle {
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .activity-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 6px;
    }

    .activity-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .activity-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .activity-time {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    @media (max-width: 768px) {
      .occupancy-card {
        flex-direction: column;
        gap: 24px;
      }

      .occupancy-details {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ManagerDashboardComponent implements OnInit {
  loading = true;
  mall: any;
  stores: any[] = [];
  assistants: any[] = [];
  totalStores = 0;
  occupiedStores = 0;
  vacantStores = 0;
  totalAssistants = 0;
  managerName = 'Manager';
  activities = [
    { icon: 'pi pi-shop', text: 'Store "Tech Arena" added', time: '2 hours ago', color: '#4F8EF7' },
    { icon: 'pi pi-users', text: 'Assistant Salma permissions updated', time: '5 hours ago', color: '#7C3AED' },
    { icon: 'pi pi-check-circle', text: 'Store "Fashion Hub" renewed contract', time: 'Yesterday', color: '#10B981' },
    { icon: 'pi pi-exclamation-triangle', text: 'Maintenance alert in Zone B', time: 'Yesterday', color: '#F59E0B' },
    { icon: 'pi pi-user-plus', text: 'New assistant Farah Amor added', time: '3 days ago', color: '#4F8EF7' },
  ];

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  get occupancyPercentage(): number {
    if (this.totalStores === 0) return 0;
    return Math.round((this.occupiedStores / this.totalStores) * 100);
  }

  get occupancyCircumference(): number {
    return 2 * Math.PI * 45;
  }

  get occupancyOffset(): number {
    return this.occupancyCircumference * (1 - this.occupancyPercentage / 100);
  }

  constructor(
    private mallService: MallService,
    private storeService: StoreService,
    private assistantService: AssistantService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.managerName = this.auth.user?.fullName || 'Manager';
    this.loadData();
  }

  loadData(): void {
    const user = this.auth.user;
    if (user?.mallId) {
      this.mallService.getById(user.mallId).subscribe((mall: any) => {
        this.mall = mall;
        if (mall) {
          this.loadStores(mall.id);
          this.loadAssistants(mall.id);
        }
      });
    }
  }

  loadStores(mallId: string): void {
    this.storeService.getByMallId(mallId).subscribe((stores: any[]) => {
      this.stores = stores;
      this.totalStores = stores.length;
      this.occupiedStores = stores.filter((s: any) => s.status === 'ACTIVE').length;
      this.vacantStores = stores.filter((s: any) => s.status === 'VACANT').length;
      
      setTimeout(() => {
        this.loading = false;
      }, 600);
    });
  }

  loadAssistants(mallId: string): void {
    this.assistantService.getByMallId(mallId).subscribe((assistants: any[]) => {
      this.assistants = assistants;
      this.totalAssistants = assistants.length;
    });
  }

  goToStores(): void {
    this.router.navigate(['/mall/stores']);
  }

  goToAssistants(): void {
    this.router.navigate(['/mall/assistants']);
  }

  goToOverview(): void {
    this.router.navigate(['/mall/overview']);
  }

  goToProfile(): void {
    this.router.navigate(['/mall/profile']);
  }
}
