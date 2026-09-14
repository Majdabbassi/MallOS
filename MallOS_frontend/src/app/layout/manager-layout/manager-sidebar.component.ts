import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UIService } from '../../core/services/ui.service';
import { MallService } from '../../core/services/mall.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-manager-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AvatarComponent],
  template: `
    <aside class="manager-sidebar" [class.collapsed]="collapsed$ | async">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="logo-icon">
            <i class="pi pi-building"></i>
          </div>
          <span class="logo-text" *ngIf="!(collapsed$ | async)">Mall OS</span>
        </div>
        <button class="sidebar-toggle" (click)="toggleSidebar()">
          <i class="pi" [class]="(collapsed$ | async) ? 'pi-angle-right' : 'pi-angle-left'"></i>
        </button>
      </div>

      <div class="mall-info" *ngIf="!(collapsed$ | async)">
        <div class="mall-pill">
          <span class="live-dot"></span>
          <i class="pi pi-map-marker"></i>
          <span>{{ mallName }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title" *ngIf="!(collapsed$ | async)">OVERVIEW</div>
          <a routerLink="/mall/dashboard" routerLinkActive="active" class="nav-item">
            <i class="pi pi-home"></i>
            <span *ngIf="!(collapsed$ | async)">Dashboard</span>
          </a>
          <a routerLink="/mall/overview" routerLinkActive="active" class="nav-item">
            <i class="ph ph-cube"></i>
            <span *ngIf="!(collapsed$ | async)">3D Mall View</span>
          </a>
          <a routerLink="/mall/floor-plan" routerLinkActive="active" class="nav-item">
            <i class="ph ph-map-trifold"></i>
            <span *ngIf="!(collapsed$ | async)">Interactive Map</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title" *ngIf="!(collapsed$ | async)">MANAGEMENT</div>
          <a routerLink="/mall/stores" routerLinkActive="active" class="nav-item">
            <i class="pi pi-shop"></i>
            <span *ngIf="!(collapsed$ | async)">Stores</span>
          </a>
          <a routerLink="/mall/tenants" routerLinkActive="active" class="nav-item disabled">
            <i class="ph ph-buildings"></i>
            <span *ngIf="!(collapsed$ | async)">Tenants</span>
            <span class="soon-badge" *ngIf="!(collapsed$ | async)">SOON</span>
          </a>
          <a routerLink="/mall/employees" routerLinkActive="active" class="nav-item disabled">
            <i class="ph ph-identification-badge"></i>
            <span *ngIf="!(collapsed$ | async)">Employees</span>
            <span class="soon-badge" *ngIf="!(collapsed$ | async)">SOON</span>
          </a>
          <a routerLink="/mall/assets" routerLinkActive="active" class="nav-item disabled">
            <i class="ph ph-package"></i>
            <span *ngIf="!(collapsed$ | async)">Assets</span>
            <span class="soon-badge" *ngIf="!(collapsed$ | async)">SOON</span>
          </a>
          <a routerLink="/mall/maintenance" routerLinkActive="active" class="nav-item disabled">
            <i class="ph ph-wrench"></i>
            <span *ngIf="!(collapsed$ | async)">Maintenance</span>
            <span class="soon-badge" *ngIf="!(collapsed$ | async)">SOON</span>
          </a>
          <a routerLink="/mall/energy" routerLinkActive="active" class="nav-item disabled">
            <i class="ph ph-lightning"></i>
            <span *ngIf="!(collapsed$ | async)">Energy</span>
            <span class="soon-badge" *ngIf="!(collapsed$ | async)">SOON</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title" *ngIf="!(collapsed$ | async)">OPERATIONS</div>
          <a routerLink="/mall/sales" routerLinkActive="active" class="nav-item disabled">
            <i class="ph ph-chart-line-up"></i>
            <span *ngIf="!(collapsed$ | async)">Sales</span>
            <span class="soon-badge" *ngIf="!(collapsed$ | async)">SOON</span>
          </a>
          <a routerLink="/mall/visitors" routerLinkActive="active" class="nav-item disabled">
            <i class="ph ph-users-four"></i>
            <span *ngIf="!(collapsed$ | async)">Visitors</span>
            <span class="soon-badge" *ngIf="!(collapsed$ | async)">SOON</span>
          </a>
          <a routerLink="/mall/parking" routerLinkActive="active" class="nav-item disabled">
            <i class="ph ph-car"></i>
            <span *ngIf="!(collapsed$ | async)">Parking</span>
            <span class="soon-badge" *ngIf="!(collapsed$ | async)">SOON</span>
          </a>
          <a routerLink="/mall/security" routerLinkActive="active" class="nav-item disabled">
            <i class="ph ph-shield-check"></i>
            <span *ngIf="!(collapsed$ | async)">Security</span>
            <span class="soon-badge" *ngIf="!(collapsed$ | async)">SOON</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title" *ngIf="!(collapsed$ | async)">ACCESS</div>
          <a routerLink="/mall/assistants" routerLinkActive="active" class="nav-item">
            <i class="pi pi-users"></i>
            <span *ngIf="!(collapsed$ | async)">Assistants</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title" *ngIf="!(collapsed$ | async)">SETTINGS</div>
          <a routerLink="/mall/profile" routerLinkActive="active" class="nav-item">
            <i class="pi pi-user"></i>
            <span *ngIf="!(collapsed$ | async)">My Profile</span>
          </a>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <app-avatar [name]="user?.fullName || ''" [size]="'small'"></app-avatar>
          <div class="user-details" *ngIf="!(collapsed$ | async)">
            <div class="user-name">{{ user?.fullName }}</div>
            <div class="user-role">Mall Manager</div>
          </div>
        </div>
        <button class="logout-btn" (click)="logout()" title="Logout">
          <i class="pi pi-sign-out"></i>
          <span *ngIf="!(collapsed$ | async)">Logout</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .manager-sidebar {
      width: var(--sidebar-width);
      background: var(--color-bg-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      flex-shrink: 0;
    }

    .manager-sidebar.collapsed {
      width: var(--sidebar-width-collapsed);
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border-bottom: 1px solid var(--color-border);
      height: 72px;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      overflow: hidden;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      flex-shrink: 0;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 700;
      font-family: var(--font-display);
      color: var(--color-text-primary);
      white-space: nowrap;
    }

    .sidebar-toggle {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .sidebar-toggle:hover {
      background: var(--color-border);
      color: var(--color-text-primary);
    }

    .mall-info {
      padding: 16px;
      border-bottom: 1px solid var(--color-border);
    }

    .mall-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(79, 142, 247, 0.15);
      border: 1px solid rgba(79, 142, 247, 0.3);
      border-radius: var(--radius-md);
      color: var(--color-primary);
      font-size: 13px;
      font-weight: 500;
    }

    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10B981;
      animation: pulse-dot 1.5s infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }

    .nav-section {
      margin-bottom: 24px;
    }

    .nav-section-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      padding-left: 12px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: all 0.2s ease;
      margin-bottom: 4px;
      position: relative;
    }

    .nav-item:hover:not(.disabled) {
      background: rgba(255, 255, 255, 0.04);
      color: var(--color-text-primary);
    }

    .nav-item.active {
      background: rgba(79, 142, 247, 0.12);
      border-left: 3px solid #4F8EF7;
      color: #4F8EF7;
    }

    .nav-item.disabled {
      opacity: 0.45;
      cursor: pointer;
    }

    .nav-item i {
      font-size: 18px;
      flex-shrink: 0;
    }

    .nav-item i.ph {
      font-size: 18px;
    }

    .nav-item span {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }

    .soon-badge {
      margin-left: auto;
      font-size: 9px;
      font-weight: 600;
      padding: 1px 5px;
      background: rgba(124, 58, 237, 0.2);
      border-radius: 4px;
      color: #c4b5fd;
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--color-border);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--color-bg-elevated);
      border-radius: var(--radius-md);
      margin-bottom: 12px;
    }

    .user-details {
      flex: 1;
      overflow: hidden;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 12px;
      color: var(--color-text-secondary);
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      border-radius: var(--radius-md);
      background: transparent;
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .logout-btn:hover {
      background: var(--color-bg-elevated);
      color: var(--color-danger);
      border-color: var(--color-danger);
    }

    .manager-sidebar.collapsed .sidebar-toggle {
      margin: 0 auto;
    }

    .manager-sidebar.collapsed .user-info {
      justify-content: center;
    }

    .manager-sidebar.collapsed .user-details {
      display: none;
    }

    .manager-sidebar.collapsed .logout-btn span {
      display: none;
    }

    .manager-sidebar.collapsed .logout-btn {
      justify-content: center;
    }
  `]
})
export class ManagerSidebarComponent {
  collapsed$ = this.uiService.sidebarCollapsed$;
  user = this.auth.user;
  mallName = 'City Center Mall';

  constructor(
    private auth: AuthService,
    private uiService: UIService,
    private router: Router,
    private mallService: MallService
  ) {
    this.loadMallName();
  }

  loadMallName(): void {
    if (this.user?.mallId) {
      this.mallService.getById(this.user.mallId).subscribe(mall => {
        if (mall) {
          this.mallName = mall.name;
        }
      });
    }
  }

  toggleSidebar(): void {
    this.uiService.toggleSidebar();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
