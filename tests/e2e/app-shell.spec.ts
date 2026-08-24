/*
 * SPDX-FileCopyrightText: 2026 Conduction B.V.
 * SPDX-License-Identifier: EUPL-1.2
 *
 * App-shell regression suite.
 *
 * Every assertion here exists because the Vue 2 -> Vue 3 migration could
 * break it *silently*: the failure modes below produce a page that still
 * renders, with an empty console, and only look wrong if you know what
 * should have been there.
 *
 * First-visit overlays (the support dialog and the walkthrough) are seeded
 * as already-seen via the shared helpers rather than dismissed per test —
 * dismissal races the mount, seeding does not.
 */

import {
	findMounted,
	mountedComponentNames,
	seedFirstVisitOverlaysSeen,
} from '@conduction/nextcloud-vue/testing/playwright'
import { expect, test } from '@playwright/test'
import { appUrl } from './_app-url.ts'

const APP_ID = 'apptemplate'

test.beforeEach(async ({ page }) => {
	await seedFirstVisitOverlaysSeen(page, APP_ID)
})

test.describe('app shell', () => {
	test('the Vue 3 app actually mounts CnAppRoot', async ({ page }) => {
		await page.goto(await appUrl(page))

		// `createApp(...).mount('#content')` failing leaves the server-rendered
		// container in place, so "the page loaded" proves nothing. Assert the
		// component tree exists.
		const names = await mountedComponentNames(page)
		expect(names).toContain('CnAppRoot')

		// The root props are what changed shape in Vue 3: the Vue 2 bootstrap
		// passed `render: h => h(App, { props: {...} })`, and the Vue 3
		// equivalent takes them as the second argument to `createApp`. Getting
		// that wrong hands App a single prop literally named "props" and the
		// manifest silently arrives undefined.
		const [app] = await findMounted(page, 'App')
		expect(app, 'App component should be mounted').toBeTruthy()
		expect(app.props.manifest, 'manifest prop must reach App').toBeTruthy()
		// FOUR, not five. The manifest used to declare an in-app
		// `type: "settings"` page at /settings alongside the Nextcloud admin
		// section, which is two homes for one concern and an ADR-079 D1
		// violation (gate-63). That page was removed; app configuration lives
		// at /settings/admin/apptemplate. Update this number deliberately if a
		// page is added — it is here to catch a manifest that silently stopped
		// reaching App, and a wrong number would hide exactly that.
		expect((app.props.manifest as { pages?: unknown[] }).pages?.length).toBe(4)
	})

	test('every manifest page renders its own content', async ({ page }) => {
		// One route per manifest page. A Vue Router 4 misconfiguration renders
		// the shell with an empty <main> rather than erroring.
		// `settings` used to be the third entry, asserting /Application
		// information/. That page is gone (ADR-079 D1 — app configuration lives
		// at /settings/admin/apptemplate, not in the SPA), so the route would
		// have fallen through to the catch-all and this spec would have been
		// asserting against the dashboard while claiming to cover a settings
		// page. `features-roadmap` is the real third manifest page.
		const routes = [
			{ path: await appUrl(page), expect: /Recent examples/ },
			{ path: await appUrl(page, 'examples'), expect: /No items found|Table/ },
			{
				path: await appUrl(page, 'features-roadmap'),
				expect: /Features & roadmap|Features and roadmap/,
			},
		]

		for (const route of routes) {
			await page.goto(route.path)
			// `#content`, not `main` — the roadmap page renders its own <main>
			// inside Nextcloud's, and a two-element match is a strict-mode
			// failure rather than a content assertion.
			const main = page.locator('#content')
			await expect(
				main,
				`${route.path} should render page content`,
			).toContainText(route.expect)
		}
	})

	test('no built-in widget resolves to the "Widget unavailable" placeholder', async ({
		page,
	}) => {
		// Built-in widgets self-register as a module side effect, which webpack
		// tree-shakes unless `registerBuiltinDashboardWidgets()` is called at
		// bootstrap. When it is missing, EVERY built-in widgetKey renders
		// `.cn-unknown-widget` with zero console output while consumer widgets
		// from src/registry.js keep working — so the app looks half-built
		// rather than mis-wired. This caught a real regression on the Settings
		// page (`version-info`) and on the detail page, whose sidebar declared
		// `object-data` when the library's key is `data`.
		// `settings` was in this list until the in-app type:settings page was
		// removed (ADR-079 D1). Left in, it would have kept "passing" against
		// the catch-all's dashboard render — a route that no longer exists
		// looking exactly like a route that works. `features-roadmap` is a
		// real page and carries the same built-in widgets.
		for (const path of [
			await appUrl(page),
			await appUrl(page, 'examples'),
			await appUrl(page, 'features-roadmap'),
			await appUrl(page, 'examples/1'),
		]) {
			await page.goto(path)
			// `#content`, not `main`: the FeaturesRoadmap page renders its own
			// <main> inside Nextcloud's, so `locator('main')` matches two
			// elements and Playwright fails on a strict-mode violation. This
			// only surfaced when the dead `settings` route in the list
			// above was replaced with a real page — the old route fell through
			// to the catch-all, which rendered a single-<main> dashboard.
			await expect(page.locator('#content')).not.toHaveText(/^\s*$/)
			await expect(
				page.locator('.cn-unknown-widget'),
				`${path} must not render any "Widget unavailable" placeholder`,
			).toHaveCount(0)
		}
	})

	test('navigation icons render as real glyphs', async ({ page }) => {
		await page.goto(await appUrl(page))

		// An icon name that is not in src/icons.js renders NOTHING — not a
		// fallback glyph — so a missing registration is invisible unless the
		// painted size is measured. Four manifest menu entries carry an icon.
		const navIcons = page.locator(
			'#app-navigation-vue a svg, nav[aria-label] a svg',
		)
		await expect(navIcons.first()).toBeVisible()

		const sizes = await page
			.locator('#app-navigation-vue a')
			.evaluateAll((links) =>
				links.map((a) => {
					const svg = a.querySelector('svg')
					const r = svg?.getBoundingClientRect()
					return {
						label: a.textContent?.trim() ?? '',
						w: r ? Math.round(r.width) : 0,
					}
				}),
			)

		const painted = sizes.filter((s) => s.w > 0)
		expect(
			painted.length,
			`expected 4 painted nav icons, got ${JSON.stringify(sizes)}`,
		).toBe(4)
	})

	test('dashboard widgets have non-zero width', async ({ page }) => {
		await page.goto(await appUrl(page))

		const widget = page.locator('.cn-widget-wrapper').first()
		await expect(widget).toBeVisible()

		// gridstack ships its sizing in CSS: v12 sets item width from
		// `var(--gs-column-width)`. Miss the stylesheet import and every item
		// lays out 0 px wide with no error, which `toBeVisible()` alone does
		// NOT catch. Measure.
		const box = await widget.boundingBox()
		expect(box, 'widget should have a layout box').not.toBeNull()
		expect(box!.width).toBeGreaterThan(100)
		expect(box!.height).toBeGreaterThan(20)
	})

	test('the router catch-all redirects unknown paths to the dashboard', async ({
		page,
	}) => {
		// Vue Router 4 removed the bare `path: '*'` wildcard. Left unmigrated,
		// the catch-all never matches: the shell renders and <main> stays
		// empty, with no console error and no 404.
		//
		// This has to be navigated through `appUrl`, not the pretty literal.
		// With a base the router cannot strip, EVERY path bounces to the
		// dashboard — so this spec passed while proving nothing, because
		// "the catch-all redirected me" and "routing is completely broken"
		// produce the identical page. Resolving the base is what makes the
		// redirect evidence of the catch-all rather than of the bug.
		await page.goto(await appUrl(page, 'this-route-does-not-exist'))

		await expect(page).toHaveURL(new RegExp(`/apps/${APP_ID}/?$`))
		await expect(page.locator('main')).toContainText(/Recent examples/)
	})

	test('the admin settings panel mounts from its own entry point', async ({
		page,
	}) => {
		// src/settings.js is a SEPARATE webpack entry with its own
		// `createApp(...).mount('#apptemplate-settings')`. It mounts inside a
		// translation callback, so a rejected translation fetch used to leave
		// the panel permanently blank.
		await page.goto('/settings/admin/apptemplate')

		const section = page.locator('#apptemplate-settings')
		await expect(section).toContainText(/App Template/)
		await expect(section).toContainText(/Pre-app-boot configuration/)
	})
})
