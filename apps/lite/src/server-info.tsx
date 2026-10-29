import { type ReactElement } from 'react';
import { useQuery } from 'react-query';

export type StoreInfo =
  | { kind: 'memory' }
  | { kind: 'local'; root: string }
  | { kind: 's3'; bucket: string };

export interface ServerInfo {
  version: string;
  started_at: string;
  store: StoreInfo;
  wal: StoreInfo | null;
  path: string;
  flush_interval_ms: number | null;
  tls: 'none' | 'self_signed' | 'certificate';
  port: number;
  cors: boolean;
  init_file: string | null;
  append_inflight_bytes: number;
}

async function fetchServerInfo(): Promise<ServerInfo> {
  const res = await fetch('/dashboard/config.json');
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as ServerInfo;
}

export function useServerInfo(): ReturnType<typeof useQuery<ServerInfo>> {
  return useQuery<ServerInfo>('lite-server-info', fetchServerInfo, {
    staleTime: Infinity,
  });
}

function describeStore(store: StoreInfo): string {
  switch (store.kind) {
    case 'memory':
      return 'In-memory';
    case 'local':
      return store.root;
    case 's3':
      return `s3://${store.bucket}`;
  }
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KiB', 'MiB', 'GiB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${units[unit]}`;
}

export function StoreChip(): ReactElement | null {
  const { data } = useServerInfo();
  if (!data) {
    return null;
  }
  const label = data.store.kind === 'memory' ? 'memory' : data.store.kind;
  const title =
    data.store.kind === 'memory'
      ? 'In-memory store: data is lost on restart'
      : `Store: ${describeStore(data.store)}`;
  return (
    <a
      href="/dashboard/server"
      title={title}
      className={`rounded-full border px-2 py-0.5 font-mono text-[11px] ${
        data.store.kind === 'memory'
          ? 'border-amber-500/40 text-amber-600 dark:text-amber-400'
          : 'text-muted-foreground'
      }`}
    >
      {label}
    </a>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): ReactElement {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b py-2 text-sm last:border-b-0">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="min-w-0 truncate text-right font-mono">{children}</dd>
    </div>
  );
}

export function ServerPage(): ReactElement {
  const { data, error, isLoading } = useServerInfo();
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }
  if (error || !data) {
    return (
      <p className="text-destructive text-sm dark:text-red-400">
        Could not load server configuration.
      </p>
    );
  }
  const tls = {
    none: 'Off (plain HTTP)',
    self_signed: 'Self-signed certificate',
    certificate: 'Provided certificate',
  }[data.tls];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Server</h1>
        <p className="text-muted-foreground text-sm">
          How this s2-lite instance was configured at startup.
        </p>
      </div>
      {data.store.kind === 'memory' && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          This instance uses an in-memory store. Basins, streams and records are
          lost when the process exits. Start with{' '}
          <code className="font-mono">--local-root</code> or{' '}
          <code className="font-mono">--bucket</code> for durable storage.
        </div>
      )}
      <dl className="rounded-md border px-3">
        <Row label="Version">{data.version}</Row>
        <Row label="Started">
          {data.started_at.replace('T', ' ').slice(0, 19)} UTC
        </Row>
        <Row label="Store">{describeStore(data.store)}</Row>
        <Row label="WAL store">
          {data.wal ? describeStore(data.wal) : 'Same as store'}
        </Row>
        {data.path && <Row label="Path">{data.path}</Row>}
        <Row label="Flush interval">
          {data.flush_interval_ms === null
            ? '—'
            : `${data.flush_interval_ms} ms`}
        </Row>
        <Row label="Port">{data.port}</Row>
        <Row label="TLS">{tls}</Row>
        <Row label="CORS">{data.cors ? 'Permissive' : 'Disabled'}</Row>
        <Row label="Init file">{data.init_file ?? '—'}</Row>
        <Row label="Append in-flight limit">
          {formatBytes(data.append_inflight_bytes)}
        </Row>
      </dl>
    </div>
  );
}
