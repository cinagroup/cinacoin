/**
 * TransferPage — Token 转账演示
 *
 * 演示: 选择链 → 选择 Token → 输入地址/金额 → 确认 → 发送
 */

import { useState, useCallback } from 'react';
import { CodeExample } from '../components/CodeExample';

const CHAINS = [
  { id: 'eip155:1', name: 'Ethereum', icon: '⟠', tokens: ['ETH', 'USDC', 'USDT'] },
  { id: 'eip155:137', name: 'Polygon', icon: '⬡', tokens: ['MATIC', 'USDC', 'USDT'] },
  { id: 'eip155:56', name: 'BSC', icon: '◆', tokens: ['BNB', 'BUSD', 'USDT'] },
  { id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', name: 'Solana', icon: '◎', tokens: ['SOL', 'USDC'] },
];

const CODE_EXAMPLE = `import { useCoinTransaction, useCoinAccount } from '@cinacoin/core-sdk';

function TransferForm() {
  const { account } = useCoinAccount();
  const { sendTransaction, isPending, txHash } = useCoinTransaction();

  const handleTransfer = async (to: string, amount: string) => {
    const result = await sendTransaction({
      to,
      value: amount,
      chainId: 'eip155:1',
    });
    console.log('Transaction hash:', result.hash);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      handleTransfer(
        formData.get('to') as string,
        formData.get('amount') as string
      );
    }}>
      <input name="to" placeholder="Recipient address" />
      <input name="amount" type="number" step="0.001" placeholder="Amount" />
      <button disabled={isPending}>
        {isPending ? 'Sending...' : 'Send'}
      </button>
      {txHash && <p>TX: {txHash.slice(0, 10)}...</p>}
    </form>
  );
}`;

interface TransferState {
  step: 'input' | 'confirm' | 'sending' | 'success';
  chain: string;
  token: string;
  to: string;
  amount: string;
  txHash: string;
}

export function TransferPage() {
  const [state, setState] = useState<TransferState>({
    step: 'input',
    chain: CHAINS[0].id,
    token: CHAINS[0].tokens[0],
    to: '',
    amount: '',
    txHash: '',
  });

  const selectedChain = CHAINS.find((c) => c.id === state.chain) || CHAINS[0];

  const handleConfirm = useCallback(() => {
    if (!state.to || !state.amount) return;
    setState((s) => ({ ...s, step: 'confirm' }));
  }, [state.to, state.amount]);

  const handleSend = useCallback(() => {
    setState((s) => ({ ...s, step: 'sending' }));
    // Simulate transaction
    setTimeout(() => {
      const hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setState((s) => ({ ...s, step: 'success', txHash: hash }));
    }, 2000);
  }, []);

  const handleReset = useCallback(() => {
    setState({ step: 'input', chain: CHAINS[0].id, token: CHAINS[0].tokens[0], to: '', amount: '', txHash: '' });
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 24 }}>
      {/* Left: Interactive Demo */}
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Token 转账</h2>
        <p style={{ color: '#888', marginBottom: 24 }}>选择链和 Token，输入收款地址和金额，完成转账。</p>

        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 24 }}>
          {state.step === 'input' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Chain selector */}
              <div>
                <label style={{ fontSize: 13, color: '#aaa', marginBottom: 6, display: 'block' }}>选择链</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setState((s) => ({ ...s, chain: chain.id, token: chain.tokens[0] }))}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: state.chain === chain.id ? '2px solid #6366f1' : '2px solid #333',
                        background: state.chain === chain.id ? '#6366f120' : '#0d0d1a',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      {chain.icon} {chain.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Token selector */}
              <div>
                <label style={{ fontSize: 13, color: '#aaa', marginBottom: 6, display: 'block' }}>选择 Token</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {selectedChain.tokens.map((token) => (
                    <button
                      key={token}
                      onClick={() => setState((s) => ({ ...s, token }))}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 6,
                        border: state.token === token ? '2px solid #6366f1' : '2px solid #333',
                        background: state.token === token ? '#6366f120' : '#0d0d1a',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label style={{ fontSize: 13, color: '#aaa', marginBottom: 6, display: 'block' }}>收款地址</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={state.to}
                  onChange={(e) => setState((s) => ({ ...s, to: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '2px solid #333',
                    background: '#0d0d1a',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Amount */}
              <div>
                <label style={{ fontSize: 13, color: '#aaa', marginBottom: 6, display: 'block' }}>金额</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.0"
                  value={state.amount}
                  onChange={(e) => setState((s) => ({ ...s, amount: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '2px solid #333',
                    background: '#0d0d1a',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                onClick={handleConfirm}
                disabled={!state.to || !state.amount}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: state.to && state.amount ? '#6366f1' : '#333',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: state.to && state.amount ? 'pointer' : 'not-allowed',
                  marginTop: 8,
                }}
              >
                确认转账
              </button>
            </div>
          )}

          {state.step === 'confirm' && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <h3 style={{ fontSize: 18, marginBottom: 16 }}>确认交易</h3>
              <div style={{ background: '#0d0d1a', borderRadius: 8, padding: 16, marginBottom: 16, textAlign: 'left' }}>
                <p style={{ color: '#888', fontSize: 13 }}>链: {selectedChain.name}</p>
                <p style={{ color: '#888', fontSize: 13 }}>Token: {state.token}</p>
                <p style={{ color: '#888', fontSize: 13 }}>收款: {state.to.slice(0, 10)}...{state.to.slice(-8)}</p>
                <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginTop: 8 }}>{state.amount} {state.token}</p>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => setState((s) => ({ ...s, step: 'input' }))}
                  style={{ padding: '10px 20px', borderRadius: 8, border: '2px solid #333', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                >
                  取消
                </button>
                <button
                  onClick={handleSend}
                  style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  确认发送
                </button>
              </div>
            </div>
          )}

          {state.step === 'sending' && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⟳</div>
              <p style={{ color: '#888' }}>交易发送中...</p>
            </div>
          )}

          {state.step === 'success' && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>交易成功!</h3>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
                TX: {state.txHash.slice(0, 16)}...{state.txHash.slice(-8)}
              </p>
              <button
                onClick={handleReset}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer' }}
              >
                发起新转账
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Code Example */}
      <div>
        <CodeExample code={CODE_EXAMPLE} language="typescript" title="useCoinTransaction" />
      </div>
    </div>
  );
}
