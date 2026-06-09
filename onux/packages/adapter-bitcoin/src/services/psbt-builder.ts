/**
 * PSBT (Partially Signed Bitcoin Transaction) builder.
 *
 * Builds PSBT structures for Bitcoin transactions without requiring
 * bitcoinjs-lib. Produces a structured PSBT JSON that wallets can consume.
 *
 * For full PSBT binary encoding, the wallet/provider handles the actual
 * base64 PSBT encoding. This module produces the transaction structure.
 */

/** PSBT input descriptor. */
export interface PsbtInput {
  txid: string;
  vout: number;
  /** witnessUtxo for segwit inputs. */
  witnessUtxo?: {
    scriptPubKey: string;
    value: number;
  };
  /** nonWitnessUtxo for legacy inputs (full previous tx hex). */
  nonWitnessUtxo?: string;
  /** SIGHASH type (default: 0x01 = SIGHASH_ALL). */
  sighashType?: number;
  /** Derivation path for HD wallets. */
  bip32Derivation?: {
    pubkey: string;
    masterFingerprint: string;
    path: string;
  }[];
  /** Taproot internal key. */
  tapInternalKey?: string;
  /** Taproot leaf scripts. */
  tapLeafScript?: {
    controlBlock: string;
    script: string;
    leafVersion: number;
  }[];
}

/** PSBT output descriptor. */
export interface PsbtOutput {
  /** Pay-to-address output. */
  address?: string;
  /** Pay-to-script-hash output. */
  scriptPubKey?: string;
  /** Amount in satoshis. */
  value: number;
  /** BIP32 derivation for change outputs. */
  bip32Derivation?: {
    pubkey: string;
    masterFingerprint: string;
    path: string;
  }[];
}

/** PSBT global settings. */
export interface PsbtGlobal {
  /** PSBT version (default: 0). */
  version?: number;
  /** Locktime. */
  locktime?: number;
  /** Fee rate used for building (info only). */
  feeRate?: number;
  /** Total fee (info only). */
  fee?: number;
}

/** Complete PSBT descriptor. */
export interface PsbtDescriptor {
  /** Global PSBT settings. */
  global: PsbtGlobal;
  /** Inputs to spend. */
  inputs: PsbtInput[];
  /** Outputs to create. */
  outputs: PsbtOutput[];
  /** Total input value. */
  totalInput: number;
  /** Total output value. */
  totalOutput: number;
  /** Fee (difference). */
  fee: number;
}

/** Parameters for building a simple PSBT. */
export interface BuildPsbtParams {
  /** UTXOs to spend. */
  utxos: Array<{
    txid: string;
    vout: number;
    value: number;
    scriptPubKey?: string;
    address?: string;
    confirmations?: number;
  }>;
  /** Recipient address. */
  toAddress: string;
  /** Amount to send in satoshis. */
  amount: number;
  /** Change address (optional — auto-detected from first input if omitted). */
  changeAddress?: string;
  /** Fee rate in sat/vB. */
  feeRate: number;
  /** Address format of inputs. */
  inputFormat?: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2tr';
  /** Address format of change output. */
  changeFormat?: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2tr';
  /** Dust threshold (default: 546). */
  dustThreshold?: number;
  /** Locktime (default: 0). */
  locktime?: number;
}

/**
 * Estimate the vsize (virtual bytes) of a transaction.
 */
function estimateTxVsize(params: {
  numInputs: number;
  numOutputs: number;
  inputFormat?: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2tr';
}): number {
  const inputSizes: Record<string, number> = {
    p2pkh: 148,
    p2sh: 91,
    p2wpkh: 68,
    p2tr: 58,
  };
  const outputSize = 43; // P2WPKH output
  const overhead = 11;   // version + locktime + overhead

  const inputFormat = params.inputFormat ?? 'p2wpkh';
  return (
    overhead +
    params.numInputs * (inputSizes[inputFormat] ?? 68) +
    params.numOutputs * outputSize
  );
}

/**
 * Build a PSBT descriptor for a simple Bitcoin transfer.
 *
 * Creates a transaction with:
 * - One or more inputs from UTXOs
 * - One output to the recipient
 * - One change output (if change > dust threshold)
 *
 * @param params - Build parameters.
 * @returns PSBT descriptor ready for signing.
 */
