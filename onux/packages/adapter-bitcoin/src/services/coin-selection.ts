/**
 * UTXO Coin Selection algorithms for Bitcoin transactions.
 *
 * Implements:
 * - Branch-and-Bound (BnB) — exact match finder, preferred algorithm per Core
 * - Knapsack — fallback when BnB fails to find exact match
 * - Single Random Draw (SRD) — final fallback for large targets
 *
 * References:
 * - Bitcoin Core PR #9213 (Branch and Bound)
 * - https://github.com/bitcoin/bitcoin/blob/master/doc/design/coin-selection.md
 */

/** UTXO as used by coin selection. */
export interface CoinSelectionUTXO {
  /** Transaction ID. */
  txid: string;
  /** Output index. */
  vout: number;
  /** Value in satoshis. */
  value: number;
  /** Fee for spending this UTXO (in satoshis). */
  fee: number;
  /** Number of confirmations. */
  confirmations?: number;
  /** Whether the UTXO is safe to spend. */
  safe?: boolean;
}

/** Result of coin selection. */
export interface CoinSelectionResult {
  /** Selected UTXOs. */
  utxos: CoinSelectionUTXO[];
  /** Total input value (satoshis). */
  totalInput: number;
  /** Total fee for spending selected UTXOs (satoshis). */
  totalFee: number;
  /** Change amount (satoshis, 0 if exact match). */
  change: number;
  /** Algorithm used. */
  algorithm: 'bnb' | 'knapsack' | 'single-random-draw';
  /** Whether the selection is an exact match (no change needed). */
  exactMatch: boolean;
}

/** Configuration for coin selection. */
export interface CoinSelectionConfig {
  /** Fee rate in sat/vB. */
  feeRate: number;
  /** Target amount in satoshis. */
  target: number;
  /** Change output cost in satoshis (feeRate * outputSize). */
  changeOutputCost?: number;
  /** Minimum change to create a change output (dust threshold). */
  minChange?: number;
  /** Maximum number of UTXOs to select (prevents too-large transactions). */
  maxUtxos?: number;
  /** BnB iteration depth limit. */
  bnbIterations?: number;
}

/**
 * Estimate the virtual size (vB) of a transaction input.
 * Varies by script type.
 */
function estimateInputVbytes(format: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2tr' = 'p2wpkh'): number {
  switch (format) {
    case 'p2pkh':
      return 148; // legacy
    case 'p2sh':
      return 91;  // nested segwit
    case 'p2wpkh':
      return 68;  // native segwit
    case 'p2tr':
      return 58;  // taproot
    default:
      return 68;
  }
}

/**
 * Calculate the effective value of a UTXO (value minus fee to spend it).
 */
function effectiveValue(utxo: CoinSelectionUTXO): number {
  return utxo.value - utxo.fee;
}

/**
 * Calculate the fee to spend a UTXO based on fee rate and input size.
 */
function calculateInputFee(feeRate: number, inputFormat: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2tr' = 'p2wpkh'): number {
  return Math.ceil(feeRate * estimateInputVbytes(inputFormat));
}

/**
 * Build CoinSelectionUTXOs from raw UTXOs with fee calculation.
 */
export function prepareUtxos(
  rawUtxos: Array<{ txid: string; vout: number; value: number; confirmations?: number }>,
  feeRate: number,
  inputFormat: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2tr' = 'p2wpkh',
): CoinSelectionUTXO[] {
  const inputFee = calculateInputFee(feeRate, inputFormat);
  return rawUtxos.map((u) => ({
    txid: u.txid,
    vout: u.vout,
    value: u.value,
    fee: inputFee,
    confirmations: u.confirmations,
    safe: (u.confirmations ?? 0) >= 1,
  }));
}

/* ─────────────────────────────────────────────────────────────── */
/*  Branch-and-Bound (BnB) Coin Selection                          */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Branch-and-Bound coin selection.
 *
 * Finds an exact-match subset of UTXOs that covers the target amount
 * plus fees, with no change output. This is the preferred algorithm
 * per Bitcoin Core because it avoids creating dust change outputs.
 *
 * Algorithm:
 * 1. Sort UTXOs by effective value descending
 * 2. Recursively explore inclusion/exclusion branches
 * 3. Prune branches that can't reach the target
 * 4. Return first exact match found
 *
 * @returns Exact match selection, or null if none found.
 */
