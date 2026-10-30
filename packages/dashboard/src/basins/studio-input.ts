export function parseMatchSeqNum(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!/^\d+$/.test(trimmed) || !Number.isSafeInteger(parsed)) {
    throw new Error(
      'Match sequence number must be a non-negative safe integer.'
    );
  }
  return parsed;
}

export function parseRecordTimestamp(
  value: unknown,
  index: number
): number | undefined {
  if (value === undefined || value === null) return undefined;
  const millis =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? new Date(value).getTime()
        : NaN;
  if (!Number.isFinite(millis) || millis < 0) {
    throw new Error(
      `Record ${index} has an invalid timestamp; use epoch milliseconds or an ISO date.`
    );
  }
  return Math.trunc(millis);
}
