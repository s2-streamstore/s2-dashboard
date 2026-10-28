export { default as Basins } from './basins/Basins';
export { default as Streams } from './basins/Streams';
export { default as Studio } from './basins/Studio';
export {
  DashboardHostProvider,
  useDashboardHost,
  createDashboardClient,
  type DashboardHost,
  type DashboardCapabilities,
  type DashboardSlots,
  type DashboardRoute,
  type DashboardLinkProps,
  type DashboardToast,
} from './basins/dashboard-host';
export { isTierRelatedError } from './basins/api';
export { default as Loading } from './components/Loading';
export { default as EmptyList } from './components/EmptyList';
export { Toaster } from './ui/toaster';
export { toast, useToast } from './ui/use-toast';
export {
  isDashboardSection,
  type DashboardSection,
} from './lib/dashboard-routes';
