import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  saving = signal(false);

  name = '';
  phone = '';
  address = '';
  betweenStreets = '';
  apartmentInfo = '';
  deliveryNotes = '';

  constructor(
    private profileService: ProfileService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.profileService.getProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.name = p.name || '';
        this.phone = p.phone || '';
        this.address = p.address || '';
        this.betweenStreets = p.betweenStreets || '';
        this.apartmentInfo = p.apartmentInfo || '';
        this.deliveryNotes = p.deliveryNotes || '';
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    this.saving.set(true);
    this.profileService.updateProfile({
      name: this.name, phone: this.phone, address: this.address,
      betweenStreets: this.betweenStreets, apartmentInfo: this.apartmentInfo,
      deliveryNotes: this.deliveryNotes,
    } as Partial<UserProfile>).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.saving.set(false);
        this.snackBar.open('Perfil actualizado', 'OK', { duration: 3000 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 });
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
