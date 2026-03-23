import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  Pencil,
  Search,
  MessageCircle,
  Instagram,
  Send,
  Eye,
  RefreshCw,
  Sparkles,
  Circle,
} from 'lucide-react';
import { getResolvedApiBase, whatsappApi, WhatsAppTemplate, WhatsAppTemplateButton, WhatsAppTemplateComponent } from '@/lib/api';
import { Switch } from '@/components/ui/switch';
import TemplatePreviewModal from '@/components/dashboard/TemplatePreviewModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


type ChannelType = 'whatsapp' | 'instagram' | 'messenger';
type TemplateFilter = 'all' | 'active' | 'inactive';
type TemplateStatus =
  | 'all'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'paused'
  | 'disabled'
  | 'appeal_requested'
  | 'pending_deletion'
  | 'unknown';
type TemplateCategory = 'all' | 'marketing' | 'utility' | 'authentication' | 'custom';
type TemplateHeaderType = 'none' | 'text' | 'image' | 'video' | 'document';
type TemplateButtonType = WhatsAppTemplateButton['type'];

const defaultTemplateBody = 'Hi {{customer_name}}, here is our menu: {{menu_link}}';
const languageOptions = [
  { value: 'en_US', label: 'English (US)' },
  { value: 'en_GB', label: 'English (UK)' },
  { value: 'hi_IN', label: 'Hindi' },
  { value: 'mr_IN', label: 'Marathi' },
  { value: 'bn_IN', label: 'Bengali' },
];

const createEmptyButton = (): WhatsAppTemplateButton => ({
  type: 'quick_reply',
  text: '',
});

const getStaticTextLength = (text = '', parameterFormat: 'named' | 'positional' = 'named') => {
  const pattern = parameterFormat === 'positional'
    ? /{{\s*\d+\s*}}/g
    : /{{\s*[a-z0-9_]+\s*}}/gi;

  return text.replace(pattern, '').replace(/\s+/g, ' ').trim().length;
};

const categoryLabel: Record<Exclude<TemplateCategory, 'all'>, string> = {
  marketing: 'Marketing',
  utility: 'Utility',
  authentication: 'Authentication',
  custom: 'Custom',
};

const statusLabel: Record<Exclude<TemplateStatus, 'all'>, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  paused: 'Paused',
  disabled: 'Disabled',
  appeal_requested: 'Appeal Requested',
  pending_deletion: 'Pending Deletion',
  unknown: 'Unknown',
};

const categoryColorMap: Record<Exclude<TemplateCategory, 'all'>, string> = {
  marketing: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  utility: 'bg-green-500/20 text-green-300 border border-green-500/30',
  authentication: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  custom: 'bg-muted text-muted-foreground border border-border/50',
};

const statusColorMap: Record<Exclude<TemplateStatus, 'all'>, string> = {
  pending: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  in_review: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  approved: 'bg-green-500/20 text-green-300 border border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border border-red-500/30',
  paused: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  disabled: 'bg-red-700/20 text-red-200 border border-red-700/30',
  appeal_requested: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  pending_deletion: 'bg-yellow-600/20 text-yellow-200 border border-yellow-600/30',
  unknown: 'bg-muted text-muted-foreground border border-border/50',
};

const normalizeTemplateStatus = (rawStatus?: string): Exclude<TemplateStatus, 'all'> => {
  if (!rawStatus) {
    return 'unknown';
  }

  const normalized = rawStatus.trim().toLowerCase();

  if (normalized === 'approved' || normalized.includes('active')) return 'approved';
  if (normalized === 'in_review' || normalized === 'in-review' || normalized === 'pending') return 'in_review';
  if (normalized === 'rejected') return 'rejected';
  if (normalized === 'paused') return 'paused';
  if (normalized === 'disabled') return 'disabled';
  if (normalized === 'appeal_requested' || normalized === 'appeal requested') return 'appeal_requested';
  if (normalized === 'pending_deletion' || normalized === 'pending deletion') return 'pending_deletion';

  return 'unknown';
};

const normalizeTemplate = (template: WhatsAppTemplate): WhatsAppTemplate => ({
  ...template,
  status: normalizeTemplateStatus(template.status),
});

