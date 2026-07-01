import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Profile } from './auth.service';

export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category_id: number;
  tags: string[];
  is_anonymous: boolean;
  is_pinned: boolean;
  is_solved: boolean;
  view_count: number;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  category?: { id: number; name: string; slug: string; color: string; icon: string };
  reply_count?: number;
}

export interface PostFilters {
  category_id?: number;
  tab?: 'recent' | 'popular' | 'unanswered' | 'solved';
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class PostsService {
  constructor(private supabase: SupabaseService) {}

  async getPosts(filters: PostFilters = {}) {
    const page = filters.page || 0;
    const limit = filters.limit || 20;
    const from = page * limit;
    const to = from + limit - 1;

    let query = this.supabase.client
      .from('posts')
      .select(`
        *,
        author:profiles!author_id(id, username, full_name, avatar_url, reputation, is_moderator),
        category:categories!category_id(id, name, slug, color, icon),
        reply_count:replies(count)
      `, { count: 'exact' });

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.search) {
      query = query.textSearch('fts', filters.search, { config: 'spanish' });
    }

    switch (filters.tab) {
      case 'popular':
        query = query.order('upvotes', { ascending: false });
        break;
      case 'unanswered':
        query = query.eq('is_solved', false);
        query = query.order('created_at', { ascending: false });
        break;
      case 'solved':
        query = query.eq('is_solved', true);
        query = query.order('created_at', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('is_pinned', { ascending: false });
        query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    const posts = (data || []).map((p: any) => ({
      ...p,
      reply_count: p.reply_count?.[0]?.count || 0,
    }));

    return { posts, count: count || 0 };
  }

  async getPostById(id: string) {
    // Increment view count
    await this.supabase.client.rpc('increment_view_count', { post_id: id });

    const { data, error } = await this.supabase.client
      .from('posts')
      .select(`
        *,
        author:profiles!author_id(id, username, full_name, avatar_url, reputation, is_moderator),
        category:categories!category_id(id, name, slug, color, icon)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Post;
  }

  async createPost(post: { title: string; content: string; category_id: number; tags: string[]; is_anonymous: boolean; author_id: string }) {
    const { data, error } = await this.supabase.client
      .from('posts')
      .insert(post)
      .select()
      .single();

    if (error) throw error;

    // Update category post count
    await this.supabase.client.rpc('increment_post_count', { cat_id: post.category_id });

    return data;
  }

  async updatePost(id: string, updates: Partial<Post>) {
    const { data, error } = await this.supabase.client
      .from('posts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePost(id: string) {
    const { error } = await this.supabase.client
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getTopViewedPosts(limit = 5) {
    const { data } = await this.supabase.client
      .from('posts')
      .select('id, title, view_count, created_at')
      .order('view_count', { ascending: false })
      .limit(limit);

    return data || [];
  }
}
