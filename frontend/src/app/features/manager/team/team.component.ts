import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { MemberService } from '../../../core/services/member.service';
import { UIService } from '../../../core/services/ui.service';
import { ALL_PERMISSIONS, MallMember, MallPermission } from '../../../core/models/member.model';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, DialogModule],
  template: `
    <div class="team-page">
      <div class="page-head">
        <div>
          <h1>Team</h1>
          <p class="text-secondary">People who work on this mall and what they are allowed to do</p>
        </div>
        <button pButton type="button" icon="pi pi-user-plus" label="Invite assistant" (click)="openInvite()"></button>
      </div>

      <p-table [value]="members" [loading]="loading" styleClass="team-table">
        <ng-template pTemplate="header">
          <tr>
            <th>Member</th>
            <th>Role</th>
            <th>Permissions</th>
            <th class="actions-col"></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-m>
          <tr>
            <td>
              <div class="member-name">{{ m.username }}</div>
              <div class="member-email">{{ m.email }}</div>
            </td>
            <td><span class="role-badge" [class.manager]="m.role === 'MANAGER'">{{ m.role }}</span></td>
            <td>
              <span *ngIf="m.role === 'MANAGER'" class="perm-chip all">Full access</span>
              <ng-container *ngIf="m.role === 'ASSISTANT'">
                <span class="perm-chip" *ngFor="let p of m.permissions">{{ label(p) }}</span>
              </ng-container>
            </td>
            <td class="actions-col">
              <ng-container *ngIf="m.role === 'ASSISTANT'">
                <button pButton type="button" class="p-button-text p-button-sm" icon="pi pi-pencil"
                        label="Permissions" (click)="openPermissions(m)"></button>
                <button pButton type="button" class="p-button-text p-button-sm p-button-danger" icon="pi pi-trash"
                        label="Remove" (click)="remove(m)"></button>
              </ng-container>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="4" class="empty-cell">No team members yet.</td></tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [header]="editing ? 'Permissions of ' + editing.username : 'Invite an assistant'"
              [(visible)]="dialogVisible" [modal]="true" [style]="{ width: '460px' }">
      <div class="dialog-form">
        <div class="form-group" *ngIf="!editing">
          <label for="invitee">Username or email of a registered user</label>
          <input id="invitee" pInputText [(ngModel)]="invitee" placeholder="e.g. assistant" />
        </div>
        <div class="form-group">
          <label>What can they do?</label>
          <label class="perm-option" *ngFor="let p of allPermissions">
            <input type="checkbox" [checked]="selected.has(p.value)" (change)="toggle(p.value)" />
            {{ p.label }}
          </label>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancel" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton type="button" icon="pi pi-check" [label]="editing ? 'Save' : 'Invite'"
                [disabled]="saving || selected.size === 0 || (!editing && !invitee.trim())" (click)="save()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .team-page { padding: 24px 0; }
    .page-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    h1 { margin: 0 0 4px; font-size: 28px; }
    .text-secondary { margin: 0; color: var(--color-text-secondary, #94a3b8); }
    .member-name { font-weight: 600; }
    .member-email { font-size: 13px; color: var(--color-text-secondary, #94a3b8); }
    .role-badge { padding: 2px 10px; border-radius: 999px; font-size: 12px; background: rgba(148,163,184,.18); }
    .role-badge.manager { background: rgba(59,130,246,.2); color: #60a5fa; }
    .perm-chip { display: inline-block; margin: 2px 6px 2px 0; padding: 2px 10px; border-radius: 6px;
                 font-size: 12px; background: rgba(99,102,241,.16); color: #a5b4fc; }
    .perm-chip.all { background: rgba(34,197,94,.16); color: #4ade80; }
    .actions-col { text-align: right; white-space: nowrap; }
    .empty-cell { text-align: center; padding: 24px; color: var(--color-text-secondary, #94a3b8); }
    .dialog-form { display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .perm-option { display: flex; align-items: center; gap: 10px; font-weight: 400; cursor: pointer; }
  `]
})
export class TeamComponent implements OnInit {
  members: MallMember[] = [];
  loading = true;
  dialogVisible = false;
  saving = false;
  editing: MallMember | null = null;
  invitee = '';
  selected = new Set<MallPermission>();
  readonly allPermissions = ALL_PERMISSIONS;

  constructor(private auth: AuthService, private memberService: MemberService, private ui: UIService) {}

  private get mallId(): string | undefined {
    return this.auth.user?.mallId;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.mallId) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.memberService.list(this.mallId).subscribe({
      next: members => { this.members = members; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  label(p: MallPermission): string {
    return this.allPermissions.find(x => x.value === p)?.label ?? p;
  }

  openInvite(): void {
    this.editing = null;
    this.invitee = '';
    this.selected = new Set<MallPermission>(['VIEW_REPORTS']);
    this.dialogVisible = true;
  }

  openPermissions(member: MallMember): void {
    this.editing = member;
    this.selected = new Set<MallPermission>(member.permissions);
    this.dialogVisible = true;
  }

  toggle(p: MallPermission): void {
    if (this.selected.has(p)) {
      this.selected.delete(p);
    } else {
      this.selected.add(p);
    }
  }

  save(): void {
    if (!this.mallId) return;
    this.saving = true;
    const permissions = [...this.selected];
    const request = this.editing
      ? this.memberService.updatePermissions(this.mallId, this.editing.userId, permissions)
      : this.memberService.inviteAssistant(this.mallId, this.invitee.trim(), permissions);
    request.subscribe({
      next: () => {
        this.saving = false;
        this.dialogVisible = false;
        this.ui.showSuccess(this.editing ? 'Permissions updated' : 'Assistant invited');
        this.load();
      },
      error: () => { this.saving = false; }
    });
  }

  remove(member: MallMember): void {
    if (!this.mallId || !confirm(`Remove ${member.username} from the team?`)) return;
    this.memberService.removeAssistant(this.mallId, member.userId).subscribe(() => {
      this.ui.showSuccess(`${member.username} removed`);
      this.load();
    });
  }
}
