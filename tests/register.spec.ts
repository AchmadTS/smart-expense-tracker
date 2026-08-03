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
});