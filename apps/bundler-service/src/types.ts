export interface Env {
  ENTRY_POINT_V07: string;
  BUNDLER_PRIVATE_KEY_VAR: string;
  BUNDLER_DB: D1Database;
  MEMPOOL: DurableObjectNamespace;
}

export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

export interface UserOperationReceipt {
  userOpHash: string;
  entryPoint: string;
  sender: string;
  nonce: string;
  paymaster: string;
  actualGasCost: string;
  actualGasUsed: string;
  success: boolean;
  logs: Array<{
    address: string;
    topics: string[];
    data: string;
  }>;
  receipt: {
    transactionHash: string;
    blockNumber: string;
    blockHash: string;
  };
}

export interface JsonRpcRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params: unknown[];
}

export interface JsonRpcResponse {
  jsonrpc: string;
  id: number | string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}
