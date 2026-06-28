import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-manager-coming-soon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="coming-soon-page">
      <div class="coming-soon-content">
        <div class="coming-soon-icon">
          <i class="ph" [class]="icon"></i>
        </div>
        <h2>{{ module }}</h2>
        <p class="text-secondary">This module is part of Mall OS Phase 2 and is currently in development.</p>
        <div class="coming-soon-badge">Coming Soon</div>
      </div>
    </div>
  `,
  styles: [`
    .coming-soon-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
    }
    .coming-soon-content {
      text-align: center;
      max-width: 400px;
    }
    .coming-soon-icon {
      font-size: 64px;
      margin-bottom: 24px;
      color: var(--color-primary);
      opacity: 0.6;
    }
    .coming-soon-icon i { font-size: 64px; }
    h2 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 12px;
    }
    .coming-soon-badge {
      display: inline-block;
      margin-top: 20px;
      padding: 6px 16px;
      background: rgba(79,142,247,0.1);
      border: 1px solid rgba(79,142,247,0.3);
      border-radius: 20px;
      color: var(--color-primary);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
  `]
})
export class ManagerComingSoonComponent implements OnInit {
  module = 'Module';
  icon = 'ph-cube';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.module = this.route.snapshot.data['module'] || 'Module';
    this.icon = this.route.snapshot.data['icon'] || 'ph-cube';
  }
}
