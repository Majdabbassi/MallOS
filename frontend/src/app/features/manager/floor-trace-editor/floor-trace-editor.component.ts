import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Konva from 'konva';
import { AuthService } from '../../../core/services/auth.service';
import { FloorplanService } from '../../../core/services/floorplan.service';
import { StoreApiService } from '../../../core/services/store-api.service';
import {
  FloorResponse, PolygonResponse, PointDto, PolygonType,
  StoreApiResponse, POLYGON_TYPE_COLORS
} from '../../../core/models/floorplan.model';

interface DrawingPolygon {
  id?: number;
  points: PointDto[];
  label: string;
  polygonType: PolygonType;
  storeId?: number;
  storeName?: string;
  storeCode?: string;
  konvaLine?: Konva.Line;
  konvaGroup?: Konva.Group;
}

@Component({
  selector: 'app-floor-trace-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="editor-layout">

      <!-- Top Bar -->
      <div class="editor-topbar">
        <div class="topbar-left">
          <button class="btn-icon" (click)="goBack()" title="Back to floor plan">
            <i class="ph ph-arrow-left"></i>
          </button>
          <div class="topbar-title">
            <span class="topbar-label">Trace Editor</span>
            <span class="topbar-floor">{{ floor?.name || 'Loading…' }}</span>
          </div>
        </div>
        <div class="topbar-right">
          <span class="status-badge" [class]="'status-' + (floor?.status || 'uploaded').toLowerCase()">
            {{ floor?.status || '…' }}
          </span>
          <button class="btn-secondary" (click)="toggleMode()" [class.active]="mode === 'draw'">
            <i class="ph ph-pencil-simple"></i>
            {{ mode === 'draw' ? 'Drawing' : 'Select' }}
          </button>
          <button class="btn-primary" (click)="markComplete()"
                  [disabled]="polygons.length === 0 || saving">
            <i class="ph ph-check-circle"></i>
            Mark Complete
          </button>
        </div>
      </div>

      <!-- Main editor area -->
      <div class="editor-body">

        <!-- Canvas -->
        <div class="canvas-area">

          <!-- Upload overlay (shown when no image yet) -->
          <div class="upload-overlay" *ngIf="!floor?.sourceImageUrl" (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
            <div class="upload-box">
              <i class="ph ph-image"></i>
              <p>Drop floor plan image here</p>
              <label class="btn-primary">
                Choose File
                <input type="file" accept="image/*" (change)="onFileSelect($event)" hidden>
              </label>
              <p class="upload-hint">PNG, JPG up to 20 MB</p>
            </div>
          </div>

          <!-- Instructions bar -->
          <div class="instructions" *ngIf="floor?.sourceImageUrl">
            <span *ngIf="mode === 'draw'">
              <i class="ph ph-cursor-click"></i>
              Click to add vertices · Double-click or click first point to close polygon
            </span>
            <span *ngIf="mode === 'select'">
              <i class="ph ph-hand"></i>
              Click a polygon to select · Drag vertices to adjust
            </span>
          </div>

          <div class="konva-wrapper" #konvaContainer></div>
        </div>

        <!-- Sidebar -->
        <div class="editor-sidebar">
          <div class="sidebar-header">
            <span>Polygons <span class="count-badge">{{ polygons.length }}</span></span>
            <button class="btn-icon-sm" (click)="mode = 'draw'; selectedId = null" title="Draw new polygon">
              <i class="ph ph-plus"></i>
            </button>
          </div>

          <!-- Polygon list -->
          <div class="polygon-list" *ngIf="polygons.length > 0; else emptyState">
            <div class="polygon-item"
                 *ngFor="let p of polygons"
                 [class.selected]="selectedId === p.id"
                 (click)="selectPolygon(p)">

              <div class="polygon-item-header">
                <span class="polygon-color-dot" [style.background]="getPolygonColor(p.polygonType)"></span>
                <span class="polygon-label">{{ p.label || 'Untitled' }}</span>
                <button class="btn-icon-xs danger" (click)="deletePolygon(p, $event)" title="Delete">
                  <i class="ph ph-trash"></i>
                </button>
              </div>

              <!-- Edit form (expanded when selected) -->
              <div class="polygon-edit" *ngIf="selectedId === p.id">
                <label class="field-label">Label</label>
                <input class="field-input" [(ngModel)]="p.label" placeholder="e.g. Unit A-101"
                       (change)="savePolygon(p)">

                <label class="field-label">Type</label>
                <select class="field-select" [(ngModel)]="p.polygonType" (change)="savePolygon(p); refreshPolygonColor(p)">
                  <option value="STORE">Store</option>
                  <option value="CORRIDOR">Corridor</option>
                  <option value="COMMON_AREA">Common Area</option>
                  <option value="BOUNDARY">Boundary</option>
                </select>

                <!-- Store assignment (only for STORE type) -->
                <ng-container *ngIf="p.polygonType === 'STORE'">
                  <label class="field-label">Assigned Store</label>
                  <div class="store-assignment" *ngIf="p.storeId; else noStore">
                    <div class="store-badge">
                      <span class="store-badge-name">{{ p.storeName }}</span>
                      <span class="store-badge-code">{{ p.storeCode }}</span>
                      <button class="btn-icon-xs danger" (click)="unlinkStore(p)" title="Unlink store">
                        <i class="ph ph-x"></i>
                      </button>
                    </div>
                  </div>
                  <ng-template #noStore>
                    <select class="field-select" (change)="linkStore(p, $event)">
                      <option value="">— Select store —</option>
                      <option *ngFor="let s of unlinkedStores" [value]="s.id">
                        {{ s.code }} — {{ s.name }}
                      </option>
                    </select>
                    <button class="btn-refresh-stores" (click)="loadUnlinkedStores()" title="Refresh store list">
                      <i class="ph ph-arrows-clockwise"></i> Refresh
                    </button>
                  </ng-template>
                </ng-container>
              </div>
            </div>
          </div>

          <ng-template #emptyState>
            <div class="empty-state">
              <i class="ph ph-polygon"></i>
              <p>No polygons yet.<br>Switch to Draw mode and click on the map.</p>
            </div>
          </ng-template>

          <!-- Save feedback -->
          <div class="save-status" *ngIf="saveMessage">
            <i class="ph ph-check-circle"></i> {{ saveMessage }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100vh; background: var(--color-bg-base, #0f1117); font-family: 'Inter', sans-serif; }

    /* Top Bar */
    .editor-topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px; background: var(--color-bg-surface, #1a1f2e);
      border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;
    }
    .topbar-left { display: flex; align-items: center; gap: 14px; }
    .topbar-title { display: flex; flex-direction: column; gap: 2px; }
    .topbar-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
    .topbar-floor { font-size: 15px; font-weight: 600; color: #e2e8f0; }
    .topbar-right { display: flex; align-items: center; gap: 10px; }

    /* Editor body */
    .editor-body { display: flex; flex: 1; min-height: 0; }
    .canvas-area { flex: 1; position: relative; overflow: hidden; background: #0a0d14; }
    .konva-wrapper { width: 100%; height: 100%; }

    /* Upload overlay */
    .upload-overlay {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      z-index: 10; background: rgba(10,13,20,0.95);
    }
    .upload-box {
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      padding: 48px; border: 2px dashed rgba(99,102,241,0.4); border-radius: 16px;
      background: rgba(99,102,241,0.05); text-align: center;
    }
    .upload-box i { font-size: 56px; color: #6366f1; }
    .upload-box p { color: #94a3b8; margin: 0; font-size: 15px; }
    .upload-hint { font-size: 12px !important; color: #475569 !important; }

    /* Instructions bar */
    .instructions {
      position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
      background: rgba(15,17,23,0.85); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 24px;
      padding: 6px 16px; font-size: 12px; color: #94a3b8;
      display: flex; align-items: center; gap: 8px; z-index: 5;
      white-space: nowrap;
    }
    .instructions i { color: #6366f1; }

    /* Sidebar */
    .editor-sidebar {
      width: 300px; flex-shrink: 0; background: var(--color-bg-surface, #1a1f2e);
      border-left: 1px solid rgba(255,255,255,0.06);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .sidebar-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.06);
      font-size: 13px; font-weight: 600; color: #e2e8f0;
    }
    .count-badge {
      background: rgba(99,102,241,0.2); color: #818cf8; border-radius: 10px;
      padding: 1px 7px; font-size: 11px; margin-left: 6px;
    }

    /* Polygon list */
    .polygon-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
    .polygon-item {
      border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02); cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .polygon-item:hover { background: rgba(255,255,255,0.04); }
    .polygon-item.selected { border-color: #6366f1; background: rgba(99,102,241,0.08); }
    .polygon-item-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; }
    .polygon-color-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .polygon-label { flex: 1; font-size: 13px; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* Polygon edit form */
    .polygon-edit { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; }
    .field-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .field-input, .field-select {
      width: 100%; padding: 7px 10px; background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;
      color: #e2e8f0; font-size: 13px; outline: none;
      transition: border-color 0.15s;
    }
    .field-input:focus, .field-select:focus { border-color: #6366f1; }
    .field-select option { background: #1a1f2e; }

    /* Store assignment */
    .store-badge {
      display: flex; align-items: center; gap: 8px;
      background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3);
      border-radius: 6px; padding: 6px 10px;
    }
    .store-badge-name { font-size: 13px; color: #c7d2fe; font-weight: 500; flex: 1; }
    .store-badge-code { font-size: 11px; color: #818cf8; }
    .btn-refresh-stores {
      font-size: 11px; color: #6366f1; background: none; border: none; cursor: pointer;
      display: flex; align-items: center; gap: 4px; padding: 0; margin-top: -4px;
    }
    .btn-refresh-stores:hover { color: #818cf8; }

    /* Empty state */
    .empty-state {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; color: #475569; text-align: center; padding: 32px;
    }
    .empty-state i { font-size: 40px; color: #334155; }
    .empty-state p { font-size: 13px; line-height: 1.6; margin: 0; }

    /* Save status */
    .save-status {
      padding: 12px 16px; font-size: 12px; color: #10b981;
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex; align-items: center; gap: 6px;
    }

    /* Buttons */
    .btn-primary {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; background: #6366f1; color: white;
      border: none; border-radius: 8px; font-size: 13px; font-weight: 500;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-primary:hover { background: #4f46e5; }
    .btn-primary:disabled { background: #334155; color: #64748b; cursor: not-allowed; }
    .btn-secondary {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px; background: rgba(255,255,255,0.06); color: #94a3b8;
      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
      font-size: 13px; cursor: pointer; transition: all 0.15s;
    }
    .btn-secondary:hover, .btn-secondary.active { background: rgba(99,102,241,0.15); color: #818cf8; border-color: #6366f1; }
    .btn-icon {
      background: none; border: none; cursor: pointer; color: #64748b;
      font-size: 18px; padding: 6px; border-radius: 6px; transition: color 0.15s, background 0.15s;
      display: flex; align-items: center;
    }
    .btn-icon:hover { color: #e2e8f0; background: rgba(255,255,255,0.06); }
    .btn-icon-sm {
      background: rgba(99,102,241,0.15); border: none; cursor: pointer;
      color: #818cf8; font-size: 14px; width: 26px; height: 26px;
      border-radius: 6px; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .btn-icon-sm:hover { background: rgba(99,102,241,0.25); }
    .btn-icon-xs {
      background: none; border: none; cursor: pointer; color: #64748b;
      font-size: 13px; padding: 3px; border-radius: 4px; display: flex; align-items: center;
      transition: color 0.15s;
    }
    .btn-icon-xs.danger:hover { color: #ef4444; }

    /* Status badges */
    .status-badge {
      font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .status-uploaded  { background: rgba(100,116,139,0.2); color: #94a3b8; }
    .status-tracing   { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-completed { background: rgba(16,185,129,0.15); color: #10b981; }
  `]
})
export class FloorTraceEditorComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('konvaContainer') containerRef!: ElementRef<HTMLDivElement>;

  floor: FloorResponse | null = null;
  polygons: DrawingPolygon[] = [];
  unlinkedStores: StoreApiResponse[] = [];
  selectedId: number | null = null;
  mode: 'draw' | 'select' = 'select';
  saving = false;
  saveMessage = '';
  private saveTimer: any;

  private stage!: Konva.Stage;
  private imageLayer!: Konva.Layer;
  private drawLayer!: Konva.Layer;

  // Drawing state
  private currentPoints: number[] = [];  // flat [x,y,x,y,...] in pixels
  private previewLine?: Konva.Line;
  private vertexCircles: Konva.Circle[] = [];

  private mallId!: number;
  private floorId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private floorplanSvc: FloorplanService,
    private storeApiSvc: StoreApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.floorId = Number(this.route.snapshot.paramMap.get('floorId'));
    this.mallId  = Number(this.route.snapshot.queryParamMap.get('mallId') ?? 0);

    this.floorplanSvc.getFloor(this.mallId, this.floorId).subscribe(f => {
      this.floor = f;
      this.cdr.detectChanges();
      if (f.sourceImageUrl) {
        this.loadBackgroundImage();
        this.loadExistingPolygons();
      }
    });
    this.loadUnlinkedStores();
  }

  ngAfterViewInit(): void {
    this.initKonva();
  }

  ngOnDestroy(): void {
    if (this.stage) this.stage.destroy();
    clearTimeout(this.saveTimer);
  }

  // ─── Konva setup ───────────────────────────────────────────────────────────

  private initKonva(): void {
    const container = this.containerRef.nativeElement;
    this.stage = new Konva.Stage({
      container,
      width:  container.clientWidth  || 800,
      height: container.clientHeight || 600,
    });
    this.imageLayer = new Konva.Layer();
    this.drawLayer  = new Konva.Layer();
    this.stage.add(this.imageLayer);
    this.stage.add(this.drawLayer);

    this.stage.on('click', (e) => {
      if (this.mode === 'draw' && e.target === this.stage) this.onStageClick(e);
    });
    this.stage.on('dblclick', () => {
      if (this.mode === 'draw') this.closePolygon();
    });
    this.stage.on('mousemove', () => {
      if (this.mode === 'draw' && this.currentPoints.length >= 2) this.updatePreview();
    });

    if (this.floor?.sourceImageUrl) {
      this.loadBackgroundImage();
    }
  }

  private loadBackgroundImage(): void {
    this.floorplanSvc.getFloorImage(this.mallId, this.floorId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const kImg = new Konva.Image({
            image: img,
            x: 0, y: 0,
            width:  this.stage.width(),
            height: this.stage.height(),
          });
          this.imageLayer.destroyChildren();
          this.imageLayer.add(kImg);
          this.imageLayer.draw();
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
      },
      error: () => { /* floor created without an image */ }
    });
  }

  // ─── Drawing ───────────────────────────────────────────────────────────────

  private onStageClick(e: Konva.KonvaEventObject<MouseEvent>): void {
    const pos = this.stage.getPointerPosition()!;
    // Close on click near first vertex
    if (this.currentPoints.length >= 6) {
      const dx = pos.x - this.currentPoints[0];
      const dy = pos.y - this.currentPoints[1];
      if (Math.sqrt(dx * dx + dy * dy) < 12) { this.closePolygon(); return; }
    }
    this.currentPoints.push(pos.x, pos.y);
    this.drawVertexDot(pos.x, pos.y);
    this.updatePreview();
  }

  private drawVertexDot(x: number, y: number): void {
    const dot = new Konva.Circle({
      x, y, radius: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 1.5, draggable: false,
    });
    this.drawLayer.add(dot);
    this.vertexCircles.push(dot);
    this.drawLayer.batchDraw();
  }

  private updatePreview(): void {
    const pos = this.stage.getPointerPosition()!;
    if (!pos) return;
    const pts = [...this.currentPoints, pos.x, pos.y];
    if (this.previewLine) {
      this.previewLine.points(pts);
    } else {
      this.previewLine = new Konva.Line({
        points: pts, stroke: '#6366f1', strokeWidth: 2,
        dash: [6, 4], lineCap: 'round', lineJoin: 'round',
      });
      this.drawLayer.add(this.previewLine);
    }
    this.drawLayer.batchDraw();
  }

  private closePolygon(): void {
    if (this.currentPoints.length < 6) return;  // need at least 3 points

    const w = this.stage.width();
    const h = this.stage.height();
    const normalized: PointDto[] = [];
    for (let i = 0; i < this.currentPoints.length; i += 2) {
      normalized.push({ x: this.currentPoints[i] / w, y: this.currentPoints[i + 1] / h });
    }

    this.clearDrawingState();

    const req = { points: normalized, label: '', polygonType: 'STORE' as PolygonType };
    this.floorplanSvc.createPolygon(this.mallId, this.floorId, req).subscribe(resp => {
      const dp = this.toDrawingPolygon(resp);
      this.polygons.push(dp);
      this.renderPolygon(dp);
      this.selectPolygon(dp);
      this.cdr.detectChanges();
      this.showSaveMessage('Polygon saved');
    });
  }

  private clearDrawingState(): void {
    this.currentPoints = [];
    this.previewLine?.destroy();
    this.previewLine = undefined;
    this.vertexCircles.forEach(c => c.destroy());
    this.vertexCircles = [];
    this.drawLayer.batchDraw();
  }

  // ─── Render existing polygons ──────────────────────────────────────────────

  private loadExistingPolygons(): void {
    this.floorplanSvc.getGeometry(this.mallId, this.floorId).subscribe(geo => {
      this.polygons = geo.polygons.map(p => this.toDrawingPolygon(p));
      this.polygons.forEach(p => this.renderPolygon(p));
      this.drawLayer.batchDraw();
      this.cdr.detectChanges();
    });
  }

  private renderPolygon(dp: DrawingPolygon): void {
    if (dp.konvaGroup) dp.konvaGroup.destroy();
    const w = this.stage.width();
    const h = this.stage.height();
    const flat = dp.points.flatMap(p => [p.x * w, p.y * h]);
    const colors = POLYGON_TYPE_COLORS[dp.polygonType];

    const group = new Konva.Group({ id: String(dp.id) });
    const poly = new Konva.Line({
      points: flat, closed: true,
      fill: colors.fill, stroke: colors.stroke,
      strokeWidth: 2, lineCap: 'round', lineJoin: 'round',
    });

    group.add(poly);

    // Label
    if (dp.label) {
      const cx = dp.points.reduce((s, p) => s + p.x * w, 0) / dp.points.length;
      const cy = dp.points.reduce((s, p) => s + p.y * h, 0) / dp.points.length;
      const txt = new Konva.Text({
        x: cx, y: cy, text: dp.label, fontSize: 12, fill: '#e2e8f0',
        fontFamily: 'Inter, sans-serif', align: 'center',
        offsetX: 40, offsetY: 8, width: 80,
      });
      group.add(txt);
    }

    group.on('click', () => this.selectPolygon(dp));
    dp.konvaGroup = group;
    this.drawLayer.add(group);
  }

  // ─── Selection & editing ──────────────────────────────────────────────────

  selectPolygon(dp: DrawingPolygon): void {
    this.selectedId = dp.id ?? null;
    this.mode = 'select';
    this.cdr.detectChanges();
  }

  savePolygon(dp: DrawingPolygon): void {
    if (!dp.id) return;
    this.floorplanSvc.updatePolygon(this.mallId, this.floorId, dp.id, {
      label: dp.label, polygonType: dp.polygonType,
    }).subscribe(resp => {
      Object.assign(dp, this.toDrawingPolygon(resp));
      this.renderPolygon(dp);
      this.drawLayer.batchDraw();
      this.showSaveMessage('Saved');
    });
  }

  refreshPolygonColor(dp: DrawingPolygon): void {
    this.renderPolygon(dp);
    this.drawLayer.batchDraw();
  }

  deletePolygon(dp: DrawingPolygon, e: Event): void {
    e.stopPropagation();
    if (!dp.id) return;
    this.floorplanSvc.deletePolygon(this.mallId, this.floorId, dp.id).subscribe(() => {
      dp.konvaGroup?.destroy();
      this.drawLayer.batchDraw();
      this.polygons = this.polygons.filter(p => p.id !== dp.id);
      if (this.selectedId === dp.id) this.selectedId = null;
      this.cdr.detectChanges();
    });
  }

  // ─── Store assignment ──────────────────────────────────────────────────────

  loadUnlinkedStores(): void {
    this.storeApiSvc.listUnlinked(this.mallId).subscribe(stores => {
      this.unlinkedStores = stores;
      this.cdr.detectChanges();
    });
  }

  linkStore(dp: DrawingPolygon, event: Event): void {
    const storeId = Number((event.target as HTMLSelectElement).value);
    if (!storeId || !dp.id) return;
    this.floorplanSvc.linkStore(this.mallId, this.floorId, dp.id, storeId).subscribe(resp => {
      dp.storeId   = resp.store?.id;
      dp.storeName = resp.store?.name;
      dp.storeCode = resp.store?.code;
      this.unlinkedStores = this.unlinkedStores.filter(s => s.id !== storeId);
      this.cdr.detectChanges();
      this.showSaveMessage('Store linked');
    });
  }

  unlinkStore(dp: DrawingPolygon): void {
    if (!dp.id) return;
    this.floorplanSvc.unlinkStore(this.mallId, this.floorId, dp.id).subscribe(() => {
      const removedId = dp.storeId;
      dp.storeId = dp.storeName = dp.storeCode = undefined;
      this.loadUnlinkedStores();
      this.cdr.detectChanges();
      this.showSaveMessage('Store unlinked');
    });
  }

  // ─── Floor actions ─────────────────────────────────────────────────────────

  toggleMode(): void {
    this.mode = this.mode === 'draw' ? 'select' : 'draw';
    if (this.mode === 'select') this.clearDrawingState();
  }

  markComplete(): void {
    this.saving = true;
    this.floorplanSvc.updateFloorStatus(this.mallId, this.floorId, 'COMPLETED').subscribe(f => {
      this.floor = f;
      this.saving = false;
      this.showSaveMessage('Floor marked as COMPLETED');
      this.cdr.detectChanges();
      setTimeout(() => this.router.navigate(['/mall/floor-plan'], { queryParams: { mallId: this.mallId } }), 1500);
    });
  }

  goBack(): void {
    this.router.navigate(['/mall/floor-plan'], { queryParams: { mallId: this.mallId } });
  }

  // ─── File upload ──────────────────────────────────────────────────────────

  onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.uploadImage(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadImage(file);
  }

  private uploadImage(file: File): void {
    // Attach the image to the floor currently being edited — never create a
    // new floor from here.
    this.floorplanSvc.updateFloorImage(this.mallId, this.floorId, file).subscribe(f => {
      this.floor = f;
      this.floorId = f.id;
      this.cdr.detectChanges();
      this.loadBackgroundImage();
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  getPolygonColor(type: PolygonType): string {
    return POLYGON_TYPE_COLORS[type]?.stroke ?? '#6366f1';
  }

  private toDrawingPolygon(resp: PolygonResponse): DrawingPolygon {
    return {
      id: resp.id,
      points: resp.points,
      label: resp.label ?? '',
      polygonType: resp.polygonType,
      storeId:   resp.store?.id,
      storeName: resp.store?.name,
      storeCode: resp.store?.code,
    };
  }

  private showSaveMessage(msg: string): void {
    this.saveMessage = msg;
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => { this.saveMessage = ''; this.cdr.detectChanges(); }, 3000);
  }
}
