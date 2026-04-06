import { Component, Inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { ConfigService } from '../../core/services/config.service';
import {
  Product,
  ProductVariant,
  CustomizationGroup,
  CustomizationOption,
} from '../../core/models/catalog.model';
import { CartItem, CartCustomization } from '../../core/models/order.model';

interface OptionSelection {
  optionId: number;
  quantity: number;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatCheckboxModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './product-detail.dialog.html',
  styleUrl: './product-detail.dialog.scss',
})
export class ProductDetailDialog implements OnInit {
  product = signal<Product | null>(null);
  loading = signal(true);

  quantity = 1;
  selectedVariantId: number | null = null;
  observations = '';

  // Selections per group: groupId -> optionId -> quantity
  selections: Map<number, Map<number, number>> = new Map();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { productId: number },
    public dialogRef: MatDialogRef<ProductDetailDialog>,
    private catalogService: CatalogService,
    private cartService: CartService,
    private configService: ConfigService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.catalogService.getProduct(this.data.productId).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
        if (p.hasVariants && p.variants.length > 0) {
          this.selectedVariantId = p.variants[0].id;
        }
        // Initialize selections map
        for (const group of p.customizationGroups) {
          this.selections.set(group.id, new Map());
        }
      },
      error: () => this.loading.set(false),
    });
  }

  get selectedVariant(): ProductVariant | null {
    const p = this.product();
    if (!p || !this.selectedVariantId) return null;
    return p.variants.find((v) => v.id === this.selectedVariantId) || null;
  }

  get totalPrice(): number {
    const p = this.product();
    if (!p) return 0;

    let basePrice: number;
    if (p.hasVariants && this.selectedVariant) {
      basePrice = this.selectedVariant.price;
    } else if (p.isPromotion && p.discountPercent > 0) {
      basePrice = p.price * (1 - p.discountPercent / 100);
    } else {
      basePrice = p.price;
    }

    // Add customization costs
    let customizationCost = 0;
    for (const group of p.customizationGroups) {
      const groupSelections = this.selections.get(group.id);
      if (!groupSelections) continue;
      for (const [optionId, qty] of groupSelections) {
        const option = group.options.find((o) => o.id === optionId);
        if (option) {
          customizationCost += option.priceModifier * qty;
        }
      }
    }

    return (basePrice + customizationCost) * this.quantity;
  }

  getMaxSelections(group: CustomizationGroup): number {
    if (this.product()?.hasVariants && this.selectedVariant) {
      return this.selectedVariant.selectionCount;
    }
    return group.maxSelections || 999;
  }

  getTotalSelected(group: CustomizationGroup): number {
    const gs = this.selections.get(group.id);
    if (!gs) return 0;
    let total = 0;
    for (const qty of gs.values()) total += qty;
    return total;
  }

  // Single selection
  selectSingle(group: CustomizationGroup, option: CustomizationOption): void {
    const gs = new Map<number, number>();
    gs.set(option.id, 1);
    this.selections.set(group.id, gs);
  }

  getSingleSelected(group: CustomizationGroup): number | null {
    const gs = this.selections.get(group.id);
    if (!gs) return null;
    for (const [id] of gs) return id;
    return null;
  }

  // Multiple selection
  toggleMultiple(group: CustomizationGroup, option: CustomizationOption): void {
    const gs = this.selections.get(group.id) || new Map();
    if (gs.has(option.id)) {
      gs.delete(option.id);
    } else {
      if (this.getTotalSelected(group) >= this.getMaxSelections(group)) return;
      gs.set(option.id, 1);
    }
    this.selections.set(group.id, gs);
  }

  isMultipleSelected(group: CustomizationGroup, option: CustomizationOption): boolean {
    return this.selections.get(group.id)?.has(option.id) || false;
  }

  isMultipleDisabled(group: CustomizationGroup, option: CustomizationOption): boolean {
    if (this.isMultipleSelected(group, option)) return false;
    return this.getTotalSelected(group) >= this.getMaxSelections(group);
  }

  // Quantity selection
  getOptionQuantity(group: CustomizationGroup, option: CustomizationOption): number {
    return this.selections.get(group.id)?.get(option.id) || 0;
  }

  incrementOption(group: CustomizationGroup, option: CustomizationOption): void {
    if (this.getTotalSelected(group) >= this.getMaxSelections(group)) return;
    const gs = this.selections.get(group.id) || new Map();
    gs.set(option.id, (gs.get(option.id) || 0) + 1);
    this.selections.set(group.id, gs);
  }

  decrementOption(group: CustomizationGroup, option: CustomizationOption): void {
    const gs = this.selections.get(group.id);
    if (!gs) return;
    const current = gs.get(option.id) || 0;
    if (current <= 1) {
      gs.delete(option.id);
    } else {
      gs.set(option.id, current - 1);
    }
  }

  isQuantityMaxReached(group: CustomizationGroup): boolean {
    return this.getTotalSelected(group) >= this.getMaxSelections(group);
  }

  // Quantity controls
  incrementQuantity(): void {
    this.quantity++;
  }

  decrementQuantity(): void {
    if (this.quantity > 1) this.quantity--;
  }

  // Validation
  get canAddToCart(): boolean {
    const p = this.product();
    if (!p || !p.isAvailable) return false;
    if (p.hasVariants && !this.selectedVariantId) return false;

    for (const group of p.customizationGroups) {
      if (group.isRequired) {
        const total = this.getTotalSelected(group);
        const max = this.getMaxSelections(group);
        if (group.selectionType === 'Single' && total !== 1) return false;
        if (group.selectionType === 'Multiple' && total < group.minSelections) return false;
        if (group.selectionType === 'Quantity' && total < group.minSelections) return false;
        // For variants, must fill exactly selectionCount
        if (p.hasVariants && this.selectedVariant && total !== this.selectedVariant.selectionCount) return false;
      }
    }
    return true;
  }

  addToCart(): void {
    const config = this.configService.config();
    if (config && !config.isOpen) {
      this.snackBar.open('El local está cerrado en este momento', 'Cerrar', { duration: 4000 });
      return;
    }

    const p = this.product()!;
    const variant = this.selectedVariant;

    const customizations: CartCustomization[] = [];
    for (const group of p.customizationGroups) {
      const gs = this.selections.get(group.id);
      if (!gs) continue;
      for (const [optionId, qty] of gs) {
        const option = group.options.find((o) => o.id === optionId);
        if (option) {
          customizations.push({
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            optionQuantity: qty,
            priceModifier: option.priceModifier,
          });
        }
      }
    }

    let unitPrice: number;
    if (p.hasVariants && variant) {
      unitPrice = variant.price;
    } else if (p.isPromotion && p.discountPercent > 0) {
      unitPrice = p.price * (1 - p.discountPercent / 100);
    } else {
      unitPrice = p.price;
    }

    const cartItem: CartItem = {
      productId: p.id,
      variantId: variant?.id || null,
      productName: p.name,
      variantName: variant?.name || null,
      quantity: this.quantity,
      unitPrice,
      customizations,
      observations: this.observations.trim() || null,
    };

    this.cartService.addItem(cartItem);
    this.snackBar.open('Agregado al carrito', 'Ver carrito', { duration: 3000 })
      .onAction()
      .subscribe(() => {
        this.dialogRef.close();
        // Navigate to cart will happen via the snackbar action
      });
    this.dialogRef.close();
  }
}
