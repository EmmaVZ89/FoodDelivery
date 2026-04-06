import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CartService } from '../../core/services/cart.service';
import { ConfigService } from '../../core/services/config.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatSnackBarModule, CurrencyPipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  constructor(
    public cartService: CartService,
    public configService: ConfigService,
    public authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  get shippingCost(): number {
    return this.configService.config()?.shippingCost || 0;
  }

  get total(): number {
    return this.cartService.subtotal() + this.shippingCost;
  }

  increment(index: number): void {
    const item = this.cartService.items()[index];
    this.cartService.updateQuantity(index, item.quantity + 1);
  }

  decrement(index: number): void {
    const item = this.cartService.items()[index];
    if (item.quantity > 1) {
      this.cartService.updateQuantity(index, item.quantity - 1);
    }
  }

  remove(index: number): void {
    this.cartService.removeItem(index);
  }

  getItemTotal(index: number): number {
    const item = this.cartService.items()[index];
    const custCost = item.customizations.reduce(
      (sum, c) => sum + c.priceModifier * c.optionQuantity, 0
    );
    return (item.unitPrice + custCost) * item.quantity;
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  goToCheckout(): void {
    const config = this.configService.config();
    if (config && !config.isOpen) {
      this.snackBar.open('El local está cerrado en este momento', 'Cerrar', { duration: 4000 });
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    this.router.navigate(['/checkout']);
  }
}
