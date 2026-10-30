import type { ReadInput } from '@s2-dev/streamstore';
import type { StudioAppendInput } from './api';
import { shellQuote } from '../lib/shell';

function toAbsoluteEndpoint(endpoint: string): string {
  return /^https?:\/\//i.test(endpoint) ? endpoint : `https://${endpoint}`;
}

function toEpochMillis(value: number | Date): number {
  return value instanceof Date ? value.getTime() : value;
}

function makeReadBaseUrl(
  basinName: string,
  basinTemplate = '{basin}.b.s2.dev'
): string {
  const endpoint = basinTemplate.includes('{basin}')
    ? basinTemplate.replace('{basin}', basinName)
    : basinTemplate;

  const parsed = new URL(toAbsoluteEndpoint(endpoint));
  if (!parsed.pathname || parsed.pathname === '/') {
    parsed.pathname = '/v1';
  }
  return parsed.toString().replace(/\/$/, '');
}

function buildReadQueryParams(input: ReadInput): URLSearchParams {
  const params = new URLSearchParams();

  if (input.start?.from) {
    if ('seqNum' in input.start.from) {
      params.set('seq_num', String(input.start.from.seqNum));
    } else if ('timestamp' in input.start.from) {
      params.set(
        'timestamp',
        String(toEpochMillis(input.start.from.timestamp))
      );
    } else if ('tailOffset' in input.start.from) {
      params.set('tail_offset', String(input.start.from.tailOffset));
    }
  }

  if (input.start?.clamp !== undefined) {
    params.set('clamp', String(input.start.clamp));
  }

  if (input.stop?.limits?.count !== undefined) {
    params.set('count', String(input.stop.limits.count));
  }

  if (input.stop?.limits?.bytes !== undefined) {
    params.set('bytes', String(input.stop.limits.bytes));
  }

  if (input.stop?.untilTimestamp !== undefined) {
    params.set('until', String(toEpochMillis(input.stop.untilTimestamp)));
  }

  if (input.stop?.waitSecs !== undefined) {
    params.set('wait', String(input.stop.waitSecs));
  }

  return params;
}

function requestHeaders(
  basinName: string,
  token?: string,
  encryptionKey?: string
): string {
  const headers = [
    token !== undefined
      ? shellQuote(`Authorization: Bearer ${token}`)
      : '"Authorization: Bearer ${S2_ACCESS_TOKEN}"',
    shellQuote(`s2-basin: ${basinName}`),
  ];
  if (encryptionKey?.trim()) {
    headers.push(shellQuote(`s2-encryption-key: ${encryptionKey.trim()}`));
  }
  return headers.map((header) => `  -H ${header}`).join(' \\\n');
}

export function buildReadCurlCommand(
  basinName: string,
  streamName: string,
  input: ReadInput,
  streaming: boolean,
  token?: string,
  basinEndpoint?: string,
  encryptionKey?: string
): string {
  const baseUrl = makeReadBaseUrl(basinName, basinEndpoint);
  const url = new URL(
    `${baseUrl}/streams/${encodeURIComponent(streamName)}/records`
  );
  const params = buildReadQueryParams(input);
  if (params.toString()) {
    url.search = params.toString();
  }

  const headers = requestHeaders(basinName, token, encryptionKey);
  return [
    streaming ? 'curl -N' : 'curl',
    headers,
    ...(streaming ? ['  -H "Accept: text/event-stream"'] : []),
    `  ${shellQuote(url.toString())}`,
  ].join(' \\\n');
}

export function buildAppendCurlCommand(
  basinName: string,
  streamName: string,
  input: StudioAppendInput,
  token?: string,
  basinEndpoint?: string,
  encryptionKey?: string
): string {
  const baseUrl = makeReadBaseUrl(basinName, basinEndpoint);
  const url = `${baseUrl}/streams/${encodeURIComponent(streamName)}/records`;

  const body = JSON.stringify({
    records: input.records.map((record) => ({
      body: record.body,
      ...(record.headers ? { headers: record.headers } : {}),
      ...(record.timestamp !== undefined
        ? { timestamp: toEpochMillis(record.timestamp) }
        : {}),
    })),
    ...(input.matchSeqNum !== undefined
      ? { match_seq_num: input.matchSeqNum }
      : {}),
    ...(input.fencingToken !== undefined
      ? { fencing_token: input.fencingToken }
      : {}),
  });

  return [
    'curl -X POST',
    requestHeaders(basinName, token, encryptionKey),
    '  -H "Content-Type: application/json"',
    `  --data ${shellQuote(body)}`,
    `  ${shellQuote(url)}`,
  ].join(' \\\n');
}
