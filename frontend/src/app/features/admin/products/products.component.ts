import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatSnackBarModule, MatProgressBarModule,
    MatDialogModule
  ],
  template: `
    <div class="container">
      <div class="page-header">
        <h2>Productos</h2>
        <p class="page-subtitle">Gestioná los productos, variantes y personalizaciones</p>
        <button mat-raised-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon> {{ showForm() ? 'Cerrar' : 'Nuevo Producto' }}
        </button>
      </div>

      <!-- Filter -->
      <div class="filter-row">
        <mat-form-field appearance="outline">
          <mat-label>Filtrar por categoría</mat-label>
          <mat-select [(ngModel)]="filterCategoryId" (selectionChange)="load()">
            <mat-option [value]="null">Todas</mat-option>
            <mat-option *ngFor="let c of categories()" [value]="c.id">{{ c.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Form -->
      <div class="form-card" *ngIf="showForm()">
        <h3>{{ editingId() ? 'Editar' : 'Nuevo' }} Producto</h3>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput [(ngModel)]="form.name" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Precio</mat-label>
            <input matInput type="number" [(ngModel)]="form.price" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Categoría</mat-label>
            <mat-select [(ngModel)]="form.categoryId">
              <mat-option *ngFor="let c of categories()" [value]="c.id">{{ c.name }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Descripción</mat-label>
            <input matInput [(ngModel)]="form.description" />
          </mat-form-field>
        </div>

        <!-- Image Upload -->
        <div class="image-section">
          <label class="img-label">Imagen</label>
          @if (form.imageUrl) {
            <div class="img-preview-row">
              <img [src]="form.imageUrl" alt="Preview" class="img-thumb" />
              <button mat-stroked-button (click)="prodFileInput.click()"><mat-icon>swap_horiz</mat-icon> Cambiar</button>
              <button mat-icon-button color="warn" (click)="removeImage()"><mat-icon>delete</mat-icon></button>
            </div>
          } @else {
            <button mat-stroked-button (click)="prodFileInput.click()" [disabled]="uploading()" class="upload-btn">
              <mat-icon>cloud_upload</mat-icon> Subir imagen
            </button>
          }
          <input #prodFileInput type="file" accept="image/jpeg,image/png,image/webp" hidden (change)="onFileSelected($event)" />
        </div>
        <div class="checkbox-row">
          <mat-checkbox [(ngModel)]="form.isActive">Activo</mat-checkbox>
          <mat-checkbox [(ngModel)]="form.isAvailable">Disponible</mat-checkbox>
          <mat-checkbox [(ngModel)]="form.isPromotion">Promoción</mat-checkbox>
          <mat-form-field appearance="outline" *ngIf="form.isPromotion" style="width:150px">
            <mat-label>Descuento %</mat-label>
            <input matInput type="number" [(ngModel)]="form.discountPercent" />
          </mat-form-field>
          <mat-checkbox [(ngModel)]="form.hasVariants">Tiene variantes</mat-checkbox>
        </div>

        <!-- Variants -->
        <div *ngIf="form.hasVariants" class="sub-section">
          <h4>Variantes
            <button mat-icon-button color="primary" (click)="addVariant()"><mat-icon>add_circle</mat-icon></button>
          </h4>
          <div *ngFor="let v of form.variants; let i = index" class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Nombre</mat-label>
              <input matInput [(ngModel)]="v.name" />
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:120px">
              <mat-label>Precio</mat-label>
              <input matInput type="number" [(ngModel)]="v.price" />
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:120px">
              <mat-label>Selección</mat-label>
              <input matInput type="number" [(ngModel)]="v.selectionCount" />
            </mat-form-field>
            <button mat-icon-button color="warn" (click)="form.variants.splice(i, 1)"><mat-icon>remove_circle</mat-icon></button>
          </div>
        </div>

        <!-- Customization Groups -->
        <div class="sub-section">
          <h4>Grupos de personalización
            <button mat-icon-button color="primary" (click)="addGroup()"><mat-icon>add_circle</mat-icon></button>
          </h4>
          <div *ngFor="let g of form.customizationGroups; let gi = index" class="group-card">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Nombre grupo</mat-label>
                <input matInput [(ngModel)]="g.name" />
              </mat-form-field>
              <mat-form-field appearance="outline" style="width:160px">
                <mat-label>Tipo selección</mat-label>
                <mat-select [(ngModel)]="g.selectionType">
                  <mat-option value="Single">Single</mat-option>
                  <mat-option value="Multiple">Multiple</mat-option>
                  <mat-option value="Quantity">Quantity</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" style="width:100px">
                <mat-label>Mín</mat-label>
                <input matInput type="number" [(ngModel)]="g.minSelections" />
              </mat-form-field>
              <mat-form-field appearance="outline" style="width:100px">
                <mat-label>Máx</mat-label>
                <input matInput type="number" [(ngModel)]="g.maxSelections" />
              </mat-form-field>
              <mat-checkbox [(ngModel)]="g.isRequired">Requerido</mat-checkbox>
              <button mat-icon-button color="warn" (click)="form.customizationGroups.splice(gi, 1)"><mat-icon>delete</mat-icon></button>
            </div>
            <!-- Options within group -->
            <div class="options-section">
              <span class="option-label">Opciones:</span>
              <button mat-icon-button color="primary" (click)="addOption(g)"><mat-icon>add</mat-icon></button>
              <div *ngFor="let o of g.options; let oi = index" class="form-row option-row">
                <mat-form-field appearance="outline">
                  <mat-label>Nombre opción</mat-label>
                  <input matInput [(ngModel)]="o.name" />
                </mat-form-field>
                <mat-form-field appearance="outline" style="width:130px">
                  <mat-label>Precio extra</mat-label>
                  <input matInput type="number" [(ngModel)]="o.priceModifier" />
                </mat-form-field>
                <button mat-icon-button color="warn" (click)="g.options.splice(oi, 1)"><mat-icon>remove_circle</mat-icon></button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button mat-raised-button color="primary" (click)="save()">
            <mat-icon>save</mat-icon> {{ editingId() ? 'Actualizar' : 'Crear' }}
          </button>
          <button mat-button (click)="cancelEdit()">Cancelar</button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table mat-table [dataSource]="products()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Categoría</th>
            <td mat-cell *matCellDef="let row">{{ row.categoryName || row.category?.name }}</td>
          </ng-container>
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Precio</th>
            <td mat-cell *matCellDef="let row">{{ row.price | currency:'$' }}</td>
          </ng-container>
          <ng-container matColumnDef="isPromotion">
            <th mat-header-cell *matHeaderCellDef>Promo</th>
            <td mat-cell *matCellDef="let row">
              <mat-icon *ngIf="row.isPromotion" color="accent">local_offer</mat-icon>
            </td>
          </ng-container>
          <ng-container matColumnDef="isAvailable">
            <th mat-header-cell *matHeaderCellDef>Disponible</th>
            <td mat-cell *matCellDef="let row">
              <mat-icon [color]="row.isAvailable ? 'primary' : 'warn'">{{ row.isAvailable ? 'check_circle' : 'cancel' }}</mat-icon>
            </td>
          </ng-container>
          <ng-container matColumnDef="isActive">
            <th mat-header-cell *matHeaderCellDef>Activo</th>
            <td mat-cell *matCellDef="let row">
              <mat-icon [color]="row.isActive ? 'primary' : 'warn'">{{ row.isActive ? 'check_circle' : 'cancel' }}</mat-icon>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button color="primary" (click)="edit(row)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="confirmDelete(row)"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .page-header h2 { margin: 0; }
    .page-subtitle { margin: -8px 0 16px; font-size: 14px; color: #94a3b8; }
    .filter-row { display: flex; gap: 16px; align-items: center; margin-bottom: 16px; }
    .form-card { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,.12); }
    .form-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 8px; }
    .form-row mat-form-field:not([style]) { flex: 1; min-width: 180px; }
    .form-row .full { flex: 2; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
    .full-width { width: 100%; }
    .table-wrapper { overflow-x: auto; }
    .sub-section { margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px; }
    .sub-section h4 { margin: 0 0 8px; display: flex; align-items: center; gap: 8px; }
    .group-card { background: #fff; padding: 12px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #e0e0e0; }
    .options-section { margin-left: 24px; margin-top: 8px; }
    .option-label { font-weight: 500; font-size: 13px; }
    .option-row { margin-top: 4px; }
    .image-section { margin: 8px 0 16px; width: 100%; }
    .img-label { font-size: 13px; color: #666; font-weight: 500; display: block; margin-bottom: 8px; }
    .img-preview-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .img-thumb { width: 80px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #e0e0e0; }
    .upload-btn { width: 100%; }
    .checkbox-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      margin-bottom: 8px;
    }
    @media (max-width: 599px) {
      .filter-row { flex-direction: column; align-items: stretch; }
      .form-row { flex-direction: column; }
      .form-row mat-form-field:not([style]) { min-width: 100%; }
      .checkbox-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      .img-preview-row { flex-direction: column; align-items: flex-start; }
      .group-card .form-row { flex-direction: column; }
      .options-section { margin-left: 8px; padding: 8px 0; }
    }
  `]
})
export class ProductsComponent implements OnInit {
  products = signal<any[]>([]);
  categories = signal<any[]>([]);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  uploading = signal(false);
  filterCategoryId: number | null = null;
  displayedColumns = ['actions', 'name', 'category', 'price', 'isPromotion', 'isAvailable', 'isActive'];

