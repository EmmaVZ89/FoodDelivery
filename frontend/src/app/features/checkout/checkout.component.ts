import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '../../core/services/cart.service';
import { ConfigService } from '../../core/services/config.service';
import { OrderService, DiscountCodeResponse } from '../../core/services/order.service';
import { ProfileService } from '../../core/services/profile.service';
import { CreateOrderRequest, CreateOrderItemRequest, Order, PaymentMethod } from '../../core/models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, CurrencyPipe,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatRadioModule, MatCheckboxModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  // Form
  name = '';
  phone = '';
  address = '';
  betweenStreets = '';
  isDepartment = false;
  apartment = '';
  notes = '';
  paymentMethod: PaymentMethod = 'Transfer';
  cashAmount: number | null = null;
  couponCode = '';

  // State
  submitting = signal(false);
  confirmedOrder = signal<Order | null>(null);
  discount = signal<DiscountCodeResponse | null>(null);
  validatingCoupon = signal(false);
  couponError = signal('');

  constructor(
    public cartService: CartService,
    public configService: ConfigService,
    private orderService: OrderService,
    private profileService: ProfileService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Load saved delivery info
    this.loadSavedInfo();
    // Pre-fill from profile
    this.profileService.getProfile().subscribe({
      next: (p) => {
        if (!this.name && p.name) this.name = p.name;
        if (!this.phone && p.phone) this.phone = p.phone;
        if (!this.address && p.address) this.address = p.address;
        if (!this.betweenStreets && p.betweenStreets) this.betweenStreets = p.betweenStreets;
        if (!this.apartment && p.apartmentInfo) {
          this.apartment = p.apartmentInfo;
          this.isDepartment = true;
        }
      },
    });
  }

  get shippingCost(): number {
    if (this.discount()?.freeShipping) return 0;
    return this.configService.config()?.shippingCost || 0;
  }

  get discountAmount(): number {
    const d = this.discount();
    if (!d) return 0;
    return this.cartService.subtotal() * (d.discountPercent / 100);
  }

  get total(): number {
    return this.cartService.subtotal() - this.discountAmount + this.shippingCost;
  }

  get canSubmit(): boolean {
    if (!this.name || !this.phone || !this.address) return false;
    if (this.isDepartment && !this.apartment) return false;
    if (this.paymentMethod === 'Cash' && this.cashAmount != null && this.cashAmount < this.total) return false;
    if (this.cartService.items().length === 0) return false;
    return true;
  }

  validateCoupon(): void {
    if (!this.couponCode.trim()) return;
    this.validatingCoupon.set(true);
    this.couponError.set('');

    this.orderService.validateCode(this.couponCode.trim()).subscribe({
      next: (res) => {
        this.discount.set(res);
        this.validatingCoupon.set(false);
        this.snackBar.open(`Cupón aplicado: ${res.discountPercent}% OFF`, 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.validatingCoupon.set(false);
        this.couponError.set(err.error?.error || 'Código inválido');
        this.discount.set(null);
      },
    });
  }

  removeCoupon(): void {
    this.discount.set(null);
    this.couponCode = '';
    this.couponError.set('');
  }

  submit(): void {
    if (!this.canSubmit || this.submitting()) return;
    this.saveInfo();
    this.submitting.set(true);

    const orderItems: CreateOrderItemRequest[] = this.cartService.items().map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      observations: item.observations,
      customizations: item.customizations.map((c) => ({
        groupId: c.groupId,
        optionId: c.optionId,
        optionQuantity: c.optionQuantity,
      })),
    }));

    const request: CreateOrderRequest = {
      items: orderItems,
      deliveryName: this.name,
      deliveryPhone: this.phone,
      deliveryAddress: this.address,
      deliveryBetweenStreets: this.betweenStreets || null,
      deliveryApartment: this.isDepartment ? this.apartment : null,
      deliveryNotes: this.notes || null,
      paymentMethod: this.paymentMethod,
      cashAmount: this.paymentMethod === 'Cash' ? this.cashAmount : null,
      discountCode: this.discount()?.code || null,
    };

    this.orderService.createOrder(request).subscribe({
      next: (order) => {
        this.confirmedOrder.set(order);
        this.cartService.clearCart();
        this.submitting.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
        this.snackBar.open(err.error?.error || 'Error al crear el pedido', 'Cerrar', { duration: 5000 });
      },
    });
  }

  sendWhatsApp(): void {
    const order = this.confirmedOrder();
    const config = this.configService.config();
    if (!order?.whatsappMessage || !config?.whatsapp) return;

    const phone = config.whatsapp.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(order.whatsappMessage);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  private loadSavedInfo(): void {
    try {
      const saved = localStorage.getItem('checkout_info');
      if (saved) {
        const data = JSON.parse(saved);
        this.name = data.name || '';
        this.phone = data.phone || '';
        this.address = data.address || '';
        this.betweenStreets = data.betweenStreets || '';
        this.isDepartment = data.isDepartment || false;
        this.apartment = data.apartment || '';
        this.notes = data.notes || '';
        this.paymentMethod = data.paymentMethod || 'Transfer';
      }
    } catch { /* ignore */ }
  }

  private saveInfo(): void {
    localStorage.setItem('checkout_info', JSON.stringify({
      name: this.name, phone: this.phone, address: this.address,
      betweenStreets: this.betweenStreets, isDepartment: this.isDepartment,
      apartment: this.apartment, notes: this.notes, paymentMethod: this.paymentMethod,
    }));
  }
}
