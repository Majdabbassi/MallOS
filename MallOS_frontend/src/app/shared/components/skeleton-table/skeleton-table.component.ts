import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-table">
      <div class="skeleton-header">
        <div class="skeleton skeleton-header-item" *ngFor="let _ of columnsArray"></div>
      </div>
      <div class="skeleton-body">
        <div class="skeleton-row" *ngFor="let _ of rowsArray">
          <div class="skeleton skeleton-cell" *ngFor="let _ of columnsArray"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-table {
      width: 100%;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--color-bg-surface);
    }

    .skeleton-header {
      display: flex;
      padding: 16px;
      background: var(--color-bg-elevated);
      border-bottom: 1px solid var(--color-border);
      gap: 16px;
    }

    .skeleton-header-item {
      height: 16px;
      flex: 1;
    }

    .skeleton-body {
      padding: 0;
    }

    .skeleton-row {
      display: flex;
      padding: 16px;
      border-bottom: 1px solid var(--color-border);
      gap: 16px;
      height: 48px;
    }

    .skeleton-row:last-child {
      border-bottom: none;
    }

    .skeleton-cell {
      height: 16px;
      flex: 1;
    }
  `]
})
export class SkeletonTableComponent {
  @Input() columns: number = 5;
  @Input() rows: number = 10;

  get columnsArray(): any[] {
    return Array(this.columns);
  }

  get rowsArray(): any[] {
    return Array(this.rows);
  }
}
