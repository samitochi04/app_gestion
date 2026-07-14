export const environment = {
  production: false,
  /** Backend base URL (test-backend.md). Override per deployment. */
  apiBaseUrl: 'http://51.75.248.25:8084',
  appName: 'KIT — Gestion',
  /** Default UI theme on first load; ThemeService persists user choice. */
  defaultTheme: 'light' as const,
};
