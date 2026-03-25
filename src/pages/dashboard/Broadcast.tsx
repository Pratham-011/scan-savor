import { useEffect, useMemo, useState } from 'react';
import {
  broadcastApi,
  BroadcastCampaign,
  BroadcastContact,
  BroadcastRecipient,
  WhatsAppTemplate,
} from '@/lib/api';
import {
  Megaphone,
  RefreshCcw,
  Upload,
  Download,
  Plus,
  Loader2,
  AlertCircle,
  Play,
  RotateCw,
  CheckCircle2,
  Truck,
  Eye,
  XCircle,
} from 'lucide-react';

const statusOptions: Array<{ label: string; value: '' | 'pending' | 'sent' | 'delivered' | 'read' | 'failed' }> = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Sent', value: 'sent' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Read', value: 'read' },
  { label: 'Failed', value: 'failed' },
];

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export default function BroadcastPage() {
  const [activeTab, setActiveTab] = useState<'contacts' | 'campaigns'>('contacts');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contacts, setContacts] = useState<BroadcastContact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [contactPage, setContactPage] = useState(1);
  const [contactTotalPages, setContactTotalPages] = useState(1);

  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<BroadcastRecipient[]>([]);
  const [recipientStatus, setRecipientStatus] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientPage, setRecipientPage] = useState(1);
  const [recipientTotalPages, setRecipientTotalPages] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState<BroadcastCampaign | null>(null);
  const [approvedTemplates, setApprovedTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', tags: '' });
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    launch: true,
    scheduleEnabled: false,
    scheduleDate: '',
    scheduleTime: '',
    retryEnabled: true,
    maxRetries: 2,
    retryDelayMinutes: 5,
  });

  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  const loadContacts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await broadcastApi.getContacts(contactPage, 25, contactSearch);
      setContacts(response.contacts);
      setContactTotalPages(response.pagination.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const loadApprovedTemplates = async () => {
    try {
      const response = await broadcastApi.getApprovedTemplates();
      setApprovedTemplates(response.templates || []);
      if (!selectedTemplateId && response.templates?.length > 0) {
        setSelectedTemplateId(response.templates[0]._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approved templates');
    }
  };

  const loadCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await broadcastApi.getCampaigns(1, 30);
      setCampaigns(response.campaigns);
      if (!selectedCampaignId && response.campaigns.length > 0) {
        setSelectedCampaignId(response.campaigns[0]._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCampaignDetail = async () => {
    if (!selectedCampaignId) return;
    setIsLoading(true);
    setError(null);
    try {
      const detail = await broadcastApi.getCampaignDetail(selectedCampaignId, {
        page: recipientPage,
        limit: 30,
        status: recipientStatus || undefined,
        search: recipientSearch || undefined,
      });
      setSelectedCampaign(detail.campaign);
      setRecipients(detail.recipients);
      setRecipientTotalPages(detail.pagination.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign detail');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'contacts') {
      loadContacts();
      loadApprovedTemplates();
    }
  }, [activeTab, contactPage, contactSearch]);

  useEffect(() => {
    if (activeTab === 'campaigns') {
      loadCampaigns();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'campaigns' && selectedCampaignId) {
      loadCampaignDetail();
    }
  }, [activeTab, selectedCampaignId, recipientPage, recipientStatus, recipientSearch]);

  useEffect(() => {
    if (!selectedCampaign) return;
    setNewCampaign((prev) => ({
      ...prev,
      retryEnabled: selectedCampaign.retryAutomation?.enabled ?? true,
      maxRetries: Number(selectedCampaign.retryAutomation?.maxRetries ?? 2),
      retryDelayMinutes: Number(selectedCampaign.retryAutomation?.retryDelayMinutes ?? 5),
    }));
  }, [selectedCampaign?._id]);

  const selectedCount = selectedContactIds.length;
  const deliveryStats = useMemo(() => selectedCampaign?.stats, [selectedCampaign]);

  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const createContact = async () => {
    if (!newContact.phone.trim()) {
      setError('Phone is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await broadcastApi.createContact({
        name: newContact.name.trim(),
        phone: newContact.phone.trim(),
        email: newContact.email.trim(),
        tags: newContact.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setNewContact({ name: '', phone: '', email: '', tags: '' });
      await loadContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contact');
    } finally {
      setIsLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!newCampaign.name.trim()) {
      setError('Campaign name is required');
      return;
    }

    if (!selectedTemplateId) {
      setError('Please select an approved template for broadcast');
      return;
    }

    if (newCampaign.scheduleEnabled && (!newCampaign.scheduleDate || !newCampaign.scheduleTime)) {
      setError('Please choose both schedule date and schedule time');
      return;
    }

    const scheduleAtIso = newCampaign.scheduleEnabled
      ? new Date(`${newCampaign.scheduleDate}T${newCampaign.scheduleTime}`).toISOString()
      : undefined;

    setIsLoading(true);
    setError(null);
    try {
      await broadcastApi.createCampaign({
        name: newCampaign.name.trim(),
        templateId: selectedTemplateId,
        contactIds: selectedContactIds.length > 0 ? selectedContactIds : undefined,
        launch: newCampaign.scheduleEnabled ? false : newCampaign.launch,
        scheduleAt: scheduleAtIso,
        retryAutomation: {
          enabled: newCampaign.retryEnabled,
          maxRetries: Number(newCampaign.maxRetries),
          retryDelayMinutes: Number(newCampaign.retryDelayMinutes),
        },
      });

      setNewCampaign((prev) => ({ ...prev, name: '' }));
      setSelectedContactIds([]);
      await loadCampaigns();
      setActiveTab('campaigns');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const onImportContacts = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      await broadcastApi.importContacts(file);
      await loadContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const retryFailed = async () => {
    if (!selectedCampaignId) return;
    setIsLoading(true);
    setError(null);
    try {
      await broadcastApi.retryFailed(selectedCampaignId);
      await loadCampaignDetail();
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed action failed');
    } finally {
      setIsLoading(false);
    }
  };

  const startDraftCampaign = async () => {
    if (!selectedCampaignId) return;
    setIsLoading(true);
    setError(null);
    try {
      await broadcastApi.startCampaign(selectedCampaignId);
      await loadCampaignDetail();
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const startScheduledCampaign = async () => {
    if (!selectedCampaignId) return;
    setIsLoading(true);
    setError(null);
    try {
      await broadcastApi.startNowCampaign(selectedCampaignId);
      await loadCampaignDetail();
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start campaign now');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRetrySettings = async () => {
    if (!selectedCampaignId) return;
    setIsLoading(true);
    setError(null);
    try {
      await broadcastApi.updateRetryConfig(selectedCampaignId, {
        enabled: newCampaign.retryEnabled,
        maxRetries: Number(newCampaign.maxRetries),
        retryDelayMinutes: Number(newCampaign.retryDelayMinutes),
      });
      await loadCampaignDetail();
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update retry settings');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSelectedCampaign = async () => {
    if (!selectedCampaignId) return;
    setIsLoading(true);
    setError(null);
    try {
      await broadcastApi.refreshCampaign(selectedCampaignId);
      await loadCampaignDetail();
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh campaign');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gradient-gold flex items-center gap-3">
          <Megaphone className="h-8 w-8 text-primary" />
          Broadcast Center
        </h1>
        <p className="text-muted-foreground">
          Send bulk WhatsApp campaigns, track delivery states, import/export customer sheets, and automate retries.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
            activeTab === 'contacts' ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 hover:bg-secondary'
          }`}
        >
          Contacts
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
            activeTab === 'campaigns' ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 hover:bg-secondary'
          }`}
        >
          Campaigns
        </button>
        <button
          onClick={() => (activeTab === 'contacts' ? loadContacts() : loadCampaigns())}
          className="px-4 py-2 rounded-lg text-sm font-semibold border border-border/60 hover:bg-secondary flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <input
                value={newContact.name}
                onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Name"
                className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
              />
              <input
                value={newContact.phone}
                onChange={(e) => setNewContact((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone (with country code)"
                className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
              />
              <input
                value={newContact.email}
                onChange={(e) => setNewContact((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
              />
              <input
                value={newContact.tags}
                onChange={(e) => setNewContact((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="Tags: vip,repeat"
                className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={createContact}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Contact
              </button>

              <label className="px-4 py-2 rounded-lg border border-border/60 text-sm font-semibold hover:bg-secondary cursor-pointer flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onImportContacts(file);
                    }
                    e.currentTarget.value = '';
                  }}
                />
              </label>

              <button
                onClick={() => broadcastApi.syncCustomersToContacts().then(loadContacts).catch((err) => setError(err.message))}
                className="px-4 py-2 rounded-lg border border-border/60 text-sm font-semibold hover:bg-secondary"
              >
                Sync Customers
              </button>

              <button
                onClick={() => broadcastApi.exportContacts().catch((err) => setError(err.message))}
                className="px-4 py-2 rounded-lg border border-border/60 text-sm font-semibold hover:bg-secondary flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Contacts
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/50 p-4">
            <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between mb-4">
              <input
                value={contactSearch}
                onChange={(e) => {
                  setContactSearch(e.target.value);
                  setContactPage(1);
                }}
                placeholder="Search contacts"
                className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm md:w-72"
              />
              <p className="text-sm text-muted-foreground">Selected for next campaign: {selectedCount}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border/30">
                    <th className="py-2 pr-2">Use</th>
                    <th className="py-2 pr-2">Name</th>
                    <th className="py-2 pr-2">Phone</th>
                    <th className="py-2 pr-2">Source</th>
                    <th className="py-2 pr-2">Last Interaction</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact._id} className="border-b border-border/20">
                      <td className="py-2 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact._id)}
                          onChange={() => toggleContactSelection(contact._id)}
                        />
                      </td>
                      <td className="py-2 pr-2">{contact.name || '-'}</td>
                      <td className="py-2 pr-2 font-mono">{contact.phone}</td>
                      <td className="py-2 pr-2 uppercase text-xs">{contact.source}</td>
                      <td className="py-2 pr-2">{formatDate(contact.lastInteractionAt)}</td>
                      <td className="py-2">
                        <button
                          onClick={() => broadcastApi.deleteContact(contact._id).then(loadContacts).catch((err) => setError(err.message))}
                          className="px-2 py-1 rounded border border-border/60 hover:bg-secondary"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setContactPage((prev) => Math.max(1, prev - 1))}
                disabled={contactPage <= 1}
                className="px-3 py-1 rounded border border-border/60 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-muted-foreground self-center">{contactPage} / {contactTotalPages}</span>
              <button
                onClick={() => setContactPage((prev) => Math.min(contactTotalPages, prev + 1))}
                disabled={contactPage >= contactTotalPages}
                className="px-3 py-1 rounded border border-border/60 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3">
            <h2 className="text-lg font-semibold">Create Broadcast Campaign</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={newCampaign.name}
                onChange={(e) => setNewCampaign((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Campaign name"
                className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newCampaign.launch}
                  onChange={(e) => setNewCampaign((prev) => ({ ...prev, launch: e.target.checked }))}
                  disabled={newCampaign.scheduleEnabled}
                />
                <span className="text-sm">Launch immediately</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="rounded-lg border border-border/60 p-3 text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newCampaign.scheduleEnabled}
                  onChange={(e) =>
                    setNewCampaign((prev) => ({
                      ...prev,
                      scheduleEnabled: e.target.checked,
                      launch: e.target.checked ? false : prev.launch,
                    }))
                  }
                />
                Schedule broadcast
              </label>
              <label className="rounded-lg border border-border/60 p-3 text-sm">
                <span className="block text-xs text-muted-foreground mb-1">Schedule date</span>
                <input
                  type="date"
                  value={newCampaign.scheduleDate}
                  onChange={(e) => setNewCampaign((prev) => ({ ...prev, scheduleDate: e.target.value }))}
                  disabled={!newCampaign.scheduleEnabled}
                  className="w-full px-2 py-1 rounded border border-border/60 bg-background/50 text-sm disabled:opacity-50"
                />
              </label>
              <label className="rounded-lg border border-border/60 p-3 text-sm">
                <span className="block text-xs text-muted-foreground mb-1">Schedule time</span>
                <input
                  type="time"
                  value={newCampaign.scheduleTime}
                  onChange={(e) => setNewCampaign((prev) => ({ ...prev, scheduleTime: e.target.value }))}
                  disabled={!newCampaign.scheduleEnabled}
                  className="w-full px-2 py-1 rounded border border-border/60 bg-background/50 text-sm disabled:opacity-50"
                />
              </label>
            </div>

            <textarea
              value={approvedTemplates.find((tpl) => tpl._id === selectedTemplateId)?.body || ''}
              readOnly
              placeholder="Template preview"
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
              >
                <option value="">Select approved template</option>
                {approvedTemplates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name} ({template.language || 'en_US'})
                  </option>
                ))}
              </select>
              <div className="text-xs text-muted-foreground rounded-lg border border-border/60 p-3 bg-background/30">
                Only approved templates can be sent in broadcast.
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="rounded-lg border border-border/60 p-3 text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newCampaign.retryEnabled}
                  onChange={(e) => setNewCampaign((prev) => ({ ...prev, retryEnabled: e.target.checked }))}
                />
                Retry automation enabled
              </label>
              <label className="rounded-lg border border-border/60 p-3 text-sm">
                <span className="block text-xs text-muted-foreground mb-1">Max retries</span>
                <input
                  type="number"
                  min={0}
                  value={newCampaign.maxRetries}
                  onChange={(e) => setNewCampaign((prev) => ({ ...prev, maxRetries: Number(e.target.value) }))}
                  className="w-full px-2 py-1 rounded border border-border/60 bg-background/50 text-sm"
                />
              </label>
              <label className="rounded-lg border border-border/60 p-3 text-sm">
                <span className="block text-xs text-muted-foreground mb-1">Retry delay (minutes)</span>
                <input
                  type="number"
                  min={1}
                  value={newCampaign.retryDelayMinutes}
                  onChange={(e) => setNewCampaign((prev) => ({ ...prev, retryDelayMinutes: Number(e.target.value) }))}
                  className="w-full px-2 py-1 rounded border border-border/60 bg-background/50 text-sm"
                />
              </label>
            </div>

            <button
              onClick={createCampaign}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Create Campaign
            </button>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-card/50 p-4">
            <div className="flex flex-wrap gap-2">
              {campaigns.map((campaign) => (
                <button
                  key={campaign._id}
                  onClick={() => {
                    setSelectedCampaignId(campaign._id);
                    setRecipientPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    selectedCampaignId === campaign._id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border/60 hover:bg-secondary'
                  }`}
                >
                  {campaign.name} ({campaign.status})
                  {campaign.status === 'scheduled' && campaign.scheduledAt ? ` - ${formatDate(campaign.scheduledAt)}` : ''}
                </button>
              ))}
              {campaigns.length === 0 && <p className="text-sm text-muted-foreground">No campaigns yet</p>}
            </div>
          </div>

          {selectedCampaign && (
            <>
              {selectedCampaign.status === 'scheduled' && selectedCampaign.scheduledAt && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                  Scheduled for: {formatDate(selectedCampaign.scheduledAt)}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{deliveryStats?.total ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Sent</p>
                  <p className="text-2xl font-bold">{deliveryStats?.sent ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="h-3.5 w-3.5" />Delivered</p>
                  <p className="text-2xl font-bold">{deliveryStats?.delivered ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3.5 w-3.5" />Read</p>
                  <p className="text-2xl font-bold">{deliveryStats?.read ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />Failed</p>
                  <p className="text-2xl font-bold">{deliveryStats?.failed ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                  <p className="text-xs text-muted-foreground">Delivery Rate</p>
                  <p className="text-2xl font-bold">{deliveryStats?.deliveryRate ?? 0}%</p>
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3">
                <h3 className="text-lg font-semibold">Retry Automation</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="rounded-lg border border-border/60 p-3 text-sm flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newCampaign.retryEnabled}
                      onChange={(e) => setNewCampaign((prev) => ({ ...prev, retryEnabled: e.target.checked }))}
                    />
                    Enabled
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newCampaign.maxRetries}
                    onChange={(e) => setNewCampaign((prev) => ({ ...prev, maxRetries: Number(e.target.value) }))}
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    placeholder="Max retries"
                  />
                  <input
                    type="number"
                    min={1}
                    value={newCampaign.retryDelayMinutes}
                    onChange={(e) => setNewCampaign((prev) => ({ ...prev, retryDelayMinutes: Number(e.target.value) }))}
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    placeholder="Retry delay minutes"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedCampaign.status === 'draft' && (
                    <button
                      onClick={startDraftCampaign}
                      className="px-4 py-2 rounded-lg border border-border/60 hover:bg-secondary text-sm font-semibold flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Start Draft Campaign
                    </button>
                  )}
                  {selectedCampaign.status === 'scheduled' && (
                    <button
                      onClick={startScheduledCampaign}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Start Now
                    </button>
                  )}
                  <button
                    onClick={updateRetrySettings}
                    className="px-4 py-2 rounded-lg border border-border/60 hover:bg-secondary text-sm font-semibold flex items-center gap-2"
                  >
                    <RotateCw className="h-4 w-4" />
                    Save Retry Settings
                  </button>
                  <button
                    onClick={refreshSelectedCampaign}
                    className="px-4 py-2 rounded-lg border border-border/60 hover:bg-secondary text-sm font-semibold flex items-center gap-2"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Refresh Campaign
                  </button>
                  <button
                    onClick={retryFailed}
                    className="px-4 py-2 rounded-lg border border-border/60 hover:bg-secondary text-sm font-semibold"
                  >
                    Retry Failed Recipients
                  </button>
                  <button
                    onClick={() => selectedCampaignId && broadcastApi.exportCampaignReport(selectedCampaignId).catch((err) => setError(err.message))}
                    className="px-4 py-2 rounded-lg border border-border/60 hover:bg-secondary text-sm font-semibold flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Campaign Sheet
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  <select
                    value={recipientStatus}
                    onChange={(e) => {
                      setRecipientStatus(e.target.value);
                      setRecipientPage(1);
                    }}
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.label} value={option.value}>{option.label}</option>
                    ))}
                  </select>

                  <input
                    value={recipientSearch}
                    onChange={(e) => {
                      setRecipientSearch(e.target.value);
                      setRecipientPage(1);
                    }}
                    placeholder="Search recipient name or phone"
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm md:w-72"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-border/30">
                        <th className="py-2 pr-2">Name</th>
                        <th className="py-2 pr-2">Phone</th>
                        <th className="py-2 pr-2">Status</th>
                        <th className="py-2 pr-2">Attempts</th>
                        <th className="py-2 pr-2">Last Attempt</th>
                        <th className="py-2">Failure Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.map((recipient) => (
                        <tr key={recipient._id} className="border-b border-border/20">
                          <td className="py-2 pr-2">{recipient.name || '-'}</td>
                          <td className="py-2 pr-2 font-mono">{recipient.phone}</td>
                          <td className="py-2 pr-2 uppercase text-xs">{recipient.status}</td>
                          <td className="py-2 pr-2">{recipient.attempts} / {recipient.maxRetries}</td>
                          <td className="py-2 pr-2">{formatDate(recipient.lastAttemptAt)}</td>
                          <td className="py-2 text-xs text-red-300">{recipient.errorMessage || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setRecipientPage((prev) => Math.max(1, prev - 1))}
                    disabled={recipientPage <= 1}
                    className="px-3 py-1 rounded border border-border/60 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-muted-foreground self-center">{recipientPage} / {recipientTotalPages}</span>
                  <button
                    onClick={() => setRecipientPage((prev) => Math.min(recipientTotalPages, prev + 1))}
                    disabled={recipientPage >= recipientTotalPages}
                    className="px-3 py-1 rounded border border-border/60 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {isLoading && (
        <div className="fixed bottom-4 right-4 rounded-full bg-primary text-primary-foreground p-3 shadow-lg">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
    </div>
  );
}
