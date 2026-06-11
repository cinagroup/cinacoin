/**
 * Farcaster Frame v2 protocol utilities.
 *
 * Helpers for generating Frame-compliant HTML meta tags.
 * @see https://docs.farcaster.xyz/reference/frames/spec
 */

export interface FrameButton {
  /** Button label (max 25 chars). */
  label: string;
  /** Button action: post, post_redirect, link, tx, mint. */
  action?: 'post' | 'post_redirect' | 'link' | 'tx' | 'mint';
  /** Target URL for link/mint actions. */
  target?: string;
}

export interface FrameMeta {
  /** Frame version (usually "vNext"). */
  version?: string;
  /** Frame image URL (og:image and fc:frame:image). */
  image: string;
  /** Image aspect ratio (1.91:1 or 1:1). */
  imageAspectRatio?: '1.91:1' | '1:1';
  /** Frame buttons (1-4). */
  buttons?: FrameButton[];
  /** Text input placeholder. */
  input?: string;
  /** Post URL (where button clicks are sent). */
  postUrl?: string;
  /** Frame title. */
  title?: string;
}

/**
 * Generate Farcaster Frame v2 meta tags as HTML string.
 */
export function generateFrameMeta(meta: FrameMeta): Record<string, string> {
  const tags: Record<string, string> = {
    'fc:frame': JSON.stringify({
      version: meta.version ?? 'vNext',
      image: meta.image,
      imageAspectRatio: meta.imageAspectRatio ?? '1.91:1',
      title: meta.title ?? 'CinaCoin',
      buttons: (meta.buttons ?? []).map((btn, i) => ({
        action: btn.action ?? 'post',
        label: btn.label,
        target: btn.target,
      })),
      input: meta.input,
      postUrl: meta.postUrl,
    }),
    'og:image': meta.image,
    'og:title': meta.title ?? 'CinaCoin Farcaster App',
    'og:description': 'CinaCoin Farcaster Mini App — wallet, transfer, sign & more',
  };

  return tags;
}

/**
 * Generate Open Graph and Frame meta tags for Next.js Metadata API.
 */
export function buildFrameMetadata(meta: FrameMeta) {
  const other: Record<string, string> = {};

  // Frame v2 uses a single JSON-encoded fc:frame meta tag
  const framePayload = {
    version: meta.version ?? 'vNext',
    image: meta.image,
    imageAspectRatio: meta.imageAspectRatio ?? '1.91:1',
    title: meta.title ?? 'CinaCoin',
    buttons: (meta.buttons ?? []).map((btn) => ({
      action: btn.action ?? 'post',
      label: btn.label,
      ...(btn.target ? { target: btn.target } : {}),
    })),
    ...(meta.input ? { input: meta.input } : {}),
    ...(meta.postUrl ? { postUrl: meta.postUrl } : {}),
  };

  other['fc:frame'] = JSON.stringify(framePayload);

  // Also include legacy v1 tags for backwards compatibility
  if (meta.buttons) {
    meta.buttons.forEach((btn, i) => {
      const idx = i + 1;
      other[`fc:frame:button:${idx}`] = btn.label;
      if (btn.action) {
        other[`fc:frame:button:${idx}:action`] = btn.action;
      }
      if (btn.target) {
        other[`fc:frame:button:${idx}:target`] = btn.target;
      }
    });
  }

  other['fc:frame:image'] = meta.image;
  if (meta.imageAspectRatio) {
    other['fc:frame:image:aspect_ratio'] = meta.imageAspectRatio;
  }
  if (meta.input) {
    other['fc:frame:input:text'] = meta.input;
  }
  if (meta.postUrl) {
    other['fc:frame:post_url'] = meta.postUrl;
  }

  return other;
}

/**
 * Parse a Farcaster Frame POST request body.
 */
export interface FrameActionBody {
  /** Button index that was clicked (1-based). */
  buttonIndex: number;
  /** Input text if frame has text input. */
  inputText?: string;
  /** Farcaster user fid. */
  fid?: number;
  /** Cast hash context. */
  castId?: {
    fid: number;
    hash: string;
  };
  /** Raw trusted data. */
  trustedData?: Record<string, unknown>;
}

/**
 * Decode frame action from request.
 * In production, validate the message_signature using Farcaster hubs.
 */
export function parseFrameAction(body: unknown): FrameActionBody {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid frame action body');
  }

  const data = body as Record<string, unknown>;

  // Frame v2 sends JSON directly
  if (typeof data.buttonIndex === 'number') {
    return {
      buttonIndex: data.buttonIndex as number,
      inputText: data.inputText as string | undefined,
      fid: data.fid as number | undefined,
      castId: data.castId as FrameActionBody['castId'],
      trustedData: data.trustedData as Record<string, unknown>,
    };
  }

  // Frame v1 sends base64-encoded trustedData
  if (typeof data.trustedData === 'object' && data.trustedData !== null) {
    const trusted = data.trustedData as Record<string, unknown>;
    const messageBytes = trusted.messageBytes as string;
    if (messageBytes) {
      // In production, decode and validate via Farcaster hub
      // For now, return a placeholder
      return {
        buttonIndex: 1,
        trustedData: trusted,
      };
    }
  }

  throw new Error('Unable to parse frame action');
}

/**
 * Base URL for the Farcaster app.
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://cinacoin-farcaster-app.pages.dev';
}

/**
 * Generate an OG image URL.
 * Uses a placeholder service; in production, generate images with /api/og route.
 */
export function getFrameImage(text: string, subtitle?: string): string {
  const encoded = encodeURIComponent(text);
  const sub = subtitle ? `&subtitle=${encodeURIComponent(subtitle)}` : '';
  return `${getAppUrl()}/api/og?text=${encoded}${sub}`;
}
