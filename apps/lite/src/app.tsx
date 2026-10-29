import { type ReactElement, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Basins, Streams, Studio, Toaster } from '@s2-dev/dashboard';
import { LiteDashboardHost } from './lite-host';
import { navigate, parseRoute, useLocationHref } from './router';
import { useTheme } from './theme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

function ThemeToggle(): ReactElement {
  const [theme, toggle] = useTheme();
  const label =
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon(): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon(): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function Header(): ReactElement {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <a href="/dashboard/basins" className="font-mono text-sm font-semibold">
        s2-lite
      </a>
      <div className="flex items-center gap-3">
        <a
          href="https://s2.dev/docs"
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground text-sm hover:underline"
        >
          Docs
        </a>
        <ThemeToggle />
      </div>
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
      return (
        <div className="mx-auto max-w-3xl">
          <Basins />
        </div>
      );
    case 'streams':
      return (
        <div className="mx-auto flex max-w-[1240px] gap-6">
          <aside className="hidden w-80 shrink-0 xl:block">
            <Basins />
          </aside>
          <div className="flex min-w-0 flex-1 justify-center">
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
