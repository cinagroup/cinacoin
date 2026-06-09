/**
 * React hooks for passkey authentication.
 *
 * Provides `usePasskeyRegister` and `usePasskeyLogin` hooks
 * that wrap the browser WebAuthn API and communicate with a
 * backend server for challenge generation and verification.
 *
 * @packageDocumentation
 */

import { useState, useCallback, useRef } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────

export interface PasskeyApiConfig {
  /** Base URL for the passkey API (e.g., "https://api.example.com"). */
  baseUrl: string;
  /** Optional fetch options (headers, credentials, etc.). */
  fetchOptions?: RequestInit;
}

export interface PasskeyRegistrationResult {
  success: boolean;
  credentialId: string;
  error?: string;
}

export interface PasskeyLoginResult {
  success: boolean;
  credentialId: string;
  userHandle?: string;
  error?: string;
}

export interface PasskeyCredentialInfo {
  id: string;
  createdAt: string;
  counter: number;
}

// ─── Internal: API helpers ──────────────────────────────────────────────

async function apiPost<TRequest, TResponse>(
  baseUrl: string,
  path: string,
  body: TRequest,
  fetchOptions?: RequestInit
): Promise<TResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...fetchOptions,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

async function apiGet<TResponse>(
  baseUrl: string,
  path: string,
  fetchOptions?: RequestInit
): Promise<TResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...fetchOptions,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

async function apiDelete<TResponse>(
  baseUrl: string,
  path: string,
  fetchOptions?: RequestInit
): Promise<TResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    ...fetchOptions,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

/**
 * Convert a base64url string to ArrayBuffer for WebAuthn.
 */
function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert an ArrayBuffer to base64url string.
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ─── usePasskeyRegister ─────────────────────────────────────────────────

interface UsePasskeyRegisterState {
  loading: boolean;
  error: string | null;
  result: PasskeyRegistrationResult | null;
}

/**
 * Hook for passkey registration.
 *
 * Communicates with the backend to:
 * 1. Request a registration challenge
 * 2. Invoke `navigator.credentials.create()` with the challenge
 * 3. Send the registration response back to the backend for verification
 *
 * @example
 * ```tsx
 * const { register, loading, error, result } = usePasskeyRegister({
 *   baseUrl: 'https://api.example.com',
 * });
 *
 * const handleRegister = async () => {
 *   const result = await register('user-123', 'alice', 'Alice Smith');
 *   if (result.success) {
 *     console.log('Passkey registered:', result.credentialId);
 *   }
 * };
 * ```
 */
