import { type ReactElement, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Basins, Streams, Studio, Toaster } from '@s2-dev/dashboard';
import { LiteDashboardHost } from './lite-host';
import { navigate, parseRoute, useLocationHref } from './router';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

function Header(): ReactElement {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <a href="/dashboard/basins" className="font-mono text-sm font-semibold">
        s2-lite
      </a>
      <a
        href="https://s2.dev/docs"
        target="_blank"
        rel="noreferrer"
        className="text-muted-foreground text-sm hover:underline"
      >
        Docs
      </a>
    </header>
  );
}

function View({
  view,
}: {
  view: ReturnType<typeof parseRoute>['view'];
}): ReactElement | null {
  switch (view) {
    case 'basins':
      return <Basins />;
    case 'streams':
      return (
        <div className="flex gap-6">
          <aside className="hidden w-80 shrink-0 xl:block">
            <Basins />
          </aside>
          <div className="min-w-0 flex-1">
            <Streams />
          </div>
        </div>
      );
    case 'studio':
      return <Studio />;
    default:
      return null;
  }
}

export default function App(): ReactElement {
  const href = useLocationHref();
  const route = parseRoute(href);

  useEffect(() => {
    if (route.view === 'unknown') {
      navigate('/dashboard/basins', { replace: true });
    }
  }, [route.view]);

  return (
    <QueryClientProvider client={queryClient}>
      <LiteDashboardHost route={route}>
        <Header />
        <main className="mx-auto w-full max-w-screen-2xl p-4">
          <View view={route.view} />
        </main>
        <Toaster />
      </LiteDashboardHost>
    </QueryClientProvider>
  );
}
