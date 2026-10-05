import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-card card-interactive">
      <div class="stats-card-icon">
        <i [class]="icon"></i>
      </div>
      <div class="stats-card-content">
        <div class="stats-card-value">{{ value }}</div>
        <div class="stats-card-label">{{ label }}</div>
        <div class="stats-card-trend" *ngIf="trend">
          <span [class]="'trend-' + trend.direction">
            <i [class]="trend.direction === 'up' ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
            {{ trend.value }}
          </span>
          <span class="trend-label">{{ trend.label }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      transition: all 0.3s ease;
    }

    .stats-card-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: rgba(79, 142, 247, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stats-card-icon i {
      font-size: 20px;
      color: var(--color-primary);
    }

    .stats-card-content {
      flex: 1;
      min-width: 0;
    }

    .stats-card-value {
      font-size: 28px;
      font-weight: 600;
      font-family: var(--font-display);
      color: var(--color-text-primary);
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .stats-card-label {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin-bottom: 4px;
    }

    .stats-card-trend {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }

    .trend-up {
      color: var(--color-success);
    }

    .trend-down {
      color: var(--color-danger);
    }

    .trend-label {
      color: var(--color-text-muted);
    }
  `]
})
export class StatsCardComponent {
  @Input() value: string | number = '';
  @Input() label: string = '';
  @Input() icon: string = 'pi pi-chart-bar';
  @Input() trend?: {
    direction: 'up' | 'down';
    value: string;
    label: string;
  };
}
