'use client';
import { Button } from '../ui/button';
import { fetchStreamsData, getBasinConfig } from './api';
import { ArrowLeft, Plus, SquareTerminal, Trash2, X } from 'lucide-react';
import { useQuery } from 'react-query';
import Loading from '../components/Loading';
import EmptyList from '../components/EmptyList';
import { toast } from '../ui/use-toast';
import TableStreams from './TableStreams';
import { useEffect, useState } from 'react';
import CreateEditStreamDialog from './CreateEditStream';
import { useIsMobile } from '../hooks/use-mobile';
import { Input } from '../ui/input';
import {
  S2Error,
  type StreamConfig,
  type StreamInfo,
  type ListStreamsResponse,
} from '@s2-dev/streamstore';
import DeleteStreamDialog from './DeleteStream';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { isDashboardSection } from '../lib/dashboard-routes';
import { useDashboardHost } from './dashboard-host';

const STREAMS_PER_PAGE = 25;

export default function Streams() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [localStreams, setLocalStreams] = useState<StreamInfo[]>([]);
  const [createEditStreamFormOpen, setCreateEditStreamFormOpen] =
    useState(false);
  const [prevPrefix, setPrevPrefix] = useState<string | undefined>(undefined);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { getClient, scopeKey, slots, route, navigate, Link } =
    useDashboardHost();
  const BasinMetrics = slots?.BasinMetrics;
  const { pathname } = route;
  const isBasinsRoute = isDashboardSection(pathname, 'basins');

  const [requestParams, setRequestParams] = useState<{
    basinId: string;
    startAfter?: string;
    limit?: number;
    prefix?: string;
  }>({
    // Seed from the route so the first query uses the real key; starting from
    // '' and correcting in an effect churned the query key on every mount.
    basinId: route.basinId ?? '',
    startAfter: '',
    limit: STREAMS_PER_PAGE,
  });

  const isMobile = useIsMobile(1280, true);

  const {
    data: streamsResponse,
    isLoading,
    error,
  } = useQuery(
    ['streams', requestParams, scopeKey, debouncedSearchTerm],
    async (): Promise<ListStreamsResponse> => {
      if (!requestParams.basinId) {
        return { streams: [], hasMore: false };
      }
      const s2 = await getClient();
      if (s2 === null) {
        toast({
          title: 'Error fetching streams',
          description: 'No auth token found',
          variant: 'destructive',
        });
        return { streams: [], hasMore: false };
      }
      return await fetchStreamsData(s2, requestParams);
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: defaultStreamConfig, error: basinConfigError } = useQuery(
    ['basin-config', scopeKey, route.basinId],
    async (): Promise<StreamConfig | null | undefined> => {
      const s2 = await getClient();
      if (s2 === null || typeof route.basinId !== 'string') {
        toast({
          title: 'Error fetching default streams config',
          variant: 'destructive',
        });
        return {};
      }
      const data = await getBasinConfig(s2, route.basinId);
      return data.defaultStreamConfig;
    }
  );
  // Stale URL (basin deleted, or lite restarted without durable storage):
  // the basin config 404s while list streams may still return an empty page.
  const basinNotFound =
    basinConfigError instanceof S2Error && basinConfigError.status === 404;

  // Update localStreams during render when streamsResponse changes, avoiding
  // setState-in-effect. Gating on the response reference prevents stale-data
  // accumulation while keepPreviousData holds the prior page during a fetch.
  const [prevStreamsResponse, setPrevStreamsResponse] = useState<
    ListStreamsResponse | undefined
  >(undefined);
  if (streamsResponse !== prevStreamsResponse && streamsResponse?.streams) {
    setPrevStreamsResponse(streamsResponse);
    const isReset =
      requestParams.startAfter === '' || requestParams.prefix !== prevPrefix;
    setLocalStreams(
      isReset
        ? streamsResponse.streams
        : [...localStreams, ...streamsResponse.streams]
    );
    setPrevPrefix(requestParams.prefix);
  }

  useEffect(() => {
    if (
      route.basinId !== undefined &&
      route.basinId !== requestParams.basinId
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRequestParams({
        startAfter: '',
        limit: STREAMS_PER_PAGE,
        basinId: route.basinId,
      });
      setLocalStreams([]);
      setSelectedStreams([]);
    }
  }, [route.basinId, requestParams.basinId]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Skipped when the prefix already matches (notably the mount-time run with
  // an empty search box): rewriting the params anyway changed the query key
  // and wiped the local list, refetching and flashing the spinner on every
  // remount.
  const activePrefix = requestParams.prefix ?? '';
  useEffect(() => {
    if (debouncedSearchTerm === activePrefix) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRequestParams((prev) => ({
      ...prev,
      prefix: debouncedSearchTerm,
      startAfter: '',
    }));
    setLocalStreams([]);
  }, [debouncedSearchTerm, activePrefix]);

  const handleLoadMore = (): void => {
    if (localStreams.length > 0) {
      const lastStreamId = localStreams[localStreams.length - 1].name;
      setRequestParams((prev) => ({
        ...prev,
        startAfter: lastStreamId,
      }));
    }
  };

  return (
    <aside className="bg-background w-full max-w-4xl flex-1 space-y-2 [&:not(:only-child)]:sticky [&:not(:only-child)]:top-14 [&:not(:only-child)]:-mr-4 [&:not(:only-child)]:-mb-4 [&:not(:only-child)]:h-[calc(100vh-56px)] [&:not(:only-child)]:max-h-[calc(100vh-56px)] [&:not(:only-child)]:overflow-y-auto [&:not(:only-child)]:border-l [&:not(:only-child)]:p-4 [&:not(:only-child)]:pb-0">
      {basinNotFound ? (
        <EmptyList
          title={`Basin "${route.basinId}" was not found`}
          description="It may have been deleted."
          cta={{
            icon: <ArrowLeft />,
            label: 'Back to basins',
            onClick: () => navigate('/dashboard/basins'),
          }}
        />
      ) : isLoading &&
        localStreams.length === 0 &&
        debouncedSearchTerm.length === 0 ? (
        <Loading />
      ) : (
        <>
          <div className="flex gap-4">
            {!isMobile && (
              <Button
                size="sm"
                variant="outline"
                className="w-9"
                onClick={() =>
                  navigate(`/dashboard/${isBasinsRoute ? 'basins' : 'metrics'}`)
                }
              >
                <X />
              </Button>
            )}
            <h1 className="mt-[2px] mb-2 flex-1 text-2xl tracking-tight">
              {route.basinId}
            </h1>
            <div className="flex gap-2">
              {selectedStreams.length > 0 && (
                <Button
                  onClick={() => setDeleteDialogOpen(true)}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete{' '}
                  {selectedStreams.length > 1
                    ? `(${selectedStreams.length})`
                    : ''}
                </Button>
              )}
              <Button size="sm" variant="outline" asChild>
                <Link
                  href={`/dashboard/basins/${encodeURIComponent(route.basinId ?? '')}/studio`}
                >
                  <SquareTerminal className="mr-1 h-4 w-4" />
                  Studio
                </Link>
              </Button>
              {/* Kept visible during an active search: a search matching
                  nothing still renders the table, not the empty-state CTA, so
                  gating on the row count alone would leave no way to create a
                  stream. */}
              {(localStreams.length > 0 || debouncedSearchTerm.length > 0) && (
                <Button
                  onClick={() => setCreateEditStreamFormOpen(true)}
                  size="sm"
                >
                  <Plus />
                  Create Stream
                </Button>
              )}
            </div>
          </div>
          <Tabs
            defaultValue={
              isBasinsRoute || !BasinMetrics ? 'streams' : 'metrics'
            }
          >
            <TabsList className="mb-2 w-full">
              <TabsTrigger value="streams" className="w-full">
                Streams
              </TabsTrigger>
              {BasinMetrics && (
                <TabsTrigger value="metrics" className="w-full">
                  Metrics
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="streams">
              {(localStreams.length !== 0 ||
                debouncedSearchTerm.length > 0 ||
                isLoading) && (
                <Input
                  placeholder="Filter by prefix..."
                  onChange={(e) => setSearchTerm(e.target.value)}
                  value={searchTerm}
                  type="search"
                />
              )}
              {localStreams.length > 0 ||
              debouncedSearchTerm.length > 0 ||
              isLoading ? (
                <>
                  <TableStreams
                    data={localStreams}
                    onSelectedStreamsChange={setSelectedStreams}
                  />
                  {streamsResponse && streamsResponse.hasMore && (
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
                  title="This basin doesn't have any streams yet"
                  description="Start creating streams to store data."
                  cta={{
                    label: 'Create Stream',
                    onClick: () => {
                      setCreateEditStreamFormOpen(true);
                    },
                  }}
                />
              )}
            </TabsContent>
            {BasinMetrics && (
              <TabsContent value="metrics">
                <BasinMetrics basinId={route.basinId ?? ''} />
              </TabsContent>
            )}
          </Tabs>
          {createEditStreamFormOpen && requestParams.basinId && (
            <CreateEditStreamDialog
              data={null}
              defaultConfig={defaultStreamConfig}
              basinId={requestParams.basinId}
              onClose={() => {
                setCreateEditStreamFormOpen(false);
              }}
            />
          )}
          {deleteDialogOpen && selectedStreams.length > 0 && (
            <DeleteStreamDialog
              ids={selectedStreams}
              onClose={() => {
                setDeleteDialogOpen(false);
                setSelectedStreams([]);
              }}
            />
          )}
        </>
      )}
    </aside>
  );
}
