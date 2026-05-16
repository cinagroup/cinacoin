import { useState } from 'react'
import { useOnChainUX } from '@onchainux/react'

export function AuthDemo() {
  const { account, signMessage } = useOnChainUX()
  const [authStatus, setAuthStatus] = useState<'idle' | 'signing' | 'success' | 'error'>('idle')
  const [authMessage, setAuthMessage] = useState('')
  const [authResult, setAuthResult] = useState<string | null>(null)

  const generateSIWEMessage = (): string => {
    const domain = window.location.hostname || 'localhost'
    const nonce = Math.random().toString(36).substring(2, 15)
    const issuedAt = new Date().toISOString()
    const expirationTime = new Date(Date.now() + 3600000).toISOString()

    return [
      `${domain} wants you to sign in with your Ethereum account:`,
      account,
      '',
      'Sign in to OnChainUX Demo',
      '',
      `URI: ${window.location.origin}`,
      'Version: 1',
      `Chain ID: 1`,
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`,
      `Expiration Time: ${expirationTime}`,
    ].join('\n')
  }

  const handleSignIn = async () => {
    if (!account) return

    setAuthStatus('signing')
    setAuthMessage('')
    setAuthResult(null)

    try {
      const message = generateSIWEMessage()
      setAuthMessage(message)

      // 用户通过钱包签名 SIWE 消息
      const signature = await signMessage(message)
      setAuthResult(signature)
      setAuthStatus('success')

      // 实际环境中，这里会将 message + signature 发送到后端验证
      console.log('SIWE Message:', message)
      console.log('SIWE Signature:', signature)
    } catch (error) {
      console.error('SIWE signing failed:', error)
      setAuthStatus('error')
      setAuthResult((error as Error).message)
    }
  }

  return (
    <div className="auth-demo">
      <div className="demo-card">
        <h3>SIWE 认证流程</h3>

        {!account ? (
          <p className="no-account">请先连接钱包</p>
        ) : (
          <>
            {/* Step 1: Generate Message */}
            <div className="auth-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>生成 SIWE 消息</h4>
                <p>包含 domain、address、nonce、expiration 等信息</p>
                {authMessage && (
                  <pre className="message-preview">{authMessage}</pre>
                )}
              </div>
            </div>

            {/* Step 2: Sign */}
            <div className="auth-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>钱包签名</h4>
                <p>用户通过钱包签名消息，证明拥有该地址</p>
                <button
                  className="btn btn-primary"
                  onClick={handleSignIn}
                  disabled={authStatus === 'signing'}
                >
                  {authStatus === 'signing'
                    ? '等待签名...'
                    : '签名并登录'}
                </button>
              </div>
            </div>

            {/* Step 3: Verify */}
            <div className="auth-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>后端验证</h4>
                <p>服务器验证签名并创建 Session</p>

                {authStatus === 'idle' && (
                  <p className="step-waiting">等待签名...</p>
                )}
                {authStatus === 'success' && (
                  <div className="step-success">
                    <span className="success-icon">✅</span>
                    <span>签名验证成功！</span>
                    <pre className="signature-preview">
                      签名: {authResult?.slice(0, 66)}...
                    </pre>
                  </div>
                )}
                {authStatus === 'error' && (
                  <div className="step-error">
                    <span className="error-icon">❌</span>
                    <span>签名失败: {authResult}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="demo-card">
        <h3>SIWE 消息格式 (EIP-4361)</h3>
        <pre className="format-example">
{`domain wants you to sign in with your Ethereum account:
0x1a2b...3c4d

Sign in to My dApp

URI: https://mydapp.com
Version: 1
Chain ID: 1
Nonce: abc123
Issued At: 2026-05-16T10:00:00.000Z
Expiration Time: 2026-05-16T11:00:00.000Z
Resources:
- https://mydapp.com/terms`}
        </pre>
      </div>
    </div>
  )
}
