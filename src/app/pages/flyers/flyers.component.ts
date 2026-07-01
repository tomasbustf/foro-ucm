import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';

interface Flyer {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string;
  contact_info: string;
  created_at: string;
  profiles?: { full_name: string, username: string, avatar_url: string };
}

@Component({
  selector: 'app-flyers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flyers-page container">
      <div class="page-header">
        <div class="header-text">
          <h1>Diario Mural / Afiches</h1>
          <p>Comparte afiches, eventos, avisos o negocios con la comunidad UCM. (Máx. 1 afiche cada 48h por usuario)</p>
        </div>
        <button class="btn btn-primary" *ngIf="auth.isAuthenticated()" (click)="showModal.set(true)">
          + Publicar Aviso
        </button>
      </div>

      <div class="flyers-grid">
        <div class="flyer-card card" *ngFor="let flyer of flyers()">
          <div class="flyer-image" [style.background-image]="'url(' + flyer.image_url + ')'"></div>
          <div class="flyer-content">
            <h3>{{ flyer.title }}</h3>
            <p class="flyer-desc">{{ flyer.description }}</p>
            
            <div class="flyer-contact" *ngIf="flyer.contact_info">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              {{ flyer.contact_info }}
            </div>
          </div>
          <div class="flyer-footer">
            <div class="user-info">
              <div class="user-avatar" [style.background-image]="flyer.profiles?.avatar_url ? 'url(' + flyer.profiles?.avatar_url + ')' : 'none'">
                <ng-container *ngIf="!flyer.profiles?.avatar_url">{{ (flyer.profiles?.full_name || flyer.profiles?.username)?.charAt(0)?.toUpperCase() }}</ng-container>
              </div>
              <span class="user-name">{{ flyer.profiles?.full_name || flyer.profiles?.username }}</span>
            </div>
            <button class="btn btn-icon delete-btn" *ngIf="flyer.user_id === auth.profile()?.id" (click)="deleteFlyer(flyer.id)" title="Eliminar">🗑️</button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state card" *ngIf="flyers().length === 0 && !loading()">
        <div class="empty-state-icon">📌</div>
        <h3>No hay afiches aún</h3>
        <p>¡Sé el primero en colgar un afiche en el diario mural!</p>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading()">
        <p>Cargando avisos...</p>
      </div>

      <!-- Create Modal -->
      <div class="modal-backdrop" *ngIf="showModal()" (click)="showModal.set(false)">
        <div class="modal card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Publicar Afiche</h2>
            <button class="close-btn" (click)="showModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Título del afiche</label>
              <input type="text" class="input-field" [(ngModel)]="newFlyer.title" placeholder="Ej: Torneo de Futbolito, Venta de apuntes...">
            </div>
            
            <div class="form-group">
              <label>Imagen / Flyer (Obligatorio)</label>
              <input type="file" class="input-field" accept="image/*" (change)="onFileSelected($event)">
              <div class="image-preview" *ngIf="imagePreview()">
                <img [src]="imagePreview()" alt="Preview">
              </div>
            </div>

            <div class="form-group">
              <label>Descripción</label>
              <textarea class="input-field" rows="3" [(ngModel)]="newFlyer.description" placeholder="Detalles de lo que ofreces..."></textarea>
            </div>

            <div class="form-group">
              <label>Información de Contacto</label>
              <input type="text" class="input-field" [(ngModel)]="newFlyer.contact_info" placeholder="Instagram, WhatsApp, etc.">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="createFlyer()" [disabled]="!newFlyer.title || !selectedFile || uploading()">
              {{ uploading() ? 'Publicando...' : 'Publicar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .flyers-page { padding-top: calc(var(--navbar-height) + var(--space-xl)); padding-bottom: var(--space-xl); }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--space-xl); flex-wrap: wrap; gap: var(--space-md); }
    .header-text h1 { font-size: 2rem; font-weight: 800; color: var(--color-primary); margin-bottom: 4px; }
    .header-text p { color: var(--color-text-muted); font-size: 1.05rem; }
    
    .flyers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-lg); }
    
    .flyer-card { overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s; padding: 0; }
    .flyer-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    
    .flyer-image { width: 100%; height: 200px; background-size: cover; background-position: center; background-color: var(--color-bg-alt); }
    
    .flyer-content { padding: var(--space-md); flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .flyer-content h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--color-text); line-height: 1.3; }
    .flyer-desc { font-size: 0.9rem; color: var(--color-text-secondary); margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .flyer-contact { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--color-primary); font-weight: 600; margin-top: auto; padding-top: 8px; }
    
    .flyer-footer { padding: 12px var(--space-md); border-top: 1px solid var(--color-border-light); display: flex; justify-content: space-between; align-items: center; background: var(--color-bg-alt); }
    .user-info { display: flex; align-items: center; gap: 8px; }
    .user-avatar { width: 24px; height: 24px; border-radius: 50%; background-color: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; background-size: cover; background-position: center; }
    .user-name { font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); }
    .delete-btn { width: 28px; height: 28px; font-size: 0.9rem; }
    .delete-btn:hover { background: rgba(200, 16, 46, 0.1); }
    
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: var(--space-md); backdrop-filter: blur(4px); }
    .modal { width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; }
    .modal-header { padding: var(--space-md) var(--space-lg); border-bottom: 1px solid var(--color-border-light); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--color-text-muted); }
    .modal-body { padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-md); }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
    .image-preview { margin-top: 8px; width: 100%; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--color-border-light); }
    .image-preview img { width: 100%; height: auto; display: block; }
    .modal-footer { padding: var(--space-md) var(--space-lg); border-top: 1px solid var(--color-border-light); display: flex; justify-content: flex-end; gap: var(--space-sm); background: var(--color-bg-alt); }
    
    .loading-state, .empty-state { text-align: center; padding: 60px 20px; }
  `]
})
export class FlyersComponent implements OnInit {
  flyers = signal<Flyer[]>([]);
  loading = signal(true);
  
  showModal = signal(false);
  uploading = signal(false);
  
  newFlyer = {
    title: '',
    description: '',
    contact_info: ''
  };
  
  selectedFile: File | null = null;
  imagePreview = signal<string | null>(null);

  constructor(public auth: AuthService, private supabase: SupabaseService) {}

  ngOnInit() {
    this.loadFlyers();
  }

  async loadFlyers() {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('flyers')
        .select(`
          *,
          profiles(full_name, username, avatar_url)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      this.flyers.set(data as Flyer[]);
    } catch (e) {
      console.error('Error loading flyers:', e);
    } finally {
      this.loading.set(false);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async createFlyer() {
    if (!this.selectedFile || !this.newFlyer.title) return;
    
    const user = this.auth.profile();
    if (!user) return;

    this.uploading.set(true);
    try {
      // Check 48h rate limit
      const { data: lastPosts } = await this.supabase.client
        .from('flyers')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastPosts && lastPosts.length > 0) {
        const lastPostTime = new Date(lastPosts[0].created_at).getTime();
        const now = new Date().getTime();
        const hoursDiff = (now - lastPostTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 48) {
          const remainingHours = Math.ceil(48 - hoursDiff);
          alert(`Solo puedes publicar un afiche cada 48 horas. Vuelve a intentarlo en ${remainingHours} horas.`);
          this.uploading.set(false);
          return;
        }
      }

      // 1. Upload Image
      const fileExt = this.selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await this.supabase.client.storage
        .from('flyers')
        .upload(filePath, this.selectedFile);

      if (uploadError) throw uploadError;

      const { data: imgData } = this.supabase.client.storage
        .from('flyers')
        .getPublicUrl(filePath);

      // 2. Insert Flyer Record
      const { error: insertError } = await this.supabase.client
        .from('flyers')
        .insert({
          user_id: user.id,
          title: this.newFlyer.title,
          description: this.newFlyer.description,
          contact_info: this.newFlyer.contact_info,
          image_url: imgData.publicUrl
        });

      if (insertError) throw insertError;

      // 3. Reset and reload
      this.showModal.set(false);
      this.newFlyer = { title: '', description: '', contact_info: '' };
      this.selectedFile = null;
      this.imagePreview.set(null);
      this.loadFlyers();

    } catch (e) {
      console.error('Error creating flyer:', e);
      alert('Hubo un error al publicar el aviso.');
    } finally {
      this.uploading.set(false);
    }
  }

  async deleteFlyer(id: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este aviso?')) return;
    
    try {
      const { error } = await this.supabase.client.from('flyers').delete().eq('id', id);
      if (error) throw error;
      this.flyers.set(this.flyers().filter(f => f.id !== id));
    } catch (e) {
      console.error('Error deleting flyer:', e);
    }
  }
}
