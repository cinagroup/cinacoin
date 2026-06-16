import { test, expect } from '@playwright/test';

test('cloud dashboard loads', async ({ page }) => {
  await page.goto('/');
  
  // Check cloud overview
  const cloudOverview = page.locator('[data-testid="cloud-overview"]');
  await expect(cloudOverview).toBeVisible();
  
  // Check quota usage
  const quotaUsage = page.locator('[data-testid="quota-usage"]');
  await expect(quotaUsage).toBeVisible();
  
  // Check project list
  const projectList = page.locator('[data-testid="project-list"]');
  await expect(projectList).toBeVisible();
});

test('project management works', async ({ page }) => {
  await page.goto('/projects');
  
  // Check projects table
  const projectsTable = page.locator('[data-testid="projects-table"]');
  await expect(projectsTable).toBeVisible();
  
  // Click new project button
  const newProjectButton = page.getByRole('button', { name: /New Project/i });
  await newProjectButton.click();
  
  // Fill project form
  await page.fill('[name="projectName"]', 'Test Cloud Project');
  await page.fill('[name="description"]', 'Test cloud project description');
  
  // Select region
  const regionSelect = page.locator('[data-testid="region-select"]');
  await regionSelect.click();
  
  const usEastOption = page.getByText('US East');
  await usEastOption.click();
  
  // Create project
  const createButton = page.getByRole('button', { name: /Create Project/i });
  await createButton.click();
  
  // Check success message
  const successMessage = page.locator('[data-testid="project-created"]');
  await expect(successMessage).toBeVisible();
});

test('billing information displays', async ({ page }) => {
  await page.goto('/billing');
  
  // Check billing overview
  const billingOverview = page.locator('[data-testid="billing-overview"]');
  await expect(billingOverview).toBeVisible();
  
  // Check usage chart
  const usageChart = page.locator('[data-testid="usage-chart"]');
  await expect(usageChart).toBeVisible();
  
  // Check payment methods
  const paymentMethods = page.locator('[data-testid="payment-methods"]');
  await expect(paymentMethods).toBeVisible();
  
  // Check invoice history
  const invoiceHistory = page.locator('[data-testid="invoice-history"]');
  await expect(invoiceHistory).toBeVisible();
});