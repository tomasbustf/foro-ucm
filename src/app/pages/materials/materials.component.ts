import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialsService, StudyMaterial } from '../../core/services/materials.service';
import { AuthService } from '../../core/services/auth.service';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';

@Component({
  selector: 'app-materials',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TimeAgoPipe, FileSizePipe],
  template: `
    <div class="materials-page container">
      <div class="page-header">
        <h1>Material de Estudio</h1>
        <p>Encuentra apuntes, pruebas pasadas y libros compartidos por la comunidad</p>
      </div>

      <div class="materials-layout">
        <!-- Filters Sidebar -->
        <aside class="filters-sidebar card">
          <h3>Filtros</h3>
          
          <div class="filter-group">
            <label>Buscar ramo o archivo</label>
            <input type="text" class="input-field" [(ngModel)]="filters.search" 
                   (ngModelChange)="onFilterChange()" placeholder="Ej: Cálculo, Física...">
          </div>

          <div class="filter-group">
            <label>Carrera</label>
            <select class="input-field" [(ngModel)]="filters.career" (ngModelChange)="onFilterChange()">
              <option value="">Todas las carreras</option>
              <option *ngFor="let c of careers" [value]="c">{{ c }}</option>
            </select>
          </div>

          <div class="filter-group row-group">
            <div class="half">
              <label>Año</label>
              <select class="input-field" [(ngModel)]="filters.year" (ngModelChange)="onFilterChange()">
                <option value="">Todos</option>
                <option *ngFor="let y of [1,2,3,4,5,6]" [value]="y">{{ y }}º</option>
              </select>
            </div>
            <div class="half">
              <label>Semestre</label>
              <select class="input-field" [(ngModel)]="filters.semester" (ngModelChange)="onFilterChange()">
                <option value="">Ambos</option>
                <option value="1">1º Sem</option>
                <option value="2">2º Sem</option>
              </select>
            </div>
          </div>
          
          <button class="btn btn-outline full-width" (click)="resetFilters()">Limpiar Filtros</button>
        </aside>

        <!-- Main Content -->
        <main class="materials-main">
          <div class="actions-bar">
            <div class="results-count">{{ totalCount() }} materiales encontrados</div>
            <a routerLink="/upload-material" class="btn btn-primary" *ngIf="auth.isAuthenticated()">
              + Subir Material
            </a>
          </div>

          <div class="materials-grid" *ngIf="!loading()">
            <div class="material-card card card-interactive" *ngFor="let mat of materials()">
              <div class="mat-icon">{{ getFileIcon(mat.file_type) }}</div>
              <div class="mat-info">
                <h3 class="mat-title">{{ mat.title }}</h3>
                <div class="mat-subject">
                  <span class="subject-tag">{{ mat.subject_code || mat.subject }}</span>
                  <span class="career-text">{{ mat.career }}</span>
                </div>
                <p class="mat-desc" *ngIf="mat.description">{{ mat.description }}</p>
                <div class="mat-meta">
                  <span>Por {{ mat.uploader?.username || 'Usuario' }}</span>
                  <span>·</span>
                  <span>{{ mat.created_at | timeAgo }}</span>
                  <span>·</span>
                  <span>{{ mat.file_size | fileSize }}</span>
                </div>
              </div>
              <div class="mat-actions">
                <div class="mat-stats">
                  <span title="Descargas">⬇️ {{ mat.download_count }}</span>
                  <span title="Votos">⭐ {{ mat.upvotes }}</span>
                </div>
                <button class="btn btn-primary btn-sm" (click)="download(mat)">Descargar</button>
              </div>
            </div>
          </div>

          <div class="empty-state card" *ngIf="!loading() && materials().length === 0">
            <div class="empty-state-icon">📂</div>
            <h3>No se encontraron materiales</h3>
            <p>Intenta ajustar tus filtros o sé el primero en aportar material para esta búsqueda.</p>
          </div>

          <div class="materials-grid" *ngIf="loading()">
            <div class="material-card card" *ngFor="let i of [1,2,3,4]">
              <div class="skeleton" style="width:48px;height:48px;border-radius:8px"></div>
              <div class="mat-info" style="width:100%">
                <div class="skeleton" style="width:70%;height:18px;margin-bottom:8px"></div>
                <div class="skeleton" style="width:40%;height:14px;margin-bottom:8px"></div>
                <div class="skeleton" style="width:90%;height:12px"></div>
              </div>
            </div>
          </div>
          
          <button class="btn btn-ghost full-width" *ngIf="hasMore()" (click)="loadMore()" [disabled]="loadingMore()">
            {{ loadingMore() ? 'Cargando...' : 'Cargar más' }}
          </button>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .materials-page { padding-top: calc(var(--navbar-height) + var(--space-lg)); padding-bottom: var(--space-xl); }
    .page-header { margin-bottom: var(--space-xl); text-align: center; }
    .page-header h1 { font-size: 2.2rem; font-weight: 800; margin-bottom: var(--space-sm); }
    .page-header p { color: var(--color-text-muted); font-size: 1.1rem; }
    
    .materials-layout { display: grid; grid-template-columns: 280px 1fr; gap: var(--space-lg); }
    .filters-sidebar { padding: var(--space-lg); position: sticky; top: calc(var(--navbar-height) + var(--space-lg)); align-self: start; }
    .filters-sidebar h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: var(--space-md); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-sm); }
    .filter-group { margin-bottom: var(--space-md); }
    .filter-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; }
    .row-group { display: flex; gap: var(--space-md); }
    .half { flex: 1; }
    
    .actions-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); }
    .results-count { font-weight: 600; color: var(--color-text-secondary); }
    
    .materials-grid { display: flex; flex-direction: column; gap: var(--space-md); }
    .material-card { display: flex; gap: var(--space-lg); padding: var(--space-lg); align-items: center; }
    .mat-icon { font-size: 2.5rem; background: var(--color-bg-alt); width: 64px; height: 64px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .mat-info { flex: 1; min-width: 0; }
    .mat-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mat-subject { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: 6px; }
    .subject-tag { background: rgba(59, 130, 246, 0.1); color: var(--color-info); padding: 2px 8px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; }
    .career-text { font-size: 0.8rem; color: var(--color-text-secondary); }
    .mat-desc { font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .mat-meta { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--color-text-muted); }
    
    .mat-actions { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-md); flex-shrink: 0; }
    .mat-stats { display: flex; gap: var(--space-sm); font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
    
    @media(max-width: 768px) {
      .materials-layout { grid-template-columns: 1fr; }
      .filters-sidebar { position: static; }
      .material-card { flex-direction: column; align-items: flex-start; gap: var(--space-md); }
      .mat-actions { width: 100%; flex-direction: row; justify-content: space-between; align-items: center; margin-top: var(--space-sm); }
    }
  `]
})
export class MaterialsComponent implements OnInit {
  careers = [
    'Ingeniería Civil Informática', 'Ingeniería Civil Industrial', 'Ingeniería Comercial', 
    'Derecho', 'Psicología', 'Medicina', 'Enfermería', 'Otra'
  ];
  
