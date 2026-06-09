/**
 * Safe (Gnosis Safe) transaction decoder.
 * Decodes and encodes Safe multisig transaction data.
 */

// ── Types ──────────────────────────────────────────────────

export interface SafeTransaction {
  to: string;
  value: bigint;
  data: string;
  operation: number; // 0 = call, 1 = delegateCall
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: string;
  refundReceiver: string;
  nonce: bigint;
}

export interface DecodedCall {
  method: string;
  params: DecodedParam[];
}

export interface DecodedParam {
  name: string;
  type: string;
  value: unknown;
}

export interface DecodedTransaction {
  raw: SafeTransaction;
  call?: DecodedCall;
  safeAddress: string;
  chainId: number;
}

// ── ABI snippets for common decoding ───────────────────────

const ERC20_ABI_APPROVE = "0x095ea7b3";
const ERC20_ABI_TRANSFER = "0xa9059c5b";
const ERC20_ABI_TRANSFER_FROM = "0x23b872dd";

// ── Decoder ────────────────────────────────────────────────

export class SafeDecoder {
  private safeAddress: string;
  private chainId: number;

  constructor(safeAddress: string, chainId: number = 1) {
    this.safeAddress = normalizeAddress(safeAddress);
    this.chainId = chainId;
  }

  /**
   * Get the Safe address this decoder is bound to.
   */
  getSafeAddress(): string {
    return this.safeAddress;
  }

  /**
   * Decode raw Safe transaction data into a structured representation.
   */
  decodeTransaction(tx: SafeTransaction): DecodedTransaction {
    const decoded: DecodedTransaction = {
      raw: tx,
      safeAddress: this.safeAddress,
      chainId: this.chainId,
    };

    // Try to decode the call data
    if (tx.data && tx.data !== "0x" && tx.data.length > 10) {
      decoded.call = this.decodeCalldata(tx.data);
    }

    return decoded;
  }

  /**
   * Encode a Safe transaction into hex data bytes.
   */
  encodeTransaction(tx: SafeTransaction): string {
    const parts: string[] = [
      padHex(toHex(tx.to)),
      padHex(toHexValue(tx.value)),
      tx.data.startsWith("0x") ? tx.data.slice(2) : tx.data,
      toHex(tx.operation).slice(2).padStart(2, "0"),
      padHex(toHexValue(tx.safeTxGas)),
      padHex(toHexValue(tx.baseGas)),
      padHex(toHexValue(tx.gasPrice)),
      padHex(toHex(tx.gasToken)),
      padHex(toHex(tx.refundReceiver)),
      padHex(toHexValue(tx.nonce)),
    ];
    return "0x" + parts.join("");
  }

  // ── Private helpers ──────────────────────────────────────

  private decodeCalldata(data: string): DecodedCall {
    const selector = data.slice(0, 10).toLowerCase();

    switch (selector) {
      case ERC20_ABI_APPROVE:
        return {
          method: "approve",
          params: [
            { name: "spender", type: "address", value: decodeAddress(data.slice(10, 74)) },
            { name: "amount", type: "uint256", value: decodeBigInt(data.slice(74, 138)) },
          ],
        };

      case ERC20_ABI_TRANSFER:
        return {
          method: "transfer",
          params: [
            { name: "recipient", type: "address", value: decodeAddress(data.slice(10, 74)) },
            { name: "amount", type: "uint256", value: decodeBigInt(data.slice(74, 138)) },
          ],
        };

      case ERC20_ABI_TRANSFER_FROM:
        return {
          method: "transferFrom",
          params: [
            { name: "sender", type: "address", value: decodeAddress(data.slice(10, 74)) },
            { name: "recipient", type: "address", value: decodeAddress(data.slice(74, 138)) },
            { name: "amount", type: "uint256", value: decodeBigInt(data.slice(138, 202)) },
          ],
        };

      default:
        return {
          method: "unknown",
          params: [{ name: "rawData", type: "bytes", value: data }],
        };
    }
  }
}

// ── Utility functions ──────────────────────────────────────

function normalizeAddress(addr: string): string {
  const cleaned = addr.toLowerCase().replace(/^0x/, "");
  if (cleaned.length !== 40) {
    throw new Error(`Invalid address length: ${addr}`);
  }
  return "0x" + cleaned;
}

function toHex(val: string | bigint | number): string {
  if (typeof val === "bigint") {
    return "0x" + val.toString(16);
  }
  if (typeof val === "number") {
    return "0x" + val.toString(16);
  }
  return val.startsWith("0x") ? val : "0x" + val;
}

function toHexValue(val: bigint): string {
  return val.toString(16).padStart(64, "0");
}

function padHex(hex: string): string {
  const cleaned = hex.replace(/^0x/, "");
  return cleaned.padStart(64, "0");
}

function decodeAddress(hex: string): string {
  return "0x" + hex.slice(-40);
}

function decodeBigInt(hex: string): bigint {
  return BigInt("0x" + hex);
}
