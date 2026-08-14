import { Permission, PermissionKey } from '../../../core/models/permission.enum';

/**
 * The navigation tree, declared once and consumed by the sidebar.
 *
 * It mirrors `structure-sidebar.md` exactly:
 *
 *   Tableau de bord
 *   Opérations ─ Stocks · Ventes · Finance
 *   Reporting  ─ Finances · Stocks · Ventes
 *   Administration ─ Utilisateurs · Rôles · Audit · Paramètres
 *   Profil
 *
 * Keeping the tree as data rather than markup means the template stays a
 * rendering concern and the structure can be asserted in a test.
 */

/** A leaf: one route. `anyOf` mirrors the route's `permissionGuard` data. */
export interface NavLink {
  label: string;
  route: string;
  /** User needs at least one. Empty/absent = visible to any authenticated user. */
  anyOf?: PermissionKey[];
}

/** A second-level heading inside a section (Stocks, Ventes, Finance). */
export interface NavGroup {
  key: string;
  label: string;
  icon: string;
  links: NavLink[];
}

/**
 * A first-level entry. Either a direct link (Tableau de bord, Profil) or a
 * collapsible section holding groups and/or links.
 */
export interface NavSection {
  key: string;
  label: string;
  icon: string;
  /** Module branding color (themes.css) — decorative, never a status signal. */
  accent?: string;
  /** Second-level headings. Mutually informative with `links`; both may exist. */
  groups?: NavGroup[];
  /** Links attached straight to the section, with no intermediate heading. */
  links?: NavLink[];
}

export const NAV_DASHBOARD: NavLink = {
  label: 'Tableau de bord',
  route: '/app/dashboard',
};

export const NAV_PROFILE: NavLink = {
  label: 'Profil',
  route: '/app/profile',
};

export const NAV_SECTIONS: NavSection[] = [
  {
    key: 'operations',
    label: 'Opérations',
    icon: 'boxes',
    accent: 'var(--module-operations)',
    groups: [
      {
        key: 'operations.stocks',
        label: 'Stocks',
        icon: 'package',
        links: [
          { label: 'Produits', route: '/app/operations/stock/produits', anyOf: [Permission.PRODUCT_READ] },
          { label: 'Catégories', route: '/app/operations/stock/categories', anyOf: [Permission.CATEGORY_READ] },
          { label: 'Mouvements', route: '/app/operations/stock/mouvements', anyOf: [Permission.MOVEMENT_READ] },
          { label: 'Entrepôts', route: '/app/operations/stock/entrepots', anyOf: [Permission.WAREHOUSE_READ] },
        ],
      },
      {
        key: 'operations.ventes',
        label: 'Ventes',
        icon: 'shopping-cart',
        links: [
          { label: 'Clients', route: '/app/operations/ventes/clients', anyOf: [Permission.CUSTOMER_READ] },
          { label: 'Devis', route: '/app/operations/ventes/devis', anyOf: [Permission.QUOTE_READ] },
          { label: 'Commandes', route: '/app/operations/ventes/commandes', anyOf: [Permission.ORDER_READ] },
          { label: 'Livraisons', route: '/app/operations/ventes/livraisons', anyOf: [Permission.ORDER_READ, Permission.DELIVERY_READ] },
        ],
      },
      {
        key: 'operations.finance',
        label: 'Finance',
        icon: 'wallet',
        links: [
          { label: 'Factures', route: '/app/operations/finance/factures', anyOf: [Permission.INVOICE_READ] },
          { label: 'Avoirs', route: '/app/operations/finance/avoirs', anyOf: [Permission.INVOICE_READ] },
          { label: 'Paiements', route: '/app/operations/finance/paiements', anyOf: [Permission.PAYMENT_READ] },
          {
            label: 'Comptabilité',
            route: '/app/operations/finance/comptabilite',
            anyOf: [Permission.ACCOUNT_READ, Permission.JOURNAL_READ, Permission.ACCOUNTING_REPORT_READ],
          },
        ],
      },
    ],
  },
  {
    key: 'achat',
    label: 'Achat',
    icon: 'truck',
    accent: 'var(--module-operations)',
    links: [
      { label: 'Fournisseurs', route: '/app/achat/fournisseurs', anyOf: [Permission.SUPPLIER_READ] },
      { label: 'Commandes', route: '/app/achat/commandes', anyOf: [Permission.PURCHASE_ORDER_READ] },
      { label: 'Factures', route: '/app/achat/factures', anyOf: [Permission.SUPPLIER_INVOICE_READ] },
      { label: 'Avoirs', route: '/app/achat/avoirs', anyOf: [Permission.SUPPLIER_INVOICE_READ] },
    ],
  },
  {
    key: 'messagerie',
    label: 'Messagerie',
    icon: 'message-circle',
    accent: 'var(--module-reporting)',
    links: [
      { label: 'Conversations', route: '/app/messagerie', anyOf: [Permission.MESSAGE_READ] },
    ],
  },
  {
    key: 'reporting',
    label: 'Reporting',
    icon: 'bar-chart',
    accent: 'var(--module-reporting)',
    links: [
      { label: 'Finances', route: '/app/reporting/finances', anyOf: [Permission.ACCOUNTING_REPORT_READ, Permission.INVOICE_READ, Permission.PAYMENT_READ] },
      { label: 'Stocks', route: '/app/reporting/stock', anyOf: [Permission.PRODUCT_READ, Permission.MOVEMENT_READ, Permission.WAREHOUSE_READ] },
      { label: 'Ventes', route: '/app/reporting/ventes', anyOf: [Permission.ORDER_READ, Permission.QUOTE_READ, Permission.CUSTOMER_READ] },
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    icon: 'shield',
    accent: 'var(--module-administration)',
    links: [
      { label: 'Utilisateurs', route: '/app/administration/utilisateurs', anyOf: [Permission.USER_READ] },
      { label: 'Rôles', route: '/app/administration/roles', anyOf: [Permission.ROLE_READ] },
      { label: 'Audit', route: '/app/administration/audit', anyOf: [Permission.USER_READ, Permission.ROLE_READ] },
      // Company settings are readable by anyone who may read users; theme
      // preferences are personal. No dedicated backend permission exists.
      { label: 'Paramètres', route: '/app/administration/parametres' },
    ],
  },
];

/** True when the user holds at least one of the link's permissions. */
export function canSeeLink(permissions: readonly string[], link: NavLink): boolean {
  return !link.anyOf?.length || link.anyOf.some((p) => permissions.includes(p));
}

/** Groups and sections disappear once every link inside them is hidden. */
export function visibleGroups(permissions: readonly string[], section: NavSection): NavGroup[] {
  return (section.groups ?? [])
    .map((g) => ({ ...g, links: g.links.filter((l) => canSeeLink(permissions, l)) }))
    .filter((g) => g.links.length > 0);
}

export function visibleLinks(permissions: readonly string[], section: NavSection): NavLink[] {
  return (section.links ?? []).filter((l) => canSeeLink(permissions, l));
}

export function visibleSections(permissions: readonly string[]): NavSection[] {
  return NAV_SECTIONS.map((s) => ({
    ...s,
    groups: visibleGroups(permissions, s),
    links: visibleLinks(permissions, s),
  })).filter((s) => (s.groups?.length ?? 0) > 0 || (s.links?.length ?? 0) > 0);
}
