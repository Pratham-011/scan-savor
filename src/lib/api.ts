// const API_BASE = 'https://oneqr.onrender.com/api';
const API_BASE = 'https://oneqrbackend-axhad4hnenejhtek.eastasia-01.azurewebsites.net/api';
// const API_BASE = 'http://localhost:5000/api';
// const BASE_URL = 'http://localhost:5000';
// const BASE_URL = 'https://oneqr.onrender.com';
const BASE_URL = 'https://oneqrbackend-axhad4hnenejhtek.eastasia-01.azurewebsites.net';
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

  update: (id: string, data: { name?: string; availability?: Availability; image?: string }) =>
    apiRequest<Category>(`/category/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/category/${id}`, {
      method: 'DELETE',
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
  foodTypes?: ('jain' | 'veg' | 'non-veg' | 'vegan')[];
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
  foodTypes?: ('jain' | 'veg' | 'non-veg' | 'vegan')[];
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
  availability: Availability;
  isCurrentlyAvailable?: boolean;
  status?: string;
  image?: string;
  restaurant: string;
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
  availability: Availability;
  image?: string;
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
  image?: string;
  order: number;
}


// Updated restaurant type for public menu (includes qrSlug)
export interface PublicRestaurant extends Omit<Restaurant, 'slug'> {
  qrSlug: string;
  foodTypes?: ('jain' | 'veg' | 'non-veg' | 'vegan')[];
  locationLink?: string;
}

export interface PublicMenuResponse {
  restaurant: PublicRestaurant;
  menu: PublicMenuItem[];
}
