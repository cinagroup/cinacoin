/**
 * Shims for .vue SFC imports so TypeScript can resolve them.
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

/**
 * Allow importing .vue files with .js extension (TypeScript module resolution).
 */
declare module '*.vue.js' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<any, {}, any>;
  export default component;
  export interface CinaCoinProviderProps {
    config: import('./types').CinacoinConfig;
  }
}
