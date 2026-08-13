// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Conduction B.V.
//
// Webpack entry-point for the Nextcloud admin app-settings panel
// (Admin > Administration settings > App Template). This is DISTINCT
// from the manifest's `type: "settings"` page, which lives inside
// the SPA at `/settings` and is rendered by CnSettingsPage.
//
// Nextcloud's admin app-settings is a tiny standalone Vue mount into
// `#apptemplate-settings` (see `templates/settings/admin.php`). Most
// new apps drive the entire settings story from the manifest's
// CnSettingsPage with `version-info` / `register-mapping` widgets and
// can simplify or remove this entry-point. It stays in the template
// because the Nextcloud admin section is the canonical place for
// "before the app boots" config (e.g. an app's OR register binding).

import { createApp } from 'vue'
import {
	translate as t,
	translatePlural as n,
	loadTranslations,
} from '@nextcloud/l10n'
import pinia from './pinia.js'
import AdminRoot from './views/AdminRoot.vue'

/**
 * Mount the admin panel. Vue 3 has no global `Vue.mixin`, so the `t` / `n`
 * helpers are registered on the app instance instead of globally.
 *
 * @return {void}
 */
function mountAdminSettings() {
	const app = createApp(AdminRoot)
	app.mixin({ methods: { t, n } })
	app.use(pinia)
	app.mount('#apptemplate-settings')
}

// `loadTranslations` REJECTS on a 404, and many Nextcloud installs have no
// route for /custom_apps/<app>/l10n/<locale>.json (the Apache allowlist
// rewrites everything outside JS/CSS to index.php). Mounting only from the
// success callback would leave the admin panel permanently blank on those
// installs, so mount on BOTH outcomes — strings fall back to their English
// source on a miss. Mirrors the same guard in src/main.js: the return value
// is only a promise on some @nextcloud/l10n versions.
let mounted = false
/**
 * Mount once, whichever of the translation outcomes fires first.
 *
 * @return {void}
 */
function mountOnce() {
	if (mounted) {
		return
	}
	mounted = true
	mountAdminSettings()
}

try {
	const result = loadTranslations('apptemplate', mountOnce)
	if (result && typeof result.then === 'function') {
		result.then(mountOnce, mountOnce)
	}
} catch {
	mountOnce()
}
