import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  Check,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Upload,
  RefreshCw,
  Search,
  Send,
  User,
  Video,
  X,
} from 'lucide-react';
import {
  whatsappApi,
  WhatsAppChatCustomer,
  WhatsAppChatMessage,
  WhatsAppConversationWindow,
  WhatsAppTemplate,
  getResolvedBaseUrl,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';

interface WhatsAppAnalyticsProps {
  restaurantId: string;
}

export default function WhatsAppAnalytics({ restaurantId }: WhatsAppAnalyticsProps) {
  void restaurantId;
  const [searchParams] = useSearchParams();

  const [customers, setCustomers] = useState<WhatsAppChatCustomer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedPhone, setSelectedPhone] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [messages, setMessages] = useState<WhatsAppChatMessage[]>([]);
  const [conversationWindow, setConversationWindow] = useState<WhatsAppConversationWindow | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  const [textDraft, setTextDraft] = useState('');
  const [sendingText, setSendingText] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState(false);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'document'>('image');
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaUrlDraft, setMediaUrlDraft] = useState('');
  const [mediaFilename, setMediaFilename] = useState('');
  const [mediaMimeType, setMediaMimeType] = useState('');
  const [composerError, setComposerError] = useState<string | null>(null);

  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const selectedPhoneRef = useRef(selectedPhone);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoadRef = useRef(true);

  const ITEMS_PER_PAGE = 20;
  const MESSAGE_PAGE_SIZE = 100;

  const orderedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const sanitizePhone = (value: string) => value.replace(/\D/g, '');

  useEffect(() => {
    selectedPhoneRef.current = selectedPhone;
  }, [selectedPhone]);

  useEffect(() => {
    fetchCustomers();
  }, [page, searchQuery]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (!selectedPhone) {
      setMessages([]);
      setConversationWindow(null);
      return;
    }
    fetchMessages(selectedPhone);
  }, [selectedPhone]);

  useEffect(() => {
    if (!chatContainerRef.current || !selectedPhone) {
      return;
    }

    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [orderedMessages, selectedPhone]);

  useEffect(() => {
    const urlPhone = sanitizePhone(searchParams.get('phone') || '');
    const urlName = String(searchParams.get('name') || '').trim();

    if (urlPhone.length < 8) {
      return;
    }

    setSelectedPhone(urlPhone);
    if (urlName) {
      setSelectedName(urlName);
    }
    setNewPhone(urlPhone);
    if (urlName) {
      setNewName(urlName);
    }
    setComposerError(null);
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    const socket = io(getResolvedBaseUrl(), {
      transports: ['websocket'],
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    const onRealtimeMessage = async (payload?: { phoneNumber?: string }) => {
      await fetchCustomers(true);
      if (selectedPhoneRef.current && payload?.phoneNumber === selectedPhoneRef.current) {
        await fetchMessages(selectedPhoneRef.current, true);
      }
    };

    const onRealtimeStatus = async (payload?: { phoneNumber?: string }) => {
      if (selectedPhoneRef.current && payload?.phoneNumber === selectedPhoneRef.current) {
        await fetchMessages(selectedPhoneRef.current, true);
      }
      await fetchCustomers(true);
    };

    socket.on('whatsapp:message:new', onRealtimeMessage);
    socket.on('whatsapp:message:status', onRealtimeStatus);

    return () => {
      socket.off('whatsapp:message:new', onRealtimeMessage);
      socket.off('whatsapp:message:status', onRealtimeStatus);
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, []);

  const fetchCustomers = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoadingCustomers(true);
        setCustomersError(null);
      }
      const response = await whatsappApi.getChatCustomers(page, ITEMS_PER_PAGE, searchQuery);
      setCustomers(response.customers);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);

      // Only auto-select first customer on initial load, not on subsequent updates.
      // New messages update the list without auto-opening (WhatsApp-style behavior).
      if (!selectedPhone && response.customers.length > 0 && isInitialLoadRef.current) {
        setSelectedPhone(response.customers[0].phoneNumber);
        setSelectedName(response.customers[0].customerName || '');
        isInitialLoadRef.current = false;
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      if (!silent) {
        setCustomersError(err instanceof Error ? err.message : 'Failed to fetch customers');
      }
    } finally {
      if (!silent) {
        setIsLoadingCustomers(false);
      }
    }
  };

  const fetchTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const response = await whatsappApi.getTemplates(true);
      const allowed = response.templates.filter((template) => template.isActive && template.status === 'approved');
      setTemplates(allowed);
      if (!selectedTemplateId && allowed.length > 0) {
        setSelectedTemplateId(allowed[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const fetchMessages = async (phoneNumber: string, silent = false) => {
    try {
      if (!silent) {
        setIsLoadingMessages(true);
        setMessagesError(null);
      }
      const response = await whatsappApi.getChatMessages(phoneNumber, 1, MESSAGE_PAGE_SIZE);
      const getWhatsAppMessageId = (msg: WhatsAppChatMessage) =>
        String((msg as WhatsAppChatMessage & { whatsappMessageId?: string }).whatsappMessageId || '').trim();

      const dedupedMessages = response.messages.filter((message, index, allMessages) => {
        const messageId = getWhatsAppMessageId(message);
        const fallbackKey = [
          message.direction,
          message.messageType,
          message.sentAt,
          message.text,
          String(message.metadata?.sourceModel || ''),
          String(message.metadata?.sourceId || '')
        ].join('|');
        const key = messageId || fallbackKey;

        return index === allMessages.findIndex((candidate) => {
          const candidateId = getWhatsAppMessageId(candidate);
          const candidateFallbackKey = [
            candidate.direction,
            candidate.messageType,
            candidate.sentAt,
            candidate.text,
            String(candidate.metadata?.sourceModel || ''),
            String(candidate.metadata?.sourceId || '')
          ].join('|');

          return (candidateId || candidateFallbackKey) === key;
        });
      });

      setMessages(dedupedMessages);
      setConversationWindow(response.conversationWindow);

      if (phoneNumber) {
        setCustomers((prev) => prev.map((customer) => (
          customer.phoneNumber === phoneNumber
            ? { ...customer, unreadCount: 0 }
            : customer
        )));
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      if (!silent) {
        setMessagesError(err instanceof Error ? err.message : 'Failed to fetch messages');
      }
    } finally {
      if (!silent) {
        setIsLoadingMessages(false);
      }
    }
  };

  const handleRefresh = async () => {
    await fetchCustomers();
    if (selectedPhone) {
      await fetchMessages(selectedPhone);
    }
  };

  const selectCustomer = (customer: WhatsAppChatCustomer) => {
    setSelectedPhone(customer.phoneNumber);
    setSelectedName(customer.customerName || '');
    setComposerError(null);
  };

  const handleOpenManualChat = async () => {
    const phone = sanitizePhone(newPhone);
    if (phone.length < 8) {
      setComposerError('Enter a valid phone number with country code.');
      return;
    }

    setSelectedPhone(phone);
    setSelectedName(newName.trim());
    setComposerError(null);
    setMessages([]);

    try {
      const windowRes = await whatsappApi.getChatWindow(phone);
      setConversationWindow(windowRes.conversationWindow);
      await fetchMessages(phone);
    } catch {
      setConversationWindow({
        isOpen: false,
        lastInboundAt: null,
        expiresAt: null,
        remainingMs: 0,
        remainingMinutes: 0,
      });
    }
  };

  const handleSendText = async () => {
    if (!selectedPhone || !textDraft.trim()) {
      return;
    }

    try {
      setSendingText(true);
      setComposerError(null);
      await whatsappApi.sendChatText({
        phoneNumber: selectedPhone,
        customerName: selectedName || undefined,
        text: textDraft.trim(),
      });
      setTextDraft('');
      await Promise.all([fetchMessages(selectedPhone), fetchCustomers()]);
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : 'Failed to send text message');
    } finally {
      setSendingText(false);
    }
  };

  const handleSendTemplate = async () => {
    if (!selectedPhone || !selectedTemplateId) {
      return;
    }

    try {
      setSendingTemplate(true);
      setComposerError(null);
      await whatsappApi.sendChatTemplate({
        phoneNumber: selectedPhone,
        customerName: selectedName || undefined,
        templateId: selectedTemplateId,
        variables: selectedName ? { customer_name: selectedName } : undefined,
      });
      await Promise.all([fetchMessages(selectedPhone), fetchCustomers()]);
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : 'Failed to send template message');
    } finally {
      setSendingTemplate(false);
    }
  };

  const handleUploadChatMedia = async (file?: File) => {
    if (!file) return;

    try {
      setUploadingMedia(true);
      setComposerError(null);

      const resourceType = mediaType === 'document' ? 'raw' : mediaType;
      const response = await whatsappApi.uploadMedia(file, {
        purpose: 'chat_media',
        resourceType
      });

      setMediaUrlDraft(response.asset.url);
      setMediaFilename(response.asset.originalFilename || file.name || '');
      setMediaMimeType(file.type || '');
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : 'Failed to upload media');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSendMedia = async () => {
    if (!selectedPhone || !mediaUrlDraft.trim()) {
      return;
    }

    try {
      setSendingMedia(true);
      setComposerError(null);
      await whatsappApi.sendChatMedia({
        phoneNumber: selectedPhone,
        customerName: selectedName || undefined,
        mediaType,
        mediaUrl: mediaUrlDraft.trim(),
        filename: mediaType === 'document' ? mediaFilename.trim() || undefined : undefined,
        mimeType: mediaType === 'document' ? mediaMimeType.trim() || undefined : undefined,
        caption: mediaCaption.trim() || undefined,
      });

      setMediaCaption('');
      setMediaUrlDraft('');
      setMediaFilename('');
      setMediaMimeType('');
      await Promise.all([fetchMessages(selectedPhone), fetchCustomers()]);
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : 'Failed to send media message');
    } finally {
      setSendingMedia(false);
    }
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (timestamp?: string | null) => {
    if (!timestamp) return '-';
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const isWindowOpen = !!conversationWindow?.isOpen;

  const inferMediaTypeFromUrl = (rawUrl: string): 'image' | 'video' | 'document' | null => {
    const url = String(rawUrl || '').toLowerCase();
    if (!url) return null;

    if (/(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.svg)(\?|$)/.test(url)) {
      return 'image';
    }
    if (/(\.mp4|\.mov|\.webm|\.mkv|\.avi|\.m4v)(\?|$)/.test(url)) {
      return 'video';
    }
    if (/(\.pdf|\.doc|\.docx|\.xls|\.xlsx|\.csv|\.txt|\.ppt|\.pptx)(\?|$)/.test(url)) {
      return 'document';
    }

    return null;
  };

  const getMessageMedia = (message: WhatsAppChatMessage) => {
    const metadata = (message.metadata && typeof message.metadata === 'object'
      ? message.metadata
      : {}) as Record<string, unknown>;

    const mediaUrl = String(
      metadata.mediaUrl
      || metadata.url
      || ''
    ).trim();

    const mediaTypeRaw = String(
      metadata.mediaType
      || metadata.rawIncomingType
      || ''
    ).trim().toLowerCase();

    const mediaType = (mediaTypeRaw === 'image' || mediaTypeRaw === 'video' || mediaTypeRaw === 'document')
      ? mediaTypeRaw
      : inferMediaTypeFromUrl(mediaUrl);

    const mimeType = String(metadata.mimeType || '').trim();
    const filename = String(metadata.filename || '').trim();

    if (!mediaUrl || !mediaType) {
      return null;
    }

    return {
      mediaUrl,
      mediaType,
      mimeType,
      filename,
    };
  };

  const sanitizeDownloadFilename = (value: string, mediaType: 'image' | 'video' | 'document', mimeType?: string) => {
    const cleaned = String(value || '')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, ' ');

    const base = cleaned || `${mediaType}_attachment`;
    if (/\.[a-z0-9]{2,8}$/i.test(base)) {
      return base;
    }

    const lowerMime = String(mimeType || '').toLowerCase();
    if (lowerMime.includes('pdf')) return `${base}.pdf`;
    if (lowerMime.includes('word')) return `${base}.docx`;
    if (lowerMime.includes('excel') || lowerMime.includes('spreadsheet')) return `${base}.xlsx`;
    if (lowerMime.includes('csv')) return `${base}.csv`;
    if (lowerMime.includes('text')) return `${base}.txt`;
    if (mediaType === 'image') return `${base}.jpg`;
    if (mediaType === 'video') return `${base}.mp4`;
    return `${base}.bin`;
  };

  const downloadMediaWithFilename = async (mediaUrl: string, filename: string, mediaType: 'image' | 'video' | 'document', mimeType?: string) => {
    const finalFilename = sanitizeDownloadFilename(filename, mediaType, mimeType);

    try {
      const response = await fetch(mediaUrl);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      window.open(mediaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getMessageSourceMeta = (message: WhatsAppChatMessage) => {
    if (message.direction === 'inbound') {
      return {
        label: 'Customer',
        className: 'border-sky-500/30 bg-sky-500/15 text-sky-200'
      };
    }

    const channel = String(message.metadata?.channel || '').trim().toLowerCase();
    if (channel === 'broadcast') {
      return {
        label: 'Broadcast',
        className: 'border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-200'
      };
    }
    if (channel === 'quick_reply') {
      return {
        label: 'Quick Reply',
        className: 'border-indigo-500/30 bg-indigo-500/15 text-indigo-200'
      };
    }
    if (channel === 'whatsapp_auto_reply') {
      return {
        label: 'Auto Reply',
        className: 'border-amber-500/30 bg-amber-500/15 text-amber-200'
      };
    }
    if (channel === 'manual_chat_template') {
      return {
        label: 'Manual Template',
        className: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
      };
    }
    if (channel === 'manual_chat') {
      return {
        label: 'Manual Text',
        className: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
      };
    }
    if (channel === 'manual_chat_media') {
      return {
        label: 'Manual Media',
        className: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
      };
    }

    if (message.messageType === 'template') {
      return {
        label: 'Template',
        className: 'border-violet-500/30 bg-violet-500/15 text-violet-200'
      };
    }

    return {
      label: 'System',
      className: 'border-slate-500/30 bg-slate-500/15 text-slate-200'
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">WhatsApp Chat Inbox</h1>
        <p className="text-muted-foreground mt-2">
          Chat with existing and new customers with 24-hour policy enforcement.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Real-time updates come from WhatsApp Business API webhooks. Use refresh when needed.
        </p>
        <p className="text-xs mt-1">
          <span className={cn('font-medium', socketConnected ? 'text-emerald-500' : 'text-amber-500')}>
            {socketConnected ? 'Realtime connected' : 'Realtime reconnecting'}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Threads</p>
            <User className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">{total}</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Visible Threads</p>
            <MessageCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold">{customers.length}</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">24h Window</p>
            <Clock3 className="h-5 w-5 text-amber-500" />
          </div>
          <p className={cn('text-sm font-semibold', isWindowOpen ? 'text-emerald-400' : 'text-amber-300')}>
            {selectedPhone ? (isWindowOpen ? 'Open (free text allowed)' : 'Closed (template only)') : 'Select a chat'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {conversationWindow?.expiresAt ? `Expires: ${formatTime(conversationWindow.expiresAt)}` : 'Waiting for inbound message'}
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Page</p>
            <div className="text-sm font-medium">{page} / {totalPages || 1}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, total)} of {total}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by phone number or name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all"
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoadingCustomers || isLoadingMessages || sendingText || sendingTemplate || sendingMedia || uploadingMedia}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/60 text-sm font-semibold hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 p-4 grid grid-cols-1 lg:grid-cols-[220px_1fr_220px_140px] gap-3">
        <input
          type="text"
          placeholder="New customer number"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-border/60 bg-background/50 text-sm"
        />
        <input
          type="text"
          placeholder="Customer name (optional)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-border/60 bg-background/50 text-sm"
        />
        <div className="flex items-center text-xs text-muted-foreground px-2">
          New numbers can receive approved templates immediately.
        </div>
        <button
          onClick={handleOpenManualChat}
          className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Open Chat
        </button>
      </div>

      {customersError && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
          <p className="text-sm text-red-600 dark:text-red-400">{customersError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
        <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          {isLoadingCustomers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : customers.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No conversations found.</div>
          ) : (
            <div className="max-h-[620px] overflow-y-auto divide-y divide-border/30">
              {customers.map((customer) => (
                <button
                  key={customer._id}
                  type="button"
                  onClick={() => selectCustomer(customer)}
                  className={cn(
                    'w-full text-left p-4 hover:bg-background/50 transition-colors',
                    selectedPhone === customer.phoneNumber && 'bg-background/60'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold truncate">{customer.customerName || customer.phoneNumber}</p>
                    <span className="text-[11px] text-muted-foreground">{formatDate(customer.lastMessageAt || '')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{customer.phoneNumber}</p>
                  <p className="text-sm text-muted-foreground mt-2 truncate">{customer.lastMessageText || 'No messages yet'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={cn('text-[11px] font-semibold', customer.conversationWindow?.isOpen ? 'text-emerald-400' : 'text-amber-300')}>
                      {customer.conversationWindow?.isOpen ? '24h Open' : 'Template Only'}
                    </span>
                    {customer.unreadCount > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        {customer.unreadCount} unread
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-4">
          {!selectedPhone ? (
            <div className="h-[620px] flex items-center justify-center text-muted-foreground text-sm">
              Select a conversation or open a new number.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 border-b border-border/40 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Chatting with</p>
                    <p className="font-semibold">{selectedName || selectedPhone}</p>
                    <p className="text-xs text-muted-foreground">{selectedPhone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyPhone(selectedPhone)}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                      title="Copy phone number"
                    >
                      {copiedPhone === selectedPhone ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPhone('');
                        setSelectedName('');
                        setMessages([]);
                        setConversationWindow(null);
                      }}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                      title="Close conversation"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className={cn(
                  'rounded-lg border px-3 py-2 text-xs',
                  isWindowOpen
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                )}>
                  {isWindowOpen
                    ? `24-hour window open until ${formatTime(conversationWindow?.expiresAt)}. Free text is allowed.`
                    : '24-hour window closed. Only approved templates can be sent.'}
                </div>
              </div>

              <div
                ref={chatContainerRef}
                className="h-[400px] overflow-y-auto rounded-lg border border-border/40 bg-[#efeae2] p-3 space-y-2"
              >
                {isLoadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : messagesError ? (
                  <p className="text-sm text-red-400">{messagesError}</p>
                ) : orderedMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No chat history yet.</p>
                ) : (
                  orderedMessages.map((message) => {
                    const media = getMessageMedia(message);
                    const hasText = !!String(message.text || '').trim() && String(message.text || '').trim() !== '(no text)';

                    return (
                      <div
                        key={message._id}
                        className={cn(
                          'max-w-[84%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                          message.direction === 'outbound'
                            ? 'ml-auto rounded-br-md bg-[#d9fdd3] text-[#111b21]'
                            : 'mr-auto rounded-bl-md border border-black/5 bg-white text-[#111b21]'
                        )}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                              getMessageSourceMeta(message).className
                            )}
                          >
                            {getMessageSourceMeta(message).label}
                          </span>
                        </div>

                        {media && (
                          <div className="mb-2">
                            {media.mediaType === 'image' ? (
                              <a
                                href={media.mediaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block"
                              >
                                <img
                                  src={media.mediaUrl}
                                  alt={media.filename || 'Image'}
                                  className="max-h-56 w-auto max-w-full rounded-lg border border-black/10 object-cover"
                                />
                              </a>
                            ) : media.mediaType === 'video' ? (
                              <video
                                controls
                                preload="metadata"
                                className="max-h-64 w-full rounded-lg border border-black/10 bg-black"
                              >
                                <source src={media.mediaUrl} type={media.mimeType || 'video/mp4'} />
                                Your browser does not support video playback.
                              </video>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  void downloadMediaWithFilename(
                                    media.mediaUrl,
                                    media.filename || 'Document',
                                    'document',
                                    media.mimeType
                                  );
                                }}
                                className="flex w-full items-center gap-3 rounded-lg border border-black/10 bg-white/80 p-2 text-left text-xs hover:bg-white"
                              >
                                <FileText className="h-4 w-4 text-[#54656f]" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-[#111b21]">
                                    {media.filename || 'Document'}
                                  </p>
                                  <p className="truncate text-[#54656f]">
                                    {media.mimeType || 'Document attachment'}
                                  </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-[#54656f]" />
                              </button>
                            )}
                          </div>
                        )}

                        {hasText && (
                          <p className="whitespace-pre-wrap break-words">{message.text}</p>
                        )}

                        {!hasText && !media && (
                          <p className="whitespace-pre-wrap break-words text-[#54656f]">(no text)</p>
                        )}

                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="text-[10px] text-[#54656f]">
                            {formatTime(message.sentAt)}
                          </p>
                          <div className="flex items-center gap-1 text-[#54656f]">
                            {media?.mediaType === 'image' && <ImageIcon className="h-3.5 w-3.5" />}
                            {media?.mediaType === 'video' && <Video className="h-3.5 w-3.5" />}
                            {media?.mediaType === 'document' && <FileText className="h-3.5 w-3.5" />}
                            <span className="text-[10px] capitalize">{message.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                  )}
                </div>

                <div className="space-y-3 border-t border-border/40 pt-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Customer Name (for template variables)</label>
                    <input
                      value={selectedName}
                      onChange={(e) => setSelectedName(e.target.value)}
                      placeholder="Customer name"
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-3">
                    <textarea
                      value={textDraft}
                      onChange={(e) => setTextDraft(e.target.value)}
                      placeholder={isWindowOpen ? 'Type a message...' : '24h closed: free text disabled'}
                      disabled={!isWindowOpen || sendingText}
                      rows={3}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border bg-background/50 text-sm outline-none transition-all',
                        !isWindowOpen
                          ? 'border-amber-500/40 opacity-70 cursor-not-allowed'
                          : 'border-border/60 focus:ring-2 focus:ring-primary/10 focus:border-primary/40'
                      )}
                    />
                    <button
                      onClick={handleSendText}
                      disabled={!isWindowOpen || sendingText || !textDraft.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      {sendingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Send Text
                    </button>
                  </div>

                  <div className="rounded-lg border border-border/40 bg-background/30 p-3 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">Send Media (24h window only)</p>
                    <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_auto] gap-2">
                      <select
                        value={mediaType}
                        onChange={(e) => {
                          const nextType = e.target.value as 'image' | 'video' | 'document';
                          setMediaType(nextType);
                          if (nextType !== 'document') {
                            setMediaFilename('');
                            setMediaMimeType('');
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="document">Document</option>
                      </select>
                      <input
                        type="text"
                        value={mediaUrlDraft}
                        onChange={(e) => setMediaUrlDraft(e.target.value)}
                        placeholder="Public media URL (or upload below)"
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                      />
                      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium hover:bg-secondary">
                        {uploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploadingMedia ? 'Uploading...' : 'Upload'}
                        <input
                          type="file"
                          className="hidden"
                          accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/*' : '.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,application/*'}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            void handleUploadChatMedia(file);
                            e.currentTarget.value = '';
                          }}
                          disabled={uploadingMedia}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-2">
                      <input
                        type="text"
                        value={mediaCaption}
                        onChange={(e) => setMediaCaption(e.target.value)}
                        placeholder="Caption (optional)"
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                      />
                      <button
                        onClick={handleSendMedia}
                        disabled={!isWindowOpen || sendingMedia || !mediaUrlDraft.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50"
                      >
                        {sendingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Send Media
                      </button>
                    </div>

                    {mediaType === 'document' && (
                      <input
                        type="text"
                        value={mediaFilename}
                        onChange={(e) => setMediaFilename(e.target.value)}
                        placeholder="Document filename (shown to customer)"
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-3">
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm"
                    >
                      <option value="">Select approved template</option>
                      {templates.map((template) => (
                        <option key={template._id} value={template._id}>
                          {template.name} ({template.language || 'en_US'})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleSendTemplate}
                      disabled={sendingTemplate || !selectedTemplateId || isLoadingTemplates}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50"
                    >
                      {sendingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                      Send Template
                    </button>
                  </div>

                  {composerError && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                      {composerError}
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/20 text-center">
                    <p className="text-[11px] text-muted-foreground">Powered by <span className="font-semibold">OneQR</span></p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      {!isLoadingCustomers && customers.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-border/60 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-border/60 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
        Policy: free-form text is available only within 24 hours of the latest inbound customer message. After 24 hours, use approved templates.
      </div>
    </div>
  );
}
