/**
 * Central permission registry + module map.
 *
 * These codes are the REAL backend permission strings (confirmed against
 * GET /api/roles → ADMIN role, which holds the full catalog). Do not rename
 * these — they must match the `permissions[]` array returned on login exactly.
 */
export const Permission = {
  CATEGORY_MANAGE: 'CATEGORY_MANAGE',
  CATEGORY_READ: 'CATEGORY_READ',

  CUSTOMER_CREATE: 'CUSTOMER_CREATE',
  CUSTOMER_DELETE: 'CUSTOMER_DELETE',
  CUSTOMER_READ: 'CUSTOMER_READ',
  CUSTOMER_UPDATE: 'CUSTOMER_UPDATE',

  DELIVERY_MANAGE: 'DELIVERY_MANAGE',
  DELIVERY_READ: 'DELIVERY_READ',

  INVOICE_CANCEL: 'INVOICE_CANCEL',
  INVOICE_CREATE: 'INVOICE_CREATE',
  INVOICE_READ: 'INVOICE_READ',
  INVOICE_SEND: 'INVOICE_SEND',
  INVOICE_UPDATE: 'INVOICE_UPDATE',

  MOVEMENT_ADJUST: 'MOVEMENT_ADJUST',
  MOVEMENT_CREATE: 'MOVEMENT_CREATE',
  MOVEMENT_READ: 'MOVEMENT_READ',

  ORDER_CANCEL: 'ORDER_CANCEL',
  ORDER_CREATE: 'ORDER_CREATE',
  ORDER_DELIVER: 'ORDER_DELIVER',
  ORDER_READ: 'ORDER_READ',
  ORDER_UPDATE: 'ORDER_UPDATE',
  ORDER_VALIDATE: 'ORDER_VALIDATE',

  PAYMENT_READ: 'PAYMENT_READ',
  PAYMENT_RECORD: 'PAYMENT_RECORD',

  PERMISSION_READ: 'PERMISSION_READ',

  PRODUCT_CREATE: 'PRODUCT_CREATE',
  PRODUCT_DELETE: 'PRODUCT_DELETE',
  PRODUCT_READ: 'PRODUCT_READ',
  PRODUCT_UPDATE: 'PRODUCT_UPDATE',

  QUOTE_CREATE: 'QUOTE_CREATE',
  QUOTE_READ: 'QUOTE_READ',
  QUOTE_VALIDATE: 'QUOTE_VALIDATE',

  ROLE_CREATE: 'ROLE_CREATE',
  ROLE_DELETE: 'ROLE_DELETE',
  ROLE_MANAGE: 'ROLE_MANAGE',
  ROLE_READ: 'ROLE_READ',
  ROLE_UPDATE: 'ROLE_UPDATE',

  USER_ACTIVATE: 'USER_ACTIVATE',
  USER_CREATE: 'USER_CREATE',
  USER_DEACTIVATE: 'USER_DEACTIVATE',
  USER_DELETE: 'USER_DELETE',
  USER_READ: 'USER_READ',
  USER_UPDATE: 'USER_UPDATE',

  WAREHOUSE_CREATE: 'WAREHOUSE_CREATE',
  WAREHOUSE_DELETE: 'WAREHOUSE_DELETE',
  WAREHOUSE_READ: 'WAREHOUSE_READ',
  WAREHOUSE_UPDATE: 'WAREHOUSE_UPDATE',
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

/** Top-level module identifiers (the boxes on the Menu Principal). */
export type ModuleKey =
  | 'dashboard' | 'operations' | 'finance'
  | 'administration' | 'reporting' | 'profile';

export interface ModuleDescriptor {
  key: ModuleKey;
  /** French label shown on the Menu Principal box and sidebar group. */
  label: string;
  description: string;
  icon: string;
  route: string;
  /** User needs AT LEAST ONE of these to see the module. Empty = always visible. */
  anyOf: PermissionKey[];
  /** CSS var names (themes.css) used to color-code this module — branding only, not status. */
  accentVar?: string;
  accentTintVar?: string;
}

/**
 * Module catalogue used by the Menu Principal and sidebar to render only what
 * the user may access.
 *
 * NOTE: the backend has NO dedicated permission for accounting, reporting,
 * audit, or settings (confirmed — they're absent even from ADMIN's full
 * permission list). Those modules/routes are gated on the closest related
 * domain permissions instead (documented inline below and in the README).
 */
export const MODULES: ModuleDescriptor[] = [
  { key: 'dashboard', label: 'Tableau de bord', description: 'Vue d’ensemble et indicateurs',
    icon: 'layout-dashboard', route: '/app/dashboard', anyOf: [] },

  { key: 'operations', label: 'Opérations', description: 'Stock, produits et ventes',
    icon: 'boxes', route: '/app/operations/stock/produits',
    accentVar: '--module-operations', accentTintVar: '--module-operations-tint',
    anyOf: [
      Permission.PRODUCT_READ, Permission.CATEGORY_READ, Permission.WAREHOUSE_READ,
      Permission.MOVEMENT_READ, Permission.CUSTOMER_READ, Permission.QUOTE_READ,
      Permission.ORDER_READ, Permission.DELIVERY_READ,
    ] },

  { key: 'finance', label: 'Finances', description: 'Factures, avoirs et comptabilité',
    icon: 'wallet', route: '/app/finance/factures',
    accentVar: '--module-finance', accentTintVar: '--module-finance-tint',
    // No ACCOUNTING_* permission exists — gated on invoice/payment access.
    anyOf: [Permission.INVOICE_READ, Permission.PAYMENT_READ] },

  { key: 'administration', label: 'Administration', description: 'Utilisateurs, rôles et audit',
    icon: 'shield', route: '/app/administration/utilisateurs',
    accentVar: '--module-administration', accentTintVar: '--module-administration-tint',
    // No dedicated AUDIT_* permission — audit/settings ride along with user/role access.
    anyOf: [Permission.USER_READ, Permission.ROLE_READ, Permission.PERMISSION_READ] },

  { key: 'reporting', label: 'Reporting', description: 'Rapports et exports',
    icon: 'bar-chart', route: '/app/reporting/ventes',
    accentVar: '--module-reporting', accentTintVar: '--module-reporting-tint',
    // No REPORTING_* permission — visible to anyone with meaningful read access.
    anyOf: [
      Permission.PRODUCT_READ, Permission.MOVEMENT_READ, Permission.INVOICE_READ,
      Permission.ORDER_READ, Permission.QUOTE_READ,
    ] },

  { key: 'profile', label: 'Profil', description: 'Informations du compte',
    icon: 'user', route: '/app/profile', anyOf: [] },
];

/** True if the user's permission list satisfies a module's `anyOf` rule. */
export function canAccessModule(userPermissions: string[], mod: ModuleDescriptor): boolean {
  if (mod.anyOf.length === 0) return true;
  return mod.anyOf.some((p) => userPermissions.includes(p));
}
