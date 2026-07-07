import { Component, effect, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';
import { NotificationsService } from './core/services/notifications.service';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from './core/services/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FormsModule],
  template: `
    @if (auth.isAuthenticated()) {
      <app-navbar></app-navbar>
    }
    <main class="app-main">
      <router-outlet></router-outlet>
    </main>

    <!-- Guía Ucmito Flotante -->
    @if (showUcmito()) {
      <div class="ucmito-guide hide-mobile">
        @if (showSpeech()) {
          @if (auth.isAuthenticated()) {
            <div class="ucmito-speech chat-style">
              <div class="chat-header">
                <strong>Ucmito (Beta)</strong>
                <button (click)="toggleSpeech()" class="ucmito-close-btn">&times;</button>
              </div>
              <div class="chat-body">
                @if (chatMode === 'options') {
                  <p>¡Hola! Como estamos en fase Beta, me ayudaría mucho si me dejas sugerencias o si respondes una breve encuesta de usabilidad.</p>
                  <div class="chat-actions">
                    <button class="btn btn-outline btn-sm" style="flex: 1" (click)="chatMode = 'feedback'">Sugerencia</button>
                    <button class="btn btn-primary btn-sm" style="flex: 1" (click)="chatMode = 'survey'">Encuesta SUS</button>
                  </div>
                } @else if (chatMode === 'feedback') {
                  <p>Escribe tu sugerencia o comentario:</p>
                  <textarea class="feedback-textarea" [(ngModel)]="feedbackText" placeholder="Escribe aquí..."></textarea>
                  <div class="chat-actions">
                    <button class="btn btn-ghost btn-sm" (click)="chatMode = 'options'">Volver</button>
                    <button class="btn btn-primary btn-sm btn-send" (click)="sendFeedback()" [disabled]="!feedbackText.trim()">Enviar</button>
                  </div>
                } @else if (chatMode === 'survey') {
                  <p><strong>Encuesta SUS</strong><br><span style="font-size:0.75rem;color:var(--color-text-muted);">1: Totalmente en desacuerdo - 5: Totalmente de acuerdo</span></p>
                  <div class="sus-questions-container">
                    @for (q of susQuestions; track qIndex; let qIndex = $index) {
                      <div class="sus-question">
                        <p>{{ qIndex + 1 }}. {{ q }}</p>
                        <div class="sus-scale">
                          @for (val of [1,2,3,4,5]; track val) {
                            <img src="assets/ucmito saluda -02.png" 
                                 class="ucmito-rating-icon" 
                                 [class.selected]="susAnswers[qIndex] >= val"
                                 (click)="setSusAnswer(qIndex, val)"
                                 [title]="val">
                          }
                        </div>
                      </div>
                    }
                  </div>
                  <div class="chat-actions" style="margin-top: 8px;">
                    <button class="btn btn-ghost btn-sm" (click)="chatMode = 'options'">Volver</button>
                    <button class="btn btn-primary btn-sm btn-send" (click)="submitSurvey()" [disabled]="!isSurveyComplete()">Enviar</button>
                  </div>
                } @else if (chatMode === 'thanks') {
                  <p>¡Gracias por tu participación! Tu opinión nos ayuda a mejorar el Foro Estudiantil UCM.</p>
                  <div class="chat-actions">
                    <button class="btn btn-primary btn-sm" (click)="toggleSpeech()">Cerrar</button>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="ucmito-speech" (click)="toggleSpeech()">
              ¡Hola! Soy Ucmito, tu guía en el Foro UCM. 
            </div>
          }
        }
        <img src="assets/ucmito saluda -02.png" alt="Ucmito" class="ucmito-img" (click)="toggleSpeech()">
      </div>
    }
  `,
  styles: [`
    .app-main {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class AppComponent {
  private notifSub: any;
  showUcmito = signal(true);
  showSpeech = signal(true);
  
  chatMode: 'options' | 'feedback' | 'survey' | 'thanks' = 'options';
  feedbackText = '';
  
  susQuestions = [
    'Me gustaría utilizar este foro estudiantil con frecuencia.',
    'Encontré el foro innecesariamente complejo.',
    'Consideré que el foro fue fácil de usar.',
    'Creo que necesitaría ayuda de otra persona para usar este foro.',
    'Encontré que las funciones del foro están bien integradas.',
    'Pensé que había demasiada inconsistencia en el foro.',
    'Imagino que la mayoría de los estudiantes aprendería a usar este foro rápidamente.',
    'Encontré el foro difícil de utilizar.',
    'Me sentí seguro/a usando el foro.',
    'Necesité aprender muchas cosas antes de poder usar correctamente el foro.'
  ];
  susAnswers: number[] = new Array(10).fill(0);

  constructor(
    public auth: AuthService,
    private notifications: NotificationsService,
    private router: Router,
    private supabase: SupabaseService
  ) {
    // Scroll to top on route change
    this.router.events.subscribe((event) => {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    });

    // Handle notifications subscription when auth state changes
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.notifications.loadNotifications();
        this.notifSub = this.notifications.subscribeToNotifications();
      } else {
        if (this.notifSub) {
          this.notifSub.unsubscribe();
          this.notifSub = null;
        }
      }
    });
  }

  toggleSpeech() {
    this.showSpeech.set(!this.showSpeech());
    if (!this.showSpeech()) {
      setTimeout(() => {
        this.chatMode = 'options';
        this.susAnswers = new Array(10).fill(0);
      }, 300);
    }
  }

  setSusAnswer(index: number, val: number) {
    this.susAnswers[index] = val;
  }

  async sendFeedback() {
    if (this.feedbackText.trim()) {
      const user = this.auth.user();
      if (user) {
        await this.supabase.client.from('beta_suggestions').insert({
          user_id: user.id,
          content: this.feedbackText.trim()
        });
      }
      this.feedbackText = '';
      this.chatMode = 'thanks';
    }
  }

  isSurveyComplete(): boolean {
    return this.susAnswers.every(ans => ans > 0);
  }

  async submitSurvey() {
    if (this.isSurveyComplete()) {
      const user = this.auth.user();
      if (user) {
        const payload = {
          user_id: user.id,
          q1: this.susAnswers[0],
          q2: this.susAnswers[1],
          q3: this.susAnswers[2],
          q4: this.susAnswers[3],
          q5: this.susAnswers[4],
          q6: this.susAnswers[5],
          q7: this.susAnswers[6],
          q8: this.susAnswers[7],
          q9: this.susAnswers[8],
          q10: this.susAnswers[9],
          updated_at: new Date().toISOString()
        };
        
        await this.supabase.client
          .from('sus_surveys')
          .upsert(payload, { onConflict: 'user_id' });
      }
      this.chatMode = 'thanks';
    }
  }
}

