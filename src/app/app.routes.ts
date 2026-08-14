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
import { invoiceFeature } from './pages/operations/finance/factures/data/store/invoice.reducer';
import * as invoiceEffects from './pages/operations/finance/factures/data/store/invoice.effects';

/**
 * Route tree. Paths mirror `structure-sidebar.md` one for one, so the URL, the
 * breadcrumb and the sidebar always tell the same story:
 *
 *   /app/dashboard
 *   /app/operations/{stock,ventes,finance}/…
 *   /app/reporting/…
 *   /app/administration/…
 *   /app/profile
 *
 * Each `permissions` list is mirrored by the matching link in `sidebar.nav.ts`,
 * so the sidebar never shows an entry the guard would bounce.
 */
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

      // ---- Opérations · Stocks ----
      {
        path: 'operations/stock/produits',
        canActivate: [permissionGuard], data: { permissions: [Permission.PRODUCT_READ], breadcrumb: ['Opérations', 'Stocks', 'Produits'] },
        providers: [provideState(productFeature), provideEffects(productEffects)],
        loadComponent: () => import('./pages/operations/stock/produits/ui/produits-list/produits-list').then((m) => m.ProduitsList),
      },
      {
        path: 'operations/stock/categories',
        canActivate: [permissionGuard], data: { permissions: [Permission.CATEGORY_READ], breadcrumb: ['Opérations', 'Stocks', 'Catégories'] },
        loadComponent: () => import('./pages/operations/stock/categories/ui/categories-list/categories-list').then((m) => m.CategoriesList),
      },
      {
        path: 'operations/stock/mouvements',
        canActivate: [permissionGuard], data: { permissions: [Permission.MOVEMENT_READ], breadcrumb: ['Opérations', 'Stocks', 'Mouvements'] },
        providers: [provideState(movementFeature), provideEffects(movementEffects)],
        loadComponent: () => import('./pages/operations/stock/mouvements/ui/mouvements-list/mouvements-list').then((m) => m.MouvementsList),
      },
      {
        path: 'operations/stock/entrepots',
        canActivate: [permissionGuard], data: { permissions: [Permission.WAREHOUSE_READ], breadcrumb: ['Opérations', 'Stocks', 'Entrepôts'] },
        loadComponent: () => import('./pages/operations/stock/entrepots/ui/entrepots-list/entrepots-list').then((m) => m.EntrepotsList),
      },

      // ---- Opérations · Ventes ----
      {
        path: 'operations/ventes/clients',
        canActivate: [permissionGuard], data: { permissions: [Permission.CUSTOMER_READ], breadcrumb: ['Opérations', 'Ventes', 'Clients'] },
        providers: [provideState(customerFeature), provideEffects(customerEffects)],
        loadComponent: () => import('./pages/operations/ventes/clients/ui/clients-list/clients-list').then((m) => m.ClientsList),
      },
      {
        path: 'operations/ventes/devis',
        canActivate: [permissionGuard], data: { permissions: [Permission.QUOTE_READ], breadcrumb: ['Opérations', 'Ventes', 'Devis'] },
        providers: [provideState(quoteFeature), provideEffects(quoteEffects)],
        loadComponent: () => import('./pages/operations/ventes/devis/ui/devis-list/devis-list').then((m) => m.DevisList),
      },
      {
        path: 'operations/ventes/commandes',
        canActivate: [permissionGuard], data: { permissions: [Permission.ORDER_READ], breadcrumb: ['Opérations', 'Ventes', 'Commandes'] },
        providers: [provideState(orderFeature), provideEffects(orderEffects)],
        loadComponent: () => import('./pages/operations/ventes/commandes/ui/commandes-list/commandes-list').then((m) => m.CommandesList),
      },
      {
        path: 'operations/ventes/livraisons',
        canActivate: [permissionGuard], data: { permissions: [Permission.ORDER_READ, Permission.DELIVERY_READ], breadcrumb: ['Opérations', 'Ventes', 'Livraisons'] },
        providers: [provideState(orderFeature), provideEffects(orderEffects)],
        loadComponent: () => import('./pages/operations/ventes/livraisons/ui/livraisons-list/livraisons-list').then((m) => m.LivraisonsList),
      },

      // ---- Opérations · Finance ----
      {
        path: 'operations/finance/factures',
        canActivate: [permissionGuard], data: { permissions: [Permission.INVOICE_READ], breadcrumb: ['Opérations', 'Finance', 'Factures'] },
        providers: [provideState(invoiceFeature), provideEffects(invoiceEffects)],
        loadComponent: () => import('./pages/operations/finance/factures/ui/factures-list/factures-list').then((m) => m.FacturesList),
      },
      {
        path: 'operations/finance/avoirs',
        canActivate: [permissionGuard], data: { permissions: [Permission.INVOICE_READ], breadcrumb: ['Opérations', 'Finance', 'Avoirs'] },
        loadComponent: () => import('./pages/operations/finance/avoirs/ui/avoirs-list/avoirs-list').then((m) => m.AvoirsList),
      },
      {
        path: 'operations/finance/paiements',
        canActivate: [permissionGuard], data: { permissions: [Permission.PAYMENT_READ], breadcrumb: ['Opérations', 'Finance', 'Paiements'] },
        loadComponent: () => import('./pages/operations/finance/paiements/ui/paiements/paiements').then((m) => m.Paiements),
      },
      {
        path: 'operations/finance/comptabilite',
        canActivate: [permissionGuard],
        data: {
          permissions: [Permission.ACCOUNT_READ, Permission.JOURNAL_READ, Permission.ACCOUNTING_REPORT_READ],
          breadcrumb: ['Opérations', 'Finance', 'Comptabilité'],
        },
        loadComponent: () => import('./pages/operations/finance/comptabilite/ui/comptabilite/comptabilite').then((m) => m.Comptabilite),
      },

      // ---- Achat (procure-to-pay) ----
      {
        path: 'achat/fournisseurs',
        canActivate: [permissionGuard], data: { permissions: [Permission.SUPPLIER_READ], breadcrumb: ['Achat', 'Fournisseurs'] },
        loadComponent: () => import('./pages/achat/fournisseurs/ui/fournisseurs-list/fournisseurs-list').then((m) => m.FournisseursList),
      },
      {
        path: 'achat/commandes',
        canActivate: [permissionGuard], data: { permissions: [Permission.PURCHASE_ORDER_READ], breadcrumb: ['Achat', 'Commandes'] },
        loadComponent: () => import('./pages/achat/commandes/ui/achat-commandes-list/achat-commandes-list').then((m) => m.AchatCommandesList),
      },
      {
        path: 'achat/factures',
        canActivate: [permissionGuard], data: { permissions: [Permission.SUPPLIER_INVOICE_READ], breadcrumb: ['Achat', 'Factures'] },
        loadComponent: () => import('./pages/achat/factures/ui/factures-fournisseur-list/factures-fournisseur-list').then((m) => m.FacturesFournisseurList),
      },
      {
        path: 'achat/avoirs',
        canActivate: [permissionGuard], data: { permissions: [Permission.SUPPLIER_INVOICE_READ], breadcrumb: ['Achat', 'Avoirs'] },
        loadComponent: () => import('./pages/achat/avoirs/ui/avoirs-fournisseur-list/avoirs-fournisseur-list').then((m) => m.AvoirsFournisseurList),
      },

      // ---- Messagerie ----
      {
        path: 'messagerie',
        canActivate: [permissionGuard], data: { permissions: [Permission.MESSAGE_READ], breadcrumb: ['Messagerie'] },
        loadComponent: () => import('./pages/messagerie/ui/messagerie/messagerie').then((m) => m.Messagerie),
      },

      // ---- Reporting ----
      {
        path: 'reporting/finances',
        canActivate: [permissionGuard],
        data: {
          permissions: [Permission.ACCOUNTING_REPORT_READ, Permission.INVOICE_READ, Permission.PAYMENT_READ],
          breadcrumb: ['Reporting', 'Finances'],
        },
        loadComponent: () => import('./pages/reporting/finances/ui/reporting-finances/reporting-finances').then((m) => m.ReportingFinances),
      },
      {
        path: 'reporting/stock',
        canActivate: [permissionGuard], data: { permissions: [Permission.PRODUCT_READ, Permission.MOVEMENT_READ, Permission.WAREHOUSE_READ], breadcrumb: ['Reporting', 'Stocks'] },
        loadComponent: () => import('./pages/reporting/stock/ui/reporting-stock/reporting-stock').then((m) => m.ReportingStock),
      },
      {
        path: 'reporting/ventes',
        canActivate: [permissionGuard], data: { permissions: [Permission.ORDER_READ, Permission.QUOTE_READ, Permission.CUSTOMER_READ], breadcrumb: ['Reporting', 'Ventes'] },
        loadComponent: () => import('./pages/reporting/ventes/ui/reporting-ventes/reporting-ventes').then((m) => m.ReportingVentes),
      },

      // ---- Administration ----
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
        // Company settings ride on USER_READ (no COMPANY_* permission exists);
        // theme preferences are personal and open to any authenticated user.
        path: 'administration/parametres',
        data: { breadcrumb: ['Administration', 'Paramètres'] },
        loadComponent: () => import('./pages/administration/parametres/ui/parametres/parametres').then((m) => m.Parametres),
      },

      { path: 'profile', data: { breadcrumb: ['Profil'] }, loadComponent: () => import('./pages/profile/ui/profile/profile').then((m) => m.Profile) },

      // Finance moved under Opérations — keep previously shared links working.
      { path: 'finance/factures', pathMatch: 'full', redirectTo: 'operations/finance/factures' },
      { path: 'finance/avoirs', pathMatch: 'full', redirectTo: 'operations/finance/avoirs' },
      { path: 'finance/paiements', pathMatch: 'full', redirectTo: 'operations/finance/paiements' },
      { path: 'finance/comptabilite', pathMatch: 'full', redirectTo: 'operations/finance/comptabilite' },

      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
