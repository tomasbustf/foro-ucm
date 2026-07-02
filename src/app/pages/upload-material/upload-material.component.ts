import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialsService } from '../../core/services/materials.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-upload-material',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="upload-page container">
      <div class="page-header">
        <h1>Subir Material de Estudio</h1>
        <p>Comparte tus apuntes, resúmenes o pruebas para ayudar a otros estudiantes.</p>
      </div>

      <div class="upload-card card">
        <form (ngSubmit)="onSubmit()" class="upload-form">
          <!-- File Drop Zone -->
          <div class="file-drop-zone" [class.has-file]="selectedFile" [class.drag-over]="isDragOver"
               (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)"
               (click)="fileInput.click()">
            <input type="file" #fileInput class="hidden-input" (change)="onFileSelected($event)" 
                   accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar">
            
            <ng-container *ngIf="!selectedFile">
              <div class="drop-icon">&uarr;</div>
              <h3>Haz clic o arrastra tu archivo aquí</h3>
              <p>Formatos soportados: PDF, Word, Excel, PPT, ZIP (Max 20MB)</p>
            </ng-container>
            
            <ng-container *ngIf="selectedFile">
              <div class="file-preview">
                <div class="drop-icon">&bull;</div>
                <div class="file-info">
                  <div class="file-name">{{ selectedFile.name }}</div>
                  <div class="file-size">{{ formatSize(selectedFile.size) }}</div>
                </div>
                <button type="button" class="btn-icon remove-file" (click)="removeFile($event)" title="Quitar archivo">✕</button>
              </div>
            </ng-container>
          </div>
          
          <div class="error-text" *ngIf="fileError">{{ fileError }}</div>

          <div class="form-section" [class.disabled]="!selectedFile">
            <h3>Detalles del material</h3>
            
            <div class="input-group">
              <label for="title">Título descriptivo</label>
              <input id="title" type="text" class="input-field" [(ngModel)]="title" name="title"
                     placeholder="Ej: Apuntes Primer Semestre Cálculo" required [disabled]="!selectedFile">
            </div>
            
            <div class="form-row">
              <div class="input-group">
                <label for="subject">Ramo / Asignatura</label>
                <input id="subject" type="text" class="input-field" [(ngModel)]="subject" name="subject"
                       placeholder="Ej: Cálculo I" required [disabled]="!selectedFile">
              </div>
              <div class="input-group">
                <label for="subjectCode">Código (Opcional)</label>
                <input id="subjectCode" type="text" class="input-field" [(ngModel)]="subjectCode" name="subjectCode"
                       placeholder="Ej: ICC-301" [disabled]="!selectedFile">
              </div>
            </div>
            
            <div class="form-row">
              <div class="input-group">
                <label for="career">Carrera</label>
                <select id="career" class="input-field" [(ngModel)]="career" name="career" required [disabled]="!selectedFile">
                  <option value="" disabled>Selecciona la carrera</option>
                  <option *ngFor="let c of careers" [value]="c">{{ c }}</option>
                </select>
              </div>
              <div class="input-group half-row">
                <div>
                  <label for="year">Año</label>
                  <select id="year" class="input-field" [(ngModel)]="year" name="year" required [disabled]="!selectedFile">
                    <option *ngFor="let y of [1,2,3,4,5,6]" [value]="y">{{ y }}º</option>
                  </select>
                </div>
                <div>
                  <label for="semester">Semestre</label>
                  <select id="semester" class="input-field" [(ngModel)]="semester" name="semester" required [disabled]="!selectedFile">
                    <option value="1">1º</option>
                    <option value="2">2º</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="input-group">
              <label for="description">Descripción (Opcional)</label>
              <textarea id="description" class="input-field" [(ngModel)]="description" name="description"
                        placeholder="Añade detalles sobre el contenido, autor original, etc." rows="3" [disabled]="!selectedFile"></textarea>
            </div>
          </div>
          
          <div class="upload-progress" *ngIf="uploading()">
            <div class="progress-bar">
              <div class="progress-fill skeleton"></div>
            </div>
            <p>Subiendo archivo y procesando datos...</p>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" routerLink="/materials" [disabled]="uploading()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="!isValid() || uploading()">
              {{ uploading() ? 'Subiendo...' : 'Subir Material' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .upload-page { padding-top: calc(var(--navbar-height) + var(--space-lg)); padding-bottom: var(--space-xl); max-width: 800px; }
    .page-header { text-align: center; margin-bottom: var(--space-xl); }
    .page-header h1 { font-size: 2rem; font-weight: 800; margin-bottom: var(--space-sm); }
    .page-header p { color: var(--color-text-muted); font-size: 1.1rem; }
    
    .upload-card { padding: var(--space-xl); }
    .upload-form { display: flex; flex-direction: column; gap: var(--space-xl); }
    
    .file-drop-zone {
      border: 2px dashed var(--color-border); border-radius: var(--radius-lg);
      padding: var(--space-2xl) var(--space-lg); text-align: center;
      background: var(--color-bg-alt); cursor: pointer; transition: all var(--transition-normal);
      display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px;
    }
    .file-drop-zone:hover, .file-drop-zone.drag-over { border-color: var(--color-primary); background: rgba(27,58,107,0.02); }
    .file-drop-zone.has-file { border-style: solid; border-color: var(--color-success); background: var(--color-success-bg); padding: var(--space-lg); min-height: auto; }
    .hidden-input { display: none; }
    
    .drop-icon { font-size: 3rem; margin-bottom: var(--space-md); }
    .file-drop-zone h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: var(--space-xs); color: var(--color-text); }
    .file-drop-zone p { font-size: 0.9rem; color: var(--color-text-muted); }
    
    .file-preview { display: flex; align-items: center; gap: var(--space-md); width: 100%; text-align: left; }
    .file-preview .drop-icon { margin-bottom: 0; font-size: 2.5rem; }
    .file-info { flex: 1; min-width: 0; }
    .file-name { font-weight: 700; font-size: 1.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-text); }
    .file-size { font-size: 0.85rem; color: var(--color-text-secondary); }
    .remove-file { background: white; border: 1px solid var(--color-border); color: var(--color-danger); }
    .remove-file:hover { background: var(--color-danger-bg); }
    
    .form-section { display: flex; flex-direction: column; gap: var(--space-lg); transition: opacity var(--transition-fast); }
    .form-section.disabled { opacity: 0.5; pointer-events: none; }
    .form-section h3 { font-size: 1.2rem; font-weight: 700; border-bottom: 1px solid var(--color-border-light); padding-bottom: var(--space-sm); margin-bottom: -8px; }
    
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg); }
    .half-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
    
    .upload-progress { text-align: center; margin-top: var(--space-md); }
    .progress-bar { height: 6px; background: var(--color-border-light); border-radius: var(--radius-full); overflow: hidden; margin-bottom: 8px; }
    .progress-fill { height: 100%; width: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-secondary)); }
    .upload-progress p { font-size: 0.85rem; color: var(--color-text-muted); font-weight: 500; }
    
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-md); }
    
    @media(max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
  `]
})
export class UploadMaterialComponent {
  careers = [
    'Ingeniería Civil Informática', 'Ingeniería Civil Industrial', 'Ingeniería Comercial', 
    'Derecho', 'Psicología', 'Medicina', 'Enfermería', 'Otra'
  ];
  
  selectedFile: File | null = null;
  isDragOver = false;
  fileError = '';
  
  title = '';
  subject = '';
  subjectCode = '';
  career = '';
  year: number = 1;
  semester: number = 1;
  description = '';
  
  uploading = signal(false);

  constructor(
    private materialsService: MaterialsService,
    private auth: AuthService,
    private router: Router
  ) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    this.fileError = '';
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      this.fileError = 'El archivo supera el límite de 20MB.';
      return;
    }
    
    // Auto-fill title if empty
    if (!this.title) {
      this.title = file.name.split('.').slice(0, -1).join('.').replace(/[_-]/g, ' ');
      // Capitalize first letter
      this.title = this.title.charAt(0).toUpperCase() + this.title.slice(1);
    }
    
    this.selectedFile = file;
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isValid(): boolean {
    return !!this.selectedFile && !!this.title.trim() && !!this.subject.trim() && !!this.career;
  }

  async onSubmit() {
    if (!this.isValid() || !this.selectedFile) return;
    
    const userId = this.auth.user()?.id;
    if (!userId) return;

    this.uploading.set(true);
    try {
      await this.materialsService.uploadMaterial(this.selectedFile, {
        title: this.title.trim(),
        subject: this.subject.trim(),
        subject_code: this.subjectCode.trim().toUpperCase(),
        career: this.career,
        year: Number(this.year),
        semester: Number(this.semester),
        description: this.description.trim(),
        uploader_id: userId
      });
      
      this.router.navigate(['/materials']);
    } catch (err: any) {
      console.error('Upload error', err);
      this.fileError = err.message || 'Error al subir el archivo.';
    } finally {
      this.uploading.set(false);
    }
  }
}
