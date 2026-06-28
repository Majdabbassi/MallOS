import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComingSoonComponent } from '../../../shared/components/coming-soon/coming-soon.component';

@Component({
  selector: 'app-manager-coming-soon',
  standalone: true,
  imports: [CommonModule, ComingSoonComponent],
  template: `
    <div class="manager-coming-soon">
      <div class="page-header">
        <h1>{{ title }}</h1>
      </div>
      <app-coming-soon [module]="title" [icon]="icon"></app-coming-soon>
    </div>
  `,
  styles: [`
    .manager-coming-soon {
      max-width: var(--content-max-width);
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }
  `]
})
export class ManagerComingSoonComponent {
  title = 'Coming Soon';
  icon = 'pi pi-cog';
}
