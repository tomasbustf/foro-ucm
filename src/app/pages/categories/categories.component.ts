import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CategoriesService } from '../../core/services/categories.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="categories-page container">
      <div class="page-header">
        <h1>Categorías</h1>
        <p>Explora todos los temas del Foro UCM</p>
      </div>

      <div class="categories-grid">
        <a *ngFor="let cat of categories.categories()" [routerLink]="['/category', cat.slug]" 
           class="category-card card card-interactive" [style.--cat-color]="cat.color">
          <div class="cat-header">
            <div class="cat-icon-wrap" [style.background]="cat.color + '20'" [style.color]="cat.color">
              <i [class]="'lucide-' + cat.icon"></i>
              <span class="emoji-fallback">{{ getCatEmoji(cat.slug) }}</span>
            </div>
            <div class="cat-count">
              <span class="count-num">{{ cat.post_count }}</span>
              <span class="count-label">posts</span>
            </div>
          </div>
          <h2 class="cat-title">{{ cat.name }}</h2>
          <p class="cat-desc">{{ cat.description }}</p>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .categories-page { padding-top: calc(var(--navbar-height) + var(--space-xl)); padding-bottom: var(--space-xl); }
    .page-header { text-align: center; margin-bottom: var(--space-2xl); }
    .page-header h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: var(--space-sm); }
    .page-header p { color: var(--color-text-muted); font-size: 1.1rem; }
    
    .categories-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-lg);
    }
    
    .category-card {
      padding: var(--space-xl); text-decoration: none; color: inherit;
      border-top: 4px solid var(--cat-color); display: flex; flex-direction: column;
    }
    .cat-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-md); }
    .cat-icon-wrap {
      width: 56px; height: 56px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem;
    }
    .cat-count { text-align: right; }
    .count-num { display: block; font-size: 1.25rem; font-weight: 800; color: var(--color-text); line-height: 1; }
    .count-label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600; }
    .cat-title { font-size: 1.3rem; font-weight: 700; margin-bottom: var(--space-sm); }
    .cat-desc { color: var(--color-text-secondary); line-height: 1.5; font-size: 0.95rem; }
  `]
})
export class CategoriesComponent {
  constructor(public categories: CategoriesService) {}

  getCatEmoji(slug: string): string {
    const map: Record<string, string> = {
      'ramos': '📚', 'docentes': '👨‍🏫', 'becas': '🎓',
      'tramites': '📋', 'vida-universitaria': '🏛️', 'general': '💡',
    };
    return map[slug] || '📌';
  }
}