export function branchAndBound(
  utxos: CoinSelectionUTXO[],
  config: CoinSelectionConfig,
): CoinSelectionResult | null {
  const maxIterations = config.bnbIterations ?? 100_000;
  const target = config.target;
  const changeOutputCost = config.changeOutputCost ?? Math.ceil(config.feeRate * 43); // P2WPKH output
  const minChange = config.minChange ?? 546; // dust threshold
  const maxUtxos = config.maxUtxos ?? 100;

  // Sort by effective value descending
  const sorted = [...utxos]
    .filter((u) => u.safe !== false && u.value > 0)
    .sort((a, b) => effectiveValue(b) - effectiveValue(a));

  if (sorted.length === 0) return null;

  // Calculate upper bound: sum of all effective values
  let upperBound = 0;
  for (const u of sorted) {
    upperBound += effectiveValue(u);
  }

  // If total available < target + min fee, impossible
  if (upperBound < target) return null;

  let iterationCount = 0;

  // BnB search
  const result = _bnbSearch(sorted, target, changeOutputCost, minChange, maxUtxos, maxIterations, () => {
    iterationCount++;
    return iterationCount <= maxIterations;
  });

  if (!result) return null;

  const totalInput = result.reduce((sum, u) => sum + u.value, 0);
  const totalFee = result.reduce((sum, u) => sum + u.fee, 0);

  return {
    utxos: result,
    totalInput,
    totalFee,
    change: 0,
    algorithm: 'bnb',
    exactMatch: true,
  };
}

/**
 * Internal BnB recursive search.
 * Uses backtracking with pruning.
 */
function _bnbSearch(
  utxos: CoinSelectionUTXO[],
  target: number,
  changeOutputCost: number,
  minChange: number,
  maxUtxos: number,
  maxIterations: number,
  canContinue: () => boolean,
): CoinSelectionUTXO[] | null {
  // Compute prefix sums for pruning
  const effValues = utxos.map((u) => effectiveValue(u));
  const suffixSum: number[] = new Array(utxos.length + 1).fill(0);
  for (let i = utxos.length - 1; i >= 0; i--) {
    suffixSum[i] = suffixSum[i + 1] + effValues[i];
  }

  // Selected indices
  const selected: number[] = [];
  let currentSum = 0;

  function backtrack(index: number): CoinSelectionUTXO[] | null {
    if (!canContinue()) return null;

    // Check if we have an exact match
    if (currentSum >= target) {
      // Exact match: currentSum is within [target, target + changeOutputCost + minChange)
      // If the "waste" is less than the cost of creating change, it's an exact match
      const waste = currentSum - target;
      if (waste <= changeOutputCost + minChange) {
        // This is considered an "exact match" — no change output needed
        return selected.map((i) => utxos[i]);
      }
    }

    // If we've gone through all UTXOs
    if (index >= utxos.length) return null;

    // Pruning: if remaining UTXOs can't reach target, backtrack
    if (currentSum + suffixSum[index] < target) return null;

    // Pruning: if we've selected too many UTXOs
    if (selected.length >= maxUtxos) return null;

    // Try including this UTXO
    const eff = effValues[index];
    if (currentSum + eff <= target + changeOutputCost + minChange) {
      selected.push(index);
      currentSum += eff;

      const result = backtrack(index + 1);
      if (result) return result;

      // Backtrack
      selected.pop();
      currentSum -= eff;
    }

    // Try excluding this UTXO (only if remaining can still reach target)
    if (currentSum + suffixSum[index + 1] >= target) {
      return backtrack(index + 1);
    }

    return null;
  }

  return backtrack(0);
}

/* ─────────────────────────────────────────────────────────────── */
/*  Knapsack Coin Selection (Fallback)                             */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Knapsack-style coin selection.
 *
 * Uses a randomized greedy approach similar to Bitcoin Core's
 * implementation. Selects UTXOs to minimize the change output
 * while ensuring enough value to cover the target + fees.
 *
 * Algorithm:
 * 1. Shuffle UTXOs
 * 2. Add UTXOs until target is met
 * 3. If the result has too much excess, try another iteration
 * 4. Keep the best result across iterations
 *
 * @returns Selection result, or null if insufficient funds.
 */