export function usePasskeyRegister(config: PasskeyApiConfig) {
  const [state, setState] = useState<UsePasskeyRegisterState>({
    loading: false,
    error: null,
    result: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const register = useCallback(
    async (userId: string, userName: string, displayName?: string): Promise<PasskeyRegistrationResult> => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setState({ loading: true, error: null, result: null });

      try {
        // Step 1: Get registration challenge from server
        const startResponse = await apiPost<
          { userId: string; userName: string; displayName: string },
          { challenge: string; options: PublicKeyCredentialCreationOptionsJSON }
        >(config.baseUrl, '/api/passkey/register/start', {
          userId,
          userName,
          displayName: displayName || userName,
        }, { signal: abortRef.current.signal, ...config.fetchOptions });

        // Step 2: Create credential via WebAuthn
        const publicKey: PublicKeyCredentialCreationOptions = {
          rp: startResponse.options.rp,
          user: {
            id: base64UrlToArrayBuffer(startResponse.options.user.id),
            name: startResponse.options.user.name,
            displayName: startResponse.options.user.displayName,
          },
          challenge: base64UrlToArrayBuffer(startResponse.options.challenge),
          pubKeyCredParams: startResponse.options.pubKeyCredParams,
          timeout: startResponse.options.timeout,
          attestation: startResponse.options.attestation as AttestationConveyancePreference | undefined,
          authenticatorSelection: startResponse.options.authenticatorSelection as AuthenticatorSelectionCriteria | undefined,
        };

        const credential = await navigator.credentials.create({
          publicKey,
        }) as PublicKeyCredential;

        if (!credential) {
          const result: PasskeyRegistrationResult = {
            success: false,
            credentialId: '',
            error: 'Registration cancelled by user',
          };
          setState({ loading: false, error: null, result });
          return result;
        }

        // Step 3: Parse and send registration response to server
        const attestationResponse = credential.response as AuthenticatorAttestationResponse;
        const parsedResponse = {
          id: credential.id,
          rawId: arrayBufferToBase64Url(credential.rawId),
          type: 'public-key' as const,
          attestationObject: arrayBufferToBase64Url(attestationResponse.attestationObject),
          clientDataJSON: arrayBufferToBase64Url(attestationResponse.clientDataJSON),
          transports: typeof attestationResponse.getTransports === 'function'
            ? attestationResponse.getTransports()
            : undefined,
        };

        const finishResponse = await apiPost<
          { response: typeof parsedResponse; challenge: string },
          { success: boolean; credentialId: string }
        >(config.baseUrl, '/api/passkey/register/finish', {
          response: parsedResponse,
          challenge: startResponse.challenge,
        }, { signal: abortRef.current.signal, ...config.fetchOptions });

        const result: PasskeyRegistrationResult = {
          success: true,
          credentialId: finishResponse.credentialId,
        };
        setState({ loading: false, error: null, result });
        return result;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return { success: false, credentialId: '', error: 'Request cancelled' };

        const message = error instanceof Error ? error.message : 'Registration failed';
        const result: PasskeyRegistrationResult = {
          success: false,
          credentialId: '',
          error: message,
        };
        setState({ loading: false, error: message, result });
        return result;
      }
    },
    [config.baseUrl, config.fetchOptions]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ loading: false, error: null, result: null });
  }, []);

  return { ...state, register, reset };
}

// ─── usePasskeyLogin ────────────────────────────────────────────────────

interface UsePasskeyLoginState {
  loading: boolean;
  error: string | null;
  result: PasskeyLoginResult | null;
}

/**
 * Hook for passkey login (authentication).
 *
 * Communicates with the backend to:
 * 1. Request an authentication challenge (optionally for a specific user)
 * 2. Invoke `navigator.credentials.get()` with the challenge
 * 3. Send the authentication response back to the backend for verification
 *
 * @example
 * ```tsx
 * const { login, loading, error, result } = usePasskeyLogin({
 *   baseUrl: 'https://api.example.com',
 * });
 *
 * const handleLogin = async () => {
 *   const result = await login('user-123'); // optional userId
 *   if (result.success) {
 *     console.log('Logged in as:', result.userHandle);
 *   }
 * };
 * ```
 */
