import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from '../ui/use-toast';
import { deleteStream } from './api';
import { useQueryClient } from 'react-query';
import { S2Error } from '@s2-dev/streamstore';
import { useState } from 'react';
import { useDashboardHost } from './dashboard-host';

type DeleteStreamDialogProps = {
  ids: string[];
  onClose: () => void;
};

const DeleteStreamDialog = ({ ids, onClose }: DeleteStreamDialogProps) => {
  const queryClient = useQueryClient();
  const { getClient, route } = useDashboardHost();
  const basinId = route.basinId ?? '';
  const [deleting, setDeleting] = useState(false);
  const singleStreamName = ids.length === 1 ? ids[0] : null;

  const handleDelete = async () => {
    const s2 = await getClient();
    if (s2 === null) {
      toast({
        title: 'Error deleting streams',
        description: 'No auth token found',
        variant: 'destructive',
      });
      return;
    }

    setDeleting(true);

    try {
      // Create an array of promises to delete all streams in parallel
      const deletePromises = ids.map((streamId) =>
        deleteStream(basinId, streamId, s2).catch((err) => {
          // Log individual failures but continue with others
          console.error(`Failed to delete stream ${streamId}:`, err);
          return { streamId, error: err };
        })
      );

      const results = await Promise.all(deletePromises);

      // Check for any errors
      const failures = results.filter((result) => result && 'error' in result);

      if (failures.length > 0) {
        toast({
          title: `${failures.length} stream${failures.length === 1 ? '' : 's'} failed to delete`,
          description:
            'Some streams could not be deleted. See console for details.',
          variant: 'destructive',
        });
      }

      if (failures.length < ids.length) {
        // At least some succeeded
        toast({
          title: `${ids.length - failures.length} stream${ids.length - failures.length === 1 ? '' : 's'} deleted successfully`,
          description:
            failures.length > 0
              ? 'Some streams failed to delete. See console for details.'
              : 'All selected streams were deleted successfully.',
        });
      }

      queryClient.invalidateQueries('streams');
      onClose();
    } catch (err: unknown) {
      toast({
        title: 'Error deleting streams',
        description:
          err instanceof S2Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="mx-auto max-w-lg">
        <DialogHeader className="mb-2">
          <DialogTitle>Delete Stream{ids.length !== 1 ? 's' : ''}</DialogTitle>
          <DialogDescription>
            {singleStreamName ? (
              <>
                Are you sure you want to delete stream{' '}
                <code className="font-mono">{singleStreamName}</code>?
              </>
            ) : (
              <>Are you sure you want to delete {ids.length} streams?</>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteStreamDialog;
