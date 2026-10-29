import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useDashboardHost } from './dashboard-host';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import type {
  StreamConfig,
  TimestampingMode,
  RetentionPolicy,
} from '@s2-dev/streamstore';
import { Info } from 'lucide-react';

type StorageClass = NonNullable<StreamConfig['storageClass']>;

type StreamConfigProps = {
  config?: StreamConfig | null;
  setConfig: (update: (prev?: StreamConfig | null) => StreamConfig) => void;
};

export const defaultConfig = {
  storageClass: 'express' as StorageClass,
  retentionPolicy: {
    ageSecs: 7 * 24 * 3600,
  } as RetentionPolicy,
  timestamping: {
    mode: 'client-prefer' as TimestampingMode,
    uncapped: false,
  },
  deleteOnEmpty: null,
};

const SETTING_ROW_CLASS =
  'grid grid-cols-[9.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2';
const COMPACT_SELECT_CLASS = 'h-8 w-44';
const COMPACT_NUMBER_INPUT_CLASS =
  'h-full w-0 flex-1 border-0 bg-transparent px-2 py-1 [appearance:textfield] focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';
const FIRST_OPTION_CLASS = 'flex w-20 items-center space-x-2';
const SECOND_OPTION_CLASS = 'flex w-28 shrink-0 items-center space-x-2';
const OPTION_COLUMN_CLASS = 'flex w-full flex-col gap-y-2';
const SELECTED_OPTION_ROW_CLASS = 'flex w-full items-center gap-x-3';
const INLINE_AGE_INPUT_CLASS =
  'flex h-8 w-32 items-center rounded border border-input ring-offset-background dark:bg-input/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2';
const DEFAULT_DELETE_ON_EMPTY_MIN_AGE_SECS = 3600;

