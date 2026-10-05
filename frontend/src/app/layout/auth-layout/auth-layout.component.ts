import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="auth-layout">
      <div class="auth-background">
        <div class="gradient-orb"></div>
      </div>
      <div class="auth-container">
        <div class="auth-sidebar" *ngIf="!isMobile()">
          <div class="auth-sidebar-content">
            <div class="auth-logo">
              <div class="logo-icon">
                <i class="pi pi-building"></i>
              </div>
              <h1 class="logo-text">Mall OS</h1>
            </div>
            <div class="auth-tagline">
              <h2>The Future of Mall Management</h2>
              <p>Empowering mall operators with real-time insights, smart analytics, and seamless operations.</p>
            </div>
            <div class="auth-features">
              <div class="feature-item">
                <i class="pi pi-chart-line"></i>
                <span>Real-time Analytics</span>
              </div>
              <div class="feature-item">
                <i class="pi pi-users"></i>
                <span>Team Management</span>
              </div>
              <div class="feature-item">
                <i class="pi pi-wallet"></i>
                <span>Financial Tracking</span>
              </div>
              <div class="feature-item">
                <i class="pi pi-shield"></i>
                <span>Secure Access Control</span>
              </div>
            </div>
          </div>
        </div>
        <div class="auth-main">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg-base);
      position: relative;
      overflow: hidden;
    }

    .auth-background {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 0;
    }

    .gradient-orb {
      position: absolute;
      top: 0;
      left: 0;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--color-primary) 0%, var(--color-accent) 50%, transparent 70%);
      filter: blur(80px);
      opacity: 0.3;
      animation: gradientOrb 8s ease-in-out infinite;
    }

    @keyframes gradientOrb {
      0%, 100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0.3;
      }
      50% {
        transform: translate(-30%, -30%) scale(1.2);
        opacity: 0.4;
      }
    }

    .auth-container {
      display: flex;
      width: 100%;
      max-width: 1400px;
      height: 100vh;
      position: relative;
      z-index: 1;
    }

    .auth-sidebar {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .auth-sidebar-content {
      max-width: 480px;
    }

    .auth-logo {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 48px;
    }

    .logo-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
    }

    .logo-text {
      font-size: 32px;
      font-weight: 700;
      font-family: var(--font-display);
      color: var(--color-text-primary);
      margin: 0;
    }

    .auth-tagline {
      margin-bottom: 48px;
    }

    .auth-tagline h2 {
      font-size: 36px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 16px 0;
      line-height: 1.2;
    }

    .auth-tagline p {
      font-size: 16px;
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin: 0;
    }

    .auth-features {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 15px;
      color: var(--color-text-secondary);
    }

    .feature-item i {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      background: rgba(79, 142, 247, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);
      font-size: 16px;
    }

    .auth-main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    @media (max-width: 1024px) {
      .auth-sidebar {
        display: none;
      }

      .auth-main {
        flex: 1;
      }
    }

    @media (max-width: 768px) {
      .auth-main {
        padding: 24px;
      }
    }
  `]
})
export class AuthLayoutComponent {
  isMobile(): boolean {
    return window.innerWidth < 1024;
  }
}
