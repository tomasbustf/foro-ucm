import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { VoteButtonsComponent } from '../../shared/components/vote-buttons/vote-buttons.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { PostsService, Post } from '../../core/services/posts.service';
import { RepliesService, Reply } from '../../core/services/replies.service';
import { AuthService } from '../../core/services/auth.service';
import { ReportsService } from '../../core/services/reports.service';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, VoteButtonsComponent, TimeAgoPipe],
  template: `
    <div class="post-detail-page container" *ngIf="post()">
      <div class="post-detail-layout">
        <main class="post-main">
          <!-- Breadcrumb -->
          <div class="breadcrumb">
            <a routerLink="/home">Inicio</a>
            <span>/</span>
            <a [routerLink]="['/category', post()!.category?.slug]">{{ post()!.category?.name }}</a>
            <span>/</span>
            <span>Post</span>
          </div>

          <!-- Post -->
          <article class="post-article card">
            <div class="post-top-row">
              <app-vote-buttons [targetId]="post()!.id" targetType="post"
                [upvotes]="post()!.upvotes" [downvotes]="post()!.downvotes">
              </app-vote-buttons>
              <div class="post-body">
                <div class="post-badges">
                  <span class="badge pinned" *ngIf="post()!.is_pinned">📌 Fijado</span>
                  <span class="badge solved" *ngIf="post()!.is_solved">✅ Resuelto</span>
                  <span class="category-badge" [style.background]="post()!.category?.color + '18'"
                        [style.color]="post()!.category?.color">{{ post()!.category?.name }}</span>
                </div>
                <h1 class="post-title">{{ post()!.title }}</h1>
                <div class="post-meta-row">
                  <span class="author-link">
                    <span class="avatar-sm">{{ (post()!.author?.full_name || post()!.author?.username)?.charAt(0)?.toUpperCase() }}</span>
                    {{ post()!.author?.full_name || post()!.author?.username }}
                  </span>
                  <span class="meta-sep">·</span>
                  <span>{{ post()!.created_at | timeAgo }}</span>
                  <span class="meta-sep">·</span>
                  <span>{{ post()!.view_count }} vistas</span>
                </div>
                <div class="markdown-content" [innerHTML]="renderMarkdown(post()!.content)"></div>
                <div class="post-tags" *ngIf="post()!.tags?.length">
                  <span class="tag" *ngFor="let t of post()!.tags">{{ t }}</span>
                </div>
                <div class="post-actions-row">
                  <button class="btn btn-ghost btn-sm" *ngIf="isAuthor()"
                          (click)="toggleSolved()">
                    {{ post()!.is_solved ? '↩️ Desmarcar resuelto' : '✅ Marcar resuelto' }}
                  </button>
                  <button class="btn btn-ghost btn-sm report-btn" *ngIf="auth.isAuthenticated()" (click)="openReportModal(post()!.id, 'post')">
                    🚩 Reportar
                  </button>
                </div>
              </div>
            </div>
          </article>

          <!-- Replies -->
          <section class="replies-section">
            <h2 class="replies-heading">{{ replies().length }} Respuesta{{ replies().length !== 1 ? 's' : '' }}</h2>

            <div class="reply-card card" *ngFor="let reply of replies()"
                 [class.accepted]="reply.is_accepted">
              <div class="reply-row">
                <app-vote-buttons [targetId]="reply.id" targetType="reply"
                  [upvotes]="reply.upvotes" [downvotes]="reply.downvotes">
                </app-vote-buttons>
                <div class="reply-body">
                  <div class="reply-accepted-badge" *ngIf="reply.is_accepted">✅ Respuesta aceptada</div>
                  <div class="markdown-content" [innerHTML]="renderMarkdown(reply.content)"></div>
                  <div class="reply-meta">
                    <span>{{ reply.author?.full_name || reply.author?.username }}</span>
                    <span class="meta-sep">·</span>
                    <span>{{ reply.created_at | timeAgo }}</span>
                    <button class="btn btn-ghost btn-sm" *ngIf="isAuthor() && !reply.is_accepted"
                            (click)="acceptReply(reply)">Aceptar respuesta</button>
                  </div>

                  <!-- Nested replies -->
                  <div class="nested-replies" *ngIf="reply.children?.length">
                    <div class="nested-reply" *ngFor="let child of reply.children">
                      <div class="markdown-content" [innerHTML]="renderMarkdown(child.content)"></div>
                      <div class="reply-meta">
                        <span>{{ child.author?.full_name || child.author?.username }}</span>
                        <span class="meta-sep">·</span>
                        <span>{{ child.created_at | timeAgo }}</span>
                      </div>
                    </div>
                  </div>

                  <button class="btn btn-ghost btn-sm reply-to-btn" (click)="setReplyingTo(reply.id)"
                          *ngIf="auth.isAuthenticated()">
                    💬 Responder
                  </button>
                </div>
              </div>
            </div>

            <!-- Reply editor -->
            <div class="reply-editor card" *ngIf="auth.isAuthenticated()">
              <h3>{{ replyingTo() ? 'Responder al comentario' : 'Tu respuesta' }}</h3>
              <button class="btn btn-ghost btn-sm" *ngIf="replyingTo()" (click)="replyingTo.set(null)">
                ✕ Cancelar respuesta anidada
              </button>
              <textarea class="input-field reply-textarea" [(ngModel)]="replyContent"
                        placeholder="Escribe tu respuesta... (Markdown soportado)" rows="5"></textarea>
              <div class="reply-editor-actions">
                <button class="btn btn-primary" (click)="submitReply()" [disabled]="!replyContent.trim() || submitting()">
                  {{ submitting() ? 'Publicando...' : 'Publicar respuesta' }}
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>

    <!-- Report Modal -->
    <div class="modal-backdrop" *ngIf="showReportModal()" (click)="closeReportModal()">
      <div class="modal-card card" (click)="$event.stopPropagation()">
        <h3>Reportar Publicación</h3>
        
        <div class="report-warning">
          <strong>⚠️ Advertencia:</strong> El buen uso de los reportes es obligatorio. Si realizas reportes falsos o malintencionados, tu cuenta será sancionada.
        </div>

        <label for="reportReason">Causa del reporte:</label>
        <select id="reportReason" class="input-field" [(ngModel)]="reportReason">
          <option value="" disabled selected>Selecciona una opción...</option>
          <option value="Contenido explícito o inapropiado">Contenido explícito o inapropiado</option>
          <option value="Acoso o ataque contra una persona">Acoso o ataque contra una persona</option>
          <option value="Información falsa / Desinformación">Información falsa / Desinformación</option>
          <option value="Spam o publicidad no autorizada">Spam o publicidad no autorizada</option>
          <option value="Otro motivo (incumplimiento de normas)">Otro motivo (incumplimiento de normas)</option>
        </select>

        <div class="modal-actions">
          <button class="btn btn-ghost" (click)="closeReportModal()">Cancelar</button>
          <button class="btn btn-primary" [disabled]="!reportReason || reportSubmitting()" (click)="submitReport()">
            {{ reportSubmitting() ? 'Enviando...' : 'Enviar Reporte' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-page" *ngIf="loading()">
      <div class="container" style="padding-top: calc(var(--navbar-height) + 32px)">
        <div class="skeleton" style="width:60%;height:32px;margin-bottom:16px"></div>
        <div class="skeleton" style="width:40%;height:16px;margin-bottom:32px"></div>
        <div class="skeleton" style="width:100%;height:200px;margin-bottom:16px"></div>
      </div>
    </div>
  `,
  styles: [`
    .post-detail-page { padding-top: calc(var(--navbar-height) + var(--space-lg)); padding-bottom: var(--space-xl); }
    .breadcrumb {
      display: flex; align-items: center; gap: var(--space-sm);
      font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: var(--space-md);
    }
    .breadcrumb a { color: var(--color-primary-light); }
    .post-article { padding: var(--space-xl); margin-bottom: var(--space-lg); }
    .post-top-row { display: flex; gap: var(--space-lg); }
    .post-body { flex: 1; }
    .post-badges { display: flex; gap: var(--space-sm); margin-bottom: var(--space-sm); flex-wrap: wrap; }
    .badge { padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.7rem; font-weight: 600; }
    .badge.pinned { background: var(--color-accent); color: #000; }
    .badge.solved { background: var(--color-success-bg); color: var(--color-success); }
    .category-badge { padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.7rem; font-weight: 600; }
    .post-title { font-size: 1.5rem; font-weight: 800; margin-bottom: var(--space-sm); line-height: 1.3; }
    .post-meta-row {
      display: flex; align-items: center; gap: var(--space-sm); flex-wrap: wrap;
      font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: var(--space-lg);
    }
    .avatar-sm {
      display: inline-flex; width: 24px; height: 24px; border-radius: 50%;
      background: var(--color-primary); color: white; font-size: 0.7rem; font-weight: 700;
      align-items: center; justify-content: center;
    }
    .author-link { display: flex; align-items: center; gap: 4px; font-weight: 500; }
    .meta-sep { opacity: 0.4; }
    .post-tags { display: flex; flex-wrap: wrap; gap: var(--space-xs); margin-top: var(--space-lg); }
    .post-actions-row { margin-top: var(--space-md); }
    .replies-section { margin-top: var(--space-lg); }
    .replies-heading { font-size: 1.1rem; font-weight: 700; margin-bottom: var(--space-md); }
    .reply-card { padding: var(--space-md) var(--space-lg); margin-bottom: var(--space-sm); }
    .reply-card.accepted { border-left: 4px solid var(--color-success); }
    .reply-row { display: flex; gap: var(--space-md); }
    .reply-body { flex: 1; }
    .reply-accepted-badge {
      font-size: 0.8rem; font-weight: 600; color: var(--color-success);
      margin-bottom: var(--space-sm);
    }
    .reply-meta {
      display: flex; align-items: center; gap: var(--space-sm); flex-wrap: wrap;
      font-size: 0.8rem; color: var(--color-text-muted); margin-top: var(--space-sm);
    }
    .nested-replies { margin-top: var(--space-md); padding-left: var(--space-lg); border-left: 2px solid var(--color-border-light); }
    .nested-reply { padding: var(--space-sm) 0; }
    .reply-to-btn { margin-top: var(--space-sm); }
    .reply-editor { padding: var(--space-lg); margin-top: var(--space-md); }
    .reply-editor h3 { font-size: 1rem; font-weight: 700; margin-bottom: var(--space-md); }
    .reply-textarea { min-height: 120px; resize: vertical; font-family: var(--font-mono); font-size: 0.9rem; }
    .reply-editor-actions {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: var(--space-md); flex-wrap: wrap; gap: var(--space-sm);
    }
    .anon-check { display: flex; align-items: center; gap: var(--space-xs); font-size: 0.85rem; color: var(--color-text-muted); cursor: pointer; }
    .loading-page { min-height: 100vh; }
    @media(max-width:768px) {
      .post-top-row, .reply-row { flex-direction: column; }
    }
    .report-btn { color: #d9534f; opacity: 0.8; }
    .report-btn:hover { color: #c9302c; opacity: 1; background: rgba(217, 83, 79, 0.1); }
    .modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center; }
    .modal-card { width: 100%; max-width: 450px; padding: var(--space-xl); animation: scaleIn 0.2s ease-out; }
    .modal-card h3 { margin-bottom: var(--space-md); font-weight: 700; color: var(--color-primary); }
    .report-warning { background: #fff3cd; color: #856404; border-left: 4px solid #ffeeba; padding: 10px 15px; margin-bottom: var(--space-md); font-size: 0.85rem; border-radius: 0 4px 4px 0; line-height: 1.4; }
    .modal-actions { display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg); }
  `]
})
export class PostDetailComponent implements OnInit, OnDestroy {
  post = signal<Post | null>(null);
  replies = signal<Reply[]>([]);
  loading = signal(true);
  submitting = signal(false);
  replyContent = '';

