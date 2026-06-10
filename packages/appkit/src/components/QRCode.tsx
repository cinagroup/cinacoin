/**
 * QRCode component — generates and displays a QR code for WalletConnect URIs
 */

import React, { useEffect, useRef, useState } from 'react';
import type { QRCodeProps } from '../types';

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
  },
  canvas: {
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    padding: '12px',
  },
  logo: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    padding: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  qrWrapper: {
    position: 'relative' as const,
    display: 'inline-flex',
  },
  instructions: {
    textAlign: 'center' as const,
    fontSize: 'var(--text-body-sm)',
    color: 'var(--cc-ink, #1a1a2e)',
    opacity: 0.6,
    lineHeight: 1.5,
    maxWidth: '260px',
  },
  copyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid var(--cc-border, rgba(0,0,0,0.08))',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 'var(--text-caption)',
    color: 'var(--cc-ink, #1a1a2e)',
    opacity: 0.6,
    transition: 'opacity 0.15s ease',
  },
} as const;

// ============================================================================
// QR Code Generation (simple implementation)
// ============================================================================

/**
 * Simple QR code matrix generator
 * Uses a basic encoding approach for demonstration
 * In production, this would use the 'qrcode' npm package
 */
async function generateQRMatrix(data: string): Promise<boolean[][]> {
  // Dynamic import of qrcode library
  try {
    const QRCode = await import('qrcode');
    const matrix = await QRCode.create(data, {
      errorCorrectionLevel: 'M',
      margin: 0,
    });

    const size = matrix.modules.size;
    const result: boolean[][] = [];

    for (let row = 0; row < size; row++) {
      const rowData: boolean[] = [];
      for (let col = 0; col < size; col++) {
        rowData.push(matrix.modules.get(col, row) ?? false);
      }
      result.push(rowData);
    }

    return result;
  } catch {
    // Fallback: return empty matrix
    return [];
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * QR Code display component for WalletConnect pairing
 */
export function QRCode({
  uri,
  size = 240,
  logoUrl,
}: QRCodeProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matrix, setMatrix] = useState<boolean[][]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate QR matrix
  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        const m = await generateQRMatrix(uri);
        if (!cancelled) {
          setMatrix(m);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to generate QR code');
          console.error('QR generation error:', err);
        }
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
  }, [uri]);

  // Draw QR code on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || matrix.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const moduleCount = matrix.length;
    const moduleSize = size / moduleCount;

    canvas.width = size;
    canvas.height = size;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Draw modules
    ctx.fillStyle = '#000000';
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (matrix[row][col]) {
          const x = col * moduleSize;
          const y = row * moduleSize;
          // Rounded modules for modern look
          const radius = moduleSize * 0.2;
          ctx.beginPath();
          ctx.roundRect(x, y, moduleSize - 0.5, moduleSize - 0.5, radius);
          ctx.fill();
        }
      }
    }
  }, [matrix, size]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ color: 'var(--cc-danger, #ef4444)', fontSize: 'var(--text-body-sm)' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.qrWrapper}>
        <canvas
          ref={canvasRef}
          style={{
            ...styles.canvas,
            width: `${size}px`,
            height: `${size}px`,
          }}
        />
        {logoUrl && (
          <img
            src={logoUrl}
            alt="App logo"
            style={styles.logo}
          />
        )}
      </div>

      <p style={styles.instructions}>
        Scan this QR code with your wallet app to connect
      </p>

      <button
        style={styles.copyButton}
        onClick={handleCopy}
        type="button"
      >
        {copied ? '✓ Copied!' : '📋 Copy link'}
      </button>
    </div>
  );
}

export default QRCode;
