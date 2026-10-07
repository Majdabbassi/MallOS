import { CommonModule } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { SILENT_ERRORS } from '../../../core/interceptors/error.interceptor';
import { AuthService } from '../../../core/services/auth.service';
import {
  MaintenanceService, WorkOrder, WorkOrderPriority, WorkOrderRequest, WorkOrderStatus
} from '../../../core/services/maintenance.service';
import { UIService } from '../../../core/services/ui.service';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

interface StoreOption { id: number; code: string; name: string; }

/** Maintenance work orders: what is broken, who fixes it, and the history of what was done. */
@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, TableModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Maintenance</h1>
          <p class="text-secondary">Work orders: open jobs first, the most urgent on top</p>
        </div>
        <button pButton type="button" icon="pi pi-plus" label="New work order" (click)="openNew()" *ngIf="!forbidden"></button>
      </div>

      <div class="forbidden" *ngIf="forbidden"><i class="pi pi-lock"></i> You need the "Maintenance work orders" permission to see this page.</div>

      <ng-container *ngIf="!forbidden">
        <div class="filters">
          <button *ngFor="let f of filters" type="button" class="chip" [class.on]="filter === f.key" (click)="setFilter(f.key)">
            {{ f.label }}
          </button>
        </div>

        <p-table [value]="orders" [loading]="loading" styleClass="orders-table">
          <ng-template pTemplate="header">
            <tr><th>Job</th><th>Where</th><th>Priority</th><th>Status</th><th>Assigned to</th><th>Opened</th><th class="actions-col"></th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-o>
            <tr [class.closed]="o.status === 'DONE' || o.status === 'CANCELED'">
              <td>
                <div class="title">#{{ o.id }} {{ o.title }}</div>
                <div class="sub" *ngIf="o.description">{{ o.description }}</div>
              </td>
              <td>{{ o.storeCode ? o.storeCode + ' · ' + o.storeName : 'Common area' }}</td>
              <td><span class="tag" [class]="'tag p-' + o.priority.toLowerCase()">{{ o.priority }}</span></td>
              <td><span class="tag" [class]="'tag s-' + o.status.toLowerCase()">{{ statusLabel(o.status) }}</span>
                <div class="sub" *ngIf="o.status === 'DONE' && o.cost != null">cost {{ o.cost | number: '1.0-2' }}</div></td>
              <td>{{ o.assignee || '—' }}</td>
              <td><span title="{{ o.createdAt | date: 'medium' }}">{{ o.createdAt | date: 'mediumDate' }}</span>
                <div class="sub" *ngIf="o.reportedBy">by {{ o.reportedBy }}</div></td>
              <td class="actions-col">
                <ng-container *ngIf="o.status === 'OPEN' || o.status === 'IN_PROGRESS'">
                  <button *ngIf="o.status === 'OPEN'" pButton type="button" class="p-button-text p-button-sm" icon="pi pi-play"
                          label="Start" (click)="move(o, 'IN_PROGRESS')"></button>
                  <button pButton type="button" class="p-button-text p-button-sm p-button-success" icon="pi pi-check"
                          label="Done" (click)="openDone(o)"></button>
                  <button pButton type="button" class="p-button-text p-button-sm" icon="pi pi-pencil" (click)="openEdit(o)" title="Edit"></button>
                  <button pButton type="button" class="p-button-text p-button-sm p-button-danger" icon="pi pi-times"
                          (click)="cancel(o)" title="Cancel the work order"></button>
                </ng-container>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="7" class="empty-cell">No work orders here.</td></tr>
          </ng-template>
        </p-table>
      </ng-container>
    </div>

    <p-dialog [header]="editing ? 'Edit work order #' + editing.id : 'New work order'" [(visible)]="formVisible"
              [modal]="true" [style]="{ width: '520px' }">
      <div class="dialog-form">
        <div class="form-group">
          <label for="wo-title">What needs doing?</label>
          <input id="wo-title" pInputText [(ngModel)]="form.title" maxlength="160" placeholder="e.g. Water leak from the ceiling" />
        </div>
        <div class="form-group">
          <label for="wo-desc">Details</label>
          <textarea id="wo-desc" rows="3" [(ngModel)]="form.description" maxlength="2000"></textarea>
        </div>
        <div class="row">
          <div class="form-group">
            <label for="wo-store">Where</label>
            <select id="wo-store" [(ngModel)]="form.storeId">
              <option [ngValue]="null">Common area</option>
              <option *ngFor="let s of stores" [ngValue]="s.id">{{ s.code }} · {{ s.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="wo-priority">Priority</label>
            <select id="wo-priority" [(ngModel)]="form.priority">
              <option *ngFor="let p of priorities" [ngValue]="p">{{ p }}</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="wo-assignee">Assigned to</label>
          <input id="wo-assignee" pInputText [(ngModel)]="form.assignee" maxlength="160" placeholder="Contractor or staff member" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancel" class="p-button-text" (click)="formVisible = false"></button>
        <button pButton type="button" icon="pi pi-check" [label]="editing ? 'Save' : 'Open work order'"
                [disabled]="saving || !form.title.trim()" (click)="save()"></button>
      </ng-template>
    </p-dialog>

    <p-dialog [header]="'Close work order #' + (closing?.id ?? '')" [(visible)]="doneVisible" [modal]="true" [style]="{ width: '400px' }">
      <div class="dialog-form">
        <div class="form-group">
          <label for="wo-cost">What did it cost? (optional)</label>
          <input id="wo-cost" pInputText type="number" min="0" step="0.01" [(ngModel)]="cost" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Back" class="p-button-text" (click)="doneVisible = false"></button>
        <button pButton type="button" icon="pi pi-check" label="Mark as done" [disabled]="saving" (click)="confirmDone()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .page { padding: 24px 0; }
    .page-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
    h1 { margin: 0 0 4px; font-size: 28px; }
    .text-secondary { margin: 0; color: var(--color-text-secondary, #94a3b8); }
    .filters { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
    .chip { border: 1px solid var(--color-border); background: transparent; color: inherit; padding: 6px 14px; border-radius: 999px; cursor: pointer; font: inherit; font-size: 13px; }
    .chip.on { background: rgba(59,130,246,.18); border-color: #3b82f6; color: #93c5fd; }
    .title { font-weight: 600; }
    .sub { font-size: 12px; color: var(--color-text-secondary, #94a3b8); margin-top: 2px; }
    tr.closed td { opacity: .65; }
    .tag { padding: 2px 10px; border-radius: 999px; font-size: 12px; white-space: nowrap; }
    .p-urgent { background: rgba(239,68,68,.18); color: #f87171; } .p-high { background: rgba(245,158,11,.16); color: #fbbf24; }
    .p-normal { background: rgba(59,130,246,.16); color: #93c5fd; } .p-low { background: rgba(148,163,184,.16); color: #cbd5e1; }
    .s-open { background: rgba(59,130,246,.16); color: #93c5fd; } .s-in_progress { background: rgba(245,158,11,.16); color: #fbbf24; }
    .s-done { background: rgba(34,197,94,.16); color: #4ade80; } .s-canceled { background: rgba(148,163,184,.16); color: #cbd5e1; }
    .actions-col { text-align: right; white-space: nowrap; }
    .empty-cell { text-align: center; padding: 24px; color: var(--color-text-secondary, #94a3b8); }
    .forbidden { padding: 24px; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); color: var(--color-text-secondary); }
    .dialog-form { display: flex; flex-direction: column; gap: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .row { display: flex; gap: 12px; }
    textarea, select { font: inherit; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-surface, transparent); color: inherit; }
  `]
})
export class MaintenanceComponent implements OnInit {
  orders: WorkOrder[] = [];
  stores: StoreOption[] = [];
  loading = true;
  forbidden = false;
  saving = false;
  filter: WorkOrderStatus | 'ALL' = 'ALL';
  readonly filters: { key: WorkOrderStatus | 'ALL'; label: string }[] = [
    { key: 'ALL', label: 'All' }, { key: 'OPEN', label: 'Open' }, { key: 'IN_PROGRESS', label: 'In progress' },
    { key: 'DONE', label: 'Done' }, { key: 'CANCELED', label: 'Canceled' }
  ];
  readonly priorities: WorkOrderPriority[] = ['URGENT', 'HIGH', 'NORMAL', 'LOW'];

  formVisible = false;
  editing: WorkOrder | null = null;
  form = { title: '', description: '' as string | null, priority: 'NORMAL' as WorkOrderPriority, storeId: null as number | null, assignee: '' as string | null };

  doneVisible = false;
  closing: WorkOrder | null = null;
  cost: number | null = null;

  constructor(private auth: AuthService, private maintenance: MaintenanceService, private ui: UIService, private http: HttpClient) {}

  private get mallId(): string | undefined {
    return this.auth.user?.mallId;
  }

  ngOnInit(): void {
    this.load();
    if (this.mallId) {
      // the store list only feeds the "Where" picker; without it, orders can still be opened for common areas
      this.http.get<StoreOption[]>(`${environment.apiBaseUrl}/api/malls/${this.mallId}/stores`,
        { context: new HttpContext().set(SILENT_ERRORS, true) })
        .subscribe({ next: s => (this.stores = s), error: () => (this.stores = []) });
    }
  }

  load(): void {
    if (!this.mallId) { this.loading = false; return; }
    this.loading = true;
    this.maintenance.list(this.mallId, this.filter === 'ALL' ? undefined : this.filter).subscribe({
      next: orders => { this.orders = orders; this.loading = false; this.forbidden = false; },
      error: err => { this.loading = false; this.forbidden = err.status === 403; }
    });
  }

  setFilter(key: WorkOrderStatus | 'ALL'): void {
    this.filter = key;
    this.load();
  }

  statusLabel(status: WorkOrderStatus): string {
    return status === 'IN_PROGRESS' ? 'In progress' : status.charAt(0) + status.slice(1).toLowerCase();
  }

  openNew(): void {
    this.editing = null;
    this.form = { title: '', description: '', priority: 'NORMAL', storeId: null, assignee: '' };
    this.formVisible = true;
  }

  openEdit(order: WorkOrder): void {
    this.editing = order;
    this.form = { title: order.title, description: order.description, priority: order.priority, storeId: order.storeId, assignee: order.assignee };
    this.formVisible = true;
  }

  save(): void {
    if (!this.mallId) return;
    this.saving = true;
    const request: WorkOrderRequest = { ...this.form, title: this.form.title.trim() };
    const call = this.editing
      ? this.maintenance.update(this.mallId, this.editing.id, request)
      : this.maintenance.create(this.mallId, request);
    call.subscribe({
      next: o => {
        this.saving = false;
        this.formVisible = false;
        this.ui.showSuccess(this.editing ? `Work order #${o.id} saved` : `Work order #${o.id} opened`);
        this.load();
      },
      error: () => (this.saving = false)
    });
  }

  move(order: WorkOrder, status: WorkOrderStatus, cost?: number | null): void {
    if (!this.mallId) return;
    this.saving = true;
    this.maintenance.changeStatus(this.mallId, order.id, status, cost).subscribe({
      next: () => { this.saving = false; this.doneVisible = false; this.load(); },
      error: () => (this.saving = false)
    });
  }

  openDone(order: WorkOrder): void {
    this.closing = order;
    this.cost = order.cost;
    this.doneVisible = true;
  }

  confirmDone(): void {
    if (this.closing) this.move(this.closing, 'DONE', this.cost);
  }

  cancel(order: WorkOrder): void {
    if (confirm(`Cancel work order #${order.id} (${order.title})?`)) this.move(order, 'CANCELED');
  }
}
