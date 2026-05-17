/**
 * Shared styles for Pay UI widgets.
 *
 * Provides consistent styling tokens for swap and on-ramp components.
 */

export const colors = {
  // Primary palette
  primary: "#6366F1",
  primaryHover: "#4F46E5",
  primaryActive: "#4338CA",

  // Background
  bgBase: "#FFFFFF",
  bgSurface: "#F8FAFC",
  bgElevated: "#F1F5F9",
  bgOverlay: "rgba(0, 0, 0, 0.5)",

  // Dark mode overrides
  darkBgBase: "#0F172A",
  darkBgSurface: "#1E293B",
  darkBgElevated: "#334155",
  darkTextPrimary: "#F8FAFC",
  darkTextSecondary: "#CBD5E1",

  // Text
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",

  // Status
  success: "#10B981",
  successBg: "#D1FAE5",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  error: "#EF4444",
  errorBg: "#FEE2E2",
  info: "#3B82F6",
  infoBg: "#DBEAFE",

  // Borders
  borderLight: "#E2E8F0",
  borderMedium: "#CBD5E1",
  borderFocus: "#6366F1",

  // Slippage severity colors
  slippageLow: "#10B981",
  slippageMedium: "#F59E0B",
  slippageHigh: "#EF4444",
};

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
};

export const borderRadius = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
};

export const fontSize = {
  xs: "12px",
  sm: "14px",
  md: "16px",
  lg: "18px",
  xl: "20px",
  "2xl": "24px",
};

export const fontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
};

export const transitions = {
  fast: "150ms ease",
  normal: "250ms ease",
  slow: "350ms ease",
};

export const zIndices = {
  dropdown: 100,
  modal: 200,
  toast: 300,
};

/**
 * Generates a complete CSS-in-JS style object for a widget.
 */
export function getWidgetStyles(
  theme: "light" | "dark" = "light",
  customPrimary?: string
): Record<string, string> {
  const c = theme === "dark"
    ? {
        bgBase: colors.darkBgBase,
        bgSurface: colors.darkBgSurface,
        bgElevated: colors.darkBgElevated,
        textPrimary: colors.darkTextPrimary,
        textSecondary: colors.darkTextSecondary,
        textMuted: colors.textMuted,
        border: colors.darkBgElevated,
      }
    : {
        bgBase: colors.bgBase,
        bgSurface: colors.bgSurface,
        bgElevated: colors.bgElevated,
        textPrimary: colors.textPrimary,
        textSecondary: colors.textSecondary,
        textMuted: colors.textMuted,
        border: colors.borderLight,
      };

  const primary = customPrimary || colors.primary;

  return {
    "--ocx-bg-base": c.bgBase,
    "--ocx-bg-surface": c.bgSurface,
    "--ocx-bg-elevated": c.bgElevated,
    "--ocx-text-primary": c.textPrimary,
    "--ocx-text-secondary": c.textSecondary,
    "--ocx-text-muted": c.textMuted,
    "--ocx-border": c.border,
    "--ocx-primary": primary,
    "--ocx-primary-hover": primary,
    "--ocx-success": colors.success,
    "--ocx-error": colors.error,
    "--ocx-warning": colors.warning,
    "--ocx-radius": borderRadius.lg,
    "--ocx-font-sans": 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };
}

/**
 * Inline style for a button element.
 */
export function buttonStyles(
  variant: "primary" | "secondary" | "ghost" = "primary",
  size: "sm" | "md" | "lg" = "md",
  disabled = false
): Record<string, string> {
  const sizeMap = {
    sm: { padding: `${spacing.xs} ${spacing.sm}`, fontSize: fontSize.xs },
    md: { padding: `${spacing.sm} ${spacing.md}`, fontSize: fontSize.sm },
    lg: { padding: `${spacing.md} ${spacing.lg}`, fontSize: fontSize.md },
  };

  const s = sizeMap[size];

  if (disabled) {
    return {
      ...s,
      background: colors.bgElevated,
      color: colors.textMuted,
      border: `1px solid ${colors.borderLight}`,
      borderRadius: borderRadius.md,
      fontWeight: fontWeight.medium,
      cursor: "not-allowed",
      opacity: "0.6",
      transition: `all ${transitions.normal}`,
    };
  }

  if (variant === "primary") {
    return {
      ...s,
      background: colors.primary,
      color: colors.textInverse,
      border: "none",
      borderRadius: borderRadius.md,
      fontWeight: fontWeight.semibold,
      cursor: "pointer",
      transition: `all ${transitions.normal}`,
    };
  }

  if (variant === "secondary") {
    return {
      ...s,
      background: colors.bgSurface,
      color: colors.textPrimary,
      border: `1px solid ${colors.borderLight}`,
      borderRadius: borderRadius.md,
      fontWeight: fontWeight.medium,
      cursor: "pointer",
      transition: `all ${transitions.normal}`,
    };
  }

  return {
    ...s,
    background: "transparent",
    color: colors.primary,
    border: "none",
    borderRadius: borderRadius.md,
    fontWeight: fontWeight.medium,
    cursor: "pointer",
    transition: `all ${transitions.normal}`,
  };
}

/**
 * Inline style for an input element.
 */
export function inputStyles(focus = false): Record<string, string> {
  return {
    width: "100%",
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
    border: `1px solid ${focus ? colors.borderFocus : colors.borderLight}`,
    borderRadius: borderRadius.md,
    outline: "none",
    background: colors.bgBase,
    color: colors.textPrimary,
    transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
    boxShadow: focus ? `0 0 0 3px rgba(99, 102, 241, 0.1)` : "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
}

/**
 * Card container styles.
 */
export function cardStyles(): Record<string, string> {
  return {
    background: colors.bgBase,
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.borderLight}`,
    boxShadow: shadows.lg,
    padding: spacing.xl,
    fontFamily: "inherit",
  };
}
