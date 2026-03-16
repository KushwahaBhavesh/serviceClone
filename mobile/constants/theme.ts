export const Colors = {
  // Primary brand colors (Figma: Orange accent)
  primary: '#FF6B00',       // Figma Orange
  primaryLight: '#FF8533',
  secondary: '#1A73E8',     // Figma Blue

  // Backgrounds
  background: '#FFFFFF',
  backgroundAlt: '#F5F5F5', // Light gray background
  surface: '#FFFFFF',

  // Text
  text: '#1A1A1A',          // Dark nearly black
  textDark: '#1A1A1A',
  textMedium: '#666666',
  textSecondary: '#666666', // Medium gray
  textLight: '#999999',
  textMuted: '#999999',     // Light gray
  textOnPrimary: '#FFFFFF',
  textOnHighlight: '#FFFFFF',

  // Status
  success: '#4CAF50',       // Figma Green
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',

  // Borders
  border: '#EEEEEE',
  borderLight: '#F5F5F5',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.4)',
  shimmer: '#F0F0F0',

  // Social
  google: '#4285F4',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
} as const;

export const BorderRadius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  full: 9999,
} as const;
