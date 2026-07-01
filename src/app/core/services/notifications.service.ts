import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Notification {
  id: string;
  user_id: string;
  type: 'reply' | 'vote' | 'accepted' | 'mention';
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private _notifications = signal<Notification[]>([]);
  private _unreadCount = signal(0);
  notifications = this._notifications.asReadonly();
  unreadCount = this._unreadCount.asReadonly();

  constructor(private supabase: SupabaseService, private auth: AuthService) {}

  async loadNotifications() {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    const { data } = await this.supabase.client
      .from('notifications').select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(50);
    if (data) {
      this._notifications.set(data as Notification[]);
      this._unreadCount.set(data.filter((n: any) => !n.is_read).length);
    }
  }

  subscribeToNotifications() {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    return this.supabase.client
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const n = payload.new as Notification;
        this._notifications.update(c => [n, ...c]);
        this._unreadCount.update(c => c + 1);
      }).subscribe();
  }

  async markAsRead(id: string) {
    await this.supabase.client.from('notifications').update({ is_read: true }).eq('id', id);
    this._notifications.update(c => c.map(n => n.id === id ? { ...n, is_read: true } : n));
    this._unreadCount.update(c => Math.max(0, c - 1));
  }

  async markAllAsRead() {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    await this.supabase.client.from('notifications').update({ is_read: true })
      .eq('user_id', userId).eq('is_read', false);
    this._notifications.update(c => c.map(n => ({ ...n, is_read: true })));
    this._unreadCount.set(0);
  }
}
