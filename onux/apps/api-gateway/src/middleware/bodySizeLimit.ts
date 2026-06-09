import { createMiddleware } from 'hono/factory';
import type { Env } from '../lib/types';
import { BadRequestError } from '../lib/errors';

/**
 * Request body size limit middleware
 * Prevents DoS attacks via oversized request bodies
 */
export const bodySizeLimit = (maxSizeBytes: number = 1024 * 1024) => {
  return createMiddleware<{
    Bindings: Env;
  }>(async (c, next) => {
    // Only check methods that typically have bodies
    if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
      const contentLength = c.req.header('content-length');
      
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        
        if (isNaN(size) || size > maxSizeBytes) {
          throw new BadRequestError(
            `Request body too large. Maximum size is ${formatBytes(maxSizeBytes)}`,
            {
              maxSize: maxSizeBytes,
              providedSize: size,
            }
          );
        }
      }
    }

    await next();
  });
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
