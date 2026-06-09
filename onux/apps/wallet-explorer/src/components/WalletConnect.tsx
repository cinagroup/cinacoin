"use client";

import { useState, useEffect } from "react";

type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

interface WalletState {
  status: WalletStatus;
  address: string | null;
  chainId: number | null;
  provider: any | null;
  error: string | null;
}

interface WalletConnectProps {
  onConnect?: (address: string, chainId: number) => void;
  onDisconnect?: () => void;
}

export function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const [wallet, setWallet] = useState<WalletState>({
    status: "disconnected",
    address: null,
    chainId: null,
    provider: null,
    error: null,
  });
  const [showModal, setShowModal] = useState(false);

  // Check if already connected on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            window.ethereum
              .request({ method: "eth_chainId" })
              .then((chainId: string) => {
                setWallet({
                  status: "connected",
                  address: accounts[0],
                  chainId: parseInt(chainId, 16),
                  provider: window.ethereum,
                  error: null,
                });
                onConnect?.(accounts[0], parseInt(chainId, 16));
              });
          }
        })
        .catch(console.error);
    }
  }, [onConnect]);

  const connectMetaMask = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setWallet((prev) => ({
        ...prev,
        status: "error",
        error: "MetaMask not installed. Please install MetaMask extension.",
      }));
      return;
    }

    setWallet((prev) => ({ ...prev, status: "connecting", error: null }));

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const chainId = await window.ethereum.request({ method: "eth_chainId" });

      setWallet({
        status: "connected",
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        provider: window.ethereum,
        error: null,
      });

      setShowModal(false);
      onConnect?.(accounts[0], parseInt(chainId, 16));
    } catch (err: any) {
      setWallet({
        status: "error",
        address: null,
        chainId: null,
        provider: null,
        error: err.message || "Failed to connect MetaMask",
      });
    }
  };

  const connectWalletConnect = async () => {
    setWallet((prev) => ({ ...prev, status: "connecting", error: null }));

    try {
      // Dynamic import to avoid SSR issues
      const { EthereumProvider } = await import("@walletconnect/ethereum-provider");

      const provider = await EthereumProvider.init({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
        chains: [1], // Ethereum mainnet
        showQrModal: true,
        metadata: {
          name: "Cinacoin Wallet Explorer",
          description: "Discover crypto wallets",
          url: "https://wallet.cinacoin.com",
          icons: ["https://wallet.cinacoin.com/logo.png"],
        },
      });

      await provider.connect();

      const accounts = provider.accounts;
      const chainId = provider.chainId;

      if (accounts.length > 0) {
        setWallet({
          status: "connected",
          address: accounts[0],
          chainId: chainId,
          provider: provider,
          error: null,
        });

        setShowModal(false);
        onConnect?.(accounts[0], chainId);
      }
    } catch (err: any) {
      setWallet({
        status: "error",
        address: null,
        chainId: null,
        provider: null,
        error: err.message || "Failed to connect WalletConnect",
      });
    }
  };

  const disconnect = async () => {
    try {
      if (wallet.provider && wallet.provider.disconnect) {
        await wallet.provider.disconnect();
      }
    } catch (err) {
      console.error("Disconnect error:", err);
    }

    setWallet({
      status: "disconnected",
      address: null,
      chainId: null,
      provider: null,
      error: null,
    });

    onDisconnect?.();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getChainName = (chainId: number | null) => {
    const chains: Record<number, string> = {
      1: "Ethereum",
      5: "Goerli",
      11155111: "Sepolia",
      137: "Polygon",
      56: "BSC",
      42161: "Arbitrum",
      10: "Optimism",
    };
    return chainId ? chains[chainId] || `Chain ${chainId}` : "Unknown";
  };

  return (
    <>
      {/* Connect Button or Status */}
      {wallet.status === "connected" ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 vercel-btn-secondary" style={{ height: "32px", fontSize: "13px", padding: "0 12px" }}>
            <div className="h-2 w-2 rounded-full" style={{ background: "#0070f3" }} />
            <span className="vercel-mono">{formatAddress(wallet.address!)}</span>
          </div>
          <button
            onClick={disconnect}
            className="vercel-btn-secondary"
            style={{ height: "32px", fontSize: "13px", padding: "0 12px" }}
            aria-label="Disconnect wallet"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="vercel-btn-primary"
          style={{ height: "32px", fontSize: "13px", padding: "0 12px" }}
          disabled={wallet.status === "connecting"}
        >
          {wallet.status === "connecting" ? "Connecting..." : "Connect Wallet"}
        </button>
      )}

      {/* Error Message */}
      {wallet.status === "error" && wallet.error && (
        <div
          className="fixed bottom-4 right-4 z-50 vercel-card"
          style={{ background: "#f7d4d6", borderColor: "#ee0000", maxWidth: "400px" }}
          role="alert"
        >
          <p className="vercel-body-sm" style={{ color: "#ee0000" }}>
            {wallet.error}
          </p>
          <button
            onClick={() => setWallet((prev) => ({ ...prev, error: null }))}
            className="vercel-btn-secondary mt-2"
            style={{ height: "28px", fontSize: "12px", padding: "0 10px" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Wallet Selection Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="vercel-card"
            style={{ maxWidth: "400px", width: "90%", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="vercel-display-md mb-4" style={{ color: "var(--vercel-ink)" }}>
              Connect Wallet
            </h2>
            <p className="vercel-body-sm mb-6" style={{ color: "var(--vercel-body)" }}>
              Choose your preferred wallet to connect
            </p>

            <div className="space-y-3">
              {/* MetaMask */}
              <button
                onClick={connectMetaMask}
                className="vercel-btn-secondary w-full flex items-center justify-between"
                style={{ height: "48px", padding: "0 16px" }}
              >
                <span className="flex items-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M21.3 2L13.1 8.2L14.6 4.5L21.3 2Z" fill="#E17726"/>
                    <path d="M2.7 2L10.8 8.3L9.4 4.5L2.7 2Z" fill="#E27625"/>
                    <path d="M18.3 16.8L16.2 20L20.5 21.2L21.7 16.9L18.3 16.8Z" fill="#E27625"/>
                    <path d="M2.3 16.9L3.5 21.2L7.8 20L5.7 16.8L2.3 16.9Z" fill="#E27625"/>
                  </svg>
                  <span className="vercel-body-md font-medium">MetaMask</span>
                </span>
                <span className="vercel-badge">Popular</span>
              </button>

              {/* WalletConnect */}
              <button
                onClick={connectWalletConnect}
                className="vercel-btn-secondary w-full flex items-center justify-between"
                style={{ height: "48px", padding: "0 16px" }}
              >
                <span className="flex items-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6.1 8.8C9.3 5.7 14.7 5.7 17.9 8.8L18.2 9.1C18.3 9.2 18.3 9.4 18.2 9.5L17.1 10.6C17 10.7 16.9 10.7 16.8 10.6L16.6 10.4C14.5 8.3 11 8.3 8.9 10.4L8.6 10.7C8.5 10.8 8.4 10.8 8.3 10.7L7.2 9.6C7.1 9.5 7.1 9.3 7.2 9.2L6.1 8.8ZM20.2 11.1C20.3 11.2 20.3 11.4 20.2 11.5L15.7 16C15.6 16.1 15.4 16.1 15.3 16L13.7 14.4C13.7 14.4 13.7 14.4 13.7 14.4L13.6 14.4C13.5 14.3 13.5 14.3 13.4 14.4L12.6 15.2C12.5 15.3 12.5 15.3 12.4 15.2L11.6 14.4C11.5 14.3 11.5 14.3 11.4 14.4L11.3 14.4C11.3 14.4 11.3 14.4 11.3 14.4L9.7 16C9.6 16.1 9.4 16.1 9.3 16L4.8 11.5C4.7 11.4 4.7 11.2 4.8 11.1L5.9 10C6 9.9 6.1 9.9 6.2 10L8.6 12.4C8.7 12.5 8.7 12.5 8.8 12.4L9.6 11.6C9.7 11.5 9.7 11.5 9.8 11.6L9.9 11.6C9.9 11.6 9.9 11.6 9.9 11.6L11.5 13.2C11.6 13.3 11.6 13.3 11.7 13.2L12.5 12.4C12.6 12.3 12.6 12.3 12.7 12.4L13.5 13.2C13.6 13.3 13.6 13.3 13.7 13.2L15.3 11.6C15.4 11.5 15.4 11.5 15.5 11.6L16.3 12.4C16.4 12.5 16.4 12.5 16.5 12.4L18.9 10C19 9.9 19.1 9.9 19.2 10L20.2 11.1Z" fill="#3B99FC"/>
                  </svg>
                  <span className="vercel-body-md font-medium">WalletConnect</span>
                </span>
                <span className="vercel-badge">Mobile</span>
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="vercel-btn-secondary w-full mt-4"
              style={{ height: "40px" }}
            >
              Cancel
            </button>

            <p className="vercel-caption mt-4 text-center" style={{ color: "var(--vercel-mute)" }}>
              By connecting, you agree to our Terms of Service
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
