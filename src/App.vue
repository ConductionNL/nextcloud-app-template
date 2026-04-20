<!-- SPDX-License-Identifier: EUPL-1.2 -->
<template>
	<NcContent app-name="app-template">
		<template v-if="storesReady && !hasOpenRegisters">
			<NcAppContent class="open-register-missing">
				<NcEmptyContent
					:name="t('app-template', 'OpenRegister is required')"
					:description="t('app-template', 'This app needs OpenRegister to store and manage data. please install OpenRegister from the app store to get started.')">
					<template #icon>
						<img :src="appIcon"
							alt=""
							width="64"
							height="64">
					</template>
					<template #action>
						<NcButton
							v-if="isAdmin"
							type="primary"
							:href="appStoreUrl">
							{{ t('app-template', 'Install OpenRegister') }}
						</NcButton>
					</template>
				</NcEmptyContent>
			</NcAppContent>
		</template>
		<template v-else-if="storesReady && hasOpenRegisters">
			<MainMenu @open-settings="settingsOpen = true" />
			<NcAppContent>
				<router-view />
			</NcAppContent>
			<UserSettings :open="settingsOpen" @update:open="settingsOpen = $event" />
			<CnIndexSidebar
				v-if="sidebarState.active && !objectSidebarState.active"
				:schema="sidebarState.schema"
				:visible-columns="sidebarState.visibleColumns"
				:search-value="sidebarState.searchValue"
				:active-filters="sidebarState.activeFilters"
				:facet-data="sidebarState.facetData"
				:open="sidebarState.open"
				@update:open="sidebarState.open = $event"
				@search="onSidebarSearch"
				@columns-change="onSidebarColumnsChange"
				@filter-change="onSidebarFilterChange" />
			<CnObjectSidebar
				v-if="objectSidebarState.active"
				:object-type="objectSidebarState.objectType"
				:object-id="objectSidebarState.objectId"
				:title="objectSidebarState.title"
				:subtitle="objectSidebarState.subtitle"
				:register="objectSidebarState.register"
				:schema="objectSidebarState.schema"
				:hidden-tabs="objectSidebarState.hiddenTabs"
				:open.sync="objectSidebarState.open" />
		</template>
		<NcAppContent v-else>
			<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
				<NcLoadingIcon :size="64" />
			</div>
		</NcAppContent>
	</NcContent>
</template>

<script>
import Vue from 'vue'
// ADR-004: import NC + Cn components from @conduction/nextcloud-vue ONLY.
// It re-exports every @nextcloud/vue component plus the Conduction extensions.
import {
	NcButton,
	NcContent,
	NcAppContent,
	NcEmptyContent,
	NcLoadingIcon,
	CnIndexSidebar,
	CnObjectSidebar,
} from '@conduction/nextcloud-vue'
import { generateUrl, imagePath } from '@nextcloud/router'
import { initializeStores } from './store/store.js'
import { useSettingsStore } from './store/modules/settings.js'
import MainMenu from './navigation/MainMenu.vue'
import UserSettings from './views/settings/UserSettings.vue'

export default {
	name: 'App',
	components: {
		NcButton,
		NcContent,
		NcAppContent,
		NcEmptyContent,
		NcLoadingIcon,
		CnIndexSidebar,
		CnObjectSidebar,
		MainMenu,
		UserSettings,
	},

	provide() {
		return {
			sidebarState: this.sidebarState,
			objectSidebarState: this.objectSidebarState,
		}
	},

	data() {
		return {
			storesReady: false,
			settingsOpen: false,
			objectSidebarState: Vue.observable({
				active: false,
				open: true,
				objectType: '',
				objectId: '',
				title: '',
				subtitle: '',
				register: '',
				schema: '',
				hiddenTabs: [],
			}),
			sidebarState: Vue.observable({
				active: false,
				open: true,
				schema: null,
				visibleColumns: null,
				searchValue: '',
				activeFilters: {},
				facetData: {},
				onSearch: null,
				onColumnsChange: null,
				onFilterChange: null,
			}),
		}
	},

	computed: {
		hasOpenRegisters() {
			const settingsStore = useSettingsStore()
			return settingsStore.hasOpenRegisters
		},
		isAdmin() {
			const settingsStore = useSettingsStore()
			return settingsStore.getIsAdmin
		},
		appIcon() {
			return imagePath('app-template', 'app-dark.svg')
		},
		appStoreUrl() {
			return generateUrl('/settings/apps/integration/openregister')
		},
	},

	async created() {
		await initializeStores()
		this.storesReady = true
	},

	methods: {
		onSidebarSearch(value) {
			this.sidebarState.searchValue = value
			if (typeof this.sidebarState.onSearch === 'function') {
				this.sidebarState.onSearch(value)
			}
		},
		onSidebarColumnsChange(columns) {
			this.sidebarState.visibleColumns = columns
			if (typeof this.sidebarState.onColumnsChange === 'function') {
				this.sidebarState.onColumnsChange(columns)
			}
		},
		onSidebarFilterChange(filter) {
			if (typeof this.sidebarState.onFilterChange === 'function') {
				this.sidebarState.onFilterChange(filter)
			}
		},
	},
}
</script>
