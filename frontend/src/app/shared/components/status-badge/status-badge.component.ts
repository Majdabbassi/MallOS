import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="'badge badge-' + statusClass">{{ label }}</span>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = '';
  @Input() label: string = '';

  get statusClass(): string {
    const statusLower = this.status.toLowerCase();
    
    if (['active', 'open'].includes(statusLower)) {
      return 'success';
    }
    if (['pending', 'under_renovation', 'maintenance'].includes(statusLower)) {
      return 'warning';
    }
    if (['inactive', 'closed', 'suspended'].includes(statusLower)) {
      return 'danger';
    }
    if (['vacant'].includes(statusLower)) {
      return 'muted';
    }
    
    return 'primary';
  }
}
