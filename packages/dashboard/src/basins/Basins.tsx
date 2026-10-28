'use client';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'motion/react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  BasinInfo,
  ListBasinsInput,
  ListBasinsResponse,
} from '@s2-dev/streamstore';
import Loading from '../components/Loading';
import CreateEditBasin from './CreateEditBasin';
import { fetchBasinsData } from './api';
import EmptyList from '../components/EmptyList';
import TableBasins from './TableBasins';
import { useIsMobile } from '../hooks/use-mobile';
import { toast } from '../ui/use-toast';
import { Input } from '../ui/input';
import DeleteBasinDialog from './DeleteBasin';
import { useDashboardHost } from './dashboard-host';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

const BASINS_PER_PAGE = 25;

export default function Basins(): JSX.Element {
  const { getClient, scopeKey, slots, route } = useDashboardHost();
  const PrivateConnectivity = slots?.PrivateConnectivity;
  const isMobile = useIsMobile(1280, true);
  const [searchTerm, setSearchTerm] = useState('');
  const [localBasins, setLocalBasins] = useState<BasinInfo[]>([]);
  const [createEditBasinFormOpen, setCreateEditBasinFormOpen] = useState(false);
  const [prevPrefix, setPrevPrefix] = useState<string | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBasins, setSelectedBasins] = useState<string[]>([]);

  const [requestParams, setRequestParams] = useState<ListBasinsInput>({
    startAfter: '',
    limit: BASINS_PER_PAGE,
  });

  const {
    data: basinsResponse,
    isLoading,
    error,
  } = useQuery(
    ['basins', scopeKey, requestParams],
    async (): Promise<ListBasinsResponse> => {
      const s2 = await getClient();
      if (s2 === null) {
        toast({
          title: 'Error fetching basins',
          description: 'No auth token found',
          variant: 'destructive',
        });
        return { basins: [], hasMore: false };
      }
      return await fetchBasinsData(s2, requestParams);
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Update localBasins during render when basinsResponse changes, avoiding setState-in-effect.
  // React explicitly supports this "update state during render" pattern for derived/accumulated state.
  const [prevBasinsResponse, setPrevBasinsResponse] = useState<
    ListBasinsResponse | undefined
  >(undefined);
  if (basinsResponse !== prevBasinsResponse && basinsResponse?.basins) {
    setPrevBasinsResponse(basinsResponse);
    const isReset =
      requestParams.startAfter === '' || requestParams.prefix !== prevPrefix;
    setLocalBasins(
      isReset
        ? basinsResponse.basins
        : [...localBasins, ...basinsResponse.basins]
    );
    setPrevPrefix(requestParams.prefix);
  }

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  }, [error]);

  // Debounce search and update requestParams directly inside the timer callback
  // (async — not synchronous in the effect body, so setState calls are allowed).
  // Skipped when the prefix already matches (notably the mount-time run with
  // an empty search box): rewriting the params anyway changed the query key
  // and wiped the local list, refetching and flashing the spinner on every
  // remount.
  const activePrefix = requestParams.prefix ?? '';
  useEffect(() => {
    if (searchTerm === activePrefix) return;
    const timer = setTimeout(() => {
      setRequestParams((prev) => ({
        ...prev,
        prefix: searchTerm,
        startAfter: '',
      }));
      setLocalBasins([]);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, activePrefix]);

  if (isMobile && route.basinId) {
    return <></>;
  }

  // Wait for connection strings on the first paint too, so the tab decision is
  // settled before render and the Private Connectivity tab doesn't pop in after
  // the basin list. react-query clears isLoading on error, so this can't hang.
  if (isLoading && localBasins.length === 0 && !requestParams.prefix?.length) {
    return <Loading />;
  }

  const handleLoadMore = (): void => {
    if (localBasins.length > 0) {
      const lastAccessTokenId = localBasins[localBasins.length - 1].name;
      setRequestParams((prev) => ({
        ...prev,
        startAfter: lastAccessTokenId,
      }));
    }
  };

  const hasActiveSearch = !!requestParams.prefix?.length;

  const basinsList = (
    <div className="space-y-2">
      {(localBasins.length !== 0 || hasActiveSearch || isLoading) && (
        <Input
          placeholder="Filter by prefix..."
          onChange={(e): void => setSearchTerm(e.target.value)}
          value={searchTerm}
          type="search"
        />
      )}
      {localBasins.length > 0 || hasActiveSearch || isLoading ? (
        <>
          <TableBasins
            data={localBasins}
            onSelectedBasinsChange={setSelectedBasins}
          />
          {basinsResponse && basinsResponse.hasMore && (
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          )}
        </>
      ) : (
        <EmptyList
          title="You haven't configured any basins yet"
          description="Once you configure a basin, you'll be able to set up streams."
          cta={{
            label: 'Create Basin',
            onClick: (): void => setCreateEditBasinFormOpen(true),
          }}
        />
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`w-full max-w-4xl flex-1 space-y-2 pt-0 xl:pt-4 ${route.basinId ? 'hidden xl:block' : ''}`}
    >
      <motion.div layout className="flex justify-between">
        <motion.h1
          layout="position"
          className="mt-[2px] mb-2 text-2xl tracking-tight"
        >
          Basins
        </motion.h1>
        <div className="flex gap-2">
          {selectedBasins.length > 0 && (
            <Button
              onClick={(): void => {
                setDeleteDialogOpen(true);
              }}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete{' '}
              {selectedBasins.length > 1 ? `(${selectedBasins.length})` : ''}
            </Button>
          )}
          {/* Kept visible during an active search: a search matching nothing
              still renders the table, not the empty-state CTA, so gating on the
              row count alone would leave no way to create a basin. */}
          {(localBasins.length > 0 || hasActiveSearch) && (
            <Button
              onClick={(): void => setCreateEditBasinFormOpen(true)}
              size="sm"
              variant={route.basinId ? 'outline' : 'default'}
            >
              <Plus />
              Create Basin
            </Button>
          )}
        </div>
      </motion.div>
      {PrivateConnectivity ? (
        <Tabs defaultValue="basins">
          <TabsList className="mb-2 w-full">
            <TabsTrigger value="basins" className="w-full">
              Basins
            </TabsTrigger>
            <TabsTrigger value="private-connectivity" className="w-full">
              Private Connectivity
            </TabsTrigger>
          </TabsList>
          <TabsContent value="basins">{basinsList}</TabsContent>
          <TabsContent value="private-connectivity">
            <PrivateConnectivity />
          </TabsContent>
        </Tabs>
      ) : (
        basinsList
      )}
      {createEditBasinFormOpen && (
        <CreateEditBasin
          data={null}
          onClose={(): void => {
            setCreateEditBasinFormOpen(false);
          }}
        />
      )}
      {deleteDialogOpen && selectedBasins.length > 0 && (
        <DeleteBasinDialog
          ids={selectedBasins}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSelectedBasins([]);
          }}
        />
      )}
    </motion.div>
  );
}
