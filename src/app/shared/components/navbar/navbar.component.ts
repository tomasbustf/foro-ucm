import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <header class="header-container" [class.scrolled]="scrolled()">
      <!-- TOP BAR -->
      <div class="topbar hide-mobile">
        <div class="topbar-links">
          <a href="#">Estudiantes</a>
          <a href="#">Académicos</a>
          <a href="#">Admisión</a>
          <a href="#">UCM Virtual</a>
        </div>
        <div class="topbar-right">
          <span>Talca, Campus San Miguel</span>
          <button class="topbar-btn">Accesos</button>
        </div>
      </div>

      <!-- NAVBAR -->
      <nav class="navbar">
        <a routerLink="/" class="navbar-logo">
          <img src="assets/logo-ucm.png" alt="Logo UCM" class="logo-icon" style="background: transparent;">
          <div class="logo-text hide-mobile">
            Foro Estudiantil
            <span>Universidad Católica del Maule</span>
          </div>
        </a>
        
        <div class="nav-links hide-mobile">
          <a routerLink="/" class="nav-link" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Inicio</a>
          <a routerLink="/categories" class="nav-link" routerLinkActive="active">Categorías</a>
          <a routerLink="/materials" class="nav-link" routerLinkActive="active">Material de Estudio</a>
          <a routerLink="/flyers" class="nav-link" routerLinkActive="active">Muro de Emprendimientos</a>
        </div>

        <div class="nav-right">
          <input class="nav-search hide-mobile" type="text" placeholder="🔍  Buscar en el foro..." [(ngModel)]="searchQuery" (keydown.enter)="onSearch()">
          
          <ng-container *ngIf="auth.isAuthenticated(); else loginButtons">
            <!-- Notification Bell -->
            <button class="btn-icon notification-bell" routerLink="/notifications" title="Notificaciones" style="color: white; background: transparent; border: none; cursor: pointer; position: relative;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <span class="notif-badge" *ngIf="notifications.unreadCount() > 0">
                {{ notifications.unreadCount() > 9 ? '9+' : notifications.unreadCount() }}
              </span>
            </button>

            <!-- User Menu -->
            <div class="user-menu" (click)="toggleUserMenu(); $event.stopPropagation()">
              <div class="user-avatar" [class.menu-open]="showUserMenu()"
                   [style.background-image]="auth.profile()?.avatar_url ? 'url(' + auth.profile()?.avatar_url + ')' : 'none'" 
                   [style.background-size]="'cover'"
                   [style.background-position]="'center'">
                <ng-container *ngIf="!auth.profile()?.avatar_url">
                  {{ auth.profile()?.username?.charAt(0)?.toUpperCase() || '?' }}
                </ng-container>
              </div>
              <div class="dropdown" *ngIf="showUserMenu()" (click)="$event.stopPropagation()">
                <div class="dropdown-header">
                  <div class="dropdown-avatar"
                       [style.background-image]="auth.profile()?.avatar_url ? 'url(' + auth.profile()?.avatar_url + ')' : 'none'"
                       [style.background-size]="'cover'"
                       [style.background-position]="'center'">
                    <ng-container *ngIf="!auth.profile()?.avatar_url">
                      {{ auth.profile()?.username?.charAt(0)?.toUpperCase() || '?' }}
                    </ng-container>
                  </div>
                  <div class="dropdown-user-info">
                    <strong>{{ auth.profile()?.full_name || auth.profile()?.username }}</strong>
                    <span class="dropdown-email">{{ auth.profile()?.career || 'Estudiante UCM' }}</span>
                    <span class="rep-badge">{{ getRepLevel().emoji }} {{ getRepLevel().label }} · {{ auth.profile()?.reputation || 0 }} pts</span>
                  </div>
                </div>
                <div class="dropdown-section">
                  <a routerLink="/my-profile" class="dropdown-item" (click)="showUserMenu.set(false)">
                    <span class="dropdown-icon">👤</span> Mi Perfil
                  </a>
                  <a routerLink="/new-post" class="dropdown-item" (click)="showUserMenu.set(false)">
                    <span class="dropdown-icon">✏️</span> Crear Publicación
                  </a>
                  <a routerLink="/notifications" class="dropdown-item" (click)="showUserMenu.set(false)">
                    <span class="dropdown-icon">🔔</span> Notificaciones
                    <span class="item-badge" *ngIf="notifications.unreadCount() > 0">{{ notifications.unreadCount() }}</span>
                  </a>
                  <a routerLink="/upload-material" class="dropdown-item" (click)="showUserMenu.set(false)">
                    <span class="dropdown-icon">📚</span> Subir Material
                  </a>
                </div>
                <div class="dropdown-section" *ngIf="auth.isModerator()">
                  <a routerLink="/admin" class="dropdown-item" (click)="showUserMenu.set(false)">
                    <span class="dropdown-icon">⚙️</span> Panel de Administración
                  </a>
                </div>
                <div class="dropdown-section">
                  <button class="dropdown-item danger" (click)="logout()">
                    <span class="dropdown-icon">🚪</span> Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-template #loginButtons>
            <a routerLink="/auth/login" class="btn-login">Ingresar</a>
            <a routerLink="/auth/register" class="btn-register hide-mobile">Registrarse</a>
          </ng-template>
        </div>
      </nav>
      <div class="red-line"></div>
    </header>
  `,
  styles: [`
    .header-container {
      position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    
    /* TOP BAR */
    .topbar {
      background: #F0F2F5; border-bottom: 1px solid #ddd; padding: 5px 24px;
      display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: #444;
    }
    .topbar-links { display: flex; gap: 14px; }
    .topbar-links a { color: #444; text-decoration: none; }
    .topbar-links a:hover { color: #1B3A6B; }
    .topbar-right { display: flex; gap: 10px; align-items: center; }
    .topbar-btn { background: #1B3A6B; color: white; padding: 3px 12px; border-radius: 3px; font-size: 11px; cursor: pointer; border: none; }

    /* NAVBAR PRINCIPAL */
    .navbar { background: #1B3A6B; padding: 0 24px; display: flex; align-items: center; gap: 0; height: 62px; }
    .navbar-logo { display: flex; align-items: center; gap: 10px; margin-right: 28px; text-decoration: none; }
    .logo-icon { width: 38px; height: 38px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #1B3A6B; }
    .logo-text { color: white; font-size: 13px; font-weight: 600; line-height: 1.3; }
    .logo-text span { display: block; font-weight: 400; font-size: 10px; opacity: 0.85; }
    .nav-links { display: flex; height: 100%; }
    .nav-link { color: rgba(255,255,255,0.88); font-size: 12.5px; padding: 0 15px; display: flex; align-items: center; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s; height: 100%; gap: 4px; text-decoration: none;}
    .nav-link:hover { color: white; border-bottom-color: #C8102E; }
    .nav-link.active { color: white; border-bottom-color: #C8102E; font-weight: 600; }
    .nav-right { margin-left: auto; display: flex; gap: 16px; align-items: center; }
    .btn-login { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); padding: 6px 16px; border-radius: 4px; font-size: 12px; cursor: pointer; text-decoration: none;}
    .btn-register { background: #C8102E; color: white; border: none; padding: 7px 16px; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: 600; text-decoration: none; }
    .nav-search { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); border-radius: 4px; padding: 5px 10px; color: white; font-size: 12px; width: 180px; outline: none; }
    .nav-search::placeholder { color: rgba(255,255,255,0.55); }
    .red-line { height: 3px; background: #C8102E; width: 100%; }

    /* AUTH USER ELEMENTS */
    .notif-badge {
      position: absolute; top: -5px; right: -5px;
      min-width: 16px; height: 16px; border-radius: 50%;
      background: #C8102E; color: white; font-size: 0.65rem;
      font-weight: 700; display: flex; align-items: center; justify-content: center;
      padding: 0 4px;
    }
    .user-menu { position: relative; cursor: pointer; }
    .user-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: white;
      color: #1B3A6B; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.9rem;
      border: 2px solid transparent;
      transition: all 0.2s;
    }
    .user-avatar:hover, .user-avatar.menu-open { border-color: #C8102E; box-shadow: 0 0 0 2px rgba(200,16,46,0.3); }

    /* DROPDOWN */
    .dropdown {
      position: absolute; top: calc(100% + 10px); right: -8px;
      width: 260px; background: white;
      border-radius: 10px; border: 1px solid #e5e7eb;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      overflow: hidden; z-index: 100;
      animation: dropdownIn 0.2s ease-out;
    }
    @keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

    .dropdown-header {
      padding: 16px; background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
      border-bottom: 1px solid #e5e7eb;
      display: flex; align-items: center; gap: 12px;
    }
    .dropdown-avatar {
      width: 42px; height: 42px; min-width: 42px; border-radius: 50%;
      background: #1B3A6B; color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1rem;
      border: 2px solid #C8102E;
    }
    .dropdown-user-info { display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
    .dropdown-user-info strong { font-size: 13px; color: #1B3A6B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dropdown-email { font-size: 11px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rep-badge { font-size: 10.5px; color: #9ca3af; margin-top: 2px; }

    .dropdown-section { padding: 6px 0; border-bottom: 1px solid #f0f2f5; }
    .dropdown-section:last-child { border-bottom: none; }
    .dropdown-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 16px; font-size: 13px;
      color: #374151; cursor: pointer; border: none;
      background: none; width: 100%; text-align: left;
      text-decoration: none; transition: background 0.15s;
    }
    .dropdown-item:hover { background: #f3f4f6; }
    .dropdown-item.danger { color: #C8102E; }
    .dropdown-item.danger:hover { background: #fef2f2; }
    .dropdown-icon { font-size: 15px; width: 20px; text-align: center; }
    .item-badge {
      margin-left: auto; background: #C8102E; color: white;
      font-size: 10px; font-weight: 700; padding: 1px 7px;
      border-radius: 10px; min-width: 18px; text-align: center;
    }

    @media(max-width:768px) {
      .hide-mobile { display: none !important; }
      .navbar { padding: 0 16px; }
      .dropdown { right: -16px; width: 240px; }
    }
  `]
})
export class NavbarComponent {
  searchQuery = '';
  scrolled = signal(false);
  showUserMenu = signal(false);

  constructor(
    public auth: AuthService,
    public notifications: NotificationsService,
    private router: Router
  ) {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.scrolled.set(window.scrollY > 10);
      });
      window.addEventListener('click', () => this.showUserMenu.set(false));
    }
  }

  toggleUserMenu() {
    this.showUserMenu.update(v => !v);
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }

  getRepLevel() {
    return this.auth.getReputationLevel(this.auth.profile()?.reputation || 0);
  }

  logout() {
    this.showUserMenu.set(false);
    this.auth.signOut();
  }
}
