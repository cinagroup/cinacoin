/**
 * File Upload Validation — Security utilities for KYC document uploads
 *
 * Validates file type, size, and magic bytes to prevent malicious uploads.
 */

// ============================================================
// Constants
// ============================================================

/** Allowed MIME types for KYC document uploads */
export const ALLOWED_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

/** Maximum file size: 10MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Magic bytes for file type validation */
const MAGIC_BYTES = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF header, then WEBP at offset 8
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
} as const;

// ============================================================
// Types
// ============================================================

export type AllowedMime = typeof ALLOWED_MIMES[number];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  size?: number;
}

export interface FileInput {
  /** File data as ArrayBuffer, Uint8Array, or base64 string */
  data: ArrayBuffer | Uint8Array | string;
  /** Declared MIME type (from client) */
  declaredType?: string;
  /** File name (optional, for logging) */
  fileName?: string;
}

// ============================================================
// Validation Functions
// ============================================================

/**
 * Validate a file upload for security.
 * Checks: MIME type, file size, and magic bytes.
 */
export function validateFile(file: FileInput): FileValidationResult {
  try {
    // Convert to Uint8Array for inspection
    let bytes: Uint8Array;
    
    if (typeof file.data === 'string') {
      // Base64 string
      const binaryStr = atob(file.data);
      bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
    } else if (file.data instanceof ArrayBuffer) {
      bytes = new Uint8Array(file.data);
    } else {
      bytes = file.data;
    }

    const size = bytes.length;

    // 1. Check file size
    if (size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large: ${size} bytes (max ${MAX_FILE_SIZE})`,
        size,
      };
    }

    if (size < 100) {
      return {
        valid: false,
        error: `File too small: ${size} bytes (likely corrupted)`,
        size,
      };
    }

    // 2. Detect actual MIME type from magic bytes
    const detectedMime = detectMimeType(bytes);
    
    if (!detectedMime) {
      return {
        valid: false,
        error: 'Unable to detect file type from magic bytes',
        size,
      };
    }

    // 3. Validate against allowed MIME types
    if (!ALLOWED_MIMES.includes(detectedMime as AllowedMime)) {
      return {
        valid: false,
        error: `Invalid file type: ${detectedMime} (allowed: ${ALLOWED_MIMES.join(', ')})`,
        mimeType: detectedMime,
        size,
      };
    }

    // 4. Check if declared type matches detected type
    if (file.declaredType && file.declaredType !== detectedMime) {
      // Allow jpeg/jpg interchange
      const isJpegVariant = 
        (file.declaredType === 'image/jpeg' && detectedMime === 'image/jpg') ||
        (file.declaredType === 'image/jpg' && detectedMime === 'image/jpeg');
      
      if (!isJpegVariant) {
        return {
          valid: false,
          error: `Declared type (${file.declaredType}) does not match detected type (${detectedMime})`,
          mimeType: detectedMime,
          size,
        };
      }
    }

    return {
      valid: true,
      mimeType: detectedMime,
      size,
    };
  } catch (err) {
    return {
      valid: false,
      error: `Validation error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Detect MIME type from file magic bytes.
 */
function detectMimeType(bytes: Uint8Array): string | null {
  if (bytes.length < 4) return null;

  // JPEG
  if (matchesMagicBytes(bytes, MAGIC_BYTES.jpeg, 0)) {
    return 'image/jpeg';
  }

  // PNG
  if (matchesMagicBytes(bytes, MAGIC_BYTES.png, 0)) {
    return 'image/png';
  }

  // PDF
  if (matchesMagicBytes(bytes, MAGIC_BYTES.pdf, 0)) {
    return 'application/pdf';
  }

  // WebP: RIFF....WEBP
  if (matchesMagicBytes(bytes, MAGIC_BYTES.webp, 0) && bytes.length >= 12) {
    const webpMarker = [0x57, 0x45, 0x42, 0x50]; // WEBP
    if (matchesMagicBytes(bytes, webpMarker, 8)) {
      return 'image/webp';
    }
  }

  return null;
}

/**
 * Check if bytes match a magic byte sequence at a given offset.
 */
function matchesMagicBytes(
  bytes: Uint8Array,
  magic: readonly number[],
  offset: number
): boolean {
  if (bytes.length < offset + magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (bytes[offset + i] !== magic[i]) return false;
  }
  return true;
}

/**
 * Validate a base64-encoded document (convenience wrapper).
 */
export function validateBase64Document(
  base64: string,
  declaredType?: string,
  fileName?: string
): FileValidationResult {
  return validateFile({
    data: base64,
    declaredType,
    fileName,
  });
}

/**
 * Validate a document URL (checks if it's a data URL with valid base64).
 * For external URLs, only validates the URL format.
 */
export function validateDocumentUrl(url: string): FileValidationResult {
  // Data URL with base64
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return {
        valid: false,
        error: 'Invalid data URL format',
      };
    }

    const [, mimeType, base64Data] = match;
    return validateFile({
      data: base64Data,
      declaredType: mimeType,
    });
  }

  // External URL — basic validation
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: `Invalid URL protocol: ${parsed.protocol}`,
      };
    }

    // Check file extension as a hint (not security-critical)
    const ext = parsed.pathname.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
    if (ext && !allowedExts.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported file extension: ${ext}`,
      };
    }

    return {
      valid: true,
      mimeType: getMimeFromExtension(ext || ''),
    };
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Get MIME type from file extension.
 */
function getMimeFromExtension(ext: string): string {
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    pdf: 'application/pdf',
  };
  return mimeMap[ext] || 'application/octet-stream';
}
