import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Profile } from './auth.service';

export interface Reply {
  id: string;
  post_id: string;
  parent_reply_id: string | null;
  author_id: string;
  content: string;
  is_anonymous: boolean;
  is_accepted: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  author?: Profile;
  children?: Reply[];
}

@Injectable({ providedIn: 'root' })
export class RepliesService {
  constructor(private supabase: SupabaseService) {}

  async getRepliesByPost(postId: string): Promise<Reply[]> {
    const { data, error } = await this.supabase.client
      .from('replies')
      .select(`
        *,
        author:profiles!author_id(id, username, full_name, avatar_url, reputation, is_moderator)
      `)
      .eq('post_id', postId)
      .order('is_accepted', { ascending: false })
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Build nested structure (max 2 levels)
    const replies = (data || []) as Reply[];
    const topLevel = replies.filter(r => !r.parent_reply_id);
    const nested = replies.filter(r => r.parent_reply_id);

    topLevel.forEach(parent => {
      parent.children = nested.filter(child => child.parent_reply_id === parent.id);
    });

    return topLevel;
  }

  async createReply(reply: { post_id: string; content: string; author_id: string; is_anonymous: boolean; parent_reply_id?: string }) {
    const { data, error } = await this.supabase.client
      .from('replies')
      .insert(reply)
      .select(`
        *,
        author:profiles!author_id(id, username, full_name, avatar_url, reputation, is_moderator)
      `)
      .single();

    if (error) throw error;
    return data as Reply;
  }

  async acceptReply(replyId: string, postId: string) {
    // Unaccept any previously accepted reply
    await this.supabase.client
      .from('replies')
      .update({ is_accepted: false })
      .eq('post_id', postId)
      .eq('is_accepted', true);

    const { data, error } = await this.supabase.client
      .from('replies')
      .update({ is_accepted: true })
      .eq('id', replyId)
      .select()
      .single();

    if (error) throw error;

    // Mark post as solved
    await this.supabase.client
      .from('posts')
      .update({ is_solved: true })
      .eq('id', postId);

    return data;
  }

  async deleteReply(replyId: string) {
    const { error } = await this.supabase.client
      .from('replies')
      .delete()
      .eq('id', replyId);

    if (error) throw error;
  }

  subscribeToReplies(postId: string, callback: (reply: any) => void) {
    return this.supabase.client
      .channel(`replies:${postId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'replies',
        filter: `post_id=eq.${postId}`,
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
  }
}
