import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PostsService } from '../../core/services/posts.service';
import { CategoriesService } from '../../core/services/categories.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-new-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="new-post-page container">
      <div class="page-header">
        <h1>Nueva Publicación</h1>
        <p>Haz una pregunta, comparte conocimiento o inicia un debate.</p>
      </div>

      <div class="card new-post-card">
        <form (ngSubmit)="onSubmit()" class="post-form">
          <!-- Title -->
          <div class="input-group">
            <label for="title">Título</label>
            <input id="title" type="text" class="input-field" [(ngModel)]="title" name="title"
                   placeholder="Escribe un título descriptivo (máx. 200 caracteres)"
                   maxlength="200" required>
            <div class="char-count">{{ title.length }}/200</div>
          </div>

          <!-- Category -->
          <div class="input-group">
            <label for="category">Categoría</label>
            <select id="category" class="input-field" [(ngModel)]="categoryId" name="category" required>
              <option value="" disabled>Selecciona una categoría</option>
              <option *ngFor="let cat of categories.categories()" [value]="cat.id">
                {{ cat.name }} - {{ cat.description }}
              </option>
            </select>
          </div>

          <!-- Content (Markdown) -->
          <div class="input-group">
            <label for="content">Contenido</label>
            <div class="editor-toolbar">
              <button type="button" class="btn-ghost btn-sm" (click)="insertMarkdown('**', '**')" title="Negrita"><b>B</b></button>
              <button type="button" class="btn-ghost btn-sm" (click)="insertMarkdown('*', '*')" title="Cursiva"><i>I</i></button>
              <span class="toolbar-sep"></span>
              <button type="button" class="btn-ghost btn-sm" (click)="insertMarkdown('\\n- ', '')" title="Lista Viñetas">•</button>
              <button type="button" class="btn-ghost btn-sm" (click)="insertMarkdown('\\n1. ', '')" title="Lista Numerada">1.</button>
              <span class="toolbar-sep"></span>
              <button type="button" class="btn-ghost btn-sm" (click)="insertMarkdown('\`', '\`')" title="Código Inline">&lt;/&gt;</button>
              <button type="button" class="btn-ghost btn-sm" (click)="insertMarkdown('\\n\`\`\`\\n', '\\n\`\`\`\\n')" title="Bloque de Código">&lt;/&gt;</button>
            </div>
            <textarea id="content" class="input-field markdown-textarea" [(ngModel)]="content" name="content"
                      placeholder="Escribe el contenido de tu publicación (puedes usar Markdown)..."
                      rows="12" required></textarea>
          </div>

          <!-- Tags -->
          <div class="input-group">
            <label for="tags">Etiquetas (Opcional)</label>
            <div class="tags-input-container input-field">
              <span class="tag" *ngFor="let tag of tags; let i = index">
                {{ tag }} <button type="button" class="remove-tag" (click)="removeTag(i)">&times;</button>
              </span>
              <input type="text" id="tags" class="tag-input" [(ngModel)]="currentTag" name="currentTag"
                     placeholder="Ej: ICC-301, Cálculo (Presiona Enter)"
                     (keydown.enter)="addTag($event)" (keydown.comma)="addTag($event)">
            </div>
          </div>



          <div class="form-actions">
            <button type="button" class="btn btn-outline" routerLink="/home">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="!isValid() || submitting()">
              {{ submitting() ? 'Publicando...' : 'Publicar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .new-post-page { padding-top: calc(var(--navbar-height) + var(--space-lg)); padding-bottom: var(--space-xl); max-width: 800px; }
    .page-header { margin-bottom: var(--space-xl); text-align: center; }
    .page-header h1 { font-size: 2rem; font-weight: 800; margin-bottom: var(--space-sm); }
    .page-header p { color: var(--color-text-muted); font-size: 1.1rem; }
    .new-post-card { padding: var(--space-xl); }
    .post-form { display: flex; flex-direction: column; gap: var(--space-lg); }
    .char-count { font-size: 0.8rem; color: var(--color-text-muted); text-align: right; margin-top: 4px; }
    
    .editor-toolbar {
      display: flex; gap: 4px; padding: 8px; background: var(--color-bg-alt);
      border: 2px solid var(--color-border); border-bottom: none;
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      align-items: center;
    }
    .toolbar-sep { width: 1px; height: 16px; background: var(--color-border); margin: 0 4px; }
    .markdown-textarea {
      border-top-left-radius: 0; border-top-right-radius: 0;
      font-family: var(--font-mono); resize: vertical;
    }
    .markdown-textarea:focus { box-shadow: none; }
    
    .tags-input-container {
      display: flex; flex-wrap: wrap; gap: var(--space-xs); padding: 6px 10px;
      align-items: center; cursor: text;
    }
    .tag { display: flex; align-items: center; gap: 4px; padding-right: 6px; }
    .remove-tag { background: none; border: none; color: inherit; cursor: pointer; font-size: 0.7rem; opacity: 0.7; }
    .remove-tag:hover { opacity: 1; }
    .tag-input { border: none; background: transparent; outline: none; flex: 1; min-width: 150px; font-size: 0.95rem; color: var(--color-text); }
    
    .post-options { background: var(--color-bg-alt); padding: var(--space-md); border-radius: var(--radius-md); }
    .anon-check { display: flex; align-items: center; gap: var(--space-sm); font-weight: 600; cursor: pointer; margin-bottom: 4px; }
    .anon-hint { font-size: 0.8rem; color: var(--color-text-muted); margin-left: 24px; }
    
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-md); margin-top: var(--space-md); }
  `]
})
export class NewPostComponent {
  title = '';
  categoryId: number | string = '';
  content = '';
  tags: string[] = [];
  currentTag = '';

  submitting = signal(false);

  constructor(
    public categories: CategoriesService,
    private postsService: PostsService,
    private auth: AuthService,
    private router: Router
  ) {}

  isValid(): boolean {
    return this.title.trim().length > 0 && 
           this.content.trim().length > 0 && 
           this.categoryId !== '';
  }

  insertMarkdown(prefix: string, suffix: string) {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = this.content.substring(start, end);
    
    const before = this.content.substring(0, start);
    const after = this.content.substring(end);
    
    this.content = `${before}${prefix}${selected}${suffix}${after}`;
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  }

  addTag(event: Event) {
    event.preventDefault();
    const tag = this.currentTag.trim().replace(/,/g, '');
    if (tag && !this.tags.includes(tag) && this.tags.length < 5) {
      this.tags.push(tag);
    }
    this.currentTag = '';
  }

  removeTag(index: number) {
    this.tags.splice(index, 1);
  }

  async onSubmit() {
    if (!this.isValid()) return;
    
    const userId = this.auth.user()?.id;
    if (!userId) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.submitting.set(true);
    try {
      const post = await this.postsService.createPost({
        title: this.title.trim(),
        content: this.content.trim(),
        category_id: Number(this.categoryId),
        tags: this.tags,
        is_anonymous: false,
        author_id: userId
      });
      
      this.router.navigate(['/post', post.id]);
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Error al publicar. Por favor, intenta de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }
}
