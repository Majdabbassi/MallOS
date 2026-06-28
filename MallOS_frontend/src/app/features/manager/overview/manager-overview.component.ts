import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MallService } from '../../../core/services/mall.service';
import { StoreService } from '../../../core/services/store.service';
import { Mall } from '../../../core/models/mall.model';
import { Store } from '../../../core/models/store.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-manager-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  template: `
    <div class="manager-overview">

      <!-- Page Header -->
      <app-page-header
        title="3D Mall View"
        [breadcrumbs]="[{ label: 'Dashboard', url: '/mall/dashboard' }, { label: '3D Mall View' }]">
      </app-page-header>

      <!-- Mall Info Strip -->
      <div class="mall-info-strip" *ngIf="mall">
        <div class="info-item">
          <span class="info-label">Mall</span>
          <span class="info-value">{{ mall.name }}</span>
        </div>
        <div class="info-divider"></div>
        <div class="info-item">
          <span class="info-label">Location</span>
          <span class="info-value">{{ mall.city }}, {{ mall.country }}</span>
        </div>
        <div class="info-divider"></div>
        <div class="info-item">
          <span class="info-label">Total Area</span>
          <span class="info-value">{{ mall.totalArea.toLocaleString() }} m²</span>
        </div>
        <div class="info-divider"></div>
        <div class="info-item">
          <span class="info-label">Floors</span>
          <span class="info-value">{{ mall.floorCount }}</span>
        </div>
        <div class="info-divider"></div>
        <div class="info-item">
          <span class="info-label">Status</span>
          <span class="status-badge" [ngClass]="'status-' + mall.status.toLowerCase()">
            <span class="status-dot"></span>
            {{ mall.status }}
          </span>
        </div>
      </div>

      <!-- 3D Map Section (The Pitch Centerpiece) -->
      <div class="map-section">

        <!-- Floor Tabs -->
        <div class="map-toolbar">
          <div class="floor-tabs">
            <button
              *ngFor="let floor of floors"
              class="floor-tab"
              [class.active]="activeFloor === floor.key"
              (click)="setFloor(floor.key)">
              {{ floor.label }}
            </button>
          </div>
          <div class="map-controls-right">
            <div class="live-badge">
              <span class="live-dot"></span>
              Live
            </div>
            <button class="map-btn" title="Zoom In" (click)="zoom('in')">
              <i class="pi pi-plus"></i>
            </button>
            <button class="map-btn" title="Zoom Out" (click)="zoom('out')">
              <i class="pi pi-minus"></i>
            </button>
            <button class="map-btn" title="Reset View" (click)="resetZoom()">
              <i class="pi pi-refresh"></i>
            </button>
          </div>
        </div>

        <!-- Map Viewport -->
        <div class="map-viewport">

          <!-- Isometric Map Visual -->
          <div class="map-canvas" [style.transform]="'scale(' + zoomLevel + ')'">
            <!-- SVG Isometric Mall Floor Plan -->
            <svg
              viewBox="0 0 900 520"
              xmlns="http://www.w3.org/2000/svg"
              class="mall-svg"
              (click)="onMapClick($event)">

              <!-- Background -->
              <defs>
                <linearGradient id="floorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#1C2333"/>
                  <stop offset="100%" style="stop-color:#111827"/>
                </linearGradient>
                <linearGradient id="wallGradN" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#2D3A52"/>
                  <stop offset="100%" style="stop-color:#1C2844"/>
                </linearGradient>
                <linearGradient id="wallGradS" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#1a2234"/>
                  <stop offset="100%" style="stop-color:#111827"/>
                </linearGradient>
                <filter id="storeGlow">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(0,0,0,0.5)"/>
                </filter>
              </defs>

              <!-- Parking lot background -->
              <ellipse cx="450" cy="480" rx="440" ry="50" fill="#0d1320" opacity="0.6"/>

              <!-- Main building footprint (isometric base) -->
              <!-- Top face (roof) -->
              <polygon
                points="450,60 750,210 450,360 150,210"
                fill="url(#floorGrad)"
                stroke="#1F2D45"
                stroke-width="1.5"/>

              <!-- Right wall -->
              <polygon
                points="750,210 750,270 450,420 450,360"
                fill="url(#wallGradS)"
                stroke="#1F2D45"
                stroke-width="1"/>

              <!-- Left wall -->
              <polygon
                points="150,210 150,270 450,420 450,360"
                fill="url(#wallGradN)"
                stroke="#1F2D45"
                stroke-width="1"/>

              <!-- Central atrium (lighter area) -->
              <polygon
                points="450,150 560,215 450,280 340,215"
                fill="#1e2d45"
                stroke="#2a3f60"
                stroke-width="1"/>
              <!-- Atrium inner circle (skylight) -->
              <ellipse cx="450" cy="215" rx="55" ry="32" fill="#243450" stroke="#3a5278" stroke-width="1.5"/>
              <ellipse cx="450" cy="215" rx="35" ry="20" fill="#0d1828" stroke="#4F8EF7" stroke-width="0.8" opacity="0.7"/>

              <!-- ── STORE ZONES ── -->

              <!-- Fashion Hub A-101 (violet) -->
              <g class="store-zone" (click)="selectStore('s-001', $event)">
                <polygon
                  points="230,155 340,215 340,260 230,200"
                  [attr.fill]="selectedStoreId === 's-001' ? '#7C3AED' : '#4a2580'"
                  stroke="#7C3AED"
                  stroke-width="1.5"
                  opacity="0.85"
                  class="zone-shape"/>
                <polygon
                  points="230,155 340,155 340,215 230,155"
                  fill="#6d35c0"
                  stroke="#7C3AED"
                  stroke-width="1"
                  opacity="0.7"/>
                <text x="270" y="200" class="zone-label" fill="#e2d4fa">Fashion</text>
                <text x="270" y="215" class="zone-code" fill="#c4aaee">A-101</text>
              </g>

              <!-- Coffee & Co A-103 (orange) -->
              <g class="store-zone" (click)="selectStore('s-003', $event)">
                <ellipse cx="450" cy="215" rx="55" ry="32" fill="transparent" stroke="none"/>
                <polygon
                  points="380,200 450,240 450,260 380,220"
                  [attr.fill]="selectedStoreId === 's-003' ? '#F97316' : '#7a3a0d'"
                  stroke="#F97316"
                  stroke-width="1.5"
                  opacity="0.85"
                  class="zone-shape"/>
                <text x="392" y="218" class="zone-label" fill="#fed7aa">Coffee</text>
                <text x="395" y="232" class="zone-code" fill="#fdba74">A-103</text>
              </g>

              <!-- Teshion Hub A-102 (teal) -->
              <g class="store-zone" (click)="selectStore('s-002', $event)">
                <polygon
                  points="340,255 450,315 450,360 340,300"
                  [attr.fill]="selectedStoreId === 's-002' ? '#0d9488' : '#0a4f49'"
                  stroke="#0d9488"
                  stroke-width="1.5"
                  opacity="0.85"
                  class="zone-shape"/>
                <polygon
                  points="340,255 450,255 450,315 340,255"
                  fill="#0b6b64"
                  stroke="#0d9488"
                  stroke-width="1"
                  opacity="0.7"/>
                <text x="370" y="300" class="zone-label" fill="#99f6e4">Teshion</text>
                <text x="375" y="315" class="zone-code" fill="#5eead4">A-102</text>
              </g>

              <!-- Kids Land A-107 (yellow) -->
              <g class="store-zone" (click)="selectStore('s-007', $event)">
                <polygon
                  points="450,315 560,255 560,300 450,360"
                  [attr.fill]="selectedStoreId === 's-007' ? '#ca8a04' : '#5a3d03'"
                  stroke="#EAB308"
                  stroke-width="1.5"
                  opacity="0.85"
                  class="zone-shape"/>
                <polygon
                  points="450,315 560,315 560,255 450,315"
                  fill="#7a5004"
                  stroke="#EAB308"
                  stroke-width="1"
                  opacity="0.7"/>
                <text x="480" y="305" class="zone-label" fill="#fef08a">Kids Land</text>
                <text x="490" y="320" class="zone-code" fill="#fde047">A-107</text>
              </g>

              <!-- Supermarket Plus A-106 (green) -->
              <g class="store-zone" (click)="selectStore('s-006', $event)">
                <polygon
                  points="560,255 670,195 670,240 560,300"
                  [attr.fill]="selectedStoreId === 's-006' ? '#16a34a' : '#0d4a26'"
                  stroke="#10B981"
                  stroke-width="1.5"
                  opacity="0.85"
                  class="zone-shape"/>
                <polygon
                  points="560,255 670,255 670,195 560,255"
                  fill="#115e35"
                  stroke="#10B981"
                  stroke-width="1"
                  opacity="0.7"/>
                <text x="585" y="248" class="zone-label" fill="#bbf7d0">Supermarket</text>
                <text x="600" y="262" class="zone-code" fill="#86efac">A-106</text>
              </g>

              <!-- Sport Zone A-104 (blue) -->
              <g class="store-zone" (click)="selectStore('s-004', $event)">
                <polygon
                  points="560,155 670,95 670,145 560,205"
                  [attr.fill]="selectedStoreId === 's-004' ? '#2563eb' : '#1a3a8f'"
                  stroke="#3B82F6"
                  stroke-width="1.5"
                  opacity="0.85"
                  class="zone-shape"/>
                <polygon
                  points="560,155 670,155 670,95 560,155"
                  fill="#1d4290"
                  stroke="#3B82F6"
                  stroke-width="1"
                  opacity="0.7"/>
                <text x="585" y="143" class="zone-label" fill="#bfdbfe">Sport Zone</text>
                <text x="595" y="158" class="zone-code" fill="#93c5fd">A-104</text>
              </g>

              <!-- Book World A-105 (pink) -->
              <g class="store-zone" (click)="selectStore('s-005', $event)">
                <polygon
                  points="340,155 450,95 450,140 340,200"
                  [attr.fill]="selectedStoreId === 's-005' ? '#be185d' : '#6b0f35'"
                  stroke="#EC4899"
                  stroke-width="1.5"
                  opacity="0.85"
                  class="zone-shape"/>
                <polygon
                  points="340,155 450,155 450,95 340,155"
                  fill="#7c1041"
                  stroke="#EC4899"
                  stroke-width="1"
                  opacity="0.7"/>
                <text x="360" y="148" class="zone-label" fill="#fce7f3">Book World</text>
                <text x="368" y="163" class="zone-code" fill="#f9a8d4">A-105</text>
              </g>

              <!-- Maintenance Area (red warning) -->
              <g class="store-zone maintenance" (click)="selectStore('maintenance', $event)">
                <polygon
                  points="450,190 520,228 520,260 450,222"
                  fill="#4a1010"
                  stroke="#EF4444"
                  stroke-width="1.5"
                  opacity="0.85"
                  stroke-dasharray="4,2"/>
                <text x="462" y="218" class="zone-label warning-text" fill="#fca5a5">⚠ Maint.</text>
              </g>

              <!-- Escalators (center) -->
              <rect x="435" y="205" width="30" height="22" rx="3" fill="#243450" stroke="#4F8EF7" stroke-width="1" opacity="0.8"/>
              <line x1="441" y1="210" x2="459" y2="224" stroke="#4F8EF7" stroke-width="1" opacity="0.6"/>
              <line x1="445" y1="210" x2="463" y2="224" stroke="#4F8EF7" stroke-width="1" opacity="0.6"/>

              <!-- Building outer accent lines -->
              <line x1="450" y1="60" x2="450" y2="360" stroke="#1F2D45" stroke-width="0.5" stroke-dasharray="4,6" opacity="0.4"/>
              <line x1="150" y1="210" x2="750" y2="210" stroke="#1F2D45" stroke-width="0.5" stroke-dasharray="4,6" opacity="0.4"/>

              <!-- Corner markers -->
              <circle cx="450" cy="60" r="3" fill="#4F8EF7" opacity="0.6"/>
              <circle cx="750" cy="210" r="3" fill="#4F8EF7" opacity="0.6"/>
              <circle cx="150" cy="210" r="3" fill="#4F8EF7" opacity="0.6"/>
              <circle cx="450" cy="360" r="3" fill="#4F8EF7" opacity="0.6"/>

            </svg>

            <!-- Store tooltip popup -->
            <div class="store-popup" *ngIf="selectedStore" [style.display]="'block'">
              <div class="popup-header">
                <span class="popup-code">{{ selectedStore.code }}</span>
                <button class="popup-close" (click)="clearSelection()">✕</button>
              </div>
              <div class="popup-name">{{ selectedStore.name }}</div>
              <div class="popup-details">
                <div class="popup-row">
                  <span class="popup-label">Category</span>
                  <span class="popup-value category-badge">{{ selectedStore.category.replace('_', ' ') }}</span>
                </div>
                <div class="popup-row">
                  <span class="popup-label">Surface</span>
                  <span class="popup-value">{{ selectedStore.surface }} m²</span>
                </div>
                <div class="popup-row">
                  <span class="popup-label">Floor</span>
                  <span class="popup-value">{{ selectedStore.floor === 0 ? 'Ground' : 'Floor ' + selectedStore.floor }}</span>
                </div>
                <div class="popup-row">
                  <span class="popup-label">Status</span>
                  <span class="popup-value" [ngClass]="'text-status-' + selectedStore.status.toLowerCase()">{{ selectedStore.status }}</span>
                </div>
                <div class="popup-row">
                  <span class="popup-label">Owner</span>
                  <span class="popup-value">{{ selectedStore.ownerName || '—' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Phase 2 Badge -->
          <div class="phase-badge">
            <i class="pi pi-sparkles"></i>
            Interactive 3D Map — Phase 2
          </div>

          <!-- Live Sensors Strip -->
          <div class="sensors-strip">
            <div class="sensor-item">
              <span class="sensor-icon temp">🌡</span>
              <span class="sensor-label">Temp</span>
              <span class="sensor-value">22.5°C</span>
              <span class="sensor-wave">〰〰</span>
            </div>
            <div class="sensor-divider"></div>
            <div class="sensor-item">
              <span class="sensor-icon humid">💧</span>
              <span class="sensor-label">Humidity</span>
              <span class="sensor-value">54%</span>
              <span class="sensor-wave">〰〰</span>
            </div>
            <div class="sensor-divider"></div>
            <div class="sensor-item">
              <span class="sensor-icon energy">⚡</span>
              <span class="sensor-label">Energy</span>
              <span class="sensor-value">785 kW</span>
              <span class="sensor-wave">〰〰</span>
            </div>
            <div class="sensor-divider"></div>
            <div class="sensor-item">
              <span class="sensor-icon traffic">👥</span>
              <span class="sensor-label">Foot Traffic</span>
              <span class="sensor-value traffic-high">High</span>
              <span class="sensor-wave">〰〰</span>
            </div>
            <div class="sensor-divider"></div>
            <div class="sensor-item">
              <span class="sensor-icon air">🍃</span>
              <span class="sensor-label">Air Quality</span>
              <span class="sensor-value traffic-good">Good</span>
              <span class="sensor-wave">〰〰</span>
            </div>
          </div>

          <!-- Mini-map -->
          <div class="minimap">
            <div class="minimap-title">Overview</div>
            <svg viewBox="0 0 100 60" class="minimap-svg">
              <rect x="5" y="5" width="90" height="50" rx="2" fill="#1C2333" stroke="#2D3A52"/>
              <polygon points="50,10 75,25 50,40 25,25" fill="#243450" stroke="#2a3f60"/>
              <rect x="20" y="15" width="15" height="10" fill="#4a2580" opacity="0.8"/>
              <rect x="65" y="15" width="15" height="10" fill="#1a3a8f" opacity="0.8"/>
              <rect x="20" y="35" width="15" height="10" fill="#0a4f49" opacity="0.8"/>
              <rect x="65" y="35" width="15" height="10" fill="#0d4a26" opacity="0.8"/>
              <rect x="43" y="20" width="14" height="10" fill="#243450" stroke="#4F8EF7" stroke-width="0.5"/>
              <!-- Viewport indicator -->
              <rect x="10" y="8" width="80" height="44" rx="1" fill="none" stroke="#4F8EF7" stroke-width="1" opacity="0.5"/>
            </svg>
          </div>

        </div>
      </div>

      <!-- Stats + Charts Row -->
      <div class="analytics-row">

        <!-- Occupancy by Zone -->
        <div class="analytics-card">
          <div class="analytics-header">
            <h3>Stores by Category</h3>
            <span class="analytics-badge">{{ stores.length }} total</span>
          </div>
          <div class="category-bars">
            <div class="bar-row" *ngFor="let cat of categoryStats">
              <span class="bar-label">{{ cat.label }}</span>
              <div class="bar-track">
                <div class="bar-fill" [style.width]="cat.percentage + '%'" [style.background]="cat.color"></div>
              </div>
              <span class="bar-count">{{ cat.count }}</span>
            </div>
          </div>
        </div>

        <!-- Floor Distribution -->
        <div class="analytics-card">
          <div class="analytics-header">
            <h3>Stores by Floor</h3>
          </div>
          <div class="floor-stats">
            <div class="floor-stat-item" *ngFor="let f of floorStats">
              <div class="floor-stat-label">
                <span class="floor-name">{{ f.name }}</span>
                <span class="floor-count">{{ f.occupied }}/{{ f.total }} stores</span>
              </div>
              <div class="floor-bar-track">
                <div class="floor-bar-fill" [style.width]="(f.occupied / f.total * 100) + '%'"></div>
              </div>
              <span class="floor-pct">{{ (f.occupied / f.total * 100) | number:'1.0-0' }}%</span>
            </div>
          </div>
        </div>

        <!-- Live Today Stats -->
        <div class="analytics-card today-card">
          <div class="analytics-header">
            <h3>Today</h3>
            <span class="live-pulse">● LIVE</span>
          </div>
          <div class="today-stats">
            <div class="today-stat">
              <div class="today-icon visitors">👥</div>
              <div class="today-info">
                <div class="today-value">{{ mall?.visitorsToday?.toLocaleString() || '8,142' }}</div>
                <div class="today-label">Visitors</div>
                <div class="today-trend">+12.5% vs yesterday</div>
              </div>
            </div>
            <div class="today-divider"></div>
            <div class="today-stat">
              <div class="today-icon sales">💰</div>
              <div class="today-info">
                <div class="today-value">{{ mall?.salesToday?.toLocaleString() || '128,430' }} TND</div>
                <div class="today-label">Sales</div>
                <div class="today-trend">+8.3% vs yesterday</div>
              </div>
            </div>
          </div>
          <div class="today-time">Last updated: {{ currentTime }}</div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .manager-overview {
      max-width: var(--content-max-width);
      margin: 0 auto;
      padding-bottom: 48px;
    }

    /* ── Mall Info Strip ── */
    .mall-info-strip {
      display: flex;
      align-items: center;
      gap: 20px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 14px 24px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-text-muted);
    }
    .info-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
    }
    .info-divider {
      width: 1px;
      height: 32px;
      background: var(--color-border);
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .status-active .status-dot { background: var(--color-success); box-shadow: 0 0 6px var(--color-success); }
    .status-active { color: var(--color-success); }
    .status-pending .status-dot { background: var(--color-warning); }
    .status-pending { color: var(--color-warning); }
    .status-inactive .status-dot { background: var(--color-danger); }
    .status-inactive { color: var(--color-danger); }

    /* ── Map Section ── */
    .map-section {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      overflow: hidden;
      margin-bottom: 24px;
    }

    .map-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-elevated);
    }

    .floor-tabs {
      display: flex;
      gap: 4px;
    }
    .floor-tab {
      padding: 6px 16px;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      background: transparent;
      color: var(--color-text-secondary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }
    .floor-tab:hover {
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
    }
    .floor-tab.active {
      background: var(--color-primary);
      color: #fff;
      border-color: var(--color-primary);
    }

    .map-controls-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .live-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-success);
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 20px;
      padding: 4px 12px;
    }
    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-success);
      animation: pulse-dot 1.5s infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    .map-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      background: var(--color-bg-surface);
      color: var(--color-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
      font-size: 12px;
    }
    .map-btn:hover {
      background: var(--color-primary);
      color: #fff;
      border-color: var(--color-primary);
    }

    /* ── Map Viewport ── */
    .map-viewport {
      position: relative;
      height: 520px;
      background: radial-gradient(ellipse at center, #0d1828 0%, #080e1a 100%);
      overflow: hidden;
      cursor: grab;
    }
    .map-viewport:active { cursor: grabbing; }

    /* Dot grid background */
    .map-viewport::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle, #1F2D45 1px, transparent 1px);
      background-size: 32px 32px;
      opacity: 0.4;
      pointer-events: none;
    }

    .map-canvas {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
      transform-origin: center center;
    }

    .mall-svg {
      width: 900px;
      height: 520px;
      max-width: 100%;
    }

    /* Store zones */
    .store-zone {
      cursor: pointer;
      transition: all 0.2s;
    }
    .store-zone:hover .zone-shape {
      filter: brightness(1.3);
    }
    .zone-shape {
      transition: filter 0.2s;
    }
    .zone-label {
      font-size: 11px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      pointer-events: none;
    }
    .zone-code {
      font-size: 9px;
      font-family: 'JetBrains Mono', monospace;
      pointer-events: none;
      opacity: 0.8;
    }
    .warning-text {
      font-size: 10px !important;
    }

    /* Store Popup */
    .store-popup {
      position: absolute;
      top: 20px;
      left: 20px;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 16px;
      min-width: 220px;
      box-shadow: var(--shadow-elevated);
      z-index: 10;
      animation: fadeInUp 0.15s ease;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .popup-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: var(--color-primary);
      background: rgba(79, 142, 247, 0.1);
      border: 1px solid rgba(79, 142, 247, 0.2);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
    }
    .popup-close {
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 13px;
      padding: 0;
      line-height: 1;
    }
    .popup-close:hover { color: var(--color-text-primary); }
    .popup-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 12px;
    }
    .popup-details { display: flex; flex-direction: column; gap: 6px; }
    .popup-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
    }
    .popup-label { color: var(--color-text-muted); }
    .popup-value { color: var(--color-text-primary); font-weight: 500; }
    .text-status-open { color: var(--color-success); }
    .text-status-closed { color: var(--color-danger); }
    .text-status-under_renovation { color: var(--color-warning); }
    .text-status-vacant { color: var(--color-text-muted); }

    /* Phase 2 Badge */
    .phase-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(124, 58, 237, 0.2);
      border: 1px solid rgba(124, 58, 237, 0.4);
      color: #c4b5fd;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.03em;
      z-index: 5;
    }

    /* Sensors Strip */
    .sensors-strip {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(10, 15, 30, 0.85);
      backdrop-filter: blur(12px);
      border-top: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding: 10px 24px;
      z-index: 5;
    }
    .sensor-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 20px;
    }
    .sensor-icon { font-size: 16px; }
    .sensor-label { font-size: 11px; color: var(--color-text-muted); }
    .sensor-value { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
    .sensor-wave { color: var(--color-success); font-size: 11px; opacity: 0.7; }
    .traffic-high { color: var(--color-warning) !important; }
    .traffic-good { color: var(--color-success) !important; }
    .sensor-divider {
      width: 1px;
      height: 28px;
      background: var(--color-border);
      flex-shrink: 0;
    }

    /* Mini-map */
    .minimap {
      position: absolute;
      bottom: 60px;
      right: 16px;
      background: rgba(10, 15, 30, 0.9);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 8px;
      width: 120px;
      z-index: 5;
    }
    .minimap-title {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-text-muted);
      margin-bottom: 6px;
      text-align: center;
    }
    .minimap-svg { width: 100%; }

    /* ── Analytics Row ── */
    .analytics-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }

    .analytics-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 20px;
    }
    .analytics-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .analytics-header h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }
    .analytics-badge {
      font-size: 11px;
      background: var(--color-bg-elevated);
      color: var(--color-text-secondary);
      padding: 2px 8px;
      border-radius: 20px;
    }

    /* Category Bars */
    .category-bars { display: flex; flex-direction: column; gap: 10px; }
    .bar-row { display: flex; align-items: center; gap: 10px; }
    .bar-label { font-size: 12px; color: var(--color-text-secondary); width: 90px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bar-track { flex: 1; height: 6px; background: var(--color-bg-elevated); border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
    .bar-count { font-size: 12px; color: var(--color-text-muted); width: 16px; text-align: right; }

    /* Floor Stats */
    .floor-stats { display: flex; flex-direction: column; gap: 16px; }
    .floor-stat-item { display: flex; align-items: center; gap: 12px; }
    .floor-stat-label { display: flex; flex-direction: column; gap: 2px; width: 100px; flex-shrink: 0; }
    .floor-name { font-size: 13px; color: var(--color-text-primary); font-weight: 500; }
    .floor-count { font-size: 11px; color: var(--color-text-muted); }
    .floor-bar-track { flex: 1; height: 8px; background: var(--color-bg-elevated); border-radius: 4px; overflow: hidden; }
    .floor-bar-fill { height: 100%; background: var(--color-primary); border-radius: 4px; transition: width 0.6s ease; }
    .floor-pct { font-size: 12px; color: var(--color-text-secondary); width: 36px; text-align: right; }

    /* Today Card */
    .today-card { display: flex; flex-direction: column; }
    .live-pulse {
      font-size: 11px;
      font-weight: 700;
      color: var(--color-success);
      animation: pulse-text 1.5s infinite;
    }
    @keyframes pulse-text {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .today-stats { display: flex; flex-direction: column; gap: 0; flex: 1; }
    .today-stat { display: flex; align-items: center; gap: 16px; padding: 12px 0; }
    .today-divider { height: 1px; background: var(--color-border); }
    .today-icon { font-size: 28px; }
    .today-info { display: flex; flex-direction: column; gap: 2px; }
    .today-value { font-size: 20px; font-weight: 700; color: var(--color-text-primary); font-family: 'Space Grotesk', sans-serif; }
    .today-label { font-size: 12px; color: var(--color-text-secondary); }
    .today-trend { font-size: 11px; color: var(--color-success); }
    .today-time { font-size: 11px; color: var(--color-text-muted); margin-top: 12px; text-align: right; }

    /* Responsive */
    @media (max-width: 1024px) {
      .analytics-row { grid-template-columns: 1fr 1fr; }
      .today-card { grid-column: 1 / -1; }
    }
    @media (max-width: 768px) {
      .analytics-row { grid-template-columns: 1fr; }
      .map-viewport { height: 380px; }
      .sensors-strip { flex-wrap: wrap; gap: 4px; }
    }
  `]
})
export class ManagerOverviewComponent implements OnInit, OnDestroy {

  mall: Mall | null = null;
  stores: Store[] = [];
  selectedStoreId: string | null = null;
  selectedStore: Store | null = null;
  activeFloor: string = 'ground';
  zoomLevel: number = 1;
  currentTime: string = '';
  private timeInterval: any;

  floors = [
    { key: 'overview', label: 'Overview' },
    { key: 'ground', label: 'Ground Floor' },
    { key: 'floor1', label: 'First Floor' },
    { key: 'floor2', label: 'Second Floor' },
  ];

  categoryStats: { label: string; count: number; percentage: number; color: string }[] = [];
  floorStats: { name: string; total: number; occupied: number }[] = [];

  constructor(
    private authService: AuthService,
    private mallService: MallService,
    private storeService: StoreService
  ) {}

  ngOnInit(): void {
    const user = this.authService.user;
    if (user?.mallId) {
      this.mallService.getById(user.mallId).subscribe(mall => {
        this.mall = mall || null;
      });
      this.storeService.getByMallId(user.mallId).subscribe(stores => {
        this.stores = stores;
        this.buildStats();
      });
    }
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 60000);
  }

  ngOnDestroy(): void {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }

  updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  setFloor(floor: string): void {
    this.activeFloor = floor;
  }

  zoom(direction: 'in' | 'out'): void {
    if (direction === 'in') this.zoomLevel = Math.min(1.5, this.zoomLevel + 0.1);
    else this.zoomLevel = Math.max(0.6, this.zoomLevel - 0.1);
  }

  resetZoom(): void {
    this.zoomLevel = 1;
  }

  selectStore(storeId: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedStoreId === storeId) {
      this.clearSelection();
      return;
    }
    this.selectedStoreId = storeId;
    this.selectedStore = this.stores.find(s => s.id === storeId) || null;
  }

  clearSelection(): void {
    this.selectedStoreId = null;
    this.selectedStore = null;
  }

  onMapClick(event: Event): void {
    this.clearSelection();
  }

  buildStats(): void {
    // Category stats
    const categoryMap: { [key: string]: { count: number; color: string; label: string } } = {
      FASHION:        { count: 0, color: '#7C3AED', label: 'Fashion' },
      FOOD_BEVERAGE:  { count: 0, color: '#F97316', label: 'Food & Bev' },
      ELECTRONICS:    { count: 0, color: '#3B82F6', label: 'Electronics' },
      HEALTH_BEAUTY:  { count: 0, color: '#EC4899', label: 'Health & Beauty' },
      SPORTS:         { count: 0, color: '#10B981', label: 'Sports' },
      ENTERTAINMENT:  { count: 0, color: '#EAB308', label: 'Entertainment' },
      BOOKS_GIFTS:    { count: 0, color: '#14B8A6', label: 'Books & Gifts' },
      OTHER:          { count: 0, color: '#64748B', label: 'Other' },
    };

    this.stores.forEach(s => {
      if (categoryMap[s.category]) categoryMap[s.category].count++;
    });

    const maxCount = Math.max(...Object.values(categoryMap).map(v => v.count), 1);
    this.categoryStats = Object.entries(categoryMap)
      .filter(([, v]) => v.count > 0)
      .map(([, v]) => ({
        label: v.label,
        count: v.count,
        color: v.color,
        percentage: Math.round((v.count / maxCount) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Floor stats
    const floorMap: { [key: number]: { total: number; occupied: number } } = {};
    this.stores.forEach(s => {
      if (!floorMap[s.floor]) floorMap[s.floor] = { total: 0, occupied: 0 };
      floorMap[s.floor].total++;
      if (s.status === 'OPEN') floorMap[s.floor].occupied++;
    });

    this.floorStats = Object.entries(floorMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([floor, data]) => ({
        name: floor === '0' ? 'Ground Floor' : `Floor ${floor}`,
        total: data.total,
        occupied: data.occupied
      }));
  }
}