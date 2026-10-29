import {
  forwardRef,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useMemo,
} from 'react';
import {
  type DashboardHost,
  DashboardHostProvider,
  type DashboardLinkProps,
} from '@s2-dev/dashboard';
import { navigate, type ParsedRoute } from './router';

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !event.defaultPrevented
  );
}

const LiteLink = forwardRef<HTMLAnchorElement, DashboardLinkProps>(
  function LiteLink(
    { href, scroll: _scroll, onClick, children, ...rest },
    ref
  ) {
    return (
      <a
        ref={ref}
        href={href}
        onClick={(event) => {
          onClick?.(event);
          if (isPlainLeftClick(event) && !rest.target) {
            event.preventDefault();
            navigate(href);
          }
        }}
        {...rest}
      >
        {children}
      </a>
    );
  }
);

const ORIGIN = window.location.origin;
const getToken = async (): Promise<string> => '';

/* Same-origin s2-lite: no credentials, no cloud-only features. */
export function LiteDashboardHost({
  route,
  children,
}: {
  route: ParsedRoute;
  children: ReactNode;
}): ReactElement {
  const host = useMemo<DashboardHost>(
    () => ({
      getToken,
      endpoints: { account: ORIGIN, basin: ORIGIN },
      scopeKey: 'lite',
      capabilities: { locations: false, storageClasses: false },
      route: {
        pathname: route.pathname,
        basinId: route.basinId,
        searchParams: route.searchParams,
      },
      navigate,
      Link: LiteLink,
    }),
    [route]
  );
  return <DashboardHostProvider value={host}>{children}</DashboardHostProvider>;
}
