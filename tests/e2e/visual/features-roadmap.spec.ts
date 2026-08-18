/*
 * SPDX-FileCopyrightText: 2026 Conduction B.V.
 * SPDX-License-Identifier: EUPL-1.2
 *
 * Visual-regression baseline for the Features & roadmap page (gate-26).
 *
 * WHY A VISUAL TEST AND NOT ANOTHER ASSERTION-BASED ONE. FeaturesRoadmap is a
 * presentational page: it renders a manifest-driven list and almost no logic.
 * The failure modes that actually happen to it are the ones assertions do not
 * see — a stylesheet that stopped being emitted, a grid that collapses to one
 * column, a card that overflows its container. Every one of those leaves the
 * DOM intact and the console empty, so a test that queries for text passes
 * while the page is visibly broken.
 *
 * Deliberately NOT a full-page screenshot of the Nextcloud chrome: the header,
 * avatar and app list belong to the server, change between versions, and would
 * make this fail for reasons that have nothing to do with this app. The
 * baseline is scoped to the app's own content region.
 */

import { seedFirstVisitOverlaysSeen } from '@conduction/nextcloud-vue/testing/playwright'
import { expect, test } from '@playwright/test'
import { appUrl } from '../_app-url.ts'

const APP_ID = 'apptemplate'

test.beforeEach(async ({ page }) => {
	await seedFirstVisitOverlaysSeen(page, APP_ID)
})

// The component under test is src/views/FeaturesRoadmap.vue — named here on
// purpose. gate-26 pairs a page component with its baseline by NAME, so a spec
// that only mentions the route would leave FeaturesRoadmap looking uncovered.
test.describe('visual: FeaturesRoadmap', () => {
	test('FeaturesRoadmap matches its baseline', async ({ page }) => {
		await page.goto(await appUrl(page, 'features-roadmap'), {
			waitUntil: 'domcontentloaded',
		})

		// Wait for the app's own content, not for the network: Nextcloud keeps
		// background requests in flight, so `networkidle` never settles here
		// (ADR-074 rule 4).
		//
		// `#content` and NOT `main`: Nextcloud's own chrome renders a <main>
		// and so does the app inside it, so `locator('main')` matches TWO
		// elements and Playwright fails the whole test on a strict-mode
		// violation. `#content` is the single element the app mounts into
		// (`createApp(...).mount('#content')`), which is also exactly the
		// region this baseline should cover — the server chrome around it
		// changes between Nextcloud versions and is not this app's to pin.
		const content = page.locator('#content')
		await expect(content).toBeVisible()
		await expect(content).not.toHaveText(/^\s*$/)

		// Animations and carets are the two classic sources of a screenshot
		// that differs on every run for no real reason.
		await expect(content).toHaveScreenshot('FeaturesRoadmap.png', {
			animations: 'disabled',
			caret: 'hide',
			// Font rendering and sub-pixel antialiasing differ enough between
			// a local run and the CI container to trip a zero-tolerance
			// comparison on text-heavy pages. This is wide enough to absorb
			// that and far too narrow to absorb a collapsed layout.
			maxDiffPixelRatio: 0.02,
		})
	})
})
