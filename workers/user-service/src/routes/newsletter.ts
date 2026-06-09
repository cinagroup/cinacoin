/**
 * Newsletter Subscription Routes
 * 
 * POST   /newsletter/subscribe     — Subscribe to newsletter
 * GET    /newsletter/verify/:token — Verify subscription
 * POST   /newsletter/unsubscribe   — Unsubscribe from newsletter
 * GET    /newsletter/subscribers   — List subscribers (admin)
 */

import { Hono } from 'hono';
import type { Env } from '../db/schema';

const newsletter = new Hono<{ Bindings: Env }>();

// Subscribe to newsletter
newsletter.post('/subscribe', async (c) => {
  try {
    const body = await c.req.json();
    const { email, name, source } = body;

    if (!email || !email.includes('@')) {
      return c.json({ error: 'Invalid email address' }, 400);
    }

    // Check if already subscribed
    const existing = await c.env.DB.prepare(
      'SELECT * FROM newsletter_subscribers WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return c.json({ 
        success: true, 
        message: 'Already subscribed',
        alreadySubscribed: true 
      });
    }

    // Generate verification token
    const verifyToken = crypto.randomUUID();

    // Insert subscription record
    await c.env.DB.prepare(`
      INSERT INTO newsletter_subscribers (email, name, source, verify_token, verified_at, created_at)
      VALUES (?, ?, ?, ?, NULL, strftime('%s', 'now'))
    `).bind(email, name || null, source || 'website', verifyToken).run();

    // Send verification email
    await sendVerificationEmail(c, email, verifyToken);

    return c.json({ 
      success: true, 
      message: 'Please check your email to verify your subscription' 
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return c.json({ error: 'Failed to subscribe' }, 500);
  }
});

// Verify subscription
newsletter.get('/verify/:token', async (c) => {
  try {
    const token = c.req.param('token');

    const result = await c.env.DB.prepare(
      'UPDATE newsletter_subscribers SET verified_at = strftime(\'%s\', \'now\') WHERE verify_token = ? AND verified_at IS NULL'
    ).bind(token).run();

    if (result.success && result.meta.changes > 0) {
      return c.json({ success: true, message: 'Subscription verified' });
    }

    return c.json({ error: 'Invalid or expired token' }, 400);
  } catch (error) {
    console.error('Newsletter verify error:', error);
    return c.json({ error: 'Verification failed' }, 500);
  }
});

// Unsubscribe
newsletter.post('/unsubscribe', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    await c.env.DB.prepare(
      'UPDATE newsletter_subscribers SET unsubscribed_at = strftime(\'%s\', \'now\') WHERE email = ?'
    ).bind(email).run();

    return c.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return c.json({ error: 'Failed to unsubscribe' }, 500);
  }
});

// List subscribers (admin endpoint)
newsletter.get('/subscribers', async (c) => {
  try {
    const { page = '1', limit = '50', verified } = c.req.query();
    const offset = (Number(page) - 1) * Number(limit);

    let query = 'SELECT * FROM newsletter_subscribers WHERE unsubscribed_at IS NULL';
    const params: any[] = [];

    if (verified === 'true') {
      query += ' AND verified_at IS NOT NULL';
    } else if (verified === 'false') {
      query += ' AND verified_at IS NULL';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ 
      subscribers: result.results,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Newsletter subscribers error:', error);
    return c.json({ error: 'Failed to fetch subscribers' }, 500);
  }
});

// Send verification email using Resend
async function sendVerificationEmail(c: any, email: string, token: string) {
  const verifyUrl = `https://cinacoin.com/newsletter/verify/${token}`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CINAcoin <noreply@cinacoin.com>',
        to: email,
        subject: 'Verify your newsletter subscription',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #171717; margin-bottom: 16px;">Welcome to CINAcoin Newsletter!</h2>
            <p style="color: #4d4d4d; line-height: 1.6; margin-bottom: 24px;">
              Thank you for subscribing to our newsletter. Please click the button below to verify your subscription:
            </p>
            <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #171717; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Verify Subscription
            </a>
            <p style="color: #888888; font-size: 14px; margin-top: 24px;">
              If you didn't request this, you can safely ignore this email.
            </p>
            <p style="color: #888888; font-size: 12px; margin-top: 16px;">
              Or copy and paste this URL into your browser:<br>
              <span style="word-break: break-all;">${verifyUrl}</span>
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send verification email:', await response.text());
    }
  } catch (error) {
    console.error('Email send error:', error);
    // Don't throw - subscription was saved, email failure shouldn't block
  }
}

export default newsletter;
