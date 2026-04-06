import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Alert {
  id: number;
  message: string;
  validFrom: string;
  validUntil: string;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly apiUrl = `${environment.apiUrl}/alerts`;
  readonly alerts = signal<Alert[]>([]);

  constructor(private http: HttpClient) {}

  loadActiveAlerts(): void {
    this.http.get<Alert[]>(`${this.apiUrl}/active`).subscribe({
      next: (alerts) => this.alerts.set(alerts),
    });
  }
}
