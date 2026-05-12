// Quick Grocery App - Design System
import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#007A33',
  primaryDark: '#005A25',
  primaryLight: '#E8F5E9',
  primaryGlow: 'rgba(0, 122, 51, 0.08)',

  accent: '#FF8C00',
  accentLight: '#FFF3E0',
  accentSoft: 'rgba(255, 140, 0, 0.12)',

  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFBFC',

  text: '#1A1D21',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  border: '#E8EAED',
  borderLight: '#F0F1F3',
  divider: '#EDEFF2',

  success: '#34C759',
  successLight: '#E8FAF0',
  error: '#FF3B30',
  errorLight: '#FFF0EF',

  shadow: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.4)',

  google: '#4285F4',
  eco: '#2E7D32',
  ecoLight: '#E0F2E9',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 100,
};

export const FONTS = {
  light: { fontWeight: '300' },
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  extrabold: { fontWeight: '800' },

  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 36,
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
};

// Reusable component styles
export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    fontSize: FONTS.size.md,
    color: COLORS.text,
    ...FONTS.regular,
    height: 52,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  label: {
    fontSize: FONTS.size.sm,
    color: COLORS.textSecondary,
    ...FONTS.medium,
    marginBottom: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: 56,
    ...SHADOWS.md,
  },
  primaryButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: FONTS.size.lg,
    ...FONTS.semibold,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: 52,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: FONTS.size.md,
    ...FONTS.semibold,
  },
  heading: {
    fontSize: FONTS.size.xxxl,
    color: COLORS.text,
    ...FONTS.bold,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: FONTS.size.md,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    color: COLORS.text,
    ...FONTS.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
});
