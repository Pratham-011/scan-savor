// const API_BASE = 'https://oneqr.onrender.com/api';
// const BASE_URL = 'https://oneqr.onrender.com';

// LOCAL DEV BACKEND LINK
const API_BASE = 'http://localhost:5000/api';
const BASE_URL = 'http://localhost:5000';

// LOCAL NGINX DEV BACKEND LINK
// const API_BASE = 'https://54c2-36-255-170-81.ngrok-free.app/api';
// const BASE_URL = 'https://54c2-36-255-170-81.ngrok-free.app';

// DEV BACKEND LINK(main branch)
// const API_BASE = 'https://oneqrbackend-axhad4hnenejhtek.eastasia-01.azurewebsites.net/api';
// const BASE_URL = 'https://oneqrbackend-axhad4hnenejhtek.eastasia-01.azurewebsites.net';

// PROD BACKEND LINK(prod branch)
// const API_BASE = 'https://oneqrprod-dag2b3cmg0gsa7br.eastasia-01.azurewebsites.net/api';
// const BASE_URL = 'https://oneqrprod-dag2b3cmg0gsa7br.eastasia-01.azurewebsites.net';

export const getResolvedApiBase = () => API_BASE;
export const getResolvedBaseUrl = () => BASE_URL;

// const frontendBaseUrl = 'https://scan-savor.vercel.app';
// Helper to get auth token
const getToken = () => localStorage.getItem('authToken');

class ApiError extends Error {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}

// Generic fetch wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    const metaMessage =
      error?.metaError?.error?.error_user_msg ||
      error?.metaError?.error?.message ||
      error?.error ||
      error?.message ||
      'Request failed';

    throw new ApiError(metaMessage, error);
  }

  return response.json();
}

// Auth API
export const authApi = {
  requestOtp: (email: string) =>
    apiRequest<{ message: string }>('/auth/register/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp: string) =>
    apiRequest<{ verifyToken: string }>('/auth/register/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  signup: (verifyToken: string, password: string, name: string) =>
    apiRequest<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ verifyToken, password, name }),
    }),

  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

    forgotPassword: (email: string) =>
      apiRequest<{ message: string }>('/auth/forgot', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  
    verifyForgotOtp: (email: string, otp: string) =>
      apiRequest<{ resetToken: string }>('/auth/forgot/verify', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      }),
  
    resetPassword: (resetToken: string, newPassword: string) =>
      apiRequest<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ resetToken, newPassword }),
      }),
  
};

