import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCheckboxModule, MatSnackBarModule,
    MatProgressBarModule, MatDialogModule,
  ],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h2>Categorías</h2>
        <p class="page-subtitle">Organizá tu menú en categorías</p>
        <button mat-raised-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
          {{ showForm() ? 'Cerrar' : 'Nueva categoría' }}
        </button>
      </div>

      <!-- Form -->
      @if (showForm()) {
        <div class="form-card">
          <h3>{{ editingId() ? 'Editar' : 'Nueva' }} Categoría</h3>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre</mat-label>
            <input matInput [(ngModel)]="form.name" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descripción</mat-label>
            <input matInput [(ngModel)]="form.description" />
          </mat-form-field>

          <!-- Image Upload -->
          <div class="image-section">
            <label class="field-label">Imagen</label>
            @if (form.imageUrl) {
              <div class="image-preview-row">
                <img [src]="form.imageUrl" alt="Preview" class="img-thumb" />
                <div class="image-actions">
                  <button mat-stroked-button (click)="fileInput.click()" class="full-width">
                    <mat-icon>swap_horiz</mat-icon> Cambiar imagen
                  </button>
                  <button mat-icon-button color="warn" (click)="removeImage()">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            } @else {
              <div class="upload-zone" (click)="fileInput.click()">
                <mat-icon>cloud_upload</mat-icon>
                <span>Hacé clic para subir una imagen</span>
                <span class="upload-hint">JPG, PNG o WebP. Máximo 2MB</span>
              </div>
            }
            <input #fileInput type="file" accept="image/jpeg,image/png,image/webp" hidden (change)="onFileSelected($event)" />
            @if (uploading()) {
              <mat-progress-bar mode="indeterminate" class="upload-bar"></mat-progress-bar>
            }
          </div>

          <mat-checkbox [(ngModel)]="form.isActive">Activa</mat-checkbox>

          <div class="form-actions">
            @if (editingId()) {
              <button mat-button (click)="cancelEdit()">Cancelar</button>
            }
            <button mat-raised-button color="primary" (click)="save()" [disabled]="uploading()">
              <mat-icon>save</mat-icon> {{ editingId() ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </div>
      }

      <!-- Table -->
      <div class="table-wrapper">
        <table mat-table [dataSource]="categories()" class="full-width">
          <ng-container matColumnDef="image">
            <th mat-header-cell *matHeaderCellDef>Imagen</th>
            <td mat-cell *matCellDef="let row">
              @if (row.imageUrl) {
                <img [src]="row.imageUrl" class="thumb" alt="" />
              } @else {
                <div class="thumb-empty"><mat-icon>image</mat-icon></div>
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
          </ng-container>
          <ng-container matColumnDef="isActive">
            <th mat-header-cell *matHeaderCellDef>Activa</th>
            <td mat-cell *matCellDef="let row">
              <mat-checkbox [checked]="row.isActive" (change)="toggleActive(row)" />
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
    .admin-page { max-width: 900px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .page-header h2 { margin: 0; font-size: 22px; font-weight: 600; }
    .page-subtitle { margin: -8px 0 16px; font-size: 14px; color: #94a3b8; }

    .form-card {
      background: #fff; padding: 20px; border-radius: 12px;
      margin-bottom: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .form-card h3 { margin: 0 0 16px; font-size: 16px; font-weight: 600; }
    .full-width { width: 100%; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }

    .field-label { font-size: 13px; color: #666; font-weight: 500; display: block; margin-bottom: 8px; }

    .image-section { margin: 8px 0 16px; }
    .image-preview-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .image-actions { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 180px; }
    .img-thumb { width: 100px; height: 68px; object-fit: cover; border-radius: 8px; border: 1px solid #e0e0e0; }

    .upload-zone {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; padding: 28px 16px; border: 2px dashed #ccc; border-radius: 12px;
      cursor: pointer; color: #999; transition: border-color 0.2s; width: 100%;
      &:hover { border-color: #3A6324; color: #3A6324; }
      mat-icon { font-size: 36px; width: 36px; height: 36px; }
      .upload-hint { font-size: 11px; color: #bbb; }
    }
    .upload-bar { margin-top: 8px; }

    .table-wrapper { overflow-x: auto; }
    .thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 8px; }
    .thumb-empty {
      width: 48px; height: 48px; background: #f5f5f5; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #ccc; font-size: 20px; }
    }
  `]
})
export class CategoriesComponent implements OnInit {
  categories = signal<any[]>([]);
  editingId = signal<number | null>(null);
  showForm = signal(false);
  uploading = signal(false);
  form: any = { name: '', description: '', imageUrl: '', isActive: true };
  displayedColumns = ['isActive', 'actions', 'name', 'image'];

  constructor(private adminService: AdminService, private snack: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit() { this.load(); }

  load() { this.adminService.getCategories().subscribe(data => this.categories.set(data)); }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { this.snack.open('La imagen no puede superar 2MB', 'OK', { duration: 4000 }); return; }
    this.uploading.set(true);
    const oldUrl = this.form.imageUrl;
    this.adminService.uploadImage(file).subscribe({
      next: (res) => { if (oldUrl) this.adminService.deleteImage(oldUrl).subscribe(); this.form.imageUrl = res.url; this.uploading.set(false); },
      error: (err) => { this.uploading.set(false); this.snack.open(err.error?.error || 'Error al subir imagen', 'OK', { duration: 4000 }); },
    });
  }

  removeImage(): void {
    if (this.form.imageUrl) { this.adminService.deleteImage(this.form.imageUrl).subscribe(); this.form.imageUrl = ''; }
  }

  save() {
    if (!this.form.name) { this.snack.open('El nombre es requerido', 'OK', { duration: 3000 }); return; }
    const obs = this.editingId()
      ? this.adminService.updateCategory(this.editingId()!, this.form)
      : this.adminService.createCategory(this.form);
    obs.subscribe({
      next: () => { this.snack.open('Guardado', 'OK', { duration: 2000 }); this.cancelEdit(); this.load(); },
      error: (err) => this.snack.open(err.error?.error || 'Error al guardar', 'OK', { duration: 3000 })
    });
  }

  edit(row: any) {
    this.editingId.set(row.id);
    this.form = { name: row.name, description: row.description, imageUrl: row.imageUrl, isActive: row.isActive };
    this.showForm.set(true);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.form = { name: '', description: '', imageUrl: '', isActive: true };
    this.showForm.set(false);
  }

  toggleActive(row: any) {
    this.adminService.updateCategory(row.id, { ...row, isActive: !row.isActive }).subscribe(() => this.load());
  }

  confirmDelete(row: any) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar categoría', message: `¿Estás seguro de eliminar "${row.name}"?`, confirmText: 'Eliminar', type: 'danger' },
      width: '400px',
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.adminService.deleteCategory(row.id).subscribe({
        next: () => { if (row.imageUrl) this.adminService.deleteImage(row.imageUrl).subscribe(); this.snack.open('Eliminada', 'OK', { duration: 2000 }); this.load(); },
        error: (err) => this.snack.open(err.error?.error || 'Error al eliminar', 'OK', { duration: 3000 })
      });
    });
  }
}
