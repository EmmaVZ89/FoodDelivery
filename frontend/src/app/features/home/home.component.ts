import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CatalogService } from '../../core/services/catalog.service';
import { ConfigService } from '../../core/services/config.service';
import { Category, Product } from '../../core/models/catalog.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, CurrencyPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  categories = signal<Category[]>([]);
  promotions = signal<Product[]>([]);
  loadingCategories = signal(true);
  loadingPromos = signal(true);

  currentPromoIndex = 0;
  private carouselInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private catalogService: CatalogService,
    public configService: ConfigService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.catalogService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.loadingCategories.set(false);
      },
      error: () => this.loadingCategories.set(false),
    });

    this.catalogService.getPromotions().subscribe({
      next: (promos) => {
        this.promotions.set(promos);
        this.loadingPromos.set(false);
        if (promos.length > 1) {
          this.startCarousel();
        }
      },
      error: () => this.loadingPromos.set(false),
    });
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  goToCategory(cat: Category): void {
    this.router.navigate(['/catalog', cat.id]);
  }

  goToProduct(product: Product): void {
    this.router.navigate(['/catalog', product.categoryId], {
      queryParams: { productId: product.id },
    });
  }

  prevPromo(): void {
    const len = this.promotions().length;
    this.currentPromoIndex = (this.currentPromoIndex - 1 + len) % len;
    this.restartCarousel();
  }

  nextPromo(): void {
    const len = this.promotions().length;
    this.currentPromoIndex = (this.currentPromoIndex + 1) % len;
    this.restartCarousel();
  }

  getDiscountedPrice(product: Product): number {
    return product.price * (1 - product.discountPercent / 100);
  }

  private startCarousel(): void {
    this.carouselInterval = setInterval(() => {
      this.currentPromoIndex = (this.currentPromoIndex + 1) % this.promotions().length;
    }, 4000);
  }

  private stopCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  private restartCarousel(): void {
    this.stopCarousel();
    this.startCarousel();
  }
}
