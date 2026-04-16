<!-- SPDX-License-Identifier: EUPL-1.2 -->
<!--
  Example list view using CnIndexPage + useListView composable.
  Copy this file and rename 'item' to your entity type.
-->
<template>
	<CnIndexPage
		:title="t('app-template', 'Items')"
		:description="t('app-template', 'Manage your items')"
		:schema="schema"
		:objects="objects"
		:pagination="pagination"
		:loading="loading"
		:sort-key="sortKey"
		:sort-order="sortOrder"
		:selectable="true"
		:include-columns="visibleColumns"
		@add="onAdd"
		@refresh="refresh"
		@sort="onSort"
		@row-click="openItem"
		@page-changed="onPageChange">
		<!-- Example column slot — customise how a column renders -->
		<template #column-status="{ value }">
			<span class="status-badge" :class="'status-badge--' + (value || 'draft')">
				{{ value || 'draft' }}
			</span>
		</template>
	</CnIndexPage>
</template>

<script>
import { CnIndexPage, useListView } from '@conduction/nextcloud-vue'
import { useObjectStore } from '../../store/modules/object.js'

export default {
	name: 'ItemList',
	components: { CnIndexPage },

	setup() {
		const objectStore = useObjectStore()

		// useListView returns all reactive props that CnIndexPage needs.
		// First arg = the object type name registered in store.js.
		const listView = useListView('item', {
			objectStore,
			defaultSort: { key: 'title', order: 'asc' },
		})

		return {
			...listView,
			objectStore,
		}
	},

	methods: {
		onAdd() {
			this.$router.push({ name: 'ItemDetail', params: { id: 'new' } })
		},
		openItem(item) {
			this.$router.push({ name: 'ItemDetail', params: { id: item.id } })
		},
	},
}
</script>

<style scoped>
.status-badge {
	display: inline-block;
	padding: 2px 8px;
	border-radius: 10px;
	font-size: 12px;
	background: var(--color-background-dark);
}
.status-badge--active { background: var(--color-success); color: white; }
.status-badge--draft { background: var(--color-background-darker); }
</style>
