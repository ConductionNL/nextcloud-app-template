// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Conduction B.V.

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { translate as t, translatePlural as n, loadTranslations, register } from '@nextcloud/l10n'
import enTranslations from '../l10n/en.json'
import { generateUrl } from '@nextcloud/router'
import {
	CnPageRenderer,
	defaultPageTypes,
	registerBuiltinDashboardWidgets,
	registerIcons,
	registerTranslations,
} from '@conduction/nextcloud-vue'
import pinia from './pinia.js'
import App from './App.vue'
import bundledManifest from './manifest.json'
import customComponents from './customComponents.js'
// v2 five-kind registry — the replacement for customComponents.
// Both props coexist during the v1 → v2 transition.
// Once fully migrated to v2, remove the customComponents import and prop.
import registry from './registry.js'
import appIcons from './icons.js'

// Library CSS — must be explicit import (webpack tree-shakes side-effect imports from aliased packages)
import '@conduction/nextcloud-vue/css/index.css'

// Global (unscoped) app styles
import './assets/app.css'

// Populate the dashboard widget CATALOGUE (the "Add widget" palette).
//
// Note the two distinct registries — they are easy to confuse:
//   * `BUILT_IN_WIDGETS` in CnWidgetGrid is a plain static import map. It is
//     what resolves a manifest `widgetKey` at RENDER time, and it needs no
//     registration call.
//   * the dashboard widget catalogue is populated by SIDE EFFECT of each
//     widget's `dashboardRegistration.js` being evaluated. That is what the
//     dashboard editor's widget picker reads.
//
// A bundler that tree-shakes bare side-effect imports drops the second one, so
// the library exports this explicit no-op to anchor it. Calling it costs
// nothing and keeps the picker populated.
//
// It does NOT rescue a manifest `widgetKey` that simply does not exist — that
// renders `.cn-unknown-widget` ("Widget unavailable") regardless. See the
// manifest key fixes in this same change (`object-data` → `data`, and the
// duplicate v2 `version-info` entry removed). tests/e2e/app-shell.spec.ts
// asserts `.cn-unknown-widget` count is 0.
registerBuiltinDashboardWidgets()

// Register library-side icon set + lib translations once at bootstrap.
registerIcons(appIcons)
try {
	registerTranslations()
} catch (e) {
	// Non-fatal — lib translations fall back to English source.
	// eslint-disable-next-line no-console
	console.warn('[app-template] registerTranslations failed; falling back to English', e)
}

// Register English translations from the bundled en.json. loadTranslations()
// short-circuits for the 'en' locale (it assumes the key IS the English text),
// but this template uses slugged keys like 'app-availability.title', so we must
// register en.json explicitly to get readable strings instead of raw slugs.
register('app-template', enTranslations.translations)

// Fire-and-forget translation load. Some Nextcloud installs (including
// standard dev containers) only allow the JS/CSS allowlist through
// Apache and rewrite everything else to index.php — there's no route
// for /custom_apps/<app>/l10n/<locale>.json so the request 404s.
// `loadTranslations` rejects on 404, so wrapping the Vue mount inside
// its callback would silently fail boot when translations can't load.
// Strings just fall back to their English source on miss; boot MUST
// not depend on this resolving.
function tryLoadTranslations() {
	try {
		const result = loadTranslations('app-template', () => {})
		if (result && typeof result.then === 'function') {
			result.then(() => {}, () => {})
		}
	} catch {
		// no-op
	}
}

// Shallow-clone CnPageRenderer before handing it to Vue Router.
//
// The lib's barrel exports are frozen / non-extensible module records, and
// Vue Router writes bookkeeping onto a route's `component` in some code
// paths. Cloning gives the router a plain, extensible component-options
// object without mutating the library's own export. (Under Vue 2 this was
// mandatory because `Vue.extend()` attached a `_Ctor` cache and threw
// "Cannot add property _Ctor, object is not extensible"; Vue 3 has no
// `_Ctor`, but the clone stays as cheap insurance — see the Vue 3 migration
// playbook §4.1 on frozen lib exports.)
const RoutePageRenderer = { ...CnPageRenderer }

/**
 * Build the vue-router config from the manifest. Each manifest page becomes
 * one route; the route's `name` IS `page.id` (per the lib's manifest contract).
 * Routes whose path declares a `:` parameter receive `props: true` so the
 * built-in detail / index components can read the route param without each
 * consumer wiring it manually.
 *
 * @param {object} manifest The bundled manifest (with `pages[]`).
 * @return {Array<object>} vue-router 4 routes config.
 */
function routesFromManifest(manifest) {
	const routes = manifest.pages.map((page) => ({
		name: page.id,
		path: page.route,
		component: RoutePageRenderer,
		props: page.route.includes(':'),
	}))
	// Catch-all: redirect unknown paths to the first page (the dashboard).
	// Vue Router 4 removed the bare `*` wildcard — an unmatched path must be
	// captured with a named repeatable param or the route silently never
	// matches and the app renders a blank page with no console error.
	routes.push({ path: '/:pathMatch(.*)*', redirect: '/' })
	return routes
}

const router = createRouter({
	history: createWebHistory(generateUrl('/apps/app-template')),
	routes: routesFromManifest(bundledManifest),
})

tryLoadTranslations()

// Pass shallow copies of the registry maps to App.vue.
//
// `defaultPageTypes` (and the consumer's `customComponents` / `registry`) are
// exported FROZEN by the library — see the Vue 3 migration playbook §4.1.
// Anything downstream that writes to them (a page-type override, a lazily
// memoised resolution) would throw in strict mode or silently no-op
// otherwise. Cloning here yields extensible objects without changing the
// values the lib resolves at render time.
const pageTypesProp = { ...defaultPageTypes }
const customComponentsProp = { ...customComponents }
// Shallow-clone the v2 registry for the same reason as above.
// Once the app fully migrates to v2, the customComponentsProp and
// customComponents prop can be removed.
const registryProp = { ...registry }

// Vue 3 bootstrap. `createApp(App, props)` passes the root props directly —
// the Vue 2 `render: h => h(App, { props: {...} })` nesting is gone, and
// passing a `{ props: ... }` wrapper here would hand App a literal prop
// named "props" instead of the four it declares.
const app = createApp(App, {
	manifest: bundledManifest,
	customComponents: customComponentsProp,
	pageTypes: pageTypesProp,
	registry: registryProp,
})

// `t` / `n` as global instance methods. Vue 3 has no global `Vue.mixin` —
// mixins are registered per-app, so this MUST happen on the app instance
// before mount or every `{{ t(...) }}` in a template throws
// "t is not a function".
app.mixin({ methods: { t, n } })

app.use(pinia)
app.use(router)
app.mount('#content')
