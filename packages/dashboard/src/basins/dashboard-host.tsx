'use client';
import {
  type AnchorHTMLAttributes,
  type ComponentType,
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { S2, type S2EndpointsInit } from '@s2-dev/streamstore';
import { setToastSink, type ToastFn } from '../ui/use-toast';

/* Cloud-only features a host may enable. Everything else works against any S2 server. */
export interface DashboardCapabilities {
  /* Offer a location picker when creating a basin (`listLocations`). */
  locations: boolean;
}

/* Host-rendered content for cloud-only sections. A slot that is absent hides its UI. */
export interface DashboardSlots {
  /* Body of the Metrics tab on a basin's streams page. */
  BasinMetrics?: ComponentType<{ basinId: string }>;
  /* Body of the Private Connectivity tab on the basins page. */
  PrivateConnectivity?: ComponentType;
}

export interface DashboardRoute {
  pathname: string;
  basinId?: string;
  searchParams: URLSearchParams;
}

export interface DashboardLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> {
  href: string;
  /* Hint that the host router should keep the scroll position. */
  scroll?: boolean;
  children?: ReactNode;
}

export type DashboardToast = ToastFn;

export interface DashboardHost {
  /* Bearer token for S2 requests: '' for a tokenless local server, null when unavailable. */
  getToken: () => Promise<string | null>;
  /* S2 endpoints; undefined means the SDK defaults (s2.dev cloud). */
  endpoints?: S2EndpointsInit;
  /* Partitions react-query caches between accounts; null/undefined when there is one scope. */
  scopeKey: string | null | undefined;
  capabilities: DashboardCapabilities;
  slots?: DashboardSlots;
  /* Cloud-only: refresh the account tier after a tier-related error and return a fresh token. */
  recoverFromTierError?: () => Promise<string | null>;
  route: DashboardRoute;
  navigate: (
    href: string,
    options?: { replace?: boolean; scroll?: boolean }
  ) => void;
  Link: ComponentType<DashboardLinkProps>;
  /* Route toasts to the host's own toaster instead of the bundled one. */
  toast?: DashboardToast;
}

export interface DashboardHostValue extends DashboardHost {
  /* S2 client for the host's token and endpoints; null when no token is available. */
  getClient: () => Promise<S2 | null>;
}

const DashboardHostContext = createContext<DashboardHost | null>(null);

export function createDashboardClient(
  accessToken: string,
  endpoints?: S2EndpointsInit
): S2 {
  return new S2({ accessToken, endpoints });
}

export function DashboardHostProvider({
  value,
  children,
}: {
  value: DashboardHost;
  children: ReactNode;
}): ReactElement {
  const hostToast = value.toast;
  useEffect(() => {
    setToastSink(hostToast ?? null);
    return () => setToastSink(null);
  }, [hostToast]);
  return (
    <DashboardHostContext.Provider value={value}>
      {children}
    </DashboardHostContext.Provider>
  );
}

export function useDashboardHost(): DashboardHostValue {
  const host = useContext(DashboardHostContext);
  const getToken = host?.getToken;
  const endpoints = host?.endpoints;
  const getClient = useCallback(async (): Promise<S2 | null> => {
    const token = getToken ? await getToken() : null;
    return token === null ? null : createDashboardClient(token, endpoints);
  }, [getToken, endpoints]);
  const value = useMemo(
    () => (host ? { ...host, getClient } : null),
    [host, getClient]
  );
  if (!value) {
    throw new Error('useDashboardHost requires a DashboardHostProvider');
  }
  return value;
}
