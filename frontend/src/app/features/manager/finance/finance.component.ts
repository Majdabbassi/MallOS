import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Debtor, FinanceSummary, Invoice } from '../../../core/models/finance.model';
import { AuthService } from '../../../core/services/auth.service';
import { FinanceService } from '../../../core/services/finance.service';
import { UIService } from '../../../core/services/ui.service';

type Filter = 'ALL' | 'UNPAID' | 'LATE' | 'PAID';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule],
  template: `
    <div class="finance-page">
      <div class="page-head">
        <div>
          <h1>Rent and invoices</h1>
          <p class="text-secondary">Monthly rent for every store, what has been collected and who is late</p>
        </div>
        <div class="head-actions">
          <input type="month" class="month" [(ngModel)]="period" (change)="load()" aria-label="Month">
          <button pButton type="button" class="p-button-outlined" icon="pi pi-percentage" label="Apply late fees"
                  [disabled]="busy" (click)="applyLateFees()"></button>
          <button pButton type="button" class="p-button-outlined" icon="pi pi-download" label="Export CSV" [disabled]="busy" (click)="exportCsv()"></button>
          <button pButton type="button" icon="pi pi-file-edit" label="Generate invoices" [disabled]="busy" (click)="generate()"></button>
        </div>
      </div>

      <div class="forbidden" *ngIf="forbidden">
        <i class="pi pi-lock"></i> You need the finance permission to see this page.
      </div>

      <ng-container *ngIf="!forbidden">
        <div class="kpis" *ngIf="summary as s">
          <div class="kpi"><span class="kpi-label">Billed in {{ s.period }}</span><strong>{{ s.billed | number: '1.0-2' }}</strong></div>
          <div class="kpi good"><span class="kpi-label">Collected</span><strong>{{ s.collected | number: '1.0-2' }}</strong>
            <small>{{ s.collectionRate }}% of the month</small></div>
          <div class="kpi"><span class="kpi-label">Outstanding (all months)</span><strong>{{ s.outstanding | number: '1.0-2' }}</strong></div>
          <div class="kpi bad"><span class="kpi-label">Overdue</span><strong>{{ s.overdue | number: '1.0-2' }}</strong>
            <small>incl. {{ s.lateFees | number: '1.0-2' }} late fees</small></div>
        </div>

        <div class="grid">
          <section class="panel">
            <div class="panel-head">
              <h2>Invoices</h2>
              <div class="chips">
                <button *ngFor="let f of filters" type="button" class="chip" [class.on]="filter === f.key"
                        (click)="filter = f.key">{{ f.label }}</button>
              </div>
            </div>
            <p-table [value]="visible()" [loading]="loading" styleClass="inv-table">
              <ng-template pTemplate="header">
                <tr><th>Unit</th><th>Tenant</th><th>Due</th><th class="num">Rent</th><th class="num">Late fee</th>
                  <th class="num">Total</th><th>Status</th><th></th></tr>
              </ng-template>
              <ng-template pTemplate="body" let-i>
                <tr>
                  <td><strong>{{ i.storeCode }}</strong><div class="sub">{{ i.storeName }}</div></td>
                  <td>{{ i.tenantName || '-' }}</td>
                  <td>{{ i.dueDate | date: 'mediumDate' }}<div class="sub late" *ngIf="i.late">{{ i.daysLate }} days late</div></td>
                  <td class="num">{{ i.amount | number: '1.2-2' }}</td>
                  <td class="num">{{ i.lateFee > 0 ? (i.lateFee | number: '1.2-2') : '-' }}</td>
                  <td class="num"><strong>{{ i.total | number: '1.2-2' }}</strong></td>
                  <td><span class="status" [ngClass]="statusClass(i)">{{ statusLabel(i) }}</span></td>
                  <td class="actions">
                    <ng-container *ngIf="i.status === 'UNPAID'">
                      <button pButton type="button" class="p-button-text p-button-sm" icon="pi pi-check" label="Paid" (click)="pay(i)"></button>
                      <button pButton type="button" class="p-button-text p-button-sm p-button-danger" icon="pi pi-times" (click)="cancel(i)" title="Cancel invoice"></button>
                    </ng-container>
                    <span class="sub" *ngIf="i.status === 'PAID'">{{ i.paidDate | date: 'mediumDate' }}</span>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr><td colspan="8" class="empty">No invoices for this month. Use "Generate invoices".</td></tr>
              </ng-template>
            </p-table>
          </section>

          <section class="panel debtors">
            <h2>Who owes what</h2>
            <p class="text-secondary" *ngIf="!summary?.debtors?.length">Nobody owes anything.</p>
            <div class="debtor" *ngFor="let d of summary?.debtors">
              <div class="d-main">
                <strong>{{ d.storeCode }} {{ d.storeName }}</strong>
                <span class="sub">{{ d.tenantName || 'no tenant name' }} · oldest due {{ d.oldestDueDate | date: 'mediumDate' }}</span>
              </div>
              <div class="d-money">
                <strong>{{ d.owed | number: '1.2-2' }}</strong>
                <span class="sub late" *ngIf="d.overdue > 0">{{ d.overdue | number: '1.2-2' }} overdue</span>
              </div>
            </div>
          </section>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .finance-page { padding: 24px 0; }
    .page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    h1 { margin: 0 0 4px; font-size: 28px; }
    h2 { margin: 0; font-size: 16px; }
    .text-secondary, .sub { color: var(--color-text-secondary); font-size: 13px; }
    .head-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .month { background: var(--color-bg-elevated); color: var(--color-text-primary); border: 1px solid var(--color-border);
             border-radius: var(--radius-md); padding: 9px 12px; font: inherit; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .kpi { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px 18px; display: flex; flex-direction: column; gap: 4px; }
    .kpi strong { font-size: 24px; }
    .kpi-label, .kpi small { color: var(--color-text-secondary); font-size: 12px; }
    .kpi.good strong { color: var(--color-success); }
    .kpi.bad strong { color: var(--color-danger); }
    .grid { display: grid; grid-template-columns: minmax(0, 2.2fr) minmax(280px, 1fr); gap: 20px; align-items: start; }
    .panel { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 18px; }
    .panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 12px; flex-wrap: wrap; }
    .chips { display: flex; gap: 6px; }
    .chip { background: var(--color-bg-elevated); color: var(--color-text-secondary); border: 1px solid var(--color-border);
            border-radius: 999px; padding: 4px 12px; font: inherit; font-size: 12px; cursor: pointer; }
    .chip.on { background: rgba(79, 142, 247, .18); color: var(--color-primary); border-color: rgba(79, 142, 247, .4); }
    .num { text-align: right; white-space: nowrap; }
    .actions { text-align: right; white-space: nowrap; }
    .late { color: var(--color-danger); }
    .empty { text-align: center; padding: 24px; color: var(--color-text-secondary); }
    .status { padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .status.paid { background: rgba(16, 185, 129, .16); color: #34d399; }
    .status.unpaid { background: rgba(245, 158, 11, .16); color: #fbbf24; }
    .status.late { background: rgba(239, 68, 68, .16); color: #f87171; }
    .status.canceled { background: rgba(148, 163, 184, .16); color: #94a3b8; }
    .debtors h2 { margin-bottom: 12px; }
    .debtor { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid var(--color-border); }
    .d-main, .d-money { display: flex; flex-direction: column; gap: 2px; }
    .d-money { text-align: right; }
    .forbidden { padding: 24px; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); color: var(--color-text-secondary); }
    @media (max-width: 1350px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class FinanceComponent implements OnInit {
  period = new Date().toISOString().slice(0, 7);
  summary: FinanceSummary | null = null;
  invoices: Invoice[] = [];
  loading = true;
  busy = false;
  forbidden = false;
  filter: Filter = 'ALL';
  readonly filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'All' }, { key: 'UNPAID', label: 'Unpaid' }, { key: 'LATE', label: 'Late' }, { key: 'PAID', label: 'Paid' }
  ];

  constructor(private auth: AuthService, private finance: FinanceService, private ui: UIService) {}

  /** The invoices of the selected month as CSV (needs "Export reports" as well as finance access). */
  exportCsv(): void {
    if (!this.mallId) return;
    this.finance.exportCsv(this.mallId, 'invoices', this.period).subscribe({
      next: blob => this.saveAs(blob, `invoices-${this.period}.csv`),
      error: err => this.ui.showError(err.status === 403 ? 'You need the "Export reports" permission.' : 'The export failed, please try again.')
    });
  }

  /** Saves a downloaded blob under a file name. */
  private saveAs(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }


  private get mallId(): string | undefined {
    return this.auth.user?.mallId;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.mallId || !this.period) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.finance.invoices(this.mallId, this.period).subscribe({
      next: invoices => { this.invoices = invoices; this.loading = false; this.forbidden = false; },
      error: err => { this.loading = false; this.forbidden = err.status === 403; }
    });
    this.finance.summary(this.mallId, this.period).subscribe({ next: s => (this.summary = s), error: () => undefined });
  }

  visible(): Invoice[] {
    switch (this.filter) {
      case 'UNPAID': return this.invoices.filter(i => i.status === 'UNPAID');
      case 'LATE': return this.invoices.filter(i => i.late);
      case 'PAID': return this.invoices.filter(i => i.status === 'PAID');
      default: return this.invoices;
    }
  }

  statusLabel(i: Invoice): string {
    return i.late ? 'Late' : i.status === 'UNPAID' ? 'Unpaid' : i.status === 'PAID' ? 'Paid' : 'Canceled';
  }

  statusClass(i: Invoice): string {
    return i.late ? 'late' : i.status.toLowerCase();
  }

  generate(): void {
    if (!this.mallId) return;
    this.busy = true;
    this.finance.generate(this.mallId, this.period).subscribe({
      next: r => {
        this.busy = false;
        this.ui.showSuccess(r.created === 0 ? `Nothing new to bill for ${r.period}` : `${r.created} invoices issued for ${r.period}`);
        this.load();
      },
      error: () => (this.busy = false)
    });
  }

  applyLateFees(): void {
    if (!this.mallId) return;
    this.busy = true;
    this.finance.refresh(this.mallId).subscribe({
      next: r => {
        this.busy = false;
        this.ui.showInfo(r.lateFeesApplied === 0 ? 'No new late fees' : `Late fee added to ${r.lateFeesApplied} invoices`);
        this.load();
      },
      error: () => (this.busy = false)
    });
  }

  pay(invoice: Invoice): void {
    if (!this.mallId) return;
    this.finance.pay(this.mallId, invoice.id).subscribe(() => {
      this.ui.showSuccess(`${invoice.storeCode} ${invoice.period} marked as paid`);
      this.load();
    });
  }

  cancel(invoice: Invoice): void {
    if (!this.mallId || !confirm(`Cancel the invoice of ${invoice.storeCode} for ${invoice.period}?`)) return;
    this.finance.cancel(this.mallId, invoice.id).subscribe(() => {
      this.ui.showSuccess('Invoice canceled');
      this.load();
    });
  }
}
