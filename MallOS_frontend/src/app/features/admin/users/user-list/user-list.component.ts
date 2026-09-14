import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { UIService } from '../../../../core/services/ui.service';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { SkeletonTableComponent } from '../../../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { User, UserRole } from '../../../../core/models/user.model';
import { MallService } from '../../../../core/services/mall.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    TagModule,
    ChipModule,
    AvatarComponent,
    SkeletonTableComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="user-list">
      <div class="page-header">
        <h1>Users</h1>
        <button class="btn btn-primary" (click)="goToCreate()">
          <i class="pi pi-plus"></i>
          <span>Create User</span>
        </button>
      </div>

      <div class="filters">
        <p-dropdown
          [options]="roleOptions"
          [(ngModel)]="selectedRole"
          (onChange)="filterUsers()"
          placeholder="All Roles"
          [style]="{ width: '200px' }">
        </p-dropdown>
        <input
          type="text"
          pInputText
          [(ngModel)]="searchQuery"
          (input)="filterUsers()"
          placeholder="Search users..."
          [style]="{ width: '300px' }">
      </div>

      <app-skeleton-table *ngIf="loading" [columns]="7" [rows]="10"></app-skeleton-table>

      <p-table
        *ngIf="!loading && filteredUsers.length > 0"
        [value]="filteredUsers"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[10, 20, 50]"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
        [styleClass]="'user-table'">
        
        <ng-template pTemplate="header">
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Assigned Mall</th>
            <th>Created</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-user>
          <tr>
            <td>
              <div class="user-cell">
                <app-avatar [name]="user.fullName" [size]="'small'"></app-avatar>
                <span class="user-name">{{ user.fullName }}</span>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <span class="badge badge-{{ getRoleClass(user.role) }}">{{ user.role }}</span>
            </td>
            <td>
              <p-chip *ngIf="user.mallId" [label]="getMallName(user.mallId)"></p-chip>
              <span *ngIf="!user.mallId" class="text-muted">-</span>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>{{ user.lastLogin ? formatDate(user.lastLogin) : 'Never' }}</td>
            <td>
              <div class="action-buttons">
                <button pButton pRipple type="button" icon="pi pi-pencil" class="p-button-rounded p-button-text" (click)="editUser(user.id)" title="Edit"></button>
                <button pButton pRipple type="button" icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" (click)="deleteUser(user)" title="Delete"></button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <app-empty-state
        *ngIf="!loading && filteredUsers.length === 0"
        icon="pi pi-users"
        title="No users found"
        description="There are no users matching your criteria."
        [actionLabel]="users.length === 0 ? 'Create User' : undefined"
        (actionClick)="goToCreate()">
      </app-empty-state>
    </div>
  `,
  styles: [`
    .user-list {
      max-width: var(--content-max-width);
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-name {
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    ::ng-deep .user-table .p-table-thead > tr > th {
      padding: 12px 16px;
    }

    ::ng-deep .user-table .p-table-tbody > tr > td {
      padding: 12px 16px;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .filters {
        flex-direction: column;
      }

      .filters ::ng-deep .p-dropdown,
      .filters ::ng-deep .p-inputtext {
        width: 100% !important;
      }
    }
  `]
})
export class UserListComponent implements OnInit {
  loading = true;
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedRole: UserRole | null = null;
  searchQuery = '';
  malls: any[] = [];
  roleOptions = [
    { label: 'All Roles', value: null },
    { label: 'Super Admin', value: 'SUPER_ADMIN' },
    { label: 'Mall Manager', value: 'MALL_USER' }
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private uiService: UIService,
    private mallService: MallService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadMalls();
  }

  loadUsers(): void {
    this.userService.getAll().subscribe(users => {
      this.users = users || [];
      this.filteredUsers = [...this.users];
      setTimeout(() => {
        this.loading = false;
      }, 600);
    });
  }

  loadMalls(): void {
    this.mallService.getAll().subscribe(malls => {
      this.malls = malls;
    });
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesRole = !this.selectedRole || user.role === this.selectedRole;
      const matchesSearch = !this.searchQuery || 
        user.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }

  getRoleClass(role: UserRole): string {
    if (role === 'SUPER_ADMIN') return 'accent';
    if (role === 'MALL_MANAGER' || role === 'MALL_USER') return 'primary';
    return 'muted';
  }

  getMallName(mallId: string): string {
    const mall = this.malls.find(m => m.id === mallId);
    return mall ? mall.name : 'Unknown';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  goToCreate(): void {
    this.router.navigate(['/admin/users/create']);
  }

  editUser(id: string): void {
    this.router.navigate(['/admin/users', id, 'edit']);
  }

  deleteUser(user: User): void {
    if (confirm(`Delete user "${user.fullName}"? This action cannot be undone.`)) {
      this.uiService.showSuccess('User deleted successfully');
      this.loadUsers();
    }
  }
}
