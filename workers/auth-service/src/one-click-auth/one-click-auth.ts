/**
 * One-Click Auth Backend Implementation
 * Combines wallet connection + SIWE signature + session creation in one step
 */
import { Hono } from 'hono';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import type { Env } from '../lib/types.js';
import { generateTokenPair } from '../lib/jwt.js';
import { withRateLimit } from '../middleware/rate-limit.js';
import { toPublicUser } from '../lib/types.js';
import { recordTokenIssuance } from '../lib/token-rotation.js';
import { uuidv4, now } from '../lib/utils.js';
import { findUserById } from '../db/users.js';

/**
 * Generate a cryptographically secure nonce
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate SIWE (Sign-In with Ethereum) message
 */
function generateSIWEMessage(params: {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
}): string {
  const { domain, address, statement, uri, chainId, nonce, issuedAt, expirationTime } = params;
  
  let message = `${domain} wants you to sign in with your Ethereum account:\n`;
  message += `${address}\n\n`;
  
  if (statement) {
    message += `${statement}\n\n`;
  }
  
  message += `URI: ${uri}\n`;
  message += `Version: 1\n`;
  message += `Chain ID: ${chainId}\n`;
  message += `Nonce: ${nonce}\n`;
  message += `Issued At: ${issuedAt}\n`;
  message += `Expiration Time: ${expirationTime}`;
  
  return message;
}

/**
 * Hash message with Ethereum prefix: keccak256("\x19Ethereum Signed Message:\n" + len + message)
 */
function hashMessage(message: string): Uint8Array {
  const messageBytes = new TextEncoder().encode(message);
  const prefix = `\x19Ethereum Signed Message:\n${messageBytes.length}`;
  const prefixBytes = new TextEncoder().encode(prefix);
  
  const combined = new Uint8Array(prefixBytes.length + messageBytes.length);
  combined.set(prefixBytes);
  combined.set(messageBytes, prefixBytes.length);
  
  return keccak_256(combined);
}

/**
 * Recover Ethereum address from signature
 */
function recoverAddress(messageHash: Uint8Array, signature: string): string {
  const sigHex = signature.startsWith('0x') ? signature.slice(2) : signature;
  
  if (sigHex.length !== 130) {
    throw new Error('Invalid signature length');
  }
  
  const r = sigHex.slice(0, 64);
  const s = sigHex.slice(64, 128);
  const v = parseInt(sigHex.slice(128, 130), 16);
  
  // Normalize v value (27/28 or 0/1)
  const recovery = v >= 27 ? v - 27 : v;
  
  if (recovery !== 0 && recovery !== 1) {
    throw new Error('Invalid signature v value');
  }
  
  const signatureBytes = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    signatureBytes[i] = parseInt(sigHex.slice(i * 2, i * 2 + 2), 16);
  }
  
  // Recover public key
  const signature_ = new secp256k1.Signature(
    BigInt('0x' + r),
    BigInt('0x' + s)
  ).addRecoveryBit(recovery);
  
  const publicKey = signature_.recoverPublicKey(messageHash).toRawBytes(false);
  
  // Get address from public key (keccak256 of uncompressed public key without prefix)
  const addressHash = keccak_256(publicKey.slice(1));
  const address = '0x' + Array.from(addressHash.slice(-20))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return address;
}

/**
 * Verify Ethereum signature and recover address
 * Uses ecrecover to verify the signature matches the claimed address
 */