const buildTemplateComponents = (
  form: {
    body: string;
    footerText: string;
    headerText: string;
    headerMediaHandle: string;
    headerMediaType: 'image' | 'video' | 'document';
    buttons: WhatsAppTemplateButton[];
  },
  headerType: TemplateHeaderType
): WhatsAppTemplateComponent[] => {
  const components: WhatsAppTemplateComponent[] = [];

  if (headerType === 'text' && form.headerText.trim()) {
    components.push({
      type: 'header',
      format: 'text',
      text: form.headerText.trim(),
    });
  }

  if ((headerType === 'image' || headerType === 'video' || headerType === 'document') && form.headerMediaHandle.trim()) {
    components.push({
      type: 'header',
      format: headerType,
      example: {
        header_handle: [form.headerMediaHandle.trim()],
      },
    });
  }

  components.push({
    type: 'body',
    text: form.body,
  });

  if (form.footerText.trim()) {
    components.push({
      type: 'footer',
      text: form.footerText.trim(),
    });
  }

  const normalizedButtons = form.buttons
    .map((button) => {
      const nextButton: WhatsAppTemplateButton = {
        type: button.type,
        text: button.text.trim(),
      };

      if (!nextButton.text) {
        return null;
      }

      if (button.type === 'url' && button.url?.trim()) {
        nextButton.url = button.url.trim();
        if (button.example) {
          nextButton.example = button.example;
        }
      }

      if (button.type === 'phone_number' && button.phone_number?.trim()) {
        nextButton.phone_number = button.phone_number.trim();
      }

      if (button.type === 'copy_code' && typeof button.example === 'string' && button.example.trim()) {
        nextButton.example = button.example.trim();
      }

      if (button.type === 'otp') {
        nextButton.otp_type = button.otp_type || 'copy_code';
      }

      return nextButton;
    })
    .filter((button): button is WhatsAppTemplateButton => !!button);

  if (normalizedButtons.length > 0) {
    components.push({
      type: 'buttons',
      buttons: normalizedButtons,
    });
  }

  return components;
};

const getTemplateEditorState = (template: WhatsAppTemplate) => {
  const templateComponents = (template.components || []) as Array<Record<string, unknown>>;
  const headerComponent = templateComponents.find((comp) => String(comp?.type || '').toLowerCase() === 'header');
  const footerComponent = templateComponents.find((comp) => String(comp?.type || '').toLowerCase() === 'footer');
  const buttonsComponent = templateComponents.find((comp) => String(comp?.type || '').toLowerCase() === 'buttons');
  const headerFormat = String((headerComponent as { format?: string } | undefined)?.format || '').toLowerCase();
  const headerText = String((headerComponent as { text?: string } | undefined)?.text || '');
  const headerHandle =
    ((headerComponent as { example?: { header_handle?: string[] } } | undefined)?.example?.header_handle || [])[0] || '';

  const buttons = (((buttonsComponent as { buttons?: WhatsAppTemplateButton[] } | undefined)?.buttons) || []).map((button) => ({
    type: button.type || 'quick_reply',
    text: button.text || '',
    url: button.url || '',
    phone_number: button.phone_number || '',
    example: Array.isArray(button.example) ? button.example : (button.example || ''),
    otp_type: button.otp_type || 'copy_code',
  }));

  const headerType: TemplateHeaderType =
    headerFormat === 'text' ? 'text' :
    headerFormat === 'image' ? 'image' :
    headerFormat === 'video' ? 'video' :
    headerFormat === 'document' ? 'document' :
    'none';

  return {
    headerType,
    form: {
      name: template.name,
      body: template.body,
      category: template.category,
      language: template.language || 'en_US',
      parameterFormat: template.parameterFormat || 'named',
      headerText,
      headerMediaType: (headerFormat === 'video' || headerFormat === 'document' ? headerFormat : 'image') as 'image' | 'video' | 'document',
      headerMediaHandle: headerHandle,
      footerText: String((footerComponent as { text?: string } | undefined)?.text || ''),
      buttons: buttons.length > 0 ? buttons : [createEmptyButton()],
      isActive: template.isActive,
      isDefault: template.isDefault,
      autoSend: template.autoSend,
    }
  };
};

const validateTemplateFormState = (
  form: {
    name: string;
    body: string;
    parameterFormat: 'named' | 'positional';
    headerText: string;
    headerMediaHandle: string;
    footerText: string;
    buttons: WhatsAppTemplateButton[];
  },
  headerType: TemplateHeaderType
) => {
  const errors: string[] = [];
  const hints: string[] = [];

  const sanitizedName = form.name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 512);

  if (!form.name.trim()) {
    errors.push('Template name is required.');
  } else {
    hints.push(`Name after Meta sanitization: ${sanitizedName || '(invalid)'}`);
  }

  if (!sanitizedName) {
    errors.push('Template name must contain letters, numbers, or underscores after sanitization.');
  }

  if (!form.body.trim()) {
    errors.push('Body is required.');
  }

  if (form.body.length > 1024) {
    errors.push(`Body must be 1024 characters or fewer. Current: ${form.body.length}.`);
  } else {
    hints.push(`Body length: ${form.body.length}/1024`);
  }

  if (headerType === 'text') {
    if (!form.headerText.trim()) {
      errors.push('Header text is required when header type is text.');
    }
    if (form.headerText.length > 60) {
      errors.push(`Header text must be 60 characters or fewer. Current: ${form.headerText.length}.`);
    } else {
      hints.push(`Header text length: ${form.headerText.length}/60`);
    }
  }

  if ((headerType === 'image' || headerType === 'video' || headerType === 'document') && !form.headerMediaHandle.trim()) {
    errors.push(`Meta ${headerType} handle is required for a ${headerType} header.`);
  }

  if (form.footerText.length > 60) {
    errors.push(`Footer must be 60 characters or fewer. Current: ${form.footerText.length}.`);
  } else {
    hints.push(`Footer length: ${form.footerText.length}/60`);
  }

  const variableMatches = form.parameterFormat === 'named'
    ? [...form.body.matchAll(/{{\s*([a-z0-9_]+)\s*}}/gi)]
    : [...form.body.matchAll(/{{\s*(\d+)\s*}}/g)];
  const variableCount = new Set(variableMatches.map((match) => match[1])).size;
  const staticTextLength = getStaticTextLength(form.body, form.parameterFormat);
  const minimumStaticTextLength = variableCount * 12;

  if (variableCount > 0) {
    hints.push(`Fixed text around variables: ${staticTextLength}/${minimumStaticTextLength} minimum`);
    if (staticTextLength < minimumStaticTextLength) {
      errors.push(`Body needs at least ${minimumStaticTextLength} fixed characters for ${variableCount} variable(s). Current fixed characters: ${staticTextLength}.`);
    }
  }

  if (form.buttons.length > 10) {
    errors.push('Meta allows at most 10 buttons.');
  }

  form.buttons.forEach((button, index) => {
    const label = `Button ${index + 1}`;

    if (!button.text.trim()) {
      return;
    }

    if (button.text.trim().length > 25) {
      errors.push(`${label} text must be 25 characters or fewer.`);
    }

    if (button.type === 'url' && !button.url?.trim()) {
      errors.push(`${label} needs a URL.`);
    }

    if (button.type === 'phone_number' && !button.phone_number?.trim()) {
      errors.push(`${label} needs a phone number.`);
    }
  });

  return {
    errors,
    hints,
    isValid: errors.length === 0,
  };
};

