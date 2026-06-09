// Cinacoin UI — Main Entry Point
// Exports all components, hooks, utilities, and types

// Components
export * from './components/Button';
export * from './components/Card';
export * from './components/Input';
export * from './components/NavBar';
export * from './components/Footer';
export * from './components/Badge';
export * from './components/Banner';
export * from './components/PricingCard';
export * from './components/CodeEditor';
export * from './components/Link';
export * from './components/Tabs';
export * from './components/HeroBand';
export * from './components/FeatureBand';
export * from './components/LogoStrip';
export * from './components/MeshGradient';

// Hooks
export { useTheme } from './hooks/useTheme';
export { useMediaQuery } from './hooks/useMediaQuery';

// Utilities
export { cn, mergeProps } from './utils';

// Types
export type { Size, ButtonVariant, CardVariant, BaseProps } from './types';
