import { Injectable, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  career: string;
  year_of_entry: number;
  avatar_url: string;
  reputation: number;
  is_moderator: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);
  private _profile = signal<Profile | null>(null);
  private _loading = signal(true);

  user = this._user.asReadonly();
  profile = this._profile.asReadonly();
  loading = this._loading.asReadonly();
  isAuthenticated = computed(() => !!this._user());
  isModerator = computed(() => this._profile()?.is_moderator ?? false);

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.initAuth();
  }

  private async initAuth() {
    try {
      const { data: { session } } = await this.supabase.client.auth.getSession();
      if (session?.user) {
        this._user.set(session.user);
        await this.loadProfile(session.user.id);
      }
    } catch (err) {
      console.error('Error initializing auth:', err);
    } finally {
      this._loading.set(false);
    }

    this.supabase.client.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this._user.set(session.user);
        await this.loadProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        this._user.set(null);
        this._profile.set(null);
      }
    });
  }

  private async loadProfile(userId: string) {
    const { data } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      this._profile.set(data as Profile);
    }
  }

  async signUp(email: string, password: string, profileData: Partial<Profile>) {
    if (!email.endsWith('@alumnos.ucm.cl')) {
      throw new Error('Solo se permiten correos @alumnos.ucm.cl');
    }

    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: profileData
      }
    });

    if (error) throw error;

    // Supabase returns a fake success when the email is already registered.
    // We detect this by checking if identities is empty.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('EMAIL_ALREADY_REGISTERED');
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    await this.supabase.client.auth.signOut();
    this._user.set(null);
    this._profile.set(null);
    this.router.navigate(['/auth/login']);
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  }

  async updateProfile(updates: Partial<Profile>) {
    const user = this._user();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await this.supabase.client
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    if (data) this._profile.set(data as Profile);
    return data;
  }

  getReputationLevel(reputation: number): { label: string; emoji: string; color: string } {
    if (reputation >= 500) return { label: 'Experto UCM', emoji: '★', color: '#F5A623' };
    if (reputation >= 200) return { label: 'Referente', emoji: '◆', color: '#3B82F6' };
    if (reputation >= 50) return { label: 'Colaborador', emoji: '■', color: '#10B981' };
    return { label: 'Estudiante Nuevo', emoji: '●', color: '#6B7280' };
  }
}
