import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import {
  DashboardHostProvider,
  type DashboardHost,
} from '../packages/dashboard/src/basins/dashboard-host';

export function renderDashboard(
  view: ReactElement,
  overrides: Partial<DashboardHost> = {}
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, cacheTime: 0 } },
  });
  let host: DashboardHost = {
    getToken: async () => 'test-token',
    scopeKey: 'account-a',
    capabilities: { locations: false, storageClasses: false },
    route: {
      pathname: '/dashboard/basins',
      searchParams: new URLSearchParams(),
    },
    navigate: vi.fn(),
    Link: ({ href, children, scroll: _scroll, ...props }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
    ...overrides,
  };
  const tree = () => (
    <QueryClientProvider client={client}>
      <DashboardHostProvider value={host}>{view}</DashboardHostProvider>
    </QueryClientProvider>
  );
  const result = render(tree());
  return {
    ...result,
    client,
    updateHost(changes: Partial<DashboardHost>) {
      host = { ...host, ...changes };
      result.rerender(tree());
    },
  };
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
