import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService, Profile } from '../../core/services/auth.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="profile-page container">
      <!-- Profile Header -->
      <div class="profile-header card">
        <div class="header-cover"></div>
        <div class="header-content">
          <div class="profile-avatar-wrapper" (click)="fileInput.click()">
            <div class="profile-avatar-large" 
                 [style.background-image]="profile()?.avatar_url ? 'url(' + profile()?.avatar_url + ')' : 'none'"
                 [style.background-size]="'cover'"
                 [style.background-position]="'center'">
              <ng-container *ngIf="!profile()?.avatar_url">
                {{ (profile()?.full_name || profile()?.username)?.charAt(0)?.toUpperCase() }}
              </ng-container>
            </div>
            <div class="avatar-edit-overlay">
              <span>Cambiar</span>
            </div>
            <input type="file" #fileInput (change)="uploadAvatar($event)" style="display: none" accept="image/*">
          </div>
          
          <div class="profile-info-main" *ngIf="!isEditing()">
            <div class="profile-title-row">
              <h1>{{ profile()?.full_name || profile()?.username }}</h1>
              <span class="rep-badge">
                {{ auth.getReputationLevel(profile()?.reputation || 0).emoji }} 
                {{ auth.getReputationLevel(profile()?.reputation || 0).label }}
                ({{ profile()?.reputation || 0 }} pts)
              </span>
            </div>
            <p class="profile-username">&#64;{{ profile()?.username }}</p>
            <div class="profile-details">
              <span>&sect; {{ profile()?.career }}</span>
              <span>Ingreso: {{ profile()?.year_of_entry }}</span>
            </div>
          </div>

          <div class="profile-info-main edit-form" *ngIf="isEditing()">
            <div class="input-group">
              <label>Carrera</label>
              <input type="text" [(ngModel)]="editForm.career" class="input-field">
            </div>
            <div class="input-group">
              <label>Año de Ingreso</label>
              <input type="number" [(ngModel)]="editForm.year_of_entry" class="input-field">
            </div>
          </div>
          
          <div class="profile-actions">
            <button class="btn btn-outline" *ngIf="!isEditing()" (click)="toggleEdit()">Editar Perfil</button>
            <button class="btn btn-primary" *ngIf="isEditing()" (click)="saveProfile()">Guardar Cambios</button>
            <button class="btn btn-ghost" *ngIf="isEditing()" (click)="toggleEdit()" style="margin-left: 8px;">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-value">{{ stats().posts }}</div>
          <div class="stat-label">Publicaciones</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">{{ stats().replies }}</div>
          <div class="stat-label">Respuestas dadas</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">{{ stats().accepted }}</div>
          <div class="stat-label">Respuestas aceptadas</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">{{ stats().materials }}</div>
          <div class="stat-label">Materiales aportados</div>
        </div>
      </div>

      <!-- Content Tabs -->
      <div class="profile-content">
        <div class="content-tabs">
          <button class="tab-btn" [class.active]="activeTab() === 'posts'" (click)="activeTab.set('posts')">Mis Publicaciones</button>
          <button class="tab-btn" [class.active]="activeTab() === 'replies'" (click)="activeTab.set('replies')">Mis Respuestas</button>
          <button class="tab-btn" [class.active]="activeTab() === 'materials'" (click)="activeTab.set('materials')">Mis Materiales</button>
        </div>
        
        <div class="tab-content card">
          <!-- Pending: proper lists for each tab. Showing a placeholder for now to keep it simple -->
          <div class="empty-state">
            <div class="empty-state-icon">&bull;</div>
            <h3>Sección en construcción</h3>
            <p>Pronto podrás ver tu historial completo de contribuciones aquí.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { padding-top: calc(var(--navbar-height) + var(--space-lg)); padding-bottom: var(--space-xl); max-width: 900px; }
    
    .profile-header { margin-bottom: var(--space-lg); overflow: hidden; }
    .header-cover { height: 120px; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); }
    .header-content { padding: 0 var(--space-xl) var(--space-xl); display: flex; gap: var(--space-lg); align-items: flex-end; margin-top: -40px; flex-wrap: wrap; }
    
    .profile-avatar-wrapper {
      position: relative; width: 100px; height: 100px; border-radius: 50%; z-index: 1;
      cursor: pointer; overflow: hidden; box-shadow: var(--shadow-sm); border: 4px solid var(--color-surface);
    }
    .profile-avatar-large {
      width: 100%; height: 100%; border-radius: 50%;
      background: var(--color-bg-alt); color: var(--color-primary); font-size: 3rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .avatar-edit-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.5); color: white;
      display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600;
      opacity: 0; transition: opacity 0.2s; border-radius: 50%;
    }
    .profile-avatar-wrapper:hover .avatar-edit-overlay { opacity: 1; }
    
    .edit-form { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; margin-top: 50px; }
    .edit-form .input-group { margin-bottom: 0; }
    
    .profile-info-main { flex: 1; min-width: 250px; margin-top: 50px; }
    .profile-title-row { display: flex; align-items: center; gap: var(--space-md); flex-wrap: wrap; margin-bottom: 4px; }
    .profile-title-row h1 { font-size: 1.5rem; font-weight: 800; margin: 0; line-height: 1; }
    .rep-badge { font-size: 0.8rem; font-weight: 700; background: var(--color-bg-alt); padding: 4px 10px; border-radius: var(--radius-full); }
    .profile-username { color: var(--color-text-muted); font-size: 0.95rem; margin-bottom: var(--space-sm); font-weight: 500; }
    .profile-details { display: flex; gap: var(--space-lg); font-size: 0.85rem; color: var(--color-text-secondary); }
    
    .profile-actions { margin-top: 50px; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-md); margin-bottom: var(--space-xl); }
    .stat-card { padding: var(--space-lg); text-align: center; }
    .stat-value { font-size: 1.75rem; font-weight: 800; color: var(--color-primary); line-height: 1.2; }
    .stat-label { font-size: 0.8rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; }
    
    .content-tabs { display: flex; gap: 4px; margin-bottom: var(--space-sm); }
    .tab-btn { padding: 12px 24px; border-radius: var(--radius-md) var(--radius-md) 0 0; background: transparent; border: none; font-weight: 600; color: var(--color-text-muted); cursor: pointer; }
    .tab-btn.active { background: var(--color-surface); color: var(--color-primary); box-shadow: 0 -2px 0 var(--color-primary) inset; }
    .tab-btn:hover:not(.active) { color: var(--color-text); }
    .tab-content { padding: var(--space-xl); border-radius: 0 var(--radius-md) var(--radius-md) var(--radius-md); }
    
    @media(max-width: 640px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .header-content { flex-direction: column; align-items: center; text-align: center; margin-top: -50px; }
      .profile-info-main { margin-top: var(--space-sm); display: flex; flex-direction: column; align-items: center; }
      .profile-details { flex-direction: column; gap: 4px; }
      .profile-actions { margin-top: var(--space-sm); width: 100%; }
      .profile-actions .btn { width: 100%; }
    }
  `]
})
export class MyProfileComponent implements OnInit {
  profile = signal<Profile | null>(null);
  activeTab = signal('posts');
  stats = signal({ posts: 0, replies: 0, accepted: 0, materials: 0 });
  isEditing = signal(false);
  editForm = { career: '', year_of_entry: 0 };

  constructor(public auth: AuthService, private supabase: SupabaseService) {}

  async ngOnInit() {
    this.profile.set(this.auth.profile() as Profile);
    if (!this.profile()) return;
    
    const userId = this.profile()!.id;
    
    const [posts, replies, accepted, materials] = await Promise.all([
      this.supabase.client.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId),
      this.supabase.client.from('replies').select('id', { count: 'exact', head: true }).eq('author_id', userId),
      this.supabase.client.from('replies').select('id', { count: 'exact', head: true }).eq('author_id', userId).eq('is_accepted', true),
      this.supabase.client.from('study_materials').select('id', { count: 'exact', head: true }).eq('uploader_id', userId)
    ]);
    
    this.stats.set({
      posts: posts.count || 0,
      replies: replies.count || 0,
      accepted: accepted.count || 0,
      materials: materials.count || 0
    });
  }

  toggleEdit() {
    if (this.isEditing()) {
      this.isEditing.set(false);
    } else {
      this.editForm = { 
        career: this.profile()?.career || '', 
        year_of_entry: this.profile()?.year_of_entry || 2026 
      };
      this.isEditing.set(true);
    }
  }

  async saveProfile() {
    try {
      await this.auth.updateProfile(this.editForm);
      this.isEditing.set(false);
    } catch (e) {
      alert('Error guardando perfil');
    }
  }

  async uploadAvatar(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${this.profile()!.id}-${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await this.supabase.client.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = this.supabase.client.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await this.auth.updateProfile({ avatar_url: data.publicUrl });
      // Update local profile representation
      this.profile.update(p => ({ ...p!, avatar_url: data.publicUrl }));
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error subiendo imagen');
    }
  }
}
