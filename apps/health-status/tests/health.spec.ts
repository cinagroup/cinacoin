import { test, expect } from '@playwright/test';

test('health status page loads', async ({ page }) => {
  await page.goto('/');
  
  // Check page title
  await expect(page).toHaveTitle(/Health Status/);
  
  // Check service status cards
  const serviceCards = page.locator('[data-testid="service-card"]');
  await expect(serviceCards).toHaveCount(5); // 5 workers
  
  // Check each service card has proper elements
  for (let i = 0; i < 5; i++) {
    const card = serviceCards.nth(i);
    await expect(card.locator('[data-testid="service-name"]')).toBeVisible();
    await expect(card.locator('[data-testid="service-status"]')).toBeVisible();
    await expect(card.locator('[data-testid="uptime-percentage"]')).toBeVisible();
  }
  
  // Check historical chart
  const chart = page.locator('[data-testid="historical-chart"]');
  await expect(chart).toBeVisible();
});

test('service details page loads', async ({ page }) => {
  await page.goto('/');
  
  // Click on first service card
  const firstService = page.locator('[data-testid="service-card"]').first();
  await firstService.click();
  
  // Check service details page
  await expect(page).toHaveURL(/service\/\w+/);
  
  const serviceName = await page.locator('[data-testid="service-name"]').textContent();
  expect(serviceName).toBeTruthy();
  
  // Check metrics section
  const metricsSection = page.locator('[data-testid="metrics-section"]');
  await expect(metricsSection).toBeVisible();
  
  // Check incidents section
  const incidentsSection = page.locator('[data-testid="incidents-section"]');
  await expect(incidentsSection).toBeVisible();
});

test('uptime chart displays data', async ({ page }) => {
  await page.goto('/');
  
  // Wait for chart to load
  await page.waitForSelector('[data-testid="historical-chart"] canvas');
  
  const chartCanvas = page.locator('[data-testid="historical-chart"] canvas');
  await expect(chartCanvas).toBeVisible();
  
  // Check chart has data points
  const chartData = await page.locator('[data-testid="chart-data-point"]').count();
  expect(chartData).toBeGreaterThan(0);
});