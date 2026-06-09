/**
 * SIWE (Sign-In with Ethereum) implementation
 * Implements EIP-4361 standard for message signing
 */
import { createPublicClient, http, verifyMessage, getAddress } from 'viem';
import { mainnet } from 'viem/chains';

export interface SiweMessage {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

/**
 * Create a SIWE message following EIP-4361
 */
export function createSiweMessage(params: {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version?: string;
  chainId?: number;
  nonce: string;
  issuedAt?: string;
  expirationTime?: string;
}): string {
  const {
    domain,
    address,
    statement = 'Sign in with Ethereum to the app.',
    uri,
    version = '1',
    chainId = 1,
    nonce,
    issuedAt = new Date().toISOString(),
    expirationTime,
  } = params;

  let message = `${domain} wants you to sign in with your Ethereum account:\n`;
  message += `${address}\n\n`;
  message += `${statement}\n\n`;
  message += `URI: ${uri}\n`;
  message += `Version: ${version}\n`;
  message += `Chain ID: ${chainId}\n`;
  message += `Nonce: ${nonce}\n`;
  message += `Issued At: ${issuedAt}`;
  
  if (expirationTime) {
    message += `\nExpiration Time: ${expirationTime}`;
  }

  return message;
}

/**
 * Verify a SIWE signature
 */
export async function verifySiweSignature(params: {
  message: string;
  signature: string;
  address: string;
}): Promise<boolean> {
  try {
    const { message, signature, address } = params;
    
    // Normalize address to checksum format
    const normalizedAddress = getAddress(address);
    
    // Verify the signature
    const isValid = await verifyMessage({
      address: normalizedAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    
    return isValid;
  } catch (error) {
    console.error('SIWE verification error:', error);
    return false;
  }
}

/**
 * Parse a SIWE message string into structured data
 */
export function parseSiweMessage(message: string): Partial<SiweMessage> {
  const result: Partial<SiweMessage> = {};
  
  // Extract domain
  const domainMatch = message.match(/^(.+) wants you to sign in with your Ethereum account:/m);
  if (domainMatch) {
    result.domain = domainMatch[1];
  }
  
  // Extract address
  const addressMatch = message.match(/^0x[a-fA-F0-9]{40}$/m);
  if (addressMatch) {
    result.address = addressMatch[0];
  }
  
  // Extract URI
  const uriMatch = message.match(/^URI: (.+)$/m);
  if (uriMatch) {
    result.uri = uriMatch[1];
  }
  
  // Extract version
  const versionMatch = message.match(/^Version: (.+)$/m);
  if (versionMatch) {
    result.version = versionMatch[1];
  }
  
  // Extract chain ID
  const chainIdMatch = message.match(/^Chain ID: (\d+)$/m);
  if (chainIdMatch) {
    result.chainId = parseInt(chainIdMatch[1], 10);
  }
  
  // Extract nonce
  const nonceMatch = message.match(/^Nonce: (.+)$/m);
  if (nonceMatch) {
    result.nonce = nonceMatch[1];
  }
  
  // Extract issued at
  const issuedAtMatch = message.match(/^Issued At: (.+)$/m);
  if (issuedAtMatch) {
    result.issuedAt = issuedAtMatch[1];
  }
  
  // Extract expiration time
  const expirationMatch = message.match(/^Expiration Time: (.+)$/m);
  if (expirationMatch) {
    result.expirationTime = expirationMatch[1];
  }
  
  return result;
}

/**
 * Validate SIWE message fields
 */
export function validateSiweMessage(params: {
  message: SiweMessage;
  expectedDomain?: string;
  expectedNonce?: string;
  expectedChainId?: number;
}): { valid: boolean; error?: string } {
  const { message, expectedDomain, expectedNonce, expectedChainId } = params;
  
  // Check expiration
  if (message.expirationTime) {
    const expTime = new Date(message.expirationTime);
    if (expTime < new Date()) {
      return { valid: false, error: 'Message has expired' };
    }
  }
  
  // Check not before
  if (message.notBefore) {
    const notBefore = new Date(message.notBefore);
    if (notBefore > new Date()) {
      return { valid: false, error: 'Message is not yet valid' };
    }
  }
  
  // Validate domain
  if (expectedDomain && message.domain !== expectedDomain) {
    return { valid: false, error: 'Domain mismatch' };
  }
  
  // Validate nonce
  if (expectedNonce && message.nonce !== expectedNonce) {
    return { valid: false, error: 'Nonce mismatch' };
  }
  
  // Validate chain ID
  if (expectedChainId && message.chainId !== expectedChainId) {
    return { valid: false, error: 'Chain ID mismatch' };
  }
  
  return { valid: true };
}
