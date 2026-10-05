import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class UIService {
  sidebarCollapsed$ = new BehaviorSubject<boolean>(false);

  constructor(private messageService: MessageService) {}

  toggleSidebar(): void {
    this.sidebarCollapsed$.next(!this.sidebarCollapsed$.getValue());
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsed$.next(collapsed);
  }

  showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000
    });
  }

  showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000
    });
  }

  showInfo(message: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: message,
      life: 3000
    });
  }

  showWarning(message: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Warning',
      detail: message,
      life: 4000
    });
  }
}
