import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'categories', loadComponent: () => import('./categories/categories.component').then(m => m.CategoriesComponent) },
      { path: 'products', loadComponent: () => import('./products/products.component').then(m => m.ProductsComponent) },
      { path: 'orders', loadComponent: () => import('./orders/admin-orders.component').then(m => m.AdminOrdersComponent) },
      { path: 'schedules', loadComponent: () => import('./schedules/schedules.component').then(m => m.SchedulesComponent) },
      { path: 'config', loadComponent: () => import('./config/config.component').then(m => m.ConfigComponent) },
      { path: 'discount-codes', loadComponent: () => import('./discount-codes/discount-codes.component').then(m => m.DiscountCodesComponent) },
      { path: 'alerts', loadComponent: () => import('./alerts/alerts.component').then(m => m.AlertsComponent) },
    ],
  },
];
