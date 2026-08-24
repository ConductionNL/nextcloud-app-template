// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Conduction B.V.
//
// Webpack entry-point for the Nextcloud admin app-settings panel
// (Admin > Administration settings > App Template). THIS IS THE ONLY
// SETTINGS SURFACE.
//
// The manifest used to ALSO declare a `type: "settings"` page at `/settings`
// inside the SPA, so app configuration had two homes and this file described
// itself as "distinct" from the other one. ADR-079 D1 settles it: app
// configuration lives at /settings/admin/<app>, and an in-app page claiming
// the platform meaning of "Settings" is a violation (gate-63). The manifest
// page is gone; every app scaffolded from this template used to inherit that
// violation on day one.
//
// Nextcloud's admin app-settings is a tiny standalone Vue mount into
// `#apptemplate-settings` (see `templates/settings/admin.php`). It is the
// canonical place for "before the app boots" config — e.g. an app's
// OpenRegister register binding, which the SPA cannot ask for because it
// needs it in order to start.
//
// A domain page that merely happens to be *called* settings is fine; it just
// must not be `type: "settings"` and must not be named Settings.

import {
	loadTranslations,
	translatePlural as n,
	translate as t,
} from '@nextcloud/l10n'
import { createApp } from 'vue'
import AdminRoot from './views/AdminRoot.vue'
import pinia from './pinia.js'

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
