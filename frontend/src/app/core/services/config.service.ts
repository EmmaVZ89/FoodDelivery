import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BusinessConfig } from '../models/business-config.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly apiUrl = `${environment.apiUrl}/config`;

  readonly config = signal<BusinessConfig | null>(null);
  readonly loading = signal(true);

  constructor(private http: HttpClient) {}

  loadConfig(): void {
    this.loading.set(true);
    this.http.get<BusinessConfig>(this.apiUrl).subscribe({
      next: (config) => {
        this.config.set(config);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
