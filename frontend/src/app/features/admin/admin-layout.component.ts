import { Component, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { ConfigService } from '../../core/services/config.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule,
  ],
  template: `
    <mat-sidenav-container class="admin-container">
      <mat-sidenav
        #sidenav
        [mode]="isMobile ? 'over' : 'side'"
        [opened]="!isMobile"
        class="admin-sidenav"
      >
        <div class="sidenav-header">
          @if (configService.config()?.logoUrl) {
            <img [src]="configService.config()!.logoUrl" alt="Logo" class="logo-img" />
          } @else {
            <mat-icon class="logo-icon">restaurant</mat-icon>
          }
          <span class="logo-text">{{ configService.config()?.name || 'Admin' }}</span>
        </div>

        <mat-nav-list>
          @for (link of navLinks; track link.route) {
            <a
              mat-list-item
              [routerLink]="link.route"
              routerLinkActive="active-link"
              [routerLinkActiveOptions]="{ exact: link.route === 'dashboard' }"
              (click)="isMobile && sidenav.close()"
            >
              <mat-icon matListItemIcon>{{ link.icon }}</mat-icon>
              <span matListItemTitle>{{ link.label }}</span>
            </a>
          }
        </mat-nav-list>

        <div class="sidenav-footer">
          <a mat-list-item routerLink="/">
            <mat-icon matListItemIcon>arrow_back</mat-icon>
            <span matListItemTitle>Volver al sitio</span>
          </a>
        </div>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="admin-toolbar">
          @if (isMobile) {
            <button mat-icon-button (click)="sidenav.toggle()">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span class="toolbar-title">Panel de Administración</span>
        </mat-toolbar>

        <main class="admin-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host { display: flex; height: 100vh; }
    .admin-container { flex: 1; }

    .admin-sidenav {
      width: 260px;
      background: #FBF8F3;
      border-right: 1px solid #F0E6D9;
    }

    .sidenav-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      border-bottom: 1px solid #F0E6D9;
    }

    .logo-icon { color: #C2410C; font-size: 28px; width: 28px; height: 28px; }
    .logo-img { width: 32px; height: 32px; border-radius: 8px; object-fit: contain; }
    .logo-text { font-size: 18px; font-weight: 600; color: #1C1210; }

    .admin-sidenav mat-nav-list a {
      color: #78716C;
      border-radius: 8px;
      margin: 2px 8px;
    }
    .admin-sidenav mat-nav-list a mat-icon { color: #78716C; }
    .admin-sidenav mat-nav-list a:hover { background: #FEF7ED; color: #1C1210; }

    .admin-sidenav mat-nav-list a.active-link {
      background: #FFF1E6;
      color: #C2410C;
      font-weight: 600;
    }
    .admin-sidenav mat-nav-list a.active-link mat-icon { color: #C2410C; }

    .sidenav-footer {
      margin-top: auto;
      border-top: 1px solid #F0E6D9;
      padding: 8px 0;
    }
    .sidenav-footer a { color: #78716C; }

    .admin-toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      background: #FFFFFF;
      color: #1C1210;
      border-bottom: 1px solid #F0E6D9;
      box-shadow: none;
    }
    .toolbar-title { font-size: 16px; font-weight: 600; }

    .admin-content {
      padding: 24px;
      max-width: 1400px;
      background: #FBF8F3;
      min-height: calc(100vh - 64px);
    }

    @media (max-width: 599px) {
      .admin-sidenav { width: 240px; }
      .admin-content { padding: 12px; }
      .toolbar-title { font-size: 15px; }
    }
  `],
})
export class AdminLayoutComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isMobile = false;

  navLinks = [
    { route: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { route: 'categories', icon: 'category', label: 'Categorías' },
    { route: 'products', icon: 'inventory_2', label: 'Productos' },
    { route: 'orders', icon: 'receipt_long', label: 'Pedidos' },
    { route: 'schedules', icon: 'schedule', label: 'Horarios' },
    { route: 'config', icon: 'settings', label: 'Configuración' },
    { route: 'discount-codes', icon: 'local_offer', label: 'Códigos Descuento' },
    { route: 'alerts', icon: 'notifications', label: 'Alertas' },
  ];

  constructor(private breakpointObserver: BreakpointObserver, public configService: ConfigService) {
    this.breakpointObserver
      .observe(['(max-width: 959.98px)'])
      .pipe(map(result => result.matches))
      .subscribe(isMobile => { this.isMobile = isMobile; });
  }
}
