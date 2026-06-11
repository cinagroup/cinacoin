import { test, expect } from '@playwright/test';

test('analytics dashboard loads', async ({ page }) => {
  await page.goto('/');
  
  // Check analytics overview
  const analyticsOverview = page.locator('[data-testid="analytics-overview"]');
  await expect(analyticsOverview).toBeVisible();
  
  // Check user growth chart
  const userGrowthChart = page.locator('[data-testid="user-growth-chart"]');
  await expect(userGrowthChart).toBeVisible();
  
  // Check API calls chart
  const apiCallsChart = page.locator('[data-testid="api-calls-chart"]');
  await expect(apiCallsChart).toBeVisible();
  
  // Check region distribution
  const regionDistribution = page.locator('[data-testid="region-distribution"]');
  await expect(regionDistribution).toBeVisible();
});

test('chart data displays correctly', async ({ page }) => {
  await page.goto('/');
  
  // Wait for charts to load
  await page.waitForSelector('[data-testid="user-growth-chart"] canvas');
  
  // Check user growth chart has data
  const userGrowthDataPoints = await page.locator('[data-testid="user-growth-data-point"]').count();
  expect(userGrowthDataPoints).toBeGreaterThan(0);
  
  // Check API calls chart has data
  const apiCallsDataPoints = await page.locator('[data-testid="api-calls-data-point"]').count();
  expect(apiCallsDataPoints).toBeGreaterThan(0);
  
  // Check region distribution has data
  const regionDataPoints = await page.locator('[data-testid="region-data-point"]').count();
  expect(regionDataPoints).toBeGreaterThan(0);
});

test('date range filtering works', async ({ page }) => {
  await page.goto('/');
  
  // Click date range selector
  const dateRangeSelector = page.locator('[data-testid="date-range-selector"]');
  await dateRangeSelector.click();
  
  // Select last 7 days
  const last7DaysOption = page.getByText('Last 7 days');
  await last7DaysOption.click();
  
  // Check charts update with new data
  await page.waitForSelector('[data-testid="user-growth-chart"] [data-testid="loading-finished"]');
  
  const updatedUserGrowthData = await page.locator('[data-testid="user-growth-data-point"]').count();
  expect(updatedUserGrowthData).toBeGreaterThan(0);
});