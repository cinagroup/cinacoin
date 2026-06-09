import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

// ---------------------------------------------------------------------------
// CSRF Token helpers
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically-secure CSRF token.
 * Uses `crypto.randomUUID()` under the hood.
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID();
}

/**
 * Store a freshly generated CSRF token in a secure httpOnly cookie.
 * Also makes it available on `res.locals` for templating / initial-render.
 */
export function setCsrfCookie(req: Request, res: Response): void {
  const token = generateCsrfToken();
  res.cookie("csrf_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, // 1 hour
    path: "/",
  });
  // Expose to view layer (e.g. injected into HTML meta tag for SPA forms)
  res.locals.csrfToken = token;
}

// ---------------------------------------------------------------------------
// CSRF Verification
// ---------------------------------------------------------------------------

/**
 * Verify that the CSRF token submitted in the request body / header matches
 * the one stored in the httpOnly cookie.
 *
 * Throws an Error (which downstream error-handling middleware should catch)
 * when validation fails.
 */
export function verifyCsrfToken(req: Request): boolean {
  const cookieToken = req.cookies?.csrf_token;
  if (!cookieToken || typeof cookieToken !== "string") {
    throw new Error("CSRF token missing from cookie");
  }

  // Accept token from header (preferred for SPA / AJAX) or body field.
  const headerToken =
    (req.headers["x-csrf-token"] as string | undefined) ??
    (req.headers["x-xsrf-token"] as string | undefined);
  const bodyToken =
    typeof req.body === "object" && req.body !== null
      ? (req.body.csrf_token as string | undefined)
      : undefined;

  const submittedToken = headerToken || bodyToken;

  if (!submittedToken || typeof submittedToken !== "string") {
    throw new Error("CSRF token missing from request");
  }

  // Constant-time comparison to prevent timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(submittedToken, "utf8"),
    Buffer.from(cookieToken, "utf8")
  );

  if (!isValid) {
    throw new Error("CSRF token mismatch");
  }

  return true;
}

// ---------------------------------------------------------------------------
// Express middleware
// ---------------------------------------------------------------------------

/**
 * Middleware: attach a fresh CSRF cookie to every response.
 * Mount near the top of the middleware chain so it runs before any route.
 *
 * Usage:
 *   app.use(attachCsrfCookie);
 */
export function attachCsrfCookie(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  setCsrfCookie(req, res);
  next();
}

/**
 * Middleware: enforce CSRF token validation on all state-changing requests.
 * Mount after body-parser / cookie-parser so `req.cookies` and `req.body`
 * are populated.
 *
 * Usage:
 *   app.use("/api", csrfProtection);
 */
export function csrfProtection(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Only enforce on methods that mutate state.
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method.toUpperCase())) {
    try {
      verifyCsrfToken(req);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "CSRF validation failed";
      return next(
        Object.assign(new Error(message), { status: 403, code: "CSRF_INVALID" })
      );
    }
  }
  next();
}
