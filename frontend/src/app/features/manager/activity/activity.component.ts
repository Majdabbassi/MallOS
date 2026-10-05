import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditEntry } from '../../../core/models/finance.model';
import { AuthService } from '../../../core/services/auth.service';
import { FinanceService } from '../../../core/services/finance.service';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

/** Icon and colour of a history line, from what kind of thing it is about. */
export function auditStyle(entry: Pick<AuditEntry, 'entityType' | 'action'>): { icon: string; color: string } {
  switch (entry.entityType) {
    case 'STORE': return { icon: 'pi pi-shop', color: '#4F8EF7' };
    case 'FLOOR': return { icon: 'ph ph-map-trifold', color: '#06B6D4' };
    case 'MEMBER': return { icon: 'pi pi-users', color: '#7C3AED' };
    case 'INVOICE': return { icon: entry.action === 'INVOICE_PAID' ? 'pi pi-check-circle' : 'pi pi-wallet', color: '#10B981' };
    default: return { icon: 'pi pi-building', color: '#F59E0B' };
  }
}

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [CommonModule, FormsModule, RelativeTimePipe],
  template: `
    <div class="page">
      <div class="page-head">
        <h1>Activity</h1>
        <p class="text-secondary">Every change made in this mall: who did it, to what, and when</p>
      </div>

      <div class="forbidden" *ngIf="forbidden"><i class="pi pi-lock"></i> The history is for the mall manager.</div>

      <ng-container *ngIf="!forbidden">
        <div class="filters">
          <input type="search" placeholder="Search a person" [(ngModel)]="actor" (ngModelChange)="reload()">
          <select [(ngModel)]="entityType" (ngModelChange)="reload()" aria-label="Type">
            <option value="">Everything</option>
            <option value="STORE">Stores</option>
            <option value="FLOOR">Floor plans</option>
            <option value="MEMBER">Team</option>
            <option value="INVOICE">Rent and invoices</option>
            <option value="MALL">Mall</option>
          </select>
          <select [(ngModel)]="floor" (ngModelChange)="reload()" aria-label="Level">
            <option [ngValue]="null">All levels</option>
            <option *ngFor="let l of levels" [ngValue]="l">Level {{ l }}</option>
          </select>
        </div>

        <div class="timeline">
          <div class="entry" *ngFor="let e of entries">
            <div class="dot" [style.background]="style(e).color"><i [class]="style(e).icon"></i></div>
            <div class="body">
              <div class="summary">{{ e.summary }}</div>
              <div class="meta"><strong>{{ e.actorName }}</strong> · {{ e.createdAt | relativeTime }}
                <span class="when">{{ e.createdAt | date: 'medium' }}</span>
                <span class="kind">{{ pretty(e.action) }}</span></div>
            </div>
          </div>
          <p class="empty" *ngIf="!loading && !entries.length">Nothing matches.</p>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding: 24px 0; max-width: 900px; }
    .page-head { margin-bottom: 20px; }
    h1 { margin: 0 0 4px; font-size: 28px; }
    .text-secondary { color: var(--color-text-secondary); margin: 0; }
    .filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
    .filters input, .filters select { background: var(--color-bg-elevated); color: var(--color-text-primary); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); padding: 9px 12px; font: inherit; min-width: 160px; }
    .timeline { display: flex; flex-direction: column; }
    .entry { display: flex; gap: 14px; padding: 12px 0; border-top: 1px solid var(--color-border); }
    .dot { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; color: #fff; flex-shrink: 0; opacity: .92; }
    .dot i { font-size: 15px; }
    .summary { font-size: 14px; }
    .meta { margin-top: 3px; font-size: 12px; color: var(--color-text-secondary); display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .when { color: var(--color-text-muted); }
    .kind { margin-left: auto; font-size: 11px; letter-spacing: .04em; color: var(--color-text-muted); }
    .empty { color: var(--color-text-secondary); padding: 24px 0; }
    .forbidden { padding: 24px; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); color: var(--color-text-secondary); }
  `]
})
export class ActivityComponent implements OnInit {
  entries: AuditEntry[] = [];
  levels: number[] = [];
  actor = '';
  entityType = '';
  floor: number | null = null;
  loading = true;
  forbidden = false;

  constructor(private auth: AuthService, private finance: FinanceService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const mallId = this.auth.user?.mallId;
    if (!mallId) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.finance.history(mallId, { actor: this.actor.trim(), floor: this.floor, entityType: this.entityType, limit: 100 }).subscribe({
      next: entries => {
        this.entries = entries;
        this.loading = false;
        if (this.floor === null) {
          this.levels = [...new Set(entries.map(e => e.floorLevel).filter((l): l is number => l !== null))].sort((a, b) => a - b);
        }
      },
      error: err => { this.loading = false; this.forbidden = err.status === 403; }
    });
  }

  style(entry: AuditEntry) {
    return auditStyle(entry);
  }

  pretty(action: string): string {
    return action.replace(/_/g, ' ');
  }
}
