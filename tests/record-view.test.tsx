import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import {
  RecordView,
  type RecordViewHandle,
} from '../packages/dashboard/src/basins/RecordView';
import { Toaster } from '../packages/dashboard/src/ui/toaster';

it('keeps a full batch next to status rows and drops only the oldest records', () => {
  const ref = createRef<RecordViewHandle>();
  render(<RecordView ref={ref} maxRecords={3} />);
  const add = (seqNum: number) =>
    ref.current!.addRecord({
      seqNum,
      timestamp: new Date(0),
      body: `body-${seqNum}`,
    });

  act(() => {
    ref.current!.addStatus('info', 'reading');
    [0, 1, 2].forEach(add);
    ref.current!.addStatus('success', 'done');
  });
  expect(screen.getByText('body-0')).toBeTruthy();
  expect(screen.queryByText(/dropped/)).toBeNull();

  act(() => add(3));
  expect(screen.queryByText('body-0')).toBeNull();
  expect(screen.getByText('body-1')).toBeTruthy();
  expect(screen.getByText('reading')).toBeTruthy();
  expect(screen.getByText(/1 earlier record\(s\) dropped/)).toBeTruthy();

  act(() => ref.current!.clear());
  act(() => add(4));
  expect(screen.queryByText(/dropped/)).toBeNull();
});

it('offers manual copying when the clipboard API is unavailable', async () => {
  const ref = createRef<RecordViewHandle>();
  render(
    <>
      <RecordView ref={ref} />
      <Toaster />
    </>
  );
  act(() => {
    ref.current!.addRecord({
      seqNum: 18,
      timestamp: new Date(0),
      body: 'record body',
    });
  });

  fireEvent.click(screen.getByRole('button', { name: 'Record #18 details' }));
  fireEvent.click(screen.getByRole('button', { name: 'Copy record #18 body' }));

  expect(await screen.findByText('Could not copy record body')).toBeTruthy();
  expect(
    screen.getByText('Open the record and select the body to copy it manually.')
  ).toBeTruthy();
});
