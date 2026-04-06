import { Component, OnInit, effect } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService } from './core/services/config.service';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { AlertService } from './core/services/alert.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatSidenavModule,
    MatListModule,
    MatSnackBarModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  constructor(
    public configService: ConfigService,
    public authService: AuthService,
    public cartService: CartService,
    private alertService: AlertService,
    private snackBar: MatSnackBar,
    public router: Router,
    private titleService: Title
  ) {
    // Update page title and favicon when config loads
    effect(() => {
      const config = this.configService.config();
      if (config) {
        this.titleService.setTitle(config.name || 'Lo de Luna');
        if (config.faviconUrl) {
          const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.rel = 'icon';
          link.href = config.faviconUrl;
          document.head.appendChild(link);
        }
      }
    });
  }

  ngOnInit(): void {
    this.configService.loadConfig();
    this.alertService.loadActiveAlerts();
    this.showAlerts();
  }

  get isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }

  get isAuthRoute(): boolean {
    return this.router.url.startsWith('/auth');
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  private showAlerts(): void {
    // Poll until alerts are loaded (max 5s)
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const alerts = this.alertService.alerts();
      if (alerts.length > 0) {
        clearInterval(interval);
        this.snackBar.open(alerts[0].message, 'Cerrar', {
          duration: 10000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      }
      if (attempts >= 10) clearInterval(interval);
    }, 500);
  }
}
