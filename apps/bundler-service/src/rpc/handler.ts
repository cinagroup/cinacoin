import { Env, JsonRpcRequest, JsonRpcResponse, UserOperation } from '../types';
import { sendUserOperation } from './sendUserOperation';
import { estimateUserOperationGas } from './estimateGas';
import { getUserOperationReceipt } from './getReceipt';
import { getSupportedEntryPoints } from './supportedEntryPoints';

export async function handleRpcRequest(
  req: JsonRpcRequest,
  env: Env
): Promise<JsonRpcResponse> {
  const { id, method, params } = req;

  try {
    let result: unknown;

    switch (method) {
      case 'eth_sendUserOperation':
        result = await sendUserOperation(
          params[0] as UserOperation,
          params[1] as string,
          env
        );
        break;

      case 'eth_estimateUserOperationGas':
        result = await estimateUserOperationGas(
          params[0] as UserOperation,
          params[1] as string,
          env
        );
        break;

      case 'eth_getUserOperationReceipt':
        result = await getUserOperationReceipt(params[0] as string, env);
        break;

      case 'eth_supportedEntryPoints':
        result = getSupportedEntryPoints(env);
        break;

      case 'eth_chainId':
        result = '0x1'; // Ethereum mainnet
        break;

      case 'eth_getUserOperationByHash':
        // TODO: implement
        result = null;
        break;

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        };
    }

    return { jsonrpc: '2.0', id, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32500, message },
    };
  }
}
