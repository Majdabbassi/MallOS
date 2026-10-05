import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="empty-state">
      <div class="empty-state-icon">
        <i [class]="icon"></i>
      </div>
      <h3 class="empty-state-title">{{ title }}</h3>
      <p class="empty-state-description">{{ description }}</p>
      <p-button 
        *ngIf="actionLabel"
        [label]="actionLabel"
        [icon]="actionIcon"
        (onClick)="actionClick.emit()"
        [class]="'btn-primary'">
      </p-button>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 32px;
      text-align: center;
    }

    .empty-state-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--color-bg-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .empty-state-icon i {
      font-size: 32px;
      color: var(--color-text-muted);
    }

    .empty-state-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 8px 0;
    }

    .empty-state-description {
      font-size: 14px;
      color: var(--color-text-secondary);
      max-width: 400px;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon: string = 'pi pi-inbox';
  @Input() title: string = 'No data found';
  @Input() description: string = 'There is no data to display at the moment.';
  @Input() actionLabel?: string;
  @Input() actionIcon: string = 'pi pi-plus';
  @Output() actionClick = new EventEmitter<void>();
}
