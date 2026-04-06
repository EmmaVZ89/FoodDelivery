import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, PaginatedResponse, Product } from '../models/catalog.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}`);
  }

  getProducts(categoryId?: number, page = 1, pageSize = 20): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }

    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/products`, { params });
  }

  getPromotions(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/promotions`);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }
}
