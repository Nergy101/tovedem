/**
 * Central config of routes and required access for the Rol-overzicht (developers) page.
 * Keep in sync with app.routes.ts.
 */
export type RouteAccess = 'public' | 'logged-in' | string[];

export interface RouteAccessEntry {
  path: string;
  label: string;
  access: RouteAccess;
}

export const ROUTE_ACCESS_CONFIG: RouteAccessEntry[] = [
  { path: '', label: 'Home', access: 'public' },
  { path: 'agenda', label: 'Agenda', access: 'public' },
  { path: 'login', label: 'Login', access: 'public' },
  { path: 'signup', label: 'Aanmelden', access: 'public' },
  { path: 'groep/Tovedem', label: 'Groep Tovedem', access: 'public' },
  { path: 'groep/Cloos', label: 'Groep Cloos', access: 'public' },
  { path: 'groep/Mejotos', label: 'Groep Mejotos', access: 'public' },
  { path: 'reserveren', label: 'Reserveren', access: 'public' },
  {
    path: 'reservering-geslaagd',
    label: 'Reservering geslaagd',
    access: 'public',
  },
  { path: 'steunen', label: 'Steunen', access: 'public' },
  { path: 'lid-worden', label: 'Lid worden', access: 'public' },
  { path: 'sinterklaas', label: 'Sinterklaas', access: 'public' },
  { path: 'contact', label: 'Contact', access: 'public' },
  { path: 'privacy-beleid', label: 'Privacy beleid', access: 'public' },
  { path: 'profiel', label: 'Profiel', access: 'logged-in' },
  {
    path: 'reservering-aanpassen/:id/:guid',
    label: 'Reservering aanpassen',
    access: 'logged-in',
  },
  {
    path: 'beheer-nieuwe-leden',
    label: 'Beheer nieuwe leden',
    access: ['admin', 'bestuur'],
  },
  {
    path: 'beheer-reserveringen',
    label: 'Beheer reserveringen',
    access: ['admin', 'bestuur', 'kassa'],
  },
  { path: 'kassa', label: 'Kassa', access: ['admin', 'bestuur', 'kassa'] },
  {
    path: 'printen',
    label: 'Printen',
    access: ['admin', 'bestuur', 'kassa', 'commissie'],
  },
  {
    path: 'beheer-voorstellingen',
    label: 'Beheer voorstellingen',
    access: ['admin', 'bestuur'],
  },
  { path: 'beheer-leden', label: 'Beheer leden', access: ['admin', 'bestuur'] },
  {
    path: 'beheer-spelers',
    label: 'Beheer spelers',
    access: ['admin', 'bestuur'],
  },
  { path: 'beheer-mails', label: 'Beheer mails', access: ['admin', 'bestuur'] },
  {
    path: 'beheer-sponsoren',
    label: 'Beheer sponsoren',
    access: ['admin', 'bestuur'],
  },
  {
    path: 'productie-info/Tovedem',
    label: 'Productie-info Tovedem',
    access: ['admin', 'bestuur', 'lid'],
  },
  {
    path: 'productie-info/Cloos',
    label: 'Productie-info Cloos',
    access: ['admin', 'bestuur', 'lid'],
  },
  {
    path: 'productie-info/Mejotos',
    label: 'Productie-info Mejotos',
    access: ['admin', 'bestuur', 'lid'],
  },
  {
    path: 'commissie-sinterklaas',
    label: 'Commissie Sinterklaas',
    access: ['admin', 'bestuur', 'commissie'],
  },
  {
    path: 'galerij',
    label: 'Galerij',
    access: ['admin', 'bestuur', 'commissie', 'lid'],
  },
  {
    path: 'galerij/:folderId',
    label: 'Galerij folder',
    access: ['admin', 'bestuur', 'commissie', 'lid'],
  },
  {
    path: 'beheer-nieuws',
    label: 'Beheer nieuws',
    access: ['admin', 'bestuur'],
  },
  {
    path: 'algemene-informatie',
    label: 'Algemene informatie',
    access: ['admin', 'bestuur', 'lid'],
  },
];

/**
 * Returns the required roles for a route path. Used by app.routes to configure loggedInGuard.
 * - For 'logged-in' only: returns [] (any logged-in user).
 * - For role-protected: returns the roles array.
 * - For public or unknown path: returns [] (caller should not use guard for public routes).
 */
export function getRequiredRoles(path: string): string[] {
  const entry = ROUTE_ACCESS_CONFIG.find((e) => e.path === path);
  if (!entry || entry.access === 'public') {
    return [];
  }
  if (entry.access === 'logged-in') {
    return [];
  }
  return entry.access as string[];
}
