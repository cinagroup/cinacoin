import type { Page, Locator } from '@playwright/test';
/**
 * Wait for the connect button to be visible and return it.
 */
export declare function getConnectButton(page: Page): Promise<Locator>;
/**
 * Wait for the disconnect button to appear (signifies a connected state).
 */
export declare function waitForConnected(page: Page): Promise<void>;
/**
 * Open the connect modal.
 */
export declare function openConnectModal(page: Page): Promise<void>;
/**
 * Click a wallet card in the connect modal by name.
 */
export declare function selectWallet(page: Page, walletName: string): Promise<void>;
/**
 * Check that an address is displayed on the page.
 */
export declare function assertAddressDisplayed(page: Page, addressSubstring: string): Promise<void>;
/**
 * Check that the page shows a disconnected state.
 */
export declare function assertDisconnected(page: Page): Promise<void>;
/**
 * Inject a mock WalletConnect provider into the page (for testing without a real wallet).
 */
export declare function injectMockProvider(page: Page): Promise<void>;
/**
 * Reset the mock provider state.
 */
export declare function resetMockProvider(page: Page): Promise<void>;
//# sourceMappingURL=wallet.d.ts.map