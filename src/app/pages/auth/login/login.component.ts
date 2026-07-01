import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-header">
          <img src="assets/logo-ucm.png" alt="Logo UCM" class="logo-icon" style="background: transparent;">
          <h1>Iniciar Sesión</h1>
          <p>Accede al Foro Estudiantil Digital UCM</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="input-group">
            <label for="email">Correo electrónico</label>
            <input id="email" type="email" class="input-field" [(ngModel)]="email"
                   name="email" placeholder="tu.nombre&#64;alumnos.ucm.cl" required
                   [class.input-error]="error()">
          </div>

          <div class="input-group">
            <label for="password">Contraseña</label>
            <input id="password" type="password" class="input-field" [(ngModel)]="password"
                   name="password" placeholder="••••••••" required>
          </div>

          <div class="auth-options">
            <a routerLink="/auth/forgot-password" class="forgot-link">¿Olvidaste tu contraseña?</a>
          </div>

          <p class="error-text" *ngIf="error()">{{ error() }}</p>

          <button type="submit" class="btn btn-primary btn-lg full-width" [disabled]="loading()">
            {{ loading() ? 'Entrando...' : 'Iniciar Sesión' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>¿No tienes cuenta? <a routerLink="/auth/register">Regístrate aquí</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: calc(var(--navbar-height) + var(--space-xl)) var(--space-md) var(--space-xl);
      background: linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-alt) 100%);
    }
    .auth-card {
      width: 100%; max-width: 440px; padding: var(--space-xl);
      animation: scaleIn 0.3s ease-out;
    }
    .auth-header { text-align: center; margin-bottom: var(--space-xl); }
    .auth-header .logo-icon {
      width: 48px; height: 48px; border-radius: var(--radius-md); margin: 0 auto var(--space-md);
      background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 0.8rem; font-weight: 900;
    }
    .auth-header h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: var(--space-xs); }
    .auth-header p { color: var(--color-text-muted); font-size: 0.9rem; }
    .auth-form { display: flex; flex-direction: column; gap: var(--space-md); }
    .auth-options { display: flex; justify-content: flex-end; }
    .forgot-link { font-size: 0.85rem; color: var(--color-primary-light); }
    .full-width { width: 100%; }
    .auth-footer { text-align: center; margin-top: var(--space-lg); font-size: 0.9rem; color: var(--color-text-muted); }
    .auth-footer a { color: var(--color-primary); font-weight: 600; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  async onSubmit() {
    this.error.set('');
    this.loading.set(true);
    try {
      await this.auth.signIn(this.email, this.password);
      this.router.navigate(['/home']);
    } catch (err: any) {
      this.error.set(err.message || 'Error al iniciar sesión');
    } finally {
      this.loading.set(false);
    }
  }
}
