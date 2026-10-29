import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { BasinCombobox } from '../packages/dashboard/src/basins/BasinCombobox';
import { StreamCombobox } from '../packages/dashboard/src/basins/StreamCombobox';
import * as api from '../packages/dashboard/src/basins/api';
import { toast } from '../packages/dashboard/src/ui/use-toast';
import { renderDashboard } from './harness';

vi.mock('../packages/dashboard/src/basins/api', () => ({
  fetchBasinsData: vi.fn(),
  fetchStreamsData: vi.fn(),
}));
vi.mock('../packages/dashboard/src/ui/use-toast', () => ({
  toast: vi.fn(),
  setToastSink: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());

for (const kind of ['basins', 'streams'] as const) {
  it(`reports ${kind} selector failures and can recover`, async () => {
    const list =
      kind === 'basins'
        ? vi.mocked(api.fetchBasinsData)
        : vi.mocked(api.fetchStreamsData);
    list.mockRejectedValue(new Error('Access denied'));
    renderDashboard(
      kind === 'basins' ? (
        <BasinCombobox value="" onValueChange={vi.fn()} />
      ) : (
        <StreamCombobox basinId="basin-a" value="" onValueChange={vi.fn()} />
      )
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox'));
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Access denied'
    );
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: `Error loading ${kind}`,
        variant: 'destructive',
      })
    );
    expect(screen.queryByText(`No ${kind} found`)).toBeNull();
    list.mockResolvedValue({
      basins: [{ name: 'found', createdAt: new Date(0) }],
      streams: [{ name: 'found', createdAt: new Date(0) }],
      hasMore: false,
    });
    await user.type(screen.getByPlaceholderText('Filter by prefix…'), 'found');
    await screen.findByRole('button', { name: 'found' });
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
}
