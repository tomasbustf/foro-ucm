import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface StudyMaterial {
  id: string; title: string; description: string;
  file_url: string; file_name: string; file_size: number;
  file_type: string; subject: string; subject_code: string;
  career: string; year: number; semester: number;
  uploader_id: string; download_count: number; upvotes: number;
  rating_sum: number; rating_count: number;
  created_at: string;
  uploader?: { username: string; full_name: string; avatar_url: string };
  user_vote?: number; // 1, -1, or 0 (no vote)
}

export interface MaterialVote {
  id: string;
  material_id: string;
  user_id: string;
  vote: number;
}

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  constructor(private supabase: SupabaseService) {}

  async getMaterials(filters: any = {}) {
    let query = this.supabase.client
      .from('study_materials')
      .select(`*, uploader:profiles!uploader_id(username, full_name, avatar_url)`, { count: 'exact' });

    if (filters.career) query = query.eq('career', filters.career);
    if (filters.subject) query = query.ilike('subject', `%${filters.subject}%`);
    if (filters.year) query = query.eq('year', filters.year);
    if (filters.semester) query = query.eq('semester', filters.semester);
    if (filters.search) query = query.textSearch('fts', filters.search, { config: 'spanish' });

    // Sort: best rated first (rating_sum desc), then newest
    const sortBy = filters.sortBy || 'rating';
    if (sortBy === 'rating') {
      query = query.order('rating_sum', { ascending: false }).order('created_at', { ascending: false });
    } else if (sortBy === 'downloads') {
      query = query.order('download_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const page = filters.page || 0;
    const limit = filters.limit || 20;
    const { data, error, count } = await query.range(page * limit, (page + 1) * limit - 1);
    if (error) throw error;
    return { materials: (data || []) as StudyMaterial[], count: count || 0 };
  }

  async getUserVotes(materialIds: string[], userId: string): Promise<Record<string, number>> {
    if (!materialIds.length || !userId) return {};
    const { data, error } = await this.supabase.client
      .from('material_votes')
      .select('material_id, vote')
      .eq('user_id', userId)
      .in('material_id', materialIds);
    if (error) throw error;
    const voteMap: Record<string, number> = {};
    (data || []).forEach((v: any) => { voteMap[v.material_id] = v.vote; });
    return voteMap;
  }

  async voteMaterial(materialId: string, userId: string, vote: number): Promise<void> {
    // Check if user already voted
    const { data: existing } = await this.supabase.client
      .from('material_votes')
      .select('id, vote')
      .eq('material_id', materialId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      if (existing.vote === vote) {
        // Same vote -> remove it (toggle off)
        await this.supabase.client.from('material_votes').delete().eq('id', existing.id);
      } else {
        // Different vote -> update
        await this.supabase.client.from('material_votes').update({ vote }).eq('id', existing.id);
      }
    } else {
      // New vote
      const { error } = await this.supabase.client.from('material_votes').insert({
        material_id: materialId, user_id: userId, vote
      });
      if (error) throw error;
    }
  }

  async uploadMaterial(file: File, metadata: Partial<StudyMaterial>) {
    const fileName = `${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await this.supabase.client.storage
      .from('study-materials').upload(fileName, file);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = this.supabase.client.storage
      .from('study-materials').getPublicUrl(fileName);

    const { data, error } = await this.supabase.client
      .from('study_materials')
      .insert({ ...metadata, file_url: publicUrl, file_name: file.name,
        file_size: file.size, file_type: file.type })
      .select().single();
    if (error) throw error;
    return data;
  }

  async incrementDownload(id: string) {
    const { data } = await this.supabase.client
      .from('study_materials').select('download_count').eq('id', id).single();
    if (data) {
      await this.supabase.client.from('study_materials')
        .update({ download_count: data.download_count + 1 }).eq('id', id);
    }
  }
}
