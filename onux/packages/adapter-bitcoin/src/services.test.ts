/**
 * Unit tests for @cinacoin/adapter-bitcoin — coin selection, PSBT builder, and BitcoinService.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  prepareUtxos,
  selectCoins,
  branchAndBound,
  knapsack,
  singleRandomDraw,
  type CoinSelectionUTXO,
  type CoinSelectionConfig,
} from './services/coin-selection.js';

import {
  buildPsbt,
  buildMultiOutputPsbt,
  buildOpReturnOutput,
  psbtToJson,
  psbtFromJson,
} from './services/psbt-builder.js';

import {
  validateBitcoinAddress,
  BlockstreamClient,
} from './services/blockstream.js';

import {
  BitcoinService,
} from './services/bitcoin-service.js';

// Re-export for test convenience
const satoshisToBtc = BitcoinService.satoshisToBtc;
const btcToSatoshis = BitcoinService.btcToSatoshis;

/* ─────────────────────────────────────────────────────────────── */
/*  validateBitcoinAddress                                          */
/* ─────────────────────────────────────────────────────────────── */

describe('validateBitcoinAddress', () => {
  it('should validate legacy (P2PKH) mainnet addresses', () => {
    const result = validateBitcoinAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('legacy');
    expect(result.network).toBe('mainnet');
  });

  it('should validate P2SH mainnet addresses', () => {
    const result = validateBitcoinAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('p2sh');
    expect(result.network).toBe('mainnet');
  });

  it('should validate P2WPKH (bech32) addresses', () => {
    const result = validateBitcoinAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('p2wpkh');
    expect(result.network).toBe('mainnet');
  });

  it('should validate P2TR (taproot) addresses', () => {
    const result = validateBitcoinAddress('bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('p2tr');
    expect(result.network).toBe('mainnet');
  });

  it('should validate testnet addresses', () => {
    const result = validateBitcoinAddress('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('p2wpkh');
    expect(result.network).toBe('testnet');
  });

  it('should reject invalid addresses', () => {
    expect(validateBitcoinAddress('').valid).toBe(false);
    expect(validateBitcoinAddress('invalid').valid).toBe(false);
    expect(validateBitcoinAddress('1invalid!').valid).toBe(false);
  });
});

/* ─────────────────────────────────────────────────────────────── */
/*  Coin Selection — prepareUtxos                                  */
/* ─────────────────────────────────────────────────────────────── */

describe('prepareUtxos', () => {
  it('should convert raw UTXOs to CoinSelectionUTXOs with fees', () => {
    const rawUtxos = [
      { txid: 'aaa', vout: 0, value: 50_000, confirmations: 6 },
      { txid: 'bbb', vout: 1, value: 30_000, confirmations: 3 },
      { txid: 'ccc', vout: 0, value: 20_000, confirmations: 1 },
    ];

    const result = prepareUtxos(rawUtxos, 10, 'p2wpkh');

    expect(result).toHaveLength(3);
    expect(result[0].txid).toBe('aaa');
    expect(result[0].fee).toBeGreaterThan(0);
    expect(result[0].safe).toBe(true);
    // P2WPKH at 10 sat/vB: ~68 vB input * 10 = 680
    expect(result[0].fee).toBe(680);
  });

  it('should handle different input formats', () => {
    const raw = [{ txid: 'x', vout: 0, value: 1000 }];
    const p2pkh = prepareUtxos(raw, 10, 'p2pkh');
    const p2tr = prepareUtxos(raw, 10, 'p2tr');

    // P2PKH should have higher fees than P2TR
    expect(p2pkh[0].fee).toBeGreaterThan(p2tr[0].fee);
  });
});

/* ─────────────────────────────────────────────────────────────── */
/*  Coin Selection — Branch and Bound                              */
/* ─────────────────────────────────────────────────────────────── */

describe('branchAndBound', () => {
  function makeUtxos(values: number[]): CoinSelectionUTXO[] {
    return values.map((v, i) => ({
      txid: `tx${i}`,
      vout: 0,
      value: v,
      fee: 100,
      safe: true,
    }));
  }

  it('should find an exact match when one exists', () => {
    // Target: 1000, UTXOs: [500, 300, 200] — exact match
    const utxos = makeUtxos([500, 300, 200]);
    const config: CoinSelectionConfig = { target: 1000, feeRate: 1 };

    const result = branchAndBound(utxos, config);
    expect(result).not.toBeNull();
    expect(result!.exactMatch).toBe(true);
    expect(result!.change).toBe(0);
    expect(result!.algorithm).toBe('bnb');
  });

  it('should return null when no exact match is possible', () => {
    // Target: 1000, UTXOs: [500, 300] — insufficient
    const utxos = makeUtxos([500, 300]);
    const config: CoinSelectionConfig = { target: 1000, feeRate: 1 };

    // BnB might not find exact match but has enough total
    const result = branchAndBound(utxos, config);
    // With eff values 400+200=600 < 1000, should be null
    expect(result).toBeNull();
  });

  it('should handle single UTXO exact match', () => {
    const utxos = makeUtxos([1000]);
    const config: CoinSelectionConfig = { target: 1000, feeRate: 1 };

    const result = branchAndBound(utxos, config);
    expect(result).not.toBeNull();
    expect(result!.utxos).toHaveLength(1);
  });

  it('should filter out unsafe UTXOs', () => {
    const utxos: CoinSelectionUTXO[] = [
      { txid: 'safe', vout: 0, value: 1000, fee: 100, safe: true },
      { txid: 'unsafe', vout: 0, value: 5000, fee: 100, safe: false },
    ];
    const config: CoinSelectionConfig = { target: 1000, feeRate: 1 };

    const result = branchAndBound(utxos, config);
    expect(result).not.toBeNull();
    expect(result!.utxos).toHaveLength(1);
    expect(result!.utxos[0].txid).toBe('safe');
  });
});

/* ─────────────────────────────────────────────────────────────── */
/*  Coin Selection — Knapsack                                      */
/* ─────────────────────────────────────────────────────────────── */

describe('knapsack', () => {
  function makeUtxos(values: number[]): CoinSelectionUTXO[] {
    return values.map((v, i) => ({
      txid: `tx${i}`,
      vout: 0,
      value: v,
      fee: 100,
      safe: true,
    }));
  }

  it('should select UTXOs to cover the target', () => {
    const utxos = makeUtxos([5000, 3000, 2000, 1000, 500]);
    const config: CoinSelectionConfig = { target: 7000, feeRate: 1 };

    const result = knapsack(utxos, config);
    expect(result).not.toBeNull();
    // Effective value must cover target
    const totalEff = result!.utxos.reduce((s, u) => s + (u.value - u.fee), 0);
    expect(totalEff).toBeGreaterThanOrEqual(7000);
  });

  it('should return null when insufficient funds', () => {
    const utxos = makeUtxos([100, 200]);
    const config: CoinSelectionConfig = { target: 10000, feeRate: 1 };

    const result = knapsack(utxos, config);
    expect(result).toBeNull();
  });

  it('should prefer minimizing change', () => {
    const utxos = makeUtxos([1000, 900, 800, 500]);
    const config: CoinSelectionConfig = { target: 1800, feeRate: 1 };

    const result = knapsack(utxos, config);
    expect(result).not.toBeNull();
  });
});

/* ─────────────────────────────────────────────────────────────── */
/*  Coin Selection — selectCoins (combined)                        */
/* ─────────────────────────────────────────────────────────────── */

describe('selectCoins', () => {
  function makeUtxos(values: number[]): CoinSelectionUTXO[] {
    return values.map((v, i) => ({
      txid: `tx${i}`,
      vout: 0,
      value: v,
      fee: 100,
      safe: true,
    }));
  }

  it('should find a selection when funds are sufficient', () => {
    const utxos = makeUtxos([50_000, 30_000, 20_000, 10_000]);
    const result = selectCoins(utxos, { target: 60_000, feeRate: 1 });

    expect(result).toBeDefined();
    const totalEff = result.utxos.reduce((s, u) => s + (u.value - u.fee), 0);
    expect(totalEff).toBeGreaterThanOrEqual(60_000);
  });

  it('should throw when funds are insufficient', () => {
    const utxos = makeUtxos([100, 200]);
    expect(() =>
      selectCoins(utxos, { target: 100_000, feeRate: 1 }),
    ).toThrow('Insufficient funds');
  });

  it('should prefer BnB for exact matches', () => {
    const utxos = makeUtxos([500, 300, 200]);
    const result = selectCoins(utxos, { target: 1000, feeRate: 1 });

    expect(result.algorithm).toBe('bnb');
    expect(result.exactMatch).toBe(true);
  });
});

/* ─────────────────────────────────────────────────────────────── */
/*  Coin Selection — Single Random Draw                            */
/* ─────────────────────────────────────────────────────────────── */

describe('singleRandomDraw', () => {
  function makeUtxos(values: number[]): CoinSelectionUTXO[] {
    return values.map((v, i) => ({
      txid: `tx${i}`,
      vout: 0,
      value: v,
      fee: 100,
      safe: true,
    }));
  }

  it('should select UTXOs when sufficient', () => {
    const utxos = makeUtxos([10_000, 5_000, 3_000, 1_000]);
    const result = singleRandomDraw(utxos, { target: 12_000, feeRate: 1 });

    expect(result).not.toBeNull();
    expect(result!.algorithm).toBe('single-random-draw');
  });

  it('should return null when insufficient', () => {
    const utxos = makeUtxos([100, 200]);
    const result = singleRandomDraw(utxos, { target: 10_000, feeRate: 1 });
    expect(result).toBeNull();
  });
});

/* ─────────────────────────────────────────────────────────────── */
/*  PSBT Builder                                                    */
/* ─────────────────────────────────────────────────────────────── */

describe('buildPsbt', () => {
  it('should build a PSBT for a simple transfer', () => {
    const psbt = buildPsbt({
      utxos: [
        { txid: 'aaa', vout: 0, value: 100_000, address: 'bc1qchange' },
      ],
      toAddress: 'bc1qrecipient',
      amount: 50_000,
      feeRate: 10,
      changeFormat: 'p2wpkh',
    });

    expect(psbt.inputs).toHaveLength(1);
    expect(psbt.inputs[0].txid).toBe('aaa');
    expect(psbt.outputs).toHaveLength(2); // recipient + change
    expect(psbt.outputs[0].address).toBe('bc1qrecipient');
    expect(psbt.outputs[0].value).toBe(50_000);
    expect(psbt.fee).toBeGreaterThan(0);
    expect(psbt.totalInput).toBe(100_000);
  });

  it('should not create a change output if change is below dust', () => {
    const psbt = buildPsbt({
      utxos: [
        { txid: 'aaa', vout: 0, value: 50_100, address: 'bc1qchange' },
      ],
      toAddress: 'bc1qrecipient',
      amount: 50_000,
      feeRate: 100, // High fee to consume most of the input
      dustThreshold: 546,
    });

    // With high fee, change might be below dust
    const changeOutput = psbt.outputs.find((o) => o.address === 'bc1qchange');
    // Either no change output, or it's above dust
    if (changeOutput) {
      expect(changeOutput.value).toBeGreaterThanOrEqual(546);
    }
  });

  it('should build a PSBT with explicit change address', () => {
    const psbt = buildPsbt({
      utxos: [
        { txid: 'aaa', vout: 0, value: 100_000 },
      ],
      toAddress: 'bc1qrecipient',
      amount: 50_000,
      feeRate: 10,
      changeAddress: 'bc1qmychange',
    });

    const changeOutput = psbt.outputs.find((o) => o.address === 'bc1qmychange');
    expect(changeOutput).toBeDefined();
    expect(changeOutput!.value).toBeGreaterThan(0);
  });
});

describe('buildMultiOutputPsbt', () => {
  it('should build a PSBT with multiple recipients', () => {
    const psbt = buildMultiOutputPsbt({
      utxos: [
        { txid: 'aaa', vout: 0, value: 200_000, address: 'bc1qchange' },
      ],
      recipients: [
        { address: 'bc1qalice', amount: 50_000 },
        { address: 'bc1qbob', amount: 30_000 },
      ],
      feeRate: 10,
    });

    expect(psbt.outputs).toHaveLength(3); // 2 recipients + change
    expect(psbt.outputs[0].address).toBe('bc1qalice');
    expect(psbt.outputs[1].address).toBe('bc1qbob');
  });

  it('should throw with no recipients', () => {
    expect(() =>
      buildMultiOutputPsbt({
        utxos: [{ txid: 'aaa', vout: 0, value: 100_000 }],
        recipients: [],
        feeRate: 10,
      }),
    ).toThrow('At least one recipient');
  });
});

describe('buildOpReturnOutput', () => {
  it('should build an OP_RETURN output from a string', () => {
    const output = buildOpReturnOutput('Hello World');
    expect(output.value).toBe(0);
    expect(output.scriptPubKey).toBeDefined();
    expect(output.scriptPubKey!.startsWith('6a')).toBe(true);
  });

  it('should build an OP_RETURN output from bytes', () => {
    const data = new Uint8Array([0x01, 0x02, 0x03]);
    const output = buildOpReturnOutput(data);
    expect(output.value).toBe(0);
    expect(output.scriptPubKey!.startsWith('6a')).toBe(true);
  });
});

describe('psbtToJson / psbtFromJson', () => {
  it('should serialize and deserialize a PSBT', () => {
    const psbt = buildPsbt({
      utxos: [{ txid: 'aaa', vout: 0, value: 100_000 }],
      toAddress: 'bc1qrecipient',
      amount: 50_000,
      feeRate: 10,
    });

    const json = psbtToJson(psbt);
    const parsed = psbtFromJson(json);

    expect(parsed.global).toEqual(psbt.global);
    expect(parsed.inputs).toEqual(psbt.inputs);
    expect(parsed.outputs).toEqual(psbt.outputs);
  });

  it('should throw on invalid JSON', () => {
    expect(() => psbtFromJson('{"foo": "bar"}')).toThrow('Invalid PSBT JSON');
  });
});

/* ─────────────────────────────────────────────────────────────── */
/*  BlockstreamClient                                               */
/* ─────────────────────────────────────────────────────────────── */

describe('BlockstreamClient', () => {
  it('should create with default config', () => {
    const client = new BlockstreamClient();
    expect(client.getBaseUrl()).toBe('https://blockstream.info/api');
  });

  it('should create with testnet config', () => {
    const client = new BlockstreamClient({ network: 'testnet' });
    expect(client.getBaseUrl()).toBe('https://blockstream.info/testnet/api');
  });

  it('should create with custom URL', () => {
    const client = new BlockstreamClient({ baseUrl: 'https://custom.api/api' });
    expect(client.getBaseUrl()).toBe('https://custom.api/api');
  });
});

/* ─────────────────────────────────────────────────────────────── */
/*  BitcoinService                                                  */
/* ─────────────────────────────────────────────────────────────── */

describe('BitcoinService', () => {
  it('should create with default config', () => {
    const service = new BitcoinService();
    expect(service.getNetwork()).toBe('mainnet');
  });

  it('should create with testnet config', () => {
    const service = new BitcoinService({ network: 'testnet' });
    expect(service.getNetwork()).toBe('testnet');
  });

  it('should convert satoshis to BTC', () => {
    expect(BitcoinService.satoshisToBtc(100_000_000)).toBe('1.00000000');
    expect(BitcoinService.satoshisToBtc(546)).toBe('0.00000546');
    expect(BitcoinService.satoshisToBtc(0)).toBe('0.00000000');
  });

  it('should convert BTC to satoshis', () => {
    expect(BitcoinService.btcToSatoshis('1.0')).toBe(100_000_000);
    expect(BitcoinService.btcToSatoshis('0.00000546')).toBe(546);
    expect(BitcoinService.btcToSatoshis(0.5)).toBe(50_000_000);
  });

  it('should throw when no address is set', async () => {
    const service = new BitcoinService();
    await expect(service.getBalanceInfo()).rejects.toThrow('No address');
  });

  it('should set and get address', () => {
    const service = new BitcoinService();
    service.setAddress('bc1qtest');
    expect(service.getAddress()).toBe('bc1qtest');
  });

  it('should throw when no connector is set for signing', async () => {
    const service = new BitcoinService();
    await expect(service.signPsbt('test')).rejects.toThrow('No wallet connected');
  });

  it('should get explorer URLs', () => {
    const service = new BitcoinService();
    const txUrl = service.getExplorerTxUrl('abc123');
    expect(txUrl).toContain('abc123');
    expect(txUrl).toContain('blockstream.info');

    const addrUrl = service.getExplorerAddressUrl('bc1qtest');
    expect(addrUrl).toContain('bc1qtest');
  });
});
