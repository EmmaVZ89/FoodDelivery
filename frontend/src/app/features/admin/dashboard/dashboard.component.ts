import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';

interface DashboardData {
  pendingOrders: number;
  preparingOrders: number;
  onTheWayOrders: number;
  deliveredToday: number;
  cancelledToday: number;
  todayRevenue: number;
  activeOrdersCount: number;
  maxConcurrentOrders: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, MatCardModule, MatIconModule, MatSnackBarModule],
  template: `
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">Resumen de la actividad del negocio</p>

    <div class="dashboard-grid">
      @if (loading()) {
        @for (i of skeletonCards; track i) {
          <mat-card class="stat-card">
            <div class="skeleton skeleton-icon"></div>
            <div class="skeleton skeleton-label"></div>
            <div class="skeleton skeleton-value"></div>
          </mat-card>
        }
      } @else {
        @for (card of cards(); track card.label) {
          <mat-card class="stat-card">
            <mat-icon class="stat-icon" [style.color]="card.color">{{ card.icon }}</mat-icon>
            <span class="stat-label">{{ card.label }}</span>
            <span class="stat-value">{{ card.value }}</span>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .page-subtitle { margin: -8px 0 16px; font-size: 14px; color: #94a3b8; }

    .page-title {
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 600;
      color: #1A2E12;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    @media (min-width: 768px) {
      .dashboard-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
      }
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 12px;
      text-align: center;
      gap: 6px;
      min-height: 130px;
      justify-content: center;
      border: 1px solid #E2EDDA;
    }

    .stat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin-bottom: 2px;
    }

    .stat-label {
      font-size: 12px;
      color: #5F7456;
      font-weight: 500;
      line-height: 1.2;
      white-space: nowrap;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 600;
      color: #1A2E12;
      white-space: nowrap;
    }

    @media (min-width: 768px) {
      .stat-label { font-size: 14px; }
      .stat-value { font-size: 28px; }
    }

    .skeleton {
      background: linear-gradient(90deg, #DDECD4 25%, #E8F3E0 50%, #DDECD4 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
    }

    .skeleton-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
    }

    .skeleton-label {
      width: 100px;
      height: 14px;
    }

    .skeleton-value {
      width: 60px;
      height: 28px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  data = signal<DashboardData | null>(null);
  skeletonCards = Array.from({ length: 7 });

  cards = signal<{ icon: string; label: string; value: string; color: string }[]>([]);

  constructor(private adminService: AdminService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.adminService.getDashboard().subscribe({
      next: (res: DashboardData) => {
        this.data.set(res);
        this.cards.set(this.buildCards(res));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snack.open('Error al cargar dashboard', 'Reintentar', { duration: 5000 }).onAction().subscribe(() => this.ngOnInit());
      },
    });
  }

  private buildCards(d: DashboardData) {
    const currency = new CurrencyPipe('es-AR');
    return [
      { icon: 'pending_actions', label: 'Pedidos pendientes', value: String(d.pendingOrders ?? 0), color: '#f59e0b' },
      { icon: 'soup_kitchen', label: 'En preparación', value: String(d.preparingOrders ?? 0), color: '#3b82f6' },
      { icon: 'delivery_dining', label: 'En camino', value: String(d.onTheWayOrders ?? 0), color: '#8b5cf6' },
      { icon: 'check_circle', label: 'Entregados hoy', value: String(d.deliveredToday ?? 0), color: '#22c55e' },
      { icon: 'cancel', label: 'Cancelados hoy', value: String(d.cancelledToday ?? 0), color: '#ef4444' },
      { icon: 'payments', label: 'Ingresos hoy', value: currency.transform(d.todayRevenue ?? 0, 'ARS', 'symbol', '1.0-0') ?? '$0', color: '#10b981' },
      { icon: 'local_fire_department', label: 'Capacidad cocina', value: `${d.activeOrdersCount ?? 0}/${d.maxConcurrentOrders || '∞'}`, color: '#f97316' },
    ];
  }
}
