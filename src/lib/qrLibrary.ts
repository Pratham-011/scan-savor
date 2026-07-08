// Shared with QRCode.tsx, which is the only place that writes to this storage.
// This is a local display cache for the QR management page (view-only "single"
// QR entries live only here). Ordering table records are persisted server-side
// via tableApi (see src/lib/api.ts) since they need to be validated from any
// customer's device, not just the admin's own browser.

export type QrMode = 'single' | 'ordering';
export type QrLocationType = 'table';
export type ManagedQrStatus = 'active' | 'archived';

export type ManagedQrRecord = {
  id: string;
  label: string;
  mode: QrMode;
  locationType?: QrLocationType;
  locationIdentifier?: string;
  accessCode?: string;
  targetUrl: string;
  batchId?: string;
  batchLabel?: string;
  status: ManagedQrStatus;
  createdAt: string;
  updatedAt: string;
};

export const buildQrLibraryStorageKey = (restaurantId: string) => `oneqr-qr-library:${restaurantId}`;

export const safeParseQrLibrary = (value: string | null): ManagedQrRecord[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is ManagedQrRecord => {
      return Boolean(
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.label === 'string' &&
        typeof item.targetUrl === 'string' &&
        typeof item.status === 'string' &&
        typeof item.createdAt === 'string' &&
        typeof item.updatedAt === 'string'
      );
    });
  } catch {
    return [];
  }
};
