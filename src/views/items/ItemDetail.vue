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
		<template #header-actions>
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
			:title="t('app-template', 'Item Details')"
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
	</CnDetailPage>
</template>

<script>
import { CnDetailPage, CnObjectDataWidget } from '@conduction/nextcloud-vue'
import { NcButton, NcTextField } from '@nextcloud/vue'
import { useObjectStore } from '../../store/modules/object.js'

export default {
	name: 'ItemDetail',
	components: { CnDetailPage, CnObjectDataWidget, NcButton, NcTextField },

	props: {
		itemId: {
			type: String,
			default: null,
		},
	},

	data() {
		return {
			saving: false,
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
				title: this.itemData.title || t('app-template', 'Item'),
				subtitle: this.itemData.identifier || '',
				register: config.register || '',
				schema: config.schema || '',
			}
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
			try {
				const data = this.isNew
					? this.form
					: { ...this.itemData }
				const result = await this.objectStore.saveObject('item', data)
				if (this.isNew && result?.id) {
					this.$router.replace({ name: 'ItemDetail', params: { id: result.id } })
				}
			} finally {
				this.saving = false
			}
		},

		async confirmDelete() {
			if (!confirm(t('app-template', 'Are you sure you want to delete this item?'))) return
			const success = await this.objectStore.deleteObject('item', this.itemId)
			if (success) {
				this.$router.push({ name: 'Items' })
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