  filters = { search: '', career: '', year: '', semester: '' };
  materials = signal<StudyMaterial[]>([]);
  totalCount = signal(0);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(false);
  page = 0;
  private searchTimeout: any;

  constructor(public materialsService: MaterialsService, public auth: AuthService) {}

  ngOnInit() {
    this.loadMaterials();
  }

  onFilterChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadMaterials();
    }, 400); // Debounce
  }

  async loadMaterials() {
    this.loading.set(true);
    this.page = 0;
    try {
      const { materials, count } = await this.materialsService.getMaterials({
        ...this.filters, page: 0, limit: 10
      });
      this.materials.set(materials);
      this.totalCount.set(count);
      this.hasMore.set(materials.length < count);
    } finally {
      this.loading.set(false);
    }
  }

  async loadMore() {
    this.loadingMore.set(true);
    this.page++;
    try {
      const { materials, count } = await this.materialsService.getMaterials({
        ...this.filters, page: this.page, limit: 10
      });
      this.materials.update(m => [...m, ...materials]);
      this.hasMore.set(this.materials().length < count);
    } finally {
      this.loadingMore.set(false);
    }
  }

  resetFilters() {
    this.filters = { search: '', career: '', year: '', semester: '' };
    this.loadMaterials();
  }

  getFileIcon(type: string): string {
    if (!type) return '📄';
    if (type.includes('pdf')) return '📕';
    if (type.includes('word') || type.includes('document')) return '📘';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📗';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📙';
    if (type.includes('zip') || type.includes('rar') || type.includes('compressed')) return '🗜️';
    if (type.includes('image')) return '🖼️';
    return '📄';
  }

  async download(mat: StudyMaterial) {
    // Increment download count in background
    this.materialsService.incrementDownload(mat.id).catch(console.error);
    
    // Update local state optimistic
    this.materials.update(mats => mats.map(m => m.id === mat.id ? {...m, download_count: m.download_count + 1} : m));
    
    // Trigger download
    window.open(mat.file_url, '_blank');
  }
}
