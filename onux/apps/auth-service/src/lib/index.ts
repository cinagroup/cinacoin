export { loadConfig, getConfig, resetConfig } from './config.js';
export type { AuthConfig } from './config.js';

export {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
} from './jwt.js';
export type { TokenPayload, AccessTokenPayload, RefreshTokenPayload, TokenPair } from './jwt.js';

export { hashPassword, verifyPassword, needsRehash } from './password.js';

export {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  updateProfileSchema,
  validate,
} from './validation.js';
export type {
  RegisterInput,
  LoginInput,
  RefreshInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from './validation.js';

export type {
  UserRole,
  UserStatus,
  UserRecord,
  PublicUser,
  ApiError,
  ApiSuccess,
  PaginatedResponse,
  AuthTokensResponse,
  MfaRequiredResponse,
  MfaVerifyLoginRequest,
  OAuthProvider,
  OAuthAccountRecord,
  PublicOAuthAccount,
  OAuthStateRecord,
  OAuthUserProfile,
  OAuthSessionInfo,
  AuditLogRecord,
} from './types.js';
export { toPublicUser, toPublicOAuthAccount } from './types.js';

// Web3/SIWE
export {
  createSiweMessage,
  verifySiweSignature,
  parseSiweMessage,
  validateSiweMessage,
} from './siwe.js';
export type { SiweMessage } from './siwe.js';

// TOTP/MFA
export {
  generateTotpSecret,
  createTotp,
  generateTotpUri,
  verifyTotpToken,
  generateRecoveryCodes,
  generateQrCode,
} from './totp.js';
export type { TotpConfig } from './totp.js';
