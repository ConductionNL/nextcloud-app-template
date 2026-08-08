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
 * the docs-capture instructions keep working, and `BASE_URL` is accepted
 * because that is the variable the shared ConductionNL `quality.yml`
 * Playwright job exports for its PHP built-in server. It is checked last so
 * an explicit local override always wins. None of them gets a fallback — an
 * unset base URL is a configuration error, not a default.
 */
function resolveBaseURL(): string {
	const url = process.env.PLAYWRIGHT_BASE_URL
		|| process.env.NEXTCLOUD_URL
		|| process.env.BASE_URL
	if (!url) {
		throw new Error(
			'PLAYWRIGHT_BASE_URL is not set. Refusing to fall back to a default '
			+ 'host — that is how e2e suites end up running against a shared '
			+ 'Nextcloud instance. Example:\n'
			+ '  PLAYWRIGHT_BASE_URL=http://localhost:8096 npx playwright test',
		)
	}
	// The :8080 refusal is about the SHARED dev container, which only exists on
	// a developer machine. On a CI runner :8080 is the job's OWN `php -S
	// 0.0.0.0:8080`, spun up and torn down inside that job — the single most
	// disposable instance there is, and the only one the shared workflow
	// offers. Refusing it there does not protect anything; it just prevents the
	// suite from ever running, which is how this app's e2e job came to be
	// permanently unable to start.
	//
	// So keep the guard exactly as strict off CI, and let CI through. This is
	// the same CI-gated exemption that opencatalogi's tests/e2e/ci-seed.sh and
	// petstore's tests/e2e/_base-url.ts already use for the identical reason.
	const isCI = process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true'
	if (/:8080(\/|$)/.test(url) && !isCI) {
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
	// The shared ConductionNL CI job caps the Playwright suite at
	// `timeout-minutes: 45` (.github/workflows/quality.yml). A job cancelled by
	// that cap produces NO verdict: Playwright never prints its tally, the
	// `if: failure()` trace upload never fires, and the `if: always()` report
	// upload does not run on a cancelled job either. The one run you most need
	// to read is then the one that leaves nothing behind — and it surfaces as
	// "fail" in `gh pr checks` while carrying no information at all.
	//
	// Stopping on our own clock a few minutes early turns that silent
	// cancellation into a reported timeout WITH a tally and WITH artifacts.
	// Measured overhead in the shared job before the `Run Playwright tests`
	// step even starts is 2.0-2.4 min (openconnector run 31257480415: 2m20s;
	// opencatalogi, doriath, openregister all in the same band), and the
	// upload steps after it are seconds. 38m + ~2.5m setup + uploads lands
	// comfortably under the 45m cap, with ~7 min of margin.
	globalTimeout: 38 * 60_000,
	reporter: [
		['html', { open: 'never', outputFolder: 'tests/e2e/playwright-report' }],
		['list'],
	],
	outputDir: 'tests/e2e/test-results',

	use: {
		baseURL: resolveBaseURL(),
		// `on-first-retry` only writes a trace when a retry actually HAPPENS.
		// That makes the trace artifact a function of `retries`: with
		// `retries: 0` — which is what this config does off CI, and what two
		// fleet repos scaffolded from this template ended up with on CI too —
		// there is no first retry to trigger on, so the config reads as if
		// tracing were configured while producing nothing, ever. The defect is
		// invisible in exactly the situation it exists to cover.
		//
		// `retain-on-failure` captures every test and keeps only the ones that
		// failed. It is strictly more informative than `on-first-retry` and is
		// independent of the retry count, so an app that later sets
		// `retries: 0` cannot silently lose its traces. Do not change this back.
		trace: 'retain-on-failure',
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
