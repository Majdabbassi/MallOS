import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { MallService } from '../../../core/services/mall.service';
import { MemberService } from '../../../core/services/member.service';
import { MallMember } from '../../../core/models/member.model';
import { UIService } from '../../../core/services/ui.service';
import { Mall, CreateMallRequest } from '../../../core/models/mall.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule
  ],
  template: `
    <div class="admin-dashboard">
      <div class="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p class="text-secondary">Welcome, {{ userName }} — platform administration overview</p>
        </div>
        <button pButton type="button" icon="pi pi-plus" label="New Mall" (click)="openCreate()"></button>
      </div>

      <div class="stat-row">
        <div class="stat-card">
          <div class="stat-icon"><i class="pi pi-building"></i></div>
          <div>
            <div class="stat-value">{{ malls.length }}</div>
            <div class="stat-label">Malls on the platform</div>
          </div>
        </div>
      </div>

      <div class="section-header">
        <h2>Malls</h2>
      </div>

      <p-table [value]="malls" [loading]="loading" [paginator]="true" [rows]="10" styleClass="mall-table">
        <ng-template pTemplate="header">
          <tr>
            <th>Name</th>
            <th>Company</th>
            <th>Address</th>
            <th>Tax ID</th>
            <th>Created</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-mall>
          <tr>
            <td class="mall-name">{{ mall.name }}</td>
            <td>{{ mall.companyName }}</td>
            <td>{{ mall.address }}</td>
            <td><span class="code-badge">{{ mall.taxId }}</span></td>
            <td>{{ (mall.createdAt | date: 'mediumDate') || '-' }}</td>
            <td>
              <button pButton type="button" class="p-button-text p-button-sm" icon="pi pi-users"
                      label="Team" (click)="openTeam(mall)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" class="empty-cell">
              No malls yet. Click <strong>New Mall</strong> to create the first one.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog
      [header]="'Team of ' + (teamMall?.name || '')"
      [(visible)]="teamVisible"
      [modal]="true"
      [style]="{ width: '520px' }">
      <div class="dialog-form">
        <div *ngFor="let m of teamMembers" class="team-row">
          <div>
            <strong>{{ m.username }}</strong>
            <div class="text-secondary">{{ m.email }}</div>
          </div>
          <span class="code-badge">{{ m.role }}</span>
        </div>
        <p *ngIf="teamMembers.length === 0" class="text-secondary">This mall has no manager yet.</p>
        <div class="form-group">
          <label for="managerId">Assign a manager (username or email of a registered user)</label>
          <input id="managerId" pInputText [(ngModel)]="managerIdentifier" placeholder="e.g. manager" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Close" class="p-button-text" (click)="teamVisible = false"></button>
        <button pButton type="button" label="Assign manager" icon="pi pi-user-plus"
                [disabled]="!managerIdentifier.trim() || saving" (click)="assignManager()"></button>
      </ng-template>
    </p-dialog>

    <p-dialog
      header="Create Mall"
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: '480px' }">
      <div class="dialog-form">
        <div class="form-group">
          <label for="name">Mall Name *</label>
          <input id="name" pInputText [(ngModel)]="form.name" placeholder="e.g. Mall of Tunisia" />
        </div>
        <div class="form-group">
          <label for="companyName">Company Name *</label>
          <input id="companyName" pInputText [(ngModel)]="form.companyName" />
        </div>
        <div class="form-group">
          <label for="address">Address *</label>
          <input id="address" pInputText [(ngModel)]="form.address" />
        </div>
        <div class="form-group">
          <label for="taxId">Tax ID *</label>
          <input id="taxId" pInputText [(ngModel)]="form.taxId" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancel" class="p-button-text" (click)="dialogVisible = false"></button>
        <button
          pButton
          type="button"
          label="Create"
          icon="pi pi-check"
          [disabled]="!isFormValid() || saving"
          (click)="createMall()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .admin-dashboard {
      max-width: var(--content-max-width);
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }

    .dashboard-header h1 {
      font-size: 32px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 8px 0;
    }

    .stat-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 40px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: rgba(79, 142, 247, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);
      font-size: 22px;
      flex-shrink: 0;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .stat-label {
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .section-header {
      margin-bottom: 16px;
    }

    .section-header h2 {
      font-size: 22px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .mall-name {
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .team-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--color-border);
    }

    .code-badge {
      font-family: var(--font-mono);
      font-size: 12px;
      padding: 2px 8px;
      background: var(--color-bg-elevated);
      border-radius: var(--radius-sm);
      color: var(--color-text-primary);
    }

    .empty-cell {
      text-align: center;
      padding: 32px;
      color: var(--color-text-secondary);
    }

    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-top: 8px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    .form-group input {
      width: 100%;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  malls: Mall[] = [];
  loading = true;
  dialogVisible = false;
  saving = false;
  form: CreateMallRequest = this.emptyForm();

  constructor(
    private auth: AuthService,
    private mallService: MallService,
    private memberService: MemberService,
    private uiService: UIService
  ) {}

  get userName(): string {
    return this.auth.user?.fullName || 'Super Admin';
  }

  ngOnInit(): void {
    this.loadMalls();
  }

  loadMalls(): void {
    this.loading = true;
    this.mallService.getAll().subscribe(malls => {
      this.malls = malls;
      this.loading = false;
    });
  }

  teamVisible = false;
  teamMall: Mall | null = null;
  teamMembers: MallMember[] = [];
  managerIdentifier = '';

  openTeam(mall: Mall): void {
    this.teamMall = mall;
    this.teamMembers = [];
    this.managerIdentifier = '';
    this.teamVisible = true;
    this.memberService.list(mall.id).subscribe(members => (this.teamMembers = members));
  }

  assignManager(): void {
    if (!this.teamMall || !this.managerIdentifier.trim()) return;
    this.saving = true;
    this.memberService.assignManager(this.teamMall.id, this.managerIdentifier.trim()).subscribe({
      next: () => {
        this.saving = false;
        this.managerIdentifier = '';
        this.uiService.showSuccess('Manager assigned');
        this.memberService.list(this.teamMall!.id).subscribe(members => (this.teamMembers = members));
      },
      error: () => { this.saving = false; }
    });
  }

  openCreate(): void {
    this.form = this.emptyForm();
    this.dialogVisible = true;
  }

  isFormValid(): boolean {
    return !!(this.form.name && this.form.companyName && this.form.address && this.form.taxId);
  }

  createMall(): void {
    if (!this.isFormValid()) return;
    this.saving = true;
    this.mallService.create(this.form).subscribe({
      next: () => {
        this.saving = false;
        this.dialogVisible = false;
        this.uiService.showSuccess('Mall created successfully');
        this.loadMalls();
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  private emptyForm(): CreateMallRequest {
    return { name: '', companyName: '', address: '', taxId: '' };
  }
}
