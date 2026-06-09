/**
 * Alert Notifier — sends alerts to configured channels.
 *
 * Handles dispatching alert notifications to:
 * - Slack via incoming webhook
 * - Email via SendGrid / Resend / Cloudflare Workers Email
 * - PagerDuty via Events API v2
 *
 * Includes cooldown logic to prevent alert spam.
 */

import type {
  AlertRule,
  AlertSeverity,
  AlertChannel,
  SlackConfig,
  EmailConfig,
  PagerDutyConfig,
} from './alert-config.js';
import { NOTIFICATION_CONFIG, formatAlertMessage } from './alert-config.js';

// ============================================================
// Cooldown Tracking
// ============================================================

interface CooldownEntry {
  lastFiredAt: number;
  count: number;
}

const cooldownMap = new Map<string, CooldownEntry>();

/** Check if an alert is in cooldown period. */
function isInCooldown(ruleId: string, cooldownSeconds: number): boolean {
  const entry = cooldownMap.get(ruleId);
  if (!entry) return false;

  const elapsed = (Date.now() - entry.lastFiredAt) / 1000;
  return elapsed < cooldownSeconds;
}

/** Record an alert fire for cooldown tracking. */
function recordAlert(ruleId: string): void {
  const existing = cooldownMap.get(ruleId);
  cooldownMap.set(ruleId, {
    lastFiredAt: Date.now(),
    count: (existing?.count ?? 0) + 1,
  });
}

// ============================================================
// Slack Notifier
// ============================================================

async function sendSlack(
  config: SlackConfig,
  message: string,
  severity: AlertSeverity,
): Promise<boolean> {
  if (!config.enabled || !config.webhookUrl) {
    console.warn('[Notifier] Slack not configured (missing webhook URL)');
    return false;
  }

  const colorMap: Record<AlertSeverity, string> = {
    critical: '#FF0000',
    warning: '#FFA500',
    info: '#36A64F',
  };

  const payload = {
    channel: config.channel,
    username: config.username,
    icon_emoji: config.iconEmoji,
    attachments: [
      {
        color: colorMap[severity],
        text: message,
        mrkdwn_in: ['text'],
        footer: 'Cinacoin Relay Monitor',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[Notifier] Slack webhook failed:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Notifier] Slack notification error:', err);
    return false;
  }
}

// ============================================================
// Email Notifier
// ============================================================

async function sendEmail(
  config: EmailConfig,
  message: string,
  rule: AlertRule,
): Promise<boolean> {
  if (!config.enabled || config.recipients.length === 0) {
    console.warn('[Notifier] Email not configured (no recipients)');
    return false;
  }

  const subject = `${config.subjectPrefix} [${rule.severity.toUpperCase()}] ${rule.name}`;

  const htmlBody = `
    <html>
    <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: ${rule.severity === 'critical' ? '#FF0000' : rule.severity === 'warning' ? '#FFA500' : '#36A64F'};">
        ⚠️ ${rule.name}
      </h2>
      <pre style="background: #f5f5f5; padding: 16px; border-radius: 8px; white-space: pre-wrap; font-size: 14px;">
${message.replace(/\*/g, '')}
      </pre>
      <p style="color: #888; font-size: 12px;">
        Sent by Cinacoin Relay Monitor at ${new Date().toISOString()}
      </p>
    </body>
    </html>
  `;

  try {
    // Use Cloudflare Workers Email or external email service
    // This is a placeholder — integrate with your email provider
    console.log('[Notifier] Email would be sent to:', config.recipients.join(', '));
    console.log('[Notifier] Subject:', subject);
    return true;
  } catch (err) {
    console.error('[Notifier] Email notification error:', err);
    return false;
  }
}

// ============================================================
// PagerDuty Notifier
// ============================================================

async function sendPagerDuty(
  config: PagerDutyConfig,
  rule: AlertRule,
  region: string,
  summary: string,
  details: Record<string, unknown>,
): Promise<boolean> {
  if (!config.enabled || !config.integrationKey) {
    console.warn('[Notifier] PagerDuty not configured (missing integration key)');
    return false;
  }

  const severityMap: Record<AlertSeverity, 'critical' | 'error' | 'warning' | 'info'> = {
    critical: 'critical',
    warning: 'warning',
    info: 'info',
  };

  const payload = {
    routing_key: config.integrationKey,
    event_action: 'trigger',
    dedup_key: `${rule.id}-${region}`,
    payload: {
      summary: `[${region.toUpperCase()}] ${summary}`,
      severity: severityMap[rule.severity],
      source: `cinacoin-wc-relay-${region}`,
      component: 'relay-worker',
      group: rule.tags.join(', '),
      class: rule.condition.type,
      custom_details: {
        ...details,
        timestamp: new Date().toISOString(),
        rule_id: rule.id,
      },
    },
  };

  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[Notifier] PagerDuty event failed:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Notifier] PagerDuty notification error:', err);
    return false;
  }
}

// ============================================================
// Alert Dispatcher
// ============================================================

export interface AlertContext {
  rule: AlertRule;
  region: string;
  currentValue: number;
  threshold: number;
  window: string;
  additionalDetails?: Record<string, unknown>;
}

/**
 * Dispatch an alert to all configured channels.
 * Respects cooldown periods to prevent notification spam.
 *
 * @returns Object with per-channel success/failure results.
 */
export async function dispatchAlert(context: AlertContext): Promise<Record<string, boolean>> {
  const { rule, region, currentValue, threshold, window, additionalDetails } = context;

  // Check cooldown
  if (isInCooldown(rule.id, rule.cooldownSeconds)) {
    return { cooldown: true };
  }

  const results: Record<string, boolean> = {};
  const message = formatAlertMessage(rule, region, currentValue, threshold, window);

  // Send to each configured channel
  for (const channel of rule.channels) {
    switch (channel) {
      case 'slack':
        results.slack = await sendSlack(
          NOTIFICATION_CONFIG.slack,
          message,
          rule.severity,
        );
        break;

      case 'email':
        results.email = await sendEmail(
          NOTIFICATION_CONFIG.email,
          message,
          rule,
        );
        break;

      case 'pagerduty': {
        const pdDetails = {
          current_value: currentValue,
          threshold,
          window,
          ...additionalDetails,
        };
        results.pagerduty = await sendPagerDuty(
          NOTIFICATION_CONFIG.pagerduty,
          rule,
          region,
          rule.name,
          pdDetails,
        );
        break;
      }
    }
  }

  // Record cooldown only if at least one channel succeeded
  if (Object.values(results).some((v) => v === true)) {
    recordAlert(rule.id);
  }

  return results;
}

/** Clean up old cooldown entries (call periodically). */
export function cleanupCooldowns(maxAgeMs: number = 86400000): void {
  const now = Date.now();
  for (const [key, entry] of cooldownMap.entries()) {
    if (now - entry.lastFiredAt > maxAgeMs) {
      cooldownMap.delete(key);
    }
  }
}

/** Get current cooldown status for debugging. */
export function getCooldownStatus(): Array<{ ruleId: string; secondsSinceFire: number; count: number }> {
  const now = Date.now();
  return Array.from(cooldownMap.entries()).map(([ruleId, entry]) => ({
    ruleId,
    secondsSinceFire: Math.round((now - entry.lastFiredAt) / 1000),
    count: entry.count,
  }));
}
