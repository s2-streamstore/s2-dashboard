import { describe, expect, it } from 'vitest';
import { parseMatchSeqNum } from '../packages/dashboard/src/basins/studio-input';

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
