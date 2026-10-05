import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="coming-soon">
      <div class="coming-soon-icon">
        <i class="ph" [class]="icon"></i>
      </div>
      <h2 class="coming-soon-title">{{ module }} Coming Soon</h2>
      <p class="coming-soon-description">
        This module is part of Mall OS Phase 2. It will include advanced features for {{ module.toLowerCase() }} management.
      </p>
      <div class="coming-soon-features">
        <div class="feature-item">
          <i class="pi pi-check"></i>
          <span>Real-time analytics dashboard</span>
        </div>
        <div class="feature-item">
          <i class="pi pi-check"></i>
          <span>Automated reporting</span>
        </div>
        <div class="feature-item">
          <i class="pi pi-check"></i>
          <span>Smart notifications</span>
        </div>
      </div>
      <button class="btn btn-secondary" (click)="notifyMe()">
        <i class="pi pi-bell"></i>
        Notify me when it's ready
      </button>
    </div>
  `,
  styles: [`
    .coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 32px;
      text-align: center;
      min-height: 400px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      position: relative;
      overflow: hidden;
    }

    .coming-soon::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: radial-gradient(circle, var(--color-border) 1px, transparent 1px);
      background-size: 24px 24px;
      opacity: 0.3;
      animation: dotsFloat 3s ease-in-out infinite;
    }

    @keyframes dotsFloat {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    .coming-soon-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(79, 142, 247, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .coming-soon-icon i {
      font-size: 40px;
      color: var(--color-primary);
    }

    .coming-soon-title {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 16px 0;
      position: relative;
      z-index: 1;
    }

    .coming-soon-description {
      font-size: 16px;
      color: var(--color-text-secondary);
      max-width: 500px;
      margin: 0 0 32px 0;
      line-height: 1.6;
      position: relative;
      z-index: 1;
    }

    .coming-soon-features {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 32px;
      position: relative;
      z-index: 1;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .feature-item i {
      color: var(--color-success);
    }
  `]
})
export class ComingSoonComponent {
  @Input() module: string = 'Module';
  @Input() icon: string = 'ph-cube';

  notifyMe(): void {
    // This is a placeholder for future functionality
    console.log('Notify me clicked for:', this.module);
  }
}
