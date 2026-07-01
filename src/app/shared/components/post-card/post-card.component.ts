import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { Post } from '../../../core/services/posts.service';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeAgoPipe],
  template: `
    <a [routerLink]="['/post', post.id]" class="post-card card card-interactive">
      <!-- Pinned / Solved badges -->
      <div class="post-badges" *ngIf="post.is_pinned || post.is_solved">
        <span class="badge pinned" *ngIf="post.is_pinned">📌 Fijado</span>
        <span class="badge solved" *ngIf="post.is_solved">✅ Resuelto</span>
      </div>

      <div class="post-card-body">
        <!-- Vote column -->
        <div class="vote-col">
          <div class="vote-score" [class.positive]="score > 0" [class.negative]="score < 0">
            {{ score }}
          </div>
          <span class="vote-label">votos</span>
        </div>

        <!-- Content -->
        <div class="post-content">
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-preview">{{ post.content | slice:0:160 }}{{ post.content.length > 160 ? '...' : '' }}</p>

          <div class="post-tags" *ngIf="post.tags?.length">
            <span class="tag" *ngFor="let tag of post.tags?.slice(0, 4)">{{ tag }}</span>
          </div>

          <div class="post-meta">
            <span class="category-badge" [style.background]="post.category?.color + '18'" [style.color]="post.category?.color">
              {{ post.category?.name }}
            </span>
            <span class="meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {{ post.reply_count || 0 }}
            </span>
            <span class="meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              {{ post.view_count }}
            </span>
            <span class="meta-divider">·</span>
            <span class="meta-author">
              {{ post.author?.username || 'Usuario' }}
            </span>
            <span class="meta-divider">·</span>
            <span class="meta-time">{{ post.created_at | timeAgo }}</span>
          </div>
        </div>
      </div>
    </a>
  `,
  styles: [`
    .post-card {
      display: block; padding: var(--space-md) var(--space-lg);
      text-decoration: none; color: var(--color-text);
      animation: fadeIn 0.3s ease-out forwards;
    }
    .post-badges { display: flex; gap: var(--space-xs); margin-bottom: var(--space-sm); }
    .badge { padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.7rem; font-weight: 600; }
    .badge.pinned { background: var(--color-accent); color: #000; }
    .badge.solved { background: var(--color-success-bg); color: var(--color-success); }
    .post-card-body { display: flex; gap: var(--space-md); }
    .vote-col {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      min-width: 48px; padding-top: 2px;
    }
    .vote-score {
      font-size: 1.25rem; font-weight: 800; color: var(--color-text-muted);
      line-height: 1;
    }
    .vote-score.positive { color: var(--color-primary); }
    .vote-score.negative { color: var(--color-danger); }
    .vote-label { font-size: 0.65rem; color: var(--color-text-muted); text-transform: uppercase; }
    .post-content { flex: 1; min-width: 0; }
    .post-title {
      font-size: 1.05rem; font-weight: 700; margin-bottom: var(--space-xs);
      line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
    }
    .post-preview {
      font-size: 0.85rem; color: var(--color-text-secondary);
      line-height: 1.5; margin-bottom: var(--space-sm);
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
    }
    .post-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: var(--space-sm); }
    .post-meta {
      display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
      font-size: 0.8rem; color: var(--color-text-muted);
    }
    .category-badge {
      padding: 2px 8px; border-radius: var(--radius-full);
      font-size: 0.7rem; font-weight: 600;
    }
    .meta-item { display: flex; align-items: center; gap: 3px; }
    .meta-item svg { stroke: var(--color-text-muted); }
    .meta-divider { opacity: 0.4; }
    .meta-author { font-weight: 500; color: var(--color-text-secondary); }
    @media(max-width:768px) {
      .vote-col { display: none; }
      .post-card { padding: var(--space-md); }
    }
  `]
})
export class PostCardComponent {
  @Input() post!: Post;
  get score() { return (this.post?.upvotes || 0) - (this.post?.downvotes || 0); }
}
