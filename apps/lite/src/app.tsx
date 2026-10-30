import { type ReactElement, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Basins, Streams, Studio, Toaster } from '@s2-dev/dashboard';
import { LiteDashboardHost } from './lite-host';
import { navigate, parseRoute, useLocationHref } from './router';
import { ServerPage, StoreChip } from './server-info';
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

function S2Logo(): ReactElement {
  return (
    <svg
      viewBox="0 0 81.84 81.84"
      className="size-6"
      fill="currentColor"
      aria-label="S2"
    >
      <path d="M46.39,27.41c-9.45,1.11-8.37,12.95.54,13.34,2.32.14,5.46.3,7.79.4.97.03,2.16.05,3.16.16,8.14.64,14.04,8.8,10.96,16.71-2.21,6.16-9.23,8.78-15.2,8.23-6.64-.21-13.6-1.21-20.12-1.21-3.3.18-6.84,0-9.9,1.35-4.98,2.09-6.04,9.19-2.48,12.81,1.57,1.66,3.85,2.54,6.51,2.64h38.92c8.44,0,15.28-6.84,15.28-15.28V25.68c-9.21,5.05-25.71.96-35.45,1.73Z" />
      <path d="M26.05,58.21c9.81-.46,19.46,1.52,29.15,1.74,3.01.07,6.29-1.36,7.3-4.31.81-2.29.25-5.1-1.64-6.79-1.51-1.51-4.15-1.77-6.31-1.75-5.35-.13-11.21.56-15.71-3.05-6.36-4.73-6.39-15.02.22-19.52,5.57-3.9,12.48-2.66,18.69-2.43,7.66.24,24.89,2.68,23.98-8.63-.9-7.58-7.34-13.46-15.17-13.46H15.28C6.84,0,0,6.84,0,15.28v51.28c0,6.99,4.69,12.87,11.09,14.69-3.87-10.42,2.98-22.59,14.96-23.03Z" />
    </svg>
  );
}

function Header(): ReactElement {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <a
        href="/dashboard/basins"
        className="flex items-center gap-2 text-sm font-semibold"
      >
        <S2Logo />
        <span className="text-muted-foreground font-mono">s2-lite</span>
      </a>
      <div className="flex items-center gap-3">
        <StoreChip />
        <a
          href="/dashboard/server"
          className="text-muted-foreground text-sm hover:underline"
        >
          Server
        </a>
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
    case 'streams': {
      // Keep <Basins /> at the same tree position in both views. Remounting it
      // when navigating into a basin cancels its in-flight list refetch, so
      // the list would still show the state from before a create or delete.
      const withStreams = view === 'streams';
      return (
        <div
          className={
            withStreams
              ? 'mx-auto flex max-w-[1240px] gap-6'
              : 'mx-auto max-w-3xl'
          }
        >
          <div
            className={
              withStreams ? 'hidden w-80 shrink-0 xl:block' : undefined
            }
          >
            <Basins />
          </div>
          {withStreams && (
            <div className="flex min-w-0 flex-1 justify-center">
              <Streams />
            </div>
          )}
        </div>
      );
    }
    case 'studio':
      return <Studio />;
    case 'server':
      return (
        <div className="mx-auto max-w-xl">
          <ServerPage />
        </div>
      );
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
