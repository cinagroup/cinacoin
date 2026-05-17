declare global {
    namespace Cypress {
        interface Chainable<Subject = any> {
            /**
             * Connect a wallet by name.
             * Supports: MetaMask, WalletConnect, Coinbase Wallet, etc.
             * @example cy.connectWallet('MetaMask')
             * @example cy.connectWallet('WalletConnect')
             */
            connectWallet(walletName: string): Chainable<void>;
            /**
             * Disconnect the currently connected wallet.
             * @example cy.disconnectWallet()
             */
            disconnectWallet(): Chainable<void>;
            /**
             * Switch to a different blockchain network by chainId.
             * @example cy.switchNetwork(1)        // Ethereum Mainnet
             * @example cy.switchNetwork(11155111) // Sepolia
             */
            switchNetwork(chainId: number): Chainable<void>;
            /**
             * Sign a test transaction using the connected wallet.
             * @example cy.signTransaction()
             */
            signTransaction(): Chainable<Cypress.ObjectLike>;
            /**
             * Get the current wallet balance.
             * Yields an object with balance info.
             * @example cy.getBalance().then(b => cy.log(b.balance))
             */
            getBalance(): Chainable<{
                balance: string;
                currency: string;
                chainId: number;
            }>;
        }
    }
}
export {};
//# sourceMappingURL=commands.d.ts.map