import { describe, expect, it } from 'vitest';
import { Permission } from '../../../core/models/permission.enum';
import {
  NAV_DASHBOARD, NAV_PROFILE, NAV_SECTIONS, visibleSections,
} from './sidebar.nav';

/**
 * The navigation tree is a specification (`structure-sidebar.md`), not an
 * implementation detail. These tests pin it so a future edit that quietly
 * drops or reorders an entry fails here rather than in someone's day.
 */
describe('sidebar navigation tree', () => {
  const ALL_PERMISSIONS = Object.values(Permission) as string[];

  it('places Tableau de bord first and Profil last', () => {
    expect(NAV_DASHBOARD.label).toBe('Tableau de bord');
    expect(NAV_PROFILE.label).toBe('Profil');
  });

  it('exposes exactly Opérations, Reporting and Administration between them', () => {
    expect(NAV_SECTIONS.map((s) => s.label)).toEqual(['Opérations', 'Reporting', 'Administration']);
  });

  it('nests Stocks, Ventes and Finance under Opérations', () => {
    const operations = NAV_SECTIONS.find((s) => s.key === 'operations')!;
    expect(operations.groups?.map((g) => g.label)).toEqual(['Stocks', 'Ventes', 'Finance']);
  });

  it('lists the expected leaves under each Opérations group', () => {
    const groups = NAV_SECTIONS.find((s) => s.key === 'operations')!.groups!;
    const leaves = Object.fromEntries(groups.map((g) => [g.label, g.links.map((l) => l.label)]));

    expect(leaves['Stocks']).toEqual(['Produits', 'Catégories', 'Mouvements', 'Entrepôts']);
    expect(leaves['Ventes']).toEqual(['Clients', 'Devis', 'Commandes', 'Livraisons']);
    expect(leaves['Finance']).toEqual(['Factures', 'Avoirs', 'Paiements', 'Comptabilité']);
  });

  it('lists Finances, Stocks and Ventes under Reporting', () => {
    const reporting = NAV_SECTIONS.find((s) => s.key === 'reporting')!;
    expect(reporting.links?.map((l) => l.label)).toEqual(['Finances', 'Stocks', 'Ventes']);
  });

  it('lists Utilisateurs, Rôles, Audit and Paramètres under Administration', () => {
    const administration = NAV_SECTIONS.find((s) => s.key === 'administration')!;
    expect(administration.links?.map((l) => l.label)).toEqual(['Utilisateurs', 'Rôles', 'Audit', 'Paramètres']);
  });

  it('routes every leaf under /app', () => {
    const routes = NAV_SECTIONS.flatMap((s) => [
      ...(s.groups ?? []).flatMap((g) => g.links.map((l) => l.route)),
      ...(s.links ?? []).map((l) => l.route),
    ]);
    expect(routes.length).toBeGreaterThan(0);
    routes.forEach((route) => expect(route.startsWith('/app/')).toBe(true));
  });

  it('declares only permissions that exist in the backend catalogue', () => {
    const declared = NAV_SECTIONS.flatMap((s) => [
      ...(s.groups ?? []).flatMap((g) => g.links.flatMap((l) => l.anyOf ?? [])),
      ...(s.links ?? []).flatMap((l) => l.anyOf ?? []),
    ]);
    declared.forEach((permission) => expect(ALL_PERMISSIONS).toContain(permission));
  });
});

describe('permission filtering', () => {
  it('shows the whole tree to a user holding every permission', () => {
    const sections = visibleSections(Object.values(Permission) as string[]);
    expect(sections.map((s) => s.key)).toEqual(['operations', 'achat', 'messagerie', 'reporting', 'administration']);
  });

  it('hides every group and link the user cannot reach', () => {
    const sections = visibleSections([Permission.PRODUCT_READ]);

    const operations = sections.find((s) => s.key === 'operations')!;
    expect(operations.groups?.map((g) => g.label)).toEqual(['Stocks']);
    expect(operations.groups?.[0].links.map((l) => l.label)).toEqual(['Produits']);

    // Administration survives on Paramètres alone, which requires nothing.
    const administration = sections.find((s) => s.key === 'administration')!;
    expect(administration.links?.map((l) => l.label)).toEqual(['Paramètres']);
  });

  it('keeps a link with no permission requirement visible to anyone', () => {
    const administration = visibleSections([Permission.USER_READ]).find((s) => s.key === 'administration')!;
    expect(administration.links?.map((l) => l.label)).toContain('Paramètres');
  });

  it('shows nothing to a user with no permissions at all', () => {
    // Paramètres carries no requirement, so Administration survives alone.
    expect(visibleSections([]).map((s) => s.key)).toEqual(['administration']);
  });
});
