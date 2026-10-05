import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, BreadcrumbModule],
  template: `
    <div class="page-header">
      <div class="page-header-top">
        <div class="page-header-left">
          <h1 class="page-title">{{ title }}</h1>
          <p-breadcrumb [model]="breadcrumbs" *ngIf="breadcrumbs && breadcrumbs.length > 0"></p-breadcrumb>
        </div>
        <div class="page-header-right" *ngIf="showActionButton">
          <p-button 
            [label]="actionButtonLabel" 
            [icon]="actionButtonIcon" 
            (onClick)="actionButtonClick.emit()"
            [class]="'btn-primary'">
          </p-button>
        </div>
      </div>
      <div class="page-header-subtitle" *ngIf="subtitle">
        <p class="text-secondary">{{ subtitle }}</p>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 24px;
    }

    .page-header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .page-header-left {
      flex: 1;
    }

    .page-title {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: var(--color-text-primary);
    }

    .page-header-right {
      flex-shrink: 0;
    }

    .page-header-subtitle {
      margin-top: 8px;
    }

    ::ng-deep .p-breadcrumb {
      padding: 0;
      background: transparent;
      border: none;
    }

    ::ng-deep .p-breadcrumb-item {
      color: var(--color-text-secondary);
      font-size: 14px;
    }

    ::ng-deep .p-breadcrumb-item:last-child {
      color: var(--color-text-primary);
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .page-header-top {
        flex-direction: column;
      }

      .page-header-right {
        width: 100%;
      }

      .page-header-right ::ng-deep .p-button {
        width: 100%;
      }
    }
  `]
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() breadcrumbs: any[] = [];
  @Input() showActionButton: boolean = false;
  @Input() actionButtonLabel: string = 'Action';
  @Input() actionButtonIcon: string = 'pi pi-plus';
  @Output() actionButtonClick = new EventEmitter<void>();
}
