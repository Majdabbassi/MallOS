import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MallService } from '../../../core/services/mall.service';
import { AuthService } from '../../../core/services/auth.service';
import { StatsCardComponent } from '../../../shared/components/stats-card/stats-card.component';
import { SkeletonCardsComponent } from '../../../shared/components/skeleton-cards/skeleton-cards.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, StatsCardComponent, SkeletonCardsComponent],
  template: `
    <div class="admin-dashboard">
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <p class="text-secondary">Overview of your mall management platform</p>
      </div>

      <div class="stats-section">
        <app-skeleton-cards *ngIf="loading" [count]="4"></app-skeleton-cards>
        <div class="stats-grid" *ngIf="!loading">
          <app-stats-card
            [value]="totalMalls"
            label="Total Malls"
            icon="pi pi-building"
            [trend]="{ direction: 'up', value: '+2', label: 'this month' }">
          </app-stats-card>
          <app-stats-card
            [value]="activeMalls"
            label="Active Malls"
            icon="pi pi-check-circle"
            [trend]="{ direction: 'up', value: '+1', label: 'this month' }">
          </app-stats-card>
          <app-stats-card
            [value]="totalManagers"
            label="Total Managers"
            icon="pi pi-users"
            [trend]="{ direction: 'up', value: '+3', label: 'this month' }">
          </app-stats-card>
          <app-stats-card
            [value]="pendingOnboarding"
            label="Pending Onboarding"
            icon="pi pi-clock"
            [trend]="{ direction: 'down', value: '-1', label: 'from last week' }">
          </app-stats-card>
        </div>
      </div>

      <div class="malls-section">
        <div class="section-header">
          <h2>Your Malls</h2>
          <button class="btn btn-primary" (click)="goToCreateMall()">
            <i class="pi pi-plus"></i>
            <span>Create Mall</span>
          </button>
        </div>

        <div class="malls-grid" *ngIf="!loading">
          <div class="mall-card card-interactive" *ngFor="let mall of malls" (click)="goToMallDetail(mall.id)">
            <div class="mall-card-header">
              <h3>{{ mall.name }}</h3>
              <span class="badge badge-{{ getStatusClass(mall.status) }}">{{ mall.status }}</span>
            </div>
            <div class="mall-card-body">
              <div class="mall-info">
                <i class="pi pi-map-marker"></i>
                <span>{{ mall.city }}, {{ mall.country }}</span>
              </div>
              <div class="mall-info">
                <i class="pi pi-user"></i>
                <span>{{ getManagerName(mall.managerId) }}</span>
              </div>
              <div class="mall-stats">
                <div class="mall-stat">
                  <span class="stat-value">{{ mall.totalStores }}</span>
                  <span class="stat-label">Stores</span>
                </div>
                <div class="mall-stat">
                  <span class="stat-value">{{ mall.occupiedStores }}</span>
                  <span class="stat-label">Occupied</span>
                </div>
              </div>
              <div class="occupancy-bar">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="getOccupancyPercentage(mall)"></div>
                </div>
                <span class="occupancy-text">{{ getOccupancyPercentage(mall) }}% occupied</span>
              </div>
            </div>
          </div>
        </div>

        <app-skeleton-cards *ngIf="loading" [count]="3"></app-skeleton-cards>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
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

    .malls-section {
      margin-bottom: 40px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-header h2 {
      font-size: 24px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .malls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .mall-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .mall-card:hover {
      background: var(--color-bg-elevated);
    }

    .mall-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .mall-card-header h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
      flex: 1;
    }

    .mall-card-body {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .mall-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .mall-info i {
      color: var(--color-text-muted);
    }

    .mall-stats {
      display: flex;
      gap: 24px;
      padding: 12px 0;
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }

    .mall-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .stat-label {
      font-size: 12px;
      color: var(--color-text-secondary);
    }

    .occupancy-bar {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .occupancy-bar .progress-bar {
      flex: 1;
      height: 6px;
    }

    .occupancy-text {
      font-size: 12px;
      color: var(--color-text-secondary);
      white-space: nowrap;
    }

    @media (max-width: 768px) {
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .malls-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  malls: any[] = [];
  totalMalls = 0;
  activeMalls = 0;
  totalManagers = 0;
  pendingOnboarding = 0;

  constructor(
    private mallService: MallService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.mallService.getAll().subscribe(malls => {
      this.malls = malls;
      this.totalMalls = malls.length;
      this.activeMalls = malls.filter(m => m.status === 'ACTIVE').length;
      this.pendingOnboarding = malls.filter(m => m.status === 'PENDING').length;
      this.totalManagers = malls.filter(m => m.managerId).length;
      
      // Simulate loading
      setTimeout(() => {
        this.loading = false;
      }, 600);
    });
  }

  getStatusClass(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'active') return 'success';
    if (statusLower === 'pending') return 'warning';
    if (statusLower === 'inactive' || statusLower === 'suspended') return 'danger';
    return 'muted';
  }

  getManagerName(managerId: string): string {
    // This would normally fetch from user service
    return 'Assigned Manager';
  }

  getOccupancyPercentage(mall: any): number {
    if (mall.totalStores === 0) return 0;
    return Math.round((mall.occupiedStores / mall.totalStores) * 100);
  }

  goToCreateMall(): void {
    this.router.navigate(['/admin/malls/create']);
  }

  goToMallDetail(id: string): void {
    this.router.navigate(['/admin/malls', id]);
  }
}
