import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = process.env.PW_TEST_EMAIL || `testuser_${Date.now()}@example.com`;
const TEST_PASSWORD = process.env.PW_TEST_PASSWORD || 'TestPassword123!';

// 1. Login page loads
// 2. Register page loads
// 3. Registration flow
// 4. Login flow
// 5. Logout flow

test.describe('Auth Flows', () => {
  test('Login page loads', async ({ page }: { page: Page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Sign in')).toBeVisible();
  });

  test('Register page loads', async ({ page }: { page: Page }) => {
    await page.goto('/register');
    await expect(page.locator('text=Create Account')).toBeVisible();
  });

  test('Registration works', async ({ page }: { page: Page }) => {
    await page.goto('/register');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.fill('input[placeholder="••••••••"]', TEST_PASSWORD);
    await page.click('button:has-text("Create Account")');
    await expect(page.locator('text=Account Created')).toBeVisible();
  });

  test('Login works', async ({ page }: { page: Page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('Logout works', async ({ page }: { page: Page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    // Find and click logout (adjust selector as needed)
    await page.click('button:has-text("Logout")');
    await expect(page.locator('text=Sign in')).toBeVisible();
  });
});
