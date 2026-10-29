import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Basins from '../packages/dashboard/src/basins/Basins';
import Streams from '../packages/dashboard/src/basins/Streams';
import * as api from '../packages/dashboard/src/basins/api';
import { renderDashboard, deferred } from './harness';

vi.mock('../packages/dashboard/src/basins/api', async (original) => ({
  ...(await original<typeof api>()),
  fetchBasinsData: vi.fn(),
  fetchStreamsData: vi.fn(),
  getBasinConfig: vi.fn(async () => ({})),
  deleteBasin: vi.fn(),
  deleteStream: vi.fn(),
}));
vi.mock('../packages/dashboard/src/ui/use-toast', () => ({
  toast: vi.fn(),
  setToastSink: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

for (const kind of ['basins', 'streams'] as const) {
  describe(kind, () => {
    const name = (n: number) => `item-${String(n).padStart(2, '0')}`;
    const item = (n: number) => ({ name: name(n), createdAt: new Date(0) });
    const setup = () => {
      let rows = Array.from({ length: 30 }, (_, n) => item(n));
      const list =
        kind === 'basins'
          ? vi.mocked(api.fetchBasinsData)
          : vi.mocked(api.fetchStreamsData);
      list.mockImplementation(async (_s2, request) => {
        const filtered = rows.filter(
          (row) =>
            row.name > (request?.startAfter ?? '') &&
            row.name.startsWith(request?.prefix ?? '')
        );
        const page = filtered.slice(0, request?.limit ?? 25);
        return {
          basins: page,
          streams: page,
          hasMore: filtered.length > page.length,
        };
      });
      vi.mocked(api.deleteBasin).mockImplementation(async (_s2, id) => {
        rows = rows.filter((row) => row.name !== id);
      });
      vi.mocked(api.deleteStream).mockImplementation(async (_basin, id) => {
        rows = rows.filter((row) => row.name !== id);
      });
      const result = renderDashboard(
        kind === 'basins' ? <Basins /> : <Streams />,
        {
          route: {
            pathname: '/dashboard/basins',
            basinId: kind === 'streams' ? 'basin-a' : undefined,
            searchParams: new URLSearchParams(),
          },
        }
      );
      return {
        ...result,
        list,
        setRows: (next: typeof rows) => {
          rows = next;
        },
      };
    };

    it('replaces loaded pages after deleting rows on both pages', async () => {
      setup();
      const user = userEvent.setup();
      await screen.findByRole('link', { name: name(0) });
      await user.click(screen.getByRole('button', { name: 'Load More' }));
      await screen.findByRole('link', { name: name(29) });
      const singular = kind === 'basins' ? 'basin' : 'stream';
      await user.click(
        screen.getByRole('checkbox', { name: `Select ${singular} ${name(0)}` })
      );
      await user.click(
        screen.getByRole('checkbox', { name: `Select ${singular} ${name(27)}` })
      );
      await user.click(screen.getByRole('button', { name: 'Delete (2)' }));
      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Delete',
        })
      );
      await waitFor(() => {
        expect(screen.queryByRole('link', { name: name(0) })).toBeNull();
        expect(screen.queryByRole('link', { name: name(27) })).toBeNull();
        expect(screen.getAllByRole('link', { name: /^item-/ })).toHaveLength(
          28
        );
      });
      expect(screen.getAllByRole('link', { name: name(25) })).toHaveLength(1);
    });

    it('clears rows, cursor and selection immediately on an account switch', async () => {
      const { updateHost, list, setRows } = setup();
      const user = userEvent.setup();
      await screen.findByRole('link', { name: name(0) });
      await user.click(screen.getByRole('button', { name: 'Load More' }));
      await screen.findByRole('link', { name: name(29) });
      await user.click(
        screen.getByRole('checkbox', {
          name: `Select ${kind === 'basins' ? 'basin' : 'stream'} ${name(29)}`,
        })
      );
      const pending = deferred<{
        basins: ReturnType<typeof item>[];
        streams: ReturnType<typeof item>[];
        hasMore: boolean;
      }>();
      list.mockImplementationOnce(() => pending.promise);
      setRows([item(0)]);
      updateHost({ scopeKey: 'account-b' });
      expect(screen.queryByRole('link', { name: /^item-/ })).toBeNull();
      expect(screen.queryByRole('button', { name: /^Delete/ })).toBeNull();
      await waitFor(() =>
        expect(list.mock.calls.at(-1)?.[1]?.startAfter).toBe('')
      );
      await act(async () =>
        pending.resolve({
          basins: [item(0)],
          streams: [item(0)],
          hasMore: false,
        })
      );
      await screen.findByRole('link', { name: name(0) });
      expect(screen.getAllByRole('link', { name: /^item-/ })).toHaveLength(1);
      expect(
        screen
          .getByRole('checkbox', {
            name: `Select ${kind === 'basins' ? 'basin' : 'stream'} ${name(0)}`,
          })
          .getAttribute('aria-checked')
      ).toBe('false');
    });
  });
}
