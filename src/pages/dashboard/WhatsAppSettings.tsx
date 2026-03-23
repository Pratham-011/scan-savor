import { useState, useEffect } from 'react';
import { AlertCircle, Check, Copy, Eye, EyeOff, Loader2, Plus, Save, Trash2, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { whatsappApi, WhatsAppConfig } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface WhatsAppSettingsProps {
  restaurantId: string;
}

export default function WhatsAppSettings({ restaurantId }: WhatsAppSettingsProps) {
  void restaurantId;
  const [config, setConfig] = useState<Partial<WhatsAppConfig>>({
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

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
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

    // Validation - only require these if they're being changed and not already saved
    const hasRequiredFields = config.wabaId?.trim() && config.accessToken?.trim() && config.phoneNumberId?.trim() && config.phoneNumber?.trim();
    
    if (!hasRequiredFields && !config.qrRedirectEnabled) {
      setSaveError('Please fill in all WhatsApp Business credentials to enable WhatsApp');
      return;
    }

    try {
      setIsSaving(true);
      
      // If user only changed toggles, use PUT endpoint
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
      
      // If all credentials are filled, also save them
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">WhatsApp Business Integration</h1>
        <p className="text-muted-foreground mt-2">
          Configure your WhatsApp Business Account to enable menu sharing via WhatsApp
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
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isEnabled: checked }))}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-background/40 p-3">
            <p className="text-sm font-medium mb-2">QR Redirect to WhatsApp</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Use same QR, open WhatsApp first</span>
              <Switch
                checked={!!config.qrRedirectEnabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, qrRedirectEnabled: checked }))}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-background/40 p-3">
            <p className="text-sm font-medium mb-2">Auto Reply</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Send menu template automatically</span>
              <Switch
                checked={!!config.autoReplyEnabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoReplyEnabled: checked }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Automation Management</h2>
        <p className="text-sm text-muted-foreground">
          Templates and quick replies are now managed from the dedicated automation page with template library style UI.
        </p>
        <Link
          to="/dashboard/whatsapp-automation"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
        >
          Open WhatsApp Automation
        </Link>
      </div>

      {/* Info Alert */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-300">
            <p className="font-semibold mb-1">How to get your credentials:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Go to <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">business.facebook.com</a></li>
              <li>Create or sign in to your Meta Business Account</li>
              <li>Set up WhatsApp Business App from App Dashboard</li>
              <li>Generate permanent Access Token in App Roles section</li>
              <li>Get WABA ID, Phone Number ID, and WhatsApp Number from API Setup</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="space-y-4 rounded-xl border border-border/50 bg-card/50 p-6">
        {/* WABA ID */}
        <div>
          <label className="block text-sm font-semibold mb-2">WABA ID *</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="wabaId"
              value={config.wabaId || ''}
              onChange={handleInputChange}
              placeholder="e.g., 123456789"
              className="flex-1 px-4 py-2 rounded-lg border border-border/60 bg-background/50 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all"
            />
            {config.wabaId && (
              <button
                onClick={() => handleCopy(config.wabaId || '', 'wabaId')}
                className="px-3 py-2 rounded-lg border border-border/60 bg-secondary/50 hover:bg-secondary transition-colors"
              >
                {copiedField === 'wabaId' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Your WhatsApp Business Account ID</p>
        </div>

        {/* Phone Number ID */}
        <div>
          <label className="block text-sm font-semibold mb-2">Phone Number ID *</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="phoneNumberId"
              value={config.phoneNumberId || ''}
              onChange={handleInputChange}
              placeholder="e.g., 123456789"
              className="flex-1 px-4 py-2 rounded-lg border border-border/60 bg-background/50 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all"
            />
            {config.phoneNumberId && (
              <button
                onClick={() => handleCopy(config.phoneNumberId || '', 'phoneNumberId')}
                className="px-3 py-2 rounded-lg border border-border/60 bg-secondary/50 hover:bg-secondary transition-colors"
              >
                {copiedField === 'phoneNumberId' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">ID of the phone number to use for sending messages</p>
        </div>

        {/* WhatsApp Phone Number */}
        <div>
          <label className="block text-sm font-semibold mb-2">WhatsApp Business Number *</label>
          <input
            type="tel"
            name="phoneNumber"
            value={config.phoneNumber || ''}
            onChange={handleInputChange}
            placeholder="e.g., +917000000000"
            className="w-full px-4 py-2 rounded-lg border border-border/60 bg-background/50 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all"
          />
          <p className="text-xs text-muted-foreground mt-1">Your WhatsApp Business Account phone number (include country code)</p>
        </div>

        {/* Access Token */}
        <div>
          <label className="block text-sm font-semibold mb-2">Permanent Access Token *</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showAccessToken ? 'text' : 'password'}
                name="accessToken"
                value={config.accessToken || ''}
                onChange={handleInputChange}
                placeholder="Your permanent access token"
                className="w-full px-4 py-2 rounded-lg border border-border/60 bg-background/50 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all"
              />
              <button
                onClick={() => setShowAccessToken(!showAccessToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {config.accessToken && (
              <button
                onClick={() => handleCopy(config.accessToken || '', 'accessToken')}
                className="px-3 py-2 rounded-lg border border-border/60 bg-secondary/50 hover:bg-secondary transition-colors"
              >
                {copiedField === 'accessToken' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Permanent access token from Meta App Dashboard (with whatsapp_business_messaging permission)</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">QR Prefill Message</label>
          <textarea
            name="qrPrefillMessage"
            value={config.qrPrefillMessage || ''}
            onChange={handleInputChange}
            placeholder="e.g., Hi {{restaurant_name}}, please share your menu [ref:{{ref_code}}]"
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-border/60 bg-background/50 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">Variables: {'{{restaurant_name}}'}, {'{{menu_link}}'}, {'{{ref_code}}'}</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Auto Reply Trigger Message</label>
          <input
            type="text"
            name="autoReplyTriggerMessage"
            value={config.autoReplyTriggerMessage || ''}
            onChange={handleInputChange}
            placeholder="Leave empty to use the QR prefill message"
            className="w-full px-4 py-2 rounded-lg border border-border/60 bg-background/50 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Customer message that should trigger auto reply. If left empty, the QR prefill message is used.
          </p>
        </div>

        {/* Error Message */}
        {saveError && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10">
            <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
          </div>
        )}

        {/* Success Message */}
        {saveSuccess && (
          <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
            <p className="text-sm text-green-600 dark:text-green-400">✓ Settings saved successfully!</p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200',
              'flex items-center justify-center gap-2',
              isSaving
                ? 'bg-primary/50 text-muted-foreground cursor-not-allowed'
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

      {/* Webhook Setup Info */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 dark:text-amber-300 space-y-4">
            <div>
              <p className="font-semibold mb-2">Webhook Configuration (Production):</p>
              <p className="mb-2 text-xs">
                Configure the following webhook in your Meta App Dashboard:
              </p>
            </div>

            {/* Callback URL */}
            <div>
              <p className="text-xs font-medium mb-1">1. Callback URL:</p>
              <div className="bg-background/50 rounded p-2 font-mono text-xs border border-border/50">
                <code className="text-primary">{window.location.origin.replace(/\/$/, '')}/api/whatsapp/webhook</code>
              </div>
            </div>

            {/* Webhook Fields */}
            <div>
              <p className="text-xs font-medium mb-1">2. Webhook Fields (Subscribe to):</p>
              <div className="bg-background/50 rounded p-2 font-mono text-xs border border-border/50">
                <code className="text-primary">messages</code>, <code className="text-primary">message_template_status_update</code>
              </div>
            </div>

            {/* Verification Token */}
            <div>
              <p className="text-xs font-medium mb-1">3. Webhook Verification Token:</p>
              <p className="text-xs mb-2">
                This token is used by Meta to verify that your webhook is legitimate. Set up:
              </p>
              <div className="bg-background/50 rounded p-2 font-mono text-xs border border-border/50 mb-2">
                <p className="mb-1"><strong>In your backend .env file:</strong></p>
                <code className="text-primary">WHATSAPP_VERIFY_TOKEN=your_secret_token_here</code>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-400">
                ⚠️ Use a strong, random token (e.g., a UUID). Never expose this token publicly. This same token must be entered in Meta's App Dashboard webhook settings.
              </p>
            </div>

            {/* Setup Steps */}
            <div>
              <p className="text-xs font-medium mb-2">Setup Steps in Meta App Dashboard:</p>
              <ol className="text-xs space-y-1 list-decimal list-inside text-amber-800 dark:text-amber-400">
                <li>Go to your Meta App Dashboard</li>
                <li>Select your WhatsApp Business Account</li>
                <li>Navigate to Configuration → Webhooks</li>
                <li>Paste the Callback URL above</li>
                <li>Enter the same Verify Token from your .env</li>
                <li>Subscribe to the webhook fields above</li>
                <li>Save and Meta will verify your webhook</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
