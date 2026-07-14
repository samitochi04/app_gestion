/**
 * Resolves our CSS custom-property chart palette (themes.css) into concrete
 * color strings ngx-charts can consume (it needs real values, not var()).
 * Call at render time so a live theme switch updates the chart on next paint.
 */
export function resolveChartColors(count = 4): string[] {
  const style = getComputedStyle(document.documentElement);
  const vars = ['--chart-1', '--chart-2', '--chart-3', '--chart-4'];
  const colors = vars.map((v) => style.getPropertyValue(v).trim() || '#94a3b8');
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
}

export function resolveTextColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim() || '#5b6472';
}
