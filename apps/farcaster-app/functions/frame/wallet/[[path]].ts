/**
 * Cloudflare Pages Function - Wallet Frame POST handler.
 */
export async function onRequestPost(context: EventContext) {
  const { request, env } = context;
  const appUrl = (env as Record<string, string>).NEXT_PUBLIC_APP_URL ?? 'https://cinacoin-farcaster-app.pages.dev';

  try {
    const body = await request.json() as Record<string, unknown>;
    const buttonIndex = typeof body.buttonIndex === 'number' ? body.buttonIndex : 1;

    switch (buttonIndex) {
      case 1:
        return frameResponse({
          image: `${appUrl}/og-wallet.png`,
          title: 'Wallet Balance — 0 CINA',
          buttons: [
            { label: '💸 Transfer', action: 'post' },
            { label: '✍️ Sign', action: 'post' },
            { label: '🔄 Refresh', action: 'post' },
            { label: '🏠 Home', action: 'post' },
          ],
          postUrl: `${appUrl}/frame/wallet/`,
        });
      case 2:
        return frameResponse({
          image: `${appUrl}/og-transfer.png`,
          title: 'Transfer Cinacoin',
          input: 'Recipient address (0x...)',
          buttons: [
            { label: '💸 Send', action: 'post' },
            { label: '📋 Recent', action: 'post' },
            { label: '🔙 Back', action: 'post' },
          ],
          postUrl: `${appUrl}/frame/transfer/`,
        }, `${appUrl}/frame/transfer/`);
      case 3:
        return frameResponse({
          image: `${appUrl}/og-sign.png`,
          title: 'Sign Message',
          input: 'Enter message to sign...',
          buttons: [
            { label: '✍️ Sign', action: 'post' },
            { label: '📝 Template', action: 'post' },
            { label: '🔙 Back', action: 'post' },
          ],
          postUrl: `${appUrl}/frame/sign/`,
        }, `${appUrl}/frame/sign/`);
      case 4:
        return frameResponse({
          image: `${appUrl}/og-default.png`,
          title: 'Cinacoin',
          buttons: [
            { label: '🔗 Connect Wallet', action: 'post' },
            { label: '👤 Profile', action: 'post' },
          ],
          postUrl: `${appUrl}/frame/`,
        }, `${appUrl}/`);
      default:
        return frameResponse({
          image: `${appUrl}/og-wallet.png`,
          title: 'Cinacoin Wallet',
          buttons: [
            { label: '💰 View Balance', action: 'post' },
            { label: '🏠 Home', action: 'post' },
          ],
          postUrl: `${appUrl}/frame/wallet/`,
        });
    }
  } catch {
    return frameResponse({
      image: `${appUrl}/og-wallet.png`,
      title: 'Error — Please try again',
      buttons: [{ label: '🔄 Retry', action: 'post' }],
      postUrl: `${appUrl}/frame/wallet/`,
    });
  }
}

export async function onRequestGet(context: EventContext) {
  return context.env.ASSETS.fetch(context.request);
}

interface EventContext {
  request: Request;
  env: Record<string, unknown>;
}

function frameResponse(
  meta: { image: string; title: string; buttons: { label: string; action: string }[]; postUrl: string; input?: string },
  refreshUrl?: string,
) {
  const framePayload = {
    version: 'vNext',
    image: meta.image,
    imageAspectRatio: '1.91:1',
    title: meta.title,
    buttons: meta.buttons.map((b) => ({ action: b.action, label: b.label })),
    ...(meta.input ? { input: meta.input } : {}),
    postUrl: meta.postUrl,
  };

  const tags: string[] = [
    `<meta name="fc:frame" content='${JSON.stringify(framePayload)}' />`,
    `<meta name="og:image" content="${esc(meta.image)}" />`,
    `<meta name="og:title" content="${esc(meta.title)}" />`,
  ];

  meta.buttons.forEach((btn, i) => {
    const idx = i + 1;
    tags.push(`<meta name="fc:frame:button:${idx}" content="${esc(btn.label)}" />`);
    tags.push(`<meta name="fc:frame:button:${idx}:action" content="${btn.action}" />`);
  });
  tags.push(`<meta name="fc:frame:image" content="${esc(meta.image)}" />`);
  tags.push(`<meta name="fc:frame:post_url" content="${esc(meta.postUrl)}" />`);
  if (meta.input) {
    tags.push(`<meta name="fc:frame:input:text" content="${esc(meta.input)}" />`);
  }

  const refresh = refreshUrl ? `\n<meta http-equiv="refresh" content="0;url=${refreshUrl}" />` : '';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>${esc(meta.title)}</title>
${tags.join('\n')}${refresh}
</head><body></body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
