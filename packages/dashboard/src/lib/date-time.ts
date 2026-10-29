export function formatUTCDateTime(input: Date | string | number): string {
  return new Date(input).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

export function formatUTCTimestamp(input: Date | string | number): string {
  const iso = new Date(input).toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC`;
}

export function formatUTCTime(input: Date | string | number): string {
  return new Date(input).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

export function toUTCDateTimeValue(date: Date): string {
  return date.toISOString().slice(0, 16);
}

export function parseUTCTimestamp(value: string): Date | null {
  const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(
    value
  )
    ? `${value}Z`
    : value;
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