// Restaurant API
export const restaurantApi = {
  create: (data: CreateRestaurantData) =>
    apiRequest<Restaurant>('/restaurant', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: () => apiRequest<Restaurant>('/restaurant'),

  update: (data: Partial<CreateRestaurantData>) =>
    apiRequest<Restaurant>('/restaurant', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (confirmToken = 'DELETE') =>
    apiRequest<{ message: string }>(`/restaurant?confirm=${encodeURIComponent(confirmToken)}`, {
      method: 'DELETE',
    }),
};

// Main Category API
export const mainCategoryApi = {
  create: (data: { name: string; order: number; availability?: Availability; image?: string }) =>
    apiRequest<MainCategory>('/main-category', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: () => apiRequest<MainCategory[]>('/main-category'),

  update: (id: string, data: { name?: string; order?: number; availability?: Availability; image?: string | null }) =>
    apiRequest<MainCategory>(`/main-category/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/main-category/${id}`, {
      method: 'DELETE',
    }),
};

// Category API
export const categoryApi = {
  create: (data: { name: string; mainCategory: string; availability?: Availability; image?: string }) =>
    apiRequest<Category>('/category', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: () => apiRequest<Category[]>('/category'),

  update: (id: string, data: { name?: string; order?: number; availability?: Availability; image?: string | null }) =>
    apiRequest<Category>(`/category/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/category/${id}`, {
      method: 'DELETE',
    }),
};

// Tag API
export interface Tag {
  _id: string;
  name: string;
  color: string;
  order: number;
  restaurant: string;
  restaurantName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// AddOn
export interface AddOn {
  _id: string;
  name: string;
  price: number;
  order: number;
  restaurant: string;
  createdAt?: string;
  updatedAt?: string;
}

export const tagApi = {
  create: (data: { name: string; color: string; order: number }) =>
    apiRequest<Tag>('/tag', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: () => apiRequest<Tag[]>('/tag'),

  get: (id: string) => apiRequest<Tag>(`/tag/${id}`),

  update: (id: string, data: { name?: string; color?: string; order?: number }) =>
    apiRequest<Tag>(`/tag/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/tag/${id}`, {
      method: 'DELETE',
    }),
};

// AddOn API
export const addOnApi = {
  create: (data: { name: string; price: number; order?: number }) =>
    apiRequest<AddOn>('/add-on', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: () => apiRequest<AddOn[]>('/add-on'),

  get: (id: string) => apiRequest<AddOn>(`/add-on/${id}`),

  update: (id: string, data: { name?: string; price?: number; order?: number }) =>
    apiRequest<AddOn>(`/add-on/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/add-on/${id}`, {
      method: 'DELETE',
    }),

  assignToMainCategory: (mainCategoryId: string, addOnIds: string[]) =>
    apiRequest<MainCategory>(`/add-on/main-category/${mainCategoryId}/add-ons`, {
      method: 'PUT',
      body: JSON.stringify({ addOns: addOnIds }),
    }),

  assignToCategory: (categoryId: string, addOnIds: string[]) =>
    apiRequest<Category>(`/add-on/category/${categoryId}/add-ons`, {
      method: 'PUT',
      body: JSON.stringify({ addOns: addOnIds }),
    }),

  assignToMenuItem: (menuItemId: string, addOnIds: string[]) =>
    apiRequest<MenuItem>(`/add-on/menu-item/${menuItemId}/add-ons`, {
      method: 'PUT',
      body: JSON.stringify({ addOns: addOnIds }),
    }),
};

// Menu Item API
export const menuItemApi = {
  create: (data: CreateMenuItemData) =>
    apiRequest<MenuItem>('/menu-item', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: () => apiRequest<MenuItem[]>('/menu-item'),

  update: (id: string, data: Partial<CreateMenuItemData>) =>
    apiRequest<MenuItem>(`/menu-item/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/menu-item/${id}`, {
      method: 'DELETE',
    }),

  clearAll: () =>
    apiRequest<{ message: string }>('/menu-item/clear', {
      method: 'DELETE',
    }),
};

// Menu Analytics API
export interface MenuAnalytics {
  today: number;
  week: number;
  month: number;
  year: number;
  total: number;
}

export const menuAnalyticsApi = {
  get: (restaurantId: string) =>
    fetch(`${BASE_URL}/menu/admin/menu-analytics/${restaurantId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json() as Promise<MenuAnalytics>;
    }),
};

// Public Menu API
// export const publicMenuApi = {
//   getPublicApiOrigin: () => BASE_URL.replace(/\/$/, ''),

//   getSettings: (slug: string) =>
//     fetch(`${publicMenuApi.getPublicApiOrigin()}/api/public-menu/${slug}/settings`, {
//       cache: 'no-store',
//       headers: { Accept: 'application/json' },
//     }).then(res => {
//       if (!res.ok) throw new Error('Settings not found');
//       return res.json() as Promise<{
//         whatsappEnabled: boolean;
//         redirectUrl: string | null;
//         menuUrl: string;
//       }>;
//     }),

//   getBySlug: (slug: string, source?: string) =>
//     fetch(`${publicMenuApi.getPublicApiOrigin()}/api/public-menu/${slug}${source ? `?source=${encodeURIComponent(source)}` : ''}`, {
//       cache: 'no-store',
//       headers: {
//         Accept: 'application/json',
//       },
//     }).then(res => {
//       if (!res.ok) throw new Error('Menu not found');
//       return res.json() as Promise<PublicMenuResponse>;
//     }),

//   getWhatsAppRedirectUrl: (slug: string) => `${BASE_URL}/api/whatsapp/redirect/${slug}`,

//   // Fetch tags for a restaurant by slug
//   getTagsBySlug: async (slug: string): Promise<Tag[]> => {
//     // Try known public tag endpoints in order.
//     const endpoints = [
//       `${API_BASE}/tag/${slug}`,
//       `${API_BASE}/tag?slug=${encodeURIComponent(slug)}`,
//       `${API_BASE}/tag/public/${slug}`,
//     ];

//     for (const endpoint of endpoints) {
//       try {
//         const res = await fetch(endpoint);
//         if (!res.ok) continue;

//         const data = await res.json();
//         if (Array.isArray(data)) return data as Tag[];
//       } catch {
//         // Try next endpoint.
//       }
//     }

//     return [];
//   },
// };


export const publicMenuApi = {
  getPublicApiOrigin: () => {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      return window.location.origin.replace(/\/$/, '');
    }

    return BASE_URL.replace(/\/$/, '');
  },

  getSettings: async (slug: string) => {
    const url = `${publicMenuApi.getPublicApiOrigin()}/api/public-menu/${slug}/settings`;


    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });



    if (!res.ok) throw new Error('Settings not found');

    const data = await res.json() as {
        whatsappEnabled: boolean;
        redirectUrl: string | null;
        menuUrl: string;
      };


    return data;
  },

  getBySlug: async (slug: string, source?: string) => {
    const url = `${publicMenuApi.getPublicApiOrigin()}/api/public-menu/${slug}${source ? `?source=${encodeURIComponent(source)}` : ''}`;
 

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });



    if (!res.ok) throw new Error('Menu not found');

    const data = await res.json() as PublicMenuResponse;


    return data;
  },

  getWhatsAppRedirectUrl: (slug: string) => `${BASE_URL}/api/whatsapp/redirect/${slug}`,

  // Fetch tags for a restaurant by slug
  getTagsBySlug: async (slug: string): Promise<Tag[]> => {
    // Try known public tag endpoints in order.
    const endpoints = [
      `${API_BASE}/tag/${slug}`,
      `${API_BASE}/tag?slug=${encodeURIComponent(slug)}`,
      `${API_BASE}/tag/public/${slug}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) continue;

        const data = await res.json();
        if (Array.isArray(data)) return data as Tag[];
      } catch {
        // Try next endpoint.
      }
    }

    return [];
  },
};



// Menu Import/Export
export const menuApi = {
  import: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/menu/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Import failed' }));
      throw new Error(error.message);
    }
    
    return response.json();
  },

  export: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE}/menu/export`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menu.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  },
};

// Types
export type AvailabilityType = 'always' | 'once' | 'daily' | 'weekly';

export interface Availability {
  type: AvailabilityType;
  startDate?: string;
  endDate?: string;
  daysOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
}

export const defaultAvailability: Availability = { type: 'always' };

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Restaurant {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  Instaurl?: string;
  address?: string;
  phone?: string;
  slug: string;
  user: string;
  foodTypes?: ('jain' | 'veg' | 'non-veg' | 'vegan' | 'half-jain')[];
  locationLink?: string;
}

export interface CreateRestaurantData {
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  Instaurl?: string;
  address?: string;
  phone?: string;
  foodTypes?: ('jain' | 'veg' | 'non-veg' | 'vegan' | 'half-jain')[];
  locationLink?: string;
}

export interface MainCategory {
  _id: string;
  name: string;
  order: number;
  restaurant: string;
  availability: Availability;
  isCurrentlyAvailable?: boolean;
  status?: string;
  image?: string;
  addOns?: AddOn[];
}

export interface Category {
  _id: string;
  name: string;
  mainCategory: {
    _id: string;
    name: string;
    availability?: Availability;
    isCurrentlyAvailable?: boolean;
  };
  restaurant: string;
  order?: number;
  availability: Availability;
  isCurrentlyAvailable?: boolean;
  status?: string;
  image?: string;
  addOns?: AddOn[];
}


export interface MenuItem {
  _id: string;
  mainCategory: string | { _id: string; name: string };
  category: string | { _id: string; name: string };
  name: string;
  description?: string;
  price: number;
  isVeg: boolean;
  isJain?: boolean;
  isVegan?: boolean;
  isHalfJain?: boolean;
  availability: Availability;
  isCurrentlyAvailable?: boolean;
  status?: string;
  image?: string;
  restaurant: string;
  order?: number;
  tags?: Tag[];
  addOns?: AddOn[];
  addOnExclusions?: AddOn[];
  inheritedAddOns?: AddOn[];
  effectiveAddOns?: AddOn[];
}

export interface CreateMenuItemData {
  mainCategory: string;
  category: string;
  name: string;
  description?: string;
  price: number;
  isVeg: boolean;
  isJain?: boolean;
  isVegan?: boolean;
  isHalfJain?: boolean;
  availability: Availability;
  image?: string;
  tags?: Tag[];
  addOns?: string[];
  addOnExclusions?: string[];
}

// Public menu item with embedded category objects
export interface PublicMenuItem {
  _id: string;
  restaurant: string;
  mainCategory: {
    _id: string;
    name: string;
    order: number;
    image?: string;
  };
  category: {
    _id: string;
    name: string;
    mainCategory: string;
    restaurant: string;
    order?: number;
    image?: string;
  };
  name: string;
  description?: string;
  price: number;
  isVeg: boolean;
  isJain?: boolean;
  isVegan?: boolean;
  isHalfJain?: boolean;
  image?: string;
  order: number;
  tags?: Array<{ _id: string; name: string; color: string }>;
  effectiveAddOns?: Array<{ _id: string; name: string; price: number }>;
}


// Updated restaurant type for public menu (includes qrSlug)
export interface PublicRestaurant extends Omit<Restaurant, 'slug'> {
  qrSlug: string;
  foodTypes?: ('jain' | 'veg' | 'non-veg' | 'vegan' | 'half-jain')[];
  locationLink?: string;
  whatsapp?: {
    isEnabled?: boolean;
    qrRedirectEnabled?: boolean;
    autoReplyEnabled?: boolean;
  };
}

export interface PublicMenuResponse {
  restaurant?: PublicRestaurant;
  menu?: PublicMenuItem[];
  redirectToWhatsapp?: boolean;
  redirectUrl?: string;
}

// WhatsApp API
export interface WhatsAppConfig {
  businessId?: string;
  wabaId: string;
  accessToken: string;
  phoneNumberId: string;
  phoneNumber: string;
  qrPrefillMessage?: string;
  isEnabled?: boolean;
  qrRedirectEnabled?: boolean;
  autoReplyEnabled?: boolean;
  autoReplyTriggerMessage?: string;
  autoReplyMatchType?: 'contains' | 'equals';
  autoReplyResponseType?: 'auto' | 'template' | 'text';
  autoReplyTemplateId?: string | null;
  autoReplyText?: string;
}

export interface WhatsAppTemplate {
  _id: string;
  restaurant: string;
  name: string;
  body: string;
  category: 'marketing' | 'utility' | 'authentication' | 'custom';
  status:
    | 'pending'
    | 'in_review'
    | 'approved'
    | 'rejected'
    | 'paused'
    | 'disabled'
    | 'appeal_requested'
    | 'pending_deletion'
    | 'unknown';
  isActive: boolean;
  isDefault: boolean;
  autoSend: boolean;
  metaTemplateId?: string;
  language?: string;
  parameterFormat?: 'named' | 'positional';
  components?: WhatsAppTemplateComponent[];
  qualityScore?: 'unknown' | 'green' | 'yellow' | 'red' | string;
  statusReason?: string;
  lastStatusCheck?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'footer' | 'buttons';
  format?: 'text' | 'image' | 'video' | 'document' | 'location';
  text?: string;
  buttons?: WhatsAppTemplateButton[];
  example?: Record<string, unknown>;
}

export interface WhatsAppTemplateButton {
  type: 'quick_reply' | 'url' | 'phone_number' | 'copy_code' | 'otp';
  text: string;
  url?: string;
  phone_number?: string;
  example?: string[] | string;
  otp_type?: 'copy_code' | 'one_tap' | 'zero_tap';
}

export interface CreateWhatsAppTemplatePayload {
  name: string;
  body: string;
  category: 'marketing' | 'utility' | 'authentication' | 'custom';
  language?: string;
  parameterFormat?: 'named' | 'positional';
  components?: WhatsAppTemplateComponent[];
  isActive?: boolean;
  isDefault?: boolean;
  autoSend?: boolean;
}

export interface UpdateWhatsAppTemplatePayload {
  name?: string;
  body?: string;
  category?: 'marketing' | 'utility' | 'authentication' | 'custom';
  language?: string;
  parameterFormat?: 'named' | 'positional';
  components?: WhatsAppTemplateComponent[];
  isActive?: boolean;
  isDefault?: boolean;
  autoSend?: boolean;
}

export interface QuickReplyStep {
  order: number;
  kind: 'template' | 'text';
  templateId?: string | null;
  text?: string;
}

export interface QuickReplyRule {
  _id: string;
  restaurant: string;
  name: string;
  triggerText: string;
  matchType: 'contains' | 'equals';
  priority: number;
  isActive: boolean;
  sequence: QuickReplyStep[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInteraction {
  _id: string;
  restaurant: string;
  whatsappNumber: string;
  customerName?: string;
  customerProfileName?: string;
  customerProfileImage?: string;
  qrSessionId?: string;
  qrScanTimestamp?: string;
  interactionType: 'qr_scan' | 'whatsapp_message' | 'menu_view' | 'whatsapp_auto_reply';
  message?: string;
  whatsappMessageId?: string;
  deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  deliveryErrorCode?: string | null;
  deliveryErrorTitle?: string | null;
  deliveryErrorMessage?: string | null;
  deliveryErrorDetails?: string | null;
  messageTimestamp?: string;
  waRedirectUrl?: string;
  menuLinkSent: boolean;
  menuLinkSentTime?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  whatsappNumber: string;
  customerName?: string;
  customerProfileName?: string;
  customerProfileImage?: string;
  lastInteraction: string;
  interactionCount: number;
  interactionTypes: string[];
  latestMessage?: string;
  latestDeliveryStatus?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  latestDeliveryErrorMessage?: string | null;
  latestDeliveryErrorDetails?: string | null;
}

export interface WhatsAppWalletSpendBySource {
  sourceType: 'broadcast' | 'quick_reply' | 'chat' | 'manual_sync' | 'meta_adjustment' | 'other' | string;
  count: number;
  billableCount: number;
  totalAmount: number;
}

export interface WhatsAppWalletSnapshot {
  balance: number | null;
  currency: string | null;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  totalCredited: number;
  totalDebited: number;
  creditCount: number;
  debitCount: number;
  spendBySource: WhatsAppWalletSpendBySource[];
}

export interface WhatsAppWalletTransaction {
  _id: string;
  entryType: 'message' | 'balance_sync';
  direction: 'credit' | 'debit';
  status: 'pending' | 'posted' | 'failed';
  sourceType: 'broadcast' | 'quick_reply' | 'chat' | 'manual_sync' | 'meta_adjustment' | 'other' | string;
  sourceId?: string | null;
  sourceModel?: string | null;
  whatsappMessageId?: string | null;
  recipientPhone?: string | null;
  templateName?: string | null;
  amount?: number | null;
  currency?: string | null;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  metaStatus?: string | null;
  billable?: boolean | null;
  conversationCategory?: string | null;
  pricingModel?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppConversationWindow {
  isOpen: boolean;
  lastInboundAt: string | null;
  expiresAt: string | null;
  remainingMs: number;
  remainingMinutes: number;
}

export interface WhatsAppChatCustomer {
  _id: string;
  phoneNumber: string;
  customerName?: string | null;
  lastMessageText?: string;
  lastMessageType?: 'text' | 'template' | 'interactive' | 'system' | string;
  lastDirection?: 'inbound' | 'outbound' | string;
  lastStatus?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | string;
  lastMessageAt?: string;
  lastInboundAt?: string | null;
  totalMessages: number;
  unreadCount: number;
  conversationWindow: WhatsAppConversationWindow;
}

export interface WhatsAppChatMessage {
  _id: string;
  phoneNumber: string;
  customerName?: string | null;
  direction: 'inbound' | 'outbound';
  messageType: 'text' | 'template' | 'interactive' | 'system' | string;
  text: string;
  template?: {
    templateId?: string | null;
    name?: string | null;
    language?: string | null;
  };
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | string;
  errorMessage?: string | null;
  metadata?: {
    channel?: string;
    sourceModel?: string;
    sourceId?: string;
    campaignId?: string;
    [key: string]: unknown;
  } | null;
  within24HourWindow?: boolean | null;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
}

export const whatsappApi = {
  // Configure WhatsApp settings
  configureSettings: (config: WhatsAppConfig) =>
    apiRequest<{ message: string; restaurant: PublicRestaurant }>('/whatsapp/configure', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  getSettings: () =>
    apiRequest<{ whatsapp: Partial<WhatsAppConfig> }>('/whatsapp/settings'),

  updateSettings: (data: Partial<WhatsAppConfig>) =>
    apiRequest<{ message: string; whatsapp: Partial<WhatsAppConfig> }>('/whatsapp/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getWallet: (options?: { page?: number; limit?: number; sourceType?: string; refresh?: boolean }) => {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.sourceType) params.set('sourceType', options.sourceType);
    if (options?.refresh) params.set('refresh', 'true');
    const query = params.toString();
    return apiRequest<{
      wallet: WhatsAppWalletSnapshot;
      sync?: { balance: number; currency: string | null } | null;
      transactions: WhatsAppWalletTransaction[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/whatsapp/wallet${query ? `?${query}` : ''}`);
  },

  syncWallet: () =>
    apiRequest<{
      message: string;
      wallet: WhatsAppWalletSnapshot;
    }>('/whatsapp/wallet/sync', {
      method: 'POST',
    }),

  createTemplate: (data: CreateWhatsAppTemplatePayload) =>
    apiRequest<{ message: string; template: WhatsAppTemplate }>('/whatsapp/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTemplates: (forceFresh = false) =>
    apiRequest<{ templates: WhatsAppTemplate[] }>(`/whatsapp/templates${forceFresh ? `?_ts=${Date.now()}` : ''}`, {
      cache: 'no-store',
    }),

  getTemplate: (id: string) =>
    apiRequest<{ template: WhatsAppTemplate }>(`/whatsapp/templates/${id}`),

  syncTemplates: () =>
    apiRequest<{ message: string; templates: WhatsAppTemplate[] }>('/whatsapp/templates/sync', {
      method: 'POST',
    }),

  updateTemplate: (id: string, data: UpdateWhatsAppTemplatePayload) =>
    apiRequest<{ message: string; template: WhatsAppTemplate }>(`/whatsapp/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTemplate: (id: string) =>
    apiRequest<{ message: string }>(`/whatsapp/templates/${id}`, {
      method: 'DELETE',
    }),

  updateTemplateStatus: (id: string, status: 'in_review' | 'approved' | 'rejected') =>
    apiRequest<{ message: string; template: WhatsAppTemplate }>(`/whatsapp/templates/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  checkTemplateStatus: (id: string) =>
    apiRequest<{
      message: string;
      template: WhatsAppTemplate;
      refreshedAt: string;
      webhookDebug?: {
        receivedAt: string | null;
        phoneNumberId: string | null;
        displayPhone: string | null;
        hasMessages: boolean;
        fromPhone: string | null;
        messageType: string | null;
        webhookReceived: boolean;
      };
    }>(`/whatsapp/templates/${id}/check-status`, {
      method: 'POST',
    }),

  createQuickReply: (data: {
    name: string;
    triggerText: string;
    matchType: 'contains' | 'equals';
    priority: number;
    isActive: boolean;
    sequence: QuickReplyStep[];
  }) =>
    apiRequest<{ message: string; quickReply: QuickReplyRule }>('/whatsapp/quick-replies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getQuickReplies: () =>
    apiRequest<{ quickReplies: QuickReplyRule[] }>('/whatsapp/quick-replies'),

  updateQuickReply: (
    id: string,
    data: Partial<{
      name: string;
      triggerText: string;
      matchType: 'contains' | 'equals';
      priority: number;
      isActive: boolean;
      sequence: QuickReplyStep[];
    }>
  ) =>
    apiRequest<{ message: string; quickReply: QuickReplyRule }>(`/whatsapp/quick-replies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteQuickReply: (id: string) =>
    apiRequest<{ message: string }>(`/whatsapp/quick-replies/${id}`, {
      method: 'DELETE',
    }),

  // Get customer interactions for analytics
  getInteractions: (restaurantId: string, page = 1, limit = 20) =>
    apiRequest<{
      interactions: CustomerInteraction[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/whatsapp/interactions/${restaurantId}?page=${page}&limit=${limit}`),

  // Get unique customers
  getCustomers: (restaurantId: string, page = 1, limit = 20, search = '') =>
    apiRequest<{
      customers: Customer[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/whatsapp/customers/${restaurantId}?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`),

  // Get customer details
  getCustomerDetails: (restaurantId: string, phoneNumber: string) =>
    apiRequest<{
      customer: {
        whatsappNumber: string;
        firstInteraction: string;
        lastInteraction: string;
        totalInteractions: number;
      };
      interactions: CustomerInteraction[];
    }>(`/whatsapp/customer/${restaurantId}/${phoneNumber}`),

  // Send menu link to customer
  sendMenuLink: (restaurantId: string, customerPhone: string, menuUrl: string) =>
    apiRequest<{
      message: string;
      whatsappUrl: string;
      interaction: CustomerInteraction;
    }>('/whatsapp/send-menu', {
      method: 'POST',
      body: JSON.stringify({
        restaurantId,
        customerPhone,
        menuUrl,
      }),
    }),

  getChatCustomers: (page = 1, limit = 20, search = '') =>
    apiRequest<{
      customers: WhatsAppChatCustomer[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/whatsapp/chat/customers?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`),

  getChatMessages: (phoneNumber: string, page = 1, limit = 50) =>
    apiRequest<{
      phoneNumber: string;
      conversationWindow: WhatsAppConversationWindow;
      messages: WhatsAppChatMessage[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/whatsapp/chat/messages/${encodeURIComponent(phoneNumber)}?page=${page}&limit=${limit}`),

  getChatWindow: (phoneNumber: string) =>
    apiRequest<{
      phoneNumber: string;
      conversationWindow: WhatsAppConversationWindow;
    }>(`/whatsapp/chat/window/${encodeURIComponent(phoneNumber)}`),

  sendChatText: (data: { phoneNumber: string; customerName?: string; text: string }) =>
    apiRequest<{
      message: string;
      chatMessage: WhatsAppChatMessage;
      conversationWindow: WhatsAppConversationWindow;
      meta?: unknown;
    }>('/whatsapp/chat/send/text', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendChatTemplate: (data: {
    phoneNumber: string;
    customerName?: string;
    templateId?: string;
    templateName?: string;
    variables?: Record<string, string>;
  }) =>
    apiRequest<{
      message: string;
      chatMessage: WhatsAppChatMessage;
      conversationWindow: WhatsAppConversationWindow;
      meta?: unknown;
    }>('/whatsapp/chat/send/template', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export interface BroadcastContact {
  _id: string;
  restaurant: string;
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
  source: 'manual' | 'import' | 'customer_sync';
  isActive: boolean;
  lastInteractionAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastCampaign {
  _id: string;
  restaurant: string;
  name: string;
  templateId: string;
  templateName: string;
  templateLanguage?: string;
  message: string;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed';
  scheduledAt?: string | null;
  retryAutomation: {
    enabled: boolean;
    maxRetries: number;
    retryDelayMinutes: number;
  };
  stats: {
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    successRate: number;
    deliveryRate: number;
    readRate: number;
  };
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastRecipient {
  _id: string;
  campaign: string;
  contact: string;
  phone: string;
  name: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  attempts: number;
  maxRetries: number;
  retryAutomationEnabled: boolean;
  nextRetryAt?: string | null;
  lastAttemptAt?: string | null;
  whatsappMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  history?: Array<{
    status: string;
    at: string;
    errorCode?: string | null;
    errorMessage?: string | null;
    whatsappMessageId?: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

const downloadCsvWithAuth = async (endpoint: string, filename: string) => {
  const token = getToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Download failed' }));
    throw new Error(error?.message || 'Download failed');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const broadcastApi = {
  getApprovedTemplates: () =>
    apiRequest<{ templates: WhatsAppTemplate[] }>('/broadcast/templates/approved'),

  getContacts: (page = 1, limit = 25, search = '') =>
    apiRequest<{
      contacts: BroadcastContact[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/broadcast/contacts?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`),

  createContact: (data: { name: string; phone: string; email?: string; tags?: string[] }) =>
    apiRequest<{ message: string; contact: BroadcastContact }>('/broadcast/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteContact: (id: string) =>
    apiRequest<{ message: string }>(`/broadcast/contacts/${id}`, {
      method: 'DELETE',
    }),

  importContacts: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/broadcast/contacts/import`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Import failed' }));
      throw new Error(error?.message || 'Import failed');
    }

    return response.json() as Promise<{
      message: string;
      summary: {
        parsed: number;
        created: number;
        updated: number;
      };
    }>;
  },

  syncCustomersToContacts: () =>
    apiRequest<{
      message: string;
      summary: {
        customers: number;
        created: number;
        updated: number;
      };
    }>('/broadcast/contacts/sync-customers', {
      method: 'POST',
    }),

  exportContacts: () => downloadCsvWithAuth('/broadcast/contacts/export', 'broadcast-contacts.csv'),

  createCampaign: (data: {
    name: string;
    templateId: string;
    contactIds?: string[];
    launch?: boolean;
    scheduleAt?: string;
    retryAutomation?: {
      enabled?: boolean;
      maxRetries?: number;
      retryDelayMinutes?: number;
    };
  }) =>
    apiRequest<{ message: string; campaign: BroadcastCampaign }>('/broadcast/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  startCampaign: (id: string) =>
    apiRequest<{ message: string; campaign: BroadcastCampaign }>(`/broadcast/campaigns/${id}/start`, {
      method: 'POST',
    }),

  startNowCampaign: (id: string) =>
    apiRequest<{ message: string; campaign: BroadcastCampaign }>(`/broadcast/campaigns/${id}/start-now`, {
      method: 'POST',
    }),

  getCampaigns: (page = 1, limit = 20) =>
    apiRequest<{
      campaigns: BroadcastCampaign[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/broadcast/campaigns?page=${page}&limit=${limit}`),

  getCampaignDetail: (id: string, options?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 25;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (options?.status) {
      params.set('status', options.status);
    }
    if (options?.search) {
      params.set('search', options.search);
    }

    return apiRequest<{
      campaign: BroadcastCampaign;
      stats: BroadcastCampaign['stats'] & { status: BroadcastCampaign['status'] };
      recipients: BroadcastRecipient[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/broadcast/campaigns/${id}?${params.toString()}`);
  },

  updateRetryConfig: (id: string, data: { enabled: boolean; maxRetries: number; retryDelayMinutes: number }) =>
    apiRequest<{ message: string; campaign: BroadcastCampaign }>(`/broadcast/campaigns/${id}/retry-config`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  retryFailed: (id: string) =>
    apiRequest<{ message: string; retriedCount: number }>(`/broadcast/campaigns/${id}/retry-failed`, {
      method: 'POST',
    }),

  refreshCampaign: (id: string) =>
    apiRequest<{ message: string; campaign: BroadcastCampaign; stats: BroadcastCampaign['stats'] & { status: BroadcastCampaign['status'] } }>(`/broadcast/campaigns/${id}/refresh`, {
      method: 'POST',
    }),

  exportCampaignReport: (id: string) => downloadCsvWithAuth(`/broadcast/campaigns/${id}/export`, `broadcast-${id}.csv`),
};
