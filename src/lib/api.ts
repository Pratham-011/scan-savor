// const API_BASE = 'https://oneqr.onrender.com/api';
// const BASE_URL = 'https://oneqr.onrender.com';

//LOCAL DEV BACKEND LINK
// const API_BASE = 'http://localhost:5000/api';
// const BASE_URL = 'http://localhost:5000';

//DEV BACKEND LINK(main branch)
// const API_BASE = 'https://oneqrbackend-axhad4hnenejhtek.eastasia-01.azurewebsites.net/api';
// const BASE_URL = 'https://oneqrbackend-axhad4hnenejhtek.eastasia-01.azurewebsites.net';

//PROD BACKEND LINK(prod branch)
const API_BASE = 'https://oneqrprod-dag2b3cmg0gsa7br.eastasia-01.azurewebsites.net/api';
const BASE_URL = 'https://oneqrprod-dag2b3cmg0gsa7br.eastasia-01.azurewebsites.net/';

// const frontendBaseUrl = 'https://scan-savor.vercel.app';
// Helper to get auth token
const getToken = () => localStorage.getItem('authToken');

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
    throw new Error(error.message || 'Request failed');
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

  delete: () =>
    apiRequest<{ message: string }>('/restaurant', {
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

  update: (id: string, data: { name?: string; order?: number; availability?: Availability; image?: string }) =>
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

  update: (id: string, data: { name?: string; order?: number; availability?: Availability; image?: string }) =>
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
export const publicMenuApi = {
  getBySlug: (slug: string) =>
    fetch(`${BASE_URL}/menu/${slug}`).then(res => {
      if (!res.ok) throw new Error('Menu not found');
      return res.json() as Promise<PublicMenuResponse>;
    }),

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
}

export interface PublicMenuResponse {
  restaurant: PublicRestaurant;
  menu: PublicMenuItem[];
}
