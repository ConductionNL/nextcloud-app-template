<!-- SPDX-License-Identifier: EUPL-1.2 -->
<!--
  Example detail view using CnDetailPage with sidebar and schema-driven fields.
  Copy this file and rename 'item' to your entity type.

  Route: /items/:id  (props: itemId from router)
  New:   /items/new  (itemId === 'new')
-->
<template>
	<CnDetailPage
		:title="itemData.title || t('app-template', 'Item')"
		:subtitle="itemData.identifier || ''"
		:back-route="{ name: 'Items' }"
		:back-label="t('app-template', 'Back to list')"
		:loading="loading"
		:sidebar="!isNew && !loading"
		object-type="app-template_item"
		:object-id="itemId"
		:sidebar-props="sidebarProps">
		<!-- Header actions — Save and Delete buttons -->
		<template #actions>
			<NcButton
				v-if="!loading"
				type="primary"
				:disabled="saving"
				@click="save">
				{{ saving ? t('app-template', 'Saving…') : t('app-template', 'Save') }}
			</NcButton>
			<NcButton
				v-if="!isNew && !loading"
				type="error"
				@click="confirmDelete">
				{{ t('app-template', 'Delete') }}
			</NcButton>
		</template>

		<!-- Schema-driven fields — renders all fields from the OpenRegister schema -->
		<CnObjectDataWidget
			v-if="itemData && !isNew"
			:object-data="itemData"
			object-type="item"
			:store="objectStore"
			:columns="2"
			:title="t('app-template', 'Item details')"
			@saved="onSaved" />

		<!-- Manual form for new items (no schema data yet) -->
		<div v-if="isNew" class="item-form">
			<NcTextField
				:label="t('app-template', 'Title')"
				:value.sync="form.title" />
			<NcTextField
				:label="t('app-template', 'Description')"
				:value.sync="form.description" />
		</div>

		<!--
			ADR-004: use NcDialog for confirmations, NEVER window.confirm() / window.alert().
			NcDialog is keyboard-navigable, WCAG AA, and themed via NL Design tokens.
		-->
		<NcDialog
			v-if="deleteDialogOpen"
			:name="t('app-template', 'Delete item')"
			:message="t('app-template', 'Are you sure you want to delete this item?')"
			@closing="deleteDialogOpen = false"
			@button-click="onDeleteConfirm"
			:buttons="deleteDialogButtons" />
	</CnDetailPage>
</template>

<script>
// ADR-004: @conduction/nextcloud-vue re-exports NC components — use it as the
// single source so NC and Cn component versions stay in sync.
import { CnDetailPage, CnObjectDataWidget, NcButton, NcDialog, NcTextField } from '@conduction/nextcloud-vue'
import { useObjectStore } from '../../store/modules/object.js'

export default {
	name: 'ItemDetail',
	components: { CnDetailPage, CnObjectDataWidget, NcButton, NcDialog, NcTextField },

	props: {
		itemId: {
			type: String,
			default: null,
		},
	},

	data() {
		return {
			saving: false,
			deleteDialogOpen: false,
			form: { title: '', description: '' },
		}
	},

	computed: {
		objectStore() {
			return useObjectStore()
		},
		isNew() {
			return !this.itemId || this.itemId === 'new'
		},
		loading() {
			return this.objectStore.loading.item || false
		},
		itemData() {
			if (this.isNew) return this.form
			return this.objectStore.getObject('item', this.itemId) || {}
		},
		sidebarProps() {
			const config = this.objectStore.objectTypeRegistry?.item || {}
			return {
				title: this.itemData.title || this.t('app-template', 'Item'),
				subtitle: this.itemData.identifier || '',
				register: config.register || '',
				schema: config.schema || '',
			}
		},
		deleteDialogButtons() {
			return [
				{ label: this.t('app-template', 'Cancel'), type: 'secondary' },
				{ label: this.t('app-template', 'Delete'), type: 'error' },
			]
		},
	},

	async mounted() {
		if (!this.isNew) {
			await this.objectStore.fetchObject('item', this.itemId)
		}
	},

	methods: {
		async save() {
			this.saving = true
			// ADR-004 / ADR-015: wrap every `await store.action()` in try/catch with user feedback.
			try {
				const data = this.isNew
					? this.form
					: { ...this.itemData }
				const result = await this.objectStore.saveObject('item', data)
				if (this.isNew && result?.id) {
					this.$router.replace({ name: 'ItemDetail', params: { id: result.id } })
				}
			} catch (error) {
				console.error('Save failed:', error)
			} finally {
				this.saving = false
			}
		},

		confirmDelete() {
			// ADR-004: open NcDialog instead of window.confirm().
			this.deleteDialogOpen = true
		},

		async onDeleteConfirm(button) {
			this.deleteDialogOpen = false
			// NcDialog fires button-click for every button — only proceed on the "Delete" label.
			if (!button || button.type !== 'error') return
			try {
				const success = await this.objectStore.deleteObject('item', this.itemId)
				if (success) {
					this.$router.push({ name: 'Items' })
				}
			} catch (error) {
				console.error('Delete failed:', error)
			}
		},

		onSaved() {
			// CnObjectDataWidget handles save internally — refresh data
			this.objectStore.fetchObject('item', this.itemId)
		},
	},
}
</script>

<style scoped>
.item-form {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 600px;
	padding: 16px;
}
</style>
