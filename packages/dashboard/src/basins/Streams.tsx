'use client';
import { Button } from '../ui/button';
import { fetchStreamsData, getBasinConfig } from './api';
import { ArrowLeft, Plus, SquareTerminal, Trash2, X } from 'lucide-react';
import { useInfiniteQuery, useQuery } from 'react-query';
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
  type ListStreamsResponse,
} from '@s2-dev/streamstore';
import DeleteStreamDialog from './DeleteStream';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { isDashboardSection } from '../lib/dashboard-routes';
import { useDashboardHost } from './dashboard-host';

const STREAMS_PER_PAGE = 25;

export default function Streams(): JSX.Element {
  const { scopeKey, route } = useDashboardHost();
  return <StreamsList key={JSON.stringify([scopeKey, route.basinId])} />;
}

function StreamsList(): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [createEditStreamFormOpen, setCreateEditStreamFormOpen] =
    useState(false);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { getClient, scopeKey, slots, route, navigate, Link } =
    useDashboardHost();
  const BasinMetrics = slots?.BasinMetrics;
  const { pathname } = route;
  const isBasinsRoute = isDashboardSection(pathname, 'basins');

  const basinId = route.basinId ?? '';
  const isMobile = useIsMobile(1280, true);
  const { data, isLoading, isFetching, hasNextPage, fetchNextPage, error } =
    useInfiniteQuery(
      ['streams', scopeKey, basinId, debouncedSearchTerm],
      async ({ pageParam = '' }): Promise<ListStreamsResponse> => {
        const s2 = await getClient();
        if (s2 === null) throw new Error('No auth token found');
        return fetchStreamsData(s2, {
          basinId,
          prefix: debouncedSearchTerm || undefined,
          startAfter: pageParam,
          limit: STREAMS_PER_PAGE,
        });
      },
      {
        enabled: Boolean(basinId),
        getNextPageParam: (page) =>
          page.hasMore ? page.streams.at(-1)?.name : undefined,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      }
    );
  const localStreams = data?.pages.flatMap((page) => page.streams) ?? [];

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
                  {hasNextPage && (
                    <Button
                      variant="outline"
                      onClick={() => void fetchNextPage()}
                      disabled={isFetching}
                      className="w-full"
                    >
                      {isFetching ? 'Loading...' : 'Load More'}
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
          {createEditStreamFormOpen && basinId && (
            <CreateEditStreamDialog
              data={null}
              defaultConfig={defaultStreamConfig}
              basinId={basinId}
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
