import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CatalogService } from '../../core/services/catalog.service';
import { Category, Product, PaginatedResponse } from '../../core/models/catalog.model';
import { ProductDetailDialog } from './product-detail.dialog';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule, CurrencyPipe],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  category = signal<Category | null>(null);
  products = signal<Product[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  page = 1;
  totalPages = 1;
  private categoryId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.categoryId = Number(this.route.snapshot.paramMap.get('categoryId'));
    this.loadCategory();
    this.loadProducts();

    // Check if we should auto-open a product
    const productId = this.route.snapshot.queryParamMap.get('productId');
    if (productId) {
      this.openProductById(Number(productId));
    }
  }

  loadProducts(): void {
    this.catalogService.getProducts(this.categoryId, this.page).subscribe({
      next: (res: PaginatedResponse<Product>) => {
        if (this.page === 1) {
          this.products.set(res.items);
        } else {
          this.products.set([...this.products(), ...res.items]);
        }
        this.totalPages = res.totalPages;
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }

  loadMore(): void {
    if (this.page >= this.totalPages || this.loadingMore()) return;
    this.page++;
    this.loadingMore.set(true);
    this.loadProducts();
  }

  openProduct(product: Product): void {
    if (!product.isAvailable) return;
    this.dialog.open(ProductDetailDialog, {
      data: { productId: product.id },
      maxWidth: '500px',
      width: '100%',
      panelClass: 'product-detail-dialog',
    });
  }

  getDiscountedPrice(product: Product): number {
    return product.price * (1 - product.discountPercent / 100);
  }

  private loadCategory(): void {
    this.catalogService.getCategory(this.categoryId).subscribe({
      next: (cat) => this.category.set(cat),
    });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  private openProductById(id: number): void {
    this.dialog.open(ProductDetailDialog, {
      data: { productId: id },
      maxWidth: '500px',
      width: '100%',
      panelClass: 'product-detail-dialog',
    });
  }
}
