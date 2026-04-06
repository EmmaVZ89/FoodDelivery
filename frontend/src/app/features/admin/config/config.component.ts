import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <h2>Configuración del negocio</h2>
      <p class="page-subtitle">Datos del negocio que se muestran en la web</p>
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (config()) {
      <div class="form-card">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Nombre del negocio</mat-label>
            <input matInput [(ngModel)]="config().name" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Teléfono</mat-label>
            <input matInput [(ngModel)]="config().phone" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>WhatsApp</mat-label>
            <input matInput [(ngModel)]="config().whatsapp" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>URL Logo</mat-label>
            <input matInput [(ngModel)]="config().logoUrl" />
          </mat-form-field>
          <div class="upload-section">
            <button mat-stroked-button (click)="logoInput.click()">
              <mat-icon>upload</mat-icon> Subir logo
            </button>
            <input #logoInput type="file" accept="image/*" hidden (change)="uploadLogo($event)" />
            <img *ngIf="config().logoUrl" [src]="config().logoUrl" class="logo-preview" alt="Logo" />
          </div>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>URL Favicon</mat-label>
            <input matInput [(ngModel)]="config().faviconUrl" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Instagram URL</mat-label>
            <input matInput [(ngModel)]="config().instagramUrl" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Dirección</mat-label>
            <input matInput [(ngModel)]="config().address" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" style="width:200px">
            <mat-label>Pedidos concurrentes máx.</mat-label>
            <input matInput type="number" [(ngModel)]="config().maxConcurrentOrders" />
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:200px">
            <mat-label>Costo de envío</mat-label>
            <input matInput type="number" [(ngModel)]="config().shippingCost" />
          </mat-form-field>
        </div>

        <button mat-raised-button color="primary" (click)="save()">
          <mat-icon>save</mat-icon> Guardar configuración
        </button>
      </div>
      } @else {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <p>No se pudo cargar la configuración</p>
          <button mat-stroked-button (click)="ngOnInit()">Reintentar</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .container { padding: 24px; }
    .form-card { background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.12); max-width: 800px; }
    .form-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; margin-bottom: 8px; }
    .form-row mat-form-field:not([style]) { flex: 1; min-width: 200px; }
    .form-row .full { flex: 2; min-width: 100%; }
    .upload-section { display: flex; align-items: center; gap: 12px; }
    .logo-preview { width: 48px; height: 48px; object-fit: contain; border-radius: 4px; border: 1px solid #ddd; }
    .page-subtitle { margin: -8px 0 16px; font-size: 14px; color: #94a3b8; }
    .loading-center { text-align: center; padding: 48px; }
    .error-state { text-align: center; padding: 48px; color: #999; mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ddd; } }
  `]
})
export class ConfigComponent implements OnInit {
  config = signal<any>(null);
  loading = signal(true);

  constructor(private adminService: AdminService, private snack: MatSnackBar) {}

  ngOnInit() {
    this.loading.set(true);
    this.adminService.getConfig().subscribe({
      next: data => { this.config.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  uploadLogo(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.adminService.uploadImage(file).subscribe({
      next: (res) => { this.config().logoUrl = res.url; this.snack.open('Logo subido', 'OK', { duration: 2000 }); },
      error: () => this.snack.open('Error al subir imagen', 'OK', { duration: 3000 })
    });
  }

  save() {
    this.adminService.updateConfig(this.config()).subscribe({
      next: () => this.snack.open('Configuración guardada', 'OK', { duration: 2000 }),
      error: () => this.snack.open('Error al guardar', 'OK', { duration: 3000 })
    });
  }
}
