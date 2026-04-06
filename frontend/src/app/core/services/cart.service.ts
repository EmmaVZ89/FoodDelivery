import { Injectable, signal, computed } from '@angular/core';
import { CartItem } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly CART_KEY = 'cart';

  readonly items = signal<CartItem[]>(this.loadFromStorage());
  readonly itemCount = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );
  readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => {
      const customizationsCost = item.customizations.reduce(
        (cs, c) => cs + c.priceModifier * c.optionQuantity, 0
      );
      return sum + (item.unitPrice + customizationsCost) * item.quantity;
    }, 0)
  );

  addItem(item: CartItem): void {
    const current = this.items();
    const existingIndex = this.findMatchingItemIndex(current, item);

    if (existingIndex >= 0) {
      const updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + item.quantity,
      };
      this.items.set(updated);
    } else {
      this.items.set([...current, item]);
    }
    this.saveToStorage();
  }

  updateQuantity(index: number, quantity: number): void {
    if (quantity < 1) return;
    const updated = [...this.items()];
    updated[index] = { ...updated[index], quantity };
    this.items.set(updated);
    this.saveToStorage();
  }

  removeItem(index: number): void {
    const updated = this.items().filter((_, i) => i !== index);
    this.items.set(updated);
    this.saveToStorage();
  }

  clearCart(): void {
    this.items.set([]);
    localStorage.removeItem(this.CART_KEY);
  }

  private findMatchingItemIndex(items: CartItem[], newItem: CartItem): number {
    return items.findIndex(
      (existing) =>
        existing.productId === newItem.productId &&
        existing.variantId === newItem.variantId &&
        existing.observations === newItem.observations &&
        JSON.stringify(existing.customizations) === JSON.stringify(newItem.customizations)
    );
  }

  private loadFromStorage(): CartItem[] {
    try {
      const stored = localStorage.getItem(this.CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(this.CART_KEY, JSON.stringify(this.items()));
  }
}
