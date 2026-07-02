import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CategoriesService } from '../../core/services/categories.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeAgoPipe],
  template: `
    <div class="landing-page">
      <!-- HERO -->
      <div class="hero">
        <div class="hero-inner">
          <div class="hero-badge">Plataforma Estudiantil Oficial</div>
          <h1>Tu espacio de <em>conocimiento compartido</em> en la UCM</h1>
          <p>Consulta, colabora y aprende junto a tu comunidad. Encuentra respuestas sobre ramos, docentes, becas y trámites en un solo lugar centralizado y confiable.</p>
          <div class="hero-btns">
            <a routerLink="/home" class="btn-hero-primary">Explorar el foro</a>
            <a routerLink="/materials" class="btn-hero-secondary">Ver material de estudio</a>
          </div>
        </div>
      </div>

      <!-- MAIN -->
      <div class="main">
        <!-- CATEGORÍAS -->
        <div class="section-title">Categorías</div>
        <div class="categories-grid">
          <a *ngFor="let cat of categories.categories()" [routerLink]="['/category', cat.slug]" class="cat-card" [style.--cat-color]="cat.color" [style.--cat-bg]="cat.color + '15'">
            <div class="cat-header">
              <div class="cat-icon">{{ getCatEmoji(cat.slug) }}</div>
              <div class="cat-name">{{ cat.name }}</div>
            </div>
            <div class="cat-desc">{{ cat.description }}</div>
            <div class="cat-count"><strong>{{ cat.post_count }}</strong> publicaciones</div>
          </a>
        </div>

        <!-- CONTENT + SIDEBAR -->
        <div class="content-layout">
          <div>
            <div class="section-title">Publicaciones recientes</div>
            <a routerLink="/new-post" class="new-post-btn">+ Nueva publicación</a>

            <div class="posts-tabs">
              <div class="tab active">Recientes</div>
              <div class="tab">Populares</div>
              <div class="tab">Sin respuesta</div>
              <div class="tab">Resueltos</div>
            </div>

            <a [routerLink]="['/post', post.id]" class="post-card" *ngFor="let post of recentPosts()">
              <div class="post-header">
                <span class="cat-pill" [style.--pill-bg]="post.category?.color + '20'" [style.--pill-color]="post.category?.color">{{ post.category?.name }}</span>
                <span class="post-tag" *ngFor="let tag of post.tags">{{ tag }}</span>
                <span class="solved-badge" *ngIf="post.is_solved">✓ Resuelto</span>
              </div>
              <div class="post-title">{{ post.title }}</div>
              <div class="post-preview">{{ getPreview(post.content) }}</div>
              <div class="post-footer">
                <div class="post-author">
                  <div class="avatar-xs">{{ (post.author?.full_name || post.author?.username)?.charAt(0)?.toUpperCase() || '?' }}</div>
                  {{ post.author?.full_name || post.author?.username }}
                </div>
                <span>{{ post.created_at | timeAgo }}</span>
                <div class="post-stats">
                  <span class="stat-pill">▲ {{ post.upvotes - post.downvotes }}</span>
                  <span class="stat-pill">&bull; {{ post.reply_count }}</span>
                  <span class="stat-pill">{{ post.view_count }} vistas</span>
                </div>
              </div>
            </a>
          </div>

          <!-- SIDEBAR -->
          <div>
            <div class="sidebar-card">
              <div class="sidebar-card-header">Top colaboradores</div>
              <div class="sidebar-card-body">
                <div class="user-item" *ngFor="let user of topUsers()">
                  <div class="avatar-sm">{{ (user.full_name || user.username)?.charAt(0)?.toUpperCase() }}</div>
                  <div>
                    <div class="user-name">{{ user.full_name || user.username }}</div>
                    <div class="user-rep"><span class="rep-badge">{{ user.reputation }} pts</span> &middot; {{ auth.getReputationLevel(user.reputation).label }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="sidebar-card">
              <div class="sidebar-card-header">Material reciente</div>
              <div class="sidebar-card-body">
                <a [routerLink]="['/materials']" class="material-item" *ngFor="let mat of recentMaterials()" style="text-decoration:none">
                  <div class="file-icon" [ngClass]="getIconClass(mat.file_type)">{{ getIconText(mat.file_type) }}</div>
                  <div>
                    <div class="mat-title">{{ mat.title }}</div>
                    <div class="mat-meta">{{ mat.subject_code || mat.career }} · {{ mat.download_count }} descargas</div>
                  </div>
                </a>
              </div>
            </div>

            <div class="sidebar-card">
              <div class="sidebar-card-header" style="background:#C8102E;">Avisos UCM</div>
              <div class="sidebar-card-body">
                <div style="font-size: 11.5px; color: #333; padding: 4px 0; border-bottom: 0.5px solid #f0f2f5; margin-bottom: 8px; padding-bottom: 8px;">
                  <strong style="color:#1B3A6B;">Evaluación Docente</strong><br>
                  <span style="color:#666;">Cierre: Próximamente</span>
                </div>
                <div style="font-size: 11.5px; color: #333;">
                  <strong style="color:#1B3A6B;">Período de matrícula</strong><br>
                  <span style="color:#666;">2° semestre</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- FOOTER -->
      <div class="footer">
        <div class="footer-top">
          <div class="footer-brand">
            <div class="footer-logo">
              <img src="assets/logo-ucm.png" alt="Logo UCM" class="logo-icon-footer" style="background: transparent; border-radius: 0;">
              <div class="logo-text" style="color:white;">Foro Estudiantil Digital UCM</div>
            </div>
            <div class="footer-desc">Plataforma colaborativa de la comunidad estudiantil de la Universidad Católica del Maule. Campus San Miguel, Talca.</div>
          </div>
          <div class="footer-col">
            <h4>Navegación</h4>
            <a routerLink="/home">Inicio</a>
            <a routerLink="/categories">Categorías</a>
            <a routerLink="/materials">Material de Estudio</a>
          </div>
          <div class="footer-col">
            <h4>UCM</h4>
            <a href="https://www.ucm.cl" target="_blank">Sitio oficial UCM</a>
            <a href="https://portal.ucm.cl" target="_blank">Portal Alumnos</a>
            <a href="https://lms.ucm.cl" target="_blank">UCM Virtual</a>
          </div>
          <div class="footer-col">
            <h4>Soporte</h4>
            <a routerLink="/privacy-policy">Política de privacidad</a>
            <a routerLink="/terms-and-conditions">Términos y condiciones</a>
            <a routerLink="/conduct-rules">Normas de uso y conducta</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 Foro Estudiantil Digital UCM — Proyecto Grupo 8, ICI</span>
          <span>Facultad de Ingeniería · Universidad Católica del Maule</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing-page { font-family: 'Segoe UI', Arial, sans-serif; background: #F5F7FA; }
    
    /* HERO */
    .hero {
      background: linear-gradient(135deg, rgba(15,37,74,0.88) 0%, rgba(27,58,107,0.85) 60%, rgba(35,74,135,0.82) 100%), url('/assets/Edificios-CES-UCM-2-1-2000x1200.jpg') center/cover no-repeat;
      padding: 120px 24px 52px; color: white; position: relative; overflow: hidden;
    }
    .hero::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      opacity: 1;
    }
    .hero-inner { max-width: 640px; position: relative; margin: 0 auto; width: 100%; }
    .hero-badge {
      display: inline-block; background: #C8102E; color: white;
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px;
      padding: 4px 12px; border-radius: 3px; margin-bottom: 16px;
    }
    .hero h1 { font-size: 28px; font-weight: 700; line-height: 1.25; margin-bottom: 12px; }
    .hero h1 em { color: #F5A623; font-style: normal; }
    .hero p { font-size: 14px; opacity: 0.85; line-height: 1.65; margin-bottom: 24px; max-width: 500px; }
    .hero-btns { display: flex; gap: 10px; }
    .btn-hero-primary {
      background: #C8102E; color: white; border: none; padding: 11px 24px;
      border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block;
    }
    .btn-hero-secondary {
      background: transparent; color: white; border: 1.5px solid rgba(255,255,255,0.5);
      padding: 11px 24px; border-radius: 4px; font-size: 13px; cursor: pointer; text-decoration: none; display: inline-block;
    }

    /* MAIN CONTENT */
    .main { background: #F5F7FA; padding: 28px 24px; max-width: 1000px; margin: 0 auto; }
    .section-title {
      font-size: 16px; font-weight: 600; color: #1B3A6B; margin-bottom: 14px;
      display: flex; align-items: center; gap: 8px;
    }
    .section-title::after { content: ''; flex: 1; height: 1px; background: #dde2ea; }

    /* CATEGORÍAS */
    .categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; margin-bottom: 24px; }
    .cat-card {
      background: white; border: 0.5px solid #dde2ea; border-radius: 6px;
      padding: 14px 14px 12px; cursor: pointer; border-left: 3px solid var(--cat-color);
      transition: box-shadow 0.15s; text-decoration: none; color: inherit; display: block;
    }
    .cat-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .cat-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .cat-icon { width: 28px; height: 28px; border-radius: 5px; background: var(--cat-bg); display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .cat-name { font-size: 12.5px; font-weight: 600; color: #1B3A6B; }
    .cat-desc { font-size: 11px; color: #666; line-height: 1.4; margin-bottom: 6px; }
    .cat-count { font-size: 10.5px; color: #999; }
    .cat-count strong { color: var(--cat-color); }

    /* LAYOUT 2 COLS */
    .content-layout { display: grid; grid-template-columns: 1fr 280px; gap: 16px; }
    @media(max-width: 768px) { .content-layout { grid-template-columns: 1fr; } }

    /* POSTS */
    .posts-tabs { display: flex; gap: 0; margin-bottom: 12px; border-bottom: 2px solid #dde2ea; }
    .tab { padding: 8px 16px; font-size: 12px; cursor: pointer; color: #666; border-bottom: 2px solid transparent; margin-bottom: -2px; }
    .tab.active { color: #1B3A6B; font-weight: 600; border-bottom-color: #C8102E; }
    .new-post-btn {
      display: flex; align-items: center; justify-content: center; background: #C8102E; color: white;
      padding: 8px 16px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;
      margin-bottom: 14px; width: 100%; text-decoration: none;
    }

    .post-card {
      background: white; border: 0.5px solid #dde2ea; border-radius: 6px; padding: 14px 16px;
      margin-bottom: 8px; cursor: pointer; transition: box-shadow 0.15s; display: block; text-decoration: none; color: inherit;
    }
    .post-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
    .post-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .cat-pill { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 3px; background: var(--pill-bg, #eee); color: var(--pill-color, #333); }
    .post-tag { font-size: 10px; padding: 2px 7px; border-radius: 3px; background: #EEF1F6; color: #555; }
    .solved-badge { font-size: 10px; padding: 2px 8px; border-radius: 3px; background: #E8F5E9; color: #2E7D32; font-weight: 600; margin-left: auto; }
    .post-title { font-size: 13.5px; font-weight: 600; color: #1a1a2e; margin-bottom: 5px; }
    .post-preview { font-size: 12px; color: #666; line-height: 1.5; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .post-footer { display: flex; align-items: center; gap: 12px; font-size: 11px; color: #888; }
    .post-author { display: flex; align-items: center; gap: 5px; }
    .avatar-xs { width: 18px; height: 18px; border-radius: 50%; background: #1B3A6B; color: white; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; }
    .post-stats { display: flex; gap: 10px; margin-left: auto; }
    .stat-pill { display: flex; align-items: center; gap: 3px; }

    /* SIDEBAR */
    .sidebar-card { background: white; border: 0.5px solid #dde2ea; border-radius: 6px; overflow: hidden; margin-bottom: 12px; }
    .sidebar-card-header { background: #1B3A6B; color: white; font-size: 12px; font-weight: 600; padding: 9px 14px; letter-spacing: 0.2px; }
    .sidebar-card-body { padding: 12px 14px; }
    .user-item { display: flex; align-items: center; gap: 9px; padding: 6px 0; border-bottom: 0.5px solid #f0f2f5; font-size: 12px; }
    .user-item:last-child { border-bottom: none; }
    .avatar-sm { width: 28px; height: 28px; border-radius: 50%; background: var(--av-bg, #1B3A6B); color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
    .user-name { font-weight: 600; color: #1a1a2e; font-size: 11.5px; }
    .user-rep { font-size: 10px; color: #999; }
    .rep-badge { color: #F5A623; font-weight: 700; }
    .material-item { display: flex; align-items: flex-start; gap: 8px; padding: 7px 0; border-bottom: 0.5px solid #f0f2f5; font-size: 11.5px; }
    .material-item:last-child { border-bottom: none; }
    .file-icon { width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
    .file-icon.pdf { background: #FFE0E3; color: #C8102E; }
    .file-icon.ppt { background: #FFF0E0; color: #E65100; }
    .file-icon.doc { background: #E3F2FD; color: #1565C0; }
    .file-icon.other { background: #EEEEEE; color: #555555; }
    .mat-title { font-weight: 600; color: #1a1a2e; font-size: 11px; margin-bottom: 2px; }
    .mat-meta { font-size: 10px; color: #999; }

    /* FOOTER */
    .footer { background: #0F254A; color: rgba(255,255,255,0.7); padding: 24px; font-size: 11.5px; }
    .footer-top { display: flex; gap: 32px; margin-bottom: 18px; max-width: 1000px; margin: 0 auto 18px; }
    @media(max-width: 768px) { .footer-top { flex-direction: column; gap: 16px; } }
    .footer-brand { flex: 1; }
    .footer-logo { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .logo-icon-footer { height: 32px; width: auto; object-fit: contain; }
    .footer-desc { font-size: 11px; line-height: 1.6; max-width: 300px; }
    .footer-col h4 { color: white; font-size: 12px; font-weight: 600; margin-bottom: 10px; }
    .footer-col a { display: block; color: rgba(255,255,255,0.65); margin-bottom: 5px; text-decoration: none; font-size: 11px; }
    .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px; display: flex; justify-content: space-between; font-size: 10.5px; max-width: 1000px; margin: 0 auto; }
  `]
})
export class LandingComponent implements OnInit {
  recentPosts = signal<any[]>([]);
  recentMaterials = signal<any[]>([]);
  topUsers = signal<any[]>([]);

