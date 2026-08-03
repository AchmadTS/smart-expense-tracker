import { test, expect } from '@playwright/test';
import { SignJWT } from 'jose';
import dotenv from 'dotenv';

dotenv.config();

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

    test('harus sukses masuk dashboard jika OTP benar (Real Middleware & Real Dashboard)', async ({ page }) => {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET tidak ditemukan di environment file (.env)!");
        }

        const secretKey = new TextEncoder().encode(secret);
        const validJwtToken = await new SignJWT({
            userId: '01KZ11NBANF7PFN9GCD83KQNGS',
            email: 'thirfanurmufida@gmail.com'
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(secretKey);

        await page.route(/\/api\/auth\/2fa\/verify-login/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: {
                    'Set-Cookie': `token=${validJwtToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
                },
                body: JSON.stringify({ success: true, redirect: '/dashboard' })
            });
        });

        await page.goto('http://localhost:3000/login');
        await page.getByPlaceholder('you@example.com').pressSequentially('thirfanurmufida@gmail.com', { delay: 50 });
        await page.getByPlaceholder('••••••••').pressSequentially('$aTs130425.', { delay: 50 });
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page.getByText(/two-factor auth/i)).toBeVisible({ timeout: 10000 });

        const correctOtp = ['1', '2', '3', '4', '5', '6'];
        for (let i = 0; i < 6; i++) {
            await page.locator('input[inputmode="numeric"]').nth(i).fill(correctOtp[i]);
        }

        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
    });

    test('harus gagal dan menampilkan error jika Backup Code salah', async ({ page }) => {
        await page.route(/\/api\/auth\/2fa\/verify-backup/, async (route) => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Invalid backup code. It may have been used or typed incorrectly.' })
            });
        });

        await page.goto('http://localhost:3000/login');
        await page.getByPlaceholder('you@example.com').pressSequentially('thirfanurmufida@gmail.com', { delay: 50 });
        await page.getByPlaceholder('••••••••').pressSequentially('$aTs130425.', { delay: 50 });
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page.getByText(/two-factor auth/i)).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: /use backup code/i }).click();
        await expect(page.getByText(/emergency login/i)).toBeVisible({ timeout: 10000 });
        const wrongCode = ['X', 'X', 'X', 'X', 'Y', 'Y', 'Y', 'Y'];
        for (let i = 0; i < 8; i++) {
            await page.locator('input[maxLength="1"]').nth(i).fill(wrongCode[i]);
        }

        await expect(page.getByText(/invalid backup code/i)).toBeVisible({ timeout: 10000 });
        await expect(page).toHaveURL(/.*\/login/);
    });

    test('harus sukses masuk dashboard jika Backup Code benar (Real Middleware & Real Dashboard)', async ({ page }) => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET tidak ditemukan di environment file (.env)!");
        }
        const secretKey = new TextEncoder().encode(secret);
        const validJwtToken = await new SignJWT({
            userId: '01KZ11NBANF7PFN9GCD83KQNGS',
            email: 'thirfanurmufida@gmail.com'
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(secretKey);

        await page.route(/\/api\/auth\/2fa\/verify-backup/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: {
                    'Set-Cookie': `token=${validJwtToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
                },
                body: JSON.stringify({ success: true, redirect: '/dashboard' })
            });
        });

        await page.goto('http://localhost:3000/login');
        await page.getByPlaceholder('you@example.com').pressSequentially('thirfanurmufida@gmail.com', { delay: 50 });
        await page.getByPlaceholder('••••••••').pressSequentially('$aTs130425.', { delay: 50 });
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page.getByText(/two-factor auth/i)).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: /use backup code/i }).click();
        await expect(page.getByText(/emergency login/i)).toBeVisible({ timeout: 10000 });

        const correctCode = ['1', '2', '3', '4', 'A', 'B', 'C', 'D'];
        for (let i = 0; i < 8; i++) {
            await page.locator('input[maxLength="1"]').nth(i).fill(correctCode[i]);
        }

        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
    });

    test('harus berhasil login menggunakan Passkey (Advanced API Mocking)', async ({ page }) => {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET tidak ditemukan di environment file (.env)!");
        }

        const secretKey = new TextEncoder().encode(secret);
        const validJwtToken = await new SignJWT({
            userId: '01KYZZ6VKK5PWYXHWC084N60C7',
            email: 'achmadtirtosudirosudiro@gmail.com'
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(secretKey);

        await page.addInitScript(() => {
            window.PublicKeyCredential = class { } as unknown as typeof PublicKeyCredential;
            window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = async () => true;
            window.PublicKeyCredential.isConditionalMediationAvailable = async () => true;
            if (!navigator.credentials) {
                Object.defineProperty(navigator, 'credentials', {
                    value: {},
                    configurable: true,
                    writable: true,
                    enumerable: true
                });
            }

            navigator.credentials.get = async () => {
                const dummyBuffer = new TextEncoder().encode('valid-dummy-data').buffer;

                return {
                    id: 'mock-passkey-id',
                    rawId: dummyBuffer,
                    response: {
                        authenticatorData: dummyBuffer,
                        clientDataJSON: dummyBuffer,
                        signature: dummyBuffer,
                        userHandle: dummyBuffer,
                    },
                    authenticatorAttachment: 'platform',
                    type: 'public-key',
                    getClientExtensionResults: () => ({})
                } as unknown as PublicKeyCredential;
            };
        });

        await page.route('**/api/auth/**', async (route) => {
            const request = route.request();
            const url = request.url();
            const isPasskeyRoute = url.includes('passkey');
            const isVerifyEndpoint = url.includes('verify');

            if (isPasskeyRoute && isVerifyEndpoint) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: {
                        'Set-Cookie': `token=${validJwtToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
                    },
                    body: JSON.stringify({ success: true, redirect: '/dashboard' })
                });
            } else {
                await route.continue();
            }
        });

        await page.goto('http://localhost:3000/login');
        await page.getByPlaceholder('you@example.com').pressSequentially('achmadtirtosudirosudiro@gmail.com', { delay: 50 });
        await page.getByRole('button', { name: /sign in with passkey/i }).click();
        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
    });
});