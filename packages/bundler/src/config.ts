import type { BundlerServerConfig } from './server-types';
import type { Hex, Address } from 'viem';

/**
 * Load bundler configuration from a JSON file.
 * Supports environment variable interpolation via ${VAR_NAME} syntax.
 */
export async function loadConfig(path: string): Promise<BundlerServerConfig> {
  const fs = await import('fs/promises');
  const raw = await fs.readFile(path, 'utf-8');
  const interpolated = interpolateEnv(raw);
  return JSON.parse(interpolated) as BundlerServerConfig;
}

/**
 * Replace ${ENV_VAR} placeholders with actual environment values.
 * Unset variables remain as-is (empty string fallback).
 */
function interpolateEnv(template: string): string {
  return template.replace(/\$\{([^}]+)\}/g, (_match, name: string) => {
    return process.env[name] ?? '';
  });
}

/**
 * Resolve the signer private key from config or environment.
 */
export function resolveSignerKey(config?: { signerKey?: Hex }): Hex {
  if (config?.signerKey) return config.signerKey;
  const fromEnv = process.env.BUNDLER_SIGNER_PRIVATE_KEY;
  if (fromEnv) return fromEnv as Hex;
  throw new Error('Signer private key not provided. Set BUNDLER_SIGNER_PRIVATE_KEY or pass signerKey in config.');
}

/**
 * Resolve the beneficiary address from config or environment.
 */
export function resolveBeneficiary(config?: { beneficiary?: Address }): Address {
  if (config?.beneficiary) return config.beneficiary;
  const fromEnv = process.env.BUNDLER_BENEFICIARY;
  if (fromEnv) return fromEnv as Address;
  throw new Error('Beneficiary address not provided. Set BUNDLER_BENEFICIARY or pass beneficiary in config.');
}
