import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-discount-codes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCheckboxModule, MatSnackBarModule, MatDialogModule
  ],
  template: `
    <div class="container">
      <div class="page-header">
        <h2>Códigos de descuento</h2>
        <p class="page-subtitle">Creá códigos de descuento para tus clientes</p>
        <button mat-raised-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon> {{ showForm() ? 'Cerrar' : 'Nuevo Código' }}
        </button>
      </div>

      @if (showForm()) {
      <div class="form-card">
        <h3>{{ editingId() ? 'Editar' : 'Nuevo' }} Código</h3>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Código</mat-label>
            <input matInput [(ngModel)]="form.code" />
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:150px">
            <mat-label>Descuento %</mat-label>
            <input matInput type="number" [(ngModel)]="form.discountPercent" max="50" />
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:150px">
            <mat-label>Usos máximos</mat-label>
            <input matInput type="number" [(ngModel)]="form.maxUses" />
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-checkbox [(ngModel)]="form.freeShipping">Envío gratis</mat-checkbox>
          <mat-checkbox [(ngModel)]="form.isActive">Activo</mat-checkbox>
        </div>
        <div class="form-actions">
          <button mat-raised-button color="primary" (click)="save()">
            <mat-icon>save</mat-icon> {{ editingId() ? 'Actualizar' : 'Crear' }}
          </button>
          <button mat-button *ngIf="editingId()" (click)="cancelEdit()">Cancelar</button>
        </div>
      </div>
      }

      <div class="table-wrapper">
        <table mat-table [dataSource]="codes()" class="full-width">
          <ng-container matColumnDef="code">
            <th mat-header-cell *matHeaderCellDef>Código</th>
            <td mat-cell *matCellDef="let row">{{ row.code }}</td>
          </ng-container>
          <ng-container matColumnDef="discountPercent">
            <th mat-header-cell *matHeaderCellDef>Descuento %</th>
            <td mat-cell *matCellDef="let row">{{ row.discountPercent }}%</td>
          </ng-container>
          <ng-container matColumnDef="freeShipping">
            <th mat-header-cell *matHeaderCellDef>Envío gratis</th>
            <td mat-cell *matCellDef="let row">
              <mat-icon [color]="row.freeShipping ? 'primary' : ''">{{ row.freeShipping ? 'check' : 'close' }}</mat-icon>
            </td>
          </ng-container>
          <ng-container matColumnDef="isActive">
            <th mat-header-cell *matHeaderCellDef>Activo</th>
            <td mat-cell *matCellDef="let row">
              <mat-icon [color]="row.isActive ? 'primary' : 'warn'">{{ row.isActive ? 'check_circle' : 'cancel' }}</mat-icon>
            </td>
          </ng-container>
          <ng-container matColumnDef="uses">
            <th mat-header-cell *matHeaderCellDef>Usos</th>
            <td mat-cell *matCellDef="let row">{{ row.currentUses || 0 }}/{{ row.maxUses || '∞' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button color="primary" (click)="edit(row)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="delete(row)"><mat-icon>delete</mat-icon></button>
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
    .form-card { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,.12); }
    .form-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
    .form-row mat-form-field:not([style]) { flex: 1; min-width: 180px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .table-wrapper { overflow-x: auto; }
    .full-width { width: 100%; }
  `]
})
export class DiscountCodesComponent implements OnInit {
  codes = signal<any[]>([]);
  editingId = signal<number | null>(null);
  showForm = signal(false);
  form: any = { code: '', discountPercent: 10, freeShipping: false, isActive: true, maxUses: 0 };
  displayedColumns = ['actions', 'code', 'discountPercent', 'freeShipping', 'isActive', 'uses'];

  constructor(private adminService: AdminService, private snack: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit() { this.load(); }

  load() {
    this.adminService.getDiscountCodes().subscribe(data => this.codes.set(data));
  }

  save() {
    if (!this.form.code) { this.snack.open('El código es requerido', 'OK', { duration: 3000 }); return; }
    if (this.form.discountPercent > 50) { this.form.discountPercent = 50; }
    const obs = this.editingId()
      ? this.adminService.updateDiscountCode(this.editingId()!, this.form)
      : this.adminService.createDiscountCode(this.form);
    obs.subscribe({
      next: () => { this.snack.open('Guardado', 'OK', { duration: 2000 }); this.cancelEdit(); this.load(); },
      error: () => this.snack.open('Error al guardar', 'OK', { duration: 3000 })
    });
  }

  edit(row: any) {
    this.editingId.set(row.id);
    this.showForm.set(true);
    this.form = {
      code: row.code, discountPercent: row.discountPercent, freeShipping: row.freeShipping,
      isActive: row.isActive, maxUses: row.maxUses
    };
  }

  cancelEdit() {
    this.editingId.set(null);
    this.showForm.set(false);
    this.form = { code: '', discountPercent: 10, freeShipping: false, isActive: true, maxUses: 0 };
  }

  delete(row: any) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Código', message: `¿Estás seguro de eliminar "${row.code}"?`, confirmText: 'Eliminar', type: 'danger' },
      width: '400px',
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.adminService.deleteDiscountCode(row.id).subscribe({
        next: () => { this.snack.open('Eliminado', 'OK', { duration: 2000 }); this.load(); },
        error: () => this.snack.open('Error al eliminar', 'OK', { duration: 3000 })
      });
    });
  }
}
