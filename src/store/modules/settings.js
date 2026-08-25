// SPDX-License-Identifier: EUPL-1.2
import { cnFetchJson } from '@conduction/nextcloud-vue'
import { generateUrl } from '@nextcloud/router'
import { defineStore } from 'pinia'
import logger from '../../logger.js'

/** The app's settings endpoint, resolved through Nextcloud's router.
 *
 * `generateUrl` rather than a bare path because it is the only thing that
 * knows the instance's webroot — an install under `https://host/nextcloud`
 * needs that prefix, and `cnFetch`'s own `prefixUrl` deliberately only adds
 * `/index.php`. Handing it an already-generated URL is a no-op there, so this
 * keeps the correct URL AND the library's blessed headers.
 */
const SETTINGS_URL = () => generateUrl('/apps/apptemplate/api/settings')

/**
 * The app's own settings, read from and written to `/api/settings`.
 *
 * Transport is `cnFetchJson` from @conduction/nextcloud-vue, not a raw
 * `fetch()` with a hand-set `requesttoken`. Per ADR-071 Decision 1 the library
 * owns the one blessed CSRF idiom, URL prefixing and error normalisation —
 * hand-setting the token is how three different idioms ended up across the
 * fleet, and how a CSP or Nextcloud-version change becomes 20 separate fixes
 * instead of one.
 */
export const useSettingsStore = defineStore('settings', {
	state: () => ({
		settings: {},
		loading: false,
		hasOpenRegisters: false,
		isAdmin: false,
		/**
		 * The last failure, or null when the last request succeeded.
		 *
		 * This exists because the previous implementation returned `null` on
		 * failure and `null` was also a legitimate "nothing yet" value, so a
		 * broken settings endpoint was indistinguishable from a fresh install.
		 * Callers that only need the happy path can keep ignoring the return
		 * value; a caller that needs to tell the two apart reads `error`.
		 *
		 * @type {Error|null}
		 */
		error: null,
	}),

	getters: {
		getSettings: (state) => state.settings,
		getIsAdmin: (state) => state.isAdmin,
		/** True when the last request failed. */
		hasError: (state) => state.error !== null,
	},

	actions: {
		/**
		 * Read the app's settings from the backend `GET /api/settings`.
		 *
		 * Resolves to `null` on failure rather than throwing, so a settings
		 * endpoint that is down cannot prevent the SPA from mounting. The
		 * failure is still observable — it is logged AND recorded in `error`.
		 *
		 * @spec openspec/specs/frontend-data-stores/spec.md#REQ-STORE-004
		 * @return {Promise<object|null>} The settings object, or null on failure.
		 */
		async fetchSettings() {
			this.loading = true
			this.error = null
			try {
				const data = await cnFetchJson(SETTINGS_URL())
				this.settings = data
				this.hasOpenRegisters = !!data?.openregisters
				this.isAdmin = !!data?.isAdmin
				return data
			} catch (error) {
				logger.error('Failed to fetch settings', { error })
				this.error = error
				return null
			} finally {
				this.loading = false
			}
		},

		/**
		 * Persist a partial settings payload via `POST /api/settings`.
		 *
		 * @spec openspec/specs/frontend-data-stores/spec.md#REQ-STORE-004
		 * @param {object} settings Partial settings payload.
		 * @return {Promise<object|null>} The freshly-read config, or null on failure.
		 */
		async saveSettings(settings) {
			this.loading = true
			this.error = null
			try {
				const data = await cnFetchJson(SETTINGS_URL(), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(settings),
				})
				this.settings = data
				return data
			} catch (error) {
				logger.error('Failed to save settings', { error })
				this.error = error
				return null
			} finally {
				this.loading = false
			}
		},
	},
})
