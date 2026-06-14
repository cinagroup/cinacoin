/**
 * Cloudflare Email Sender Worker for Cinacoin
 * 
 * 使用 MailChannels 集成发送邮件
 * 免费额度：每天 100 封邮件
 */

export interface Env {
  DB: D1Database;
}

export interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const { to, subject, html, text } = await request.json() as EmailRequest;

      if (!to || !subject || !html) {
        return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, html' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 使用 MailChannels API 发送邮件
      const response = await sendEmailViaMailChannels(to, subject, html, text);

      // 记录邮件发送日志
      await env.DB.prepare(`
        INSERT INTO email_logs (id, from_email, to_email, subject, type, sent_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        'noreply@cinacoin.com',
        to,
        subject,
        'outbound',
        Date.now(),
        response.success ? 'sent' : 'failed'
      ).run();

      return new Response(JSON.stringify(response), {
        status: response.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Email send error:', error);
      return new Response(JSON.stringify({ error: 'Failed to send email', details: String(error) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

/**
 * 通过 MailChannels 发送邮件
 */
async function sendEmailViaMailChannels(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to, name: to.split('@')[0] }],
          },
        ],
        from: {
          email: 'noreply@cinacoin.com',
          name: 'Cinacoin',
        },
        subject: subject,
        content: [
          {
            type: 'text/html',
            value: html,
          },
          ...(text
            ? [
                {
                  type: 'text/plain',
                  value: text,
                },
              ]
            : []),
        ],
      }),
    });

    if (response.status === 202) {
      return { success: true, message: 'Email sent successfully' };
    } else {
      const errorText = await response.text();
      console.error('MailChannels error:', errorText);
      return { success: false, error: `MailChannels error: ${response.status} - ${errorText}` };
    }
  } catch (error) {
    console.error('MailChannels request failed:', error);
    return { success: false, error: String(error) };
  }
}
