import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  is_private: boolean;
  member_count?: number;
  activity_count?: number;
}

@Component({
  selector: 'app-communities',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="communities-page container">
      <!-- Search and Header -->
      <div class="communities-header">
        <div class="search-bar card">
          <input type="text" placeholder="Buscar comunidad..." [(ngModel)]="searchQuery" (input)="filterCommunities()">
          <button class="btn btn-primary" (click)="filterCommunities()">Buscar</button>
        </div>
        <button class="btn btn-primary create-btn" *ngIf="auth.isAuthenticated()" (click)="showCreateModal.set(true)">
          Crear Comunidad
        </button>
      </div>

      <div class="tabs">
        <button class="tab-btn active">Comunidades</button>
        <button class="tab-btn" *ngIf="auth.isAuthenticated()">Mis Solicitudes (0)</button>
      </div>

      <div class="subtitle">Sólo se listan las comunidades a las que se puede postular ({{ filteredCommunities().length }})</div>

      <!-- Communities Grid -->
      <div class="communities-grid" *ngIf="!loading()">
        <div class="community-card card" *ngFor="let com of filteredCommunities()">
          <!-- Color Header -->
          <div class="com-cover" [style.background]="com.color">
            <button class="btn btn-sm btn-postular" (click)="joinCommunity(com)">
              {{ com.is_private ? 'Solicitar Ingreso' : 'Unirse' }}
            </button>
          </div>
          
          <div class="com-body">
            <h3 class="com-title">{{ com.name }}</h3>
            <div class="com-slug">{{ com.slug }}</div>
            <p class="com-desc">{{ com.description }}</p>
          </div>
          
          <div class="com-footer">
            <div class="stat">
              <span class="stat-val">{{ com.activity_count || 0 }}</span>
              <span class="stat-lbl">Actividades</span>
            </div>
            <div class="stat">
              <span class="stat-val">-</span>
              <span class="stat-lbl">Última Actividad</span>
            </div>
            <div class="stat">
              <span class="stat-val">👥 {{ com.member_count || 0 }}</span>
              <span class="stat-lbl">Integrantes</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="loading-state" *ngIf="loading()">
        <p>Cargando comunidades...</p>
      </div>

      <!-- Create Modal -->
      <div class="modal-backdrop" *ngIf="showCreateModal()" (click)="showCreateModal.set(false)">
        <div class="modal card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Crear Comunidad</h2>
            <button class="close-btn" (click)="showCreateModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nombre de la comunidad</label>
              <input type="text" class="input-field" [(ngModel)]="newCom.name" (input)="generateSlug()" placeholder="Ej: Taller de Robótica">
            </div>
            <div class="form-group">
              <label>Identificador (Slug)</label>
              <input type="text" class="input-field" [(ngModel)]="newCom.slug" disabled>
            </div>
            <div class="form-group">
              <label>Descripción</label>
              <textarea class="input-field" rows="3" [(ngModel)]="newCom.description" placeholder="¿De qué trata esta comunidad?"></textarea>
            </div>
            <div class="form-group">
              <label>Color de portada</label>
              <input type="color" class="input-field" style="padding:0; height:40px; cursor:pointer;" [(ngModel)]="newCom.color">
            </div>
            <div class="form-group row-group" style="flex-direction:row; align-items:center;">
              <input type="checkbox" [(ngModel)]="newCom.is_private" id="is_priv">
              <label for="is_priv" style="margin:0; cursor:pointer;">Comunidad Privada (requiere aprobación)</label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showCreateModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="createCommunity()" [disabled]="!newCom.name || !newCom.description || creating()">
              {{ creating() ? 'Creando...' : 'Crear' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .communities-page { padding-top: calc(var(--navbar-height) + var(--space-lg)); padding-bottom: var(--space-xl); }
    
    .communities-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); flex-wrap: wrap; gap: var(--space-md); }
    .search-bar { flex: 1; max-width: 500px; display: flex; padding: 4px; gap: 4px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
    .search-bar input { flex: 1; border: none; padding: 8px 12px; background: transparent; outline: none; font-size: 0.95rem; }
    .create-btn { height: 100%; }
    
    .tabs { display: flex; gap: var(--space-sm); border-bottom: 1px solid var(--color-border-light); margin-bottom: var(--space-sm); }
    .tab-btn { padding: 12px 24px; border: none; background: none; font-weight: 600; color: var(--color-text-muted); cursor: pointer; border-bottom: 2px solid transparent; }
    .tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
    
    .subtitle { font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: var(--space-lg); }
    
    .communities-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-lg); }
    .community-card { display: flex; flex-direction: column; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
    .community-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    
    .com-cover { height: 80px; position: relative; display: flex; justify-content: flex-end; padding: 12px; }
    .btn-postular { background: rgba(0,0,0,0.3); color: white; border: none; backdrop-filter: blur(4px); font-size: 0.75rem; font-weight: 600; padding: 4px 12px; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
    .btn-postular:hover { background: rgba(0,0,0,0.5); }
    
    .com-body { padding: var(--space-md) var(--space-lg); flex: 1; display: flex; flex-direction: column; }
    .com-title { font-size: 1.25rem; font-weight: 800; color: var(--color-text); margin-bottom: 2px; }
    .com-slug { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 12px; font-weight: 600; letter-spacing: 0.5px; }
    .com-desc { font-size: 0.85rem; color: var(--color-text-secondary); line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
    
    .com-footer { display: flex; border-top: 1px solid var(--color-border-light); background: var(--color-bg-alt); padding: 8px 0; }
    .stat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border-right: 1px solid var(--color-border-light); }
    .stat:last-child { border-right: none; }
    .stat-val { font-size: 1rem; font-weight: 700; color: var(--color-text); }
    .stat-lbl { font-size: 0.65rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600; margin-top: 2px; }
    
    /* Modal styles */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: var(--space-md); backdrop-filter: blur(4px); }
    .modal { width: 100%; max-width: 500px; display: flex; flex-direction: column; }
    .modal-header { padding: var(--space-md) var(--space-lg); border-bottom: 1px solid var(--color-border-light); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--color-text-muted); }
    .modal-body { padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-md); }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
    .modal-footer { padding: var(--space-md) var(--space-lg); border-top: 1px solid var(--color-border-light); display: flex; justify-content: flex-end; gap: var(--space-sm); background: var(--color-bg-alt); }
    
    .loading-state { text-align: center; padding: 40px; color: var(--color-text-muted); }
  `]
})
export class CommunitiesComponent implements OnInit {
  communities = signal<Community[]>([]);
  filteredCommunities = signal<Community[]>([]);
  loading = signal(true);
  searchQuery = '';
  
  showCreateModal = signal(false);
  creating = signal(false);
  newCom = { name: '', slug: '', description: '', color: '#3b82f6', is_private: false };

  constructor(private supabase: SupabaseService, public auth: AuthService) {}

  ngOnInit() {
    this.loadCommunities();
  }

  async loadCommunities() {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('communities')
        .select('*, community_members(count)');
        
      if (error) throw error;
      
      const mapped = (data as any[]).map(c => ({
        ...c,
        member_count: c.community_members?.[0]?.count || 0
      }));
      
      this.communities.set(mapped);
      this.filterCommunities();
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }
  
  filterCommunities() {
    if (!this.searchQuery) {
      this.filteredCommunities.set(this.communities());
      return;
    }
    const q = this.searchQuery.toLowerCase();
    const filtered = this.communities().filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.description.toLowerCase().includes(q)
    );
    this.filteredCommunities.set(filtered);
  }
  
  generateSlug() {
    if (!this.newCom.name) {
      this.newCom.slug = '';
      return;
    }
    this.newCom.slug = this.newCom.name
      .toLowerCase()
      .normalize("NFD").replace(/[\\u0300-\\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphen
      .replace(/(^-|-$)+/g, ''); // remove leading/trailing hyphens
  }
  
  async createCommunity() {
    if (!this.newCom.name || !this.newCom.description) return;
    const user = this.auth.profile();
    if (!user) return;
    
    this.creating.set(true);
    try {
      // 1. Create Community
      const { data: com, error: comErr } = await this.supabase.client.from('communities').insert({
        name: this.newCom.name,
        slug: this.newCom.slug,
        description: this.newCom.description,
        color: this.newCom.color,
        is_private: this.newCom.is_private,
        created_by: user.id
      }).select().single();
      
      if (comErr) throw comErr;
      
      // 2. Add creator as Admin member
      await this.supabase.client.from('community_members').insert({
        community_id: com.id,
        user_id: user.id,
        role: 'admin',
        status: 'approved'
      });
      
      this.showCreateModal.set(false);
      this.newCom = { name: '', slug: '', description: '', color: '#3b82f6', is_private: false };
      this.loadCommunities();
      
    } catch(e: any) {
      console.error(e);
      alert('Error al crear comunidad. (¿El nombre ya existe?)');
    } finally {
      this.creating.set(false);
    }
  }
  
  async joinCommunity(com: Community) {
    if (!this.auth.isAuthenticated()) {
      alert('Debes iniciar sesión para unirte a una comunidad.');
      return;
    }
    
    const user = this.auth.profile();
    if (!user) return;
    
    try {
      const status = com.is_private ? 'pending' : 'approved';
      
      const { error } = await this.supabase.client.from('community_members').insert({
        community_id: com.id,
        user_id: user.id,
        role: 'member',
        status: status
      });
      
      if (error) {
        if (error.code === '23505') { // Unique violation
          alert('Ya eres miembro o tienes una solicitud pendiente en esta comunidad.');
        } else {
          throw error;
        }
      } else {
        alert(com.is_private ? 'Solicitud enviada a los administradores.' : '¡Te has unido exitosamente!');
        this.loadCommunities(); // Refresh count
      }
    } catch(e) {
      console.error(e);
      alert('Error al intentar unirse.');
    }
  }
}
