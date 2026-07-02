import { Component, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { PostsService, Post } from '../../core/services/posts.service';
import { CategoriesService, Category } from '../../core/services/categories.service';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent],
  template: `
    <div class="category-detail-page container">
      <div class="breadcrumb">
        <a routerLink="/home">Inicio</a>
        <span>/</span>
        <a routerLink="/categories">Categorías</a>
        <span>/</span>
        <span>{{ category()?.name || 'Cargando...' }}</span>
      </div>

      <div class="category-header card" *ngIf="category()" [style.--cat-color]="category()?.color">
        <div class="cat-header-inner">
          <div class="cat-info">
            <span class="cat-badge" [style.background]="category()?.color + '20'" [style.color]="category()?.color">
              {{ category()?.name }}
            </span>
            <h1 class="cat-title">{{ category()?.name }}</h1>
            <p class="cat-desc">{{ category()?.description }}</p>
          </div>
          <a routerLink="/new-post" [queryParams]="{category: category()?.id}" class="btn btn-primary">
            + Crear Post en {{ category()?.name }}
          </a>
        </div>
      </div>

      <div class="main-content">
        <div class="posts-list" *ngIf="!loading()">
          <app-post-card *ngFor="let post of posts()" [post]="post"></app-post-card>
          
          <div class="empty-state card" *ngIf="posts().length === 0">
            <img src="assets/ucmito atencion dedo arriba.png" alt="Ucmito atención" class="empty-state-img">
            <h3>No hay publicaciones en esta categoría</h3>
            <p>¡Sé el primero en iniciar una conversación!</p>
          </div>
        </div>

        <div class="posts-list" *ngIf="loading()">
          <div class="skeleton-card card" *ngFor="let i of [1,2,3]">
            <div class="skeleton" style="width: 60%; height: 20px; margin-bottom: 12px"></div>
            <div class="skeleton" style="width: 100%; height: 14px; margin-bottom: 8px"></div>
            <div class="skeleton" style="width: 80%; height: 14px; margin-bottom: 16px"></div>
          </div>
        </div>

        <button class="btn btn-ghost full-width load-more" *ngIf="hasMore()" (click)="loadMore()" [disabled]="loadingMore()">
          {{ loadingMore() ? 'Cargando...' : 'Cargar más' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .category-detail-page { padding-top: calc(var(--navbar-height) + var(--space-lg)); padding-bottom: var(--space-xl); max-width: 900px; }
    .breadcrumb {
      display: flex; align-items: center; gap: var(--space-sm);
      font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: var(--space-lg);
    }
    .breadcrumb a { color: var(--color-primary-light); }
    
    .category-header { margin-bottom: var(--space-xl); border-top: 4px solid var(--cat-color); }
    .cat-header-inner { display: flex; justify-content: space-between; align-items: center; padding: var(--space-xl); flex-wrap: wrap; gap: var(--space-md); }
    .cat-badge { padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700; display: inline-block; margin-bottom: var(--space-sm); }
    .cat-title { font-size: 2rem; font-weight: 800; margin-bottom: var(--space-xs); line-height: 1.2; }
    .cat-desc { color: var(--color-text-secondary); font-size: 1.05rem; }
    
    .posts-list { display: flex; flex-direction: column; gap: var(--space-md); }
    .skeleton-card { padding: var(--space-lg); }
    .load-more { margin-top: var(--space-lg); }
  `]
})
export class CategoryDetailComponent implements OnInit {
  category = signal<Category | null>(null);
  posts = signal<Post[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(false);
  page = 0;

  constructor(
    private route: ActivatedRoute,
    private categoriesService: CategoriesService,
    private postsService: PostsService
  ) {
    effect(() => {
      // Re-run when categories are loaded if not ready
      if (this.categoriesService.categories().length > 0 && !this.category()) {
        this.loadCategoryData();
      }
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.loadCategoryData();
    });
  }

  async loadCategoryData() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;

    const cat = this.categoriesService.getCategoryBySlug(slug);
    if (cat) {
      this.category.set(cat);
      await this.loadPosts(cat.id);
    }
  }

  async loadPosts(categoryId: number) {
    this.loading.set(true);
    this.page = 0;
    try {
      const { posts, count } = await this.postsService.getPosts({
        category_id: categoryId, page: 0, limit: 20
      });
      this.posts.set(posts);
      this.hasMore.set(posts.length < count);
    } finally {
      this.loading.set(false);
    }
  }

  async loadMore() {
    if (!this.category()) return;
    this.loadingMore.set(true);
    this.page++;
    try {
      const { posts, count } = await this.postsService.getPosts({
        category_id: this.category()!.id, page: this.page, limit: 20
      });
      this.posts.update(p => [...p, ...posts]);
      this.hasMore.set(this.posts().length < count);
    } finally {
      this.loadingMore.set(false);
    }
  }
}
