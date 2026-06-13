import React, { useState } from 'react'
import { useDemo } from '../hooks/useDemo'
import { AddressDisplay } from './Others'

export function DemoSignMessage() {
  const { isConnected, address, connect, signMessage } = useDemo()
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSign = async () => {
    if (!message.trim()) return
    if (!isConnected || !address) {
      connect()
      return
    }

    setIsLoading(true)
    try {
      const sig = await signMessage?.(message)
      setSignature(sig?.signature ?? 'Mock signature: 0x' + Array.from({ length: 130 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join(''))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="cc-card p-6 max-w-2xl">
      <h3 className="cc-subtitle mb-4">Sign demo.</h3>

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="cc-body text-[var(--cc-body)] mb-4">
            Connect wallet to sign messages.
          </p>
          <button onClick={connect} className="cc-btn-primary">
            Connect wallet
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 p-4 bg-[var(--cc-canvas-soft)] rounded-sm">
            <p className="cc-body-xs text-[var(--cc-body)] mb-1">Your address</p>
            <AddressDisplay address={address!} />
          </div>

          <div className="mb-4">
            <label className="cc-label mb-2 block">Message</label>
            <textarea
              className="cc-input !min-h-[120px]"
              placeholder="Enter message to sign..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSign}
              disabled={!message.trim() || isLoading}
              className="cc-btn-primary flex-1"
            >
              {isLoading ? 'Signing...' : 'Sign message'}
            </button>
            <button
              onClick={() => {
                setMessage('Hello from CinaCoin Demos!')
                setSignature(null)
              }}
              className="cc-btn-secondary"
            >
              Reset
            </button>
          </div>

          {signature && (
            <div className="mt-6 p-4 bg-[var(--cc-success)/10] rounded-sm">
              <p className="cc-body-xs text-[var(--cc-body)] mb-1">Signature result</p>
              <div className="cc-mono break-all text-body-sm">
                {signature}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function DemoSignTypedData() {
  const { isConnected, address, connect, signTypedData } = useDemo()
  const [typedData] = useState(JSON.stringify({
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Message: [
        { name: 'message', type: 'string' },
      ],
    },
    domain: {
      name: 'CinaCoin Demo',
      version: '1.0.0',
      chainId: 1,
      verifyingContract: '0x0000000000000000000000000000000000000001',
    },
    primaryType: 'Message',
    message: {
      message: 'Hello from EIP-712!',
    },
  }, null, 2))
  const [signature, setSignature] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSign = async () => {
    if (!isConnected || !address) {
      connect()
      return
    }

    setIsLoading(true)
    try {
      const parsed = JSON.parse(typedData)
      const sig = await signTypedData?.(parsed)
      setSignature(sig?.signature ?? 'Mock signature: 0x' + Array.from({ length: 130 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join(''))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="cc-card p-6 max-w-2xl">
      <h3 className="cc-subtitle mb-4">EIP-712 sign demo.</h3>

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="cc-body text-[var(--cc-body)] mb-4">
            Connect wallet to sign typed data.
          </p>
          <button onClick={connect} className="cc-btn-primary">
            Connect wallet
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="cc-label mb-2 block">Typed Data (JSON)</label>
            <textarea
              className="cc-input !h-[200px] !font-[var(--font-mono)] text-caption"
              value={typedData}
              readOnly
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSign}
              disabled={isLoading}
              className="cc-btn-primary flex-1"
            >
              {isLoading ? 'Signing...' : 'Sign typed data'}
            </button>
          </div>

          {signature && (
            <div className="mt-6 p-4 bg-[var(--cc-success)/10] rounded-sm">
              <p className="cc-body-xs text-[var(--cc-body)] mb-1">Signature result</p>
              <div className="cc-mono break-all text-body-sm">
                {signature}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
