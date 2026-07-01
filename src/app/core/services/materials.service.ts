import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface StudyMaterial {
  id: string; title: string; description: string;
  file_url: string; file_name: string; file_size: number;
  file_type: string; subject: string; subject_code: string;
  career: string; year: number; semester: number;
  uploader_id: string; download_count: number; upvotes: number;
  created_at: string;
  uploader?: { username: string; full_name: string; avatar_url: string };
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

    query = query.order('created_at', { ascending: false });

    const page = filters.page || 0;
    const limit = filters.limit || 20;
    const { data, error, count } = await query.range(page * limit, (page + 1) * limit - 1);
    if (error) throw error;
    return { materials: (data || []) as StudyMaterial[], count: count || 0 };
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