  constructor(
    public auth: AuthService,
    public categories: CategoriesService,
    private supabase: SupabaseService
  ) {}

  async ngOnInit() {
    // Recent Posts
    const { data: posts } = await this.supabase.client
      .from('posts')
      .select('*, author:profiles(*), category:categories(*)')
      .order('created_at', { ascending: false })
      .limit(5);
    if (posts) this.recentPosts.set(posts);

    // Recent Materials
    const { data: materials } = await this.supabase.client
      .from('study_materials')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    if (materials) this.recentMaterials.set(materials);

    // Top Users
    const { data: users } = await this.supabase.client
      .from('profiles')
      .select('*')
      .order('reputation', { ascending: false })
      .limit(5);
    if (users) this.topUsers.set(users);
  }

  getCatEmoji(slug: string): string {
    const map: Record<string, string> = {
      'ramos': 'R', 'docentes': 'D', 'becas': 'B',
      'tramites': 'T', 'vida-universitaria': 'V', 'general': 'G',
    };
    return map[slug] || '·';
  }

  getIconClass(type: string): string {
    if (!type) return 'other';
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'ppt';
    if (type.includes('word') || type.includes('document')) return 'doc';
    return 'other';
  }

  getIconText(type: string): string {
    if (!type) return 'FILE';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'PPT';
    if (type.includes('word') || type.includes('document')) return 'DOC';
    return 'FILE';
  }

  getPreview(content: string): string {
    if (!content) return '';
    const text = content.replace(/[#*`_~>]/g, '').trim();
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }
}

