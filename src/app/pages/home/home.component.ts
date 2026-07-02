import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { PostsService, Post, PostFilters } from '../../core/services/posts.service';
import { CategoriesService, Category } from '../../core/services/categories.service';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent],
  template: `
    <div class="home-layout container">
      <!-- Left Sidebar -->
      <aside class="sidebar-left hide-mobile">
        <div class="sidebar-card card">
          <h3 class="sidebar-title">Categorías</h3>
          <a *ngFor="let cat of categories.categories()"
             [routerLink]="['/category', cat.slug]"
             class="cat-link" [class.active]="activeCategory() === cat.id">
            <span class="cat-dot" [style.background]="cat.color"></span>
            <span class="cat-name">{{ cat.name }}</span>
            <span class="cat-count-badge">{{ cat.post_count }}</span>
          </a>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-feed">
        <div class="feed-header">
          <h1>Feed Principal</h1>
          <div class="feed-tabs">
            <button *ngFor="let tab of tabs" class="tab-btn" [class.active]="activeTab() === tab.key"
                    (click)="switchTab(tab.key)">
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="posts-list" *ngIf="!loading()">
          <app-post-card *ngFor="let post of posts()" [post]="post"></app-post-card>
          <div class="empty-state" *ngIf="posts().length === 0">
            <div class="empty-state-icon">&#9998;</div>
            <h3>No hay publicaciones aún</h3>
            <p>¡Sé el primero en publicar una pregunta o compartir algo!</p>
            <a routerLink="/new-post" class="btn btn-primary" style="margin-top: 16px">Crear publicación</a>
          </div>
        </div>

        <!-- Skeleton -->
        <div class="posts-list" *ngIf="loading()">
          <div class="skeleton-card card" *ngFor="let i of [1,2,3,4,5]">
            <div class="skeleton" style="width: 60%; height: 20px; margin-bottom: 12px"></div>
            <div class="skeleton" style="width: 100%; height: 14px; margin-bottom: 8px"></div>
            <div class="skeleton" style="width: 80%; height: 14px; margin-bottom: 16px"></div>
            <div class="skeleton" style="width: 40%; height: 12px"></div>
          </div>
        </div>

        <!-- Load more -->
        <button class="btn btn-ghost full-width" *ngIf="hasMore()" (click)="loadMore()" [disabled]="loadingMore()">
          {{ loadingMore() ? 'Cargando...' : 'Cargar más publicaciones' }}
        </button>
      </main>

      <!-- Right Sidebar -->
      <aside class="sidebar-right hide-mobile">
        <div class="sidebar-card card">
          <h3 class="sidebar-title">Top Usuarios</h3>
          <div class="top-user" *ngFor="let u of topUsers()">
            <div class="top-avatar">{{ (u.full_name || u.username)?.charAt(0)?.toUpperCase() }}</div>
            <div class="top-info">
              <span class="top-name">{{ u.full_name || u.username }}</span>
              <span class="top-rep">{{ u.reputation }} pts</span>
            </div>
          </div>
          <div class="empty-mini" *ngIf="topUsers().length === 0">Sin datos aún</div>
        </div>

        <div class="sidebar-card card">
          <h3 class="sidebar-title">Más Vistos</h3>
          <a *ngFor="let p of topViewed()" [routerLink]="['/post', p.id]" class="trending-post">
            <span class="trending-title">{{ p.title }}</span>
            <span class="trending-views">{{ p.view_count }} vistas</span>
          </a>
          <div class="empty-mini" *ngIf="topViewed().length === 0">Sin datos aún</div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .home-layout {
      display: grid; grid-template-columns: 240px 1fr 260px; gap: var(--space-lg);
      padding-top: calc(var(--navbar-height) + var(--space-lg));
      padding-bottom: var(--space-xl); min-height: 100vh;
    }
    .sidebar-left, .sidebar-right { position: sticky; top: calc(var(--navbar-height) + var(--space-lg)); align-self: start; }
    .sidebar-card { padding: var(--space-md); margin-bottom: var(--space-md); }
    .sidebar-title { font-size: 0.9rem; font-weight: 700; margin-bottom: var(--space-md); color: var(--color-text); }
    .cat-link {
      display: flex; align-items: center; gap: var(--space-sm); padding: 8px var(--space-sm);
      border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--color-text-secondary);
      text-decoration: none; transition: all var(--transition-fast);
    }
    .cat-link:hover { background: var(--color-bg-alt); color: var(--color-text); }
    .cat-link.active { background: var(--color-primary); color: white; }
    .cat-link.active .cat-count-badge { background: rgba(255,255,255,0.2); color: white; }
    .cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .cat-name { flex: 1; }
    .cat-count-badge {
      background: var(--color-bg-alt); padding: 1px 6px; border-radius: var(--radius-full);
      font-size: 0.7rem; font-weight: 600;
    }
    .feed-header { margin-bottom: var(--space-lg); }
    .feed-header h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: var(--space-md); }
    .feed-tabs { display: flex; gap: 4px; background: var(--color-bg-alt); padding: 4px; border-radius: var(--radius-md); }
    .tab-btn {
      padding: 8px 16px; border-radius: var(--radius-sm); border: none; background: none;
      font-size: 0.85rem; font-weight: 500; color: var(--color-text-muted);
      cursor: pointer; transition: all var(--transition-fast);
    }
    .tab-btn.active { background: var(--color-surface); color: var(--color-text); font-weight: 600; box-shadow: var(--shadow-xs); }
    .tab-btn:hover:not(.active) { color: var(--color-text); }
    .posts-list { display: flex; flex-direction: column; gap: 2px; }
    .skeleton-card { padding: var(--space-lg); }
    .full-width { width: 100%; margin-top: var(--space-md); }
    .top-user { display: flex; align-items: center; gap: var(--space-sm); padding: 6px 0; }
    .top-avatar {
      width: 32px; height: 32px; border-radius: 50%; font-size: 0.75rem; font-weight: 700;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      color: white; display: flex; align-items: center; justify-content: center;
    }
    .top-info { display: flex; flex-direction: column; }
    .top-name { font-size: 0.85rem; font-weight: 600; }
    .top-rep { font-size: 0.75rem; color: var(--color-text-muted); }
    .trending-post {
      display: flex; flex-direction: column; padding: 8px 0;
      border-bottom: 1px solid var(--color-border-light); text-decoration: none;
    }
    .trending-post:last-child { border-bottom: none; }
    .trending-title { font-size: 0.83rem; font-weight: 500; color: var(--color-text); line-height: 1.4; }
    .trending-views { font-size: 0.7rem; color: var(--color-text-muted); }
    .empty-mini { font-size: 0.8rem; color: var(--color-text-muted); text-align: center; padding: var(--space-md) 0; }
    @media(max-width:1024px) { .home-layout { grid-template-columns: 1fr; } }
  `]
})
export class HomeComponent implements OnInit {
  tabs = [
    { key: 'recent', label: 'Recientes' }, { key: 'popular', label: 'Populares' },
    { key: 'unanswered', label: 'Sin respuesta' }, { key: 'solved', label: 'Resueltos' },
  ];
  activeTab = signal<string>('recent');
  activeCategory = signal<number | null>(null);
  posts = signal<Post[]>([]);
  topUsers = signal<any[]>([]);
  topViewed = signal<any[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(false);
  page = 0;

  constructor(
    public categories: CategoriesService,
    private postsService: PostsService,
    private supabase: SupabaseService,
    public auth: AuthService
  ) {}

  async ngOnInit() {
    await this.loadPosts();
    this.loadSidebar();
  }

  async loadPosts() {
    this.loading.set(true);
    this.page = 0;
    try {
      const { posts, count } = await this.postsService.getPosts({
        tab: this.activeTab() as any, page: 0, limit: 20,
      });
      this.posts.set(posts);
      this.hasMore.set(posts.length < count);
    } finally {
      this.loading.set(false);
    }
  }

  async loadMore() {
    this.loadingMore.set(true);
    this.page++;
    try {
      const { posts, count } = await this.postsService.getPosts({
        tab: this.activeTab() as any, page: this.page, limit: 20,
      });
      this.posts.update(p => [...p, ...posts]);
      this.hasMore.set(this.posts().length < count);
    } finally {
      this.loadingMore.set(false);
    }
  }

  switchTab(tab: string) {
    this.activeTab.set(tab);
    this.loadPosts();
  }

  private async loadSidebar() {
    const { data: users } = await this.supabase.client
      .from('profiles').select('username, full_name, reputation')
      .order('reputation', { ascending: false }).limit(5);
    this.topUsers.set(users || []);

    const top = await this.postsService.getTopViewedPosts(5);
    this.topViewed.set(top);
  }
}