  form: any = this.emptyForm();

  constructor(private adminService: AdminService, private snack: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit() {
    this.adminService.getCategories().subscribe(c => this.categories.set(c));
    this.load();
  }

  load() {
    this.adminService.getProducts(this.filterCategoryId ?? undefined).subscribe(res => {
      this.products.set(res.items ?? res);
    });
  }

  emptyForm(): any {
    return {
      name: '', description: '', price: 0, categoryId: null, imageUrl: '',
      isActive: true, isAvailable: true, isPromotion: false, discountPercent: 0,
      hasVariants: false, variants: [], customizationGroups: []
    };
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { this.snack.open('Máximo 2MB', 'OK', { duration: 3000 }); return; }
    this.uploading.set(true);
    const oldUrl = this.form.imageUrl;
    this.adminService.uploadImage(file).subscribe({
      next: (res) => { if (oldUrl) this.adminService.deleteImage(oldUrl).subscribe(); this.form.imageUrl = res.url; this.uploading.set(false); },
      error: () => { this.uploading.set(false); this.snack.open('Error al subir', 'OK', { duration: 3000 }); }
    });
  }

  removeImage(): void {
    if (this.form.imageUrl) { this.adminService.deleteImage(this.form.imageUrl).subscribe(); this.form.imageUrl = ''; }
  }

  addVariant() { this.form.variants.push({ name: '', price: 0, selectionCount: 1 }); }
  addGroup() {
    this.form.customizationGroups.push({
      name: '', selectionType: 'Single', minSelections: 0, maxSelections: 1, isRequired: false, options: []
    });
  }
  addOption(group: any) { group.options.push({ name: '', priceModifier: 0 }); }

  save() {
    if (!this.form.name || !this.form.categoryId) {
      this.snack.open('Nombre y categoría son requeridos', 'OK', { duration: 3000 }); return;
    }
    const obs = this.editingId()
      ? this.adminService.updateProduct(this.editingId()!, this.form)
      : this.adminService.createProduct(this.form);
    obs.subscribe({
      next: () => { this.snack.open('Guardado', 'OK', { duration: 2000 }); this.cancelEdit(); this.load(); },
      error: () => this.snack.open('Error al guardar', 'OK', { duration: 3000 })
    });
  }

  edit(row: any) {
    this.editingId.set(row.id);
    this.adminService.getProduct(row.id).subscribe(p => {
      this.form = {
        name: p.name, description: p.description, price: p.price, categoryId: p.categoryId,
        imageUrl: p.imageUrl, isActive: p.isActive, isAvailable: p.isAvailable,
        isPromotion: p.isPromotion, discountPercent: p.discountPercent || 0,
        hasVariants: p.hasVariants || (p.variants?.length > 0),
        variants: p.variants || [], customizationGroups: p.customizationGroups || []
      };
      this.showForm.set(true);
    });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.showForm.set(false);
  }

  confirmDelete(row: any) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar producto', message: `¿Estás seguro de eliminar "${row.name}"?`, confirmText: 'Eliminar', type: 'danger' },
      width: '400px',
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.adminService.deleteProduct(row.id).subscribe({
        next: () => { this.snack.open('Eliminado', 'OK', { duration: 2000 }); this.load(); },
        error: () => this.snack.open('Error al eliminar', 'OK', { duration: 3000 })
      });
    });
  }
}
