import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  post_count: number;
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private _categories = signal<Category[]>([]);
  categories = this._categories.asReadonly();

  constructor(private supabase: SupabaseService) {
    this.loadCategories();
  }

  async loadCategories() {
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('*')
      .order('id');

    if (data && !error) {
      this._categories.set(data as Category[]);
    }
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return this._categories().find(c => c.slug === slug);
  }
}
