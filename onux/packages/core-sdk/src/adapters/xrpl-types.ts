/**
 * XRPL API response types for type safety.
 */

export interface XrplSubmitResponse {
  /** Transaction hash */
  hash?: string;
  /** Transaction JSON */
  tx_json?: {
    hash?: string;
    [key: string]: unknown;
  };
  /** Raw transaction blob */
  tx_blob?: string;
  /** Signature */
  signature?: string;
  /** Result metadata */
  meta?: {
    /** Transaction result status */
    TransactionResult?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface XrplTransactionResult {
  /** Transaction hash */
  hash: string;
  /** Status from metadata */
  status: string;
  /** Raw result object */
  meta?: {
    TransactionResult?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}