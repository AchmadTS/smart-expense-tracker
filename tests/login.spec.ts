import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

    test('harus menampilkan error jika kredensial salah', async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'salahpassword');
        await page.click('button[type="submit"]');
        await expect(page.getByText(/invalid|failed/i)).toBeVisible();
    });

    test('harus langsung ke dashboard jika login benar dan 2FA TIDAK aktif', async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.getByPlaceholder('you@example.com').pressSequentially('achmadtirtosudirosudiro@gmail.com', { delay: 50 });
        await page.getByPlaceholder('••••••••').pressSequentially('$aTs130425.', { delay: 50 });
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
    });

    test('harus memunculkan OTP jika login benar dan 2FA AKTIF', async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.getByPlaceholder('you@example.com').pressSequentially('thirfanurmufida@gmail.com', { delay: 50 });
        await page.getByPlaceholder('••••••••').pressSequentially('$aTs130425.', { delay: 50 });
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page.getByText(/two-factor auth/i)).toBeVisible({ timeout: 10000 });
    });

    test('harus gagal dan menampilkan error jika OTP salah', async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.getByPlaceholder('you@example.com').pressSequentially('thirfanurmufida@gmail.com', { delay: 50 });
        await page.getByPlaceholder('••••••••').pressSequentially('$aTs130425.', { delay: 50 });
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page.getByText(/two-factor auth/i)).toBeVisible({ timeout: 10000 });

        const wrongOtp = ['0', '0', '0', '0', '0', '0'];
        for (let i = 0; i < 6; i++) {
            await page.locator('input[inputmode="numeric"]').nth(i).fill(wrongOtp[i]);
        }

        await expect(page.getByText(/invalid 6-digit code/i)).toBeVisible({ timeout: 10000 });
        await expect(page).toHaveURL(/.*\/login/);
    });
});