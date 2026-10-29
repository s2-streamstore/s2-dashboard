import { useSyncExternalStore } from 'react';

const NAVIGATE_EVENT = 'lite-dashboard:navigate';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

function snapshot(): string {
  return window.location.pathname + window.location.search;
}

export function useLocationHref(): string {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function navigate(href: string, options?: { replace?: boolean }): void {
  if (options?.replace) {
    window.history.replaceState(null, '', href);
  } else {
    window.history.pushState(null, '', href);
  }
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

const BASIN_ROUTE = /^\/dashboard\/basins\/([^/]+)(\/studio)?\/?$/;

export interface ParsedRoute {
  pathname: string;
  searchParams: URLSearchParams;
  basinId?: string;
  view: 'basins' | 'streams' | 'studio' | 'server' | 'unknown';
}

export function parseRoute(href: string): ParsedRoute {
  const url = new URL(href, window.location.origin);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const match = BASIN_ROUTE.exec(pathname);
  if (match) {
    return {
      pathname,
      searchParams: url.searchParams,
      basinId: decodeURIComponent(match[1]),
      view: match[2] ? 'studio' : 'streams',
    };
  }
  if (pathname === '/dashboard/basins') {
    return { pathname, searchParams: url.searchParams, view: 'basins' };
  }
  if (pathname === '/dashboard/server') {
    return { pathname, searchParams: url.searchParams, view: 'server' };
  }
  return { pathname, searchParams: url.searchParams, view: 'unknown' };
}
