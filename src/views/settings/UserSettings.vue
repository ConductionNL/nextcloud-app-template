<template>
	<NcAppSettingsDialog
		:open="open"
		:show-navigation="true"
		:name="t('app-template', 'App Template settings')"
		@update:open="$emit('update:open', $event)">
		<NcAppSettingsSection
			id="preferences"
			:name="t('app-template', 'Preferences')">
			<template #icon>
				<Cog :size="20" />
			</template>

			<p class="section-description">
				{{ t('app-template', 'Configure your personal preferences.') }}
			</p>

			<!-- Add your user settings here, for example: -->
			<NcCheckboxRadioSwitch
				:checked="settings.notify_changes"
				:loading="saving.notify_changes"
				type="switch"
				@update:checked="v => updateSetting('notify_changes', v)">
				{{ t('app-template', 'Notifications for changes') }}
			</NcCheckboxRadioSwitch>
			<p class="setting-hint">
				{{ t('app-template', 'Get notified when items are changed.') }}
			</p>
		</NcAppSettingsSection>
	</NcAppSettingsDialog>
</template>

<script>
import { NcAppSettingsDialog, NcAppSettingsSection, NcCheckboxRadioSwitch } from '@nextcloud/vue'
import Cog from 'vue-material-design-icons/Cog.vue'

export default {
	name: 'UserSettings',
	components: {
		NcAppSettingsDialog,
		NcAppSettingsSection,
		NcCheckboxRadioSwitch,
		Cog,
	},
	props: {
		open: {
			type: Boolean,
			default: false,
		},
	},
	data() {
		return {
			settings: {
				notify_changes: true,
			},
			saving: {
				notify_changes: false,
			},
		}
	},
	watch: {
		open(newVal) {
			if (newVal === true) {
				this.fetchSettings()
			}
		},
	},
	mounted() {
		if (this.open === true) {
			this.fetchSettings()
		}
	},
	methods: {
		async fetchSettings() {
			try {
				const response = await fetch('/apps/app-template/api/user/settings', {
					headers: {
						'Content-Type': 'application/json',
						requesttoken: OC.requestToken,
						'OCS-APIREQUEST': 'true',
					},
				})
				if (response.ok === true) {
					const data = await response.json()
					this.settings = { ...this.settings, ...data }
				}
			} catch (error) {
				console.error('Failed to fetch user settings', error)
			}
		},
		async updateSetting(key, value) {
			this.saving[key] = true
			this.settings[key] = value

			try {
				const response = await fetch('/apps/app-template/api/user/settings', {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						requesttoken: OC.requestToken,
						'OCS-APIREQUEST': 'true',
					},
					body: JSON.stringify({ [key]: value }),
				})
				if (response.ok === true) {
					const data = await response.json()
					this.settings = { ...this.settings, ...data }
				}
			} catch (error) {
				console.error('Failed to update setting', error)
				this.settings[key] = !value
			} finally {
				this.saving[key] = false
			}
		},
	},
}
</script>

<style scoped>
.section-description {
	color: var(--color-text-maxcontrast);
	margin-bottom: 16px;
}

.setting-hint {
	color: var(--color-text-maxcontrast);
	font-size: 0.9em;
	margin: 0 0 16px 36px;
}
</style>
