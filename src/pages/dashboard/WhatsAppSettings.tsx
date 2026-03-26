import { useEffect, useState } from 'react';
import { AlertCircle, Check, Copy, Eye, EyeOff, Loader2, RefreshCcw, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  whatsappApi,
  WhatsAppConfig,
  WhatsAppWalletSnapshot,
  WhatsAppWalletTransaction,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface WhatsAppSettingsProps {
  restaurantId: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const formatAmount = (amount?: number | null, currency?: string | null) => {
  if (amount == null) return '-';
  const safeAmount = Number(amount);
  if (!Number.isFinite(safeAmount)) return '-';
  return `${currency || ''} ${safeAmount.toFixed(4)}`.trim();
};

const humanizeSource = (value?: string | null) => {
  const normalized = String(value || 'other').replace(/_/g, ' ').trim();
  return normalized ? normalized.replace(/\b\w/g, (char) => char.toUpperCase()) : 'Other';
};

const transactionBadgeClass = (status?: string) => {
  if (status === 'posted') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (status === 'failed') return 'border-red-500/30 bg-red-500/10 text-red-300';
  return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
};

export default function WhatsAppSettings({ restaurantId }: WhatsAppSettingsProps) {
  void restaurantId;

  const [config, setConfig] = useState<Partial<WhatsAppConfig>>({
    businessId: '',
    wabaId: '',
    accessToken: '',
    phoneNumberId: '',
    phoneNumber: '',
    qrPrefillMessage: 'Hi, please share your menu',
    isEnabled: true,
    qrRedirectEnabled: false,
    autoReplyEnabled: true,
    autoReplyTriggerMessage: '',
    autoReplyMatchType: 'contains',
    autoReplyResponseType: 'auto',
    autoReplyTemplateId: null,
    autoReplyText: 'Hi {{customer_name}}, here is our menu: {{menu_link}}',
  });

  const [wallet, setWallet] = useState<WhatsAppWalletSnapshot | null>(null);
  const [transactions, setTransactions] = useState<WhatsAppWalletTransaction[]>([]);
  const [walletPage, setWalletPage] = useState(1);
  const [walletTotalPages, setWalletTotalPages] = useState(1);
  const [walletSourceFilter, setWalletSourceFilter] = useState('');
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isWalletLoading, setIsWalletLoading] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadWallet = async (refresh = false) => {
    try {
      setIsWalletLoading(true);
      setWalletError(null);
      const response = await whatsappApi.getWallet({
        page: walletPage,
        limit: 12,
        sourceType: walletSourceFilter || undefined,
        refresh,
      });
      setWallet(response.wallet);
      setTransactions(response.transactions || []);
      setWalletTotalPages(response.pagination.totalPages || 1);
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : 'Failed to load wallet');
    } finally {
      setIsWalletLoading(false);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { whatsapp } = await whatsappApi.getSettings();
        setConfig((prev) => ({
          ...prev,
          ...whatsapp,
          autoReplyTriggerMessage:
            typeof whatsapp?.autoReplyTriggerMessage === 'string'
              ? whatsapp.autoReplyTriggerMessage
              : (typeof whatsapp?.qrPrefillMessage === 'string' ? whatsapp.qrPrefillMessage : prev.autoReplyTriggerMessage),
        }));
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to load WhatsApp settings');
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    loadWallet();
  }, [walletPage, walletSourceFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
    setSaveError(null);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    const hasRequiredFields =
      config.wabaId?.trim() &&
      config.accessToken?.trim() &&
      config.phoneNumberId?.trim() &&
      config.phoneNumber?.trim();

    if (!hasRequiredFields && !config.qrRedirectEnabled) {
      setSaveError('Please fill in all WhatsApp Business credentials to enable WhatsApp');
      return;
    }

    try {
      setIsSaving(true);

      if (config.qrRedirectEnabled || config.isEnabled !== undefined || config.autoReplyEnabled !== undefined) {
        await whatsappApi.updateSettings({
          isEnabled: config.isEnabled,
          qrRedirectEnabled: config.qrRedirectEnabled,
          autoReplyEnabled: config.autoReplyEnabled,
          qrPrefillMessage: config.qrPrefillMessage,
          autoReplyTriggerMessage: config.autoReplyTriggerMessage,
          autoReplyMatchType: config.autoReplyMatchType,
          autoReplyResponseType: config.autoReplyResponseType,
          autoReplyTemplateId: config.autoReplyTemplateId || null,
          autoReplyText: config.autoReplyText,
        });
      }

      if (hasRequiredFields && config.accessToken) {
        await whatsappApi.configureSettings(config as WhatsAppConfig);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualWalletSync = async () => {
    try {
      setIsWalletLoading(true);
      setWalletError(null);
      const response = await whatsappApi.syncWallet();
      setWallet(response.wallet);
      setWalletPage(1);
      const refreshed = await whatsappApi.getWallet({ page: 1, limit: 12, sourceType: walletSourceFilter || undefined });
      setTransactions(refreshed.transactions || []);
      setWalletTotalPages(refreshed.pagination.totalPages || 1);
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : 'Wallet sync failed');
    } finally {
      setIsWalletLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">WhatsApp Business Integration</h1>
        <p className="text-muted-foreground mt-2">
          Configure your WhatsApp Business Account, monitor wallet balance, and track message spend.
        </p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-5">
        <h2 className="text-lg font-semibold">WhatsApp Flow Controls</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border/40 bg-background/40 p-3">
            <p className="text-sm font-medium mb-2">Enable WhatsApp</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Master switch</span>
              <Switch
                checked={!!config.isEnabled}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, isEnabled: checked }))}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-background/40 p-3">
            <p className="text-sm font-medium mb-2">QR Redirect to WhatsApp</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Use same QR, open WhatsApp first</span>
              <Switch
                checked={!!config.qrRedirectEnabled}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, qrRedirectEnabled: checked }))}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-background/40 p-3">
            <p className="text-sm font-medium mb-2">Auto Reply</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Send menu template automatically</span>
              <Switch
                checked={!!config.autoReplyEnabled}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, autoReplyEnabled: checked }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Wallet Tracking</h2>
            <p className="text-sm text-muted-foreground">
              Read-only wallet visibility. Sync current balance from Meta and track where credits are spent.
            </p>
          </div>

          <button
            onClick={handleManualWalletSync}
            disabled={isWalletLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
          >
            {isWalletLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Sync Wallet
          </button>
        </div>

        {walletError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {walletError}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-border/40 bg-background/40 p-4">
            <p className="text-xs text-muted-foreground">Current Balance</p>
            <p className="mt-2 text-2xl font-bold">{formatAmount(wallet?.balance, wallet?.currency)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Last sync: {formatDate(wallet?.lastSyncedAt)}</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/40 p-4">
            <p className="text-xs text-muted-foreground">Total Credited</p>
            <p className="mt-2 text-2xl font-bold text-emerald-300">{formatAmount(wallet?.totalCredited, wallet?.currency)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{wallet?.creditCount ?? 0} entries</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/40 p-4">
            <p className="text-xs text-muted-foreground">Total Debited</p>
            <p className="mt-2 text-2xl font-bold text-amber-300">{formatAmount(wallet?.totalDebited, wallet?.currency)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{wallet?.debitCount ?? 0} entries</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/40 p-4">
            <p className="text-xs text-muted-foreground">Last Sync Status</p>
            <p className="mt-2 text-sm font-semibold">{wallet?.lastSyncError ? 'Attention Needed' : 'Healthy'}</p>
            <p className="mt-1 text-xs text-muted-foreground break-words">{wallet?.lastSyncError || 'Balance is available from the latest Meta sync.'}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-background/30 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-sm font-semibold">Spend By Source</h3>
            <select
              value={walletSourceFilter}
              onChange={(e) => {
                setWalletPage(1);
                setWalletSourceFilter(e.target.value);
              }}
              className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm"
            >
              <option value="">All Sources</option>
              <option value="broadcast">Broadcast</option>
              <option value="quick_reply">Quick Reply</option>
              <option value="chat">Chat</option>
              <option value="manual_sync">Manual Sync</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {(wallet?.spendBySource || []).length > 0 ? (
              wallet?.spendBySource.map((row) => (
                <div key={row.sourceType} className="rounded-lg border border-border/40 bg-background/40 p-4">
                  <p className="text-sm font-semibold">{humanizeSource(row.sourceType)}</p>
                  <p className="mt-2 text-lg font-bold">{formatAmount(row.totalAmount, wallet?.currency)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.count} transactions, {row.billableCount} billable
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No wallet transactions tracked yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-background/30 p-4">
          <h3 className="text-sm font-semibold">Wallet Transactions</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-left">
                  <th className="py-2 pr-2">When</th>
                  <th className="py-2 pr-2">Source</th>
                  <th className="py-2 pr-2">Direction</th>
                  <th className="py-2 pr-2">Amount</th>
                  <th className="py-2 pr-2">Recipient</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Conversation</th>
                  <th className="py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-border/20">
                      <td className="py-2 pr-2 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                      <td className="py-2 pr-2">{humanizeSource(tx.sourceType)}</td>
                      <td className="py-2 pr-2 uppercase text-xs">{tx.direction}</td>
                      <td className="py-2 pr-2">{formatAmount(tx.amount, tx.currency || wallet?.currency)}</td>
                      <td className="py-2 pr-2 font-mono text-xs">{tx.recipientPhone || '-'}</td>
                      <td className="py-2 pr-2">
                        <span className={cn('inline-flex rounded-full border px-2 py-1 text-[11px] font-medium', transactionBadgeClass(tx.status))}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-2 pr-2 text-xs">
                        {tx.conversationCategory || tx.pricingModel || tx.metaStatus || '-'}
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">{tx.note || tx.templateName || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                      No wallet transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setWalletPage((prev) => Math.max(1, prev - 1))}
              disabled={walletPage <= 1}
              className="rounded border border-border/60 px-3 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="self-center text-sm text-muted-foreground">
              {walletPage} / {walletTotalPages}
            </span>
            <button
              onClick={() => setWalletPage((prev) => Math.min(walletTotalPages, prev + 1))}
              disabled={walletPage >= walletTotalPages}
              className="rounded border border-border/60 px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Automation Management</h2>
        <p className="text-sm text-muted-foreground">
          Templates and quick replies are managed from the dedicated automation page.
        </p>
        <Link
          to="/dashboard/whatsapp-automation"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Open WhatsApp Automation
        </Link>
      </div>

      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="text-sm text-blue-900 dark:text-blue-300">
            <p className="mb-1 font-semibold">How to get your credentials:</p>
            <ol className="list-inside list-decimal space-y-1 text-xs">
              <li>Go to <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">business.facebook.com</a></li>
              <li>Create or sign in to your Meta Business Account</li>
              <li>Set up WhatsApp Business App from App Dashboard</li>
              <li>Generate a permanent access token in App Roles</li>
              <li>Copy Business ID, WABA ID, Phone Number ID, and WhatsApp Number</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border/50 bg-card/50 p-6">
        <div>
          <label className="mb-2 block text-sm font-semibold">Meta Business ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="businessId"
              value={config.businessId || ''}
              onChange={handleInputChange}
              placeholder="e.g., 123456789012345"
              className="flex-1 rounded-lg border border-border/60 bg-background/50 px-4 py-2 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
            {config.businessId && (
              <button
                onClick={() => handleCopy(config.businessId || '', 'businessId')}
                className="rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 transition-colors hover:bg-secondary"
              >
                {copiedField === 'businessId' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Used for Meta wallet balance sync.</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">WABA ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="wabaId"
              value={config.wabaId || ''}
              onChange={handleInputChange}
              placeholder="e.g., 123456789"
              className="flex-1 rounded-lg border border-border/60 bg-background/50 px-4 py-2 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
            {config.wabaId && (
              <button
                onClick={() => handleCopy(config.wabaId || '', 'wabaId')}
                className="rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 transition-colors hover:bg-secondary"
              >
                {copiedField === 'wabaId' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Phone Number ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="phoneNumberId"
              value={config.phoneNumberId || ''}
              onChange={handleInputChange}
              placeholder="e.g., 123456789"
              className="flex-1 rounded-lg border border-border/60 bg-background/50 px-4 py-2 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
            {config.phoneNumberId && (
              <button
                onClick={() => handleCopy(config.phoneNumberId || '', 'phoneNumberId')}
                className="rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 transition-colors hover:bg-secondary"
              >
                {copiedField === 'phoneNumberId' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">WhatsApp Business Number</label>
          <input
            type="tel"
            name="phoneNumber"
            value={config.phoneNumber || ''}
            onChange={handleInputChange}
            placeholder="e.g., +917000000000"
            className="w-full rounded-lg border border-border/60 bg-background/50 px-4 py-2 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Permanent Access Token</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showAccessToken ? 'text' : 'password'}
                name="accessToken"
                value={config.accessToken || ''}
                onChange={handleInputChange}
                placeholder="Your permanent access token"
                className="w-full rounded-lg border border-border/60 bg-background/50 px-4 py-2 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
              <button
                onClick={() => setShowAccessToken((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {config.accessToken && (
              <button
                onClick={() => handleCopy(config.accessToken || '', 'accessToken')}
                className="rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 transition-colors hover:bg-secondary"
              >
                {copiedField === 'accessToken' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">QR Prefill Message</label>
          <textarea
            name="qrPrefillMessage"
            value={config.qrPrefillMessage || ''}
            onChange={handleInputChange}
            rows={3}
            placeholder="e.g., Hi {{restaurant_name}}, please share your menu [ref:{{ref_code}}]"
            className="w-full resize-none rounded-lg border border-border/60 bg-background/50 px-4 py-2 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Auto Reply Trigger Message</label>
          <input
            type="text"
            name="autoReplyTriggerMessage"
            value={config.autoReplyTriggerMessage || ''}
            onChange={handleInputChange}
            placeholder="Leave empty to use QR prefill message"
            className="w-full rounded-lg border border-border/60 bg-background/50 px-4 py-2 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {saveError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-red-300">{saveError}</p>
          </div>
        )}

        {saveSuccess && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <p className="text-sm text-green-300">Settings saved successfully.</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all duration-200',
              isSaving
                ? 'cursor-not-allowed bg-primary/50 text-muted-foreground'
                : 'bg-gradient-gold text-primary-foreground hover:shadow-lg hover:shadow-primary/20'
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-4 text-sm text-amber-900 dark:text-amber-300">
            <div>
              <p className="mb-2 font-semibold">Webhook Configuration</p>
              <p className="text-xs">Configure this webhook in your Meta App Dashboard:</p>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium">Callback URL</p>
              <div className="rounded border border-border/50 bg-background/50 p-2 font-mono text-xs">
                <code className="text-primary">{window.location.origin.replace(/\/$/, '')}/api/whatsapp/webhook</code>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium">Webhook Fields</p>
              <div className="rounded border border-border/50 bg-background/50 p-2 font-mono text-xs">
                <code className="text-primary">messages</code>, <code className="text-primary">message_template_status_update</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
