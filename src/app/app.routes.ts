import { Routes } from '@angular/router';
import { authGuard, guestGuard, moduleAccessGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPasswordComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'verify-otp',
    loadComponent: () => import('./pages/verify-otp/verify-otp').then(m => m.VerifyOtpComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'change-password',
    loadComponent: () => import('./pages/change-password/change-password').then(m => m.ChangePasswordComponent),
    canActivate: [authGuard]
  },
  {
    path: 'roles',
    loadComponent: () => import('./pages/roles/roles').then(m => m.RolesComponent),
    canActivate: [moduleAccessGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/users/users').then(m => m.UsersComponent),
    canActivate: [moduleAccessGuard]
  },
  {
    path: 'categories',
    loadComponent: () => import('./pages/categories/categories').then(m => m.CategoriesComponent),
    canActivate: [moduleAccessGuard]
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products').then(m => m.ProductsComponent),
    canActivate: [moduleAccessGuard]
  },
  {
    path: 'warehouses',
    loadComponent: () => import('./pages/warehouses/warehouses').then(m => m.WarehousesComponent),
    canActivate: [moduleAccessGuard]
  },
  {
    path: 'stock',
    loadComponent: () => import('./pages/stock/stock').then(m => m.StockComponent),
    canActivate: [moduleAccessGuard]
  },
  {
    path: 'customers',
    loadComponent: () => import('./pages/customers/customers').then(m => m.CustomersComponent),
    canActivate: [moduleAccessGuard]
  },
  {
    path: 'quotes',
    loadComponent: () => import('./pages/quotes/quotes').then(m => m.QuotesComponent),
    canActivate: [moduleAccessGuard]
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders').then(m => m.OrdersComponent),
    canActivate: [moduleAccessGuard]
  },
  {
    path: 'pro-formas',
    loadComponent: () => import('./pages/pro-formas/pro-formas').then(m => m.ProFormasComponent),
    canActivate: [moduleAccessGuard]
  },
  {
    path: 'invoices',
    loadComponent: () => import('./pages/invoices/invoices').then(m => m.InvoicesComponent),
    canActivate: [moduleAccessGuard]
  },
  {
    path: 'credit-notes',
    loadComponent: () => import('./pages/credit-notes/credit-notes').then(m => m.CreditNotesComponent),
    canActivate: [moduleAccessGuard]
  },
  {
    path: 'audit',
    loadComponent: () => import('./pages/audit/audit').then(m => m.AuditComponent),
    canActivate: [moduleAccessGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
