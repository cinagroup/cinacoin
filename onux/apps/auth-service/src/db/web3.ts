/**
 * Web3 wallet data access layer
 */
import { query } from './pool.js';
import { v4 as uuidv4 } from 'uuid';

export interface Web3WalletRecord {
  id: string;
  user_id: string;
  address: string;
  chain: string;
  chain_id: number | null;
  is_primary: boolean;
  nonce: string;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Web3NonceRecord {
  id: string;
  address: string;
  nonce: string;
  domain: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

/**
 * Create a nonce for SIWE signing
 */
export async function createWeb3Nonce(params: {
  address: string;
  domain: string;
}): Promise<Web3NonceRecord> {
  const id = uuidv4();
  const nonce = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '').substring(0, 32);
  
  const result = await query<Web3NonceRecord>(
    `INSERT INTO web3_nonces (id, address, nonce, domain, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '5 minutes')
     RETURNING *`,
    [id, params.address.toLowerCase(), nonce, params.domain]
  );
  
  return result.rows[0];
}

/**
 * Get and consume a nonce for verification
 */
export async function consumeWeb3Nonce(nonce: string, address: string): Promise<Web3NonceRecord | null> {
  const result = await query<Web3NonceRecord>(
    `UPDATE web3_nonces 
     SET used = TRUE 
     WHERE nonce = $1 AND address = $2 AND used = FALSE AND expires_at > NOW()
     RETURNING *`,
    [nonce, address.toLowerCase()]
  );
  
  return result.rows[0] || null;
}

/**
 * Find a wallet by address and chain
 */
export async function findWeb3Wallet(address: string, chain: string = 'ethereum'): Promise<Web3WalletRecord | null> {
  const result = await query<Web3WalletRecord>(
    `SELECT * FROM web3_wallets WHERE address = $1 AND chain = $2`,
    [address.toLowerCase(), chain]
  );
  return result.rows[0] || null;
}

/**
 * Create or update a Web3 wallet for a user
 */
export async function upsertWeb3Wallet(params: {
  userId: string;
  address: string;
  chain?: string;
  chainId?: number;
}): Promise<Web3WalletRecord> {
  const id = uuidv4();
  const { userId, address, chain = 'ethereum', chainId } = params;
  
  const result = await query<Web3WalletRecord>(
    `INSERT INTO web3_wallets (id, user_id, address, chain, chain_id, is_primary)
     VALUES ($1, $2, $3, $4, $5, NOT EXISTS (SELECT 1 FROM web3_wallets WHERE user_id = $2))
     ON CONFLICT (address, chain) 
     DO UPDATE SET user_id = $2, last_used_at = NOW(), updated_at = NOW()
     RETURNING *`,
    [id, userId, address.toLowerCase(), chain, chainId || null]
  );
  
  return result.rows[0];
}

/**
 * Get all wallets for a user
 */
export async function getUserWeb3Wallets(userId: string): Promise<Web3WalletRecord[]> {
  const result = await query<Web3WalletRecord>(
    `SELECT * FROM web3_wallets WHERE user_id = $1 ORDER BY is_primary DESC, created_at ASC`,
    [userId]
  );
  return result.rows;
}

/**
 * Update last used timestamp
 */
export async function updateWeb3WalletLastUsed(walletId: string): Promise<void> {
  await query(
    `UPDATE web3_wallets SET last_used_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [walletId]
  );
}

/**
 * Remove a Web3 wallet
 */
export async function removeWeb3Wallet(walletId: string, userId: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM web3_wallets WHERE id = $1 AND user_id = $2 AND is_primary = FALSE`,
    [walletId, userId]
  );
  return (result.rowCount || 0) > 0;
}
