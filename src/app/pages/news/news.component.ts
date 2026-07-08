import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { marked } from 'marked';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_id: string;
  author?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe],
  template: `
    <div class="news-page container">
      <div class="page-header">
        <div class="header-text">
          <h1>Avisos y Noticias</h1>
          <p>Información oficial y comunicados de los administradores del Foro UCM.</p>
        </div>
        <button class="btn btn-primary" *ngIf="isModerator()" (click)="showModal.set(true)">
          + Publicar Noticia
        </button>
      </div>

      <div class="news-list" *ngIf="!loading()">
        <div class="news-card card" *ngFor="let item of news()">
          <div class="news-header">
            <h2 class="news-title">{{ item.title }}</h2>
            <div class="news-meta">
              <div class="author-info">
                <div class="avatar-xs">
                  <ng-container *ngIf="!item.author?.avatar_url">{{ (item.author?.full_name || item.author?.username)?.charAt(0)?.toUpperCase() }}</ng-container>
                </div>
                <span>{{ item.author?.full_name || item.author?.username }} (Admin)</span>
              </div>
              <span class="meta-sep">·</span>
              <span class="date">{{ item.created_at | timeAgo }}</span>
            </div>
          </div>
          <div class="news-content markdown-content" [innerHTML]="renderMarkdown(item.content)"></div>
          <div class="news-actions" *ngIf="isModerator()">
            <button class="btn btn-ghost btn-sm text-danger" (click)="deleteNews(item.id)">Eliminar</button>
          </div>
        </div>

        <div class="empty-state card" *ngIf="news().length === 0">
          <div class="empty-state-icon">&bull;</div>
          <h3>No hay noticias recientes</h3>
          <p>Los comunicados oficiales aparecerán aquí.</p>
        </div>
      </div>

      <div class="loading-state" *ngIf="loading()">
        <p>Cargando noticias...</p>
      </div>

      <!-- Create Modal -->
      <div class="modal-backdrop" *ngIf="showModal()" (click)="showModal.set(false)">
        <div class="modal card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Publicar Noticia</h2>
            <button class="close-btn" (click)="showModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Título</label>
              <input type="text" class="input-field" [(ngModel)]="newTitle" placeholder="Ej: Mantenimiento programado">
            </div>
            <div class="form-group">
              <label>Contenido (Soporta Markdown)</label>
              <textarea class="input-field" rows="6" [(ngModel)]="newContent" placeholder="Detalles del aviso..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="publishNews()" [disabled]="!newTitle || !newContent || publishing()">
              {{ publishing() ? 'Publicando...' : 'Publicar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .news-page { padding-top: calc(var(--navbar-height) + var(--space-xl)); padding-bottom: var(--space-xl); max-width: 800px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--space-xl); flex-wrap: wrap; gap: var(--space-md); }
    .header-text h1 { font-size: 2.2rem; font-weight: 800; color: var(--color-primary); margin-bottom: 4px; }
    .header-text p { color: var(--color-text-muted); font-size: 1.05rem; }
    
    .news-list { display: flex; flex-direction: column; gap: var(--space-lg); }
    .news-card { padding: var(--space-xl); position: relative; border-top: 4px solid var(--color-primary); }
    .news-title { font-size: 1.5rem; font-weight: 800; margin-bottom: var(--space-sm); color: var(--color-text); line-height: 1.3; }
    .news-meta { display: flex; align-items: center; gap: var(--space-sm); font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: var(--space-lg); }
    .author-info { display: flex; align-items: center; gap: 6px; font-weight: 600; color: var(--color-primary); }
    .avatar-xs { width: 24px; height: 24px; border-radius: 50%; background: var(--color-primary-light); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; }
    
    .news-content { line-height: 1.6; color: var(--color-text-secondary); }
    .news-actions { margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--color-border-light); display: flex; justify-content: flex-end; }
    .text-danger { color: #dc2626; }
    
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: var(--space-md); backdrop-filter: blur(4px); }
    .modal { width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; }
    .modal-header { padding: var(--space-md) var(--space-lg); border-bottom: 1px solid var(--color-border-light); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--color-text-muted); }
    .modal-body { padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-md); }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
    .modal-footer { padding: var(--space-md) var(--space-lg); border-top: 1px solid var(--color-border-light); display: flex; justify-content: flex-end; gap: var(--space-sm); background: var(--color-bg-alt); }
    
    .loading-state, .empty-state { text-align: center; padding: 60px 20px; }
  `]
})
export class NewsComponent implements OnInit {
  news = signal<NewsItem[]>([]);
  loading = signal(true);
  
  showModal = signal(false);
  publishing = signal(false);
  newTitle = '';
  newContent = '';

  constructor(private supabase: SupabaseService, private auth: AuthService) {}

  ngOnInit() {
    this.loadNews();
  }

  isModerator(): boolean {
    return !!this.auth.profile()?.is_moderator;
  }

  async loadNews() {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('news')
        .select('*, author:profiles!author_id(full_name, username, avatar_url)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      this.news.set(data as NewsItem[]);
    } catch (e) {
      console.error('Error loading news', e);
    } finally {
      this.loading.set(false);
    }
  }

  async publishNews() {
    if (!this.newTitle || !this.newContent) return;
    this.publishing.set(true);
    try {
      const { error } = await this.supabase.client.from('news').insert({
        title: this.newTitle,
        content: this.newContent,
        author_id: this.auth.profile()?.id
      });
      if (error) throw error;
      
      this.showModal.set(false);
      this.newTitle = '';
      this.newContent = '';
      this.loadNews();
    } catch (e: any) {
      console.error('Error', e);
      alert('Error al publicar: ' + e.message);
    } finally {
      this.publishing.set(false);
    }
  }

  async deleteNews(id: string) {
    if (!confirm('¿Eliminar esta noticia?')) return;
    try {
      await this.supabase.client.from('news').delete().eq('id', id);
      this.news.set(this.news().filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  renderMarkdown(content: string): string {
    if (!content) return '';
    try {
      // Angular's innerHTML will handle dangerous tags, but we can do a basic escape
      // Actually, marked handles basic Markdown securely if configured, but default marked
      // in newer versions disables sanitize. Angular's DomSanitizer will sanitize the output.
      const parsed = marked.parse(content, { breaks: true });
      return parsed as string;
    } catch (e) {
      // Fallback
      return content
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
    }
  }
}
