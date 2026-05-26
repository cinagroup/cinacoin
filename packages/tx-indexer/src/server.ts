/**
 * REST API server for @cinacoin/tx-indexer.
 *
 * Minimal HTTP server exposing indexed events via REST endpoints.
 * Uses Node.js native `http` module — no framework dependency.
 */

import http from 'node:http';
import { TxIndexer } from './indexer.js';
import type { IndexerConfig, ApiHealthStatus, RestApiConfig } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(payload);
}

function parseUrl(url: string): { pathname: string; searchParams: URLSearchParams } {
  const u = new URL(url, 'http://localhost');
  return { pathname: u.pathname, searchParams: u.searchParams };
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

export class IndexerServer {
  private indexer: TxIndexer;
  private config: RestApiConfig;
  private httpServer: http.Server | null = null;

  constructor(indexerConfig: IndexerConfig, serverConfig: RestApiConfig) {
    this.indexer = new TxIndexer(indexerConfig);
    this.config = serverConfig;
  }

  /** Start the HTTP server and the indexer. */
  async start(): Promise<void> {
    await this.indexer.start();

    this.httpServer = http.createServer((req, res) => this.handleRequest(req, res));

    const host = this.config.host ?? '0.0.0.0';
    const port = this.config.port;

    await new Promise<void>((resolve) => {
      this.httpServer!.listen(port, host, () => {
        console.log(`[IndexerServer] Listening on ${host}:${port}${this.config.basePath ?? '/api/v1'}`);
        resolve();
      });
    });
  }

  /** Stop the server and indexer. */
  stop(): void {
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
    }
    this.indexer.close();
  }

  /** Get the underlying indexer instance. */
  getIndexer(): TxIndexer {
    return this.indexer;
  }

  // -- Request handling ----------------------------------------------------

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    const { pathname, searchParams } = parseUrl(req.url ?? '/');
    const basePath = this.config.basePath ?? '/api/v1';

    try {
      // Health
      if (pathname === `${basePath}/health`) {
        await this.handleHealth(res);
        return;
      }

      // Events
      if (pathname === `${basePath}/events`) {
        await this.handleEvents(searchParams, res);
        return;
      }

      // Single event
      const eventMatch = pathname.match(/^\/api\/v1\/events\/(.+)$/);
      if (eventMatch) {
        this.handleEventById(eventMatch[1], res);
        return;
      }

      // Chain states
      if (pathname === `${basePath}/chains`) {
        this.handleChains(res);
        return;
      }

      // Not found
      jsonResponse(res, 404, { error: 'Not found', path: pathname });
    } catch (err) {
      console.error('[IndexerServer] Error:', err);
      jsonResponse(res, 500, { error: 'Internal server error' });
    }
  }

  // -- Handlers ------------------------------------------------------------

  private async handleHealth(res: http.ServerResponse): Promise<void> {
    const states = this.indexer.getChainStates();
    const status: ApiHealthStatus = {
      status: this.indexer.isRunning() ? 'ok' : 'error',
      indexedChains: states.map((s) => ({
        chainId: s.chainId,
        name: s.chainId === 1 ? 'Ethereum' : s.chainId === 137 ? 'Polygon' : s.chainId === 56 ? 'BSC' : `Chain ${s.chainId}`,
        latestIndexedBlock: s.latestBlock,
        chainHeadBlock: s.latestBlock, // would require RPC call for real head
        lag: 0,
        lastUpdated: s.lastUpdated,
      })),
      totalEvents: this.indexer.getTotalEvents(),
      uptime: this.indexer.getUptime(),
    };
    jsonResponse(res, 200, status);
  }

  private handleEvents(params: URLSearchParams, res: http.ServerResponse): void {
    const q = {
      address: params.get('address') as any,
      chainId: params.has('chainId') ? Number(params.get('chainId')) : undefined,
      eventType: params.get('eventType') as any,
      tokenAddress: params.get('tokenAddress') as any,
      timeFrom: params.has('timeFrom') ? Number(params.get('timeFrom')) : undefined,
      timeTo: params.has('timeTo') ? Number(params.get('timeTo')) : undefined,
      blockFrom: params.has('blockFrom') ? Number(params.get('blockFrom')) : undefined,
      blockTo: params.has('blockTo') ? Number(params.get('blockTo')) : undefined,
      limit: params.has('limit') ? Number(params.get('limit')) : undefined,
      offset: params.has('offset') ? Number(params.get('offset')) : undefined,
      sortOrder: (params.get('sortOrder') as 'asc' | 'desc') ?? 'desc',
    };

    const result = this.indexer.queryEvents(q);
    jsonResponse(res, 200, result);
  }

  private handleEventById(id: string, res: http.ServerResponse): void {
    const result = this.indexer.queryEvents({});
    const event = result.events.find((e) => e.id === id);
    if (!event) {
      jsonResponse(res, 404, { error: 'Event not found', id });
      return;
    }
    jsonResponse(res, 200, event);
  }

  private handleChains(res: http.ServerResponse): void {
    const states = this.indexer.getChainStates();
    jsonResponse(res, 200, { chains: states });
  }
}

/** Convenience: create and start an indexer server. */
export async function createIndexerServer(
  indexerConfig: IndexerConfig,
  serverConfig: RestApiConfig,
): Promise<IndexerServer> {
  const server = new IndexerServer(indexerConfig, serverConfig);
  await server.start();
  return server;
}
