import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialsService, StudyMaterial } from '../../core/services/materials.service';
import { AuthService } from '../../core/services/auth.service';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-materials',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TimeAgoPipe, FileSizePipe],
  templateUrl: './materials.component.html',
  styleUrl: './materials.component.css'
})
export class MaterialsComponent implements OnInit {
  careers = [
    'Ingeniería Civil Informática', 'Ingeniería Civil Industrial', 'Ingeniería Comercial',
    'Derecho', 'Psicología', 'Medicina', 'Enfermería', 'Otra'
  ];

  filters = { search: '', career: '', year: '', semester: '' };
  sortBy = 'rating';
  materials = signal<StudyMaterial[]>([]);
  totalCount = signal(0);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(false);
  page = 0;
  private searchTimeout: any;

  // Preview modal
  previewMat = signal<StudyMaterial | null>(null);
  previewUrl = signal<SafeResourceUrl | null>(null);
  previewLoading = signal(false);

  // Votes
  userVotes = signal<Record<string, number>>({});
  votingId = signal<string | null>(null);

  constructor(
    public materialsService: MaterialsService,
    public auth: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadMaterials();
  }

  onFilterChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadMaterials();
    }, 400);
  }

  onSortChange() {
    this.loadMaterials();
  }

  async loadMaterials() {
    this.loading.set(true);
    this.page = 0;
    try {
      const { materials, count } = await this.materialsService.getMaterials({
        ...this.filters, sortBy: this.sortBy, page: 0, limit: 10
      });
      this.materials.set(materials);
      this.totalCount.set(count);
      this.hasMore.set(materials.length < count);
      await this.loadUserVotes(materials);
    } finally {
      this.loading.set(false);
    }
  }

  async loadMore() {
    this.loadingMore.set(true);
    this.page++;
    try {
      const { materials, count } = await this.materialsService.getMaterials({
        ...this.filters, sortBy: this.sortBy, page: this.page, limit: 10
      });
      this.materials.update(m => [...m, ...materials]);
      this.hasMore.set(this.materials().length < count);
      await this.loadUserVotes(materials);
    } finally {
      this.loadingMore.set(false);
    }
  }

  private async loadUserVotes(mats: StudyMaterial[]) {
    const userId = this.auth.user()?.id;
    if (!userId || !mats.length) return;
    try {
      const votes = await this.materialsService.getUserVotes(mats.map(m => m.id), userId);
      this.userVotes.update(v => ({ ...v, ...votes }));
    } catch (e) { console.error('Error loading votes', e); }
  }

  resetFilters() {
    this.filters = { search: '', career: '', year: '', semester: '' };
    this.loadMaterials();
  }

  getFileIcon(type: string): string {
    if (!type) return '📄';
    if (type.includes('pdf')) return '📕';
    if (type.includes('word') || type.includes('document')) return '📘';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📗';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📙';
    if (type.includes('zip') || type.includes('rar') || type.includes('compressed')) return '📦';
    if (type.includes('image')) return '🖼️';
    return '📄';
  }

  getFileTypeLabel(type: string): string {
    if (!type) return 'Documento';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('word') || type.includes('document')) return 'Word';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'Excel';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'PowerPoint';
    if (type.includes('zip') || type.includes('rar')) return 'Comprimido';
    return 'Documento';
  }

  isPdf(type: string): boolean {
    return type?.includes('pdf') || false;
  }

  // Preview
  openPreview(mat: StudyMaterial) {
    this.previewMat.set(mat);
    if (this.isPdf(mat.file_type)) {
      this.previewLoading.set(true);
      this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(mat.file_url));
    } else {
      this.previewUrl.set(null);
    }
    document.body.style.overflow = 'hidden';
  }

  closePreview() {
    this.previewMat.set(null);
    this.previewUrl.set(null);
    this.previewLoading.set(false);
    document.body.style.overflow = '';
  }

  onPreviewLoad() {
    this.previewLoading.set(false);
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('preview-overlay')) {
      this.closePreview();
    }
  }

  // Votes
  getUserVote(matId: string): number {
    return this.userVotes()[matId] || 0;
  }

  async vote(mat: StudyMaterial, voteValue: number, event: Event) {
    event.stopPropagation();
    const userId = this.auth.user()?.id;
    if (!userId || this.votingId()) return;

    this.votingId.set(mat.id);
    const currentVote = this.getUserVote(mat.id);

    // Optimistic update
    const newVote = currentVote === voteValue ? 0 : voteValue;
    this.userVotes.update(v => ({ ...v, [mat.id]: newVote }));

    const ratingDelta = newVote - currentVote;
    this.materials.update(mats => mats.map(m =>
      m.id === mat.id ? { ...m, rating_sum: m.rating_sum + ratingDelta } : m
    ));

    try {
      await this.materialsService.voteMaterial(mat.id, userId, voteValue);
    } catch (e) {
      // Revert
      this.userVotes.update(v => ({ ...v, [mat.id]: currentVote }));
      this.materials.update(mats => mats.map(m =>
        m.id === mat.id ? { ...m, rating_sum: m.rating_sum - ratingDelta } : m
      ));
    } finally {
      this.votingId.set(null);
    }
  }

  download(mat: StudyMaterial) {
    this.materialsService.incrementDownload(mat.id).catch(console.error);
    this.materials.update(mats => mats.map(m =>
      m.id === mat.id ? { ...m, download_count: m.download_count + 1 } : m
    ));
    window.open(mat.file_url, '_blank');
  }
}