  replyingTo = signal<string | null>(null);
  private subscription: any;

  // Report state
  showReportModal = signal(false);
  reportReason = '';
  reportTargetId = '';
  reportTargetType: 'post' | 'reply' | 'material' = 'post';
  reportSubmitting = signal(false);

  constructor(
    private route: ActivatedRoute,
    private postsService: PostsService,
    private repliesService: RepliesService,
    private reportsService: ReportsService,
    public auth: AuthService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    try {
      const [post, replies] = await Promise.all([
        this.postsService.getPostById(id),
        this.repliesService.getRepliesByPost(id),
      ]);
      this.post.set(post);
      this.replies.set(replies);
    } finally {
      this.loading.set(false);
    }

    // Subscribe to realtime replies
    this.subscription = this.repliesService.subscribeToReplies(id, async () => {
      const replies = await this.repliesService.getRepliesByPost(id);
      this.replies.set(replies);
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  isAuthor(): boolean {
    return this.auth.user()?.id === this.post()?.author_id;
  }

  openReportModal(id: string, type: 'post' | 'reply' | 'material') {
    this.reportTargetId = id;
    this.reportTargetType = type;
    this.reportReason = '';
    this.showReportModal.set(true);
  }

  closeReportModal() {
    this.showReportModal.set(false);
  }

  async submitReport() {
    if (!this.reportReason) return;
    this.reportSubmitting.set(true);
    try {
      await this.reportsService.report(this.reportTargetId, this.reportTargetType, this.reportReason);
      alert('Reporte enviado correctamente. El equipo lo revisará.');
      this.closeReportModal();
    } catch (err: any) {
      alert(err.message || 'Error al enviar reporte');
    } finally {
      this.reportSubmitting.set(false);
    }
  }

  renderMarkdown(content: string): string {
    // Basic markdown rendering
    if (!content) return '';
    let html = content
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/\n/g, '<br>');
    return html;
  }

  async toggleSolved() {
    const p = this.post()!;
    await this.postsService.updatePost(p.id, { is_solved: !p.is_solved });
    this.post.set({ ...p, is_solved: !p.is_solved });
  }

  async acceptReply(reply: Reply) {
    await this.repliesService.acceptReply(reply.id, this.post()!.id);
    const replies = await this.repliesService.getRepliesByPost(this.post()!.id);
    this.replies.set(replies);
    this.post.update(p => p ? { ...p, is_solved: true } : p);
  }

  setReplyingTo(id: string) { this.replyingTo.set(id); }

  async submitReply() {
    if (!this.replyContent.trim()) return;
    this.submitting.set(true);
    try {
      const reply: any = {
        post_id: this.post()!.id, content: this.replyContent.trim(),
        author_id: this.auth.user()!.id, is_anonymous: false,
      };
      if (this.replyingTo()) reply.parent_reply_id = this.replyingTo();
      await this.repliesService.createReply(reply);
      this.replyContent = '';

      this.replyingTo.set(null);
      const replies = await this.repliesService.getRepliesByPost(this.post()!.id);
      this.replies.set(replies);
    } finally {
      this.submitting.set(false);
    }
  }
}
