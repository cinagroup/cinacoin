/**
 * Shared styles for Pay UI widgets.
 *
 * Provides consistent styling tokens for swap and on-ramp components.
 */
export declare const colors: {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    bgBase: string;
    bgSurface: string;
    bgElevated: string;
    bgOverlay: string;
    darkBgBase: string;
    darkBgSurface: string;
    darkBgElevated: string;
    darkTextPrimary: string;
    darkTextSecondary: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    error: string;
    errorBg: string;
    info: string;
    infoBg: string;
    borderLight: string;
    borderMedium: string;
    borderFocus: string;
    slippageLow: string;
    slippageMedium: string;
    slippageHigh: string;
};
export declare const spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
};
export declare const borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
};
export declare const fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
};
export declare const fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
};
export declare const shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
};
export declare const transitions: {
    fast: string;
    normal: string;
    slow: string;
};
export declare const zIndices: {
    dropdown: number;
    modal: number;
    toast: number;
};
/**
 * Generates a complete CSS-in-JS style object for a widget.
 */
export declare function getWidgetStyles(theme?: "light" | "dark", customPrimary?: string): Record<string, string>;
/**
 * Inline style for a button element.
 */
export declare function buttonStyles(variant?: "primary" | "secondary" | "ghost", size?: "sm" | "md" | "lg", disabled?: boolean): Record<string, string>;
/**
 * Inline style for an input element.
 */
export declare function inputStyles(focus?: boolean): Record<string, string>;
/**
 * Card container styles.
 */
export declare function cardStyles(): Record<string, string>;
//# sourceMappingURL=styles.d.ts.map