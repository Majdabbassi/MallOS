import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ManagerSidebarComponent } from './manager-sidebar.component';
import { ManagerTopbarComponent } from './manager-topbar.component';

@Component({
  selector: 'app-manager-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ManagerSidebarComponent, ManagerTopbarComponent],
  template: `
    <div class="manager-layout">
      <app-manager-sidebar></app-manager-sidebar>
      <div class="manager-main">
        <app-manager-topbar></app-manager-topbar>
        <div class="manager-content page-enter">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .manager-layout {
      display: flex;
      min-height: 100vh;
      background: var(--color-bg-base);
    }

    .manager-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .manager-content {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
    }

    @media (max-width: 768px) {
      .manager-content {
        padding: 16px;
      }
    }
  `]
})
export class ManagerLayoutComponent {}
