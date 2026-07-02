import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-community-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TimeAgoPipe],
  template: `
    <div class="community-detail container" *ngIf="community()">
      <!-- HEADER -->
      <div class="com-header" [style.border-left-color]="community()!.color">
        <div class="com-header-inner">
          <div class="com-icon" [style.background]="community()!.color">
            {{ community()!.name.charAt(0).toUpperCase() }}
          </div>
          <div class="com-header-info">
            <h1>{{ community()!.name }}</h1>
            <p class="com-desc">{{ community()!.description }}</p>
            <div class="com-meta">
              <span class="meta-item">{{ memberCount() }} miembros</span>
              <span class="meta-sep">&middot;</span>
              <span class="meta-item">{{ postCount() }} publicaciones</span>
              <span class="meta-sep" *ngIf="community()!.is_private">&middot;</span>
              <span class="meta-item private-tag" *ngIf="community()!.is_private">Privada</span>
            </div>
          </div>
          <div class="com-header-actions" *ngIf="!isMember()">
            <button class="btn btn-primary" (click)="joinCommunity()">
              {{ community()!.is_private ? 'Solicitar ingreso' : 'Unirse' }}
            </button>
          </div>
          <div class="com-header-actions" *ngIf="isMember() && !isAdmin()">
            <span class="member-badge">Miembro</span>
          </div>
          <div class="com-header-actions" *ngIf="isAdmin()">
            <span class="admin-badge">Administrador</span>
          </div>
        </div>
      </div>

      <!-- TABS -->
      <div class="detail-tabs">
        <button class="dtab" [class.active]="activeTab() === 'discussion'" (click)="activeTab.set('discussion')">
          Discusión
        </button>
        <button class="dtab" [class.active]="activeTab() === 'members'" (click)="activeTab.set('members')">
          Miembros ({{ memberCount() }})
        </button>
        <button class="dtab" [class.active]="activeTab() === 'info'" (click)="activeTab.set('info')">
          Información
        </button>
      </div>

      <!-- TAB: DISCUSSION -->
      <div class="tab-content" *ngIf="activeTab() === 'discussion'">
        <!-- New Post Form -->
        <div class="new-post-form card" *ngIf="isMember()">
          <div class="form-row-inline">
            <div class="author-avatar" [style.background]="community()!.color">
              {{ (auth.profile()?.full_name || auth.profile()?.username)?.charAt(0)?.toUpperCase() || '?' }}
            </div>
            <input type="text" class="input-field" placeholder="Título (opcional)" [(ngModel)]="newPostTitle">
          </div>
          <textarea class="input-field" rows="3" placeholder="Escribe algo para la comunidad..." [(ngModel)]="newPostContent"></textarea>
          <div class="form-actions">
            <select class="input-field type-select" [(ngModel)]="newPostType">
              <option value="discussion">Discusión</option>
              <option value="question">Pregunta</option>
              <option value="announcement" *ngIf="isAdmin()">Anuncio</option>
            </select>
            <button class="btn btn-primary btn-sm" (click)="createPost()" [disabled]="!newPostContent.trim() || creatingPost()">
              {{ creatingPost() ? 'Publicando...' : 'Publicar' }}
            </button>
          </div>
        </div>
        <div class="not-member-notice card" *ngIf="!isMember()">
          <p>Debes ser miembro de esta comunidad para participar en la discusión.</p>
        </div>

        <!-- Posts List -->
        <div class="com-post card" *ngFor="let post of posts()" [class.pinned]="post.is_pinned" [class.announcement]="post.type === 'announcement'">
          <div class="post-type-bar" *ngIf="post.type !== 'discussion'" [class.question]="post.type === 'question'" [class.announce]="post.type === 'announcement'">
            {{ post.type === 'question' ? 'PREGUNTA' : 'ANUNCIO' }}
          </div>
          <div class="com-post-header">
            <div class="post-avatar" [style.background]="community()!.color">
              {{ (post.author?.full_name || post.author?.username)?.charAt(0)?.toUpperCase() || '?' }}
            </div>
            <div class="post-author-info">
              <span class="post-author-name">{{ post.author?.full_name || post.author?.username }}</span>
              <span class="post-time">{{ post.created_at | timeAgo }}</span>
            </div>
            <span class="pin-icon" *ngIf="post.is_pinned" title="Fijado">&#9650;</span>
          </div>
          <h3 class="com-post-title" *ngIf="post.title">{{ post.title }}</h3>
          <p class="com-post-content">{{ post.content }}</p>
          <div class="com-post-footer">
            <button class="action-btn" (click)="toggleReplies(post)">
              {{ post.reply_count || 0 }} respuestas
            </button>
            <span class="post-votes">+{{ (post.upvotes || 0) - (post.downvotes || 0) }}</span>
          </div>

          <!-- Replies -->
          <div class="replies-section" *ngIf="post.showReplies">
            <div class="reply-item" *ngFor="let reply of post.replies">
              <div class="reply-avatar">{{ (reply.author?.full_name || reply.author?.username)?.charAt(0)?.toUpperCase() || '?' }}</div>
              <div class="reply-body">
                <div class="reply-meta">
                  <strong>{{ reply.author?.full_name || reply.author?.username }}</strong>
                  <span>{{ reply.created_at | timeAgo }}</span>
                </div>
                <p>{{ reply.content }}</p>
              </div>
            </div>
            <!-- Reply Input -->
            <div class="reply-input" *ngIf="isMember()">
              <input type="text" class="input-field" placeholder="Escribe una respuesta..." [(ngModel)]="post.replyDraft" (keydown.enter)="submitReply(post)">
              <button class="btn btn-sm btn-primary" (click)="submitReply(post)" [disabled]="!post.replyDraft?.trim()">Enviar</button>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="posts().length === 0 && !loadingPosts()">
          <h3>Sin publicaciones aún</h3>
          <p>Sé el primero en iniciar una discusión en esta comunidad.</p>
        </div>
        <div class="loading-state" *ngIf="loadingPosts()">Cargando discusiones...</div>
      </div>

      <!-- TAB: MEMBERS -->
      <div class="tab-content" *ngIf="activeTab() === 'members'">
        <div class="members-grid">
          <div class="member-card card" *ngFor="let m of members()">
            <div class="member-avatar" [style.background]="community()!.color">
              {{ (m.profile?.full_name || m.profile?.username)?.charAt(0)?.toUpperCase() || '?' }}
            </div>
            <div class="member-info">
              <div class="member-name">{{ m.profile?.full_name || m.profile?.username }}</div>
              <div class="member-career">{{ m.profile?.career || 'Estudiante UCM' }}</div>
              <div class="member-role" [class.role-admin]="m.role === 'admin'">{{ m.role === 'admin' ? 'Administrador' : 'Miembro' }}</div>
            </div>
          </div>
        </div>
        <div class="empty-state" *ngIf="members().length === 0">
          <h3>Sin miembros</h3>
        </div>
      </div>

      <!-- TAB: INFO -->
      <div class="tab-content" *ngIf="activeTab() === 'info'">
        <div class="info-card card">
          <h3>Acerca de esta comunidad</h3>
          <p>{{ community()!.description }}</p>
          <div class="info-row"><strong>Tipo:</strong> {{ community()!.is_private ? 'Privada (requiere aprobación)' : 'Abierta' }}</div>
          <div class="info-row"><strong>Creada:</strong> {{ community()!.created_at | timeAgo }}</div>
          <div class="info-row"><strong>Miembros:</strong> {{ memberCount() }}</div>
          <div class="info-row"><strong>Publicaciones:</strong> {{ postCount() }}</div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-state container" *ngIf="!community() && loading()" style="padding-top:120px; text-align:center;">
      Cargando comunidad...
    </div>
  `,
  styles: [`
    .community-detail { padding-top: calc(var(--navbar-height) + var(--space-lg)); padding-bottom: var(--space-xl); }

    .com-header {
      background: var(--color-surface); border: 1px solid var(--color-border-light);
      border-left: 5px solid; border-radius: var(--radius-lg); padding: var(--space-lg);
      margin-bottom: var(--space-md); box-shadow: var(--shadow-sm);
    }
    .com-header-inner { display: flex; align-items: flex-start; gap: var(--space-lg); }
    .com-icon {
      width: 56px; height: 56px; min-width: 56px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 800; color: white; font-family: 'Georgia', serif;
    }
    .com-header-info { flex: 1; }
    .com-header-info h1 { font-size: 1.4rem; font-weight: 800; margin-bottom: 4px; font-family: 'Georgia', serif; }
    .com-desc { font-size: 0.9rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 8px; }
    .com-meta { display: flex; gap: 8px; font-size: 0.8rem; color: var(--color-text-muted); align-items: center; }
    .meta-sep { opacity: 0.4; }
    .private-tag { background: var(--color-warning-bg); color: var(--color-warning); padding: 1px 8px; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.7rem; text-transform: uppercase; }
    .member-badge, .admin-badge {
      padding: 6px 14px; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 600;
      border: 1px solid var(--color-border);
    }
    .admin-badge { background: var(--color-primary); color: white; border-color: var(--color-primary); }

    .detail-tabs {
      display: flex; border-bottom: 2px solid var(--color-border-light); margin-bottom: var(--space-lg); gap: 0;
    }
    .dtab {
      padding: 12px 24px; border: none; background: none; font-weight: 600;
      color: var(--color-text-muted); cursor: pointer; border-bottom: 2px solid transparent;
      margin-bottom: -2px; font-size: 0.9rem; transition: all 0.2s;
    }
    .dtab.active { color: var(--color-primary); border-bottom-color: var(--color-secondary); }
    .dtab:hover:not(.active) { color: var(--color-text); }

    /* NEW POST FORM */
    .new-post-form { padding: var(--space-md); margin-bottom: var(--space-md); display: flex; flex-direction: column; gap: var(--space-sm); }
    .form-row-inline { display: flex; gap: var(--space-sm); align-items: center; }
    .author-avatar {
      width: 36px; height: 36px; min-width: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 0.85rem;
    }
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-sm); align-items: center; }
    .type-select { width: auto; padding: 6px 12px; font-size: 0.8rem; }
    .not-member-notice { padding: var(--space-lg); text-align: center; color: var(--color-text-muted); margin-bottom: var(--space-md); }

    /* POSTS */
    .com-post { padding: var(--space-md) var(--space-lg); margin-bottom: var(--space-sm); position: relative; }
    .com-post.pinned { border-left: 3px solid var(--color-accent); }
    .com-post.announcement { border-left: 3px solid var(--color-secondary); }
    .post-type-bar {
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
      padding: 2px 10px; border-radius: var(--radius-sm); display: inline-block; margin-bottom: 8px;
    }
    .post-type-bar.question { background: var(--color-info-bg); color: var(--color-info); }
    .post-type-bar.announce { background: var(--color-danger-bg); color: var(--color-danger); }
    .com-post-header { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: 8px; }
    .post-avatar {
      width: 32px; height: 32px; min-width: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 0.75rem;
    }
    .post-author-info { display: flex; flex-direction: column; }
    .post-author-name { font-weight: 600; font-size: 0.85rem; }
    .post-time { font-size: 0.75rem; color: var(--color-text-muted); }
    .pin-icon { color: var(--color-accent); font-size: 0.75rem; margin-left: auto; }
    .com-post-title { font-size: 1rem; font-weight: 700; margin-bottom: 6px; font-family: 'Georgia', serif; }
    .com-post-content { font-size: 0.9rem; color: var(--color-text-secondary); line-height: 1.6; white-space: pre-wrap; }
    .com-post-footer { display: flex; align-items: center; gap: var(--space-md); margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--color-border-light); }
    .action-btn { background: none; border: none; color: var(--color-text-muted); font-size: 0.8rem; cursor: pointer; font-weight: 500; }
    .action-btn:hover { color: var(--color-primary); }
    .post-votes { font-size: 0.8rem; font-weight: 600; color: var(--color-success); margin-left: auto; }

    /* REPLIES */
    .replies-section { margin-top: var(--space-sm); padding-top: var(--space-sm); border-top: 1px solid var(--color-border-light); }
    .reply-item { display: flex; gap: var(--space-sm); padding: 8px 0; }
    .reply-avatar {
      width: 26px; height: 26px; min-width: 26px; border-radius: 50%;
      background: var(--color-bg-alt); display: flex; align-items: center; justify-content: center;
      font-size: 0.65rem; font-weight: 700; color: var(--color-text-muted);
    }
    .reply-body { flex: 1; }
    .reply-meta { font-size: 0.8rem; margin-bottom: 2px; }
    .reply-meta strong { font-size: 0.8rem; }
    .reply-meta span { color: var(--color-text-muted); font-size: 0.7rem; margin-left: 8px; }
    .reply-body p { font-size: 0.85rem; color: var(--color-text-secondary); line-height: 1.5; margin: 0; }
    .reply-input { display: flex; gap: var(--space-sm); margin-top: var(--space-sm); }
    .reply-input .input-field { flex: 1; padding: 8px 12px; font-size: 0.85rem; }

    /* MEMBERS */
    .members-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-md); }
    .member-card { display: flex; align-items: center; gap: var(--space-md); padding: var(--space-md); }
    .member-avatar {
      width: 42px; height: 42px; min-width: 42px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 1rem;
    }
    .member-name { font-weight: 700; font-size: 0.9rem; }
    .member-career { font-size: 0.8rem; color: var(--color-text-muted); }
    .member-role { font-size: 0.7rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
    .member-role.role-admin { color: var(--color-primary); }

    /* INFO */
    .info-card { padding: var(--space-lg); }
    .info-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: var(--space-md); font-family: 'Georgia', serif; }
    .info-card p { color: var(--color-text-secondary); line-height: 1.6; margin-bottom: var(--space-lg); }
    .info-row { font-size: 0.9rem; padding: 8px 0; border-bottom: 1px solid var(--color-border-light); }
    .info-row:last-child { border-bottom: none; }

    .empty-state { text-align: center; padding: var(--space-3xl) var(--space-lg); color: var(--color-text-muted); }
    .empty-state h3 { font-size: 1.1rem; margin-bottom: 4px; color: var(--color-text); }
    .loading-state { text-align: center; padding: 40px; color: var(--color-text-muted); }

    @media(max-width:768px) {
      .com-header-inner { flex-direction: column; }
      .members-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CommunityDetailComponent implements OnInit {
  community = signal<any>(null);
  posts = signal<any[]>([]);
  members = signal<any[]>([]);
  loading = signal(true);
  loadingPosts = signal(false);
  activeTab = signal('discussion');
  isMember = signal(false);
  isAdmin = signal(false);
  memberCount = signal(0);
  postCount = signal(0);

  newPostTitle = '';
  newPostContent = '';
  newPostType = 'discussion';
  creatingPost = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabase: SupabaseService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.loadCommunity(params['slug']);
    });
  }

  async loadCommunity(slug: string) {
    this.loading.set(true);
    const { data, error } = await this.supabase.client
      .from('communities')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      this.router.navigate(['/communities']);
      return;
    }
    this.community.set(data);
    await Promise.all([this.checkMembership(), this.loadMembers(), this.loadPosts(), this.loadCounts()]);
    this.loading.set(false);
  }

  async checkMembership() {
    const user = this.auth.user();
    if (!user) return;
    const { data } = await this.supabase.client
      .from('community_members')
      .select('role, status')
      .eq('community_id', this.community()!.id)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();
    this.isMember.set(!!data);
    this.isAdmin.set(data?.role === 'admin');
  }

  async loadMembers() {
    const { data } = await this.supabase.client
      .from('community_members')
      .select('*, profile:profiles(*)')
      .eq('community_id', this.community()!.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });
    this.members.set(data || []);
  }

  async loadPosts() {
    this.loadingPosts.set(true);
    const { data } = await this.supabase.client
      .from('community_posts')
      .select('*, author:profiles(*)')
      .eq('community_id', this.community()!.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    const mapped = (data || []).map((p: any) => ({ ...p, showReplies: false, replies: [], replyDraft: '' }));
    this.posts.set(mapped);
    this.loadingPosts.set(false);
  }

  async loadCounts() {
    const { count: mc } = await this.supabase.client
      .from('community_members').select('*', { count: 'exact', head: true })
      .eq('community_id', this.community()!.id).eq('status', 'approved');
    this.memberCount.set(mc || 0);
    const { count: pc } = await this.supabase.client
      .from('community_posts').select('*', { count: 'exact', head: true })
      .eq('community_id', this.community()!.id);
    this.postCount.set(pc || 0);
  }

  async createPost() {
    if (!this.newPostContent.trim()) return;
    this.creatingPost.set(true);
    try {
      await this.supabase.client.from('community_posts').insert({
        community_id: this.community()!.id,
        author_id: this.auth.user()!.id,
        title: this.newPostTitle.trim() || null,
        content: this.newPostContent.trim(),
        type: this.newPostType,
      });
      this.newPostTitle = '';
      this.newPostContent = '';
      this.newPostType = 'discussion';
      await this.loadPosts();
      await this.loadCounts();
    } catch (e) { console.error(e); }
    this.creatingPost.set(false);
  }

  async toggleReplies(post: any) {
    post.showReplies = !post.showReplies;
    if (post.showReplies && post.replies.length === 0) {
      const { data } = await this.supabase.client
        .from('community_post_replies')
        .select('*, author:profiles(*)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      post.replies = data || [];
    }
  }

  async submitReply(post: any) {
    if (!post.replyDraft?.trim()) return;
    await this.supabase.client.from('community_post_replies').insert({
      post_id: post.id,
      author_id: this.auth.user()!.id,
      content: post.replyDraft.trim(),
    });
    // Update reply count
    await this.supabase.client.from('community_posts').update({
      reply_count: (post.reply_count || 0) + 1
    }).eq('id', post.id);
    post.reply_count = (post.reply_count || 0) + 1;
    post.replyDraft = '';
    // Reload replies
    const { data } = await this.supabase.client
      .from('community_post_replies')
      .select('*, author:profiles(*)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    post.replies = data || [];
  }

  async joinCommunity() {
    const user = this.auth.user();
    if (!user) return;
    const status = this.community()!.is_private ? 'pending' : 'approved';
    const { error } = await this.supabase.client.from('community_members').insert({
      community_id: this.community()!.id,
      user_id: user.id,
      role: 'member',
      status,
    });
    if (error?.code === '23505') {
      alert('Ya tienes una solicitud pendiente o eres miembro.');
    } else if (!error) {
      alert(this.community()!.is_private ? 'Solicitud enviada.' : 'Te has unido exitosamente.');
      await this.checkMembership();
      await this.loadMembers();
      await this.loadCounts();
    }
  }
}
