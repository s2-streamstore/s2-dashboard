import { describe, expect, it } from 'vitest';
import {
  parseMatchSeqNum,
  parseRecordTimestamp,
} from '../packages/dashboard/src/basins/studio-input';

describe('append sequence precondition', () => {
  it.each([
    'abc',
    '123abc',
    '-1',
    '1.5',
    '1e3',
    'Infinity',
    '9007199254740992',
  ])('rejects %s instead of removing or rounding the condition', (value) => {
    expect(() => parseMatchSeqNum(value)).toThrow('non-negative safe integer');
  });
  it('preserves zero and the largest safe integer and allows an absent condition', () => {
    expect(parseMatchSeqNum('0')).toBe(0);
    expect(parseMatchSeqNum(' 42 ')).toBe(42);
    expect(parseMatchSeqNum('9007199254740991')).toBe(Number.MAX_SAFE_INTEGER);
    expect(parseMatchSeqNum('')).toBeUndefined();
  });
});

describe('append record timestamp', () => {
  it('accepts epoch milliseconds and ISO dates, rejects anything else', () => {
    expect(parseRecordTimestamp(undefined, 0)).toBeUndefined();
    expect(parseRecordTimestamp(1700000000000, 0)).toBe(1700000000000);
    expect(parseRecordTimestamp('2023-11-14T22:13:20Z', 0)).toBe(1700000000000);
    expect(() => parseRecordTimestamp('soon', 3)).toThrow('Record 3');
    expect(() => parseRecordTimestamp(-1, 0)).toThrow('invalid timestamp');
    expect(() => parseRecordTimestamp(['2023-11-14T22:13:20Z'], 0)).toThrow(
      'invalid timestamp'
    );
    expect(() => parseRecordTimestamp({}, 0)).toThrow('invalid timestamp');
  });
});
