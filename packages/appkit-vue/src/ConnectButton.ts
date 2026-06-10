/**
 * ConnectButton — Vue 3 component for wallet connection
 *
 * Renders a button that opens the AppKit modal or shows the connected address.
 */

import { defineComponent, h, computed, type PropType } from 'vue';
import { useCinacoinAppKit } from './useCinacoinAppKit';

/**
 * Vue 3 connect button component.
 *
 * @example
 * ```vue
 * <template>
 *   <ConnectButton label="Sign In" />
 *   <ConnectButton>
 *     <template #connected="{ address }">
 *       🟢 {{ shortenAddress(address) }}
 *     </template>
 *     <template #disconnected>
 *       🔌 Connect
 *     </template>
 *   </ConnectButton>
 * </template>
 * ```
 */
export const ConnectButton = defineComponent({
  name: 'ConnectButton',
  props: {
    /** Label shown when disconnected */
    label: {
      type: String,
      default: 'Connect Wallet',
    },
    /** Custom CSS class */
    className: {
      type: String,
      default: '',
    },
  },
  emits: ['click'],
  setup(props, { slots, emit }) {
    const { status, account, open } = useCinacoinAppKit();

    const isConnected = computed(() => status.value === 'connected' && account.value);

    const handleClick = () => {
      emit('click');
      open();
    };

    const shortenAddress = (address: string) => {
      if (address.length <= 12) return address;
      return `${address.slice(0, 6)}…${address.slice(-4)}`;
    };

    return () => {
      const style = {
        padding: '8px 20px',
        borderRadius: '12px',
        border: isConnected.value ? '1px solid var(--cc-border, rgba(0,0,0,0.08))' : 'none',
        backgroundColor: isConnected.value ? 'var(--cc-surface, #f3f4f6)' : 'var(--cc-accent, #3b82f6)',
        color: isConnected.value ? 'var(--cc-ink, #111827)' : '#fff',
        fontSize: 'var(--text-body-sm)',
        fontWeight: 'var(--weight-semibold)',
        cursor: 'pointer',
        fontFamily: isConnected.value ? 'monospace' : 'inherit',
        transition: 'opacity 0.15s, transform 0.1s',
        outline: 'none',
      };

      // Custom slots
      if (isConnected.value && slots.connected && account.value) {
        return h(
          'button',
          {
            class: props.className,
            style,
            onClick: handleClick,
            type: 'button',
          },
          slots.connected({ address: account.value.address, chainId: account.value.chainId }),
        );
      }

      if (!isConnected.value && slots.disconnected) {
        return h(
          'button',
          {
            class: props.className,
            style,
            onClick: handleClick,
            type: 'button',
          },
          slots.disconnected(),
        );
      }

      // Default rendering
      const buttonText = isConnected.value && account.value
        ? shortenAddress(account.value.address)
        : status.value === 'connecting'
          ? 'Connecting...'
          : props.label;

      return h(
        'button',
        {
          class: props.className,
          style,
          onClick: handleClick,
          type: 'button',
        },
        buttonText,
      );
    };
  },
});
