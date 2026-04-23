import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BadgeCheck, BarChart3, CheckCircle2, Loader2, Megaphone, PauseCircle, PlayCircle, RefreshCcw, Rocket, Save, Search, Wallet, X } from 'lucide-react';
import {
  BroadcastContact,
  MetaAdCampaign,
  MetaAdsConfig,
  MetaAdsInsightResult,
  MetaAdsOverviewResponse,
  WhatsAppWalletSnapshot,
  broadcastApi,
  metaAdsApi,
  whatsappApi,
} from '@/lib/api';

const toDatetimeLocalInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const formatCurrency = (value?: number, currency = 'INR') => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '-';
  if (currency.toUpperCase() === 'INR') {
    return `\u20b9 ${amount.toFixed(2)}`;
  }
  return `${currency} ${amount.toFixed(2)}`;
};

const MIN_CONTACTS = 1000;

const OBJECTIVE_OPTIONS = [
  { value: 'OUTCOME_AWARENESS', label: 'Awareness' },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Engagement' },
  { value: 'OUTCOME_TRAFFIC', label: 'Traffic' },
] as const;

const CTA_OPTIONS = [
  'LEARN_MORE',
  'SHOP_NOW',
  'ORDER_NOW',
  'CONTACT_US',
  'SEND_WHATSAPP_MESSAGE',
] as const;

