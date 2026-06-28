import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { UIService } from '../../core/services/ui.service';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <header class="admin-topbar">
      <div class="topbar-left">
        <button class="mobile-menu-toggle" (click)="toggleSidebar()">
          <i class="pi pi-bars"></i>
        </button>
        <h1 class="page-title">{{ pageTitle }}</h1>
      </div>
      <div class="topbar-right">
        <button class="topbar-icon-btn" title="Search">
          <i class="pi pi-search"></i>
        </button>
        <button class="topbar-icon-btn" title="Notifications">
          <i class="pi pi-bell"></i>
          <span class="notification-badge">3</span>
        </button>
        <div class="user-menu" (click)="toggleUserMenu()">
          <app-avatar [name]="user?.fullName || ''" [size]="'small'"></app-avatar>
          <i class="pi pi-chevron-down"></i>
          <div class="user-dropdown" [class.show]="showUserMenu">
            <div class="dropdown-item" (click)="goToProfile()">
              <i class="pi pi-user"></i>
              <span>Profile</span>
            </div>
            <div class="dropdown-item danger" (click)="logout()">
              <i class="pi pi-sign-out"></i>
              <span>Logout</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .admin-topbar {
      height: 64px;
      background: var(--color-bg-surface);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      flex-shrink: 0;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .mobile-menu-toggle {
      display: none;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      cursor: pointer;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .mobile-menu-toggle:hover {
      background: var(--color-border);
      color: var(--color-text-primary);
    }

    .page-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .topbar-icon-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.2s ease;
    }

    .topbar-icon-btn:hover {
      background: var(--color-border);
      color: var(--color-text-primary);
    }

    .notification-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--color-danger);
      color: white;
      font-size: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: var(--radius-md);
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
    }

    .user-menu:hover {
      background: var(--color-border);
    }

    .user-menu i.pi-chevron-down {
      font-size: 12px;
      color: var(--color-text-secondary);
    }

    .user-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 180px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-elevated);
      padding: 8px;
      display: none;
      z-index: 100;
    }

    .user-dropdown.show {
      display: block;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .dropdown-item:hover {
      background: var(--color-bg-elevated);
    }

    .dropdown-item.danger {
      color: var(--color-danger);
    }

    .dropdown-item.danger:hover {
      background: rgba(239, 68, 68, 0.1);
    }

    @media (max-width: 768px) {
      .mobile-menu-toggle {
        display: flex;
      }

      .page-title {
        font-size: 16px;
      }
    }
  `]
})
export class AdminTopbarComponent {
  user = this.auth.user;
  showUserMenu = false;
  pageTitle = 'Dashboard';

  constructor(
    private auth: AuthService,
    private uiService: UIService,
    private router: Router
  ) {}

  toggleSidebar(): void {
    this.uiService.toggleSidebar();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  goToProfile(): void {
    this.showUserMenu = false;
    // Profile page for admin
  }

  logout(): void {
    this.showUserMenu = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