const StreamConfigInputs = ({ config, setConfig }: StreamConfigProps) => {
  const { capabilities } = useDashboardHost();
  const currentConfig = { ...defaultConfig, ...config };

  const getRetentionPolicyType = (
    policy?: RetentionPolicy | null
  ): 'ageSecs' | 'infinite' => {
    if (!policy) return 'ageSecs';
    return 'ageSecs' in policy ? 'ageSecs' : 'infinite';
  };

  const getRetentionAge = (policy?: RetentionPolicy | null): number => {
    if (!policy || !('ageSecs' in policy)) {
      return 'ageSecs' in defaultConfig.retentionPolicy
        ? defaultConfig.retentionPolicy.ageSecs
        : 7 * 24 * 3600;
    }
    return policy.ageSecs;
  };

  const handleStorageClassChange = (value: StorageClass) => {
    setConfig((prev) => ({
      ...prev,
      storageClass: value,
    }));
  };

  const handleRetentionPolicyTypeChange = (value: 'ageSecs' | 'infinite') => {
    setConfig((prev) => ({
      ...prev,
      retentionPolicy:
        value === 'ageSecs'
          ? ({
              ageSecs: getRetentionAge(prev?.retentionPolicy),
            } as RetentionPolicy)
          : ({ infinite: {} } as RetentionPolicy),
    }));
  };

  const handleRetentionAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig((prev) => ({
      ...prev,
      retentionPolicy: {
        ageSecs: Number(e.target.value),
      } as RetentionPolicy,
    }));
  };

  const handleTimestampingChange = (value: TimestampingMode) => {
    setConfig((prev) => ({
      ...prev,
      timestamping: {
        ...prev?.timestamping,
        mode: value,
      },
    }));
  };

  const handleUncappedTimestampsChange = (checked: boolean) => {
    setConfig((prev) => ({
      ...prev,
      timestamping: {
        ...prev?.timestamping,
        uncapped: checked,
      },
    }));
  };

  const isDeleteOnEmptyEnabled = (minAgeSecs?: number): minAgeSecs is number =>
    typeof minAgeSecs === 'number' &&
    Number.isFinite(minAgeSecs) &&
    minAgeSecs > 0;

  const getDeleteOnEmptyType = (): 'never' | 'threshold' => {
    return isDeleteOnEmptyEnabled(currentConfig.deleteOnEmpty?.minAgeSecs)
      ? 'threshold'
      : 'never';
  };

  const getDeleteOnEmptyAge = (): number => {
    const minAgeSecs = currentConfig.deleteOnEmpty?.minAgeSecs;

    if (!isDeleteOnEmptyEnabled(minAgeSecs)) {
      return DEFAULT_DELETE_ON_EMPTY_MIN_AGE_SECS;
    }

    return minAgeSecs;
  };

  const handleDeleteOnEmptyTypeChange = (value: 'never' | 'threshold') => {
    setConfig((prev) => ({
      ...prev,
      deleteOnEmpty:
        value === 'threshold'
          ? {
              minAgeSecs: getDeleteOnEmptyAge(),
            }
          : null,
    }));
  };

  const handleDeleteOnEmptyAgeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfig((prev) => ({
      ...prev,
      deleteOnEmpty: {
        minAgeSecs: Number(e.target.value),
      },
    }));
  };

  return (
    <TooltipProvider>
      {capabilities.storageClasses && (
        <div className={SETTING_ROW_CLASS}>
          <div className="flex items-center gap-2">
            <Label>Storage Class</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="text-muted-foreground h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  <strong>Express</strong> — append acknowledgements with p99
                  latency &lt; 40ms from clients in the same region.
                </p>
                <p className="mt-1">
                  <strong>Standard</strong> — append acknowledgements with p99
                  latency &lt; 400ms from clients in the same region.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={currentConfig.storageClass || defaultConfig.storageClass}
            onValueChange={handleStorageClassChange}
          >
            <SelectTrigger className={COMPACT_SELECT_CLASS}>
              <SelectValue>{currentConfig.storageClass}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="express">Express</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className={SETTING_ROW_CLASS}>
        <div className="flex items-center gap-2">
          <Label>Retention Policy</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="text-muted-foreground h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Choose between age-based retention (automatic trimming after
                specified time) or infinite retention (records kept until
                explicitly trimmed).
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className={OPTION_COLUMN_CLASS}>
          <div className={FIRST_OPTION_CLASS}>
            <input
              type="radio"
              id="infinite-retention"
              name="retention-policy"
              value="infinite"
              checked={
                getRetentionPolicyType(currentConfig.retentionPolicy) ===
                'infinite'
              }
              onChange={(e) =>
                handleRetentionPolicyTypeChange(
                  e.target.value as 'ageSecs' | 'infinite'
                )
              }
              className="text-primary focus:ring-primary h-4 w-4"
            />
            <Label htmlFor="infinite-retention" className="text-sm">
              Infinite
            </Label>
          </div>
          <div className={SELECTED_OPTION_ROW_CLASS}>
            <div className={SECOND_OPTION_CLASS}>
              <input
                type="radio"
                id="age-retention"
                name="retention-policy"
                value="ageSecs"
                checked={
                  getRetentionPolicyType(currentConfig.retentionPolicy) ===
                  'ageSecs'
                }
                onChange={(e) =>
                  handleRetentionPolicyTypeChange(
                    e.target.value as 'ageSecs' | 'infinite'
                  )
                }
                className="text-primary focus:ring-primary h-4 w-4"
              />
              <Label htmlFor="age-retention" className="text-sm">
                Age-based
              </Label>
            </div>
            <div
              className={`${INLINE_AGE_INPUT_CLASS} ${
                getRetentionPolicyType(currentConfig.retentionPolicy) ===
                'ageSecs'
                  ? ''
                  : 'invisible'
              }`}
            >
              <Label htmlFor="retention-age" className="sr-only">
                Retention Age
              </Label>
              <Input
                id="retention-age"
                type="number"
                min="1"
                value={getRetentionAge(currentConfig.retentionPolicy)}
                onChange={handleRetentionAgeChange}
                className={COMPACT_NUMBER_INPUT_CLASS}
                disabled={
                  getRetentionPolicyType(currentConfig.retentionPolicy) !==
                  'ageSecs'
                }
              />
              <span className="text-muted-foreground pr-2 text-sm">s</span>
            </div>
          </div>
        </div>
      </div>
      <div className={SETTING_ROW_CLASS}>
        <div className="flex items-center gap-2">
          <Label>Timestamping Mode</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="text-muted-foreground h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Timestamping mode for appends that influences how timestamps are
                handled. Use <code>client-prefer</code> to use client-specified
                timestamps if provided, <code>client-require</code> to enforce
                that they are provided, and <code>arrival</code> to always use
                arrival timestamps assigned by the service.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Select
          value={
            currentConfig.timestamping?.mode || defaultConfig.timestamping.mode
          }
          onValueChange={handleTimestampingChange}
        >
          <SelectTrigger className={COMPACT_SELECT_CLASS}>
            <SelectValue>
              {currentConfig.timestamping?.mode ||
                defaultConfig.timestamping.mode}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client-prefer">Client Prefer</SelectItem>
            <SelectItem value="client-require">Client Require</SelectItem>
            <SelectItem value="arrival">Arrival</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className={SETTING_ROW_CLASS}>
        <div className="flex items-center gap-2">
          <Label htmlFor="uncappedTimestamps">Uncapped Timestamps</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="text-muted-foreground h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Allow client-specified timestamps to exceed the arrival time. If
                this is disabled, client-specified timestamps will be capped at
                the arrival time in milliseconds since the Unix epoch.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Switch
          id="uncappedTimestamps"
          checked={
            config?.timestamping?.uncapped ||
            defaultConfig.timestamping.uncapped
          }
          onCheckedChange={handleUncappedTimestampsChange}
        />
      </div>
      <div className={SETTING_ROW_CLASS}>
        <div className="flex items-center gap-2">
          <Label>Delete on Empty</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="text-muted-foreground h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Configure automatic deletion of empty streams. Set to
                &ldquo;never&rdquo; to never delete automatically (default) or
                set a threshold age for deletion.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className={OPTION_COLUMN_CLASS}>
          <div className={FIRST_OPTION_CLASS}>
            <input
              type="radio"
              id="never-delete"
              name="delete-on-empty"
              value="never"
              checked={getDeleteOnEmptyType() === 'never'}
              onChange={(e) =>
                handleDeleteOnEmptyTypeChange(
                  e.target.value as 'never' | 'threshold'
                )
              }
              className="text-primary focus:ring-primary h-4 w-4"
            />
            <Label htmlFor="never-delete" className="text-sm">
              Never
            </Label>
          </div>
          <div className={SELECTED_OPTION_ROW_CLASS}>
            <div className={SECOND_OPTION_CLASS}>
              <input
                type="radio"
                id="threshold-delete"
                name="delete-on-empty"
                value="threshold"
                checked={getDeleteOnEmptyType() === 'threshold'}
                onChange={(e) =>
                  handleDeleteOnEmptyTypeChange(
                    e.target.value as 'never' | 'threshold'
                  )
                }
                className="text-primary focus:ring-primary h-4 w-4"
              />
              <Label htmlFor="threshold-delete" className="text-sm">
                Min Age
              </Label>
            </div>
            <div
              className={`${INLINE_AGE_INPUT_CLASS} ${
                getDeleteOnEmptyType() === 'threshold' ? '' : 'invisible'
              }`}
            >
              <Label htmlFor="delete-threshold" className="sr-only">
                Minimum Age
              </Label>
              <Input
                id="delete-threshold"
                type="number"
                min="1"
                value={getDeleteOnEmptyAge()}
                onChange={handleDeleteOnEmptyAgeChange}
                className={COMPACT_NUMBER_INPUT_CLASS}
                disabled={getDeleteOnEmptyType() !== 'threshold'}
              />
              <span className="text-muted-foreground pr-2 text-sm">s</span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default StreamConfigInputs;
