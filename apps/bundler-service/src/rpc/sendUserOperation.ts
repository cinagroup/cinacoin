import { Env, UserOperation } from '../types';

/**
 * eth_sendUserOperation
 * Submits a UserOperation to the mempool and returns the userOpHash.
 */
export async function sendUserOperation(
  userOp: UserOperation,
  entryPoint: string,
  env: Env
): Promise<string> {
  // Validate entry point
  if (entryPoint.toLowerCase() !== env.ENTRY_POINT_V07.toLowerCase()) {
    throw new Error(`Unsupported entry point: ${entryPoint}`);
  }

  // Validate required fields
  if (!userOp.sender) throw new Error('Missing sender');
  if (!userOp.nonce) throw new Error('Missing nonce');
  if (!userOp.callData && userOp.callData !== '0x') throw new Error('Missing callData');

  // Compute userOpHash
  const userOpHash = await computeUserOpHash(userOp, entryPoint);

  // Store in D1 for tracking
  await env.BUNDLER_DB.prepare(
    `INSERT OR REPLACE INTO user_operations 
     (hash, sender, nonce, entry_point, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    userOpHash,
    userOp.sender,
    userOp.nonce,
    entryPoint,
    'pending',
    Date.now()
  ).run();

  // In production: submit to bundler queue for batching and on-chain submission
  // For now, mark as submitted
  await env.BUNDLER_DB.prepare(
    `UPDATE user_operations SET status = ?, tx_hash = ?, updated_at = ?
     WHERE hash = ?`
  ).bind('submitted', '0x' + '0'.repeat(64), Date.now(), userOpHash).run();

  return userOpHash;
}

async function computeUserOpHash(
  userOp: UserOperation,
  entryPoint: string
): Promise<string> {
  // Simplified hash computation
  // In production: use viem to compute keccak256 of packed UserOp + entryPoint + chainId
  const data = JSON.stringify({
    sender: userOp.sender,
    nonce: userOp.nonce,
    initCode: userOp.initCode,
    callData: userOp.callData,
    entryPoint,
  });

  // Simple hash for now — replace with proper keccak256
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
