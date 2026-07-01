import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  async report(targetId: string, targetType: 'post' | 'reply' | 'material', reason: string) {
    const user = this.auth.user();
    if (!user) throw new Error('Debes iniciar sesión para reportar.');

    const { data, error } = await this.supabase.client
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_id: targetId,
        target_type: targetType,
        reason: reason,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
