import React, { useState } from 'react';
import { createHeadlessClient } from '@cinaconnect/config';
import type { Network } from '@cinaconnect/chains';

const client = createHeadlessClient({ projectId: 'YOUR_PROJECT_ID' });

const networks: Network[] = [
  { id: 1, name: 'Ethereum', chainId: 1 },
  { id: 42161, name: 'Arbitrum', chainId: 42161 },
  { id: 8453, name: 'Base', chainId: 8453 },
];

export default function HeadlessNetworkSelector() {
  const [currentChainId, setCurrentChainId] = useState<number | null>(1);

  const handleSwitch = async (chainId: number) => {
    try {
      await client.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${chainId.toString(16)}` }] });
      setCurrentChainId(chainId);
    } catch (err) {
      console.error('Failed to switch network:', err);
    }
  };

  return (
    <div className="network-selector">
      {networks.map((n) => (
        <button
          key={n.id}
          onClick={() => handleSwitch(n.id)}
          className={currentChainId === n.id ? 'active' : ''}
        >
          {n.name}
        </button>
      ))}
    </div>
  );
}
