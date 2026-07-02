import { Component, effect, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';
import { NotificationsService } from './core/services/notifications.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
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
          <div class="ucmito-speech" (click)="toggleSpeech()">
            ¡Hola! Soy Ucmito, tu guía en el Foro UCM. 
          </div>
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

  toggleSpeech() {
    this.showSpeech.set(!this.showSpeech());
  }

  constructor(
    public auth: AuthService,
    private notifications: NotificationsService,
    private router: Router
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
}
