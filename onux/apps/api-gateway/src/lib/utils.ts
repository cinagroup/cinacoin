/**
 * Utility functions for the API Gateway
 */

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

/**
 * Hash a string using SHA-256
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure random API key
 */
export function generateApiKey(prefix = 'ck_'): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return prefix + Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(request: Request): string {
  const headers = [
    'cf-connecting-ip',
    'x-forwarded-for',
    'x-real-ip',
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first
      return value.split(',')[0].trim();
    }
  }

  return 'unknown';
}

/**
 * Parse pagination parameters from query string
 */
export function parsePagination(url: URL): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    requestId?: string;
    pagination?: { page: number; limit: number; total: number };
  }
): { data: T; meta: Record<string, unknown> } {
  const meta: Record<string, unknown> = {
    request_id: options?.requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
  };

  if (options?.pagination) {
    const { page, limit, total } = options.pagination;
    meta.pagination = {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    };
  }

  return { data, meta };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  options?: {
    requestId?: string;
    details?: Record<string, unknown>;
  }
): { error: Record<string, unknown>; request_id: string; timestamp: string } {
  return {
    error: {
      code,
      message,
      details: options?.details,
    },
    request_id: options?.requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelay?: number; maxDelay?: number } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelay = 100, maxDelay = 5000 } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) break;
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      const jitter = delay * 0.1 * Math.random();
      await sleep(delay + jitter);
    }
  }
  
  throw lastError;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}
