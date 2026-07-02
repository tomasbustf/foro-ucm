import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const CAREERS = [
  'Ingeniería Civil Informática', 'Ingeniería Civil Industrial',
  'Ingeniería Comercial', 'Ingeniería en Construcción',
  'Pedagogía en Educación Física', 'Pedagogía en Matemática',
  'Pedagogía en Inglés', 'Pedagogía en Educación General Básica',
  'Pedagogía en Educación Especial', 'Pedagogía en Religión y Filosofía',
  'Derecho', 'Psicología', 'Trabajo Social', 'Kinesiología',
  'Enfermería', 'Medicina', 'Agronomía', 'Ingeniería en Biotecnología',
  'Arquitectura', 'Contador Auditor', 'Otra',
];

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card" *ngIf="!success() && !alreadyRegistered()">
        <div class="auth-header">
          <img src="assets/logo-ucm.png" alt="Logo UCM" class="logo-icon" style="background: transparent;">
          <h1>Crear Cuenta</h1>
          <p>Únete al Foro Estudiantil Digital UCM</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">

          <div class="input-group">
            <label for="emailPrefix">Correo electrónico institucional</label>
            <div class="email-input-wrapper">
              <input id="emailPrefix" type="text" class="input-field" [(ngModel)]="emailPrefix" name="emailPrefix"
                     placeholder="tu.nombre" required
                     [class.input-error]="emailError()">
              <span class="email-domain">&#64;alumnos.ucm.cl</span>
            </div>
            <span class="error-text" *ngIf="emailError()">{{ emailError() }}</span>
          </div>

          <div class="form-row">
            <div class="input-group">
              <label for="career">Carrera</label>
              <select id="career" class="input-field" [(ngModel)]="career" name="career" required>
                <option value="" disabled>Selecciona tu carrera</option>
                <option *ngFor="let c of careers" [value]="c">{{ c }}</option>
              </select>
            </div>
            <div class="input-group">
              <label for="yearOfEntry">Año de ingreso</label>
              <input id="yearOfEntry" type="number" class="input-field" [(ngModel)]="yearOfEntry"
                     name="yearOfEntry" placeholder="2024" min="2000" [max]="currentYear" required>
            </div>
          </div>

          <div class="input-group">
            <label for="password">Contraseña</label>
            <div class="password-wrapper">
              <input id="password" [type]="showPassword ? 'text' : 'password'" class="input-field" [(ngModel)]="password"
                     name="password" placeholder="Mínimo 6 caracteres" required minlength="6"
                     (input)="error.set('')">
              <button type="button" class="eye-toggle" (click)="showPassword = !showPassword" tabindex="-1">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
                   
            <ul class="password-rules" *ngIf="password">
              <li [class.valid]="hasMinLength">
                <span class="rule-icon">{{ hasMinLength ? '✓' : '○' }}</span> Mínimo 6 caracteres
              </li>
              <li [class.valid]="hasUpperCase">
                <span class="rule-icon">{{ hasUpperCase ? '✓' : '○' }}</span> Al menos una mayúscula
              </li>
              <li [class.valid]="hasNumber">
                <span class="rule-icon">{{ hasNumber ? '✓' : '○' }}</span> Al menos un número
              </li>
              <li [class.valid]="hasSpecialChar">
                <span class="rule-icon">{{ hasSpecialChar ? '✓' : '○' }}</span> Al menos un carácter especial
              </li>
            </ul>
          </div>

          <div class="input-group">
            <label for="confirmPassword">Confirmar Contraseña</label>
            <div class="password-wrapper">
              <input id="confirmPassword" [type]="showConfirmPassword ? 'text' : 'password'" class="input-field" [(ngModel)]="confirmPassword"
                     name="confirmPassword" placeholder="Reescribe tu contraseña" required
                     [class.input-error]="confirmPassword && password !== confirmPassword">
              <button type="button" class="eye-toggle" (click)="showConfirmPassword = !showConfirmPassword" tabindex="-1">
                {{ showConfirmPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <span class="error-text" *ngIf="confirmPassword && password !== confirmPassword">Las contraseñas no coinciden</span>
            <span class="match-text" *ngIf="confirmPassword && password === confirmPassword">✓ Las contraseñas coinciden</span>
          </div>

          <p class="error-text" *ngIf="error() && !alreadyRegistered()">{{ error() }}</p>

          <p class="terms-text">
            Al registrarte, aceptas nuestros <a routerLink="/terms-and-conditions" target="_blank">Términos y Condiciones</a>, la <a routerLink="/privacy-policy" target="_blank">Política de Privacidad</a> y las <a routerLink="/conduct-rules" target="_blank">Normas de Uso</a>.
          </p>

          <button type="submit" class="btn btn-primary btn-lg full-width" [disabled]="loading()">
            {{ loading() ? 'Creando cuenta...' : 'Registrarse' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a></p>
        </div>
      </div>

      <!-- Already registered message -->
      <div class="auth-card card already-registered-card" *ngIf="alreadyRegistered()">
        <div class="already-registered-icon">⚠️</div>
        <h2>Este correo ya está registrado</h2>
        <p>La cuenta <strong>{{ fullEmail }}</strong> ya existe en el Foro UCM.
           Si ya te registraste, puedes iniciar sesión directamente.</p>
        <a routerLink="/auth/login" class="btn btn-primary btn-lg full-width">Iniciar Sesión</a>
        <button class="btn btn-secondary btn-lg full-width" style="margin-top: var(--space-sm);" (click)="resetForm()">Usar otro correo</button>
      </div>

      <!-- Success message (Email Confirmation Enabled) -->
      <div class="auth-card card success-card" *ngIf="success() === 'email'">
        <div class="success-icon">📬</div>
        <h2>¡Revisa tu correo!</h2>
        <p>Te enviamos un email de verificación a <strong>{{ fullEmail }}</strong>.
           Haz clic en el enlace para activar tu cuenta.</p>
        <a routerLink="/auth/login" class="btn btn-primary btn-lg full-width">Ir a Iniciar Sesión</a>
      </div>

      <!-- Success message (Direct Login / Option A) -->
      <div class="auth-card card success-card" *ngIf="success() === 'direct'">
        <div class="success-icon">🎉</div>
        <h2>¡Registro Exitoso!</h2>
        <p>Tu cuenta <strong>{{ fullEmail }}</strong> fue creada y ya has iniciado sesión automáticamente.</p>
        <a routerLink="/" class="btn btn-primary btn-lg full-width">Entrar al Foro</a>
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
      width: 100%; max-width: 520px; padding: var(--space-xl);
      animation: scaleIn 0.3s ease-out;
    }
    .auth-header { text-align: center; margin-bottom: var(--space-xl); }
    .auth-header .logo-icon {
      height: 64px; width: auto; object-fit: contain; margin: 0 auto var(--space-md);
      display: block;
    }
    .auth-header h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: var(--space-xs); }
    .auth-header p { color: var(--color-text-muted); font-size: 0.9rem; }
    .auth-form { display: flex; flex-direction: column; gap: var(--space-md); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
    .full-width { width: 100%; }
    .auth-footer { text-align: center; margin-top: var(--space-lg); font-size: 0.9rem; color: var(--color-text-muted); }
    .auth-footer a { color: var(--color-primary); font-weight: 600; }
    .success-card, .already-registered-card { text-align: center; }
    .success-icon, .already-registered-icon { font-size: 4rem; margin-bottom: var(--space-md); }
    .success-card h2, .already-registered-card h2 { font-size: 1.5rem; font-weight: 800; margin-bottom: var(--space-md); }
    .success-card p, .already-registered-card p { color: var(--color-text-muted); margin-bottom: var(--space-xl); line-height: 1.6; }
    .already-registered-card { border: 2px solid #F59E0B; }
    .already-registered-card h2 { color: #F59E0B; }
    .terms-text { font-size: 0.75rem; color: var(--color-text-muted); text-align: center; margin-bottom: var(--space-md); line-height: 1.4; }
    .terms-text a { color: var(--color-primary-light); text-decoration: underline; font-weight: 500; }
    .password-rules { list-style: none; padding: 0; margin: 8px 0 0 0; font-size: 0.8rem; color: var(--color-text-muted); }
    .password-rules li { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; transition: color 0.2s ease; }
    .password-rules li.valid { color: #10B981; }
    .rule-icon { font-size: 0.75rem; }
    .password-wrapper { position: relative; display: flex; align-items: center; }
    .password-wrapper .input-field { padding-right: 42px; width: 100%; }
    .eye-toggle { position: absolute; right: 8px; background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 4px; line-height: 1; opacity: 0.6; transition: opacity 0.2s; }
    .eye-toggle:hover { opacity: 1; }
    .match-text { font-size: 0.8rem; color: #10B981; margin-top: 4px; }
    select.input-field { cursor: pointer; }
    
    .email-input-wrapper { display: flex; align-items: stretch; width: 100%; }
    .email-input-wrapper .input-field { border-right: none; border-top-right-radius: 0; border-bottom-right-radius: 0; flex: 1; min-width: 0; }
    .email-domain { background: var(--color-bg-alt); border: 2px solid var(--color-border); border-left: none; padding: 10px 14px; border-top-right-radius: var(--radius-md); border-bottom-right-radius: var(--radius-md); color: var(--color-text-secondary); font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; white-space: nowrap;}
    
    @media(max-width:540px) { .form-row { grid-template-columns: 1fr; } }
  `]
})
export class RegisterComponent {
  careers = CAREERS;
  currentYear = new Date().getFullYear();
  emailPrefix = ''; career = ''; yearOfEntry: number | null = null; password = ''; confirmPassword = '';
  showPassword = false; showConfirmPassword = false;
  error = signal(''); emailError = signal(''); loading = signal(false); 
  success = signal<'email' | 'direct' | null>(null); alreadyRegistered = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  get fullEmail() {
    return this.emailPrefix ? `${this.emailPrefix}@alumnos.ucm.cl` : '';
  }

  validateEmail(): boolean {
    if (!this.emailPrefix.trim()) {
      this.emailError.set('Ingresa tu nombre de usuario');
      return false;
    }
    if (this.emailPrefix.includes('@')) {
      this.emailError.set('No incluyas el @, solo tu nombre.apellido');
      return false;
    }
    this.emailError.set('');
    return true;
  }

  get hasMinLength() { return this.password.length >= 6; }
  get hasUpperCase() { return /[A-Z]/.test(this.password); }
  get hasNumber() { return /[0-9]/.test(this.password); }
  get hasSpecialChar() { return /[^a-zA-Z0-9]/.test(this.password); }

  validatePassword(): boolean {
    if (!this.hasMinLength || !this.hasUpperCase || !this.hasNumber || !this.hasSpecialChar) {
      this.error.set('La contraseña no cumple con todos los requisitos obligatorios.');
      return false;
    }
    if (this.password !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden.');
      return false;
    }
    return true;
  }

  /**
   * Extracts name info from UCM email.
   * Formats: nombre.apellido@alumnos.ucm.cl or nombre.apellido.XX@alumnos.ucm.cl
   */
  private parseEmailName(email: string): { fullName: string; username: string } {
    const localPart = email.split('@')[0]; // e.g. "tomas.bustos" or "tomas.bustos.01"
    const parts = localPart.split('.');

    // Remove trailing numeric suffix if present (e.g. "01", "02")
    const cleanParts = parts.filter(p => !/^\d+$/.test(p));

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const fullName = cleanParts.map(capitalize).join(' ');
    const username = cleanParts.join('.').toLowerCase();

    return { fullName, username };
  }

  async onSubmit() {
    if (!this.validateEmail()) return;
    if (!this.validatePassword()) return;
    this.error.set(''); this.alreadyRegistered.set(false); this.loading.set(true);
    try {
      const { fullName, username } = this.parseEmailName(this.fullEmail);

      const result = await this.auth.signUp(this.fullEmail, this.password, {
        username, full_name: fullName,
        career: this.career, year_of_entry: this.yearOfEntry || this.currentYear,
      });
      
      // If session exists, user is already logged in (Email confirmation disabled)
      if (result.session) {
        this.success.set('direct');
        // Redirigir al inicio después de 3 segundos
        setTimeout(() => this.router.navigate(['/']), 3000);
      } else {
        this.success.set('email');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err?.message === 'EMAIL_ALREADY_REGISTERED') {
        this.alreadyRegistered.set(true);
      } else {
        let msg = 'Error al registrarse. Intenta de nuevo más tarde.';
        
        if (err?.status === 429) {
          msg = 'Has superado el límite de correos. Por seguridad de la plataforma, intenta en 60 minutos.';
        } else if (err?.status === 500) {
          msg = 'Error interno del servidor. Esto suele ocurrir si la configuración del correo SMTP (Brevo) es inválida o el remitente no está verificado.';
        } else if (err?.message && err.message !== '{}') {
          msg = typeof err.message === 'string' ? err.message : JSON.stringify(err.message);
        } else {
          // Fallback detailed stringify
          msg = 'Error de Supabase: ' + JSON.stringify(err);
        }
        
        // Translate common Supabase errors
        if (msg.includes('rate limit')) msg = 'Has superado el límite de correos (Rate Limit). Intenta más tarde.';
        if (msg.includes('Database error')) msg = 'Error en el servidor. Verifica que llenaste todos los campos (Carrera, etc).';
        
        this.error.set(msg);
      }
    } finally {
      this.loading.set(false);
    }
  }

  resetForm() {
    this.alreadyRegistered.set(false);
    this.error.set('');
    this.emailPrefix = '';
  }
}