export default function WhatsAppAutomation() {
  const [activeChannel, setActiveChannel] = useState<ChannelType>('whatsapp');

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [templateSearch, setTemplateSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>('all');
  const [templateStatus, setTemplateStatus] = useState<TemplateStatus>('all');
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>('all');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateDialogStep, setTemplateDialogStep] = useState<1 | 2>(1);
  const [dialogLibrarySearch, setDialogLibrarySearch] = useState('');
  const [dialogLibraryCategory, setDialogLibraryCategory] = useState<'all' | 'marketing' | 'utility'>('all');
  const [templateHeaderType, setTemplateHeaderType] = useState<TemplateHeaderType>('none');
  const [aiGenerationEnabled, setAiGenerationEnabled] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    body: defaultTemplateBody,
    category: 'utility' as WhatsAppTemplate['category'],
    language: 'en_US',
    parameterFormat: 'named' as 'named' | 'positional',
    headerText: '',
    headerMediaType: 'image' as 'image' | 'video' | 'document',
    headerMediaHandle: '',
    footerText: '',
    buttons: [createEmptyButton()] as WhatsAppTemplateButton[],
    isActive: true,
    isDefault: false,
    autoSend: true,
  });

  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSyncingStatus, setAutoSyncingStatus] = useState(false);
  const [lastAutoSyncAt, setLastAutoSyncAt] = useState<string | null>(null);
  const templateValidation = useMemo(
    () => validateTemplateFormState(templateForm, templateHeaderType),
    [templateForm, templateHeaderType]
  );

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      body: defaultTemplateBody,
      category: 'utility',
      language: 'en_US',
      parameterFormat: 'named',
      headerText: '',
      headerMediaType: 'image',
      headerMediaHandle: '',
      footerText: '',
      buttons: [createEmptyButton()],
      isActive: true,
      isDefault: false,
      autoSend: true,
    });
    setTemplateHeaderType('none');
    setAiGenerationEnabled(false);
  };

  const filteredTemplates = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();

    return templates.filter((template) => {
      if (templateFilter === 'active' && !template.isActive) {
        return false;
      }
      if (templateFilter === 'inactive' && template.isActive) {
        return false;
      }
      if (templateStatus !== 'all' && template.status !== templateStatus) {
        return false;
      }
      if (templateCategory !== 'all' && template.category !== templateCategory) {
        return false;
      }

      // Date range filter
      if (dateRangeStart || dateRangeEnd) {
        const createdDate = new Date(template.createdAt);
        if (dateRangeStart) {
          const startDate = new Date(dateRangeStart);
          startDate.setHours(0, 0, 0, 0);
          if (createdDate < startDate) return false;
        }
        if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd);
          endDate.setHours(23, 59, 59, 999);
          if (createdDate > endDate) return false;
        }
      }

      if (!query) {
        return true;
      }

      return template.name.toLowerCase().includes(query) || template.body.toLowerCase().includes(query);
    });
  }, [templates, templateSearch, templateFilter, templateStatus, templateCategory, dateRangeStart, dateRangeEnd]);

  const dialogLibraryTemplates = useMemo(() => {
    const query = dialogLibrarySearch.trim().toLowerCase();

    return templates.filter((template) => {
      if (dialogLibraryCategory !== 'all' && template.category !== dialogLibraryCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        template.name.toLowerCase().includes(query) ||
        template.body.toLowerCase().includes(query)
      );
    });
  }, [templates, dialogLibrarySearch, dialogLibraryCategory]);

  const loadTemplates = async () => {
    setError(null);
    try {
      const data = await whatsappApi.getTemplates(true);
      const loadedTemplates = (data.templates || []).map(normalizeTemplate);
      setTemplates(loadedTemplates);
      await syncTemplateStatuses(loadedTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeChannel === 'whatsapp') {
      loadTemplates();
    }
  }, [activeChannel]);

  useEffect(() => {
    if (activeChannel !== 'whatsapp' || templates.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      void syncTemplateStatuses(templates);
    }, 90_000);

    return () => clearInterval(timer);
  }, [activeChannel, templates]);

  const handleCreateTemplate = async () => {
    setSaving(true);
    setError(null);
    try {
      const components = buildTemplateComponents(templateForm, templateHeaderType);

      const result = await whatsappApi.createTemplate({
        name: templateForm.name,
        body: templateForm.body,
        category: templateForm.category,
        language: templateForm.language,
        parameterFormat: templateForm.parameterFormat,
        components,
        isActive: templateForm.isActive,
        isDefault: templateForm.isDefault,
        autoSend: templateForm.autoSend,
      });

      setTemplates([normalizeTemplate(result.template), ...templates]);
      resetTemplateForm();
      setTemplateDialogStep(1);
      setShowTemplateDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplateId) return;

    setSaving(true);
    setError(null);
    try {
      const components = buildTemplateComponents(templateForm, templateHeaderType);

      const result = await whatsappApi.updateTemplate(editingTemplateId, {
        name: templateForm.name,
        body: templateForm.body,
        category: templateForm.category,
        language: templateForm.language,
        parameterFormat: templateForm.parameterFormat,
        components,
        isActive: templateForm.isActive,
        isDefault: templateForm.isDefault,
        autoSend: templateForm.autoSend,
      });

      setTemplates(templates.map((t) => (t._id === editingTemplateId ? normalizeTemplate(result.template) : t)));
      setEditingTemplateId(null);
      resetTemplateForm();
      setTemplateDialogStep(1);
      setShowTemplateDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await whatsappApi.deleteTemplate(id);
      setTemplates(templates.filter((t) => t._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const handleEditTemplate = (template: WhatsAppTemplate) => {
    const editorState = getTemplateEditorState(template);

    setEditingTemplateId(template._id);
    setTemplateForm(editorState.form);
    setTemplateHeaderType(editorState.headerType);
    setTemplateDialogStep(2);
    setShowTemplateDialog(true);
  };

  const syncTemplateStatuses = async (sourceTemplates: WhatsAppTemplate[], logWebhookDebug = false) => {
    const templatesToSync = sourceTemplates.filter(
      (template) => !!template.metaTemplateId && template.status !== 'approved'
    );

    if (templatesToSync.length === 0) {
      return;
    }

    setAutoSyncingStatus(true);

    try {
      const results = await Promise.allSettled(
        templatesToSync.map((template) => whatsappApi.checkTemplateStatus(template._id))
      );

      const updatedById = new Map<string, WhatsAppTemplate>();

      for (const result of results) {
        if (result.status === 'fulfilled') {
          updatedById.set(result.value.template._id, result.value.template);

          if (logWebhookDebug) {
            console.log('[Template Refresh] Webhook debug:', {
              templateId: result.value.template._id,
              templateName: result.value.template.name,
              templateStatus: result.value.template.status,
              refreshedAt: result.value.refreshedAt,
              webhookReceived: result.value.webhookDebug?.webhookReceived ?? false,
              lastWebhook: result.value.webhookDebug || null,
            });
          }
        }
      }

      if (updatedById.size > 0) {
        setTemplates((previous) =>
          previous.map((template) => {
            const updated = updatedById.get(template._id);
            return updated ? normalizeTemplate(updated) : template;
          })
        );
        setLastAutoSyncAt(new Date().toLocaleTimeString());
      }
    } catch {
      // Keep this silent to avoid interrupting the page when background sync fails.
    } finally {
      setAutoSyncingStatus(false);
    }
  };

  const handlePreviewTemplate = (template: WhatsAppTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleRefreshAllStatuses = async () => {
    setError(null);
    try {
      console.log('[Template Refresh] Using API base:', getResolvedApiBase());
      const data = await whatsappApi.syncTemplates();
      const loadedTemplates = (data.templates || []).map(normalizeTemplate);
      setTemplates(loadedTemplates);
      await syncTemplateStatuses(loadedTemplates, true);
      setLastAutoSyncAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh template statuses');
    }
  };

  const openCreateTemplateDialog = () => {
    setEditingTemplateId(null);
    resetTemplateForm();
    setDialogLibrarySearch('');
    setDialogLibraryCategory('all');
    setTemplateDialogStep(1);
    setShowTemplateDialog(true);
  };

  const applyLibraryTemplate = (template: WhatsAppTemplate) => {
    if (template.status !== 'approved') {
      setError('Only approved templates can be used. This template is still being verified by Meta.');
      return;
    }

    setEditingTemplateId(null);
    setTemplateForm({
      name: `${template.name} Copy`,
      body: template.body,
      category: template.category,
      language: template.language || 'en_US',
      parameterFormat: template.parameterFormat || 'named',
      headerText: '',
      headerMediaType: 'image',
      headerMediaHandle: '',
      footerText: '',
      buttons: [createEmptyButton()],
      isActive: true,
      isDefault: false,
      autoSend: template.autoSend,
    });
    setTemplateHeaderType('none');
    setTemplateDialogStep(2);
  };

  const startCustomTemplate = () => {
    setEditingTemplateId(null);
    resetTemplateForm();
    setTemplateDialogStep(2);
  };

  return (
    <div className="space-y-6">
      {/* Channel Tabs */}
      <div className="flex gap-2 border-b border-border/40">
        {(['whatsapp', 'instagram', 'messenger'] as const).map((channel) => (
          <button
            key={channel}
            onClick={() => setActiveChannel(channel)}
            className={`pb-2 px-3 font-medium transition-colors ${
              activeChannel === channel
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              {channel === 'whatsapp' && <MessageCircle className="w-4 h-4" />}
              {channel === 'instagram' && <Instagram className="w-4 h-4" />}
              {channel === 'messenger' && <Send className="w-4 h-4" />}
              <span className="capitalize">{channel}</span>
              {channel !== 'whatsapp' && <span className="text-xs text-muted-foreground">(Coming soon)</span>}
            </div>
          </button>
        ))}
      </div>

      {activeChannel === 'whatsapp' && (
        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Filter and Search Section */}
          <div className="glass rounded-xl border border-border/50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Template status is auto-synced from Meta.</span>
              <span>
                {autoSyncingStatus
                  ? 'Checking latest status...'
                  : lastAutoSyncAt
                    ? `Last sync ${lastAutoSyncAt}`
                    : 'Not synced yet'}
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-border/60 bg-background/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <Button
                onClick={handleRefreshAllStatuses}
                variant="outline"
                className="gap-2"
                disabled={autoSyncingStatus}
              >
                {autoSyncingStatus ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh Status
              </Button>

              <Button
                onClick={openCreateTemplateDialog}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                New Template
              </Button>
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <select
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value as TemplateFilter)}
                className="px-3 py-2 border border-border/60 bg-background/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={templateStatus}
                onChange={(e) => setTemplateStatus(e.target.value as TemplateStatus)}
                className="px-3 py-2 border border-border/60 bg-background/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Approval</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paused">Paused</option>
                <option value="disabled">Disabled</option>
                <option value="appeal_requested">Appeal Requested</option>
                <option value="pending_deletion">Pending Deletion</option>
                <option value="unknown">Unknown</option>
              </select>

              <select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value as TemplateCategory)}
                className="px-3 py-2 border border-border/60 bg-background/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryLabel).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                placeholder="From date"
                className="px-3 py-2 border border-border/60 bg-background/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />

              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                placeholder="To date"
                className="px-3 py-2 border border-border/60 bg-background/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Templates List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No templates found</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredTemplates.map((template) => (
                <div key={template._id} className="glass rounded-xl border border-border/50 p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground truncate">{template.name}</h3>
                        {template.isDefault && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30">Default</span>}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                            statusColorMap[template.status]
                          }`}
                        >
                          {statusLabel[template.status]}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                            categoryColorMap[template.category]
                          }`}
                        >
                          {categoryLabel[template.category]}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">{template.body}</p>

                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{template.isActive ? '✓ Active' : '✗ Inactive'}</span>
                        <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePreviewTemplate(template)}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Preview</span>
                      </Button>

                      <Button
                        onClick={() => handleEditTemplate(template)}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>

                      <Button
                        onClick={() => handleDeleteTemplate(template._id)}
                        variant="outline"
                        size="sm"
                        className="gap-1 text-red-300 hover:text-red-200 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeChannel !== 'whatsapp' && (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">{activeChannel === 'instagram' ? 'Instagram' : 'Messenger'} templates coming soon</p>
        </div>
      )}

      <Dialog
        open={showTemplateDialog}
        onOpenChange={(open) => {
          setShowTemplateDialog(open);
          if (!open) {
            setTemplateDialogStep(1);
            setEditingTemplateId(null);
          }
        }}
      >
        <DialogContent className="w-[96vw] max-w-6xl p-0 gap-0 overflow-hidden border-border/60 bg-card/95 backdrop-blur-xl">
          <DialogHeader className="border-b border-border/40 px-6 py-4">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-2xl font-semibold text-foreground">
                {editingTemplateId ? 'Edit template' : 'Create new template'}
              </DialogTitle>
              <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                Steps {templateDialogStep} / 2
              </span>
            </div>
          </DialogHeader>

          {error && templateDialogStep === 2 && (
            <div className="border-b border-red-500/30 bg-red-500/10 px-6 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {templateDialogStep === 1 && (
            <div className="space-y-4 p-5">
              <h3 className="text-3xl font-semibold tracking-tight text-foreground">Choose from below Template Library</h3>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="inline-flex rounded-lg border border-border/60 bg-background/50 p-1">
                  {(['all', 'marketing', 'utility'] as const).map((category) => (
                    <button
                      key={category}
                      onClick={() => setDialogLibraryCategory(category)}
                      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                        dialogLibraryCategory === category
                          ? 'bg-primary/20 text-primary shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {category === 'all' ? 'All' : categoryLabel[category]}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={dialogLibrarySearch}
                    onChange={(e) => setDialogLibrarySearch(e.target.value)}
                    placeholder="Search template library..."
                    className="w-full rounded-lg border border-border/60 bg-background/60 py-2.5 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={startCustomTemplate}
                className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border/60 bg-background/40 p-5 text-left transition-colors hover:bg-background/60"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-background/70 border border-border/60">
                  <Plus className="h-5 w-5 text-foreground" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-foreground">Create custom</p>
                  <p className="text-sm text-muted-foreground">Start from scratch and build your own template</p>
                </div>
              </button>

              <p className="text-xl font-semibold text-foreground">Showing {dialogLibraryTemplates.length} templates</p>

              <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
                {dialogLibraryTemplates.map((template) => (
                  <div key={template._id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xl font-medium text-foreground">{template.name}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusColorMap[template.status]}`}>
                            {statusLabel[template.status]}
                          </span>
                          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${categoryColorMap[template.category]}`}>
                            {categoryLabel[template.category]}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => applyLibraryTemplate(template)}>
                            Use template
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handlePreviewTemplate(template)} className="gap-2">
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                        </div>
                      </div>

                      <div className="h-20 w-20 rounded-2xl border border-border/60 bg-background/60" />
                    </div>
                  </div>
                ))}

                {!dialogLibraryTemplates.length && (
                  <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
                    No templates match these filters.
                  </div>
                )}
              </div>
            </div>
          )}

          {templateDialogStep === 2 && (
            <div className="grid max-h-[78vh] grid-cols-1 overflow-y-auto lg:grid-cols-[1.85fr_1fr]">
              <div className="space-y-6 border-r border-border/40 p-5">
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Untitled template..."
                  className="w-full border-b border-border/60 bg-transparent pb-3 text-4xl font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                />

                <div className="flex items-center gap-3">
                  <span className="text-2xl font-medium text-foreground">Generate AI Template</span>
                  <Switch checked={aiGenerationEnabled} onCheckedChange={setAiGenerationEnabled} />
                  {aiGenerationEnabled && <Sparkles className="h-4 w-4 text-amber-500" />}
                </div>

                <div className="space-y-3">
                  <p className="text-2xl font-medium text-foreground">Select channel</p>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-4 py-2.5 text-lg font-medium text-foreground">
                      <Circle className="h-4 w-4 fill-indigo-600 text-indigo-600" />
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      Whatsapp
                    </button>
                    <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-lg text-muted-foreground" disabled>
                      <Circle className="h-4 w-4" />
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </button>
                    <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-lg text-muted-foreground" disabled>
                      <Circle className="h-4 w-4" />
                      <Send className="h-4 w-4" />
                      Messenger
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-2xl font-medium text-foreground">Select category</p>
                  {([
                    {
                      key: 'marketing',
                      title: 'Marketing',
                      description: 'Promotions, offers and product-related messages',
                    },
                    {
                      key: 'utility',
                      title: 'Utility',
                      description: 'Messages about transactions, account activity or support updates',
                    },
                    {
                      key: 'authentication',
                      title: 'Authentication',
                      description: 'One-time passcodes and verification flows',
                    },
                  ] as const).map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setTemplateForm({ ...templateForm, category: option.key })}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors ${
                        templateForm.category === option.key ? 'border-primary/60 bg-primary/10' : 'border-border/60 bg-background/40'
                      }`}
                    >
                      <div>
                        <p className="text-xl font-semibold text-foreground">{option.title}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      <Circle className={`h-5 w-5 ${templateForm.category === option.key ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-2xl font-medium text-foreground">Language</p>
                  <select
                    value={templateForm.language}
                    onChange={(e) => setTemplateForm({ ...templateForm, language: e.target.value })}
                    className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-base text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.value})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 border-t border-border/40 pt-4">
                  <p className="text-xl font-semibold text-foreground">Details</p>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Header type</label>
                    <select
                      value={templateHeaderType}
                      onChange={(e) => {
                        const nextType = e.target.value as TemplateHeaderType;
                        setTemplateHeaderType(nextType);
                        if (nextType !== 'text') {
                          setTemplateForm((prev) => ({ ...prev, headerText: '' }));
                        }
                        if (nextType === 'none' || nextType === 'text') {
                          setTemplateForm((prev) => ({ ...prev, headerMediaHandle: '' }));
                        }
                      }}
                      className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="none">None</option>
                      <option value="text">Text</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="document">Document</option>
                    </select>
                  </div>

                  {templateHeaderType === 'text' && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-muted-foreground">Header text</label>
                      <input
                        type="text"
                        value={templateForm.headerText}
                        onChange={(e) => setTemplateForm({ ...templateForm, headerText: e.target.value })}
                        placeholder="Enter header text"
                        className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}

                  {(templateHeaderType === 'image' || templateHeaderType === 'video' || templateHeaderType === 'document') && (
                    <div className="space-y-2">
                      <label className="mb-1 block text-sm font-medium text-muted-foreground">Header media</label>
                      <input
                        type="text"
                        value={templateForm.headerMediaHandle}
                        onChange={(e) =>
                          setTemplateForm({
                            ...templateForm,
                            headerMediaType: templateHeaderType as 'image' | 'video' | 'document',
                            headerMediaHandle: e.target.value
                          })
                        }
                        placeholder={`Meta ${templateHeaderType} handle`}
                        className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <p className="text-xs text-muted-foreground">
                        Add the uploaded Meta media handle so template review can validate the header asset.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Body</label>
                    <textarea
                      value={templateForm.body}
                      onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                      rows={8}
                      placeholder="Enter your message body"
                      className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Parameter format</label>
                    <select
                      value={templateForm.parameterFormat}
                      onChange={(e) => setTemplateForm({ ...templateForm, parameterFormat: e.target.value as 'named' | 'positional' })}
                      className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="named">Named ({'{{customer_name}}'})</option>
                      <option value="positional">Positional ({'{{1}}'})</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Footer</label>
                    <input
                      type="text"
                      value={templateForm.footerText}
                      onChange={(e) => setTemplateForm({ ...templateForm, footerText: e.target.value.slice(0, 60) })}
                      placeholder="Optional footer text"
                      className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{templateForm.footerText.length}/60 characters</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-muted-foreground">Buttons</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setTemplateForm((prev) => ({
                            ...prev,
                            buttons: [...prev.buttons, createEmptyButton()].slice(0, 10),
                          }))
                        }
                        disabled={templateForm.buttons.length >= 10}
                      >
                        Add button
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {templateForm.buttons.map((button, index) => (
                        <div key={`${button.type}-${index}`} className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-3">
                          <div className="flex items-center gap-3">
                            <select
                              value={button.type}
                              onChange={(e) => {
                                const nextType = e.target.value as TemplateButtonType;
                                setTemplateForm((prev) => ({
                                  ...prev,
                                  buttons: prev.buttons.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? {
                                          type: nextType,
                                          text: entry.text,
                                          url: '',
                                          phone_number: '',
                                          example: '',
                                          otp_type: 'copy_code',
                                        }
                                      : entry
                                  ),
                                }));
                              }}
                              className="w-40 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="quick_reply">Quick reply</option>
                              <option value="url">URL</option>
                              <option value="phone_number">Phone number</option>
                              <option value="copy_code">Copy code</option>
                              <option value="otp">OTP</option>
                            </select>

                            <input
                              type="text"
                              value={button.text}
                              onChange={(e) =>
                                setTemplateForm((prev) => ({
                                  ...prev,
                                  buttons: prev.buttons.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, text: e.target.value } : entry
                                  ),
                                }))
                              }
                              placeholder="Button label"
                              className="flex-1 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setTemplateForm((prev) => ({
                                  ...prev,
                                  buttons: prev.buttons.length === 1
                                    ? [createEmptyButton()]
                                    : prev.buttons.filter((_, entryIndex) => entryIndex !== index),
                                }))
                              }
                            >
                              Remove
                            </Button>
                          </div>

                          {button.type === 'url' && (
                            <div className="grid gap-3 md:grid-cols-2">
                              <input
                                type="text"
                                value={button.url || ''}
                                onChange={(e) =>
                                  setTemplateForm((prev) => ({
                                    ...prev,
                                    buttons: prev.buttons.map((entry, entryIndex) =>
                                      entryIndex === index ? { ...entry, url: e.target.value } : entry
                                    ),
                                  }))
                                }
                                placeholder="https://example.com/{{1}}"
                                className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <input
                                type="text"
                                value={typeof button.example === 'string' ? button.example : Array.isArray(button.example) ? button.example.join(', ') : ''}
                                onChange={(e) =>
                                  setTemplateForm((prev) => ({
                                    ...prev,
                                    buttons: prev.buttons.map((entry, entryIndex) =>
                                      entryIndex === index ? { ...entry, example: e.target.value.split(',').map((part) => part.trim()).filter(Boolean) } : entry
                                    ),
                                  }))
                                }
                                placeholder="URL example values, comma separated"
                                className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          )}

                          {button.type === 'phone_number' && (
                            <input
                              type="text"
                              value={button.phone_number || ''}
                              onChange={(e) =>
                                setTemplateForm((prev) => ({
                                  ...prev,
                                  buttons: prev.buttons.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, phone_number: e.target.value } : entry
                                  ),
                                }))
                              }
                              placeholder="+911234567890"
                              className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          )}

                          {button.type === 'copy_code' && (
                            <input
                              type="text"
                              value={typeof button.example === 'string' ? button.example : ''}
                              onChange={(e) =>
                                setTemplateForm((prev) => ({
                                  ...prev,
                                  buttons: prev.buttons.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, example: e.target.value } : entry
                                  ),
                                }))
                              }
                              placeholder="Copy code example"
                              className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          )}

                          {button.type === 'otp' && (
                            <select
                              value={button.otp_type || 'copy_code'}
                              onChange={(e) =>
                                setTemplateForm((prev) => ({
                                  ...prev,
                                  buttons: prev.buttons.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, otp_type: e.target.value as 'copy_code' | 'one_tap' | 'zero_tap' } : entry
                                  ),
                                }))
                              }
                              className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="copy_code">Copy code</option>
                              <option value="one_tap">One tap</option>
                              <option value="zero_tap">Zero tap</option>
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 p-2.5">
                      <Switch
                        checked={templateForm.isActive}
                        onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isActive: checked })}
                      />
                      <span className="text-sm text-muted-foreground">Active</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 p-2.5">
                      <Switch
                        checked={templateForm.isDefault}
                        onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isDefault: checked })}
                      />
                      <span className="text-sm text-muted-foreground">Default</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 p-2.5">
                      <Switch
                        checked={templateForm.autoSend}
                        onCheckedChange={(checked) => setTemplateForm({ ...templateForm, autoSend: checked })}
                      />
                      <span className="text-sm text-muted-foreground">Auto Send</span>
                    </label>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Validation rules</p>
                      <p className="text-xs text-muted-foreground">
                        Name is sanitized to lowercase with underscores. Body max 1024 chars. Header and footer max 60 chars. Button text max 25 chars. Max 10 buttons.
                      </p>
                      <p className="mt-1 text-xs text-amber-300">
                        Media headers must use a permanent Meta media ID or a public direct URL. Temporary WhatsApp CDN links can fail delivery.
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      {templateValidation.hints.map((hint) => (
                        <p key={hint}>• {hint}</p>
                      ))}
                    </div>

                    {templateValidation.errors.length > 0 && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                        {templateValidation.errors.map((validationError) => (
                          <p key={validationError}>• {validationError}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col p-5">
                <div className="h-full min-h-[280px] rounded-2xl bg-background/60 border border-border/60 p-4">
                  <p className="text-lg font-medium text-muted-foreground">Message preview</p>
                  <div className="mt-4 rounded-2xl border border-border/60 bg-card/60 p-4">
                    <div className="mx-auto max-w-[320px] rounded-[28px] border border-border/60 bg-[#0f172a] p-2 shadow-2xl">
                      <div className="rounded-[22px] bg-[linear-gradient(160deg,#0f1f1f,#122c2b)] p-3">
                        <div className="mb-3 flex items-center gap-2 text-[11px] text-emerald-100/80">
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                          WhatsApp Preview
                        </div>

                        <div className="ml-auto w-[88%] rounded-xl bg-[#dcf8c6] px-3 py-2 text-[#1f2937] shadow-sm">
                          {templateHeaderType === 'text' && templateForm.headerText.trim() && (
                            <div className="mb-2 border-b border-[#b8e2a0] pb-1.5">
                              <p className="text-xs font-semibold whitespace-pre-wrap">{templateForm.headerText}</p>
                            </div>
                          )}

                          {(templateHeaderType === 'image' || templateHeaderType === 'video' || templateHeaderType === 'document') && templateForm.headerMediaHandle.trim() && (
                            <div className="mb-2 rounded-md border border-[#b8e2a0] bg-[#eef8e6] px-2 py-1.5">
                              <p className="text-[11px] font-semibold capitalize">{templateHeaderType} attached</p>
                              <p className="text-[10px] text-[#4b5563] truncate">{templateForm.headerMediaHandle}</p>
                            </div>
                          )}

                          <p className="text-xs whitespace-pre-wrap leading-relaxed">
                            {templateForm.body || 'Your message preview will appear here...'}
                          </p>
                          {templateForm.footerText.trim() && (
                            <p className="mt-2 text-[10px] text-[#6b7280] whitespace-pre-wrap">{templateForm.footerText}</p>
                          )}
                          {templateForm.buttons.some((button) => button.text.trim()) && (
                            <div className="mt-3 space-y-1">
                              {templateForm.buttons.filter((button) => button.text.trim()).map((button, index) => (
                                <div key={`${button.type}-${index}`} className="rounded-md border border-[#b8e2a0] bg-[#eef8e6] px-2 py-1 text-[11px] font-medium text-[#166534]">
                                  {button.text}
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="mt-1 text-[10px] text-[#6b7280] text-right">12:08</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <Button variant="outline" onClick={() => setTemplateDialogStep(1)}>
                    Back
                  </Button>
                  <Button
                    onClick={editingTemplateId ? handleUpdateTemplate : handleCreateTemplate}
                    disabled={
                      saving ||
                      !templateValidation.isValid
                    }
                    className="gap-2"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {editingTemplateId ? 'Update template' : 'Send for approval'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Preview Modal */}
      <TemplatePreviewModal template={previewTemplate} open={showPreview} onOpenChange={setShowPreview} />
    </div>
  );
}
