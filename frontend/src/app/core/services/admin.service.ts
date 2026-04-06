import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboard(): Observable<any> { return this.http.get(`${this.api}/dashboard`); }

  // Categories
  getCategories(): Observable<any[]> { return this.http.get<any[]>(`${this.api}/categories`); }
  createCategory(data: any): Observable<any> { return this.http.post(`${this.api}/categories`, data); }
  updateCategory(id: number, data: any): Observable<any> { return this.http.put(`${this.api}/categories/${id}`, data); }
  deleteCategory(id: number): Observable<any> { return this.http.delete(`${this.api}/categories/${id}`); }
  reorderCategories(items: any[]): Observable<any> { return this.http.put(`${this.api}/categories/reorder`, { items }); }

  // Products
  getProducts(categoryId?: number, page = 1): Observable<any> {
    let url = `${this.api}/products?page=${page}&pageSize=50`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    return this.http.get(url);
  }
  getProduct(id: number): Observable<any> { return this.http.get(`${this.api}/products/${id}`); }
  createProduct(data: any): Observable<any> { return this.http.post(`${this.api}/products`, data); }
  updateProduct(id: number, data: any): Observable<any> { return this.http.put(`${this.api}/products/${id}`, data); }
  deleteProduct(id: number): Observable<any> { return this.http.delete(`${this.api}/products/${id}`); }

  // Orders
  getOrders(params: any = {}): Observable<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) searchParams.set(k, String(v)); });
    return this.http.get(`${this.api}/orders?${searchParams.toString()}`);
  }
  getOrder(id: number): Observable<any> { return this.http.get(`${this.api}/orders/${id}`); }
  updateOrderStatus(id: number, status: string, notes?: string): Observable<any> {
    return this.http.put(`${this.api}/orders/${id}/status`, { status, notes });
  }

  // Config
  getConfig(): Observable<any> { return this.http.get(`${this.api}/config`); }
  updateConfig(data: any): Observable<any> { return this.http.put(`${this.api}/config`, data); }

  // Schedules
  getSchedules(): Observable<any[]> { return this.http.get<any[]>(`${this.api}/schedules`); }
  updateSchedules(schedules: any[]): Observable<any> { return this.http.put(`${this.api}/schedules`, { schedules }); }

  // Discount Codes
  getDiscountCodes(): Observable<any[]> { return this.http.get<any[]>(`${this.api}/discount-codes`); }
  createDiscountCode(data: any): Observable<any> { return this.http.post(`${this.api}/discount-codes`, data); }
  updateDiscountCode(id: number, data: any): Observable<any> { return this.http.put(`${this.api}/discount-codes/${id}`, data); }
  deleteDiscountCode(id: number): Observable<any> { return this.http.delete(`${this.api}/discount-codes/${id}`); }

  // Alerts
  getAlerts(): Observable<any[]> { return this.http.get<any[]>(`${this.api}/alerts`); }
  createAlert(data: any): Observable<any> { return this.http.post(`${this.api}/alerts`, data); }
  updateAlert(id: number, data: any): Observable<any> { return this.http.put(`${this.api}/alerts/${id}`, data); }
  deleteAlert(id: number): Observable<any> { return this.http.delete(`${this.api}/alerts/${id}`); }

  // Upload
  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.api}/upload`, formData);
  }

  deleteImage(url: string): Observable<any> {
    return this.http.delete(`${this.api}/upload`, { params: { url } });
  }
}
