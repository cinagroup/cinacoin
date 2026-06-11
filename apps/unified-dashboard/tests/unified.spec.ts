import { test, expect } from '@playwright/test';

test('unified dashboard loads', async ({ page }) => {
  await page.goto('/');
  
  // Check unified overview
  const overviewSection = page.locator('[data-testid="unified-overview"]');
  await expect(overviewSection).toBeVisible();
  
  // Check service status grid
  const serviceGrid = page.locator('[data-testid="service-grid"]');
  await expect(serviceGrid).toBeVisible();
  
  // Check notification center
  const notificationCenter = page.locator('[data-testid="notification-center"]');
  await expect(notificationCenter).toBeVisible();
});

test('service metrics display', async ({ page }) => {
  await page.goto('/');
  
  // Check RPC proxy metrics
  const rpcMetrics = page.locator('[data-testid="service-metrics-rpc-proxy"]');
  await expect(rpcMetrics).toBeVisible();
  
  // Check keys server metrics
  const keysMetrics = page.locator('[data-testid="service-metrics-keys-server"]');
  await expect(keysMetrics).toBeVisible();
  
  // Check relay server metrics
  const relayMetrics = page.locator('[data-testid="service-metrics-relay-server"]');
  await expect(relayMetrics).toBeVisible();
  
  // Check notify server metrics
  const notifyMetrics = page.locator('[data-testid="service-metrics-notify-server"]');
  await expect(notifyMetrics).toBeVisible();
  
  // Check push server metrics
  const pushMetrics = page.locator('[data-testid="service-metrics-push-server"]');
  await expect(pushMetrics).toBeVisible();
});

test('notification system works', async ({ page }) => {
  await page.goto('/');
  
  // Click notification bell
  const notificationBell = page.locator('[data-testid="notification-bell"]');
  await notificationBell.click();
  
  // Check notification dropdown
  const notificationDropdown = page.locator('[data-testid="notification-dropdown"]');
  await expect(notificationDropdown).toBeVisible();
  
  // Check notification items
  const notificationItems = page.locator('[data-testid="notification-item"]');
  await expect(notificationItems).toHaveCount(3); // mock notifications
  
  // Mark as read
  const markAllReadButton = page.getByRole('button', { name: /Mark All Read/i });
  await markAllReadButton.click();
  
  // Check all marked as read
  const unreadCount = await page.locator('[data-testid="unread-count"]').textContent();
  expect(unreadCount).toBe('0');
});