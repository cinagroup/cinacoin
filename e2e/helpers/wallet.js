import { expect } from '@playwright/test';
// ============================================================
// Wallet interaction helpers for E2E tests
// ============================================================
/**
 * Wait for the connect button to be visible and return it.
 */
export async function getConnectButton(page) {
    const button = page.getByRole('button', { name: /connect wallet/i });
    await expect(button).toBeVisible();
    return button;
}
/**
 * Wait for the disconnect button to appear (signifies a connected state).
 */
export async function waitForConnected(page) {
    await expect(page.getByRole('button', { name: /disconnect/i })).toBeVisible({
        timeout: 15000,
    });
}
/**
 * Open the connect modal.
 */
export async function openConnectModal(page) {
    await (await getConnectButton(page)).click();
    await expect(page.getByText(/connect wallet/i)).toBeVisible();
}
/**
 * Click a wallet card in the connect modal by name.
 */
export async function selectWallet(page, walletName) {
    await page.getByText(walletName, { exact: false }).first().click();
}
/**
 * Check that an address is displayed on the page.
 */
export async function assertAddressDisplayed(page, addressSubstring) {
    await expect(page.getByText(addressSubstring)).toBeVisible({ timeout: 10000 });
}
/**
 * Check that the page shows a disconnected state.
 */
export async function assertDisconnected(page) {
    await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible({
        timeout: 5000,
    });
}
/**
 * Inject a mock WalletConnect provider into the page (for testing without a real wallet).
 */
export async function injectMockProvider(page) {
    await page.evaluate(() => {
        window.__MOCK_WALLET = {
            isMetaMask: true,
            request: async ({ method }) => {
                switch (method) {
                    case 'eth_requestAccounts':
                        return ['0x1234567890abcdef1234567890abcdef12345678'];
                    case 'eth_chainId':
                        return '0x1';
                    case 'personal_sign':
                        return '0xsigned';
                    case 'eth_sendTransaction':
                        return '0xmocktx';
                    default:
                        return null;
                }
            },
            on: () => { },
            removeListener: () => { },
        };
        // Inject as ethereum provider
        Object.defineProperty(window, 'ethereum', {
            value: window.__MOCK_WALLET,
            writable: true,
            configurable: true,
        });
    });
}
/**
 * Reset the mock provider state.
 */
export async function resetMockProvider(page) {
    await page.evaluate(() => {
        // @ts-ignore
        delete window.ethereum;
        // @ts-ignore
        delete window.__MOCK_WALLET;
        // @ts-ignore
        delete window.__MOCK_WC_URI;
    });
}
//# sourceMappingURL=wallet.js.map