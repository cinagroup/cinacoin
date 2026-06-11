import { test, expect } from '@playwright/test';

test('backend dashboard login', async ({ page }) => {
  await page.goto('/login');
  
  // Check login form
  const loginForm = page.locator('[data-testid="login-form"]');
  await expect(loginForm).toBeVisible();
  
  // Fill SIWE login
  const siweButton = page.getByRole('button', { name: /Sign in with Ethereum/i });
  await expect(siweButton).toBeVisible();
  
  // Click SIWE button (would open wallet in real scenario)
  await siweButton.click();
  
  // Check for wallet connection prompt
  const walletPrompt = page.locator('[data-testid="wallet-prompt"]');
  await expect(walletPrompt).toBeVisible();
});

test('dashboard overview loads', async ({ page }) => {
  // Simulate authenticated state
  await page.addInitScript(() => {
    localStorage.setItem('auth-token', 'mock-token');
    localStorage.setItem('user-address', '0x1234...5678');
  });
  
  await page.goto('/');
  
  // Check dashboard layout
  const sidebar = page.locator('[data-testid="sidebar"]');
  await expect(sidebar).toBeVisible();
  
  const mainContent = page.locator('[data-testid="main-content"]');
  await expect(mainContent).toBeVisible();
  
  // Check service status cards
  const serviceCards = page.locator('[data-testid="service-status-card"]');
  await expect(serviceCards).toHaveCount(5);
  
  // Check metrics section
  const metricsSection = page.locator('[data-testid="metrics-section"]');
  await expect(metricsSection).toBeVisible();
});

test('project management works', async ({ page }) => {
  // Simulate authenticated state
  await page.addInitScript(() => {
    localStorage.setItem('auth-token', 'mock-token');
    localStorage.setItem('user-address', '0x1234...5678');
  });
  
  await page.goto('/projects');
  
  // Check projects list
  const projectsList = page.locator('[data-testid="projects-list"]');
  await expect(projectsList).toBeVisible();
  
  // Click new project button
  const newProjectButton = page.getByRole('button', { name: /New Project/i });
  await newProjectButton.click();
  
  // Check new project form
  const newProjectForm = page.locator('[data-testid="new-project-form"]');
  await expect(newProjectForm).toBeVisible();
  
  // Fill project details
  await page.fill('[name="projectName"]', 'Test Project');
  await page.fill('[name="description"]', 'Test project description');
  
  // Submit form
  const createButton = page.getByRole('button', { name: /Create Project/i });
  await createButton.click();
  
  // Check success message
  const successMessage = page.locator('[data-testid="success-message"]');
  await expect(successMessage).toBeVisible();
});