export function usePasskeyLogin(config: PasskeyApiConfig) {
  const [state, setState] = useState<UsePasskeyLoginState>({
    loading: false,
    error: null,
    result: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const login = useCallback(
    async (userId?: string): Promise<PasskeyLoginResult> => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setState({ loading: true, error: null, result: null });

      try {
        // Step 1: Get authentication challenge from server
        const startResponse = await apiPost<
          { userId?: string },
          { challenge: string; options: PublicKeyCredentialRequestOptionsJSON }
        >(config.baseUrl, '/api/passkey/authenticate/start', {
          userId,
        }, { signal: abortRef.current.signal, ...config.fetchOptions });

        // Step 2: Get credential via WebAuthn
        const publicKey: PublicKeyCredentialRequestOptions = {
          challenge: base64UrlToArrayBuffer(startResponse.options.challenge),
          timeout: startResponse.options.timeout,
          rpId: startResponse.options.rpId,
          userVerification: startResponse.options.userVerification as UserVerificationRequirement | undefined,
          allowCredentials: startResponse.options.allowCredentials?.map((c) => ({
            type: 'public-key' as PublicKeyCredentialType,
            id: base64UrlToArrayBuffer(c.id),
            transports: c.transports as AuthenticatorTransport[],
          })),
        };

        const credential = await navigator.credentials.get({
          publicKey,
        }) as PublicKeyCredential;

        if (!credential) {
          const result: PasskeyLoginResult = {
            success: false,
            credentialId: '',
            error: 'Authentication cancelled by user',
          };
          setState({ loading: false, error: null, result });
          return result;
        }

        // Step 3: Parse and send authentication response to server
        const assertionResponse = credential.response as AuthenticatorAssertionResponse;
        const parsedResponse = {
          id: credential.id,
          rawId: arrayBufferToBase64Url(credential.rawId),
          type: 'public-key' as const,
          authenticatorData: arrayBufferToBase64Url(assertionResponse.authenticatorData),
          clientDataJSON: arrayBufferToBase64Url(assertionResponse.clientDataJSON),
          signature: arrayBufferToBase64Url(assertionResponse.signature),
          userHandle: assertionResponse.userHandle
            ? arrayBufferToBase64Url(assertionResponse.userHandle)
            : undefined,
        };

        const finishResponse = await apiPost<
          { response: typeof parsedResponse; challenge: string },
          { success: boolean; userHandle?: string; counter?: number }
        >(config.baseUrl, '/api/passkey/authenticate/finish', {
          response: parsedResponse,
          challenge: startResponse.challenge,
        }, { signal: abortRef.current.signal, ...config.fetchOptions });

        const result: PasskeyLoginResult = {
          success: true,
          credentialId: parsedResponse.rawId,
          userHandle: finishResponse.userHandle,
        };
        setState({ loading: false, error: null, result });
        return result;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return { success: false, credentialId: '', error: 'Request cancelled' };

        const message = error instanceof Error ? error.message : 'Login failed';
        const result: PasskeyLoginResult = {
          success: false,
          credentialId: '',
          error: message,
        };
        setState({ loading: false, error: message, result });
        return result;
      }
    },
    [config.baseUrl, config.fetchOptions]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ loading: false, error: null, result: null });
  }, []);

  return { ...state, login, reset };
}

// ─── usePasskeyCredentials ──────────────────────────────────────────────

interface UsePasskeyCredentialsState {
  loading: boolean;
  error: string | null;
  credentials: PasskeyCredentialInfo[];
}

/**
 * Hook for managing user's passkey credentials (list, remove).
 *
 * @example
 * ```tsx
 * const { credentials, loading, removeCredential, refresh } = usePasskeyCredentials({
 *   baseUrl: 'https://api.example.com',
 * });
 *
 * // Load credentials for a user
 * useEffect(() => { refresh('user-123'); }, []);
 *
 * // Remove a credential
 * const handleRemove = (id: string) => removeCredential(id);
 * ```
 */
export function usePasskeyCredentials(config: PasskeyApiConfig) {
  const [state, setState] = useState<UsePasskeyCredentialsState>({
    loading: false,
    error: null,
    credentials: [],
  });

  const refresh = useCallback(
    async (userId: string) => {
      setState({ loading: true, error: null, credentials: [] });

      try {
        const response = await apiGet<
          { credentials: PasskeyCredentialInfo[] }
        >(config.baseUrl, `/api/passkey/credentials/${encodeURIComponent(userId)}`, config.fetchOptions);

        setState({ loading: false, error: null, credentials: response.credentials });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load credentials';
        setState({ loading: false, error: message, credentials: [] });
      }
    },
    [config.baseUrl, config.fetchOptions]
  );

  const removeCredential = useCallback(
    async (credentialId: string): Promise<boolean> => {
      try {
        await apiDelete<{ success: boolean }>(
          config.baseUrl,
          `/api/passkey/credentials/${encodeURIComponent(credentialId)}`,
          config.fetchOptions
        );
        // Refresh the list
        setState((prev) => ({
          ...prev,
          credentials: prev.credentials.filter((c) => c.id !== credentialId),
        }));
        return true;
      } catch {
        return false;
      }
    },
    [config.baseUrl, config.fetchOptions]
  );

  return { ...state, refresh, removeCredential };
}
