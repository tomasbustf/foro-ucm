import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { VotesService } from '../../../core/services/votes.service';

@Component({
  selector: 'app-vote-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="vote-buttons" [class.horizontal]="horizontal">
      <button class="vote-btn upvote" [class.active]="currentVote() === 1"
              (click)="onVote(1)" [disabled]="!auth.isAuthenticated()">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </button>
      <span class="vote-count" [class.positive]="score() > 0" [class.negative]="score() < 0">
        {{ score() }}
      </span>
      <button class="vote-btn downvote" [class.active]="currentVote() === -1"
              (click)="onVote(-1)" [disabled]="!auth.isAuthenticated()">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .vote-buttons {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
    }
    .vote-buttons.horizontal { flex-direction: row; gap: var(--space-sm); }
    .vote-btn {
      width: 32px; height: 32px; border-radius: var(--radius-sm);
      border: none; background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--color-text-muted); transition: all var(--transition-fast);
    }
    .vote-btn:hover:not(:disabled) { background: var(--color-bg-alt); }
    .vote-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .vote-btn.upvote.active { color: var(--color-primary); background: rgba(27,58,107,0.1); }
    .vote-btn.downvote.active { color: var(--color-danger); background: rgba(239,68,68,0.1); }
    .vote-count {
      font-size: 1rem; font-weight: 800; color: var(--color-text-muted);
      min-width: 24px; text-align: center;
    }
    .vote-count.positive { color: var(--color-primary); }
    .vote-count.negative { color: var(--color-danger); }
  `]
})
export class VoteButtonsComponent {
  @Input() targetId!: string;
  @Input() targetType!: 'post' | 'reply';
  @Input() upvotes = 0;
  @Input() downvotes = 0;
  @Input() horizontal = false;
  @Output() voteChanged = new EventEmitter<{ upvotes: number; downvotes: number }>();

  currentVote = signal<number | null>(null);
  score = signal(0);

  constructor(public auth: AuthService, private votesService: VotesService) {}

  ngOnInit() {
    this.score.set(this.upvotes - this.downvotes);
    this.loadUserVote();
  }

  ngOnChanges() {
    this.score.set(this.upvotes - this.downvotes);
  }

  private async loadUserVote() {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    const vote = await this.votesService.getUserVote(userId, this.targetId, this.targetType);
    this.currentVote.set(vote);
  }

  async onVote(value: 1 | -1) {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const prev = this.currentVote();
    // Optimistic update
    if (prev === value) {
      this.currentVote.set(null);
      this.score.update(s => s - value);
    } else {
      this.currentVote.set(value);
      this.score.update(s => s + value - (prev || 0));
    }

    await this.votesService.vote(userId, this.targetId, this.targetType, value);
  }
}
