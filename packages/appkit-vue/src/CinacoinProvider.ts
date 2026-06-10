/**
 * CinacoinProvider — Vue 3 component for providing AppKit instance
 *
 * Wraps the application and provides the AppKit instance via Vue's provide/inject.
 */

import { defineComponent, provide, onMounted, onUnmounted, h, type PropType } from 'vue';
import {
  createCinacoinAppKit,
  type CinacoinAppKitConfig,
  type CinacoinAppKitInstance,
  type ConnectionState,
} from '@cinacoin/appkit';
import { CINACOIN_APPKIT_KEY } from './useCinacoinAppKit';

/**
 * Vue 3 provider component.
 *
 * @example
 * ```vue
 * <script setup>
 * import { CinacoinProvider } from '@cinacoin/appkit-vue';
 *
 * const config = {
 *   projectId: 'xxx',
 *   chains: [...],
 *   metadata: {...},
 * };
 * </script>
 *
 * <template>
 *   <CinacoinProvider :config="config">
 *     <App />
 *   </CinacoinProvider>
 * </template>
 * ```
 */
export const CinacoinProvider = defineComponent({
  name: 'CinacoinProvider',
  props: {
    config: {
      type: Object as PropType<CinacoinAppKitConfig>,
      required: true,
    },
  },
  setup(props, { slots }) {
    let appkit: CinacoinAppKitInstance | null = null;
    let unsub: (() => void) | null = null;

    // Create AppKit instance
    onMounted(() => {
      appkit = createCinacoinAppKit(props.config);

      // Provide to descendants
      provide(CINACOIN_APPKIT_KEY, appkit);

      // Subscribe to state changes (for future reactivity enhancements)
      unsub = appkit.subscribe((state: ConnectionState) => {
        // In a full implementation, this would update a reactive ref
        // For now, the composable uses computed properties
        void state;
      });
    });

    onUnmounted(() => {
      unsub?.();
    });

    // Render slot content
    return () => {
      if (!appkit) {
        // During SSR or before mount, render children without the modal
        return slots.default?.();
      }

      // Render children + modal component
      // Note: The modal is a React component, so in a real implementation
      // we'd need a bridge or render it separately. For now, we just render children.
      return slots.default?.();
    };
  },
});
