/**
 * k6 Load Test - WebSocket Connections
 *
 * Tests WebSocket concurrent connection handling.
 * Run: k6 run load-tests/websocket.js
 */

import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const wsErrors = new Rate('ws_errors');
const wsLatency = new Trend('ws_latency');
const wsMessages = new Counter('ws_messages');
const wsConnections = new Counter('ws_connections');

export const options = {
  scenarios: {
    // Sustained connections
    sustained: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
    },
    // Ramp connections
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 25 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    ws_errors: ['rate<0.01'],
    ws_latency: ['p(95)<200', 'p(99)<500'],
    ws_sessions: ['rate>0.95'],
  },
};

const WS_URL = __ENV.WS_URL || 'ws://localhost:8787/ws';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'Bearer test-token';

export default function () {
  const url = `${WS_URL}?token=${encodeURIComponent(AUTH_TOKEN)}`;
  
  const params = {
    headers: {
      'Authorization': AUTH_TOKEN,
    },
  };

  const res = ws.connect(url, params, (socket) => {
    wsConnections.add(1);
    
    // Connection opened
    socket.on('open', () => {
      // Subscribe to price updates
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel: 'prices',
        data: { pairs: ['ETH/USD', 'BTC/USD'] },
      }));
      
      // Subscribe to transaction updates
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel: 'transactions',
        data: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb' },
      }));
    });

    // Message received
    socket.on('message', (data) => {
      wsMessages.add(1);
      
      try {
        const msg = JSON.parse(data);
        
        if (msg.type === 'price') {
          wsLatency.add(Date.now() - msg.timestamp);
        }
        
        if (msg.type === 'transaction') {
          check(msg, {
            'transaction has hash': (m) => m.data?.hash !== undefined,
            'transaction has status': (m) => m.data?.status !== undefined,
          }) || wsErrors.add(1);
        }
      } catch (e) {
        wsErrors.add(1);
      }
    });

    // Error handling
    socket.on('error', (error) => {
      wsErrors.add(1);
    });

    // Close handling
    socket.on('close', (code, reason) => {
      check(code, {
        'close code is normal': (c) => c === 1000 || c === 1001,
      }) || wsErrors.add(1);
    });

    // Keep connection alive for a period
    sleep(5);
    
    // Send ping
    socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    
    sleep(5);
    
    // Unsubscribe and close
    socket.send(JSON.stringify({
      type: 'unsubscribe',
      channel: 'prices',
    }));
    
    socket.close();
  });

  check(res, {
    'websocket connected': (r) => r && r.status === 101,
  }) || wsErrors.add(1);

  sleep(1);
}
