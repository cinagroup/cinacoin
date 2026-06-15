/**
 * @cinacoin/theme — Barrel exports
 */
export { useTheme, type Theme } from "./use-theme";
export { ThemeProvider, useThemeContext } from "./theme-provider";
export { ThemeToggle } from "./theme-toggle";
export {
  generateAutoThemeCSS,
  injectAutoThemeCSS,
  removeAutoThemeCSS,
  getSystemColorScheme,
  onSystemColorSchemeChange,
  prefersDarkMode,
  prefersLightMode,
  prefersReducedMotion,
  prefersHighContrast,
  generateReducedMotionCSS,
  generateHighContrastCSS,
  generateAccessibilityCSS,
} from "./auto-theme";
