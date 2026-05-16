export type MenuThemeId = 'classic' | 'midnight' | 'fresh' | 'rose';

export interface MenuThemePreset {
  id: MenuThemeId;
  name: string;
  description: string;
  preview: string[];
  defaultPrimaryColor: string;
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
}

export const DEFAULT_MENU_APPEARANCE: Required<MenuAppearance> = {
  theme: 'classic',
  primaryColor: '#855300',
};

export const MENU_THEME_PRESETS: MenuThemePreset[] = [
  {
    id: 'classic',
    name: 'Classic Gold',
    description: 'Warm, elegant, and restaurant-friendly.',
    preview: ['#fff8f4', '#fffdfb', '#855300'],
    defaultPrimaryColor: '#855300',
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
    colors: {
      bg: '#fff6f5',
      surface: '#fffdfc',
      soft: '#ffe9e8',
      border: '#efc8c5',
      text: '#2b1719',
      muted: '#674549',
    },
  },
];

export const getMenuThemePreset = (theme?: string) =>
  MENU_THEME_PRESETS.find((preset) => preset.id === theme) || MENU_THEME_PRESETS[0];

export const normalizeMenuColor = (color?: string) =>
  /^#[0-9a-f]{6}$/i.test(color || '') ? color! : DEFAULT_MENU_APPEARANCE.primaryColor;

export const hexToRgbTuple = (color: string) => {
  const normalized = normalizeMenuColor(color).slice(1);
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ] as const;
};
