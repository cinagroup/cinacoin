import { test, expect } from '../fixtures';
import { injectMockProvider, resetMockProvider, openConnectModal, selectWallet, waitForConnected, } from '../helpers/wallet';
// ============================================================
// E2E tests for SIWE (Sign-In With Ethereum) authentication flow
// ============================================================
test.describe('SIWE Auth Flow', () => {
    test.afterEach(async ({ page }) => {
        await resetMockProvider(page);
    });
    test('should prompt SIWE message after wallet connect', async ({ page }) => {
        await injectMockProvider(page);
        await page.goto('/');
        await openConnectModal(page);
        await selectWallet(page, 'MetaMask');
        await waitForConnected(page);
        // After connection, SIWE message should be presented
        // The SIWE prompt may appear as a modal or toast
        const siwePrompt = page.getByText(/sign in with ethereum/i);
        await expect(siwePrompt).toBeVisible({ timeout: 10000 });
    });
    test('should verify connected address format', async ({ page }) => {
        await injectMockProvider(page);
        await page.goto('/');
        await openConnectModal(page);
        await selectWallet(page, 'MetaMask');
        await waitForConnected(page);
        // Address should be a valid hex address
        await expect(page.getByText(/0x[0-9a-fA-F]{40}/)).toBeVisible({ timeout: 10000 });
    });
    test('should handle auth state persistence', async ({ page }) => {
        await injectMockProvider(page);
        await page.goto('/');
        await openConnectModal(page);
        await selectWallet(page, 'MetaMask');
        await waitForConnected(page);
        // Reload page - auth state should persist
        await page.reload();
        await expect(page.getByRole('button', { name: /disconnect/i })).toBeVisible({
            timeout: 5000,
        });
    });
    test('should show auth error on rejected connection', async ({ page }) => {
        await page.goto('/');
        await openConnectModal(page);
        await selectWallet(page, 'MetaMask');
        // Without a real provider, connection should error
        await expect(page.getByText(/error/i)).toBeVisible({ timeout: 15000 });
    });
    test('should display nonce in SIWE message', async ({ page }) => {
        await injectMockProvider(page);
        await page.goto('/');
        await openConnectModal(page);
        await selectWallet(page, 'MetaMask');
        await waitForConnected(page);
        // SIWE message should contain a nonce
        const siweMessage = page.getByText(/nonce/i);
        await expect(siweMessage).toBeVisible({ timeout: 10000 });
    });
});
//# sourceMappingURL=auth-flow.spec.js.map