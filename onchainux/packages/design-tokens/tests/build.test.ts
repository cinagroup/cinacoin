/**
 * Tests for design-tokens package build output.
 * Tests that token exports are correctly structured and contain expected values.
 */

import { describe, it, expect } from 'vitest';
import {
  global,
  semantic,
  components,
  themes,
  cssVariables,
  cssVariablesLight,
  cssVariablesMinimal,
  cssVariablesMap,
  tokens,
} from '../../src/index.js';

describe('Design Tokens Build', () => {
  describe('Global tokens', () => {
    it('should export global tokens object', () => {
      expect(global).toBeDefined();
      expect(typeof global).toBe('object');
    });
  });

  describe('Semantic tokens', () => {
    it('should export semantic tokens object', () => {
      expect(semantic).toBeDefined();
      expect(typeof semantic).toBe('object');
    });
  });

  describe('Component tokens', () => {
    it('should export component tokens object', () => {
      expect(components).toBeDefined();
      expect(typeof components).toBe('object');
    });
  });

  describe('Themes', () => {
    it('should have dark theme', () => {
      expect(themes.dark).toBeDefined();
      expect(themes.dark.mode).toBe('dark');
      expect(themes.dark.name).toBe('default');
    });

    it('should have light theme', () => {
      expect(themes.light).toBeDefined();
      expect(themes.light.mode).toBe('light');
    });

    it('should have minimal theme', () => {
      expect(themes.minimal).toBeDefined();
    });

    it('dark theme should have all required token groups', () => {
      const dark = themes.dark;
      expect(dark.colors).toBeDefined();
      expect(dark.radii).toBeDefined();
      expect(dark.shadows).toBeDefined();
      expect(dark.typography).toBeDefined();
      expect(dark.spacing).toBeDefined();
      expect(dark.animations).toBeDefined();
      expect(dark.zIndex).toBeDefined();
    });

    it('dark theme should have accent colors', () => {
      expect(themes.dark.colors['--ocx-color-accent-500']).toBeDefined();
    });

    it('light theme should have different background than dark', () => {
      const darkBg = themes.dark.colors['--ocx-color-bg-primary'];
      const lightBg = themes.light.colors['--ocx-color-bg-primary'];
      expect(lightBg).not.toBe(darkBg);
    });
  });

  describe('CSS Variables', () => {
    it('should generate CSS variable string for dark theme', () => {
      expect(cssVariables).toBeDefined();
      expect(typeof cssVariables).toBe('string');
      expect(cssVariables).toContain(':root');
      expect(cssVariables).toContain('--ocx-');
    });

    it('should generate CSS variable string for light theme', () => {
      expect(cssVariablesLight).toBeDefined();
      expect(typeof cssVariablesLight).toBe('string');
      expect(cssVariablesLight).toContain('.ocx-theme-light');
    });

    it('should generate CSS variable string for minimal theme', () => {
      expect(cssVariablesMinimal).toBeDefined();
      expect(typeof cssVariablesMinimal).toBe('string');
      expect(cssVariablesMinimal).toContain('.ocx-theme-minimal');
    });

    it('cssVariablesMap should be a flat object', () => {
      expect(cssVariablesMap).toBeDefined();
      expect(typeof cssVariablesMap).toBe('object');
      // All values should be strings
      for (const value of Object.values(cssVariablesMap)) {
        expect(typeof value).toBe('string');
      }
    });

    it('cssVariablesMap should contain color tokens', () => {
      expect(cssVariablesMap['--ocx-color-accent-500']).toBe('#3B82F6');
      expect(cssVariablesMap['--ocx-color-bg-primary']).toBe('#0F172A');
    });

    it('cssVariablesMap should contain spacing tokens', () => {
      expect(cssVariablesMap['--ocx-space-4']).toBe('1rem');
      expect(cssVariablesMap['--ocx-space-8']).toBe('2rem');
    });

    it('cssVariablesMap should contain radius tokens', () => {
      expect(cssVariablesMap['--ocx-radius-md']).toBe('0.5rem');
      expect(cssVariablesMap['--ocx-radius-lg']).toBe('0.75rem');
    });

    it('cssVariablesMap should contain z-index tokens', () => {
      expect(cssVariablesMap['--ocx-z-modal']).toBe('2100');
      expect(cssVariablesMap['--ocx-z-toast']).toBe('3000');
    });
  });

  describe('Tokens catalog', () => {
    it('should aggregate all token groups', () => {
      expect(tokens).toBeDefined();
      expect(tokens.global).toBeDefined();
      expect(tokens.semantic).toBeDefined();
      expect(tokens.components).toBeDefined();
      expect(tokens.themes).toBeDefined();
    });

    it('should have correct theme count', () => {
      expect(Object.keys(tokens.themes)).toHaveLength(3);
    });
  });

  describe('Default export', () => {
    it('should re-export all named exports', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.default.global).toBeDefined();
      expect(mod.default.semantic).toBeDefined();
      expect(mod.default.components).toBeDefined();
      expect(mod.default.themes).toBeDefined();
      expect(mod.default.cssVariables).toBeDefined();
      expect(mod.default.cssVariablesLight).toBeDefined();
      expect(mod.default.cssVariablesMinimal).toBeDefined();
      expect(mod.default.cssVariablesMap).toBeDefined();
    });
  });

  describe('ThemeGroup interface compliance', () => {
    it('dark theme should have name and mode properties', () => {
      const dark = themes.dark;
      expect(typeof dark.name).toBe('string');
      expect(dark.mode).toBe('dark');
    });

    it('light theme should have name and mode properties', () => {
      const light = themes.light;
      expect(typeof light.name).toBe('string');
      expect(light.mode).toBe('light');
    });
  });
});
