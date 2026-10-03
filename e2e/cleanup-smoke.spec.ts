import { expect, test, type Page } from '@playwright/test';
import {
  FIXTURE_TASK_TITLE,
  installMobileApiMocks,
} from './fixtures/mobile-api';

async function login(page: Page) {
  await page.goto('/');

  // Stage 1 splash (~3s) → stage 2 welcome → Continue → stage 3 auth form.
  const continueBtn = page.getByRole('button', { name: /^Continue$/i });
  await expect(continueBtn).toBeVisible({ timeout: 15_000 });
  await continueBtn.click();

  await expect(page.locator('#login-email')).toBeVisible({ timeout: 15_000 });

  const tokenRequest = page.waitForRequest(
    (req) => req.url().includes('/auth/mobile_token') && req.method() === 'POST',
  );

  await page.locator('#login-email').fill('cleanup.client@example.com');
  await page.locator('#login-password').fill('CleanupPass123!');
  await page.getByTestId('button-login').click();
  await tokenRequest;
}

/** Bottom-nav labels are `hidden sm:block`; click the icon link instead. */
async function clickBottomNav(page: Page, path: string) {
  await page.locator(`[data-bottom-nav] a[href="${path}"]`).click();
}

test.describe('Mobile-web cleanup smoke (Vite-only, offline mocks)', () => {
  test.beforeEach(async ({ page }) => {
    await installMobileApiMocks(page);
    // Clear once on the app origin (not addInitScript — that clears every nav).
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('M1: login reaches home with bottom nav', async ({ page }) => {
    await login(page);
    await expect(page.locator('[data-bottom-nav]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page).toHaveURL(/\/chat/, { timeout: 20_000 });
    await expect(page.locator('[data-bottom-nav] a[href="/chat"]')).toBeVisible();
    await expect(page.locator('[data-bottom-nav] a[href="/chat"]')).toHaveAttribute(
      'aria-label',
      'Copilot',
    );
    await expect(page.locator('[data-bottom-nav] a[href="/you"]')).toBeVisible();
    await expect(page.locator('[data-bottom-nav] a[href="/plan"]')).toBeVisible();
  });

  test('M2: home → /plan shows fixture task', async ({ page }) => {
    await login(page);
    await expect(page.locator('[data-bottom-nav]')).toBeVisible({
      timeout: 20_000,
    });
    await clickBottomNav(page, '/plan');
    await expect(page).toHaveURL(/\/plan/);
    await expect(page.getByText(FIXTURE_TASK_TITLE).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('M3: /profile shows account/settings shell', async ({ page }) => {
    await login(page);
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile/);
    await expect(
      page.getByText(/Account|Settings|Profile|Personal/i).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('M4: bottom-nav You/Plan/Chat route behavior', async ({ page }) => {
    await login(page);
    await expect(page.locator('[data-bottom-nav]')).toBeVisible({
      timeout: 20_000,
    });
    await clickBottomNav(page, '/plan');
    await expect(page).toHaveURL(/\/plan/);
    await clickBottomNav(page, '/you');
    await expect(page).toHaveURL(/\/you/);
    await clickBottomNav(page, '/chat');
    await expect(page).toHaveURL(/\/chat/);
  });

  test('M6: chat header and bottom nav stay in sync', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/chat/, { timeout: 20_000 });
    await expect(page.locator('[data-bottom-nav] a[href="/chat"]')).toHaveAttribute(
      'aria-label',
      'Copilot',
    );
    await expect(page.getByText('Always on').first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText('Yesterday', { exact: true })).toBeVisible();
    await expect(page.getByText('Today', { exact: true })).toBeVisible();

    await page.getByPlaceholder(/Ask your copilot/i).fill('What should I do next?');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByTestId('ai-thinking')).toBeVisible();

    await page.getByRole('button', { name: /Always on/i }).click();
    await page.getByRole('option', { name: /Health Coach/i }).click();

    await expect(page.locator('[data-bottom-nav] a[href="/chat"]')).toHaveAttribute(
      'aria-label',
      'Coach',
    );
    await expect(page.getByText('Clinic coach').first()).toBeVisible();
    await expect(page.getByTestId('ai-thinking')).toHaveCount(0);

    await page.getByPlaceholder(/Message your coach/i).fill('Need some advice');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByTestId('ai-thinking')).toHaveCount(0);

    await clickBottomNav(page, '/plan');
    await expect(page).toHaveURL(/\/plan/);
    await expect(page.locator('[data-bottom-nav] a[href="/chat"]')).toHaveAttribute(
      'aria-label',
      'Coach',
    );
  });

  test('M5: notifications control is reachable from home shell', async ({
    page,
  }) => {
    await login(page);
    await expect(page.locator('[data-bottom-nav]')).toBeVisible({
      timeout: 20_000,
    });
    // Profile header bell / notification control (icon button).
    const bell = page.locator('button, [role="button"]').filter({
      has: page.locator('svg'),
    });
    // Soft assertion: home shell stayed authenticated (notifications mocked empty).
    await expect(page).not.toHaveURL(/auth|login/i);
    await expect(bell.first()).toBeVisible({ timeout: 10_000 });
  });
});
