import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateEditStreamDialog, {
  streamNameError,
} from '../packages/dashboard/src/basins/CreateEditStream';
import * as api from '../packages/dashboard/src/basins/api';
import { renderDashboard } from './harness';

vi.mock('../packages/dashboard/src/basins/api', async (original) => ({
  ...(await original<typeof api>()),
  createStream: vi.fn(),
  updateStreamConfig: vi.fn(),
}));
vi.mock('../packages/dashboard/src/ui/use-toast', () => ({
  toast: vi.fn(),
  setToastSink: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe('streamNameError', () => {
  it('enforces the 253-byte UTF-8 limit and reserved names', () => {
    expect(streamNameError('')).toMatch(/required/i);
    expect(streamNameError('.')).toMatch(/\."\s+or\s+"\.\./);
    expect(streamNameError('..')).toMatch(/\."\s+or\s+"\.\./);
    expect(streamNameError('bad\0name')).toMatch(/NUL/i);
    expect(streamNameError('a'.repeat(253))).toBeNull();
    expect(streamNameError('a'.repeat(254))).toMatch(/253 bytes/);
    // 64 four-byte emoji = 256 UTF-8 bytes despite being only 128 UTF-16 code units.
    expect(streamNameError('😀'.repeat(64))).toMatch(/253 bytes/);
    expect(streamNameError('😀'.repeat(63))).toBeNull();
  });
});

describe('CreateEditStreamDialog', () => {
  it('rejects overlong ASCII and multibyte names without truncating input', async () => {
    const user = userEvent.setup();
    renderDashboard(
      <CreateEditStreamDialog
        basinId="test-basin"
        data={null}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByLabelText('Stream Name');
    expect(input.getAttribute('maxlength')).toBeNull();

    fireEvent.change(input, { target: { value: 'a'.repeat(254) } });
    await user.click(screen.getByRole('button', { name: 'Create Stream' }));

    const errorEl = await screen.findByText(
      'Stream name must not exceed 253 bytes.'
    );
    expect(errorEl.id).toBe('streamId-error');
    expect(input.getAttribute('aria-describedby')).toBe('streamId-error');
    expect(api.createStream).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '😀'.repeat(64) } });
    await user.click(screen.getByRole('button', { name: 'Create Stream' }));

    expect(
      await screen.findByText('Stream name must not exceed 253 bytes.')
    ).not.toBeNull();
    expect(api.createStream).not.toHaveBeenCalled();
  });

  it('submits a 253-byte ASCII stream name', async () => {
    const name = 's'.repeat(253);
    vi.mocked(api.createStream).mockResolvedValueOnce({
      name,
      createdAt: new Date(0),
    });
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDashboard(
      <CreateEditStreamDialog
        basinId="test-basin"
        data={null}
        onClose={onClose}
      />
    );

    fireEvent.change(screen.getByLabelText('Stream Name'), {
      target: { value: name },
    });
    await user.click(screen.getByRole('button', { name: 'Create Stream' }));

    await waitFor(() => {
      expect(api.createStream).toHaveBeenCalledWith(
        'test-basin',
        { stream: name, config: {} },
        expect.anything()
      );
      expect(onClose).toHaveBeenCalled();
    });
  });
});
