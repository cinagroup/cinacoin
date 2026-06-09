/**
 * One-Click Auth Module
 * Combines wallet connection + SIWE signature + session creation in a single step
 */
export { default as oneClickAuthRoutes } from './one-click-auth.js';
export type {
  OneClickInitRequest,
  OneClickInitResponse,
  OneClickCompleteRequest,
  OneClickCompleteResponse,
  OneClickNonceData,
  OneClickAuthConfig,
  SIWEMessageParams,
} from './types.js';
