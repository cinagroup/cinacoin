/**
 * One-Click Auth Frontend Component
 * React component for one-click wallet authentication
 */
import React, { useState, useCallback } from 'react';
import type { Connector } from '../connector.js';
import type { OneClickAuthConfig, OneClickInitResponse, OneClickCompleteResponse } from './types.js';

export interface OneClickAuthButtonProps {
  /** Wallet connector instance */
  connector: Connector;
  /** One-click auth configuration */
  config: OneClickAuthConfig;
  /** Callback when authentication succeeds */
  onSuccess?: (result: OneClickCompleteResponse) => void;
  /** Callback when authentication fails */
  onError?: (error: Error) => void;
  /** Callback when authentication starts */
  onStart?: () => void;
  /** Custom button text */
  buttonText?: string;
  /** Custom loading text */
  loadingText?: string;
  /** Custom success text */
  successText?: string;
  /** Custom error text */
  errorText?: string;
  /** Disable the button */
  disabled?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

type AuthState = 'idle' | 'connecting' | 'signing' | 'verifying' | 'success' | 'error';

/**
 * One-Click Auth Button Component
 * 
 * Provides a single button that handles the entire authentication flow:
 * 1. Connect wallet
 * 2. Request SIWE message from backend
 * 3. Sign message with wallet
 * 4. Submit signature to backend
 * 5. Receive JWT tokens
 * 
 * @example
 * ```tsx
 * import { OneClickAuthButton } from '@cinacoin/core-sdk/components';
 * 
 * function LoginPage() {
 *   const handleSuccess = (result) => {
 *     // Store tokens in httpOnly cookies
 *     document.cookie = `accessToken=${result.data.accessToken}; HttpOnly; Secure`;
 *     // Redirect to dashboard
 *     window.location.href = '/dashboard';
 *   };
 * 
 *   return (
 *     <OneClickAuthButton
 *       connector={connector}
 *       config={{
 *         authUrl: 'https://auth.cinacoin.com',
 *         domain: 'https://myapp.com',
 *         chainId: 1,
 *       }}
 *       onSuccess={handleSuccess}
 *       onError={(err) => console.error('Auth failed:', err)}
 *     />
 *   );
 * }
 * ```
 */
export const OneClickAuthButton: React.FC<OneClickAuthButtonProps> = ({
  connector,
  config,
  onSuccess,
  onError,
  onStart,
  buttonText = 'Sign in with Wallet',
  loadingText = 'Authenticating...',
  successText = 'Authenticated!',
  errorText = 'Authentication failed',
  disabled = false,
  className,
  style,
}) => {
  const [state, setState] = useState<AuthState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleClick = useCallback(async () => {
    try {
      setState('connecting');
      setErrorMessage('');
      onStart?.();

      // Step 1: Connect wallet if not already connected
      let accounts = await connector.getAccounts();
      if (accounts.length === 0) {
        const result = await connector.connect();
        accounts = result.accounts;
      }

      if (accounts.length === 0) {
        throw new Error('No wallet accounts available');
      }

      const address = accounts[0];

      // Step 2: Request SIWE message from backend
      setState('signing');
      const initResponse = await fetch(`${config.authUrl}/auth/one-click/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          domain: config.domain,
          chainId: config.chainId || 1,
          statement: config.statement,
        }),
      });

      if (!initResponse.ok) {
        const error = await initResponse.json();
        throw new Error(error.message || 'Failed to initialize authentication');
      }

      const initData: OneClickInitResponse = await initResponse.json();

      // Step 3: Sign message with wallet
      setState('verifying');
      const signature = await connector.signMessage(initData.data.message);

      // Step 4: Submit signature to backend
      const completeResponse = await fetch(`${config.authUrl}/auth/one-click/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          message: initData.data.message,
          signature,
          nonce: initData.data.nonce,
        }),
      });

      if (!completeResponse.ok) {
        const error = await completeResponse.json();
        throw new Error(error.message || 'Failed to complete authentication');
      }

      const result: OneClickCompleteResponse = await completeResponse.json();

      // Step 5: Success
      setState('success');
      onSuccess?.(result);

      // Reset to idle after 2 seconds
      setTimeout(() => setState('idle'), 2000);
    } catch (error) {
      console.error('One-click auth error:', error);
      setState('error');
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(message);
      onError?.(error instanceof Error ? error : new Error(message));

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setState('idle');
        setErrorMessage('');
      }, 3000);
    }
  }, [connector, config, onSuccess, onError, onStart]);

  const getButtonText = () => {
    switch (state) {
      case 'connecting':
        return 'Connecting wallet...';
      case 'signing':
        return 'Preparing message...';
      case 'verifying':
        return 'Verifying signature...';
      case 'success':
        return successText;
      case 'error':
        return errorText;
      default:
        return buttonText;
    }
  };

  const isLoading = ['connecting', 'signing', 'verifying'].includes(state);
  const isDisabled = disabled || isLoading || state === 'success';

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={className}
      style={{
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 600,
        borderRadius: '8px',
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: isDisabled ? 0.6 : 1,
        background: state === 'success' 
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          : state === 'error'
          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
          : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        ...style,
      }}
    >
      {isLoading && (
        <span style={{ marginRight: '8px', display: 'inline-block' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            style={{
              animation: 'spin 1s linear infinite',
              verticalAlign: 'middle',
            }}
          >
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray="31.4 31.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
      {state === 'success' && <span style={{ marginRight: '8px' }}>✓</span>}
      {state === 'error' && <span style={{ marginRight: '8px' }}>✗</span>}
      {getButtonText()}
      {errorMessage && state === 'error' && (
        <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
          {errorMessage}
        </div>
      )}
    </button>
  );
};

/**
 * Hook for programmatic one-click auth
 * 
 * @example
 * ```tsx
 * import { useOneClickAuth } from '@cinacoin/core-sdk/components';
 * 
 * function MyComponent() {
 *   const { authenticate, isLoading, error } = useOneClickAuth({
 *     connector,
 *     config: {
 *       authUrl: 'https://auth.cinacoin.com',
 *       domain: 'https://myapp.com',
 *     },
 *   });
 * 
 *   const handleLogin = async () => {
 *     const result = await authenticate();
 *     if (result) {
 *       // Handle success
 *       console.log('Authenticated:', result.data.user);
 *     }
 *   };
 * 
 *   return <button onClick={handleLogin} disabled={isLoading}>Login</button>;
 * }
 * ```
 */
export function useOneClickAuth({
  connector,
  config,
}: {
  connector: Connector;
  config: OneClickAuthConfig;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const authenticate = useCallback(async (): Promise<OneClickCompleteResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Connect wallet
      let accounts = await connector.getAccounts();
      if (accounts.length === 0) {
        const result = await connector.connect();
        accounts = result.accounts;
      }

      if (accounts.length === 0) {
        throw new Error('No wallet accounts available');
      }

      const address = accounts[0];

      // Step 2: Request SIWE message
      const initResponse = await fetch(`${config.authUrl}/auth/one-click/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          domain: config.domain,
          chainId: config.chainId || 1,
          statement: config.statement,
        }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.message || 'Failed to initialize authentication');
      }

      const initData: OneClickInitResponse = await initResponse.json();

      // Step 3: Sign message
      const signature = await connector.signMessage(initData.data.message);

      // Step 4: Complete authentication
      const completeResponse = await fetch(`${config.authUrl}/auth/one-click/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          message: initData.data.message,
          signature,
          nonce: initData.data.nonce,
        }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.message || 'Failed to complete authentication');
      }

      const result: OneClickCompleteResponse = await completeResponse.json();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Authentication failed');
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [connector, config]);

  return {
    authenticate,
    isLoading,
    error,
  };
}

export default OneClickAuthButton;
