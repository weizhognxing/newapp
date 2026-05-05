export const Colors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryDeep: '#172554',
  primaryLight: '#60a5fa',
  primaryBg: '#eff6ff',
  primarySoft: '#dbeafe',

  accent: '#06b6d4',
  accentDark: '#0891b2',
  accentSoft: '#cffafe',
  violet: '#7c3aed',
  violetSoft: '#ede9fe',

  success: '#10b981',
  successBg: '#ecfdf5',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  danger: '#ef4444',
  dangerBg: '#fef2f2',
  info: '#3b82f6',
  infoBg: '#eff6ff',

  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  textMuted: '#cbd5e1',
  textInverse: '#ffffff',

  background: '#f5f7fb',
  backgroundElevated: '#eef6ff',
  surface: '#ffffff',
  surfaceGlass: 'rgba(255, 255, 255, 0.92)',
  border: '#dbe3ef',
  borderLight: '#eef2f7',
  divider: '#e2e8f0',

  overlay: 'rgba(15, 23, 42, 0.52)',
  shadow: 'rgba(15, 23, 42, 0.12)',
};

export const Gradients = {
  brand: ['#172554', '#2563eb', '#06b6d4'] as const,
  brandSoft: ['#eff6ff', '#f8fbff', '#ecfeff'] as const,
  primaryButton: ['#2563eb', '#0891b2'] as const,
  hero: ['#061a44', '#1d4ed8', '#06b6d4'] as const,
  card: ['#ffffff', '#f8fbff'] as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 9,
  },
  brand: {
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
};
