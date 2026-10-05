import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MallAnalytics, UnitState } from '../../../core/models/finance.model';
import { AuthService } from '../../../core/services/auth.service';
import { FinanceService } from '../../../core/services/finance.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-head">
        <h1>Occupancy and leases</h1>
        <p class="text-secondary">How full the mall is, what it earns per square meter and which leases need attention</p>
      </div>

      <div class="forbidden" *ngIf="forbidden"><i class="pi pi-lock"></i> You need the reports permission to see this page.</div>

      <ng-container *ngIf="a as a">
        <div class="kpis">
          <div class="kpi"><span class="kpi-label">Occupancy</span><strong>{{ a.occupancyRate }}%</strong>
            <small>{{ a.leasedUnits }} of {{ a.totalUnits }} units leased</small></div>
          <div class="kpi"><span class="kpi-label">Monthly rent</span><strong>{{ a.monthlyRent | number: '1.0-0' }}</strong>
            <small>{{ a.rentPerSqm | number: '1.2-2' }} per m²</small></div>
          <div class="kpi warn"><span class="kpi-label">Leases ending within 90 days</span><strong>{{ a.expiringSoon }}</strong>
            <small *ngIf="a.expired">+ {{ a.expired }} already past their end date</small></div>
          <div class="kpi bad"><span class="kpi-label">Vacant units</span><strong>{{ a.vacantUnits }}</strong>
            <small>{{ a.vacantPotentialRent | number: '1.0-0' }} rent a month waiting</small></div>
        </div>

        <div class="grid">
          <section class="panel">
            <h2>By floor</h2>
            <div class="floor" *ngFor="let f of a.floors">
              <div class="floor-head"><strong>Level {{ f.level }}</strong>
                <span class="sub">{{ f.leased }}/{{ f.units }} leased · {{ f.monthlyRent | number: '1.0-0' }} a month · {{ f.rentPerSqm | number: '1.2-2' }} per m²</span></div>
              <div class="bar"><div class="fill" [style.width.%]="f.occupancyRate"></div></div>
              <div class="sub">{{ f.occupancyRate }}% occupied</div>
            </div>

            <h2 class="spaced">By category</h2>
            <div class="cat" *ngFor="let c of a.categories">
              <span>{{ pretty(c.category) }}</span>
              <span class="sub">{{ c.leased }}/{{ c.units }} units</span>
              <strong>{{ c.monthlyRent | number: '1.0-0' }}</strong>
            </div>
          </section>

          <section class="panel">
            <h2>Leases to act on</h2>
            <p class="sub" *ngIf="!attention().length">Every lease has more than 90 days left.</p>
            <div class="lease" *ngFor="let u of attention()" [class.expired]="u.leaseState === 'EXPIRED'">
              <div class="l-main"><strong>{{ u.code }} {{ u.name }}</strong>
                <span class="sub">{{ u.tenant || 'no tenant name' }} · {{ u.monthlyRent | number: '1.0-0' }} a month</span></div>
              <div class="l-when">
                <span class="tag" [ngClass]="u.leaseState.toLowerCase()">{{ u.leaseState === 'EXPIRED' ? 'ended ' + (-(u.daysLeft || 0)) + ' days ago' : 'in ' + u.daysLeft + ' days' }}</span>
                <span class="sub">{{ u.contractEnd | date: 'mediumDate' }}</span>
              </div>
            </div>

            <h2 class="spaced">Vacant units</h2>
            <p class="sub" *ngIf="!vacant().length">No vacant unit.</p>
            <div class="lease" *ngFor="let u of vacant()">
              <div class="l-main"><strong>{{ u.code }} {{ u.name }}</strong>
                <span class="sub">Level {{ u.floor }} · {{ u.surface ? (u.surface + ' m²') : 'surface unknown' }}</span></div>
              <div class="l-when"><span class="tag vacant">vacant</span>
                <span class="sub" *ngIf="u.monthlyRent">asking {{ u.monthlyRent | number: '1.0-0' }}</span></div>
            </div>
          </section>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding: 24px 0; }
    .page-head { margin-bottom: 24px; }
    h1 { margin: 0 0 4px; font-size: 28px; }
    h2 { margin: 0 0 12px; font-size: 16px; }
    h2.spaced { margin-top: 28px; }
    .text-secondary, .sub { color: var(--color-text-secondary); font-size: 13px; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .kpi { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px 18px; display: flex; flex-direction: column; gap: 4px; }
    .kpi strong { font-size: 26px; }
    .kpi-label, .kpi small { color: var(--color-text-secondary); font-size: 12px; }
    .kpi.warn strong { color: var(--color-warning); }
    .kpi.bad strong { color: var(--color-danger); }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; align-items: start; }
    .panel { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 18px; }
    .floor { margin-bottom: 16px; }
    .floor-head { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; }
    .bar { height: 10px; background: var(--color-bg-elevated); border-radius: 999px; overflow: hidden; margin-bottom: 4px; }
    .fill { height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-accent)); border-radius: 999px; }
    .cat { display: grid; grid-template-columns: 1fr auto 90px; gap: 12px; padding: 8px 0; border-top: 1px solid var(--color-border); align-items: center; }
    .cat strong { text-align: right; }
    .lease { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid var(--color-border); }
    .l-main, .l-when { display: flex; flex-direction: column; gap: 3px; }
    .l-when { text-align: right; align-items: flex-end; }
    .tag { padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .tag.expiring { background: rgba(245, 158, 11, .16); color: #fbbf24; }
    .tag.expired { background: rgba(239, 68, 68, .16); color: #f87171; }
    .tag.vacant { background: rgba(148, 163, 184, .16); color: #cbd5e1; }
    .forbidden { padding: 24px; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); color: var(--color-text-secondary); }
    @media (max-width: 1000px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class AnalyticsComponent implements OnInit {
  a: MallAnalytics | null = null;
  forbidden = false;

  constructor(private auth: AuthService, private finance: FinanceService) {}

  ngOnInit(): void {
    const mallId = this.auth.user?.mallId;
    if (mallId) {
      this.finance.analytics(mallId).subscribe({ next: a => (this.a = a), error: err => (this.forbidden = err.status === 403) });
    }
  }

  attention(): UnitState[] {
    return (this.a?.units ?? [])
      .filter(u => u.leaseState === 'EXPIRED' || u.leaseState === 'EXPIRING')
      .sort((x, y) => (x.daysLeft ?? 0) - (y.daysLeft ?? 0));
  }

  vacant(): UnitState[] {
    return (this.a?.units ?? []).filter(u => u.leaseState === 'VACANT');
  }

  pretty(category: string): string {
    return category.toLowerCase().replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
  }
}
