import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import Konva from 'konva';
import { AuthService } from '../../../core/services/auth.service';
import { FloorplanService } from '../../../core/services/floorplan.service';
import { FinanceService } from '../../../core/services/finance.service';
import { LeaseState, UnitState } from '../../../core/models/finance.model';
import {
  FloorResponse, PolygonResponse, GeometryResponse,
  POLYGON_TYPE_COLORS, STORE_STATUS_COLORS, PolygonType, StoreStatus
} from '../../../core/models/floorplan.model';

@Component({
  selector: 'app-floor-map-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="viewer-layout">

      <!-- Page Header -->
      <div class="viewer-header">
        <div class="header-left">
          <h1 class="header-title">
            <i class="ph ph-map-trifold"></i>
            Floor Plan
          </h1>
          <p class="header-sub">Interactive mall floor map</p>
        </div>
        <div class="header-right">
          <!-- Floor tabs -->
          <div class="floor-tabs" *ngIf="floors.length > 1">
            <button
              *ngFor="let f of floors"
              class="floor-tab"
              [class.active]="selectedFloor?.id === f.id"
              (click)="selectFloor(f)">
              {{ f.name }}
            </button>
          </div>
          <!-- Manager: edit button -->
          <button class="btn-edit" *ngIf="isManager && selectedFloor"
                  (click)="openEditor()">
            <i class="ph ph-pencil-simple"></i>
            Edit Floor Plan
          </button>
          <!-- Manager: upload new floor -->
          <button class="btn-upload" *ngIf="isManager"
                  (click)="openNewFloor()">
            <i class="ph ph-plus"></i>
            New Floor
          </button>
        </div>
      </div>

      <!-- No floors state -->
      <div class="no-floors" *ngIf="floors.length === 0 && !loading">
        <div class="no-floors-card">
          <i class="ph ph-map-trifold"></i>
          <h2>No Floor Plans Yet</h2>
          <p>Upload a floor plan image and trace the store units to get started.</p>
          <button class="btn-primary" *ngIf="isManager" (click)="openNewFloor()">
            <i class="ph ph-plus"></i>
            Upload Floor Plan
          </button>
        </div>
      </div>

      <!-- Main area -->
      <div class="viewer-body" *ngIf="floors.length > 0">

        <!-- Map canvas -->
        <div class="map-area" (click)="onBackgroundClick()">

          <!-- Loading -->
          <div class="map-loading" *ngIf="loading">
            <div class="spinner"></div>
            <span>Loading floor plan…</span>
          </div>

          <!-- Pending trace warning (non-COMPLETED status) -->
          <div class="pending-trace" *ngIf="!loading && selectedFloor && selectedFloor.status !== 'COMPLETED'">
            <div class="pending-card">
              <i class="ph ph-pencil-line"></i>
              <h3>Floor Plan In Progress</h3>
              <p>
                This floor is
                <span class="status-chip status-{{ selectedFloor.status.toLowerCase() }}">
                  {{ selectedFloor.status }}
                </span>
                — it will appear here once a manager marks it as Completed.
              </p>
              <button class="btn-edit" *ngIf="isManager" (click)="openEditor()">
                <i class="ph ph-pencil-simple"></i>
                Continue Tracing
              </button>
            </div>
          </div>

          <!-- Konva canvas (only shown when COMPLETED) -->
          <div class="konva-wrapper" #konvaContainer
               *ngIf="!loading && selectedFloor?.status === 'COMPLETED'">
          </div>

          <!-- Zoom controls -->
          <div class="zoom-controls" *ngIf="selectedFloor?.status === 'COMPLETED'">
            <button class="zoom-btn" (click)="zoomIn()" title="Zoom in"><i class="ph ph-plus"></i></button>
            <button class="zoom-btn" (click)="zoomReset()" title="Reset zoom"><i class="ph ph-arrows-in"></i></button>
            <button class="zoom-btn" (click)="zoomOut()" title="Zoom out"><i class="ph ph-minus"></i></button>
          </div>

          <!-- Legend -->
          <div class="legend" *ngIf="selectedFloor?.status === 'COMPLETED'">
            <button type="button" class="lease-toggle" [class.on]="leaseView" (click)="toggleLeaseView()"
                    title="Colour the stores by lease: vacant, ending soon, leased">
              <i class="ph ph-key"></i> {{ leaseView ? 'Showing leases' : 'Show leases' }}
            </button>
            <div class="legend-item" *ngFor="let l of legendItems">
              <span class="legend-dot" [style.background]="l.color"></span>
              {{ l.label }}
            </div>
          </div>
        </div>

        <!-- Detail side panel -->
        <div class="detail-panel" [class.open]="selectedPolygon !== null">
          <ng-container *ngIf="selectedPolygon">

            <div class="panel-header">
              <div class="panel-type-badge" [style.background]="getTypeColor(selectedPolygon.polygonType)">
                {{ selectedPolygon.polygonType.replace('_', ' ') }}
              </div>
              <button class="btn-icon-sm" (click)="clearSelection()" title="Close">
                <i class="ph ph-x"></i>
              </button>
            </div>

            <h2 class="panel-title">{{ selectedPolygon.label || 'Unnamed Unit' }}</h2>

            <!-- Store info -->
            <ng-container *ngIf="selectedPolygon.store; else noStore">
              <div class="store-section">
                <div class="store-header-row">
                  <div class="store-name-block">
                    <span class="store-name">{{ selectedPolygon.store.name }}</span>
                    <span class="store-code">{{ selectedPolygon.store.code }}</span>
                  </div>
                  <span class="store-status-badge"
                        [style.background]="getStatusBg(selectedPolygon.store.status)"
                        [style.color]="getStatusColor(selectedPolygon.store.status)">
                    {{ selectedPolygon.store.status.replace('_', ' ') }}
                  </span>
                </div>

                <div class="store-category-row">
                  <i class="ph ph-tag"></i>
                  <span>{{ selectedPolygon.store.category.replace('_', ' ') }}</span>
                </div>

                <div class="detail-grid">
                  <div class="detail-cell" *ngIf="selectedPolygon.store.ownerName">
                    <span class="detail-label">Owner</span>
                    <span class="detail-value">{{ selectedPolygon.store.ownerName }}</span>
                  </div>
                  <div class="detail-cell" *ngIf="selectedPolygon.store.surface">
                    <span class="detail-label">Surface</span>
                    <span class="detail-value">{{ selectedPolygon.store.surface }} m²</span>
                  </div>
                  <div class="detail-cell" *ngIf="selectedPolygon.store.monthlyRent">
                    <span class="detail-label">Monthly Rent</span>
                    <span class="detail-value rent">{{ selectedPolygon.store.monthlyRent | number:'1.0-0' }} TND</span>
                  </div>
                </div>
              </div>
            </ng-container>

            <ng-template #noStore>
              <div class="no-store-msg">
                <i class="ph ph-storefront"></i>
                <p>No store assigned to this unit.</p>
                <button class="btn-edit" *ngIf="isManager" (click)="openEditor()">
                  <i class="ph ph-pencil-simple"></i>
                  Assign in Editor
                </button>
              </div>
            </ng-template>

            <!-- Polygon stats -->
            <div class="polygon-stats">
              <span class="stat-row">
                <i class="ph ph-polygon"></i>
                {{ selectedPolygon.points.length }} vertices
              </span>
            </div>

          </ng-container>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex; flex-direction: column; height: 100%;
      background: var(--color-bg-base, #0f1117);
      font-family: 'Inter', sans-serif;
      overflow: hidden;
    }

    /* Header */
    .viewer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 28px 16px; flex-shrink: 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .header-title {
      font-size: 20px; font-weight: 700; color: #e2e8f0; margin: 0;
      display: flex; align-items: center; gap: 10px;
    }
    .header-title i { color: #6366f1; font-size: 22px; }
    .header-sub { font-size: 13px; color: #64748b; margin: 3px 0 0; }
    .header-right { display: flex; align-items: center; gap: 10px; }

    /* Floor tabs */
    .floor-tabs { display: flex; gap: 4px; }
    .floor-tab {
      padding: 7px 14px; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
      color: #94a3b8; font-size: 13px; cursor: pointer; transition: all 0.15s;
    }
    .floor-tab:hover  { background: rgba(255,255,255,0.08); color: #e2e8f0; }
    .floor-tab.active { background: rgba(99,102,241,0.15); border-color: #6366f1; color: #818cf8; }

    /* Viewer body */
    .viewer-body { display: flex; flex: 1; min-height: 0; position: relative; }
    .map-area    { flex: 1; position: relative; overflow: hidden; background: #080b11; cursor: grab; }
    .map-area:active { cursor: grabbing; }

    .konva-wrapper { width: 100%; height: 100%; }

    /* Loading */
    .map-loading {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 16px; color: #64748b; font-size: 14px;
    }
    .spinner {
      width: 36px; height: 36px; border: 3px solid rgba(99,102,241,0.15);
      border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Pending trace */
    .pending-trace {
      position: absolute; inset: 0; display: flex;
      align-items: center; justify-content: center;
    }
    .pending-card {
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      padding: 48px; background: rgba(15,17,23,0.95); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px; text-align: center; max-width: 380px;
    }
    .pending-card i { font-size: 48px; color: #f59e0b; }
    .pending-card h3 { font-size: 18px; font-weight: 600; color: #e2e8f0; margin: 0; }
    .pending-card p { font-size: 14px; color: #94a3b8; margin: 0; line-height: 1.6; }
    .status-chip { display: inline-block; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 12px; }
    .status-uploaded  { background: rgba(100,116,139,0.2); color: #94a3b8; }
    .status-tracing   { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-completed { background: rgba(16,185,129,0.15); color: #10b981; }

    /* Zoom controls */
    .zoom-controls {
      position: absolute; bottom: 24px; right: 24px;
      display: flex; flex-direction: column; gap: 4px;
      z-index: 10;
    }
    .zoom-btn {
      width: 36px; height: 36px; background: rgba(15,17,23,0.9);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
      color: #94a3b8; font-size: 15px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
      backdrop-filter: blur(8px);
    }
    .zoom-btn:hover { background: rgba(99,102,241,0.2); color: #818cf8; border-color: #6366f1; }

    /* Legend */
    .legend {
      position: absolute; bottom: 24px; left: 24px;
      background: rgba(15,17,23,0.85); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
      padding: 10px 14px; display: flex; flex-direction: column; gap: 6px; z-index: 10;
    }
    .lease-toggle { background: rgba(148,163,184,.12); color: #cbd5e1; border: 1px solid rgba(148,163,184,.3); border-radius: 6px;
                    padding: 4px 10px; font: inherit; font-size: 12px; cursor: pointer; margin-bottom: 4px; }
    .lease-toggle.on { background: rgba(79,142,247,.2); color: #93c5fd; border-color: rgba(79,142,247,.5); }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #94a3b8; }
    .legend-dot  { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }

    /* No floors */
    .no-floors {
      flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px;
    }
    .no-floors-card {
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      padding: 60px 48px; background: rgba(255,255,255,0.02);
      border: 1px dashed rgba(255,255,255,0.1); border-radius: 20px; text-align: center;
    }
    .no-floors-card i { font-size: 56px; color: #334155; }
    .no-floors-card h2 { font-size: 20px; font-weight: 600; color: #e2e8f0; margin: 0; }
    .no-floors-card p  { font-size: 14px; color: #64748b; margin: 0; max-width: 320px; line-height: 1.6; }

    /* Detail panel */
    .detail-panel {
      width: 0; transition: width 0.25s ease;
      background: var(--color-bg-surface, #1a1f2e);
      border-left: 1px solid rgba(255,255,255,0.06);
      overflow: hidden; flex-shrink: 0;
      display: flex; flex-direction: column;
    }
    .detail-panel.open { width: 300px; }

    .panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 16px 8px;
    }
    .panel-type-badge {
      font-size: 10px; font-weight: 700; padding: 3px 10px;
      border-radius: 20px; color: #fff; letter-spacing: 0.06em;
      text-transform: uppercase; opacity: 0.85;
    }
    .panel-title {
      font-size: 18px; font-weight: 700; color: #e2e8f0;
      margin: 0 0 16px; padding: 0 16px;
    }

    /* Store section */
    .store-section { padding: 0 16px; display: flex; flex-direction: column; gap: 14px; }
    .store-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .store-name-block { display: flex; flex-direction: column; gap: 3px; }
    .store-name { font-size: 16px; font-weight: 600; color: #e2e8f0; }
    .store-code { font-size: 12px; color: #64748b; }
    .store-status-badge {
      font-size: 11px; font-weight: 600; padding: 3px 10px;
      border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em;
      white-space: nowrap; flex-shrink: 0;
    }
    .store-category-row {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: #94a3b8;
    }
    .store-category-row i { color: #6366f1; }

    .detail-grid { display: flex; flex-direction: column; gap: 10px; }
    .detail-cell { display: flex; flex-direction: column; gap: 3px; }
    .detail-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
    .detail-value { font-size: 14px; color: #e2e8f0; font-weight: 500; }
    .detail-value.rent { color: #10b981; font-size: 16px; font-weight: 700; }

    /* No store */
    .no-store-msg {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 24px 16px; color: #475569; text-align: center;
    }
    .no-store-msg i { font-size: 32px; color: #334155; }
    .no-store-msg p { font-size: 13px; margin: 0; }

    /* Polygon stats */
    .polygon-stats {
      margin-top: auto; padding: 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .stat-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #475569; }
    .stat-row i { color: #334155; }

    /* Buttons */
    .btn-primary {
      display: flex; align-items: center; gap: 6px; padding: 9px 18px;
      background: #6366f1; color: white; border: none; border-radius: 8px;
      font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.15s;
    }
    .btn-primary:hover { background: #4f46e5; }
    .btn-edit {
      display: flex; align-items: center; gap: 6px; padding: 8px 14px;
      background: rgba(255,255,255,0.06); color: #94a3b8;
      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
      font-size: 13px; cursor: pointer; transition: all 0.15s;
    }
    .btn-edit:hover { background: rgba(99,102,241,0.15); color: #818cf8; border-color: #6366f1; }
    .btn-upload {
      display: flex; align-items: center; gap: 6px; padding: 8px 14px;
      background: rgba(99,102,241,0.12); color: #818cf8;
      border: 1px solid rgba(99,102,241,0.3); border-radius: 8px;
      font-size: 13px; cursor: pointer; transition: all 0.15s;
    }
    .btn-upload:hover { background: rgba(99,102,241,0.2); }
    .btn-icon-sm {
      background: rgba(255,255,255,0.05); border: none; cursor: pointer;
      color: #64748b; width: 28px; height: 28px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; transition: all 0.15s;
    }
    .btn-icon-sm:hover { background: rgba(239,68,68,0.1); color: #ef4444; }
  `]
})
export class FloorMapViewerComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('konvaContainer') containerRef?: ElementRef<HTMLDivElement>;

  floors: FloorResponse[] = [];
  selectedFloor: FloorResponse | null = null;
  polygons: PolygonResponse[] = [];
  selectedPolygon: PolygonResponse | null = null;
  loading = false;
  isManager = false;

  legend = [
    { label: 'Store',       color: POLYGON_TYPE_COLORS.STORE.stroke },
    { label: 'Corridor',    color: POLYGON_TYPE_COLORS.CORRIDOR.stroke },
    { label: 'Common Area', color: POLYGON_TYPE_COLORS.COMMON_AREA.stroke },
    { label: 'Boundary',    color: POLYGON_TYPE_COLORS.BOUNDARY.stroke },
  ];

  /** Colour of a store polygon in the lease view, by the state of its lease. */
  private static readonly LEASE_FILL: Record<LeaseState, string> = {
    VACANT: 'rgba(239,68,68,0.45)', EXPIRED: 'rgba(190,24,93,0.5)', EXPIRING: 'rgba(245,158,11,0.45)', LEASED: 'rgba(16,185,129,0.35)'
  };
  private static readonly LEASE_LABEL: Record<LeaseState, string> = {
    VACANT: 'Vacant', EXPIRED: 'Lease ended, still open', EXPIRING: 'Lease ends within 90 days', LEASED: 'Leased'
  };

  leaseView = false;
  private units = new Map<number, UnitState>();

  get legendItems(): { label: string; color: string }[] {
    if (!this.leaseView) {
      return this.legend;
    }
    return (['LEASED', 'EXPIRING', 'EXPIRED', 'VACANT'] as LeaseState[]).map(state => ({
      label: FloorMapViewerComponent.LEASE_LABEL[state],
      color: FloorMapViewerComponent.LEASE_FILL[state].replace(/[\d.]+\)$/, '1)')
    }));
  }

  private stage!: Konva.Stage;
  private imageLayer!: Konva.Layer;
  private polyLayer!: Konva.Layer;
  private tooltip!: Konva.Label;

  private mallId!: number;

  constructor(
    private auth: AuthService,
    private floorplanSvc: FloorplanService,
    private finance: FinanceService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isManager = (this.auth.user as any)?.role === 'MALL_USER';
    this.mallId    = Number(
      this.route.snapshot.queryParamMap.get('mallId') ??
      (this.auth.user as any)?.mallId ?? 0
    );

    this.loadFloors();
  }

  ngAfterViewInit(): void { /* Stage initialised after floor loads */ }

  ngOnDestroy(): void {
    this.stage?.destroy();
  }

  // ─── Data loading ──────────────────────────────────────────────────────────

  private loadFloors(): void {
    this.loading = true;
    this.floorplanSvc.listFloors(this.mallId).subscribe({
      next: floors => {
        this.floors = floors;
        const completed = floors.find(f => f.status === 'COMPLETED') ?? floors[0];
        if (completed) this.selectFloor(completed);
        else           this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  selectFloor(floor: FloorResponse): void {
    this.selectedFloor   = floor;
    this.selectedPolygon = null;
    this.polygons        = [];
    this.loading         = true;
    this.cdr.detectChanges();

    if (floor.status !== 'COMPLETED') {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.floorplanSvc.getGeometry(this.mallId, floor.id).subscribe({
      next: geo => {
        this.polygons = geo.polygons;
        this.loading  = false;
        this.cdr.detectChanges();
        // Give Angular time to render the konva wrapper before init
        setTimeout(() => this.initKonva(geo), 50);
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  // ─── Konva init ────────────────────────────────────────────────────────────

  private initKonva(geo: GeometryResponse): void {
    if (!this.containerRef) return;
    const container = this.containerRef.nativeElement;
    if (!container) return;

    this.stage?.destroy();

    this.stage = new Konva.Stage({
      container,
      width:  container.clientWidth  || 900,
      height: container.clientHeight || 600,
      draggable: true,
    });

    this.imageLayer = new Konva.Layer();
    this.polyLayer  = new Konva.Layer();
    this.stage.add(this.imageLayer);
    this.stage.add(this.polyLayer);

    // Zoom on scroll
    this.stage.on('wheel', (e) => {
      e.evt.preventDefault();
      const scaleBy = 1.08;
      const oldScale = this.stage.scaleX();
      const pointer  = this.stage.getPointerPosition()!;
      const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clamped  = Math.max(0.4, Math.min(5, newScale));
      const mousePointTo = {
        x: (pointer.x - this.stage.x()) / oldScale,
        y: (pointer.y - this.stage.y()) / oldScale,
      };
      this.stage.scale({ x: clamped, y: clamped });
      this.stage.position({
        x: pointer.x - mousePointTo.x * clamped,
        y: pointer.y - mousePointTo.y * clamped,
      });
    });

    // Background image (fetched with the auth interceptor so it loads as the principal)
    if (geo.floor.sourceImageUrl) {
      this.floorplanSvc.getFloorImage(this.mallId, geo.floor.id).subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            const kImg = new Konva.Image({
              image: img, x: 0, y: 0,
              width: this.stage.width(), height: this.stage.height(),
            });
            this.imageLayer.add(kImg);
            this.imageLayer.batchDraw();
          };
          img.onerror = () => URL.revokeObjectURL(url);
          img.src = url;
        },
        error: () => { /* floor created without an image */ }
      });
    }

    // Build tooltip
    this.tooltip = new Konva.Label({ opacity: 0, listening: false });
    this.tooltip.add(new Konva.Tag({
      fill: '#1e293b', cornerRadius: 6,
      stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1,
    }));
    this.tooltip.add(new Konva.Text({
      text: '', padding: 8, fontSize: 12,
      fill: '#e2e8f0', fontFamily: 'Inter, sans-serif',
    }));
    this.polyLayer.add(this.tooltip);

    // Draw polygons
    geo.polygons.forEach(p => this.renderPolygon(p));
    this.polyLayer.batchDraw();
  }

  private renderPolygon(p: PolygonResponse): void {
    const w = this.stage.width();
    const h = this.stage.height();
    const flat = p.points.flatMap(pt => [pt.x * w, pt.y * h]);
    const colors = { ...POLYGON_TYPE_COLORS[p.polygonType], fill: this.baseFill(p) };

    const group = new Konva.Group({ id: String(p.id) });

    const poly = new Konva.Line({
      points: flat, closed: true,
      fill: colors.fill, stroke: colors.stroke, strokeWidth: 2,
      lineCap: 'round', lineJoin: 'round',
    });

    // Label text centered on polygon centroid
    const cx = p.points.reduce((s, pt) => s + pt.x * w, 0) / p.points.length;
    const cy = p.points.reduce((s, pt) => s + pt.y * h, 0) / p.points.length;
    const displayLabel = p.store?.name ?? p.label ?? '';

    // a small badge under the centre: readable on any plan, and clear of a name already printed on the image
    const label = new Konva.Label({ x: cx, y: p.store ? cy + 34 : cy, listening: false });
    label.add(new Konva.Tag({ fill: 'rgba(15, 23, 42, 0.78)', cornerRadius: 4 }));
    label.add(new Konva.Text({
      text: displayLabel, fontSize: 11, fill: '#e2e8f0', fontFamily: 'Inter, sans-serif', padding: 4,
    }));
    label.offsetX(label.width() / 2);
    label.offsetY(label.height() / 2);
    // corridors and the outline are usually named on the image already; their name stays in the hover tooltip
    if (!displayLabel || p.polygonType === 'CORRIDOR' || p.polygonType === 'BOUNDARY') {
      label.visible(false);
    }

    group.add(poly);
    group.add(label);

    // Hover effects
    poly.on('mouseenter', () => {
      poly.fill(this.adjustAlpha(colors.fill, 0.6));
      poly.strokeWidth(3);
      const tooltipText = this.tooltip.getChildren(n => n instanceof Konva.Text)[0] as Konva.Text;
      const unit = p.store ? this.units.get(p.store.id) : undefined;
      const tip = p.store
        ? `${p.store.name} (${p.store.code})\n${p.store.status.replace('_', ' ')}`
          + (this.leaseView && unit ? `\n${FloorMapViewerComponent.LEASE_LABEL[unit.leaseState]}${unit.contractEnd ? ' (' + unit.contractEnd + ')' : ''}` : '')
        : (p.label || p.polygonType.replace('_', ' '));
      tooltipText.text(tip);
      const pos = this.stage.getPointerPosition()!;
      this.tooltip.position({ x: pos.x / this.stage.scaleX() - this.stage.x() / this.stage.scaleX() + 10,
                              y: pos.y / this.stage.scaleY() - this.stage.y() / this.stage.scaleY() - 10 });
      this.tooltip.opacity(1);
      this.tooltip.moveToTop();
      this.polyLayer.batchDraw();
      document.body.style.cursor = 'pointer';
    });

    poly.on('mouseleave', () => {
      poly.fill(colors.fill);
      poly.strokeWidth(2);
      this.tooltip.opacity(0);
      this.polyLayer.batchDraw();
      document.body.style.cursor = 'default';
    });

    poly.on('click', (e) => {
      e.cancelBubble = true;
      this.selectedPolygon = p;
      this.highlightSelected(group);
      this.cdr.detectChanges();
    });

    this.polyLayer.add(group);
  }

  private highlightSelected(selectedGroup: Konva.Group): void {
    // Reset all polygons
    this.polyLayer.getChildren(n => n instanceof Konva.Group).forEach(g => {
      const group = g as Konva.Group;
      const line = group.getChildren(n => n instanceof Konva.Line)[0] as Konva.Line;
      if (!line) return;
      const id = Number(group.id());
      const poly = this.polygons.find(p => p.id === id);
      if (poly) {
        line.fill(this.baseFill(poly));
        line.strokeWidth(2);
      }
    });

    // Highlight selected
    const line = selectedGroup.getChildren(n => n instanceof Konva.Line)[0] as Konva.Line;
    if (line) { line.fill(this.adjustAlpha(line.fill() as string, 0.75)); line.strokeWidth(3); }
    this.polyLayer.batchDraw();
  }

  // ─── Controls ─────────────────────────────────────────────────────────────

  zoomIn(): void {
    const s = Math.min(5, this.stage.scaleX() * 1.15);
    this.stage.scale({ x: s, y: s });
  }

  zoomOut(): void {
    const s = Math.max(0.4, this.stage.scaleX() / 1.15);
    this.stage.scale({ x: s, y: s });
  }

  zoomReset(): void {
    this.stage.scale({ x: 1, y: 1 });
    this.stage.position({ x: 0, y: 0 });
  }

  onBackgroundClick(): void { this.clearSelection(); }

  clearSelection(): void {
    this.selectedPolygon = null;
    // Reset all polygon fills
    if (this.polyLayer) {
      this.polyLayer.getChildren(n => n instanceof Konva.Group).forEach(g => {
        const group = g as Konva.Group;
        const line = group.getChildren(n => n instanceof Konva.Line)[0] as Konva.Line;
        if (!line) return;
        const id = Number(group.id());
        const poly = this.polygons.find(p => p.id === id);
        if (poly) line.fill(this.baseFill(poly));
      });
      this.polyLayer.batchDraw();
    }
    this.cdr.detectChanges();
  }

  openEditor(): void {
    if (!this.selectedFloor) return;
    this.router.navigate(['/mall/floor-plan/edit', this.selectedFloor.id], {
      queryParams: { mallId: this.mallId }
    });
  }

  openNewFloor(): void {
    this.router.navigate(['/mall/floor-plan/new'], { queryParams: { mallId: this.mallId } });
  }

  // ─── Style helpers ─────────────────────────────────────────────────────────

  getTypeColor(type: PolygonType): string {
    return POLYGON_TYPE_COLORS[type]?.stroke ?? '#6366f1';
  }

  getStatusColor(status: StoreStatus): string {
    return STORE_STATUS_COLORS[status] ?? '#94a3b8';
  }

  getStatusBg(status: StoreStatus): string {
    return (STORE_STATUS_COLORS[status] ?? '#94a3b8') + '22';
  }

  /** The unit states are loaded the first time the lease view is switched on. */
  toggleLeaseView(): void {
    if (this.leaseView) {
      this.leaseView = false;
      this.repaint();
      return;
    }
    const show = () => { this.leaseView = true; this.repaint(); this.cdr.detectChanges(); };
    if (this.units.size > 0) {
      show();
      return;
    }
    this.finance.analytics(this.mallId).subscribe({
      next: a => { a.units.forEach(u => this.units.set(u.storeId, u)); show(); },
      error: () => undefined
    });
  }

  private baseFill(p: PolygonResponse): string {
    if (this.leaseView && p.polygonType === 'STORE') {
      const unit = p.store ? this.units.get(p.store.id) : undefined;
      return FloorMapViewerComponent.LEASE_FILL[unit ? unit.leaseState : 'VACANT'];
    }
    return POLYGON_TYPE_COLORS[p.polygonType].fill;
  }

  private repaint(): void {
    if (!this.polyLayer) return;
    this.polyLayer.getChildren(n => n instanceof Konva.Group).forEach(g => {
      const group = g as Konva.Group;
      const line = group.getChildren(n => n instanceof Konva.Line)[0] as Konva.Line;
      const poly = this.polygons.find(p => p.id === Number(group.id()));
      if (line && poly) line.fill(this.baseFill(poly));
    });
    this.polyLayer.batchDraw();
  }

  private adjustAlpha(rgba: string, newAlpha: number): string {
    return rgba.replace(/[\d.]+\)$/, `${newAlpha})`);
  }
}
