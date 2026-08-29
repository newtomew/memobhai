import { test, expect } from '@playwright/test';

const DEMO_PASSWORD = 'Demo123!';
const OWNER_PASSWORD = 'Pass@2026(memobhai)';
const API = `${process.env.PLAYWRIGHT_BASE_URL || 'https://memobhai.vercel.app'}/api`;

/** Seed session via API (avoids flaky login form + cold-start UI). */
async function loginViaApi(page, request, email: string, password: string) {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  await page.goto('/');
  await page.evaluate(
    ({ token, user, organization }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('organization', JSON.stringify(organization));
    },
    { token: body.token, user: body.user, organization: body.organization },
  );
}

test.describe('Role smoke tests', () => {
  test('Login form reaches dashboard without hanging', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@demo.com');
    await page.locator('input[type="password"]').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 45_000 });
    await expect(page.getByText(/Manager Console|Overview|Dashboard/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('Employee sees dashboard, not admin panel', async ({ page, request }) => {
    await loginViaApi(page, request, 'employee@demo.com', DEMO_PASSWORD);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Greetings|Welcome/i)).toBeVisible();
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Org admin reaches admin panel', async ({ page, request }) => {
    await loginViaApi(page, request, 'admin@demo.com', DEMO_PASSWORD);
    await page.goto('/admin');
    await expect(page.getByText(/Admin|Organization|Users/i).first()).toBeVisible();
  });

  test('Manager reaches admin panel', async ({ page, request }) => {
    await loginViaApi(page, request, 'manager@demo.com', DEMO_PASSWORD);
    await page.goto('/admin');
    await expect(page.getByText(/Admin|Dashboard|Users/i).first()).toBeVisible();
  });

  test('Platform admin reaches platform panel', async ({ page, request }) => {
    await loginViaApi(page, request, 'admin@memobhai.com', OWNER_PASSWORD);
    await page.goto('/platform');
    await expect(page.getByText(/Platform|Organizations|Join/i).first()).toBeVisible();
  });

  test('Landing pricing links to register or upgrade', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Pricing|Professional|Starter/i).first()).toBeVisible();
    const upgrade = page.getByRole('link', { name: /Upgrade Now/i });
    await expect(upgrade).toBeVisible();
    const href = await upgrade.getAttribute('href');
    expect(href).toMatch(/register\?plan=professional|\/upgrade/);
  });

  test('Employee can open create memo page', async ({ page, request }) => {
    await loginViaApi(page, request, 'employee@demo.com', DEMO_PASSWORD);
    await page.goto('/memos/create');
    await expect(page.getByText(/Create|Subject|Memo/i).first()).toBeVisible();
  });
});
