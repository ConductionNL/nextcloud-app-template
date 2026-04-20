// SPDX-License-Identifier: EUPL-1.2
//
// Settings store — demonstrates ADR-004 patterns:
// - Uses `axios` from `@nextcloud/axios` (auto-attaches CSRF token) — NEVER raw fetch()
// - Loading state managed with try/finally
// - Errors logged; callers are expected to wrap `await store.action()` in try/catch
//   with user-facing feedback.
//
// @spec openspec/changes/example-change/tasks.md#task-11

import { defineStore } from 'pinia'
import { generateUrl } from '@nextcloud/router'
import axios from '@nextcloud/axios'

export const useSettingsStore = defineStore('settings', {
	state: () => ({
		settings: {},
		loading: false,
		hasOpenRegisters: false,
		isAdmin: false,
	}),

	getters: {
		getSettings: (state) => state.settings,
		getIsAdmin: (state) => state.isAdmin,
	},

	actions: {
		async fetchSettings() {
			this.loading = true
			try {
				const { data } = await axios.get(generateUrl('/apps/app-template/api/settings'))
				this.settings = data
				this.hasOpenRegisters = !!data?.openregisters
				this.isAdmin = !!data?.isAdmin
				return data
			} catch (error) {
				console.error('Failed to fetch settings:', error)
				throw error
			} finally {
				this.loading = false
			}
		},

		async saveSettings(settings) {
			this.loading = true
			try {
				const { data } = await axios.post(
					generateUrl('/apps/app-template/api/settings'),
					settings,
				)
				this.settings = data?.config || data
				return this.settings
			} catch (error) {
				console.error('Failed to save settings:', error)
				throw error
			} finally {
				this.loading = false
			}
		},
	},
})
