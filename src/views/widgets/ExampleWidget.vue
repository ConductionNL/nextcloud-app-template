<!--
  SPDX-FileCopyrightText: 2024 Conduction B.V.
  SPDX-License-Identifier: EUPL-1.2

  Minimal NATIVE Nextcloud Dashboard widget (the server-wide dashboard at
  /apps/dashboard — OCA.Dashboard). For widgets INSIDE the app, do NOT copy
  this file: declare a built-in widget (object-table / stats-block) in
  src/manifest.json instead — the scaffold ships zero custom kind: "widget"
  components (hydra ADR-049).

  This renderer uses the universal CnDataTable compact-list pattern:
    - :rows + two columns with cn-cell-- utility classes
      (cn-cell--strong / cn-cell--muted cn-cell--end)
    - hide-header + borderless — the compact dashboard-list surface
    - :empty-text for the empty state
    - @row-click same-tab navigation
    - #footer "View all" link
  The important parts to keep are the axios fetch in mounted() and the
  error handling that downgrades gracefully — a widget that throws breaks
  the whole dashboard mount.
-->
<template>
	<CnDataTable
		:rows="items"
		:columns="columns"
		:loading="loading"
		hideHeader
		borderless
		:ariaLabel="title"
		:emptyText="emptyMessage"
		@rowClick="onRowClick">
		<template #footer>
			<a class="cn-data-table__view-all" @click.prevent="onViewAll">
				{{ t('apptemplate', 'View all') }} →
			</a>
		</template>
	</CnDataTable>
</template>

<script>
import { CnDataTable } from '@conduction/nextcloud-vue'
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import logger from '../../logger.js'

export default {
	name: 'ExampleWidget',
	components: { CnDataTable },
	props: {
		// Passed by `src/exampleWidget.js` from `widget.title`. The dashboard
		// chrome draws the visible heading itself, so rendering it again would
		// duplicate it — it is bound to the table's `ariaLabel` instead, which
		// gives the list an accessible name it otherwise lacks under
		// `hideHeader`. (It was previously declared and never read at all, which
		// `vue/no-unused-properties` reports.)
		title: { type: String, default: '' },
	},

	data: () => ({
		items: [],
		loading: true,
		emptyMessage: '',
		columns: [
			{ key: 'mainText', cellClass: 'cn-cell--strong' },
			{ key: 'subText', cellClass: 'cn-cell--muted cn-cell--end' },
		],
	}),

	/**
	 * Load widget rows on mount; degrade to an empty state on failure.
	 *
	 * @spec openspec/specs/scaffold-components/spec.md#REQ-COMP-003
	 * @return {Promise<void>}
	 */
	async mounted() {
		this.emptyMessage = t('apptemplate', 'No data yet')
		try {
			// Replace this with your own data source. The pattern here —
			// fetch from /api/<your-resource> via @nextcloud/axios — is
			// what you'd use for OpenRegister-driven widgets too.
			const url = generateUrl('/apps/apptemplate/api/items')
			const { data } = await axios.get(url, { params: { limit: 7 } })
			this.items = (data?.results || []).map((o) => ({
				id: o.id,
				mainText: o.title || o.name || `#${o.id}`,
				subText: o.status || '',
				targetUrl: generateUrl(`/apps/apptemplate/examples/${o.id}`),
			}))
		} catch (err) {
			logger.warn('ExampleWidget fetch failed — falling back to empty state', {
				error: err,
			})
			this.items = []
		} finally {
			this.loading = false
		}
	},

	methods: {
		/**
		 * Navigate to the clicked row in the same tab. The native dashboard
		 * lives outside the app's router, so navigation is a full page load.
		 *
		 * @spec openspec/specs/scaffold-components/spec.md#REQ-COMP-003
		 * @param {object} row The clicked row (a shaped item).
		 * @return {void}
		 */
		onRowClick(row) {
			if (row?.targetUrl) {
				window.location.href = row.targetUrl
			}
		},

		/**
		 * Navigate to the app's full list in the same tab.
		 *
		 * @spec openspec/specs/scaffold-components/spec.md#REQ-COMP-003
		 * @return {void}
		 */
		onViewAll() {
			window.location.href = generateUrl('/apps/apptemplate/examples')
		},
	},
}
</script>