export function knapsack(
  utxos: CoinSelectionUTXO[],
  config: CoinSelectionConfig,
): CoinSelectionResult | null {
  const target = config.target;
  const changeOutputCost = config.changeOutputCost ?? Math.ceil(config.feeRate * 43);
  const minChange = config.minChange ?? 546;
  const maxUtxos = config.maxUtxos ?? 100;
  const maxIterations = config.bnbIterations ?? 100;

  // Filter safe UTXOs with positive effective value
  const safeUtxos = utxos
    .filter((u) => u.safe !== false && u.value > 0 && effectiveValue(u) > 0);

  if (safeUtxos.length === 0) return null;

  // Check if we have enough total
  const totalAvailable = safeUtxos.reduce((sum, u) => sum + effectiveValue(u), 0);
  if (totalAvailable < target) return null;

  let bestResult: CoinSelectionResult | null = null;
  let bestWaste = Infinity;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Shuffle
    const shuffled = [...safeUtxos];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Sort by effective value descending for deterministic behavior within shuffle
    shuffled.sort((a, b) => effectiveValue(b) - effectiveValue(a));

    const selected: CoinSelectionUTXO[] = [];
    let currentSum = 0;

    for (const u of shuffled) {
      if (selected.length >= maxUtxos) break;

      selected.push(u);
      currentSum += effectiveValue(u);

      if (currentSum >= target) break;
    }

    if (currentSum < target) continue; // Not enough in this iteration

    const totalInput = selected.reduce((sum, u) => sum + u.value, 0);
    const totalFee = selected.reduce((sum, u) => sum + u.fee, 0);
    const change = currentSum - target;

    // Skip if change is too small (would create dust)
    if (change > 0 && change < minChange + changeOutputCost) continue;

    // Calculate waste: fee + change (if change >= min change)
    const waste = totalFee + (change >= minChange ? change + changeOutputCost : change);

    if (waste < bestWaste) {
      bestWaste = waste;
      bestResult = {
        utxos: selected,
        totalInput,
        totalFee,
        change: change >= minChange ? change : 0,
        algorithm: 'knapsack',
        exactMatch: change === 0,
      };
    }

    // If we found an exact match, no need to continue
    if (bestResult?.exactMatch) break;
  }

  return bestResult;
}

/* ─────────────────────────────────────────────────────────────── */
/*  Single Random Draw (SRD) — Final Fallback                      */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Single Random Draw coin selection.
 *
 * Simplest algorithm: randomly select UTXOs until target is met.
 * Used as a final fallback when BnB and Knapsack both fail.
 *
 * This is essentially a "grab bag" approach — not optimal but
 * guaranteed to work if enough UTXOs are available.
 */
export function singleRandomDraw(
  utxos: CoinSelectionUTXO[],
  config: CoinSelectionConfig,
): CoinSelectionResult | null {
  const target = config.target;
  const minChange = config.minChange ?? 546;
  const maxUtxos = config.maxUtxos ?? 100;

  const safeUtxos = utxos
    .filter((u) => u.safe !== false && u.value > 0)
    .sort((a, b) => b.value - a.value); // Largest first as fallback

  const selected: CoinSelectionUTXO[] = [];
  let currentSum = 0;

  for (const u of safeUtxos) {
    if (selected.length >= maxUtxos) break;
    selected.push(u);
    currentSum += effectiveValue(u);
    if (currentSum >= target) break;
  }

  if (currentSum < target) return null;

  const totalInput = selected.reduce((sum, u) => sum + u.value, 0);
  const totalFee = selected.reduce((sum, u) => sum + u.fee, 0);
  const change = currentSum - target;

  return {
    utxos: selected,
    totalInput,
    totalFee,
    change: change >= minChange ? change : 0,
    algorithm: 'single-random-draw',
    exactMatch: change === 0,
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  High-level coin selection API                                  */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Select UTXOs for a target amount using the best available algorithm.
 *
 * Algorithm priority:
 * 1. Branch-and-Bound (exact match, no change)
 * 2. Knapsack (minimize waste)
 * 3. Single Random Draw (guaranteed if enough funds)
 *
 * @param utxos - Available UTXOs.
 * @param config - Selection configuration.
 * @returns Selection result.
 * @throws Error if insufficient funds.
 */
export function selectCoins(
  utxos: CoinSelectionUTXO[],
  config: CoinSelectionConfig,
): CoinSelectionResult {
  // Try BnB first (preferred — exact match)
  const bnbResult = branchAndBound(utxos, config);
  if (bnbResult) return bnbResult;

  // Fallback to Knapsack
  const knapsackResult = knapsack(utxos, config);
  if (knapsackResult) return knapsackResult;

  // Final fallback: Single Random Draw
  const srdResult = singleRandomDraw(utxos, config);
  if (srdResult) return srdResult;

  // Calculate total available for error message
  const totalAvailable = utxos
    .filter((u) => u.safe !== false)
    .reduce((sum, u) => sum + effectiveValue(u), 0);

  throw new Error(
    `Insufficient funds. Need ${config.target + calculateInputFee(config.feeRate)} satoshis ` +
    `(target: ${config.target} + fees), but only have ${totalAvailable} available.`,
  );
}
