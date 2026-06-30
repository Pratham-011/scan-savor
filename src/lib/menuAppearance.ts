export type MenuThemeId = 'classic' | 'midnight' | 'fresh' | 'rose' | 'stone';

export interface MenuThemePreset {
  id: MenuThemeId;
  name: string;
  description: string;
  preview: string[];
  defaultPrimaryColor: string;
  defaultBackgroundColor: string;
  colors: {
    bg: string;
    surface: string;
    soft: string;
    border: string;
    text: string;
    muted: string;
  };
}

export interface MenuAppearance {
  theme?: MenuThemeId;
  primaryColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  softColor?: string;
  borderColor?: string;
  textColor?: string;
  mutedColor?: string;
}

export const DEFAULT_MENU_APPEARANCE: Required<MenuAppearance> = {
  theme: 'classic',
  primaryColor: '#855300',
  backgroundColor: '#fff8f4',
  surfaceColor: '#fffdfb',
  softColor: '#fff1e5',
  borderColor: '#e6cdb7',
  textColor: '#221a11',
  mutedColor: '#5d4a38',
};

export const MENU_THEME_PRESETS: MenuThemePreset[] = [
  {
    id: 'classic',
    name: 'Classic Gold',
    description: 'Warm, elegant, and restaurant-friendly.',
    preview: ['#fff8f4', '#fffdfb', '#855300'],
    defaultPrimaryColor: '#855300',
    defaultBackgroundColor: '#fff8f4',
    colors: {
      bg: '#fff8f4',
      surface: '#fffdfb',
      soft: '#fff1e5',
      border: '#e6cdb7',
      text: '#221a11',
      muted: '#5d4a38',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight Luxe',
    description: 'Dark premium look for lounges and fine dining.',
    preview: ['#11100e', '#1c1814', '#c59a4a'],
    defaultPrimaryColor: '#c59a4a',
    defaultBackgroundColor: '#11100e',
    colors: {
      bg: '#11100e',
      surface: '#1c1814',
      soft: '#292117',
      border: '#3c3125',
      text: '#fff7ea',
      muted: '#d7c6ad',
    },
  },
  {
    id: 'fresh',
    name: 'Fresh Green',
    description: 'Clean and bright for cafes, healthy menus, and bakeries.',
    preview: ['#f6fbf3', '#ffffff', '#2f7a34'],
    defaultPrimaryColor: '#2f7a34',
    defaultBackgroundColor: '#f6fbf3',
    colors: {
      bg: '#f6fbf3',
      surface: '#ffffff',
      soft: '#eaf6e5',
      border: '#cfe5c8',
      text: '#172416',
      muted: '#4f624b',
    },
  },
  {
    id: 'rose',
    name: 'Rose Dining',
    description: 'Soft boutique styling for desserts and modern dining.',
    preview: ['#fff6f5', '#fffdfc', '#a83f50'],
    defaultPrimaryColor: '#a83f50',
    defaultBackgroundColor: '#fff6f5',
    colors: {
      bg: '#fff6f5',
      surface: '#fffdfc',
      soft: '#ffe9e8',
      border: '#efc8c5',
      text: '#2b1719',
      muted: '#674549',
    },
  },
  {
    id: 'stone',
    name: 'Stone Grey',
    description: 'Neutral, modern styling for minimalist menus and cafes.',
    preview: ['#f4f2ef', '#ffffff', '#6b625a'],
    defaultPrimaryColor: '#6b625a',
    defaultBackgroundColor: '#f4f2ef',
    colors: {
      bg: '#f4f2ef',
      surface: '#ffffff',
      soft: '#ebe6e0',
      border: '#d1cac2',
      text: '#24201c',
      muted: '#635d57',
    },
  },
];

export const getMenuThemePreset = (theme?: string) =>
  MENU_THEME_PRESETS.find((preset) => preset.id === theme) || MENU_THEME_PRESETS[0];

export const normalizeMenuColor = (color?: string, fallback = DEFAULT_MENU_APPEARANCE.primaryColor) =>
  /^#[0-9a-f]{6}$/i.test(color || '') ? color! : fallback;

export const hexToRgbTuple = (color: string) => {
  const normalized = normalizeMenuColor(color).slice(1);
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ] as const;
};
