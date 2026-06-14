/**
 * QR Code Generation Tests
 *
 * Tests the pure TypeScript QR code generator:
 * - SVG output generation
 * - Options handling (size, colors, margin, error correction)
 * - Data URL output
 * - Buffer output
 * - Edge cases (empty input, long URIs)
 */

import { describe, it, expect } from 'vitest';
import { generateQrCode, generateQrCodeSvg } from '../src/qr-code.js';
import type { QrCodeOptions } from '../src/qr-code.js';

// ============================================================
// Test Data
// ============================================================

const SAMPLE_WC_URI = 'wc:topic123@2?relay-protocol=irn&relay-data=abc123';
const SHORT_URI = 'wc:abc@2';
const LONG_URI = 'wc:verylongtopicid1234567890abcdef@2?relay-protocol=irn&relay-data=verylongrelaydatastring1234567890abcdef&symKey=abcdef1234567890';

// ============================================================
// generateQrCodeSvg Tests
// ============================================================

describe('generateQrCodeSvg', () => {
  it('should generate a valid SVG string', () => {
    const svg = generateQrCodeSvg(SAMPLE_WC_URI);
    expect(svg).toBeDefined();
    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('should use default size of 300', () => {
    const svg = generateQrCodeSvg(SAMPLE_WC_URI);
    expect(svg).toContain('width="300"');
    expect(svg).toContain('height="300"');
  });

  it('should respect custom size option', () => {
    const svg = generateQrCodeSvg(SAMPLE_WC_URI, { size: 500 });
    expect(svg).toContain('width="500"');
    expect(svg).toContain('height="500"');
  });

  it('should use default dark color (#000000)', () => {
    const svg = generateQrCodeSvg(SAMPLE_WC_URI);
    expect(svg).toContain('fill="#000000"');
  });

  it('should use default light color (#ffffff)', () => {
    const svg = generateQrCodeSvg(SAMPLE_WC_URI);
    expect(svg).toContain('fill="#ffffff"');
  });

  it('should respect custom colors', () => {
    const svg = generateQrCodeSvg(SAMPLE_WC_URI, {
      darkColor: '#ff0000',
      lightColor: '#00ff00',
    });
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain('fill="#00ff00"');
  });

  it('should generate different output for different URIs', () => {
    const svg1 = generateQrCodeSvg(SAMPLE_WC_URI);
    const svg2 = generateQrCodeSvg(SHORT_URI);
    expect(svg1).not.toBe(svg2);
  });

  it('should handle short URIs', () => {
    const svg = generateQrCodeSvg(SHORT_URI);
    expect(svg).toBeDefined();
    expect(svg).toContain('<svg');
  });

  it('should handle long URIs', () => {
    const svg = generateQrCodeSvg(LONG_URI);
    expect(svg).toBeDefined();
    expect(svg).toContain('<svg');
  });

  it('should include rect elements for modules', () => {
    const svg = generateQrCodeSvg(SAMPLE_WC_URI);
    expect(svg).toContain('<rect');
  });

  it('should produce deterministic output', () => {
    const svg1 = generateQrCodeSvg(SAMPLE_WC_URI);
    const svg2 = generateQrCodeSvg(SAMPLE_WC_URI);
    expect(svg1).toBe(svg2);
  });

  it('should handle all error correction levels', () => {
    for (const level of ['L', 'M', 'Q', 'H'] as const) {
      const svg = generateQrCodeSvg(SAMPLE_WC_URI, { errorCorrection: level });
      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
    }
  });

  it('should handle custom margin', () => {
    const svg = generateQrCodeSvg(SAMPLE_WC_URI, { margin: 2 });
    expect(svg).toBeDefined();
    expect(svg).toContain('<svg');
  });
});

// ============================================================
// generateQrCode Tests
// ============================================================

describe('generateQrCode', () => {
  it('should return SVG string by default', () => {
    const result = generateQrCode(SAMPLE_WC_URI);
    expect(typeof result).toBe('string');
    expect(result).toContain('<svg');
  });

  it('should return SVG string when format is svg', () => {
    const result = generateQrCode(SAMPLE_WC_URI, { format: 'svg' });
    expect(typeof result).toBe('string');
    expect(result).toContain('<svg');
  });

  it('should return data URL when format is data-url', () => {
    const result = generateQrCode(SAMPLE_WC_URI, { format: 'data-url' });
    expect(typeof result).toBe('string');
    expect(result).toContain('data:image/svg+xml;base64,');
  });

  it('should return Buffer when format is png', () => {
    const result = generateQrCode(SAMPLE_WC_URI, { format: 'png' });
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('should pass options through to SVG generator', () => {
    const result = generateQrCode(SAMPLE_WC_URI, {
      format: 'svg',
      size: 400,
      darkColor: '#333333',
    });
    expect(typeof result).toBe('string');
    expect(result).toContain('width="400"');
    expect(result).toContain('fill="#333333"');
  });
});

// ============================================================
// QrCodeOptions Interface Tests
// ============================================================

describe('QrCodeOptions', () => {
  it('should accept all option fields', () => {
    const options: QrCodeOptions = {
      size: 400,
      errorCorrection: 'H',
      margin: 2,
      darkColor: '#111111',
      lightColor: '#eeeeee',
      format: 'svg',
    };
    const svg = generateQrCodeSvg(SAMPLE_WC_URI, options);
    expect(svg).toBeDefined();
  });

  it('should work with empty options', () => {
    const svg = generateQrCodeSvg(SAMPLE_WC_URI, {});
    expect(svg).toBeDefined();
    expect(svg).toContain('<svg');
  });

  it('should work with partial options', () => {
    const svg = generateQrCodeSvg(SAMPLE_WC_URI, { size: 200 });
    expect(svg).toBeDefined();
    expect(svg).toContain('width="200"');
  });
});