const splitCsv = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function MetaAdsPage() {
  const [config, setConfig] = useState<Partial<MetaAdsConfig>>({ isEnabled: false });

  const [contacts, setContacts] = useState<BroadcastContact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState('');

  const [audienceSource, setAudienceSource] = useState<'broadcast_contacts' | 'customer_interactions' | 'both' | 'manual'>('broadcast_contacts');
  const [audienceCount, setAudienceCount] = useState(0);
  const [audienceValidation, setAudienceValidation] = useState<{
    total: number;
    minimumRequired: number;
    meetsMinimum: boolean;
    selectedContactCount: number;
  } | null>(null);

  const [campaigns, setCampaigns] = useState<MetaAdCampaign[]>([]);
  const [overview, setOverview] = useState<MetaAdsOverviewResponse | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [insights, setInsights] = useState<MetaAdsInsightResult[]>([]);
  const [insightSummary, setInsightSummary] = useState<{
    impressions: number;
    reach: number;
    clicks: number;
    spend: number;
    conversions: number;
  } | null>(null);

  const [wallet, setWallet] = useState<WhatsAppWalletSnapshot | null>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [uploadingAsset, setUploadingAsset] = useState(false);

  const [draft, setDraft] = useState({
    name: '',
    internalTitle: '',
    objective: 'OUTCOME_TRAFFIC' as 'OUTCOME_TRAFFIC' | 'OUTCOME_ENGAGEMENT' | 'OUTCOME_AWARENESS',
    primaryText: '',
    headline: '',
    description: '',
    callToAction: 'LEARN_MORE' as 'LEARN_MORE' | 'SHOP_NOW' | 'ORDER_NOW' | 'CONTACT_US' | 'SEND_WHATSAPP_MESSAGE',
    contentNotes: '',
    destinationUrl: '',
    mediaType: 'IMAGE' as 'IMAGE' | 'VIDEO',
    imageUrl: '',
    videoUrl: '',
    imageHash: '',
    videoId: '',
    dailyAmount: 200,
    startAt: '',
    endAt: '',
    manualAudienceCount: 0,
    customAudienceName: '',
    locations: '',
    countries: 'IN',
    gender: 'all' as 'all' | 'male' | 'female',
    ageMin: 18,
    ageMax: 65,
    interests: '',
    behaviors: '',
    channels: {
      facebook: true,
      instagram: true,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [adsSearch, setAdsSearch] = useState('');

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign._id === selectedCampaignId) || null,
    [campaigns, selectedCampaignId]
  );

  const overviewAds = useMemo(() => {
    if (overview?.ads?.length) return overview.ads;
    return campaigns.map((campaign) => ({
      id: campaign._id,
      name: campaign.name,
      status: campaign.status,
      createdAt: campaign.createdAt,
      publishedAt: campaign.publishedAt,
      audienceCount: Number(campaign.audience?.estimatedCount || 0),
      minimumRequired: Number(campaign.audience?.minimumRequired || MIN_CONTACTS),
      budget: {
        dailyAmount: Number(campaign.budget?.dailyAmount || 0),
        currency: campaign.budget?.currency || 'INR',
      },
      wallet: {
        estimatedReserve: Number(campaign.wallet?.estimatedReserve || 0),
        currency: campaign.wallet?.currency || campaign.budget?.currency || 'INR',
      },
      analytics: {
        impressions: Number(campaign.analytics?.impressions || campaign.analyticsSnapshot?.metrics?.impressions || 0),
        reach: Number(campaign.analytics?.reach || campaign.analyticsSnapshot?.metrics?.reach || 0),
        clicks: Number(campaign.analytics?.clicks || campaign.analyticsSnapshot?.metrics?.clicks || 0),
        conversions: Number(campaign.analytics?.conversions || campaign.analyticsSnapshot?.metrics?.conversions || 0),
        spend: Number(campaign.analytics?.spend || campaign.analyticsSnapshot?.metrics?.spend || 0),
      },
    }));
  }, [overview, campaigns]);

  const filteredAds = useMemo(() => {
    const term = adsSearch.trim().toLowerCase();
    if (!term) return overviewAds;

    return overviewAds.filter((ad) => ad.name.toLowerCase().includes(term));
  }, [overviewAds, adsSearch]);

  const filteredContacts = useMemo(() => {
    const search = contactSearch.trim().toLowerCase();
    if (!search) return contacts;

    return contacts.filter((contact) => {
      const name = String(contact.name || '').toLowerCase();
      const phone = String(contact.phone || '').toLowerCase();
      const email = String(contact.email || '').toLowerCase();
      return name.includes(search) || phone.includes(search) || email.includes(search);
    });
  }, [contacts, contactSearch]);

  const selectedSet = useMemo(() => new Set(selectedContactIds), [selectedContactIds]);
  const selectedChannels = useMemo(() => {
    const channels: Array<'facebook' | 'instagram'> = [];
    if (draft.channels.facebook) channels.push('facebook');
    if (draft.channels.instagram) channels.push('instagram');
    return channels;
  }, [draft.channels.facebook, draft.channels.instagram]);
  const parsedCountries = useMemo(() => splitCsv(draft.countries.toUpperCase()), [draft.countries]);
  const parsedLocations = useMemo(() => splitCsv(draft.locations), [draft.locations]);
  const parsedInterests = useMemo(() => splitCsv(draft.interests), [draft.interests]);
  const parsedBehaviors = useMemo(() => splitCsv(draft.behaviors), [draft.behaviors]);

  const loadConfig = async () => {
    const response = await metaAdsApi.getConfig();
    setConfig(response.config || {});
  };

  const loadAudiencePreview = async (
    source: 'broadcast_contacts' | 'customer_interactions' | 'both',
    contactIds: string[]
  ) => {
    const response = await metaAdsApi.getAudiencePreview(source, contactIds);
    setAudienceCount(response.total || 0);
  };

  const loadContacts = async () => {
    const response = await broadcastApi.getContacts(1, 2000, '');
    setContacts(response.contacts || []);
  };

  const loadCampaigns = async () => {
    const response = await metaAdsApi.getCampaigns();
    const list = response.campaigns || [];
    setCampaigns(list);
    if (!selectedCampaignId && list.length > 0) {
      setSelectedCampaignId(list[0]._id);
    }
  };

  const loadOverview = async () => {
    const response = await metaAdsApi.getAnalyticsOverview();
    setOverview(response);
  };

  const loadWallet = async () => {
    const response = await whatsappApi.getWallet({ page: 1, limit: 1 });
    setWallet(response.wallet || null);
  };

  const loadInsights = async (campaignId: string) => {
    const response = await metaAdsApi.getCampaignInsights(campaignId, 'last_7d');
    setInsights(response.insights || []);
    setInsightSummary(response.summary || null);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([loadConfig(), loadContacts(), loadCampaigns(), loadOverview(), loadWallet()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Meta Ads data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (audienceSource === 'manual') {
      setAudienceCount(Number(draft.manualAudienceCount) || 0);
      return;
    }

    (async () => {
      try {
        await loadAudiencePreview(
          audienceSource as 'broadcast_contacts' | 'customer_interactions' | 'both',
          audienceSource === 'broadcast_contacts' ? selectedContactIds : []
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to refresh audience preview');
      }
    })();
  }, [audienceSource, selectedContactIds, draft.manualAudienceCount]);

  useEffect(() => {
    if (!selectedCampaignId) return;

    (async () => {
      try {
        setError(null);
        await loadInsights(selectedCampaignId);
      } catch (err) {
        setInsights([]);
        setInsightSummary(null);
      }
    })();
  }, [selectedCampaignId]);

  const toggleContact = (id: string) => {
    setSelectedContactIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredContacts.map((item) => item._id);
    const allSelected = filteredIds.every((id) => selectedSet.has(id));

    if (allSelected) {
      setSelectedContactIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      return;
    }

    setSelectedContactIds((prev) => {
      const merged = new Set(prev);
      filteredIds.forEach((id) => merged.add(id));
      return [...merged];
    });
  };

  const validateStepOne = async () => {
    if (audienceSource === 'manual' && Number(draft.manualAudienceCount) <= 0) {
      setError('Please provide manual audience count for manual source.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const result = await metaAdsApi.validateAudience({
        source: audienceSource,
        contactIds: audienceSource === 'broadcast_contacts' ? selectedContactIds : undefined,
        manualCount: audienceSource === 'manual' ? Number(draft.manualAudienceCount) : undefined,
        estimatedCount: audienceSource === 'manual' ? Number(draft.manualAudienceCount) : undefined,
        minimumRequired: MIN_CONTACTS,
      });

      setAudienceValidation({
        total: result.total,
        minimumRequired: result.minimumRequired,
        meetsMinimum: result.meetsMinimum,
        selectedContactCount: result.selectedContactCount,
      });

      if (!result.meetsMinimum) {
        setError(`Minimum ${result.minimumRequired} contacts required. Currently available: ${result.total}.`);
        return;
      }

      setCurrentStep(2);
      setSuccess('Step 1 verified. You can now create ad draft.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate selected contacts');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await metaAdsApi.updateConfig({
        businessId: config.businessId || '',
        adAccountId: config.adAccountId || '',
        pageId: config.pageId || '',
        pixelId: config.pixelId || '',
        accessToken: config.accessToken || '',
        isEnabled: !!config.isEnabled,
      });
      await loadConfig();
      setSuccess('Meta Ads config updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Meta Ads config');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCreativeAsset = async (file: File) => {
    try {
      setUploadingAsset(true);
      setError(null);
      setSuccess(null);

      const mediaType = file.type.startsWith('video/') ? 'VIDEO' : draft.mediaType;
      const response = await metaAdsApi.uploadAsset(file, { mediaType });
      const asset = response.asset;

      setDraft((prev) => ({
        ...prev,
        mediaType: asset.mediaType,
        imageUrl: asset.mediaType === 'IMAGE' ? String(asset.url || '') : prev.imageUrl,
        videoUrl: asset.mediaType === 'VIDEO' ? String(asset.url || '') : prev.videoUrl,
        imageHash: asset.mediaType === 'IMAGE' ? String(asset.imageHash || '') : prev.imageHash,
        videoId: asset.mediaType === 'VIDEO' ? String(asset.videoId || '') : prev.videoId,
      }));

      setSuccess(
        asset.mediaType === 'VIDEO'
          ? `Video uploaded${asset.videoId ? ' and synced to Meta' : ''}`
          : `Image uploaded${asset.imageHash ? ' and synced to Meta' : ''}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload creative asset');
    } finally {
      setUploadingAsset(false);
    }
  };

  const createCampaign = async () => {
    if (!draft.name.trim() || !draft.internalTitle.trim() || !draft.destinationUrl.trim() || !draft.headline.trim()) {
      setError('Campaign name, internal title, headline, and destination URL are required');
      return;
    }

    if (selectedChannels.length === 0) {
      setError('Select at least one placement channel (Facebook or Instagram).');
      return;
    }

    if (draft.ageMin > draft.ageMax) {
      setError('Age range is invalid. Min age must be less than or equal to max age.');
      return;
    }

    if (audienceSource === 'manual' && Number(draft.manualAudienceCount) <= 0) {
      setError('Manual audience count must be greater than 0.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const validation = await metaAdsApi.validateAudience({
        source: audienceSource,
        contactIds: audienceSource === 'broadcast_contacts' ? selectedContactIds : undefined,
        manualCount: audienceSource === 'manual' ? Number(draft.manualAudienceCount) : undefined,
        estimatedCount: audienceSource === 'manual' ? Number(draft.manualAudienceCount) : undefined,
        minimumRequired: MIN_CONTACTS,
      });

      setAudienceValidation({
        total: validation.total,
        minimumRequired: validation.minimumRequired,
        meetsMinimum: validation.meetsMinimum,
        selectedContactCount: validation.selectedContactCount,
      });

      if (!validation.meetsMinimum) {
        setError(`Minimum ${validation.minimumRequired} contacts required. Currently available: ${validation.total}.`);
        return;
      }

      const payload = {
        name: draft.name.trim(),
        objective: draft.objective,
        adCopy: {
          primaryText: draft.primaryText.trim(),
          headline: draft.headline.trim(),
          description: draft.description.trim(),
          callToAction: draft.callToAction,
          internalTitle: draft.internalTitle.trim(),
          contentNotes: draft.contentNotes.trim() || undefined,
        },
        creative: {
          destinationUrl: draft.destinationUrl.trim(),
          mediaType: draft.mediaType,
          imageUrl: draft.imageUrl.trim() || undefined,
          videoUrl: draft.videoUrl.trim() || undefined,
          imageHash: draft.imageHash.trim() || undefined,
          videoId: draft.videoId.trim() || undefined,
        },
        budget: {
          dailyAmount: Number(draft.dailyAmount),
          currency: 'INR',
        },
        schedule: {
          startAt: draft.startAt || undefined,
          endAt: draft.endAt || undefined,
        },
        audience: {
          source: audienceSource,
          contactIds: audienceSource === 'broadcast_contacts' ? selectedContactIds : undefined,
          countries: parsedCountries.length ? parsedCountries : ['IN'],
          customAudienceName: draft.customAudienceName.trim() || undefined,
          estimatedCount: audienceSource === 'manual' ? Number(draft.manualAudienceCount) : undefined,
          locations: parsedLocations,
          gender: draft.gender,
          ageRange: {
            min: Number(draft.ageMin) || undefined,
            max: Number(draft.ageMax) || undefined,
          },
          interests: parsedInterests,
          behaviors: parsedBehaviors,
        },
        channels: selectedChannels,
        campaignMeta: {
          internalTitle: draft.internalTitle.trim(),
          contentNotes: draft.contentNotes.trim() || undefined,
        },
      };

      if (editingCampaignId) {
        await metaAdsApi.updateCampaign(editingCampaignId, payload);
      } else {
        await metaAdsApi.createCampaign(payload);
      }

      setDraft((prev) => ({
        ...prev,
        name: '',
        internalTitle: '',
        primaryText: '',
        headline: '',
        description: '',
        contentNotes: '',
        destinationUrl: '',
        mediaType: 'IMAGE',
        imageUrl: '',
        videoUrl: '',
        imageHash: '',
        videoId: '',
        startAt: '',
        endAt: '',
      }));
      await loadCampaigns();
      await loadOverview();
      setCurrentStep(3);
      setSuccess(editingCampaignId ? 'Campaign updated successfully.' : 'Draft campaign created. Publish from the ads table actions.');
      setEditingCampaignId(null);
      setIsCreateModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  const refreshManagerData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadCampaigns(), loadOverview(), loadWallet()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh ads manager');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setCurrentStep(1);
    setEditingCampaignId(null);
    setAudienceSource('broadcast_contacts');
    setSelectedContactIds([]);
    setAudienceCount(0);
    setAudienceValidation(null);
    setError(null);
    setSuccess(null);
    setDraft((prev) => ({
      ...prev,
      name: '',
      internalTitle: '',
      objective: 'OUTCOME_TRAFFIC',
      primaryText: '',
      headline: '',
      description: '',
      callToAction: 'LEARN_MORE',
      contentNotes: '',
      destinationUrl: '',
      mediaType: 'IMAGE',
      imageUrl: '',
      videoUrl: '',
      imageHash: '',
      videoId: '',
      dailyAmount: 200,
      startAt: '',
      endAt: '',
      manualAudienceCount: 0,
      customAudienceName: '',
      locations: '',
      countries: 'IN',
      gender: 'all',
      ageMin: 18,
      ageMax: 65,
      interests: '',
      behaviors: '',
      channels: {
        facebook: true,
        instagram: true,
      },
    }));
    setIsCreateModalOpen(true);
  };

  const openEditModal = (campaign: MetaAdCampaign) => {
    setEditingCampaignId(campaign._id);
    setCurrentStep(2);
    setAudienceSource(campaign.audience?.source || 'both');
    setSelectedContactIds(campaign.audience?.source === 'broadcast_contacts' ? (campaign.audience?.contactIds || []) : []);
    setAudienceCount(Number(campaign.audience?.estimatedCount || 0));
    setAudienceValidation({
      total: Number(campaign.audience?.estimatedCount || 0),
      minimumRequired: Number(campaign.audience?.minimumRequired || MIN_CONTACTS),
      meetsMinimum: !!campaign.audience?.meetsMinimum,
      selectedContactCount: Number(campaign.audience?.contactIds?.length || 0),
    });
    setError(null);
    setSuccess(null);

    setDraft((prev) => ({
      ...prev,
      name: campaign.name || '',
      internalTitle: campaign.adCopy?.internalTitle || campaign.campaignMeta?.internalTitle || '',
      objective: campaign.objective || 'OUTCOME_TRAFFIC',
      primaryText: campaign.adCopy?.primaryText || '',
      headline: campaign.adCopy?.headline || '',
      description: campaign.adCopy?.description || '',
      callToAction: (campaign.adCopy?.callToAction as 'LEARN_MORE' | 'SHOP_NOW' | 'ORDER_NOW' | 'CONTACT_US' | 'SEND_WHATSAPP_MESSAGE') || 'LEARN_MORE',
      contentNotes: campaign.adCopy?.contentNotes || campaign.campaignMeta?.contentNotes || '',
      destinationUrl: campaign.creative?.destinationUrl || '',
      mediaType: (campaign.creative?.mediaType || (campaign.creative?.videoId || campaign.creative?.videoUrl ? 'VIDEO' : 'IMAGE')) as 'IMAGE' | 'VIDEO',
      imageUrl: campaign.creative?.imageUrl || '',
      videoUrl: campaign.creative?.videoUrl || '',
      imageHash: campaign.creative?.imageHash || '',
      videoId: campaign.creative?.videoId || '',
      dailyAmount: Number(campaign.budget?.dailyAmount || 0),
      startAt: toDatetimeLocalInput(campaign.schedule?.startAt),
      endAt: toDatetimeLocalInput(campaign.schedule?.endAt),
      manualAudienceCount: Number(campaign.audience?.estimatedCount || 0),
      customAudienceName: campaign.audience?.customAudienceName || '',
      locations: (campaign.audience?.locations || []).join(', '),
      countries: (campaign.audience?.countries || ['IN']).join(','),
      gender: campaign.audience?.gender || 'all',
      ageMin: Number(campaign.audience?.ageRange?.min || 18),
      ageMax: Number(campaign.audience?.ageRange?.max || 65),
      interests: (campaign.audience?.interests || []).join(', '),
      behaviors: (campaign.audience?.behaviors || []).join(', '),
      channels: {
        facebook: (campaign.channels || []).includes('facebook'),
        instagram: (campaign.channels || []).includes('instagram'),
      },
    }));

    setIsCreateModalOpen(true);
  };

  const publishSelectedCampaign = async () => {
    if (!selectedCampaignId) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const response = await metaAdsApi.publishCampaign(selectedCampaignId);
      await loadCampaigns();
      await loadOverview();
      await loadWallet();
      await loadInsights(selectedCampaignId);
      const reserve = response?.wallet?.reserveAmount;
      const walletBalance = response?.wallet?.currentBalance;
      setSuccess(
        reserve != null && walletBalance != null
          ? `Campaign published. Reserve: ${formatCurrency(reserve, response.wallet?.currency || 'INR')} | Wallet: ${formatCurrency(walletBalance, response.wallet?.currency || 'INR')}`
          : 'Campaign published to Meta (in paused state)'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish campaign');
    } finally {
      setLoading(false);
    }
  };

  const updateState = async (state: 'ACTIVE' | 'PAUSED') => {
    if (!selectedCampaignId) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await metaAdsApi.updateCampaignStatus(selectedCampaignId, state);
      await loadCampaigns();
      await loadOverview();
      setSuccess(`Campaign moved to ${state}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update campaign state');
    } finally {
      setLoading(false);
    }
  };

  const insight = insights[0]?.metrics;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-gradient-card p-5 md:p-6 glow-gold">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient-gold flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-primary" />
              Ads manager
            </h1>
            <p className="text-muted-foreground mt-2">
              Create and analyse click-to-WhatsApp ads with OneQR audience data.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95"
          >
            <Rocket className="h-4 w-4" />
            Create Ad
          </button>
        </div>
      </div>

      {(error || success) && (
        <div className={`rounded-lg border p-3 text-sm flex items-center gap-2 ${error ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
          {error ? <AlertCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {error || success}
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show data for:</span>
          <select className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm">
            <option>All time</option>
            <option>Last 30 days</option>
            <option>Last 7 days</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshManagerData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Refresh
          </button>
          <button
            onClick={saveConfig}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-sm font-semibold hover:bg-primary/10 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            Save Config
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-primary/15 bg-gradient-card p-4">
          <p className="text-xs text-muted-foreground">Impressions</p>
          <p className="mt-2 text-2xl font-semibold">{overview?.totals?.impressions ?? 0}</p>
        </div>
        <div className="rounded-xl border border-primary/15 bg-gradient-card p-4">
          <p className="text-xs text-muted-foreground">Total reach</p>
          <p className="mt-2 text-2xl font-semibold">{overview?.totals?.reach ?? 0}</p>
        </div>
        <div className="rounded-xl border border-primary/15 bg-gradient-card p-4">
          <p className="text-xs text-muted-foreground">Total Conversions</p>
          <p className="mt-2 text-2xl font-semibold">{overview?.totals?.conversions ?? 0}</p>
        </div>
        <div className="rounded-xl border border-primary/15 bg-gradient-card p-4">
          <p className="text-xs text-muted-foreground">Amount spent</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(overview?.totals?.spend || 0, 'INR')}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/60 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Ads wallet
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Uses the same wallet tracking as WhatsApp billing.</p>
          </div>
          <button
            onClick={async () => {
              try {
                setLoading(true);
                await loadWallet();
                setSuccess('Wallet refreshed');
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to refresh wallet');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh wallet
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3 mt-4">
          <div className="rounded-lg border border-border/40 bg-background/40 p-4">
            <p className="text-xs text-muted-foreground">Current balance</p>
            <p className="mt-2 text-xl font-semibold">{formatCurrency(wallet?.balance ?? 0, wallet?.currency || 'INR')}</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/40 p-4">
            <p className="text-xs text-muted-foreground">Total debited</p>
            <p className="mt-2 text-xl font-semibold">{formatCurrency(wallet?.totalDebited ?? 0, wallet?.currency || 'INR')}</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/40 p-4">
            <p className="text-xs text-muted-foreground">Last synced</p>
            <p className="mt-2 text-sm font-semibold">{formatDate(wallet?.lastSyncedAt)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-4">
        <h2 className="text-lg font-semibold">Campaigns & analytics</h2>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">Showing {filteredAds.length} ads</p>
          <div className="relative w-full md:w-72">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={adsSearch}
              onChange={(e) => setAdsSearch(e.target.value)}
              placeholder="Search ads"
              className="w-full rounded-lg border border-border/60 bg-background/50 pl-9 pr-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="overflow-auto rounded-lg border border-border/40 bg-background/20">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground border-b border-border/30">
              <tr>
                <th className="px-3 py-2">Ad title</th>
                <th className="px-3 py-2">Created on</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Impressions</th>
                <th className="px-3 py-2">Reach</th>
                <th className="px-3 py-2">Conversions</th>
                <th className="px-3 py-2">Spent</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-border/20 cursor-pointer ${selectedCampaignId === row.id ? 'bg-primary/10' : ''}`}
                  onClick={() => setSelectedCampaignId(row.id)}
                >
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(row.createdAt)}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${row.status === 'published' ? 'bg-emerald-500/15 text-emerald-300' : row.status === 'paused' ? 'bg-amber-500/15 text-amber-300' : row.status === 'failed' ? 'bg-red-500/15 text-red-300' : 'bg-muted text-muted-foreground'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{row.analytics.impressions}</td>
                  <td className="px-3 py-2">{row.analytics.reach}</td>
                  <td className="px-3 py-2">{row.analytics.conversions}</td>
                  <td className="px-3 py-2">{formatCurrency(row.analytics.spend, 'INR')}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedCampaignId(row.id)}
                        className="rounded-md border border-border/60 px-2 py-1 text-xs hover:bg-secondary"
                      >
                        View
                      </button>
                      {row.status !== 'published' && (
                        <button
                          onClick={() => {
                            const campaign = campaigns.find((item) => item._id === row.id);
                            if (campaign) {
                              openEditModal(campaign);
                            }
                          }}
                          className="rounded-md border border-border/60 px-2 py-1 text-xs hover:bg-secondary"
                        >
                          Edit
                        </button>
                      )}
                      {row.status !== 'published' && (
                        <button
                          onClick={async () => {
                            setSelectedCampaignId(row.id);
                            await publishSelectedCampaign();
                          }}
                          className="rounded-md border border-primary/40 px-2 py-1 text-xs hover:bg-primary/10"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm"
          >
            <option value="">Select campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign._id} value={campaign._id}>
                {campaign.name} ({campaign.status})
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={publishSelectedCampaign}
              disabled={!selectedCampaignId || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
            >
              <Rocket className="h-4 w-4" />
              Step 3: Publish
            </button>
            <button
              onClick={() => updateState('ACTIVE')}
              disabled={!selectedCampaignId || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
            >
              <PlayCircle className="h-4 w-4" />
              Active
            </button>
            <button
              onClick={() => updateState('PAUSED')}
              disabled={!selectedCampaignId || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
            >
              <PauseCircle className="h-4 w-4" />
              Pause
            </button>
          </div>
        </div>

        {selectedCampaign && (
          <div className="grid gap-3 md:grid-cols-5">
            <div className="rounded-lg border border-border/40 bg-background/40 p-4">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="mt-2 text-lg font-semibold uppercase">{selectedCampaign.status}</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/40 p-4">
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="mt-2 text-lg font-semibold">{formatCurrency(selectedCampaign.budget?.dailyAmount, selectedCampaign.budget?.currency)}</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/40 p-4">
              <p className="text-xs text-muted-foreground">Audience</p>
              <p className="mt-2 text-lg font-semibold">{selectedCampaign.audience?.estimatedCount || 0}</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/40 p-4">
              <p className="text-xs text-muted-foreground">Minimum required</p>
              <p className="mt-2 text-lg font-semibold">{selectedCampaign.audience?.minimumRequired || MIN_CONTACTS}</p>
              <p className="text-xs mt-1 text-muted-foreground">
                {selectedCampaign.audience?.meetsMinimum ? 'Verified' : 'Not verified'}
              </p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/40 p-4">
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="mt-2 text-sm font-semibold">{formatDate(selectedCampaign.publishedAt)}</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/40 p-4">
              <p className="text-xs text-muted-foreground">Wallet reserve</p>
              <p className="mt-2 text-sm font-semibold">
                {formatCurrency(selectedCampaign.wallet?.estimatedReserve || 0, selectedCampaign.wallet?.currency || selectedCampaign.budget?.currency || 'INR')}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border/40 bg-background/30 p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Insights (Last 7 Days)
          </h3>

          {insight ? (
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-border/40 bg-background/40 p-3">
                <p className="text-xs text-muted-foreground">Impressions</p>
                <p className="mt-1 text-xl font-semibold">{insightSummary?.impressions ?? insight.impressions}</p>
              </div>
              <div className="rounded-lg border border-border/40 bg-background/40 p-3">
                <p className="text-xs text-muted-foreground">Reach</p>
                <p className="mt-1 text-xl font-semibold">{insightSummary?.reach ?? insight.reach}</p>
              </div>
              <div className="rounded-lg border border-border/40 bg-background/40 p-3">
                <p className="text-xs text-muted-foreground">Clicks</p>
                <p className="mt-1 text-xl font-semibold">{insightSummary?.clicks ?? insight.clicks}</p>
              </div>
              <div className="rounded-lg border border-border/40 bg-background/40 p-3">
                <p className="text-xs text-muted-foreground">Spend</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(insightSummary?.spend ?? insight.spend, selectedCampaign?.budget?.currency || 'INR')}</p>
              </div>
              <div className="rounded-lg border border-border/40 bg-background/40 p-3 md:col-span-2">
                <p className="text-xs text-muted-foreground">Conversions</p>
                <p className="mt-1 text-xl font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  {insightSummary?.conversions ?? insight.conversions ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-border/40 bg-background/40 p-3 md:col-span-2">
                <p className="text-xs text-muted-foreground">Health</p>
                <p className="mt-1 text-sm font-semibold">{selectedCampaign?.status === 'published' ? 'Running' : selectedCampaign?.status === 'paused' ? 'Paused' : 'Draft/Failed'}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No insights yet. Publish campaign first and wait for Meta data refresh.</p>
          )}
        </div>
      </div>

      <details className="rounded-xl border border-border/50 bg-card/50 p-5">
        <summary className="cursor-pointer list-none text-sm font-semibold">Advanced Meta ads configuration</summary>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm" placeholder="Business ID" value={String(config.businessId || '')} onChange={(e) => setConfig((prev) => ({ ...prev, businessId: e.target.value }))} />
          <input className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm" placeholder="Ad Account ID (act_xxx or xxx)" value={String(config.adAccountId || '')} onChange={(e) => setConfig((prev) => ({ ...prev, adAccountId: e.target.value }))} />
          <input className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm" placeholder="Page ID" value={String(config.pageId || '')} onChange={(e) => setConfig((prev) => ({ ...prev, pageId: e.target.value }))} />
          <input className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm" placeholder="Pixel ID (optional)" value={String(config.pixelId || '')} onChange={(e) => setConfig((prev) => ({ ...prev, pixelId: e.target.value }))} />
          <input className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm md:col-span-2" placeholder="Access Token" value={String(config.accessToken || '')} onChange={(e) => setConfig((prev) => ({ ...prev, accessToken: e.target.value }))} />
        </div>

        <label className="mt-4 text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!config.isEnabled}
            onChange={(e) => setConfig((prev) => ({ ...prev, isEnabled: e.target.checked }))}
          />
          Enable Meta Ads
        </label>
      </details>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 p-3 md:p-8">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-primary/20 bg-gradient-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">{editingCampaignId ? 'Edit Ad Campaign' : 'Create Ads'}</h3>
                <span className="rounded-full border border-border/60 px-2 py-1 text-xs text-muted-foreground">Step {currentStep}/3</span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-2 hover:bg-secondary"
                aria-label="Close create ad modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6 space-y-5">
              <div className="rounded-xl border border-border/40 bg-background/30 p-4 space-y-3">
                <p className="text-sm font-semibold">Step 1: Audience source and custom targeting</p>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={audienceSource}
                    onChange={(e) => {
                      setAudienceSource(e.target.value as 'broadcast_contacts' | 'customer_interactions' | 'both' | 'manual');
                      setAudienceValidation(null);
                      setCurrentStep(1);
                    }}
                    className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm"
                  >
                    <option value="broadcast_contacts">Selected contacts only</option>
                    <option value="both">All sources (contacts + interactions)</option>
                    <option value="customer_interactions">Customer interactions only</option>
                    <option value="manual">Manual audience</option>
                  </select>
                  <p className="text-sm text-muted-foreground">Estimated count: <span className="font-semibold text-foreground">{audienceCount}</span></p>
                  <p className="text-sm text-muted-foreground">Minimum required: <span className="font-semibold text-foreground">{MIN_CONTACTS}</span></p>
                </div>

                {audienceSource === 'manual' && (
                  <input
                    type="number"
                    min={0}
                    className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm w-full md:max-w-sm"
                    placeholder="Manual audience count"
                    value={draft.manualAudienceCount}
                    onChange={(e) => setDraft((prev) => ({ ...prev, manualAudienceCount: Number(e.target.value) || 0 }))}
                  />
                )}

                {audienceSource === 'broadcast_contacts' && (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        placeholder="Search contacts"
                        className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm min-w-[260px]"
                      />
                      <button
                        onClick={toggleSelectAllFiltered}
                        type="button"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm font-semibold hover:bg-secondary"
                      >
                        Select filtered
                      </button>
                      <span className="text-xs text-muted-foreground">Selected contacts: {selectedContactIds.length}</span>
                    </div>

                    <div className="max-h-56 overflow-auto rounded-lg border border-border/40 bg-background/20">
                      {filteredContacts.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">No contacts found.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="text-left text-xs text-muted-foreground border-b border-border/30">
                            <tr>
                              <th className="px-3 py-2">Pick</th>
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">Phone</th>
                              <th className="px-3 py-2">Email</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredContacts.map((contact) => {
                              const checked = selectedSet.has(contact._id);
                              return (
                                <tr key={contact._id} className="border-b border-border/20">
                                  <td className="px-3 py-2">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleContact(contact._id)}
                                    />
                                  </td>
                                  <td className="px-3 py-2">{contact.name || '-'}</td>
                                  <td className="px-3 py-2">{contact.phone || '-'}</td>
                                  <td className="px-3 py-2">{contact.email || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </>
                )}

                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    placeholder="Custom audience name"
                    value={draft.customAudienceName}
                    onChange={(e) => setDraft((prev) => ({ ...prev, customAudienceName: e.target.value }))}
                  />
                  <input
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    placeholder="Countries (CSV, e.g. IN,AE,US)"
                    value={draft.countries}
                    onChange={(e) => setDraft((prev) => ({ ...prev, countries: e.target.value }))}
                  />
                  <input
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    placeholder="Locations (cities/states CSV)"
                    value={draft.locations}
                    onChange={(e) => setDraft((prev) => ({ ...prev, locations: e.target.value }))}
                  />
                  <select
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    value={draft.gender}
                    onChange={(e) => setDraft((prev) => ({ ...prev, gender: e.target.value as 'all' | 'male' | 'female' }))}
                  >
                    <option value="all">Gender: All</option>
                    <option value="male">Gender: Male</option>
                    <option value="female">Gender: Female</option>
                  </select>
                  <input
                    type="number"
                    min={13}
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    placeholder="Age min"
                    value={draft.ageMin}
                    onChange={(e) => setDraft((prev) => ({ ...prev, ageMin: Number(e.target.value) || 13 }))}
                  />
                  <input
                    type="number"
                    min={13}
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    placeholder="Age max"
                    value={draft.ageMax}
                    onChange={(e) => setDraft((prev) => ({ ...prev, ageMax: Number(e.target.value) || 65 }))}
                  />
                  <input
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm md:col-span-2"
                    placeholder="Interests (CSV)"
                    value={draft.interests}
                    onChange={(e) => setDraft((prev) => ({ ...prev, interests: e.target.value }))}
                  />
                  <input
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    placeholder="Behaviors (CSV)"
                    value={draft.behaviors}
                    onChange={(e) => setDraft((prev) => ({ ...prev, behaviors: e.target.value }))}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={validateStepOne}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                    Verify audience
                  </button>

                  {audienceValidation && (
                    <span className={`text-sm ${audienceValidation.meetsMinimum ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {audienceValidation.meetsMinimum ? 'Ready to proceed' : 'Need more contacts'} ({audienceValidation.total}/{audienceValidation.minimumRequired})
                    </span>
                  )}
                </div>
              </div>

              <div className={`rounded-xl border p-4 space-y-3 ${currentStep >= 2 ? 'border-primary/30 bg-background/30' : 'border-border/40 bg-background/20 opacity-70'}`}>
                <p className="text-sm font-semibold">Step 2: Campaign + ad content + channels</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    placeholder="Campaign name"
                    value={draft.name}
                    onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <input
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    placeholder="Title (internal understanding)"
                    value={draft.internalTitle}
                    onChange={(e) => setDraft((prev) => ({ ...prev, internalTitle: e.target.value }))}
                  />
                  <select
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    value={draft.objective}
                    onChange={(e) => setDraft((prev) => ({ ...prev, objective: e.target.value as 'OUTCOME_TRAFFIC' | 'OUTCOME_ENGAGEMENT' | 'OUTCOME_AWARENESS' }))}
                  >
                    {OBJECTIVE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                  <input
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    type="number"
                    min={1}
                    placeholder="Daily budget"
                    value={draft.dailyAmount}
                    onChange={(e) => setDraft((prev) => ({ ...prev, dailyAmount: Number(e.target.value) || 0 }))}
                  />
                  <input
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    type="datetime-local"
                    placeholder="Start time"
                    value={draft.startAt}
                    onChange={(e) => setDraft((prev) => ({ ...prev, startAt: e.target.value }))}
                  />
                  <input
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    type="datetime-local"
                    placeholder="End time"
                    value={draft.endAt}
                    onChange={(e) => setDraft((prev) => ({ ...prev, endAt: e.target.value }))}
                  />
                  <input
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm md:col-span-2"
                    placeholder="Headline"
                    value={draft.headline}
                    onChange={(e) => setDraft((prev) => ({ ...prev, headline: e.target.value }))}
                  />
                  <select
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    value={draft.callToAction}
                    onChange={(e) => setDraft((prev) => ({ ...prev, callToAction: e.target.value as 'LEARN_MORE' | 'SHOP_NOW' | 'ORDER_NOW' | 'CONTACT_US' | 'SEND_WHATSAPP_MESSAGE' }))}
                  >
                    {CTA_OPTIONS.map((cta) => (
                      <option key={cta} value={cta}>{cta.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  <textarea
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm md:col-span-3"
                    placeholder="Primary content"
                    value={draft.primaryText}
                    onChange={(e) => setDraft((prev) => ({ ...prev, primaryText: e.target.value }))}
                  />
                  <textarea
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm md:col-span-3"
                    placeholder="Description"
                    value={draft.description}
                    onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                  />
                  <textarea
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm md:col-span-3"
                    placeholder="Internal content notes (optional)"
                    value={draft.contentNotes}
                    onChange={(e) => setDraft((prev) => ({ ...prev, contentNotes: e.target.value }))}
                  />
                  <input
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm md:col-span-2"
                    placeholder="CTA link / destination URL"
                    value={draft.destinationUrl}
                    onChange={(e) => setDraft((prev) => ({ ...prev, destinationUrl: e.target.value }))}
                  />
                  <select
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    value={draft.mediaType}
                    onChange={(e) => setDraft((prev) => ({ ...prev, mediaType: e.target.value as 'IMAGE' | 'VIDEO' }))}
                  >
                    <option value="IMAGE">Creative type: Image</option>
                    <option value="VIDEO">Creative type: Video</option>
                  </select>
                  <input
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm md:col-span-2"
                    placeholder={draft.mediaType === 'VIDEO' ? 'Video URL (optional)' : 'Image URL (optional)'}
                    value={draft.mediaType === 'VIDEO' ? draft.videoUrl : draft.imageUrl}
                    onChange={(e) => setDraft((prev) => (
                      draft.mediaType === 'VIDEO'
                        ? { ...prev, videoUrl: e.target.value }
                        : { ...prev, imageUrl: e.target.value }
                    ))}
                  />
                  <div className="md:col-span-3 flex flex-col gap-2 rounded-lg border border-border/40 bg-background/20 p-3">
                    <p className="text-xs text-muted-foreground">Upload creative asset (auto stores Cloudinary URL and Meta image hash/video id when possible)</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="file"
                        accept={draft.mediaType === 'VIDEO' ? 'video/*' : 'image/*'}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await handleUploadCreativeAsset(file);
                          }
                          e.currentTarget.value = '';
                        }}
                        className="text-sm"
                        disabled={uploadingAsset}
                      />
                      {uploadingAsset && (
                        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Uploading...
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Image hash: {draft.imageHash || '-'}</p>
                      <p>Video id: {draft.videoId || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-muted-foreground">Post channels:</p>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.channels.facebook}
                      onChange={(e) => setDraft((prev) => ({
                        ...prev,
                        channels: {
                          ...prev.channels,
                          facebook: e.target.checked,
                        },
                      }))}
                    />
                    Facebook
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.channels.instagram}
                      onChange={(e) => setDraft((prev) => ({
                        ...prev,
                        channels: {
                          ...prev.channels,
                          instagram: e.target.checked,
                        },
                      }))}
                    />
                    Instagram
                  </label>
                </div>

                <button
                  onClick={() => setCurrentStep(3)}
                  type="button"
                  disabled={currentStep < 2}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
                >
                  Review Preview
                </button>
              </div>

              <div className={`rounded-xl border p-4 space-y-3 ${currentStep >= 3 ? 'border-primary/30 bg-background/30' : 'border-border/40 bg-background/20 opacity-70'}`}>
                <p className="text-sm font-semibold">Step 3: Preview and create draft</p>
                <div className="rounded-xl border border-primary/20 bg-background/40 p-4 space-y-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Ad preview</p>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{draft.internalTitle || 'Internal title'}</p>
                    <p className="text-xl font-semibold">{draft.headline || 'Headline preview'}</p>
                    <p className="text-sm text-muted-foreground">{draft.primaryText || 'Primary content preview'}</p>
                    <p className="text-sm">{draft.description || 'Description preview'}</p>
                    <p className="text-sm text-primary">{draft.destinationUrl || 'https://your-link-here.com'}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border/60 px-2 py-1">{OBJECTIVE_OPTIONS.find((item) => item.value === draft.objective)?.label || 'Objective'}</span>
                      <span className="rounded-full border border-border/60 px-2 py-1">CTA: {draft.callToAction.replace(/_/g, ' ')}</span>
                      <span className="rounded-full border border-border/60 px-2 py-1">Budget: {formatCurrency(draft.dailyAmount, 'INR')}/day</span>
                      <span className="rounded-full border border-border/60 px-2 py-1">Channels: {selectedChannels.length ? selectedChannels.join(', ') : 'none'}</span>
                      <span className="rounded-full border border-border/60 px-2 py-1">Audience: {audienceCount}</span>
                      <span className="rounded-full border border-border/60 px-2 py-1">Creative: {draft.mediaType}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Asset URL: {draft.mediaType === 'VIDEO' ? (draft.videoUrl || '-') : (draft.imageUrl || '-')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={createCampaign}
                  disabled={loading || currentStep < 3}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  {editingCampaignId ? 'Update Campaign' : 'Create Draft'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
