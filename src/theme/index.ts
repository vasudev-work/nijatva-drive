import { Platform } from 'react-native';

const brand = {
  ink: '#0B1412',
  tealDeep: '#0A3F35',
  teal: '#0E7C66',
  mint: '#19C08A',
  mintSoft: '#8FE9C6',
  amber: '#FFB020',
  coral: '#E5484D',
  violet: '#6C5CE7',
  sky: '#3B9AE1',
};

export const palette = brand;

export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    surfaceSunken: string;
    border: string;
    text: string;
    textMuted: string;
    textFaint: string;
    primary: string;
    primarySoft: string;
    onPrimary: string;
    accent: string;
    danger: string;
    star: string;
    headerFrom: string;
    headerTo: string;
    overlay: string;
  };
  radius: { sm: number; md: number; lg: number; xl: number; pill: number };
  space: (n: number) => number;
  shadow: {
    card: Record<string, unknown>;
    float: Record<string, unknown>;
  };
}

const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };
const space = (n: number) => n * 4;

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    bg: '#F4F6F5',
    surface: '#FFFFFF',
    surfaceAlt: '#EDF1EF',
    surfaceSunken: '#E3E9E6',
    border: '#E1E7E4',
    text: '#0B1412',
    textMuted: '#5B6B66',
    textFaint: '#8B9A95',
    primary: brand.teal,
    primarySoft: '#E1F5EE',
    onPrimary: '#FFFFFF',
    accent: brand.mint,
    danger: brand.coral,
    star: brand.amber,
    headerFrom: '#08302A',
    headerTo: '#0E7C66',
    overlay: 'rgba(8,20,18,0.45)',
  },
  radius,
  space,
  shadow: {
    card: Platform.select({
      ios: { shadowColor: '#0B1412', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      default: { elevation: 2 },
    }) as Record<string, unknown>,
    float: Platform.select({
      ios: { shadowColor: '#0B1412', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
      default: { elevation: 8 },
    }) as Record<string, unknown>,
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    bg: '#080F0E',
    surface: '#111A18',
    surfaceAlt: '#16211F',
    surfaceSunken: '#1D2927',
    border: '#233230',
    text: '#EAF3F0',
    textMuted: '#9BB0AA',
    textFaint: '#6C827D',
    primary: brand.mint,
    primarySoft: '#0E3A2E',
    onPrimary: '#04120E',
    accent: brand.mint,
    danger: '#FF6B6F',
    star: brand.amber,
    headerFrom: '#04120E',
    headerTo: '#0B4A3B',
    overlay: 'rgba(0,0,0,0.6)',
  },
  radius,
  space,
  shadow: {
    card: Platform.select({
      ios: { shadowColor: '#000000', shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
      default: { elevation: 2 },
    }) as Record<string, unknown>,
    float: Platform.select({
      ios: { shadowColor: '#000000', shadowOpacity: 0.55, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
      default: { elevation: 10 },
    }) as Record<string, unknown>,
  },
};

export const font = {
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
  medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }) as string,
};
