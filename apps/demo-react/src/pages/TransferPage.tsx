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
    <div className="grid grid-cols-2 gap-6 p-6">
      {/* Left: Interactive Demo */}
      <div>
        <h2 className="text-[var(--cc-text-xl)] font-semibold mb-4">Token 转账</h2>
        <p className="text-[var(--cc-demo-text-muted)] mb-6">选择链和 Token，输入收款地址和金额，完成转账。</p>

        <div className="bg-[#1a1a2e] rounded-xl p-6">
          {state.step === 'input' && (
            <div className="flex flex-col gap-4">
              {/* Chain selector */}
              <div>
                <label className="block text-[var(--cc-text-xs)] text-[var(--cc-demo-text-light)] mb-2">选择链</label>
                <div className="flex gap-2 flex-wrap">
                  {CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setState((s) => ({ ...s, chain: chain.id, token: chain.tokens[0] }))}
                      className={`px-4 py-2 rounded-lg border-2 cursor-pointer text-[var(--cc-text-sm)] ${
                        state.chain === chain.id
                          ? 'border-[#6366f1] bg-[#6366f120]'
                          : 'border-[#333] bg-[#0d0d1a]'
                      } text-[var(--cc-on-primary,#fff)]`}
                    >
                      {chain.icon} {chain.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Token selector */}
              <div>
                <label className="block text-[var(--cc-text-xs)] text-[var(--cc-demo-text-light)] mb-2">选择 Token</label>
                <div className="flex gap-2">
                  {selectedChain.tokens.map((token) => (
                    <button
                      key={token}
                      onClick={() => setState((s) => ({ ...s, token }))}
                      className={`px-4 py-2 rounded-md border-2 cursor-pointer text-[var(--cc-text-xs)] ${
                        state.token === token
                          ? 'border-[#6366f1] bg-[#6366f120]'
                          : 'border-[#333] bg-[#0d0d1a]'
                      } text-[var(--cc-on-primary,#fff)]`}
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-[var(--cc-text-xs)] text-[var(--cc-demo-text-light)] mb-2">收款地址</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={state.to}
                  onChange={(e) => setState((s) => ({ ...s, to: e.target.value }))}
                  className="w-full py-3 px-4 rounded-lg border-2 border-[var(--cc-demo-border)] bg-[var(--cc-demo-surface-darker)] text-[var(--cc-text-sm)] text-[var(--cc-on-primary,#fff)] outline-none box-border"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[var(--cc-text-xs)] text-[var(--cc-demo-text-light)] mb-2">金额</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.0"
                  value={state.amount}
                  onChange={(e) => setState((s) => ({ ...s, amount: e.target.value }))}
                  className="w-full py-3 px-4 rounded-lg border-2 border-[var(--cc-demo-border)] bg-[var(--cc-demo-surface-darker)] text-[var(--cc-text-sm)] text-[var(--cc-on-primary,#fff)] outline-none box-border"
                />
              </div>

              <button
                onClick={handleConfirm}
                disabled={!state.to || !state.amount}
                className={`py-3 px-6 rounded-lg border-none text-[var(--cc-text-md)] font-semibold mt-2 ${
                  state.to && state.amount
                    ? 'bg-[#6366f1] cursor-pointer'
                    : 'bg-[#333] cursor-not-allowed'
                } text-[var(--cc-on-primary,#fff)]`}
              >
                确认转账
              </button>
            </div>
          )}

          {state.step === 'confirm' && (
            <div className="text-center p-5">
              <h3 className="text-[var(--cc-text-lg)] mb-4">确认交易</h3>
              <div className="bg-[var(--cc-demo-surface-darker)] rounded-lg p-4 mb-4 text-left">
                <p className="text-[var(--cc-demo-text-muted)] text-[var(--cc-text-xs)]">链: {selectedChain.name}</p>
                <p className="text-[var(--cc-demo-text-muted)] text-[var(--cc-text-xs)]">Token: {state.token}</p>
                <p className="text-[var(--cc-demo-text-muted)] text-[var(--cc-text-xs)]">收款: {state.to.slice(0, 10)}...{state.to.slice(-8)}</p>
                <p className="text-[var(--cc-on-primary,#fff)] text-[var(--cc-text-lg)] font-semibold mt-2">{state.amount} {state.token}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setState((s) => ({ ...s, step: 'input' }))}
                  className="py-3 px-5 rounded-lg border-0 border-[#333] bg-transparent text-[var(--cc-on-primary,#fff)] cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleSend}
                  className="py-3 px-5 rounded-lg border-none bg-[var(--cc-demo-accent)] text-[var(--cc-on-primary,#fff)] font-semibold cursor-pointer"
                >
                  确认发送
                </button>
              </div>
            </div>
          )}

          {state.step === 'sending' && (
            <div className="text-center p-10">
              <div className="text-4xl mb-4 animate-spin">⟳</div>
              <p className="text-[var(--cc-demo-text-muted)]">交易发送中...</p>
            </div>
          )}

          {state.step === 'success' && (
            <div className="text-center p-5">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-[var(--cc-text-lg)] mb-2">交易成功!</h3>
              <p className="text-[var(--cc-demo-text-muted)] text-[var(--cc-text-xs)] mb-4">
                TX: {state.txHash.slice(0, 16)}...{state.txHash.slice(-8)}
              </p>
              <button
                onClick={handleReset}
                className="py-3 px-5 rounded-lg border-none bg-[var(--cc-demo-accent)] text-[var(--cc-on-primary,#fff)] cursor-pointer"
              >
                发起新转账
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Code Example */}
      <div>
        <CodeExample code={{ react: CODE_EXAMPLE }} title="useCoinTransaction" />
      </div>
    </div>
  );
}
