<!-- SPDX-License-Identifier: EUPL-1.2 -->
<template>
	<CnSettingsSection
		:name="t('app-template', 'Configuration')"
		:description="t('app-template', 'Configure the app settings')">
		<form @submit.prevent="save">
			<div class="form-group">
				<label for="register">{{ t('app-template', 'Register') }}</label>
				<input
					id="register"
					v-model="form.register"
					type="text"
					:placeholder="t('app-template', 'OpenRegister register ID')">
			</div>

			<div v-if="successMessage" class="success-message">
				{{ successMessage }}
			</div>

			<NcButton
				type="primary"
				native-type="submit"
				:disabled="saving">
				{{ saving ? t('app-template', 'Saving...') : t('app-template', 'Save') }}
			</NcButton>
		</form>
	</CnSettingsSection>
</template>

<script>
// ADR-004: @conduction/nextcloud-vue re-exports NC components alongside Cn ones.
import { NcButton, CnSettingsSection } from '@conduction/nextcloud-vue'
import { useSettingsStore } from '../../store/modules/settings.js'

export default {
	name: 'Settings',
	components: {
		NcButton,
		CnSettingsSection,
	},
	data() {
		return {
			form: {
				register: '',
			},
			saving: false,
			successMessage: '',
		}
	},
	created() {
		const settingsStore = useSettingsStore()
		this.form.register = settingsStore.settings?.register || ''
	},
	methods: {
		async save() {
			this.saving = true
			this.successMessage = ''
			const settingsStore = useSettingsStore()
			// ADR-004: every `await store.action()` MUST be wrapped in try/catch with user feedback.
			try {
				const result = await settingsStore.saveSettings(this.form)
				if (result) {
					this.successMessage = this.t('app-template', 'Settings saved successfully')
				}
			} catch (error) {
				console.error('Settings save failed:', error)
				this.successMessage = this.t('app-template', 'Saving settings failed')
			} finally {
				this.saving = false
			}
		},
	},
}
</script>

<style scoped>
.form-group {
	margin-bottom: 12px;
}
.form-group label {
	display: block;
	margin-bottom: 4px;
	font-weight: 600;
}
.success-message {
	color: var(--color-success);
	margin-bottom: 8px;
}
</style>