export function buildPsbt(params: BuildPsbtParams): PsbtDescriptor {
  const dustThreshold = params.dustThreshold ?? 546;
  const inputFormat = params.inputFormat ?? 'p2wpkh';
  const changeFormat = params.changeFormat ?? inputFormat;

  // Estimate fee
  const vsize = estimateTxVsize({
    numInputs: params.utxos.length,
    numOutputs: 2, // recipient + change
    inputFormat,
  });
  const fee = Math.ceil(vsize * params.feeRate);

  // Build inputs
  const inputs: PsbtInput[] = params.utxos.map((utxo) => ({
    txid: utxo.txid,
    vout: utxo.vout,
    witnessUtxo: utxo.scriptPubKey
      ? {
          scriptPubKey: utxo.scriptPubKey,
          value: utxo.value,
        }
      : undefined,
  }));

  // Build outputs
  const outputs: PsbtOutput[] = [
    {
      address: params.toAddress,
      value: params.amount,
    },
  ];

  // Calculate change
  const totalInput = params.utxos.reduce((sum, u) => sum + u.value, 0);
  const change = totalInput - params.amount - fee;

  if (change > dustThreshold) {
    const changeAddr = params.changeAddress ?? params.utxos[0]?.address;
    if (changeAddr) {
      outputs.push({
        address: changeAddr,
        value: change,
      });
    }
  }

  const totalOutput = outputs.reduce((sum, o) => sum + o.value, 0);

  return {
    global: {
      version: 0,
      locktime: params.locktime ?? 0,
      feeRate: params.feeRate,
      fee,
    },
    inputs,
    outputs,
    totalInput,
    totalOutput,
    fee,
  };
}

/**
 * Build a PSBT descriptor for a multi-recipient transaction (batch send).
 */
export function buildMultiOutputPsbt(params: {
  utxos: Array<{
    txid: string;
    vout: number;
    value: number;
    scriptPubKey?: string;
    address?: string;
  }>;
  /** Array of { address, amount } recipients. */
  recipients: Array<{ address: string; amount: number }>;
  changeAddress?: string;
  feeRate: number;
  inputFormat?: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2tr';
  dustThreshold?: number;
}): PsbtDescriptor {
  if (params.recipients.length === 0) {
    throw new Error('At least one recipient is required');
  }

  const dustThreshold = params.dustThreshold ?? 546;
  const inputFormat = params.inputFormat ?? 'p2wpkh';

  // Estimate fee with multiple outputs
  const numOutputs = params.recipients.length + 1; // recipients + potential change
  const vsize = estimateTxVsize({
    numInputs: params.utxos.length,
    numOutputs,
    inputFormat,
  });
  const fee = Math.ceil(vsize * params.feeRate);

  // Build inputs
  const inputs: PsbtInput[] = params.utxos.map((utxo) => ({
    txid: utxo.txid,
    vout: utxo.vout,
    witnessUtxo: utxo.scriptPubKey
      ? { scriptPubKey: utxo.scriptPubKey, value: utxo.value }
      : undefined,
  }));

  // Build recipient outputs
  const outputs: PsbtOutput[] = params.recipients.map((r) => ({
    address: r.address,
    value: r.amount,
  }));

  // Calculate change
  const totalInput = params.utxos.reduce((sum, u) => sum + u.value, 0);
  const totalOutputValue = params.recipients.reduce((sum, r) => sum + r.amount, 0);
  const change = totalInput - totalOutputValue - fee;

  if (change > dustThreshold) {
    const changeAddr = params.changeAddress ?? params.utxos[0]?.address;
    if (changeAddr) {
      outputs.push({
        address: changeAddr,
        value: change,
      });
    }
  }

  const totalOutput = outputs.reduce((sum, o) => sum + o.value, 0);

  return {
    global: {
      version: 0,
      feeRate: params.feeRate,
      fee,
    },
    inputs,
    outputs,
    totalInput,
    totalOutput,
    fee,
  };
}

/**
 * Build an OP_RETURN output (for data inscription).
 * @param data - Raw data bytes or UTF-8 string.
 * @returns PSBT output with OP_RETURN script.
 */
export function buildOpReturnOutput(data: string | Uint8Array): PsbtOutput {
  const bytes = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data;

  // OP_RETURN <push> <data>
  // Script: 0x6a <length> <data>
  let scriptPubKey = '6a';
  if (bytes.length <= 75) {
    scriptPubKey += bytes.length.toString(16).padStart(2, '0');
  } else if (bytes.length <= 255) {
    scriptPubKey += '4c' + bytes.length.toString(16).padStart(2, '0');
  } else {
    throw new Error('OP_RETURN data too long (max 255 bytes)');
  }
  scriptPubKey += Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    scriptPubKey,
    value: 0,
  };
}

/**
 * Serialize a PSBT descriptor to a structured JSON string
 * that can be passed to wallet signPsbt methods.
 */
export function psbtToJson(descriptor: PsbtDescriptor): string {
  return JSON.stringify(descriptor, null, 2);
}

/**
 * Parse a PSBT from a structured JSON string.
 */
export function psbtFromJson(json: string): PsbtDescriptor {
  const parsed = JSON.parse(json) as PsbtDescriptor;
  if (!parsed.inputs || !parsed.outputs || !parsed.global) {
    throw new Error('Invalid PSBT JSON: missing required fields');
  }
  return parsed;
}
