import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-cards">
      <div class="skeleton-card" *ngFor="let _ of countArray">
        <div class="skeleton skeleton-card-icon"></div>
        <div class="skeleton skeleton-card-value"></div>
        <div class="skeleton skeleton-card-label"></div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .skeleton-card {
      padding: 20px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-card-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
    }

    .skeleton-card-value {
      height: 28px;
      width: 60%;
    }

    .skeleton-card-label {
      height: 16px;
      width: 40%;
    }
  `]
})
export class SkeletonCardsComponent {
  @Input() count: number = 4;

  get countArray(): any[] {
    return Array(this.count);
  }
}
