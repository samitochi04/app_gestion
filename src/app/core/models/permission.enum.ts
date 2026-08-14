/**
 * Central permission registry + module map.
 *
 * These codes are the REAL backend permission strings. The catalogue below is
 * the complete set of 89 permissions seeded by Flyway and returned by
 * `GET /api/roles/permissions` (and on the ADMIN role). Do not rename them —
 * they must match the `permissions[]` array returned on login exactly, and a
 * new permission on the backend means a new Flyway migration, never a rename.
 */
export const Permission = {
  // ---- erp-accounting (17) ----
  ACCOUNT_CREATE: 'ACCOUNT_CREATE',
  ACCOUNT_IMPORT: 'ACCOUNT_IMPORT',
  ACCOUNT_READ: 'ACCOUNT_READ',
  ACCOUNT_UPDATE: 'ACCOUNT_UPDATE',
  ACCOUNTING_INBOX_READ: 'ACCOUNTING_INBOX_READ',
  ACCOUNTING_INBOX_RETRY: 'ACCOUNTING_INBOX_RETRY',
  ACCOUNTING_MAPPING_MANAGE: 'ACCOUNTING_MAPPING_MANAGE',
  ACCOUNTING_MAPPING_READ: 'ACCOUNTING_MAPPING_READ',
  ACCOUNTING_PERIOD_CLOSE: 'ACCOUNTING_PERIOD_CLOSE',
  ACCOUNTING_PERIOD_CREATE: 'ACCOUNTING_PERIOD_CREATE',
  ACCOUNTING_PERIOD_READ: 'ACCOUNTING_PERIOD_READ',
  ACCOUNTING_PERIOD_REOPEN: 'ACCOUNTING_PERIOD_REOPEN',
  ACCOUNTING_REPORT_READ: 'ACCOUNTING_REPORT_READ',
  JOURNAL_ENTRY_CREATE: 'JOURNAL_ENTRY_CREATE',
  JOURNAL_ENTRY_REVERSE: 'JOURNAL_ENTRY_REVERSE',
  JOURNAL_READ: 'JOURNAL_READ',
  LETTERING_CREATE: 'LETTERING_CREATE',
  LETTERING_DELETE: 'LETTERING_DELETE',
  LETTERING_READ: 'LETTERING_READ',

  // ---- erp-stock ----
  CATEGORY_MANAGE: 'CATEGORY_MANAGE',
  CATEGORY_READ: 'CATEGORY_READ',
  MOVEMENT_ADJUST: 'MOVEMENT_ADJUST',
  MOVEMENT_CREATE: 'MOVEMENT_CREATE',
  MOVEMENT_READ: 'MOVEMENT_READ',
  PRODUCT_CREATE: 'PRODUCT_CREATE',
  PRODUCT_DELETE: 'PRODUCT_DELETE',
  PRODUCT_READ: 'PRODUCT_READ',
  PRODUCT_UPDATE: 'PRODUCT_UPDATE',
  WAREHOUSE_CREATE: 'WAREHOUSE_CREATE',
  WAREHOUSE_DELETE: 'WAREHOUSE_DELETE',
  WAREHOUSE_READ: 'WAREHOUSE_READ',
  WAREHOUSE_UPDATE: 'WAREHOUSE_UPDATE',

  // ---- erp-sales ----
  CUSTOMER_CREATE: 'CUSTOMER_CREATE',
  CUSTOMER_DELETE: 'CUSTOMER_DELETE',
  CUSTOMER_READ: 'CUSTOMER_READ',
  CUSTOMER_UPDATE: 'CUSTOMER_UPDATE',
  DELIVERY_MANAGE: 'DELIVERY_MANAGE',
  DELIVERY_READ: 'DELIVERY_READ',
  ORDER_CANCEL: 'ORDER_CANCEL',
  ORDER_CREATE: 'ORDER_CREATE',
  ORDER_DELIVER: 'ORDER_DELIVER',
  ORDER_READ: 'ORDER_READ',
  ORDER_UPDATE: 'ORDER_UPDATE',
  ORDER_VALIDATE: 'ORDER_VALIDATE',
  QUOTE_CREATE: 'QUOTE_CREATE',
  QUOTE_READ: 'QUOTE_READ',
  QUOTE_VALIDATE: 'QUOTE_VALIDATE',

  // ---- erp-billing ----
  INVOICE_CANCEL: 'INVOICE_CANCEL',
  INVOICE_CREATE: 'INVOICE_CREATE',
  INVOICE_READ: 'INVOICE_READ',
  INVOICE_SEND: 'INVOICE_SEND',
  INVOICE_UPDATE: 'INVOICE_UPDATE',
  PAYMENT_READ: 'PAYMENT_READ',
  PAYMENT_RECORD: 'PAYMENT_RECORD',
  PAYMENT_REFUND: 'PAYMENT_REFUND',

  // ---- erp-supplier ----
  PURCHASE_ORDER_CREATE: 'PURCHASE_ORDER_CREATE',
  PURCHASE_ORDER_READ: 'PURCHASE_ORDER_READ',
  PURCHASE_ORDER_VALIDATE: 'PURCHASE_ORDER_VALIDATE',
  SUPPLIER_CREATE: 'SUPPLIER_CREATE',
  SUPPLIER_CREDIT_NOTE_CREATE: 'SUPPLIER_CREDIT_NOTE_CREATE',
  SUPPLIER_CREDIT_NOTE_VALIDATE: 'SUPPLIER_CREDIT_NOTE_VALIDATE',
  SUPPLIER_DELETE: 'SUPPLIER_DELETE',
  SUPPLIER_INVOICE_CANCEL: 'SUPPLIER_INVOICE_CANCEL',
  SUPPLIER_INVOICE_CREATE: 'SUPPLIER_INVOICE_CREATE',
  SUPPLIER_INVOICE_READ: 'SUPPLIER_INVOICE_READ',
  SUPPLIER_INVOICE_VALIDATE: 'SUPPLIER_INVOICE_VALIDATE',
  SUPPLIER_PAYMENT_READ: 'SUPPLIER_PAYMENT_READ',
  SUPPLIER_PAYMENT_RECORD: 'SUPPLIER_PAYMENT_RECORD',
  SUPPLIER_PAYMENT_REFUND: 'SUPPLIER_PAYMENT_REFUND',
  SUPPLIER_READ: 'SUPPLIER_READ',
  SUPPLIER_UPDATE: 'SUPPLIER_UPDATE',

  // ---- erp-messaging ----
  CONVERSATION_CREATE: 'CONVERSATION_CREATE',
  MESSAGE_READ: 'MESSAGE_READ',
  MESSAGE_SEND: 'MESSAGE_SEND',
  SUPPORT_HANDLE: 'SUPPORT_HANDLE',

  // ---- erp-iam ----
  MAIL_SETTINGS_MANAGE: 'MAIL_SETTINGS_MANAGE',
  MAIL_SETTINGS_READ: 'MAIL_SETTINGS_READ',
  PERMISSION_READ: 'PERMISSION_READ',
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
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

/** Top-level module identifiers — the boxes on the Menu Principal. */
export type ModuleKey = 'dashboard' | 'operations' | 'achat' | 'reporting' | 'administration' | 'messagerie' | 'profile';

export interface ModuleDescriptor {
  key: ModuleKey;
  /** French label shown on the Menu Principal box and sidebar section. */
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
 * Module catalogue used by the Menu Principal, mirroring the top level of the
 * sidebar (`structure-sidebar.md`): Tableau de bord · Opérations · Reporting ·
 * Administration · Profil. Finance is a *group inside* Opérations, not a
 * top-level module.
 *
 * There is no dedicated backend permission for reporting, audit or settings;
 * those surfaces are gated on the closest domain permissions, noted inline.
 */
export const MODULES: ModuleDescriptor[] = [
  {
    key: 'dashboard', label: 'Tableau de bord', description: 'Vue d’ensemble et indicateurs',
    icon: 'layout-dashboard', route: '/app/dashboard', anyOf: [],
  },
  {
    key: 'operations', label: 'Opérations', description: 'Stocks, ventes et finance',
    icon: 'boxes', route: '/app/operations/stock/produits',
    accentVar: '--module-operations', accentTintVar: '--module-operations-tint',
    anyOf: [
      Permission.PRODUCT_READ, Permission.CATEGORY_READ, Permission.WAREHOUSE_READ,
      Permission.MOVEMENT_READ, Permission.CUSTOMER_READ, Permission.QUOTE_READ,
      Permission.ORDER_READ, Permission.DELIVERY_READ, Permission.INVOICE_READ,
      Permission.PAYMENT_READ, Permission.ACCOUNT_READ, Permission.JOURNAL_READ,
    ],
  },
  {
    key: 'achat', label: 'Achat', description: 'Fournisseurs, commandes et factures',
    icon: 'truck', route: '/app/achat/fournisseurs',
    accentVar: '--module-operations', accentTintVar: '--module-operations-tint',
    anyOf: [
      Permission.SUPPLIER_READ, Permission.PURCHASE_ORDER_READ, Permission.SUPPLIER_INVOICE_READ,
    ],
  },
  {
    key: 'reporting', label: 'Reporting', description: 'Rapports et exports',
    icon: 'bar-chart', route: '/app/reporting/ventes',
    accentVar: '--module-reporting', accentTintVar: '--module-reporting-tint',
    // No REPORTING_* permission — visible to anyone with meaningful read access.
    anyOf: [
      Permission.ACCOUNTING_REPORT_READ, Permission.PRODUCT_READ, Permission.MOVEMENT_READ,
      Permission.INVOICE_READ, Permission.ORDER_READ, Permission.QUOTE_READ,
    ],
  },
  {
    key: 'messagerie', label: 'Messagerie', description: 'Échanges internes et support',
    icon: 'message-circle', route: '/app/messagerie',
    accentVar: '--module-reporting', accentTintVar: '--module-reporting-tint',
    anyOf: [Permission.MESSAGE_READ],
  },
  {
    key: 'administration', label: 'Administration', description: 'Utilisateurs, rôles et audit',
    icon: 'shield', route: '/app/administration/utilisateurs',
    accentVar: '--module-administration', accentTintVar: '--module-administration-tint',
    // No dedicated AUDIT_* permission — audit/settings ride along with user/role access.
    anyOf: [Permission.USER_READ, Permission.ROLE_READ, Permission.PERMISSION_READ],
  },
  {
    key: 'profile', label: 'Profil', description: 'Informations du compte',
    icon: 'user', route: '/app/profile', anyOf: [],
  },
];

/** True if the user's permission list satisfies a module's `anyOf` rule. */
export function canAccessModule(userPermissions: string[], mod: ModuleDescriptor): boolean {
  if (mod.anyOf.length === 0) return true;
  return mod.anyOf.some((p) => userPermissions.includes(p));
}
