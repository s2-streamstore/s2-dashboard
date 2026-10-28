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
import { deleteBasin } from './api';
import { useQueryClient } from 'react-query';
import { S2Error } from '@s2-dev/streamstore';
import { useState } from 'react';
import { useDashboardHost } from './dashboard-host';

type DeleteBasinDialogProps = {
  ids: string[];
  onClose: () => void;
};

const DeleteBasinDialog = ({ ids, onClose }: DeleteBasinDialogProps) => {
  const { getClient, navigate } = useDashboardHost();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const singleBasinName = ids.length === 1 ? ids[0] : null;

  const handleDelete = async (): Promise<void> => {
    const s2 = await getClient();
    if (s2 === null) {
      toast({
        title: 'Error deleting basins',
        description: 'No auth token found',
        variant: 'destructive',
      });
      return;
    }

    setDeleting(true);

    try {
      // Create an array of promises to delete all basins in parallel
      const deletePromises = ids.map((basinId) =>
        deleteBasin(s2, basinId).catch((err) => {
          // Log individual failures but continue with others
          console.error(`Failed to delete basin ${basinId}:`, err);
          return { basinId, error: err };
        })
      );

      const results = await Promise.all(deletePromises);

      // Check for any errors
      const failures = results.filter((result) => result && 'error' in result);

      if (failures.length > 0) {
        toast({
          title: `${failures.length} basin${failures.length === 1 ? '' : 's'} failed to delete`,
          description:
            'Some basins could not be deleted. See console for details.',
          variant: 'destructive',
        });
      }

      if (failures.length < ids.length) {
        // At least some succeeded
        toast({
          title: `${ids.length - failures.length} basin${ids.length - failures.length === 1 ? '' : 's'} deleted successfully`,
          description:
            failures.length > 0
              ? 'Some basins failed to delete. See console for details.'
              : 'All selected basins were deleted successfully.',
        });
      }

      queryClient.invalidateQueries('basins');
      navigate('/dashboard/basins');
      onClose();
    } catch (err: unknown) {
      toast({
        title: 'Error deleting basins',
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
          <DialogTitle>Delete Basin{ids.length !== 1 ? 's' : ''}</DialogTitle>
          <DialogDescription>
            {singleBasinName ? (
              <>
                Are you sure you want to delete basin{' '}
                <code className="font-mono">{singleBasinName}</code>?
              </>
            ) : (
              <>Are you sure you want to delete {ids.length} basins?</>
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

export default DeleteBasinDialog;
