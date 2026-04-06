import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOrderRequest, Order } from '../models/order.model';
import { PaginatedResponse } from '../models/catalog.model';
import { environment } from '../../../environments/environment';

export interface OrderListItem {
  id: number;
  orderCode: string;
  status: string;
  total: number;
  createdAt: string;
  itemCount: number;
}

export interface DiscountCodeResponse {
  code: string;
  discountPercent: number;
  freeShipping: boolean;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  createOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, request);
  }

  getMyOrders(page = 1, pageSize = 10): Observable<PaginatedResponse<OrderListItem>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<PaginatedResponse<OrderListItem>>(this.apiUrl, { params });
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  validateCode(code: string): Observable<DiscountCodeResponse> {
    return this.http.post<DiscountCodeResponse>(`${this.apiUrl}/validate-code`, { code });
  }

  getKitchenCapacity(): Observable<{ hasCapacity: boolean }> {
    return this.http.get<{ hasCapacity: boolean }>(`${this.apiUrl}/kitchen-capacity`);
  }
}
