/*
 * SPDX-FileCopyrightText: 2026 Conduction B.V.
 * SPDX-License-Identifier: EUPL-1.2
 *
 * One-time login, shared by every project via `dependencies: ['setup']`.
 *
 * Credentials come from the environment with a dev-instance default, because
 * the base URL — the thing that decides WHICH instance gets the login attempt
 * — is already mandatory and 8080-guarded in playwright.config.ts. A suite
 * that logs in on every spec against a shared instance is how brute-force
 * lockouts get fired at other people's containers.
 */

import { expect, test as setup } from '@playwright/test'
import * as path from 'path'

const AUTH_FILE = path.join(__dirname, '.auth', 'admin.json')

const USER = process.env.NEXTCLOUD_ADMIN_USER || 'admin'
const PASS = process.env.NEXTCLOUD_ADMIN_PASSWORD || 'admin'

setup('authenticate as admin', async ({ page }) => {
	await page.goto('/login')

	await page.locator('#user').fill(USER)
	await page.locator('#password').fill(PASS)
	await page.locator('button[type=submit]').click()

	// Assert the login actually succeeded rather than trusting the click.
	// A wrong password re-renders /login with the same form, so waiting for
	// "not the login page" is the meaningful assertion, not `networkidle`.
	await expect(page).toHaveURL(/\/apps\//, { timeout: 30_000 })

	await page.context().storageState({ path: AUTH_FILE })
})
