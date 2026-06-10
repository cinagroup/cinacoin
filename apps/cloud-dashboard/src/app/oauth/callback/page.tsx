"use client";

import { logger } from '@cinacoin/logger';
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { exchangeOAuthCode } from "@/lib/api";

/** Zod schema for OAuth callback query parameters */
const OAuthCallbackParamsSchema = z.object({
  code: z.string().min(1).optional(),
  error: z.string().optional(),
});

/**
 * OAuth Callback Page
 * 
 * Security: This page receives an authorization code (not tokens) from the backend.
 * It exchanges the code for tokens via POST request, keeping tokens out of the URL.
 */
function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Validate search params with Zod
        const rawParams = {
          code: searchParams.get("code") ?? undefined,
          error: searchParams.get("error") ?? undefined,
        };
        const parsed = OAuthCallbackParamsSchema.safeParse(rawParams);

        if (!parsed.success) {
          setError("Invalid callback parameters");
          setIsProcessing(false);
          return;
        }

        const { code, error: oauthError } = parsed.data;

        // Handle OAuth error response
        if (oauthError) {
          setError(`Authentication failed: ${oauthError}`);
          setIsProcessing(false);
          return;
        }

        // Validate we have a code
        if (!code) {
          setError("Missing authorization code");
          setIsProcessing(false);
          return;
        }

        // Exchange the authorization code for tokens using the shared API function
        await exchangeOAuthCode(code);

        // Redirect to dashboard or return URL
        const returnUrl = sessionStorage.getItem("oauth_return_url") || "/";
        sessionStorage.removeItem("oauth_return_url");
        
        router.push(returnUrl);
      } catch (err) {
        logger.error("OAuth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-soft px-4">
        <div className="w-full max-w-md">
          <div className="bg-canvas rounded-md shadow-level-2 p-8">
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-error"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-heading-3 text-ink mb-2">Authentication Error</h2>
              <p className="text-body-sm text-body mb-6">{error}</p>
              <button
                onClick={() => router.push("/login")}
                className="cc-btn-primary w-full py-3"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-soft px-4">
      <div className="w-full max-w-md">
        <div className="bg-canvas rounded-md shadow-level-2 p-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
            <h2 className="text-heading-3 text-ink mb-2">
              {isProcessing ? "Completing sign-in..." : "Redirecting..."}
            </h2>
            <p className="text-body-sm text-body">
              Please wait while we securely complete your authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-canvas-soft">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
