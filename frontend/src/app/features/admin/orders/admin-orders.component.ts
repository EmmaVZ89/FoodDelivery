import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DatePipe, CurrencyPipe, MatButtonModule,
    MatIconModule, MatSelectModule, MatFormFieldModule, MatSnackBarModule,
  ],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h2>Pedidos</h2>
        <p class="page-subtitle">Gestioná y actualizá el estado de los pedidos</p>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Estado</mat-label>
          <mat-select [(value)]="filterStatus" (selectionChange)="load()">
            <mat-option value="">Todos</mat-option>
            <mat-option value="Pending">Pendiente</mat-option>
            <mat-option value="Preparing">Preparando</mat-option>
            <mat-option value="OnTheWay">En camino</mat-option>
            <mat-option value="Delivered">Entregado</mat-option>
            <mat-option value="Cancelled">Cancelado</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (orders().length === 0) {
        <div class="empty">
          <mat-icon>receipt_long</mat-icon>
          <p>No hay pedidos</p>
        </div>
      }

      <div class="orders-list">
        @for (order of orders(); track order.id) {
          <div class="order-card">
            <div class="card-header">
              <div class="card-id">
                <strong>#{{ order.orderCode || order.id }}</strong>
                <span class="card-date">{{ order.createdAt | date:'dd/MM/yy HH:mm' }}</span>
              </div>
              <span class="badge" [ngClass]="'badge-' + (order.status || '').toLowerCase()">
                {{ statusLabel(order.status) }}
              </span>
            </div>

            <div class="card-body">
              <div class="card-row">
                <mat-icon class="row-icon">person</mat-icon>
                <span>{{ order.deliveryName || order.userEmail || 'Sin nombre' }}</span>
              </div>
              <div class="card-row">
                <mat-icon class="row-icon">phone</mat-icon>
                <span>{{ order.deliveryPhone || '-' }}</span>
              </div>
              <div class="card-row total-row">
                <span>Total</span>
                <strong>{{ order.total | currency:'ARS':'symbol-narrow':'1.0-0' }}</strong>
              </div>
            </div>

            <div class="card-actions">
              <button mat-icon-button (click)="toggleExpand(order)">
                <mat-icon>{{ expandedId() === order.id ? 'expand_less' : 'expand_more' }}</mat-icon>
              </button>
              @switch (order.status) {
                @case ('Pending') {
                  <button mat-flat-button color="primary" class="action-btn" (click)="changeStatus(order, 'Preparing')">
                    <mat-icon>restaurant</mat-icon> Preparar
                  </button>
                  <button mat-stroked-button color="warn" class="action-btn" (click)="changeStatus(order, 'Cancelled')">Cancelar</button>
                }
                @case ('Preparing') {
                  <button mat-flat-button color="primary" class="action-btn" (click)="changeStatus(order, 'OnTheWay')">
                    <mat-icon>delivery_dining</mat-icon> Enviar
                  </button>
                  <button mat-stroked-button color="warn" class="action-btn" (click)="changeStatus(order, 'Cancelled')">Cancelar</button>
                }
                @case ('OnTheWay') {
                  <button mat-flat-button color="primary" class="action-btn" (click)="changeStatus(order, 'Delivered')">
                    <mat-icon>check_circle</mat-icon> Entregado
                  </button>
                  <button mat-stroked-button color="warn" class="action-btn" (click)="changeStatus(order, 'Cancelled')">Cancelar</button>
                }
              }
            </div>

            @if (expandedId() === order.id && orderDetail()) {
              <div class="card-detail">
                <h4>Items</h4>
                @for (item of orderDetail()!.items; track item.id) {
                  <div class="detail-item">
                    <span>{{ item.quantity }}x {{ item.productName }}
                      @if (item.variantName) { ({{ item.variantName }}) }
                    </span>
                    <span>{{ item.subtotal | currency:'ARS':'symbol-narrow':'1.0-0' }}</span>
                  </div>
                  @for (c of item.customizations; track c.optionName) {
                    <div class="detail-cust">
                      @if (c.optionQuantity > 1) { {{ c.optionQuantity }}x } {{ c.optionName }}
                    </div>
                  }
                }
                <div class="detail-address">
                  <mat-icon>place</mat-icon>
                  {{ orderDetail()!.deliveryAddress }}
                  @if (orderDetail()!.deliveryApartment) { - Depto {{ orderDetail()!.deliveryApartment }} }
                </div>

                @if (orderDetail()!.statusHistory?.length > 0) {
                  <div class="status-history">
                    <h4>Historial de estados</h4>
                    @for (h of orderDetail()!.statusHistory; track h.createdAt) {
                      <div class="history-item">
                        <span class="badge badge-sm" [ngClass]="'badge-' + (h.status || '').toLowerCase()">
                          {{ statusLabel(h.status) }}
                        </span>
                        <span class="history-date">{{ h.createdAt | date:'dd/MM HH:mm' }}</span>
                        @if (h.notes) {
                          <span class="history-notes">{{ h.notes }}</span>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-page { max-width: 800px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .page-header h2 { margin: 0; font-size: 22px; font-weight: 600; }
    .page-subtitle { margin: -8px 0 16px; font-size: 14px; color: #94a3b8; }
    .filter-field { width: 180px; }

    .empty { text-align: center; padding: 48px; color: #bbb;
      mat-icon { font-size: 48px; width: 48px; height: 48px; }
    }

    .orders-list { display: flex; flex-direction: column; gap: 12px; }

    .order-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }

    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #f0f0f0; }
    .card-id { display: flex; flex-direction: column; gap: 2px; }
    .card-id strong { font-size: 15px; }
    .card-date { font-size: 12px; color: #999; }

    .badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; white-space: nowrap; }
    .badge-sm { padding: 2px 8px; font-size: 11px; }
    .badge-pending { background: #F2F8EC; color: #4A7C2E; }
    .badge-preparing { background: #e3f2fd; color: #1565c0; }
    .badge-ontheway { background: #f3e5f5; color: #7b1fa2; }
    .badge-delivered { background: #e8f5e9; color: #2e7d32; }
    .badge-cancelled { background: #ffebee; color: #3A6324; }

    .card-body { padding: 12px 16px; }
    .card-row { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #555; margin-bottom: 4px; }
    .row-icon { font-size: 18px; width: 18px; height: 18px; color: #999; }
    .total-row { justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #f0f0f0; font-size: 15px; }

    .card-actions { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-top: 1px solid #f0f0f0; flex-wrap: wrap; }
    .action-btn { font-size: 13px; height: 34px; }

    .card-detail { padding: 16px; background: #fafafa; border-top: 1px solid #f0f0f0; }
    .card-detail h4 { margin: 0 0 10px; font-size: 14px; font-weight: 600; }
    .detail-item { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
    .detail-cust { font-size: 12px; color: #888; padding-left: 16px; }
    .detail-address { display: flex; align-items: flex-start; gap: 6px; margin-top: 12px; font-size: 13px; color: #666;
      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px; }
    }

    .status-history { margin-top: 16px; padding-top: 12px; border-top: 1px solid #E2EDDA; }
    .status-history h4 { margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #5F7456; }
    .history-item { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
    .history-date { font-size: 12px; color: #94A88D; }
    .history-notes { font-size: 12px; color: #5F7456; font-style: italic; }
  `],
})
export class AdminOrdersComponent implements OnInit {
  orders = signal<any[]>([]);
  expandedId = signal<number | null>(null);
  orderDetail = signal<any>(null);
  filterStatus = '';

  constructor(private adminService: AdminService, private snack: MatSnackBar) {}

  ngOnInit() { this.load(); }

  load() {
    const params: any = {};
    if (this.filterStatus) params.status = this.filterStatus;
    this.adminService.getOrders(params).subscribe({
      next: res => this.orders.set(res.items ?? res),
      error: () => this.snack.open('Error al cargar pedidos', 'OK', { duration: 3000 })
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      Pending: 'Pendiente', Preparing: 'Preparando', OnTheWay: 'En camino',
      Delivered: 'Entregado', Cancelled: 'Cancelado'
    };
    return map[status] || status;
  }

  toggleExpand(order: any) {
    if (this.expandedId() === order.id) { this.expandedId.set(null); this.orderDetail.set(null); return; }
    this.expandedId.set(order.id);
    this.adminService.getOrder(order.id).subscribe(detail => this.orderDetail.set(detail));
  }

  changeStatus(order: any, status: string) {
    this.adminService.updateOrderStatus(order.id, status).subscribe({
      next: () => { this.snack.open('Estado actualizado', 'OK', { duration: 2000 }); this.load(); },
      error: (err) => this.snack.open(err.error?.error || 'Error', 'OK', { duration: 3000 })
    });
  }
}
