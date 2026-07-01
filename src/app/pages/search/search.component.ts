import { Component, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { PostsService, Post } from '../../core/services/posts.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent],
  template: `
    <div class="search-page container">
      <div class="search-header card">
        <h1>Resultados de Búsqueda</h1>
        <p>Buscando: <strong>"{{ query() }}"</strong></p>
      </div>

      <div class="search-tabs">
        <button class="tab-btn active">Publicaciones ({{ count() }})</button>
        <button class="tab-btn disabled" title="Próximamente">Materiales (0)</button>
      </div>

      <div class="posts-list" *ngIf="!loading()">
        <app-post-card *ngFor="let post of posts()" [post]="post"></app-post-card>
        
        <div class="empty-state card" *ngIf="posts().length === 0">
          <div class="empty-state-icon">🔍</div>
          <h3>No encontramos resultados para "{{ query() }}"</h3>
          <p>Revisa la ortografía o intenta con palabras más generales.</p>
        </div>
      </div>

      <div class="posts-list" *ngIf="loading()">
        <div class="skeleton-card card" *ngFor="let i of [1,2]">
          <div class="skeleton" style="width: 60%; height: 20px; margin-bottom: 12px"></div>
          <div class="skeleton" style="width: 100%; height: 14px; margin-bottom: 8px"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-page { padding-top: calc(var(--navbar-height) + var(--space-lg)); padding-bottom: var(--space-xl); max-width: 900px; }
    .search-header { padding: var(--space-xl); margin-bottom: var(--space-lg); text-align: center; }
    .search-header h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: var(--space-xs); }
    .search-header p { color: var(--color-text-secondary); font-size: 1.1rem; }
    
    .search-tabs { display: flex; gap: 8px; margin-bottom: var(--space-md); }
    .tab-btn { padding: 10px 20px; border-radius: var(--radius-full); font-weight: 600; border: none; background: var(--color-bg-alt); color: var(--color-text-muted); cursor: pointer; }
    .tab-btn.active { background: var(--color-primary); color: white; }
    .tab-btn.disabled { opacity: 0.5; cursor: not-allowed; }
    
    .posts-list { display: flex; flex-direction: column; gap: var(--space-md); }
    .skeleton-card { padding: var(--space-lg); }
  `]
})
export class SearchComponent implements OnInit {
  query = signal('');
  posts = signal<Post[]>([]);
  count = signal(0);
  loading = signal(true);

  constructor(private route: ActivatedRoute, private postsService: PostsService) {
    effect(() => {
      if (this.query()) this.performSearch(this.query());
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.query.set(params['q'] || '');
    });
  }

  async performSearch(q: string) {
    this.loading.set(true);
    try {
      const { posts, count } = await this.postsService.getPosts({ search: q, limit: 30 });
      this.posts.set(posts);
      this.count.set(count);
    } finally {
      this.loading.set(false);
    }
  }
}
