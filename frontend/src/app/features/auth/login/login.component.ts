import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <a class="back-link" (click)="goBack()"><mat-icon>arrow_back</mat-icon> Volver al menú</a>
        <mat-card-header>
          <mat-card-title>Iniciar sesión</mat-card-title>
          <mat-card-subtitle>Ingresá tu email y te enviaremos un enlace de acceso</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (!emailSent()) {
            <form (ngSubmit)="onSubmit()" class="login-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input
                  matInput
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  placeholder="tu@email.com"
                  required
                  email
                  [disabled]="loading()"
                />
                <mat-icon matPrefix>email</mat-icon>
              </mat-form-field>

              @if (error()) {
                <p class="error-text">{{ error() }}</p>
              }

              <button
                mat-raised-button
                color="primary"
                type="submit"
                class="full-width submit-btn"
                [disabled]="loading() || !email"
              >
                @if (loading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Enviar enlace de acceso
                }
              </button>
            </form>
          } @else {
            <div class="success-message">
              <mat-icon class="success-icon">mark_email_read</mat-icon>
              <h3>¡Revisá tu email!</h3>
              <p>Enviamos un enlace de acceso a <strong>{{ email }}</strong></p>
              <p class="hint">El enlace expira en 15 minutos</p>
              <p class="hint">¿No recibiste el email? Revisá tu carpeta de spam</p>
              <button
                mat-stroked-button
                (click)="resetForm()"
                class="full-width"
              >
                Usar otro email
              </button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 16px;
      background: #FBF8F3;
    }
    .login-card {
      max-width: 420px;
      width: 100%;
      padding: 24px;
      border-radius: 16px;
      border: 1px solid #F0E6D9;
      box-shadow: 0 4px 20px rgba(28,18,16,0.08);
    }
    .login-form {
      margin-top: 16px;
    }
    .full-width {
      width: 100%;
    }
    .submit-btn {
      height: 48px;
      font-size: 16px;
      margin-top: 8px;
      border-radius: 12px;
      background: linear-gradient(135deg, #C2410C, #9A3412) !important;
      color: white !important;
    }
    @media (max-width: 480px) {
      .login-container { padding: 12px; align-items: flex-start; padding-top: 60px; }
      .login-card { padding: 20px 16px; }
    }
    .error-text {
      color: #e53935;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .success-message {
      text-align: center;
      padding: 24px 0;
    }
    .success-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
      margin-bottom: 16px;
    }
    .hint {
      color: #888;
      font-size: 13px;
      margin-bottom: 24px;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #999;
      cursor: pointer;
      margin-bottom: 12px;
      font-size: 13px;
      text-decoration: none;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { color: #333; }
    }
  `],
})
export class LoginComponent {
  email = '';
  loading = signal(false);
  emailSent = signal(false);
  error = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.email) return;
    this.loading.set(true);
    this.error.set('');

    this.authService.sendMagicLink(this.email.trim().toLowerCase()).subscribe({
      next: () => {
        this.loading.set(false);
        this.emailSent.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Error al enviar el enlace. Intentá de nuevo.');
      },
    });
  }

  resetForm(): void {
    this.email = '';
    this.emailSent.set(false);
    this.error.set('');
  }

  goBack(): void {
    window.history.length > 1 ? window.history.back() : this.router.navigate(['/home']);
  }
}
