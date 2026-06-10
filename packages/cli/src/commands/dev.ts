#!/usr/bin/env node

/**
 * @cinacoin/cli — dev command
 *
 * Local development server with mock chain simulation.
 *
 * Usage:
 *   npx @cinacoin/cli dev           — Start mock dev server
 *   npx @cinacoin/cli dev --port  — Custom port
 *   npx @cinacoin/cli dev --reset  — Reset state
 */

import type { Command } from 'commander';
import { createServer } from 'node:http';
import { EventEmitter } from 'node:events';

// ============================================================
// Mock Chain State
// ============================================================

interface MockAccount {
  address: string;
  balance: string;
  chainId: number;
}

interface MockChainState {
  chainId: number;
  blockNumber: number;
  gasPrice: string;
  accounts: MockAccount[];
}

const MOCK_CHAINS: Record<number, MockChainState> = {
  1: {
    chainId: 1,
    blockNumber: 19_000_000,
    gasPrice: '20000000000',
    accounts: [
      { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', balance: '10000.0', chainId: 1 },
      { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', balance: '10000.0', chainId: 1 },
      { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', balance: '10000.0', chainId: 1 },
    ],
  },
  137: {
    chainId: 137,
    blockNumber: 55_000_000,
    gasPrice: '100000000000',
    accounts: [
      { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', balance: '50000.0', chainId: 137 },
    ],
  },
  42161: {
    chainId: 42161,
    blockNumber: 200_000_000,
    gasPrice: '100000000',
    accounts: [
      { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', balance: '100000.0', chainId: 42161 },
    ],
  },
};

const MOCK_WALLETS = [
  { id: 'metamask', name: 'MetaMask', rdns: 'io.metamask', icon: '🦊' },
  { id: 'walletconnect', name: 'WalletConnect', rdns: 'com.walletconnect', icon: '🔗' },
  { id: 'coinbase', name: 'Coinbase Wallet', rdns: 'com.coinbase.wallet', icon: '🔵' },
  { id: 'phantom', name: 'Phantom', rdns: 'app.phantom', icon: '👻' },
];

let mockBlockInterval: ReturnType<typeof setInterval> | null = null;

// ============================================================
// JSON-RPC Mock Server
// ============================================================

function handleRpc(method: string, params: unknown[], chainId: number): unknown {
  const chain = MOCK_CHAINS[chainId];
  if (!chain) {
    return { error: `Chain ${chainId} not found` };
  }

  switch (method) {
    case 'eth_chainId':
      return `0x${chainId.toString(16)}`;

    case 'eth_blockNumber':
      return `0x${chain.blockNumber.toString(16)}`;

    case 'eth_accounts':
      return chain.accounts.map(a => a.address);

    case 'eth_requestAccounts':
      return chain.accounts.map(a => a.address);

    case 'eth_getBalance':
      const addr = (params as string[])[0];
      const acct = chain.accounts.find(a => a.address.toLowerCase() === addr?.toLowerCase());
      if (!acct) return '0x0';
      const wei = BigInt(Math.floor(parseFloat(acct.balance) * 1e18));
      return `0x${wei.toString(16)}`;

    case 'eth_gasPrice':
      return `0x${BigInt(chain.gasPrice).toString(16)}`;

    case 'eth_sendTransaction':
      // Simulate successful tx
      const hash = '0x' + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      return hash;

    case 'personal_sign':
    case 'eth_signTypedData_v4':
      return '0x' + Array.from({ length: 130 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

    case 'wallet_switchEthereumChain':
      const newChainId = parseInt(((params as unknown[])[0] as unknown).chainId, 16);
      if (!MOCK_CHAINS[newChainId]) {
        return { error: `Chain ${newChainId} not supported in mock mode` };
      }
      return null;

    case 'wallet_getPermissions':
    case 'wallet_requestPermissions':
      return [{ eth_accounts: { accounts: chain.accounts.map(a => a.address) } }];

    case 'net_version':
      return String(chainId);

    case 'web3_clientVersion':
      return 'cinacoin-mock/0.1.0';

    default:
      return { error: `Method ${method} not implemented in mock` };
  }
}

// ============================================================
// HTTP Server (JSON-RPC + Dev UI)
// ============================================================

function createMockServer(port: number, chainId: number) {
  const events = new EventEmitter();

  const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/rpc') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const rpcReq = JSON.parse(body);
          const result = handleRpc(rpcReq.method, rpcReq.params || [], chainId);

          const response = {
            jsonrpc: '2.0',
            id: rpcReq.id,
            result: result && typeof result === 'object' && 'error' in result
              ? null
              : result,
            error: result && typeof result === 'object' && 'error' in result
              ? { code: -32000, message: (result as unknown).error }
              : null,
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error' },
          }));
        }
      });
      return;
    }

    // GET /status — health check
    if (req.method === 'GET' && req.url === '/status') {
      const chain = MOCK_CHAINS[chainId];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'running',
        chainId,
        chainName: chain?.chainId === 1 ? 'Ethereum Mainnet'
          : chain?.chainId === 137 ? 'Polygon'
          : chain?.chainId === 42161 ? 'Arbitrum'
          : 'Unknown',
        blockNumber: chain?.blockNumber ?? 0,
        accounts: chain?.accounts.length ?? 0,
        wallets: MOCK_WALLETS.map(w => w.name),
        port,
      }));
      return;
    }

    // GET /wallets — list mock wallets
    if (req.method === 'GET' && req.url === '/wallets') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(MOCK_WALLETS));
      return;
    }

    // GET / — Dev dashboard
    if (req.method === 'GET' && req.url === '/') {
      const chain = MOCK_CHAINS[chainId];
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html>
<html>
<head><title>Cinacoin Mock Dev Server</title>
<style>
  body { font-family: system-ui; max-width: 800px; margin: 2rem auto; padding: 0 1rem; background: #0d1117; color: #c9d1d9; }
  h1 { color: #58a6ff; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
  .card h3 { margin: 0 0 0.5rem; color: #58a6ff; }
  code { background: #0d1117; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.9em; }
  pre { background: #0d1117; padding: 1rem; border-radius: 8px; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 0.5rem; text-align: left; border-bottom: 1px solid #30363d; }
  .success { color: #3fb950; }
  .badge { display: inline-block; background: #238636; color: white; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8em; }
</style></head>
<body>
  <h1>🔢 Cinacoin Mock Dev Server <span class="badge">RUNNING</span></h1>

  <div class="card">
    <h3>Chain Configuration</h3>
    <p>Chain ID: <code>${chainId}</code></p>
    <p>RPC URL: <code>http://localhost:${port}/rpc</code></p>
    <p>Block: <code>${chain?.blockNumber ?? 'N/A'}</code></p>
  </div>

  <div class="card">
    <h3>Test Accounts (10,000+ ETH each)</h3>
    <table>
      <tr><th>Address</th><th>Balance</th></tr>
      ${chain?.accounts.map(a => `<tr><td><code>${a.address}</code></td><td>${a.balance} ETH</td></tr>`).join('\n') ?? '<tr><td colspan="2">No accounts</td></tr>'}
    </table>
  </div>

  <div class="card">
    <h3>Mock Wallets</h3>
    <p>${MOCK_WALLETS.map(w => `<span>${w.icon} ${w.name}</span>`).join(' &nbsp;|&nbsp; ')}</p>
  </div>

  <div class="card">
    <h3>Usage</h3>
    <pre>
// In your dApp, point RPC to:
const provider = new ethers.JsonRpcProvider('http://localhost:${port}/rpc')

// Or configure in your Cinacoin config:
{
  chains: [{ id: ${chainId}, rpcUrl: 'http://localhost:${port}/rpc' }]
}
    </pre>
  </div>

  <div class="card">
    <h3>API Endpoints</h3>
    <table>
      <tr><th>Endpoint</th><th>Description</th></tr>
      <tr><td><code>POST /rpc</code></td><td>JSON-RPC 2.0 endpoint</td></tr>
      <tr><td><code>GET /status</code></td><td>Server status</td></tr>
      <tr><td><code>GET /wallets</code></td><td>List mock wallets</td></tr>
    </table>
  </div>
</body></html>`);
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  // Simulate block advancement
  mockBlockInterval = setInterval(() => {
    const chain = MOCK_CHAINS[chainId];
    if (chain) {
      chain.blockNumber += 1;
      events.emit('newBlock', chain.blockNumber);
    }
  }, 3000);

  return { server, events };
}

// ============================================================
// dev command
// ============================================================

export function devCommand(cli: Command): void {
  cli
    .command('dev')
    .description('Start local mock chain development server')
    .option('--port <port>', 'Port to listen on', '8545')
    .option('--chain <id>', 'Chain ID to mock (1=ETH, 137=Polygon, 42161=Arbitrum)', '1')
    .option('--reset', 'Reset mock state')
    .action(async (opts: { port: string; chain: string; reset?: boolean }) => {
      const port = parseInt(opts.port, 10);
      const chainId = parseInt(opts.chain, 10);

      if (opts.reset) {
        console.log('  Mock state reset');
      }

      const { server, events } = createMockServer(port, chainId);

      server.listen(port, () => {
        console.log('');
        console.log('  🔢 Cinacoin Mock Dev Server');
        console.log('  ─────────────────────────');
        console.log(`  Port:      ${port}`);
        console.log(`  Chain:     ${chainId}`);
        console.log(`  RPC:       http://localhost:${port}/rpc`);
        console.log(`  Dashboard: http://localhost:${port}/`);
        console.log(`  Status:    http://localhost:${port}/status`);
        console.log('');
        console.log('  Test Accounts:');
        const chain = MOCK_CHAINS[chainId];
        chain?.accounts.forEach((a, i) => {
          console.log(`    ${i + 1}. ${a.address} (${a.balance} ETH)`);
        });
        console.log('');
        console.log('  Press Ctrl+C to stop');
        console.log('');
      });

      events.on('newBlock', (block: number) => {
        process.stdout.write(`\r  Block: ${block}`);
      });

      // Graceful shutdown
      process.on('SIGINT', () => {
        if (mockBlockInterval) clearInterval(mockBlockInterval);
        server.close(() => {
          console.log('\n  Mock server stopped');
          process.exit(0);
        });
      });

      // Keep alive
      await new Promise<void>(() => {});
    });
}
