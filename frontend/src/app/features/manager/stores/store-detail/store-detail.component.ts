import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { StoreService } from '../../../../core/services/store.service';
import { UIService } from '../../../../core/services/ui.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  template: `
    <div class="store-detail" *ngIf="store">
      <div class="page-header">
        <div class="header-left">
          <h1>{{ store.name }}</h1>
          <app-status-badge [status]="store.status" [label]="store.status"></app-status-badge>
        </div>
        <button class="btn btn-primary" (click)="editStore()">
          <i class="pi pi-pencil"></i>
          <span>Edit Store</span>
        </button>
      </div>

      <div class="store-info-grid">
        <div class="info-card">
          <h3>Store Information</h3>
          <div class="info-row">
            <span class="label">Code:</span>
            <span class="value code-badge">{{ store.code }}</span>
          </div>
          <div class="info-row">
            <span class="label">Category:</span>
            <span class="value">{{ store.category }}</span>
          </div>
          <div class="info-row">
            <span class="label">Floor:</span>
            <span class="value">{{ store.floor }}</span>
          </div>
          <div class="info-row">
            <span class="label">Zone:</span>
            <span class="value">{{ store.zone }}</span>
          </div>
          <div class="info-row">
            <span class="label">Surface Area:</span>
            <span class="value">{{ store.surface }} m²</span>
          </div>
          <div class="info-row">
            <span class="label">Status:</span>
            <span class="value"><app-status-badge [status]="store.status" [label]="store.status"></app-status-badge></span>
          </div>
        </div>

        <div class="info-card">
          <h3>Financial Information</h3>
          <div class="info-row">
            <span class="label">Monthly Rent:</span>
            <span class="value">{{ store.monthlyRent.toLocaleString() }} TND</span>
          </div>
          <div class="info-row">
            <span class="label">Annual Rent:</span>
            <span class="value">{{ (store.monthlyRent * 12).toLocaleString() }} TND</span>
          </div>
          <div class="info-row">
            <span class="label">Rent per m²:</span>
            <span class="value">{{ (store.monthlyRent / store.surface).toFixed(2) }} TND/m²</span>
          </div>
        </div>

        <div class="info-card" *ngIf="store.ownerName">
          <h3>Owner Information</h3>
          <div class="info-row">
            <span class="label">Name:</span>
            <span class="value">{{ store.ownerName }}</span>
          </div>
          <div class="info-row">
            <span class="label">Phone:</span>
            <span class="value">{{ store.ownerPhone || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">{{ store.ownerEmail || '-' }}</span>
          </div>
        </div>
      </div>

      <div class="timeline-section">
        <h3>Timeline</h3>
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-date">{{ formatDate(store.createdAt) }}</div>
              <div class="timeline-title">Store Created</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .store-detail {
      max-width: var(--content-max-width);
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-left h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .store-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .info-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .info-card h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 20px 0;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--color-border);
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--color-border);
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-row .label {
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .info-row .value {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .code-badge {
      font-family: var(--font-mono);
      font-size: 12px;
      padding: 2px 8px;
      background: var(--color-bg-elevated);
      border-radius: var(--radius-sm);
      color: var(--color-text-primary);
    }

    .timeline-section {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .timeline-section h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 20px 0;
    }

    .timeline {
      position: relative;
      padding-left: 24px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 6px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--color-border);
    }

    .timeline-item {
      position: relative;
      padding-bottom: 24px;
    }

    .timeline-item:last-child {
      padding-bottom: 0;
    }

    .timeline-dot {
      position: absolute;
      left: -24px;
      top: 0;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--color-primary);
      border: 3px solid var(--color-bg-surface);
    }

    .timeline-date {
      font-size: 12px;
      color: var(--color-text-secondary);
      margin-bottom: 4px;
    }

    .timeline-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .store-info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StoreDetailComponent implements OnInit {
  store: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storeService: StoreService,
    private uiService: UIService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadStore(id);
    }
  }

  loadStore(id: string): void {
    this.storeService.getById(id).subscribe(store => {
      this.store = store;
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  editStore(): void {
    this.router.navigate(['/mall/stores', this.store.id, 'edit']);
  }
}
