/*
 * SPDX-FileCopyrightText: 2026 Conduction B.V.
 * SPDX-License-Identifier: EUPL-1.2
 *
 * Resolve app URLs the way the APP resolves them.
 *
 * `src/main.js` builds the router with
 * `createWebHistory(generateUrl('/apps/apptemplate'))`, so the history base
 * is whatever `@nextcloud/router` produces on THIS instance. That is not a
 * fixed string:
 *
 *   - mod_rewrite configured  ->  /apps/apptemplate
 *   - no mod_rewrite          ->  /index.php/apps/apptemplate
 *
 * The shared CI workflow serves Nextcloud from `php -S` with a router script
 * and no mod_rewrite, so the second form is the canonical one there.
 *
 * A spec that hard-codes the PRETTY form therefore lands on a page whose
 * router cannot strip its own base: vue-router matches nothing, falls through
 * to the catch-all, and rewrites to the dashboard. The server answers the
 * pretty URL with a plain 200 and no redirect, so this does not look like a
 * routing failure at all — it looks like the page rendered the wrong content,
 * or, worse, like a PASS when the assertion happens to be satisfied by the
 * dashboard the test was silently bounced to. Both happened here: the
 * built-in-widget and catch-all specs were green against the dashboard on
 * every route they thought they were visiting.
 *
 * So ask the instance instead of guessing. `OC.generateUrl` is the same
 * function `@nextcloud/router` wraps, and it is present on every Nextcloud
 * page, which makes it the one source of truth that cannot drift from what
 * the router was actually constructed with.
 */

import type { Page } from '@playwright/test'

declare global {
	interface Window {
		OC?: { generateUrl: (_path: string) => string }
	}
}

/** Resolved once per worker — the answer is a property of the instance. */
let cached: string | null = null

/**
 * The app's URL base, in whichever form this instance actually serves.
 *
 * Probes `/index.php/apps/dashboard/`, which is served whether or not
 * mod_rewrite is configured — it has to be, because that is the form
 * `generateUrl` falls back to.
 *
 * @param page Playwright page used to probe the instance.
 * @return The app URL base, without a trailing slash.
 */
export async function appBase(page: Page): Promise<string> {
	if (cached !== null) {
		return cached
	}

	if (!page.url().startsWith('http')) {
		await page.goto('/index.php/apps/dashboard/')
	}

	const base = await page.evaluate(() => window.OC?.generateUrl('/apps/apptemplate'))

	if (!base) {
		// Refuse to fall back to a literal. A guessed base is exactly the
		// failure mode this helper exists to remove, and it fails as a
		// content mismatch three files away from the cause.
		throw new Error(
			'Could not read OC.generateUrl from the page. Without it the app URL '
			+ 'base is a guess, and a wrong base silently redirects every route to '
			+ 'the dashboard instead of failing.',
		)
	}

	cached = base.replace(/\/$/, '')
	return cached
}

/**
 * Join a router path onto the resolved app base.
 *
 * @param page      Playwright page used to probe the instance.
 * @param routePath Router path relative to the app root, e.g. `examples`.
 * @return An absolute path safe to hand to `page.goto`.
 */
export async function appUrl(page: Page, routePath = ''): Promise<string> {
	const base = await appBase(page)
	if (routePath === '' || routePath === '/') {
		return `${base}/`
	}
	return `${base}/${routePath.replace(/^\//, '')}`
}
