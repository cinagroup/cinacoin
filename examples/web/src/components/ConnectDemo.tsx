import { useState } from 'react'
import { useOnChainUX, ConnectButton, ConnectModal } from '@onchainux/react'

export function ConnectDemo() {
  const [showModal, setShowModal] = useState(false)
  const { account, status, balance, connectors, disconnect } = useOnChainUX()

  return (
    <div className="connect-demo">
      <div className="demo-card">
        <h3>ConnectButton 组件</h3>
        <ConnectButton
          variant="primary"
          size="lg"
          showBalance
          showAvatar
          showNetwork
        />
      </div>

      <div className="demo-card">
        <h3>连接状态</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="label">状态</span>
            <span className={`value status-${status}`}>{status}</span>
          </div>
          <div className="status-item">
            <span className="label">账户</span>
            <span className="value">{account || '未连接'}</span>
          </div>
          <div className="status-item">
            <span className="label">余额</span>
            <span className="value">{balance || '—'}</span>
          </div>
          <div className="status-item">
            <span className="label">可用钱包数</span>
            <span className="value">{connectors?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="demo-card">
        <h3>ConnectModal 弹窗</h3>
        <button className="btn btn-secondary" onClick={() => setShowModal(true)}>
          打开连接弹窗
        </button>
        {account && (
          <button className="btn btn-danger" onClick={() => disconnect()}>
            断开连接
          </button>
        )}
      </div>

      <ConnectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        views={['wallets', 'scan']}
        defaultView="wallets"
        recommendedWallets={['metamask', 'rabby']}
      />
    </div>
  )
}
