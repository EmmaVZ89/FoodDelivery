import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatSlideToggleModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSnackBarModule
  ],
  template: `
    <div class="admin-page">
      <div class="page-header"><h2>Horarios de atención</h2></div>
      <p class="page-subtitle">Configurá los horarios de atención de cada día</p>
      <div class="schedules-grid">
        @for (s of schedules(); track s.dayOfWeek) {
          <div class="schedule-card">
            <div class="day-header">
              <span class="day-name">{{ dayNames[s.dayOfWeek] }}</span>
              <mat-slide-toggle [(ngModel)]="s.isOpen" color="primary">
                {{ s.isOpen ? 'Abierto' : 'Cerrado' }}
              </mat-slide-toggle>
            </div>
            @if (s.isOpen) {
              <div class="time-row">
                <mat-form-field appearance="outline">
                  <mat-label>Apertura</mat-label>
                  <input matInput type="time" [(ngModel)]="s.openTime" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Cierre</mat-label>
                  <input matInput type="time" [(ngModel)]="s.closeTime" />
                </mat-form-field>
              </div>
            }
          </div>
        }
      </div>
      <div class="form-actions">
        <button mat-raised-button color="primary" (click)="saveAll()">
          Guardar horarios
        </button>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { max-width: 800px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h2 { margin: 0; font-size: 22px; font-weight: 600; }
    .page-subtitle { margin: -8px 0 16px; font-size: 14px; color: #94a3b8; }
    .schedules-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 768px) { .schedules-grid { grid-template-columns: repeat(2, 1fr); } }
    .schedule-card {
      background: white; border-radius: 12px; padding: 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden;
    }
    .day-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .day-name { font-weight: 600; font-size: 15px; min-width: 80px; }
    .time-row {
      display: flex; gap: 8px; margin-top: 12px;
    }
    .time-row mat-form-field { flex: 1; min-width: 0; }
    .form-actions { display: flex; justify-content: flex-end; margin-top: 20px; }
  `]
})
export class SchedulesComponent implements OnInit {
  dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  schedules = signal<any[]>([]);

  constructor(private adminService: AdminService, private snack: MatSnackBar) {}

  ngOnInit() {
    this.adminService.getSchedules().subscribe({
      next: data => {
        if (data && data.length) {
          this.schedules.set(data);
        } else {
          this.schedules.set(this.dayNames.map((_, i) => ({
            dayOfWeek: i + 1, isOpen: i < 6, openTime: '09:00', closeTime: '22:00'
          })));
        }
      },
      error: () => this.snack.open('Error al cargar horarios', 'OK', { duration: 3000 })
    });
  }

  saveAll() {
    this.adminService.updateSchedules(this.schedules()).subscribe({
      next: () => this.snack.open('Horarios guardados', 'OK', { duration: 2000 }),
      error: () => this.snack.open('Error al guardar', 'OK', { duration: 3000 })
    });
  }
}
