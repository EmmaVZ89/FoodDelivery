import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="confirm-icon" [ngClass]="data.type || 'warning'">
        <mat-icon>{{ iconMap[data.type || 'warning'] }}</mat-icon>
      </div>
      <h3>{{ data.title }}</h3>
      <p>{{ data.message }}</p>
      <div class="confirm-actions">
        <button mat-stroked-button (click)="dialogRef.close(false)">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button
          mat-raised-button
          [color]="data.type === 'danger' ? 'warn' : 'primary'"
          (click)="dialogRef.close(true)"
        >
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 24px;
      text-align: center;
      max-width: 360px;
    }
    .confirm-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: white; }
      &.danger { background: #ef4444; }
      &.warning { background: #f59e0b; }
      &.info { background: #3b82f6; }
    }
    h3 { margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #1e293b; }
    p { margin: 0 0 24px; font-size: 14px; color: #64748b; line-height: 1.5; }
    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  `],
})
export class ConfirmDialogComponent {
  iconMap: Record<string, string> = {
    danger: 'delete_forever',
    warning: 'warning',
    info: 'info',
  };

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
