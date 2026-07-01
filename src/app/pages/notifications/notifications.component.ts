import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationsService } from '../../core/services/notifications.service';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeAgoPipe],
  template: `
    <div class="notif-page container">
      <div class="page-header card">
        <div class="header-inner">
          <div>
            <h1>Notificaciones</h1>
            <p>Mantente al tanto de la actividad en tus publicaciones.</p>
          </div>
          <button class="btn btn-outline btn-sm" (click)="notificationsService.markAllAsRead()"
                  *ngIf="notificationsService.unreadCount() > 0">
            ✅ Marcar todas como leídas
          </button>
        </div>
      </div>

      <div class="notifs-list card">
        <div class="empty-state" *ngIf="notificationsService.notifications().length === 0">
          <div class="empty-state-icon">📭</div>
          <h3>No tienes notificaciones</h3>
          <p>Te avisaremos cuando alguien interactúe contigo.</p>
        </div>

        <a *ngFor="let notif of notificationsService.notifications()"
           [routerLink]="notif.link" (click)="notificationsService.markAsRead(notif.id)"
           class="notif-item" [class.unread]="!notif.is_read">
          <div class="notif-icon">{{ getIcon(notif.type) }}</div>
          <div class="notif-content">
            <p class="notif-message">{{ notif.message }}</p>
            <span class="notif-time">{{ notif.created_at | timeAgo }}</span>
          </div>
          <div class="unread-dot" *ngIf="!notif.is_read"></div>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .notif-page { padding-top: calc(var(--navbar-height) + var(--space-lg)); padding-bottom: var(--space-xl); max-width: 700px; }
    .page-header { padding: var(--space-xl); margin-bottom: var(--space-md); }
    .header-inner { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-md); }
    .page-header h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 4px; }
    .page-header p { color: var(--color-text-muted); font-size: 0.95rem; margin: 0; }
    
    .notifs-list { display: flex; flex-direction: column; overflow: hidden; }
    .notif-item {
      display: flex; gap: var(--space-md); padding: var(--space-md) var(--space-lg);
      border-bottom: 1px solid var(--color-border-light); text-decoration: none; color: inherit;
      transition: background var(--transition-fast); align-items: center;
    }
    .notif-item:last-child { border-bottom: none; }
    .notif-item:hover { background: var(--color-surface-hover); }
    .notif-item.unread { background: var(--color-info-bg); }
    .notif-item.unread:hover { background: rgba(59, 130, 246, 0.08); }
    
    .notif-icon { font-size: 1.5rem; width: 40px; text-align: center; }
    .notif-content { flex: 1; }
    .notif-message { font-size: 0.95rem; margin-bottom: 4px; font-weight: 500; }
    .notif-item.unread .notif-message { font-weight: 700; color: var(--color-primary-dark); }
    [data-theme="dark"] .notif-item.unread .notif-message { color: var(--color-primary-light); }
    .notif-time { font-size: 0.8rem; color: var(--color-text-muted); }
    
    .unread-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); flex-shrink: 0; }
  `]
})
export class NotificationsComponent implements OnInit {
  constructor(public notificationsService: NotificationsService) {}

  ngOnInit() {
    this.notificationsService.loadNotifications();
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      'reply': '💬', 'vote': '⭐', 'accepted': '✅', 'mention': '🔔'
    };
    return icons[type] || '🔔';
  }
}
