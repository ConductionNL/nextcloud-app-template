/*
 * SPDX-FileCopyrightText: 2026 Conduction B.V.
 * SPDX-License-Identifier: EUPL-1.2
 *
 * Playwright config for the Nextcloud App Template.
 *
 * Scaffolded by /journeydoc-init (ADR-030). Two projects:
 *
 *   - `chromium`     — the default regression project. Excludes the
 *                      docs capture spec so PR pipelines don't reshoot
 *                      screenshots on every push. Add regression specs
 *                      under `tests/e2e/` and they run here.
 *   - `docs-capture` — the journeydoc screenshot capture project.
 *                      Opt-in: `npx playwright test --project docs-capture`.
 *                      Output lands in
 *                      `docs/static/screenshots/tutorials/{user,admin}/`.
 *
 * Point at a running Nextcloud with PLAYWRIGHT_BASE_URL. There is NO
 * default: a suite with a fallback base URL is a suite that runs against
 * whatever happens to be on that port. Two apps in this fleet were found
 * driving their e2e runs into the SHARED dev container on :8080 — one of
 * them through its login specs, so every run fired failed logins and
 * brute-force lockouts at an instance other people were using. The config
 * throws instead.
 *
 *     PLAYWRIGHT_BASE_URL=http://localhost:8096 npx playwright test
 *
 * Spin up a disposable, isolated instance to point it at rather than
 * reusing a shared one.
 */

import { defineConfig, devices } from '@playwright/test'

/**
 * Resolve the base URL, refusing to invent one.
 *
 * `NEXTCLOUD_URL` stays accepted as a legacy alias so existing tooling and
 * the docs-capture instructions keep working, but neither variable gets a
 * fallback — an unset base URL is a configuration error, not a default.
 */
function resolveBaseURL(): string {
	const url = process.env.PLAYWRIGHT_BASE_URL || process.env.NEXTCLOUD_URL
	if (!url) {
		throw new Error(
			'PLAYWRIGHT_BASE_URL is not set. Refusing to fall back to a default '
			+ 'host — that is how e2e suites end up running against a shared '
			+ 'Nextcloud instance. Example:\n'
			+ '  PLAYWRIGHT_BASE_URL=http://localhost:8096 npx playwright test',
		)
	}
	if (/:8080(\/|$)/.test(url)) {
		throw new Error(
			`Refusing to run against ${url}: :8080 is the SHARED dev container. `
			+ 'Spin up a disposable instance on its own port instead.',
		)
	}
	return url
}

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 30_000,
	expect: { timeout: 10_000 },
	fullyParallel: false,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: [
		['html', { open: 'never', outputFolder: 'tests/e2e/playwright-report' }],
		['list'],
	],
	outputDir: 'tests/e2e/test-results',

	use: {
		baseURL: resolveBaseURL(),
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},

	projects: [
		// Logs in once and writes tests/e2e/.auth/admin.json. Every other
		// project depends on it, so no spec has to carry credentials.
		{
			name: 'setup',
			testMatch: /auth\.setup\.ts$/,
			use: { ...devices['Desktop Chrome'] },
		},
		// Default regression project. Excludes the docs capture spec so
		// PR pipelines don't reshoot screenshots on every push.
		{
			name: 'chromium',
			testIgnore: ['**/docs-screenshots.spec.ts', '**/auth.setup.ts'],
			dependencies: ['setup'],
			use: {
				...devices['Desktop Chrome'],
				storageState: 'tests/e2e/.auth/admin.json',
			},
		},
		// Documentation capture project (ADR-030 / journeydoc). Opt-in:
		//   npx playwright test --project docs-capture
		// Output lands in `docs/static/screenshots/tutorials/{user,admin}/`.
		{
			name: 'docs-capture',
			testMatch: /docs-screenshots\.spec\.ts$/,
			dependencies: ['setup'],
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1280, height: 800 },
				storageState: 'tests/e2e/.auth/admin.json',
			},
			timeout: 90_000,
		},
	],
})
