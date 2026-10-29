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
