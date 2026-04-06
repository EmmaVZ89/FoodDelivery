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
  selector: 'app-alerts',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCheckboxModule, MatSnackBarModule, MatDialogModule
  ],
  template: `
    <div class="container">
      <div class="page-header">
        <h2>Alertas</h2>
        <p class="page-subtitle">Mensajes que se muestran a los clientes en la web</p>
        <button mat-raised-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon> {{ showForm() ? 'Cerrar' : 'Nueva Alerta' }}
        </button>
      </div>

      @if (showForm()) {
      <div class="form-card">
        <h3>{{ editingId() ? 'Editar' : 'Nueva' }} Alerta</h3>
        <div class="form-row">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Mensaje</mat-label>
            <input matInput [(ngModel)]="form.message" />
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Válida desde</mat-label>
            <input matInput type="datetime-local" [(ngModel)]="form.validFrom" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Válida hasta</mat-label>
            <input matInput type="datetime-local" [(ngModel)]="form.validUntil" />
          </mat-form-field>
          <mat-checkbox [(ngModel)]="form.isActive">Activa</mat-checkbox>
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
        <table mat-table [dataSource]="alerts()" class="full-width">
          <ng-container matColumnDef="message">
            <th mat-header-cell *matHeaderCellDef>Mensaje</th>
            <td mat-cell *matCellDef="let row">{{ row.message }}</td>
          </ng-container>
          <ng-container matColumnDef="validFrom">
            <th mat-header-cell *matHeaderCellDef>Desde</th>
            <td mat-cell *matCellDef="let row">{{ row.validFrom | date:'short' }}</td>
          </ng-container>
          <ng-container matColumnDef="validUntil">
            <th mat-header-cell *matHeaderCellDef>Hasta</th>
            <td mat-cell *matCellDef="let row">{{ row.validUntil | date:'short' }}</td>
          </ng-container>
          <ng-container matColumnDef="isActive">
            <th mat-header-cell *matHeaderCellDef>Activa</th>
            <td mat-cell *matCellDef="let row">
              <mat-icon [color]="row.isActive ? 'primary' : 'warn'">{{ row.isActive ? 'check_circle' : 'cancel' }}</mat-icon>
            </td>
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
    .form-row mat-form-field:not([style]) { flex: 1; min-width: 200px; }
    .form-row .full { flex: 2; min-width: 100%; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .table-wrapper { overflow-x: auto; }
    .full-width { width: 100%; }
  `]
})
export class AlertsComponent implements OnInit {
  alerts = signal<any[]>([]);
  editingId = signal<number | null>(null);
  showForm = signal(false);
  form: any = { message: '', validFrom: '', validUntil: '', isActive: true };
  displayedColumns = ['actions', 'message', 'validFrom', 'validUntil', 'isActive'];

  constructor(private adminService: AdminService, private snack: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit() { this.load(); }

  load() {
    this.adminService.getAlerts().subscribe(data => this.alerts.set(data));
  }

  save() {
    if (!this.form.message) { this.snack.open('El mensaje es requerido', 'OK', { duration: 3000 }); return; }
    const obs = this.editingId()
      ? this.adminService.updateAlert(this.editingId()!, this.form)
      : this.adminService.createAlert(this.form);
    obs.subscribe({
      next: () => { this.snack.open('Guardado', 'OK', { duration: 2000 }); this.cancelEdit(); this.load(); },
      error: () => this.snack.open('Error al guardar', 'OK', { duration: 3000 })
    });
  }

  edit(row: any) {
    this.editingId.set(row.id);
    this.showForm.set(true);
    this.form = {
      message: row.message,
      validFrom: row.validFrom ? new Date(row.validFrom).toISOString().slice(0, 16) : '',
      validUntil: row.validUntil ? new Date(row.validUntil).toISOString().slice(0, 16) : '',
      isActive: row.isActive
    };
  }

  cancelEdit() {
    this.editingId.set(null);
    this.showForm.set(false);
    this.form = { message: '', validFrom: '', validUntil: '', isActive: true };
  }

  delete(row: any) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Alerta', message: `¿Estás seguro de eliminar "${row.message}"?`, confirmText: 'Eliminar', type: 'danger' },
      width: '400px',
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.adminService.deleteAlert(row.id).subscribe({
        next: () => { this.snack.open('Eliminada', 'OK', { duration: 2000 }); this.load(); },
        error: () => this.snack.open('Error al eliminar', 'OK', { duration: 3000 })
      });
    });
  }
}
