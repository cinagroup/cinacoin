import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ocx-connect-modal': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'is-open'?: boolean;
          'default-view'?: string;
          'recommended-wallet-ids'?: string;
          className?: string;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
      'ocx-connect-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          variant?: string;
          size?: string;
          label?: string;
          state?: string;
          address?: string;
          balance?: string;
          'chain-symbol'?: string;
          'show-balance'?: boolean;
          'show-avatar'?: boolean;
          'show-network'?: boolean;
          className?: string;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
      'ocx-chain-switcher': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'active-chain-id'?: number;
          className?: string;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
    }
  }
}
