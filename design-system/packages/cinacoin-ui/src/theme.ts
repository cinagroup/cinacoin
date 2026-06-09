/**
 * Cinacoin Tailwind Theme Extension
 * Import this in your tailwind.config.ts
 */

import { colors, spacing, borderRadius, shadows, typography } from './tokens';

export const theme = {
  extend: {
    colors: {
      // Semantic colors
      primary: colors.primary,
      'on-primary': colors.onPrimary,
      
      // Canvas
      canvas: colors.canvas,
      'canvas-soft': colors.canvasSoft,
      'canvas-soft-2': colors.canvasSoft2,
      
      // Text
      ink: colors.ink,
      body: colors.body,
      mute: colors.mute,
      
      // Borders
      hairline: colors.hairline,
      
      // Semantic
      link: colors.link,
      error: colors.error,
      success: colors.success,
      warning: colors.warning,
      
      // Extended palette
      gray: colors.gray,
      blue: colors.blue,
    },
    
    spacing: {
      xxs: spacing.xxs,
      xs: spacing.xs,
      sm: spacing.sm,
      md: spacing.md,
      lg: spacing.lg,
      xl: spacing.xl,
      '2xl': spacing['2xl'],
      '3xl': spacing['3xl'],
      '4xl': spacing['4xl'],
      '5xl': spacing['5xl'],
    },
    
    borderRadius: {
      sm: borderRadius.sm,
      md: borderRadius.md,
      lg: borderRadius.lg,
      pill: borderRadius.pill,
    },
    
    boxShadow: {
      'cinacoin-1': shadows.level1,
      'cinacoin-2': shadows.level2,
      'cinacoin-3': shadows.level3,
      'cinacoin-4': shadows.level4,
      'cinacoin-5': shadows.level5,
    },
    
    fontFamily: {
      sans: typography.fontFamily.sans,
      mono: typography.fontFamily.mono,
    },
    
    fontWeight: {
      normal: typography.fontWeight.normal,
      medium: typography.fontWeight.medium,
      semibold: typography.fontWeight.semibold,
    },
    
    letterSpacing: {
      tight: typography.letterSpacing.tight,
    },
    
    transitionDuration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
  },
} as const;
