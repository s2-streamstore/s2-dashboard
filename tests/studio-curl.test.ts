import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  buildReadCurlCommand,
  buildAppendCurlCommand,
} from '../packages/dashboard/src/basins/studio-curl';

// Run only a shell function named curl; never make a network request. This also
// verifies that quoting preserves headers and payloads as actual argv values.
function args(command: string): string[] {
  return execFileSync(
    '/bin/sh',
    ['-c', `curl() { printf '%s\\000' "$@"; }; ${command}`],
    { encoding: 'utf8' }
  )
    .split('\0')
    .filter(Boolean);
}

describe('copied requests', () => {
  it.each([false, true])(
    'includes the local basin and encryption key (streaming: %s)',
    (streaming) => {
      const argv = args(
        buildReadCurlCommand(
          'local-basin',
          'a/b',
          { start: { from: { seqNum: 0 }, clamp: true } },
          streaming,
          '',
          'http://localhost:8080/v1',
          ' YWJjZA== '
        )
      );
      expect(argv).toContain('s2-basin: local-basin');
      expect(argv).toContain('s2-encryption-key: YWJjZA==');
      expect(argv).toContain('Authorization: Bearer ');
      expect(argv.at(-1)).toBe(
        'http://localhost:8080/v1/streams/a%2Fb/records?seq_num=0&clamp=true'
      );
      if (streaming) expect(argv).toContain('Accept: text/event-stream');
    }
  );
  it('uses the cloud endpoint template and quotes tokens', () => {
    const argv = args(
      buildReadCurlCommand('my-basin', 'events', {}, false, "a'b$not_expanded")
    );
    expect(argv).toContain("Authorization: Bearer a'b$not_expanded");
    expect(argv.at(-1)).toBe(
      'https://my-basin.b.s2.dev/v1/streams/events/records'
    );
    expect(argv.some((arg) => arg.startsWith('s2-encryption-key:'))).toBe(
      false
    );
  });
  it('preserves append preconditions, payload and encryption headers', () => {
    const argv = args(
      buildAppendCurlCommand(
        'local-basin',
        'events',
        {
          records: [{ body: "it's $literal\ntext" }],
          matchSeqNum: 0,
          fencingToken: 'fence',
        },
        'test',
        'http://localhost:8080',
        'YWJjZA=='
      )
    );
    expect(argv).toContain('s2-encryption-key: YWJjZA==');
    expect(argv).toContain('s2-basin: local-basin');
    expect(JSON.parse(argv[argv.indexOf('--data') + 1])).toEqual({
      records: [{ body: "it's $literal\ntext" }],
      match_seq_num: 0,
      fencing_token: 'fence',
    });
  });
});