async function verifySignature(
  message: string,
  signature: string,
  claimedAddress: string
): Promise<boolean> {
  try {
    // Hash the message with Ethereum prefix
    const messageHash = hashMessage(message);
    
    // Recover address from signature
    const recoveredAddress = recoverAddress(messageHash, signature);
    
    // Compare addresses (case-insensitive)
    return recoveredAddress.toLowerCase() === claimedAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

const oneClickAuth = new Hono<{ Bindings: Env }>();

/**
 * POST /auth/one-click/init
 * Initialize one-click auth by generating a pre-filled SIWE message
 */
oneClickAuth.post('/one-click/init', withRateLimit('api'), async (c) => {
  try {
    const body = await c.req.json();
    const { address, domain, chainId = 1, statement } = body;

    // Validate required fields
    if (!address || !domain) {
      return c.json(
        { error: 'Validation failed', message: 'address and domain are required' },
        400
      );
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return c.json(
        { error: 'Validation failed', message: 'Invalid Ethereum address format' },
        400
      );
    }

    // Generate nonce and timestamps
    const nonce = generateNonce();
    const issuedAt = new Date().toISOString();
    const expirationTime = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Generate SIWE message
    const message = generateSIWEMessage({
      domain,
      address,
      statement: statement || 'Sign in to CINAcoin',
      uri: `${domain}/auth/one-click/complete`,
      chainId,
      nonce,
      issuedAt,
      expirationTime,
    });

    // Store nonce in KV for verification (with 5 minute TTL)
    const nonceKey = `oneclick:${nonce}`;
    await c.env.KV.put(
      nonceKey,
      JSON.stringify({
        address: address.toLowerCase(),
        domain,
        chainId,
        issuedAt,
        expirationTime,
      }),
      { expirationTtl: 300 } // 5 minutes
    );

    return c.json({
      success: true,
      data: {
        message,
        nonce,
        issuedAt,
        expirationTime,
        domain,
        chainId,
      },
    });
  } catch (error) {
    console.error('One-click init error:', error);
    return c.json(
      { error: 'Internal server error', message: 'Failed to initialize one-click auth' },
      500
    );
  }
});

/**
 * POST /auth/one-click/complete
 * Complete one-click auth by verifying signature and creating session
 */
oneClickAuth.post('/one-click/complete', withRateLimit('login'), async (c) => {
  try {
    const body = await c.req.json();
    const { address, message, signature, nonce } = body;

    // Validate required fields
    if (!address || !message || !signature || !nonce) {
      return c.json(
        { error: 'Validation failed', message: 'address, message, signature, and nonce are required' },
        400
      );
    }

    // Retrieve nonce data from KV
    const nonceKey = `oneclick:${nonce}`;
    const nonceDataRaw = await c.env.KV.get(nonceKey, 'json');
    
    if (!nonceDataRaw) {
      return c.json(
        { error: 'Invalid or expired nonce', message: 'Please request a new authentication message' },
        400
      );
    }

    const nonceData = nonceDataRaw as {
      address: string;
      domain: string;
      chainId: number;
      issuedAt: string;
      expirationTime: string;
    };

    // Check expiration
    if (new Date() > new Date(nonceData.expirationTime)) {
      await c.env.KV.delete(nonceKey);
      return c.json(
        { error: 'Message expired', message: 'Please request a new authentication message' },
        400
      );
    }

    // Verify address matches
    if (nonceData.address !== address.toLowerCase()) {
      return c.json(
        { error: 'Address mismatch', message: 'The address does not match the original request' },
        400
      );
    }

    // Verify signature
    const isValidSignature = await verifySignature(message, signature, address);
    if (!isValidSignature) {
      return c.json(
        { error: 'Invalid signature', message: 'Signature verification failed' },
        401
      );
    }

    // Mark nonce as used (delete from KV)
    await c.env.KV.delete(nonceKey);

    // Find or create user by wallet address
    let user = await c.env.DB.prepare(
      'SELECT u.* FROM users u JOIN web3_wallets w ON u.id = w.user_id WHERE w.address = ? AND w.chain = ?'
    )
      .bind(address.toLowerCase(), 'ethereum')
      .first<any>();

    if (!user) {
      // Auto-create user for this wallet
      const userId = uuidv4();
      const timestamp = now();
      const username = `user_${address.slice(2, 10)}`; // Use first 8 chars of address

      await c.env.DB.prepare(
        `INSERT INTO users (id, email, username, display_name, role, status, auth_type, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'user', 'active', 'web3', ?, ?)`
      )
        .bind(userId, `${address.toLowerCase()}@wallet.cinacoin`, username, null, timestamp, timestamp)
        .run();

      // Create wallet record
      await c.env.DB.prepare(
        `INSERT INTO web3_wallets (id, user_id, address, chain, chain_id, is_primary, nonce, created_at, updated_at)
         VALUES (?, ?, ?, 'ethereum', ?, 1, ?, ?, ?)`
      )
        .bind(uuidv4(), userId, address.toLowerCase(), nonceData.chainId, nonce, timestamp, timestamp)
        .run();

      user = await findUserById(c.env.DB, userId);
    } else {
      // Update last login
      await c.env.DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
        .bind(now(), user.id)
        .run();
    }

    if (!user) {
      return c.json(
        { error: 'Internal server error', message: 'Failed to create or retrieve user' },
        500
      );
    }

    // Generate JWT tokens
    const tokens = await generateTokenPair(
      { sub: user.id, email: user.email, role: user.role },
      c.env
    );

    // Record token issuance
    await recordTokenIssuance(c.env.DB, user.id, tokens.refreshToken, {
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      userAgent: c.req.header('user-agent'),
    });

    // Log audit event
    await c.env.DB.prepare(
      `INSERT INTO auth_audit_log (id, user_id, event_type, ip_address, user_agent, metadata, success, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        uuidv4(),
        user.id,
        'one_click_auth',
        c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
        c.req.header('user-agent'),
        JSON.stringify({ address, chainId: nonceData.chainId }),
        1,
        now()
      )
      .run();

    return c.json({
      success: true,
      data: {
        ...tokens,
        tokenType: 'Bearer' as const,
        user: toPublicUser(user),
        address: address.toLowerCase(),
        chainId: nonceData.chainId,
      },
    });
  } catch (error) {
    console.error('One-click complete error:', error);
    return c.json(
      { error: 'Internal server error', message: 'Failed to complete one-click auth' },
      500
    );
  }
});

export default oneClickAuth;
