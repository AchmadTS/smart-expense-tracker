import { test, expect } from '@playwright/test';
import { SignJWT } from 'jose';
import dotenv from 'dotenv';

dotenv.config();

test.describe('Registration Flow', () => {

    test('harus mencegah submit dan menahan pengguna di halaman register jika form kosong', async ({ page }) => {
        await page.goto('http://localhost:3000/register');
        const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /register|sign up|create/i }).first();
        await submitBtn.click({ force: true });
        await expect(page).toHaveURL(/.*\/register/);
    });

    test('harus berhasil menggunakan fitur Generate Password dan menampilkan status Strong', async ({ page }) => {
        await page.goto('http://localhost:3000/register');
        await page.getByRole('button', { name: /generate password/i }).click();
        await expect(page.getByText(/strong password generated/i).first()).toBeVisible();
        await expect(page.getByText(/strong password ✨/i).first()).toBeVisible();
        const passwordInput = page.getByPlaceholder('At least 6 characters');
        await expect(passwordInput).toHaveAttribute('type', 'text');
        const inputValue = await passwordInput.inputValue();
        expect(inputValue.length).toBeGreaterThanOrEqual(12);
    });

    test('harus gagal dan menampilkan error jika email sudah terdaftar', async ({ page }) => {
        await page.route('**/api/auth/register', async (route) => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Email is already registered' })
            });
        });

        await page.goto('http://localhost:3000/register');
        await page.waitForLoadState('domcontentloaded');
        await page.locator('input[name="name"]').pressSequentially('Faiq', { delay: 30 });
        await page.locator('input[name="email"]').pressSequentially('thirfanurmufida@gmail.com', { delay: 30 });
        await page.getByPlaceholder('At least 6 characters').pressSequentially('PasswordKuat123!', { delay: 30 });

        await Promise.all([
            page.waitForResponse('**/api/auth/register'),
            page.locator('button[type="submit"]').click({ force: true })
        ]);

        await expect(page.getByText(/email is already registered/i).first()).toBeVisible({ timeout: 10000 });
        await expect(page).toHaveURL(/.*\/register/);
    });

    test('harus sukses register dan masuk dashboard (Real Middleware & Mock API)', async ({ page }) => {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET tidak ditemukan di environment file (.env)!");
        }

        const secretKey = new TextEncoder().encode(secret);
        const validJwtToken = await new SignJWT({
            userId: '01KYZZ6VKK5PWYXHWC084N60C7',
            email: 'newuser@example.com'
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(secretKey);

        await page.route('**/api/auth/register', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: {
                    'Set-Cookie': `token=${validJwtToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
                },
                body: JSON.stringify({
                    success: true,
                    token: validJwtToken,
                    user: {
                        id: '01KYZZ6VKK5PWYXHWC084N60C7',
                        name: 'Pengguna Baru',
                        email: 'newuser@example.com',
                        currency: 'IDR'
                    }
                })
            });
        });

        await page.goto('http://localhost:3000/register');
        await page.waitForLoadState('domcontentloaded');

        await page.locator('input[name="name"]').pressSequentially('Pengguna Baru', { delay: 30 });
        await page.locator('input[name="email"]').pressSequentially('newuser@example.com', { delay: 30 });
        await page.getByPlaceholder('At least 6 characters').pressSequentially('SangatKuat123!', { delay: 30 });

        await Promise.all([
            page.waitForResponse('**/api/auth/register'),
            page.locator('button[type="submit"]').click({ force: true })
        ]);

        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
    });
});