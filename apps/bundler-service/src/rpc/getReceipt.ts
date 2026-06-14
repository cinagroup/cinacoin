import { Env, UserOperationReceipt } from '../types';

/**
 * eth_getUserOperationReceipt
 * Returns the receipt of a UserOperation by its hash.
 */
export async function getUserOperationReceipt(
  userOpHash: string,
  env: Env
): Promise<UserOperationReceipt | null> {
  const row = await env.BUNDLER_DB.prepare(
    `SELECT * FROM user_operations WHERE hash = ?`
  ).bind(userOpHash).first();

  if (!row) return null;

  const status = row.status as string;

  if (status === 'pending') {
    return null; // Not yet mined
  }

  return {
    userOpHash,
    entryPoint: row.entry_point as string,
    sender: row.sender as string,
    nonce: row.nonce as string,
    paymaster: '0x0000000000000000000000000000000000000000',
    actualGasCost: '0x0',
    actualGasUsed: '0x0',
    success: status === 'submitted',
    logs: [],
    receipt: {
      transactionHash: (row.tx_hash as string) || '0x' + '0'.repeat(64),
      blockNumber: '0x0',
      blockHash: '0x' + '0'.repeat(64),
    },
  };
}
