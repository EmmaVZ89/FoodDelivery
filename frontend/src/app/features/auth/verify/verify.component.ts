import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="verify-container">
      <mat-card class="verify-card">
        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="48"></mat-spinner>
            <p>Verificando tu acceso...</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <h3>No pudimos verificar tu acceso</h3>
            <p>{{ error() }}</p>
            <button
              mat-raised-button
              color="primary"
              routerLink="/auth/login"
              class="full-width"
            >
              Solicitar nuevo enlace
            </button>
          </div>
        } @else {
          <div class="success-state">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h3>¡Acceso verificado!</h3>
            <p>Redirigiendo...</p>
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .verify-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 16px;
    }
    .verify-card {
      max-width: 420px;
      width: 100%;
      padding: 32px;
      text-align: center;
    }
    .loading-state, .error-state, .success-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #e53935;
    }
    .success-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
    }
    .full-width {
      width: 100%;
    }
  `],
})
export class VerifyComponent implements OnInit {
  loading = signal(true);
  error = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.error.set('Enlace inválido');
      return;
    }

    this.authService.verifyToken(token).subscribe({
      next: (response) => {
        this.authService.handleAuthResponse(response);
        this.loading.set(false);

        // Redirect to returnUrl or home
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
        setTimeout(() => this.router.navigateByUrl(returnUrl), 1000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'El enlace es inválido o ha expirado.');
      },
    });
  }
}
