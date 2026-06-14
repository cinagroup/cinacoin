/**
 * Cloudflare Email Worker for CinaCoin
 * 
 * 处理发送到 cinacoin.com 的邮件：
 * - noreply@cinacoin.com - 系统通知（不接收回复）
 * - verify@cinacoin.com - 邮件验证回复
 * - support@cinacoin.com - 支持邮件
 */

export interface Env {
  DB: D1Database;
}

export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    const to = message.to;
    const from = message.from;
    const subject = message.headers.get('subject') || 'No Subject';
    
    console.log(`Received email: from=${from}, to=${to}, subject=${subject}`);
    
    try {
      // 根据收件地址处理不同的邮件类型
      if (to === 'noreply@cinacoin.com') {
        // noreply 地址不应该接收邮件，记录并忽略
        console.log(`Warning: Received email to noreply address from ${from}`);
        // 可以选择拒绝或忽略
        return;
      }
      
      if (to === 'verify@cinacoin.com') {
        // 处理邮件验证回复
        await handleVerificationReply(message, env, from, subject);
        return;
      }
      
      if (to === 'support@cinacoin.com') {
        // 处理支持邮件
        await handleSupportEmail(message, env, from, subject);
        return;
      }
      
      // 其他地址：记录并转发到管理员
      await logEmail(message, env, from, to, subject);
      
    } catch (error) {
      console.error('Email processing error:', error);
      // 不抛出错误，避免邮件被退回
    }
  },
};

/**
 * 处理邮件验证回复
 */
async function handleVerificationReply(
  message: ForwardableEmailMessage,
  env: Env,
  from: string,
  subject: string
): Promise<void> {
  // 读取邮件内容
  const rawEmail = await new Response(message.raw).text();
  
  // 记录验证回复
  await env.DB.prepare(`
    INSERT INTO email_logs (id, from_email, to_email, subject, type, received_at, raw_content)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    from,
    'verify@cinacoin.com',
    subject,
    'verification_reply',
    Date.now(),
    rawEmail.substring(0, 10000) // 限制存储大小
  ).run();
  
  console.log(`Verification reply logged from ${from}`);
}

/**
 * 处理支持邮件
 */
async function handleSupportEmail(
  message: ForwardableEmailMessage,
  env: Env,
  from: string,
  subject: string
): Promise<void> {
  const rawEmail = await new Response(message.raw).text();
  
  // 记录支持邮件
  await env.DB.prepare(`
    INSERT INTO email_logs (id, from_email, to_email, subject, type, received_at, raw_content)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    from,
    'support@cinacoin.com',
    subject,
    'support',
    Date.now(),
    rawEmail.substring(0, 10000)
  ).run();
  
  console.log(`Support email logged from ${from}`);
}

/**
 * 记录邮件
 */
async function logEmail(
  message: ForwardableEmailMessage,
  env: Env,
  from: string,
  to: string,
  subject: string
): Promise<void> {
  const rawEmail = await new Response(message.raw).text();
  
  await env.DB.prepare(`
    INSERT INTO email_logs (id, from_email, to_email, subject, type, received_at, raw_content)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    from,
    to,
    subject,
    'other',
    Date.now(),
    rawEmail.substring(0, 10000)
  ).run();
  
  console.log(`Email logged: from=${from}, to=${to}`);
}
