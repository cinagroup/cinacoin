/**
 * Cinacoin SDK Error System
 *
 * Comprehensive error code system with 63 error codes across 9 categories:
 * CONNECTION, AUTHENTICATION, CHAIN, TRANSACTION, WALLET_CONNECT,
 * SIGNING, NETWORK, SDK, and SECURITY.
 *
 * Includes custom error classes, utilities, formatting, and i18n
 * support for 7 languages.
 */

// Error code definitions
export {
  type ErrorSeverity,
  type ErrorCodeDefinition,
  CONNECTION,
  AUTHENTICATION,
  CHAIN,
  TRANSACTION,
  WALLET_CONNECT,
  SIGNING,
  NETWORK,
  SDK,
  SECURITY,
  ERROR_CODES,
  ERROR_CODE_COUNT,
  getErrorCode,
  getErrorByIdentifier,
} from './codes.js';

// Error classes
export {
  CinacoinError,
  ConnectionError,
  AuthenticationError,
  ChainError,
  TransactionError,
  CinacoinError,
  SigningError,
  NetworkError,
  SdkError,
  SecurityError,
  createError,
  resolveCodeDef,
} from './classes.js';

// Utilities
export {
  isError,
  isConnectionError,
  isAuthenticationError,
  isChainError,
  isTransactionError,
  isCinacoinError,
  isSigningError,
  isNetworkError,
  isSdkError,
  isSecurityError,
  getErrorSeverity,
  isRetryable,
  getErrorDocumentation,
  formatError,
  formatErrorCompact,
  errorToJSON,
  errorFromJSON,
} from './utils.js';

// Internationalization
export {
  type SupportedLocale,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  isLocaleSupported,
  resolveLocale,
  getMessage,
  getAllTranslations,
} from './i18n.js';
