import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="avatar" 
      [class.avatar-lg]="size === 'large'"
      [class.avatar-sm]="size === 'small'"
      [style.background-color]="backgroundColor">
      {{ initials }}
    </div>
  `,
  styles: [`
    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: white;
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 16px;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .avatar-lg {
      width: 64px;
      height: 64px;
      font-size: 24px;
    }

    .avatar-sm {
      width: 32px;
      height: 32px;
      font-size: 14px;
    }
  `]
})
export class AvatarComponent {
  @Input() name: string = '';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  get initials(): string {
    if (!this.name) return '?';
    const parts = this.name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  get backgroundColor(): string {
    const colors = [
      '#4F8EF7', '#7C3AED', '#10B981', '#F59E0B', '#EF4444',
      '#EC4899', '#14B8A6', '#3B82F6', '#8B5CF6', '#F97316'
    ];
    let hash = 0;
    for (let i = 0; i < this.name.length; i++) {
      hash = this.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
}
