import { logger } from '@cinacoin/logger';
import { NextResponse } from 'next/server'
import { z } from 'zod'

// ─── Zod Validation Schema ──────────────────────────────────────────────────

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  subject: z.string().max(200).optional(),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
})

// ─── Rate Limiting ──────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number
  resetTime: number
}

/**
 * In-memory rate limiter per IP address.
 * Limits: 5 requests per 15 minutes per IP.
 *
 * SECURITY: Prevents spam and abuse of the contact form endpoint.
 * Note: In-memory storage resets on server restart. For production,
 * consider using Redis or a persistent store.
 */
const rateLimitStore = new Map<string, RateLimitEntry>()

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5

/**
 * Check if an IP is rate limited.
 * Returns { allowed: boolean, retryAfter?: number }
 */
function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  // No entry or window expired — allow and create new entry
  if (!entry || now >= entry.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    })
    return { allowed: true }
  }

  // Window active — check count
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  // Increment count
  entry.count++
  return { allowed: true }
}

/**
 * Periodically clean up expired entries to prevent memory leaks.
 * Runs every 30 minutes.
 */
function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
}

// Run cleanup every 30 minutes
if (typeof global !== 'undefined') {
  setInterval(cleanupExpiredEntries, 30 * 60 * 1000).unref?.()
}

/**
 * Extract client IP from request.
 * Handles common proxy headers (X-Forwarded-For, X-Real-IP).
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Take first IP in chain
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback (may not be available in all environments)
  return 'unknown'
}

// ─── Contact Form Handler ───────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(clientIP)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
          },
        }
      )
    }

    const body = await request.json()
    const result = contactSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, subject, message } = result.data

    // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
    // For now, log the submission
    console.log('[Contact Form Submission]', {
      name,
      email,
      subject: subject || 'other',
      message,
      clientIP,
      timestamp: new Date().toISOString(),
    })

    // Simulate successful submission
    return NextResponse.json({
      success: true,
      message: 'Form submitted successfully',
    })
  } catch (error) {
    logger.error('[Contact Form Error]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
