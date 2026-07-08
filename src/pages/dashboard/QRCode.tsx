import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { restaurantApi, tableApi, Restaurant, type RestaurantTable, type UpsertTableData } from '@/lib/api';
import {
  QrCode,
  Download,
  Copy,
  ExternalLink,
  Search,
  Trash2,
  Plus,
  Layers3,
  Table2,
  ChefHat,
  BadgeCheck,
  LibraryBig,
  RefreshCcw,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  buildQrLibraryStorageKey,
  safeParseQrLibrary,
  type ManagedQrRecord,
  type QrMode,
  type QrLocationType,
} from '@/lib/qrLibrary';

const buildStorageKey = buildQrLibraryStorageKey;
const buildSettingsKey = (restaurantId: string) => `oneqr-qr-settings:${restaurantId}`;

const createAccessCode = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

const safeParseLibrary = safeParseQrLibrary;

const createQrTargetUrl = (
  menuUrl: string,
  mode: QrMode,
  accessCode: string,
) => {
  if (!menuUrl) return '';

  if (mode === 'single') {
    return menuUrl;
  }

  const params = new URLSearchParams();
  params.set('mode', 'ordering');
  params.set('table', accessCode.trim() || '1');
  return `${menuUrl}?${params.toString()}`;
};

const createRecordId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const tableToRecord = (table: RestaurantTable, menuUrlForRecord: string): ManagedQrRecord => ({
  id: table._id,
  label: table.label,
  mode: 'ordering',
  locationType: table.locationType,
  locationIdentifier: table.locationIdentifier,
  accessCode: table.accessCode,
  targetUrl: createQrTargetUrl(menuUrlForRecord, 'ordering', table.accessCode),
  batchId: table.batchId,
  batchLabel: table.batchLabel,
  status: table.status,
  createdAt: table.createdAt,
  updatedAt: table.updatedAt,
});

const toReadableDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const downloadQrImage = async (targetUrl: string, fileName: string) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(targetUrl)}`;
  const response = await fetch(qrUrl);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};

export default function QRCodePage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingBulk, setIsCreatingBulk] = useState(false);
  const [qrMode, setQrMode] = useState<QrMode>('single');
  const [locationType, setLocationType] = useState<QrLocationType>('table');
  const [locationIdentifier, setLocationIdentifier] = useState('1');
  const [accessCode, setAccessCode] = useState('');
  const [bulkStart, setBulkStart] = useState('1');
  const [bulkCount, setBulkCount] = useState('10');
  const [bulkLabelPrefix, setBulkLabelPrefix] = useState('Table');
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [library, setLibrary] = useState<ManagedQrRecord[]>([]);
  const { toast } = useToast();

  const qrSlug = restaurant?.qrSlug || restaurant?._id || '';
  const qrRedirectEnabled = !!restaurant?.whatsapp?.isEnabled && !!restaurant?.whatsapp?.qrRedirectEnabled;
  const menuUrl = restaurant ? `${window.location.origin}/menu/${qrSlug}` : '';

  const qrScanUrl = useMemo(
    () => createQrTargetUrl(menuUrl, qrMode, accessCode),
    [accessCode, menuUrl, qrMode],
  );

  const currentTargetUrl = qrScanUrl || menuUrl;
  const currentQrImageUrl = currentTargetUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentTargetUrl)}&color=f59e0b&bgcolor=0f0f11`
    : '';

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const data = await restaurantApi.get();
        setRestaurant(data);
        setQrMode(data.qrSettings?.mode || 'single');
        setLocationType(data.qrSettings?.locationType || 'table');
        setLocationIdentifier(data.qrSettings?.locationIdentifier || '1');

        const menuUrlForRestaurant = `${window.location.origin}/menu/${data.qrSlug || data._id}`;

        const storageKey = buildStorageKey(data._id);
        const localAll = safeParseLibrary(localStorage.getItem(storageKey));
        const localSingle = localAll.filter((record) => record.mode === 'single');
        const localOrdering = localAll.filter(
          (record): record is ManagedQrRecord & { accessCode: string; locationIdentifier: string } =>
            record.mode === 'ordering' && !!record.accessCode && !!record.locationIdentifier
        );

        let tables = await tableApi.getAll().catch(() => [] as RestaurantTable[]);

        // One-time migration: older ordering QRs only ever lived in this browser's
        // localStorage. Push any not yet known to the server so already-printed
        // codes keep validating instead of silently breaking after this update.
        const knownCodes = new Set(tables.map((table) => table.accessCode));
        const toMigrate = localOrdering.filter((record) => !knownCodes.has(record.accessCode));

        if (toMigrate.length > 0) {
          const migrated = await Promise.all(
            toMigrate.map((record) =>
              tableApi
                .upsert({
                  label: record.label,
                  locationIdentifier: record.locationIdentifier,
                  accessCode: record.accessCode,
                  batchId: record.batchId,
                  batchLabel: record.batchLabel,
                })
                .catch(() => null)
            )
          );
          tables = [...tables, ...migrated.filter((table): table is RestaurantTable => !!table)];
        }

        const orderingRecords = tables.map((table) => tableToRecord(table, menuUrlForRestaurant));
        setLibrary(
          [...orderingRecords, ...localSingle].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
        );

        const savedSettingsRaw = localStorage.getItem(buildSettingsKey(data._id));
        if (savedSettingsRaw) {
          try {
            const savedSettings = JSON.parse(savedSettingsRaw) as {
              mode?: QrMode;
              locationIdentifier?: string;
              accessCode?: string;
            };

            if (savedSettings.mode === 'ordering' && savedSettings.accessCode) {
              setAccessCode(savedSettings.accessCode);
            }

            if (savedSettings.locationIdentifier) {
              setLocationIdentifier(savedSettings.locationIdentifier);
            }
          } catch {
            // Ignore corrupted local state and fall back to restaurant settings.
          }
        } else if (data.qrSettings?.mode === 'ordering') {
          const matchingTable = tables.find((table) =>
            table.locationIdentifier === (data.qrSettings?.locationIdentifier || '1')
          );

          setAccessCode(matchingTable?.accessCode || createAccessCode());
        }
      } catch (error) {
        console.error('Failed to fetch restaurant:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurant();
  }, []);

  useEffect(() => {
    if (!restaurant) return;
    const localOnly = library.filter((record) => record.mode === 'single');
    localStorage.setItem(buildStorageKey(restaurant._id), JSON.stringify(localOnly));
  }, [library, restaurant]);

  // Re-pulls the ordering table list from the server after any create/archive/
  // delete so the QR Library always reflects what's actually valid, not a
  // locally-cached guess.
  const refreshOrderingRecords = async (menuUrlForRecords: string) => {
    const tables = await tableApi.getAll().catch(() => [] as RestaurantTable[]);
    const orderingRecords = tables.map((table) => tableToRecord(table, menuUrlForRecords));

    setLibrary((prev) =>
      [...orderingRecords, ...prev.filter((item) => item.mode === 'single')].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    );
  };

  useEffect(() => {
    if (!restaurant) return;

    if (qrMode === 'ordering' && !accessCode) {
      setAccessCode(createAccessCode());
    }
  }, [accessCode, qrMode, restaurant]);

  const upsertRecord = (record: ManagedQrRecord) => {
    setLibrary((prev) => [record, ...prev.filter((item) => item.targetUrl !== record.targetUrl)]);
  };

  const copyLink = async (targetUrl: string) => {
    await navigator.clipboard.writeText(targetUrl);
    toast({ title: 'Link copied!' });
  };

  const handleSaveQrSettings = async () => {
    if (!restaurant) return;

    const nextAccessCode = qrMode === 'ordering' ? accessCode || createAccessCode() : '';
    const nextLocationIdentifier = locationIdentifier.trim() || '1';

    setIsSaving(true);
    try {
      const saved = await restaurantApi.update({
        qrSettings: {
          mode: qrMode,
          locationType,
          locationIdentifier: nextLocationIdentifier,
        },
      });
      setRestaurant(saved);
      setAccessCode(nextAccessCode);

      localStorage.setItem(
        buildSettingsKey(saved._id),
        JSON.stringify({
          mode: qrMode,
          locationIdentifier: nextLocationIdentifier,
          accessCode: nextAccessCode,
        }),
      );

      const menuUrlForRecord = `${window.location.origin}/menu/${saved.qrSlug || saved._id}`;

      if (qrMode === 'ordering') {
        await tableApi.upsert({
          label: `Table ${nextLocationIdentifier}`,
          locationIdentifier: nextLocationIdentifier,
          accessCode: nextAccessCode,
        });
        await refreshOrderingRecords(menuUrlForRecord);
      } else {
        upsertRecord({
          id: createRecordId(),
          label: `${saved.name} menu QR`,
          mode: 'single',
          targetUrl: createQrTargetUrl(menuUrlForRecord, qrMode, nextAccessCode),
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      toast({ title: 'QR settings saved!' });
    } catch (error) {
      toast({
        title: 'Failed to save QR settings',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCurrentQr = async () => {
    if (!restaurant || !currentTargetUrl) return;

    if (qrMode === 'ordering') {
      const nextAccessCode = accessCode || createAccessCode();
      const nextLocationIdentifier = locationIdentifier.trim() || '1';
      setAccessCode(nextAccessCode);

      try {
        await tableApi.upsert({
          label: `Table ${nextLocationIdentifier}`,
          locationIdentifier: nextLocationIdentifier,
          accessCode: nextAccessCode,
        });
        await refreshOrderingRecords(menuUrl);
        toast({ title: 'QR added to management list!' });
      } catch (error) {
        toast({
          title: 'Failed to save table QR',
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive',
        });
      }
      return;
    }

    upsertRecord({
      id: createRecordId(),
      label: `${restaurant.name} menu QR`,
      mode: 'single',
      targetUrl: currentTargetUrl,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    toast({ title: 'QR added to management list!' });
  };

  const handleCreateBulkQrs = async () => {
    if (!restaurant || !menuUrl) return;

    const startValue = Number.parseInt(bulkStart, 10);
    const countValue = Number.parseInt(bulkCount, 10);

    if (!Number.isFinite(startValue) || !Number.isFinite(countValue) || startValue < 1 || countValue < 1) {
      toast({
        title: 'Invalid bulk range',
        description: 'Enter a valid starting number and quantity.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingBulk(true);
    try {
      const batchId = createRecordId();
      const batchLabel = `${bulkLabelPrefix.trim() || 'Table'} range`;
      const entries: UpsertTableData[] = Array.from({ length: countValue }, (_, index) => {
        const locationIdentifierValue = String(startValue + index);

        return {
          label: `${bulkLabelPrefix.trim() || 'Table'} ${locationIdentifierValue}`,
          locationIdentifier: locationIdentifierValue,
          accessCode: createAccessCode(),
          batchId,
          batchLabel,
        };
      });

      await tableApi.createBulk(entries);
      await refreshOrderingRecords(menuUrl);

      toast({
        title: 'Bulk QR batch created!',
        description: `${entries.length} ordering QR codes were added to your manager.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to create bulk QRs',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBulk(false);
    }
  };

  const handleDownloadCurrentQr = async () => {
    try {
      if (!currentTargetUrl) return;
      await downloadQrImage(currentTargetUrl, `${restaurant?.name || 'menu'}-qr-code.png`);
      toast({ title: 'QR Code downloading...' });
    } catch (err) {
      console.error('Failed to download QR:', err);
      toast({ title: 'Failed to download QR Code' });
    }
  };

  const handleDownloadRecord = async (record: ManagedQrRecord) => {
    try {
      await downloadQrImage(record.targetUrl, `${record.label.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'qr'}-code.png`);
      toast({ title: 'QR Code downloading...' });
    } catch (err) {
      console.error('Failed to download QR:', err);
      toast({ title: 'Failed to download QR Code' });
    }
  };

  const handleArchiveRecord = async (record: ManagedQrRecord) => {
    if (record.mode === 'ordering') {
      try {
        await tableApi.update(record.id, { status: record.status === 'active' ? 'archived' : 'active' });
        await refreshOrderingRecords(menuUrl);
      } catch (error) {
        toast({
          title: 'Failed to update table QR',
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive',
        });
      }
      return;
    }

    setLibrary((prev) =>
      prev.map((item) =>
        item.id === record.id ? { ...item, status: item.status === 'active' ? 'archived' : 'active', updatedAt: new Date().toISOString() } : item,
      ),
    );
  };

  const handleDeleteRecord = async (record: ManagedQrRecord) => {
    if (record.mode === 'ordering') {
      try {
        await tableApi.remove(record.id);
        await refreshOrderingRecords(menuUrl);
        toast({ title: 'QR removed from management list' });
      } catch (error) {
        toast({
          title: 'Failed to delete table QR',
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive',
        });
      }
      return;
    }

    setLibrary((prev) => prev.filter((item) => item.id !== record.id));
    toast({ title: 'QR removed from management list' });
  };

  // Ordering QRs are real table links now (validated server-side), so bulk
  // "clear" only drops the locally-cached single/view-only entries — retiring
  // a table QR is an individual archive/delete action, not a one-click wipe.
  const handleClearLibrary = () => {
    setLibrary((prev) => prev.filter((item) => item.mode === 'ordering'));
    toast({ title: 'Menu QR list cleared' });
  };

  const filteredRecords = useMemo(() => {
    return library.filter((record) => {
      const matchesSearch =
        !searchTerm ||
        record.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.targetUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.locationIdentifier || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesArchiveFilter = showArchived ? true : record.status === 'active';

      return matchesSearch && matchesArchiveFilter;
    });
  }, [library, searchTerm, showArchived]);

  const stats = useMemo(() => {
    const total = library.length;
    const single = library.filter((item) => item.mode === 'single').length;
    const ordering = library.filter((item) => item.mode === 'ordering').length;
    const batches = new Set(library.filter((item) => item.batchId).map((item) => item.batchId)).size;

    return { total, single, ordering, batches };
  }, [library]);

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-56 mx-auto" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-12 flex flex-col items-center">
          <Skeleton className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl mb-6" />
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-56 mb-6" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Please set up your restaurant first.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8">
      <div className="text-center">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">QR Management System</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Create, organize, and bulk-generate ordering QRs from one dashboard.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {qrRedirectEnabled
            ? 'QR scans can forward to WhatsApp when enabled.'
            : qrMode === 'single'
              ? 'Single QR for the view-only menu.'
              : `Ordering QR for ${locationType} ${locationIdentifier.trim() || '1'}.`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'All QRs', value: stats.total, icon: LibraryBig },
          { label: 'Ordering QRs', value: stats.ordering, icon: Table2 },
          { label: 'Menu QRs', value: stats.single, icon: ChefHat },
          { label: 'Bulk Batches', value: stats.batches, icon: Layers3 },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-4 sm:p-5 border border-border/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className="h-9 w-9 text-primary" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold">Create QR</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Save the current QR to your restaurant and add it to the management list.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCreateCurrentQr} disabled={!currentTargetUrl}>
              <Plus className="mr-2 h-4 w-4" />
              Add to Library
            </Button>
          </div>

          <div className="space-y-2">
            <Label>QR Type</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setQrMode('single')}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left transition-all',
                  qrMode === 'single' ? 'border-primary bg-primary/10' : 'border-border/70 bg-background/50',
                )}
              >
                <p className="font-semibold">View Only Menu</p>
                <p className="text-xs text-muted-foreground">One QR code for the full menu.</p>
              </button>
              <button
                type="button"
                onClick={() => setQrMode('ordering')}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left transition-all',
                  qrMode === 'ordering' ? 'border-primary bg-primary/10' : 'border-border/70 bg-background/50',
                )}
              >
                <p className="font-semibold">Ordering System</p>
                <p className="text-xs text-muted-foreground">Unique QR per table with an access code.</p>
              </button>
            </div>
          </div>

          {qrMode === 'ordering' && (
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div className="space-y-2">
                <Label>Ordering Mode</Label>
                <div className="rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-sm">
                  Table only
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationIdentifier">Table Number</Label>
                <Input
                  id="locationIdentifier"
                  value={locationIdentifier}
                  onChange={(e) => setLocationIdentifier(e.target.value)}
                  placeholder="12"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="gold" onClick={handleSaveQrSettings} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save QR Settings'}
            </Button>
            <p className="text-xs text-muted-foreground">
              {qrMode === 'single'
                ? 'Save one QR for the view-only menu.'
                : `Save a unique QR for table ${locationIdentifier.trim() || '1'}.`}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[180px_1fr] items-center">
            <div className="inline-flex items-center justify-center p-4 sm:p-5 bg-white rounded-2xl">
              <img
                src={currentQrImageUrl}
                alt="Current Menu QR Code"
                className="w-40 h-40 sm:w-48 sm:h-48"
              />
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-semibold">Current QR Preview</h3>
                <p className="text-sm text-muted-foreground">
                  {qrMode === 'single'
                    ? 'The current menu QR points to your live menu.'
                    : `Table ${locationIdentifier.trim() || '1'} is ready for ordering.`}
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/50 p-3 text-xs sm:text-sm text-muted-foreground break-all">
                {currentTargetUrl}
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <Button variant="gold" onClick={handleDownloadCurrentQr} className="w-full sm:w-auto" disabled={!currentTargetUrl}>
                  <Download className="mr-2 h-4 w-4" />
                  Download QR
                </Button>
                <Button variant="outline" onClick={() => copyLink(currentTargetUrl)} className="w-full sm:w-auto" disabled={!currentTargetUrl}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                  <a href={currentTargetUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Target
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-5">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold">Bulk Ordering QR</h2>
              <p className="text-sm text-muted-foreground mt-1">
              Generate a range of QR codes for tables in one action.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulkLabelPrefix">Label Prefix</Label>
            <Input
              id="bulkLabelPrefix"
              value={bulkLabelPrefix}
              onChange={(e) => setBulkLabelPrefix(e.target.value)}
              placeholder="Table"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bulkStart">Starting Number</Label>
              <Input
                id="bulkStart"
                value={bulkStart}
                onChange={(e) => setBulkStart(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulkCount">QR Count</Label>
              <Input
                id="bulkCount"
                value={bulkCount}
                onChange={(e) => setBulkCount(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bulk Type</Label>
            <div className="rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-sm">
              Tables only
            </div>
          </div>

          <Button variant="gold" onClick={handleCreateBulkQrs} disabled={isCreatingBulk} className="w-full">
            {isCreatingBulk ? 'Creating QR batch...' : 'Create Bulk QR Batch'}
          </Button>

          <div className="rounded-xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">What this creates</p>
            <p>• Ordering QRs with sequential identifiers, such as Table 1 to Table 10.</p>
            <p>• Each QR is saved into your management library immediately.</p>
            <p>• You can search, archive, download, or delete any QR later.</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold">QR Library</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage all QRs created for this restaurant.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search QR label or link"
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => setShowArchived((prev) => !prev)}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {showArchived ? 'Hide archived' : 'Show archived'}
            </Button>
            <Button variant="outline" onClick={handleClearLibrary} disabled={!library.some((item) => item.mode === 'single')}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear library
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
              No QR codes match your current filters.
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div key={record.id} className="rounded-2xl border border-border/70 bg-background/60 p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-base sm:text-lg">{record.label}</h3>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                          record.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {record.status}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                        {record.mode}
                      </span>
                      {record.batchLabel ? (
                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
                          {record.batchLabel}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{record.locationType ? `${record.locationType} ${record.locationIdentifier || ''}`.trim() : 'Single menu QR'}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{toReadableDate(record.createdAt)}</span>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background/50 p-3 text-xs sm:text-sm break-all text-muted-foreground">
                      {record.targetUrl}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:w-[320px]">
                    <Button variant="outline" size="sm" onClick={() => copyLink(record.targetUrl)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadRecord(record)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleArchiveRecord(record)}>
                      <BadgeCheck className="mr-2 h-4 w-4" />
                      {record.status === 'active' ? 'Archive' : 'Restore'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteRecord(record)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                    <Button variant="gold" size="sm" className="sm:col-span-2" asChild>
                      <a href={record.targetUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open target
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="glass rounded-xl p-4 sm:p-6">
        <h3 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4">Tips for using your QR codes</h3>
        <ul className="space-y-2 sm:space-y-3 text-muted-foreground text-sm">
          <li className="flex items-start gap-2 sm:gap-3">
            <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <span>Use one menu QR for walk-in guests, then create a bulk set for ordering tables.</span>
          </li>
          <li className="flex items-start gap-2 sm:gap-3">
            <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <span>Archive old QR codes instead of deleting them when you want to keep history visible.</span>
          </li>
          <li className="flex items-start gap-2 sm:gap-3">
            <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <span>Your QR links always point to the latest menu and can be reprinted anytime.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}