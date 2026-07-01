import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-page container">
      <div class="page-header card">
        <h1>Panel de Moderación</h1>
        <p>Gestión de reportes y contenido de la comunidad</p>
      </div>

      <div class="admin-layout">
        <aside class="admin-sidebar card">
          <button class="tab-btn" [class.active]="activeTab() === 'reports'" (click)="activeTab.set('reports')">
            🚨 Reportes Pendientes
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'users'" (click)="activeTab.set('users')">
            👥 Gestión de Usuarios
          </button>
        </aside>

        <main class="admin-content card">
          <div *ngIf="activeTab() === 'reports'">
            <h2>Reportes Pendientes</h2>
            <div class="empty-state" *ngIf="reports().length === 0">
              <div class="empty-state-icon">✅</div>
              <h3>Todo en orden</h3>
              <p>No hay reportes pendientes de revisión.</p>
            </div>
            
            <div class="report-list">
              <div class="report-item" *ngFor="let r of reports()">
                <div class="report-header">
                  <span class="badge report-type">{{ r.target_type }}</span>
                  <span class="report-date">{{ r.created_at | date:'short' }}</span>
                </div>
                <div class="report-reason">
                  <strong>Razón:</strong> {{ r.reason }}
                </div>
                <div class="report-actions">
                  <button class="btn btn-primary btn-sm" (click)="resolveReport(r.id, 'reviewed')">Revisado</button>
                  <button class="btn btn-outline btn-sm" (click)="resolveReport(r.id, 'dismissed')">Desestimar</button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab() === 'users'">
            <h2>Gestión de Usuarios</h2>
            <div class="empty-state">
              <div class="empty-state-icon">🚧</div>
              <h3>En construcción</h3>
              <p>La tabla de gestión de usuarios estará disponible pronto.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { padding-top: calc(var(--navbar-height) + var(--space-lg)); padding-bottom: var(--space-xl); }
    .page-header { padding: var(--space-xl); margin-bottom: var(--space-md); text-align: center; }
    .page-header h1 { font-size: 2rem; font-weight: 800; margin-bottom: 4px; }
    .page-header p { color: var(--color-text-muted); font-size: 1.05rem; margin: 0; }
    
    .admin-layout { display: grid; grid-template-columns: 240px 1fr; gap: var(--space-md); }
    .admin-sidebar { display: flex; flex-direction: column; gap: 4px; padding: var(--space-sm); align-self: start; }
    .tab-btn { padding: 12px var(--space-md); text-align: left; background: transparent; border: none; font-weight: 600; color: var(--color-text-muted); border-radius: var(--radius-sm); cursor: pointer; transition: all var(--transition-fast); }
    .tab-btn:hover { background: var(--color-bg-alt); color: var(--color-text); }
    .tab-btn.active { background: var(--color-primary); color: white; }
    
    .admin-content { padding: var(--space-xl); min-height: 400px; }
    .admin-content h2 { margin-bottom: var(--space-lg); font-size: 1.5rem; font-weight: 700; border-bottom: 1px solid var(--color-border-light); padding-bottom: var(--space-sm); }
    
    .report-list { display: flex; flex-direction: column; gap: var(--space-md); }
    .report-item { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-md); }
    .report-header { display: flex; justify-content: space-between; margin-bottom: var(--space-sm); }
    .report-type { background: var(--color-warning-bg); color: var(--color-warning); text-transform: uppercase; }
    .report-date { font-size: 0.8rem; color: var(--color-text-muted); }
    .report-reason { margin-bottom: var(--space-md); font-size: 0.95rem; }
    .report-actions { display: flex; gap: var(--space-sm); }
    
    @media(max-width: 768px) { .admin-layout { grid-template-columns: 1fr; } }
  `]
})
export class AdminComponent implements OnInit {
  activeTab = signal('reports');
  reports = signal<any[]>([]);

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    this.loadReports();
  }

  async loadReports() {
    const { data } = await this.supabase.client
      .from('reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) this.reports.set(data);
  }

  async resolveReport(id: string, status: 'reviewed' | 'dismissed') {
    await this.supabase.client.from('reports').update({ status }).eq('id', id);
    this.reports.update(rs => rs.filter(r => r.id !== id));
  }
}
