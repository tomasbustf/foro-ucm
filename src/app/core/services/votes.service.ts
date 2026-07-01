import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class VotesService {
  constructor(private supabase: SupabaseService) {}

  async vote(userId: string, targetId: string, targetType: 'post' | 'reply', value: 1 | -1) {
    // Check if user already voted
    const { data: existing } = await this.supabase.client
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .single();

    if (existing) {
      if (existing.value === value) {
        // Same vote — remove it
        await this.supabase.client
          .from('votes')
          .delete()
          .eq('id', existing.id);

        await this.updateVoteCount(targetId, targetType, value === 1 ? -1 : 1, 'remove');
        return null;
      } else {
        // Different vote — update
        await this.supabase.client
          .from('votes')
          .update({ value })
          .eq('id', existing.id);

        await this.updateVoteCount(targetId, targetType, value, 'change');
        return value;
      }
    } else {
      // New vote
      await this.supabase.client
        .from('votes')
        .insert({ user_id: userId, target_id: targetId, target_type: targetType, value });

      await this.updateVoteCount(targetId, targetType, value, 'new');
      return value;
    }
  }

  private async updateVoteCount(targetId: string, targetType: 'post' | 'reply', value: number, action: 'new' | 'remove' | 'change') {
    const table = targetType === 'post' ? 'posts' : 'replies';

    const { data: current } = await this.supabase.client
      .from(table)
      .select('upvotes, downvotes')
      .eq('id', targetId)
      .single();

    if (!current) return;

    let updates: { upvotes: number; downvotes: number } = { ...current };

    if (action === 'new') {
      if (value === 1) updates.upvotes++;
      else updates.downvotes++;
    } else if (action === 'remove') {
      if (value === 1) updates.upvotes = Math.max(0, updates.upvotes - 1);
      else updates.downvotes = Math.max(0, updates.downvotes - 1);
    } else if (action === 'change') {
      if (value === 1) { updates.upvotes++; updates.downvotes = Math.max(0, updates.downvotes - 1); }
      else { updates.downvotes++; updates.upvotes = Math.max(0, updates.upvotes - 1); }
    }

    await this.supabase.client
      .from(table)
      .update(updates)
      .eq('id', targetId);
  }

  async getUserVote(userId: string, targetId: string, targetType: 'post' | 'reply'): Promise<number | null> {
    const { data } = await this.supabase.client
      .from('votes')
      .select('value')
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .single();

    return data?.value || null;
  }
}
