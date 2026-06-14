import { Env, UserOperation } from '../types';

/**
 * Durable Object for managing the UserOperation mempool.
 * Batches pending operations and submits them on-chain.
 */
export class MempoolDO {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/add': {
        const userOp = await request.json() as UserOperation;
        // Add to mempool storage
        const storage = this.state.storage;
        const pending = (await storage.get<UserOperation[]>('pending')) || [];
        pending.push(userOp);
        await storage.put('pending', pending);
        return new Response(JSON.stringify({ success: true, count: pending.length }));
      }

      case '/batch': {
        const storage = this.state.storage;
        const pending = (await storage.get<UserOperation[]>('pending')) || [];
        // Return batch for on-chain submission
        return new Response(JSON.stringify({ operations: pending }));
      }

      case '/clear': {
        const storage = this.state.storage;
        await storage.put('pending', []);
        return new Response(JSON.stringify({ success: true }));
      }

      default:
        return new Response('Not found', { status: 404 });
    }
  }
}
