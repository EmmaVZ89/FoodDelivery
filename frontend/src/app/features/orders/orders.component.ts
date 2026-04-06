import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService, OrderListItem } from '../../core/services/order.service';
import { ConfigService } from '../../core/services/config.service';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  orders = signal<OrderListItem[]>([]);
  loading = signal(true);
  expandedOrder = signal<Order | null>(null);
  loadingDetail = signal(false);
  page = 1;
  totalPages = 1;

  constructor(
    private orderService: OrderService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.getMyOrders(this.page).subscribe({
      next: (res) => {
        this.orders.set([...this.orders(), ...res.items]);
        this.totalPages = res.totalPages;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadMore(): void {
    if (this.page >= this.totalPages) return;
    this.page++;
    this.loadOrders();
  }

  toggleDetail(order: OrderListItem): void {
    if (this.expandedOrder()?.id === order.id) {
      this.expandedOrder.set(null);
      return;
    }
    this.loadingDetail.set(true);
    this.orderService.getOrder(order.id).subscribe({
      next: (detail) => {
        this.expandedOrder.set(detail);
        this.loadingDetail.set(false);
      },
      error: () => this.loadingDetail.set(false),
    });
  }

  sendWhatsApp(order: Order): void {
    if (!order.whatsappMessage) return;
    const config = this.configService.config();
    if (!config?.whatsapp) return;
    const phone = config.whatsapp.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(order.whatsappMessage);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      Pending: 'hourglass_empty',
      Preparing: 'restaurant',
      OnTheWay: 'delivery_dining',
      Delivered: 'check_circle',
      Cancelled: 'cancel',
    };
    return icons[status] || 'help';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      Pending: 'Pendiente',
      Preparing: 'En preparación',
      OnTheWay: 'En camino',
      Delivered: 'Entregado',
      Cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      Pending: 'status-pending',
      Preparing: 'status-preparing',
      OnTheWay: 'status-ontheway',
      Delivered: 'status-delivered',
      Cancelled: 'status-cancelled',
    };
    return classes[status] || '';
  }
}
