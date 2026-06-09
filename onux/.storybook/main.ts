import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx|mdx)', '../packages/**/*.stories.@(ts|tsx|mdx)'],

  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  docs: {
    autodocs: 'tag',
  },

  staticDirs: ['../packages/design-tokens', '../packages/wallet-buttons/src/assets'],

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
