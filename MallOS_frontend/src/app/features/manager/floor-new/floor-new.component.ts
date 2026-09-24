import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FloorplanService } from '../../../core/services/floorplan.service';

@Component({
  selector: 'app-floor-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="new-floor-container">
      <div class="card">
        <div class="card-header">
          <h2>Create New Floor Plan</h2>
          <p>Add a new level to the mall and upload its source layout image.</p>
        </div>

        <form (ngSubmit)="onSubmit()" #floorForm="ngForm" class="floor-form">
          <div class="form-group">
            <label for="name">Floor Name</label>
            <input type="text" id="name" name="name" [(ngModel)]="name" required placeholder="e.g. Ground Floor, Level 1" class="form-control">
          </div>

          <div class="form-group">
            <label for="level">Floor Level (Numeric)</label>
            <input type="number" id="level" name="level" [(ngModel)]="level" required min="0" class="form-control">
            <small class="form-hint">Used for sorting level tabs (0 = ground floor, 1 = first floor, etc.)</small>
          </div>

          <div class="form-group">
            <label for="image">Floor Plan Image</label>
            <div class="file-drop-area" [class.file-selected]="selectedFile !== null">
              <i class="ph ph-upload-simple"></i>
              <span *ngIf="!selectedFile">Drag and drop or select layout image</span>
              <span *ngIf="selectedFile" class="file-name">{{ selectedFile.name }}</span>
              <input type="file" id="image" (change)="onFileSelect($event)" accept="image/*" class="file-input">
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="cancel()">Cancel</button>
            <button type="submit" class="btn-submit" [disabled]="!floorForm.form.valid || !selectedFile || loading">
              <span *ngIf="!loading">Create & Trace</span>
              <span *ngIf="loading">Uploading...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .new-floor-container {
      display: flex; align-items: center; justify-content: center; height: 100%;
      background: var(--color-bg-base, #0f1117); font-family: 'Inter', sans-serif;
    }
    .card {
      width: 100%; max-width: 480px; background: var(--color-bg-surface, #1a1f2e);
      border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 32px;
    }
    .card-header { margin-bottom: 24px; }
    .card-header h2 { font-size: 20px; font-weight: 700; color: #e2e8f0; margin: 0; }
    .card-header p { font-size: 13px; color: #64748b; margin: 6px 0 0; }
    .floor-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .form-control {
      width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #e2e8f0; font-size: 14px;
      outline: none; transition: border-color 0.15s;
    }
    .form-control:focus { border-color: #6366f1; }
    .form-hint { font-size: 11px; color: #475569; }
    
    .file-drop-area {
      position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px; padding: 30px; border: 2px dashed rgba(255,255,255,0.1); border-radius: 8px;
      background: rgba(255,255,255,0.02); text-align: center; cursor: pointer; transition: all 0.15s;
    }
    .file-drop-area:hover { border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.02); }
    .file-drop-area.file-selected { border-color: #6366f1; background: rgba(99,102,241,0.05); }
    .file-drop-area i { font-size: 32px; color: #64748b; }
    .file-drop-area.file-selected i { color: #818cf8; }
    .file-drop-area span { font-size: 13px; color: #94a3b8; }
    .file-name { font-weight: 500; color: #c7d2fe !important; }
    .file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

    .form-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 10px; }
    .btn-cancel {
      padding: 10px 20px; background: none; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; color: #94a3b8; font-size: 13px; cursor: pointer; transition: all 0.15s;
    }
    .btn-cancel:hover { background: rgba(255,255,255,0.04); color: #e2e8f0; }
    .btn-submit {
      padding: 10px 20px; background: #6366f1; border: none; border-radius: 8px;
      color: white; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.15s;
    }
    .btn-submit:hover { background: #4f46e5; }
    .btn-submit:disabled { background: #334155; color: #64748b; cursor: not-allowed; }
  `]
})
export class FloorNewComponent implements OnInit {
  name: string = '';
  level: number = 0;
  selectedFile: File | null = null;
  loading = false;
  mallId!: number;

  constructor(
    private auth: AuthService,
    private floorplanSvc: FloorplanService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.mallId = Number(
      this.route.snapshot.queryParamMap.get('mallId') ??
      (this.auth.user as any)?.mallId ?? 0
    );
  }

  onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onSubmit(): void {
    if (!this.selectedFile) return;
    this.loading = true;
    this.floorplanSvc.createFloor(this.mallId, this.name, this.level, this.selectedFile).subscribe({
      next: (f) => {
        this.loading = false;
        this.router.navigate(['/mall/floor-plan/edit', f.id], { queryParams: { mallId: this.mallId } });
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/mall/floor-plan'], { queryParams: { mallId: this.mallId } });
  }
}
