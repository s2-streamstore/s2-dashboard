/**
 * Dashboard section detection.
 *
 * These checks must be route-aware rather than substring matches: basin names
 * are freeform and may themselves contain a section name (e.g. a basin called
 * `my-basins-project` viewed at `/dashboard/metrics/my-basins-project`), so
 * `pathname.includes('basins')` matches the resource name and misroutes links.
 */
export type DashboardSection =
  'welcome' | 'basins' | 'metrics' | 'billing' | 'access-tokens';

export function isDashboardSection(
  pathname: string,
  section: DashboardSection
): boolean {
  const base = `/dashboard/${section}`;
  return pathname === base || pathname.startsWith(`${base}/`);
}
