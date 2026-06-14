import { Env } from '../types';

/**
 * eth_supportedEntryPoints
 * Returns the list of supported entry point addresses.
 */
export function getSupportedEntryPoints(env: Env): string[] {
  return [env.ENTRY_POINT_V07];
}
