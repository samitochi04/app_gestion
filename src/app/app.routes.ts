import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { Permission } from './core/models/permission.enum';

import { productFeature } from './pages/operations/stock/produits/data/store/product.reducer';
import * as productEffects from './pages/operations/stock/produits/data/store/product.effects';
import { movementFeature } from './pages/operations/stock/mouvements/data/store/movement.reducer';
import * as movementEffects from './pages/operations/stock/mouvements/data/store/movement.effects';
import { customerFeature } from './pages/operations/ventes/clients/data/store/customer.reducer';
import * as customerEffects from './pages/operations/ventes/clients/data/store/customer.effects';
import { quoteFeature } from './pages/operations/ventes/devis/data/store/quote.reducer';
import * as quoteEffects from './pages/operations/ventes/devis/data/store/quote.effects';
import { orderFeature } from './pages/operations/ventes/commandes/data/store/order.reducer';
import * as orderEffects from './pages/operations/ventes/commandes/data/store/order.effects';
import { invoiceFeature } from './pages/finance/factures/data/store/invoice.reducer';
import * as invoiceEffects from './pages/finance/factures/data/store/invoice.effects';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/auth/ui/login/login').then((m) => m.Login) },
  { path: 'forgot-password', loadComponent: () => import('./pages/auth/ui/forgot-password/forgot-password').then((m) => m.ForgotPassword) },
  { path: 'reset-password', loadComponent: () => import('./pages/auth/ui/reset-password/reset-password').then((m) => m.ResetPassword) },
  { path: 'register', loadComponent: () => import('./pages/auth/ui/register/register').then((m) => m.Register) },

  {
    path: 'menu',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/main-menu/ui/main-menu/main-menu').then((m) => m.MainMenu),
  },

  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: 'dashboard', data: { breadcrumb: ['Tableau de bord'] }, loadComponent: () => import('./pages/dashboard/ui/dashboard/dashboard').then((m) => m.Dashboard) },

      {
        path: 'operations/stock/produits',
        canActivate: [permissionGuard], data: { permissions: [Permission.PRODUCT_READ], breadcrumb: ['Opérations', 'Produits'] },
        providers: [provideState(productFeature), provideEffects(productEffects)],
        loadComponent: () => import('./pages/operations/stock/produits/ui/produits-list/produits-list').then((m) => m.ProduitsList),
      },
      {
        path: 'operations/stock/categories',
        canActivate: [permissionGuard], data: { permissions: [Permission.CATEGORY_READ], breadcrumb: ['Opérations', 'Catégories'] },
        loadComponent: () => import('./pages/operations/stock/categories/ui/categories-list/categories-list').then((m) => m.CategoriesList),
      },
      {
        path: 'operations/stock/mouvements',
        canActivate: [permissionGuard], data: { permissions: [Permission.MOVEMENT_READ], breadcrumb: ['Opérations', 'Mouvements'] },
        providers: [provideState(movementFeature), provideEffects(movementEffects)],
        loadComponent: () => import('./pages/operations/stock/mouvements/ui/mouvements-list/mouvements-list').then((m) => m.MouvementsList),
      },
      {
        path: 'operations/stock/entrepots',
        canActivate: [permissionGuard], data: { permissions: [Permission.WAREHOUSE_READ], breadcrumb: ['Opérations', 'Entrepôts'] },
        loadComponent: () => import('./pages/operations/stock/entrepots/ui/entrepots-list/entrepots-list').then((m) => m.EntrepotsList),
      },

      {
        path: 'operations/ventes/clients',
        canActivate: [permissionGuard], data: { permissions: [Permission.CUSTOMER_READ], breadcrumb: ['Opérations', 'Clients'] },
        providers: [provideState(customerFeature), provideEffects(customerEffects)],
        loadComponent: () => import('./pages/operations/ventes/clients/ui/clients-list/clients-list').then((m) => m.ClientsList),
      },
      {
        path: 'operations/ventes/devis',
        canActivate: [permissionGuard], data: { permissions: [Permission.QUOTE_READ], breadcrumb: ['Opérations', 'Devis'] },
        providers: [provideState(quoteFeature), provideEffects(quoteEffects)],
        loadComponent: () => import('./pages/operations/ventes/devis/ui/devis-list/devis-list').then((m) => m.DevisList),
      },
      {
        path: 'operations/ventes/commandes',
        canActivate: [permissionGuard], data: { permissions: [Permission.ORDER_READ], breadcrumb: ['Opérations', 'Commandes'] },
        providers: [provideState(orderFeature), provideEffects(orderEffects)],
        loadComponent: () => import('./pages/operations/ventes/commandes/ui/commandes-list/commandes-list').then((m) => m.CommandesList),
      },
      {
        path: 'operations/ventes/livraisons',
        canActivate: [permissionGuard], data: { permissions: [Permission.ORDER_READ, Permission.DELIVERY_READ], breadcrumb: ['Opérations', 'Livraisons'] },
        providers: [provideState(orderFeature), provideEffects(orderEffects)],
        loadComponent: () => import('./pages/operations/ventes/livraisons/ui/livraisons-list/livraisons-list').then((m) => m.LivraisonsList),
      },

      {
        path: 'finance/factures',
        canActivate: [permissionGuard], data: { permissions: [Permission.INVOICE_READ], breadcrumb: ['Finances', 'Factures'] },
        providers: [provideState(invoiceFeature), provideEffects(invoiceEffects)],
        loadComponent: () => import('./pages/finance/factures/ui/factures-list/factures-list').then((m) => m.FacturesList),
      },
      {
        path: 'finance/avoirs',
        canActivate: [permissionGuard], data: { permissions: [Permission.INVOICE_READ], breadcrumb: ['Finances', 'Avoirs'] },
        loadComponent: () => import('./pages/finance/avoirs/ui/avoirs-list/avoirs-list').then((m) => m.AvoirsList),
      },
      {
        path: 'finance/paiements',
        canActivate: [permissionGuard], data: { permissions: [Permission.PAYMENT_READ], breadcrumb: ['Finances', 'Paiements'] },
        loadComponent: () => import('./pages/finance/paiements/ui/paiements/paiements').then((m) => m.Paiements),
      },
      {
        path: 'finance/comptabilite',
        canActivate: [permissionGuard], data: { permissions: [Permission.INVOICE_READ, Permission.PAYMENT_READ], breadcrumb: ['Finances', 'Comptabilité'] },
        loadComponent: () => import('./pages/finance/comptabilite/ui/comptabilite/comptabilite').then((m) => m.Comptabilite),
      },

      {
        path: 'administration/utilisateurs',
        canActivate: [permissionGuard], data: { permissions: [Permission.USER_READ], breadcrumb: ['Administration', 'Utilisateurs'] },
        loadComponent: () => import('./pages/administration/utilisateurs/ui/utilisateurs-list/utilisateurs-list').then((m) => m.UtilisateursList),
      },
      {
        path: 'administration/roles',
        canActivate: [permissionGuard], data: { permissions: [Permission.ROLE_READ], breadcrumb: ['Administration', 'Rôles'] },
        loadComponent: () => import('./pages/administration/roles/ui/roles-list/roles-list').then((m) => m.RolesList),
      },
      {
        path: 'administration/audit',
        canActivate: [permissionGuard], data: { permissions: [Permission.USER_READ, Permission.ROLE_READ], breadcrumb: ['Administration', 'Audit'] },
        loadComponent: () => import('./pages/administration/audit/ui/audit-list/audit-list').then((m) => m.AuditList),
      },
      {
        // No ADMIN_SETTINGS permission exists in the backend — theme prefs are personal, open to any authenticated user.
        path: 'administration/parametres',
        data: { breadcrumb: ['Administration', 'Paramètres'] },
        loadComponent: () => import('./pages/administration/parametres/ui/parametres/parametres').then((m) => m.Parametres),
      },

      {
        path: 'reporting/finances',
        canActivate: [permissionGuard], data: { permissions: [Permission.INVOICE_READ, Permission.PAYMENT_READ], breadcrumb: ['Reporting', 'Finances'] },
        loadComponent: () => import('./pages/reporting/finances/ui/reporting-finances/reporting-finances').then((m) => m.ReportingFinances),
      },
      {
        path: 'reporting/stock',
        canActivate: [permissionGuard], data: { permissions: [Permission.PRODUCT_READ, Permission.MOVEMENT_READ, Permission.WAREHOUSE_READ], breadcrumb: ['Reporting', 'Stock'] },
        loadComponent: () => import('./pages/reporting/stock/ui/reporting-stock/reporting-stock').then((m) => m.ReportingStock),
      },
      {
        path: 'reporting/ventes',
        canActivate: [permissionGuard], data: { permissions: [Permission.ORDER_READ, Permission.QUOTE_READ, Permission.CUSTOMER_READ], breadcrumb: ['Reporting', 'Ventes'] },
        loadComponent: () => import('./pages/reporting/ventes/ui/reporting-ventes/reporting-ventes').then((m) => m.ReportingVentes),
      },

      { path: 'profile', data: { breadcrumb: ['Profil'] }, loadComponent: () => import('./pages/profile/ui/profile/profile').then((m) => m.Profile) },

      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
