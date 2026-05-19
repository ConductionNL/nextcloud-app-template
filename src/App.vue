<!-- SPDX-License-Identifier: EUPL-1.2 -->
<!-- Copyright (C) 2026 Conduction B.V. -->

<!--
 App template app shell. Mounts CnAppRoot with the bundled manifest and
 the customComponents registry; provides the `objectSidebarState` channel
 so detail pages (CnDetailPage) can drive a single host-rendered
 CnObjectSidebar through the #sidebar slot.

 This file is the canonical Tier-4 scaffold for the JSON manifest
 renderer pattern (hydra ADR-024). New apps cloning this template
 inherit the pattern unchanged.

 The Settings menu entry uses action: "user-settings" → opens
 NcAppSettingsDialog via CnAppRoot's cnOpenUserSettings inject.
 Feed your settings sections into the #user-settings slot below.

 @spec openspec/changes/template-manifest-v1/specs/template-manifest-v1/spec.md
 @spec openspec/changes/scaffold-v2/specs/scaffold-v2/spec.md
-->
<template>
	<CnAppRoot
		:manifest="manifest"
		:custom-components="customComponents"
		:page-types="pageTypes"
		:registry="registry"
		app-id="app-template"
		:translate="translateForApp"
		:permissions="permissions">
		<template #sidebar>
			<CnObjectSidebar
				v-if="objectSidebarState.active"
				:title="objectSidebarState.title"
				:subtitle="objectSidebarState.subtitle"
				:object-type="objectSidebarState.objectType"
				:object-id="objectSidebarState.objectId"
				:register="objectSidebarState.register"
				:schema="objectSidebarState.schema"
				:hidden-tabs="objectSidebarState.hiddenTabs"
				:tabs="objectSidebarState.tabs"
				:open="objectSidebarState.open"
				@update:open="objectSidebarState.open = $event" />
		</template>
		<!--
		  user-settings slot: NcAppSettingsSection children rendered inside
		  CnAppRoot's hosted NcAppSettingsDialog. CnAppNav opens it when the
		  user clicks the manifest menu entry with action: "user-settings".
		  Replace the placeholder section with your app's actual settings.
		-->
		<template #user-settings>
			<NcAppSettingsSection
				id="general"
				:name="t('app-template', 'General')">
				<p class="app-root__settings-hint">
					{{ t('app-template', 'Add your settings fields here. See src/views/AdminRoot.vue for the pre-boot admin panel.') }}
				</p>
			</NcAppSettingsSection>
		</template>
	</CnAppRoot>
</template>

<script>
import Vue from 'vue'
import { translate as ncT } from '@nextcloud/l10n'
import { NcAppSettingsSection } from '@nextcloud/vue'
import { CnAppRoot, CnObjectSidebar } from '@conduction/nextcloud-vue'

export default {
	name: 'App',

	components: {
		CnAppRoot,
		CnObjectSidebar,
		NcAppSettingsSection,
	},

	provide() {
		return {
			// Channel for CnDetailPage → host-rendered CnObjectSidebar.
			// Vue.observable makes the plain object reactive for Vue 2.
			objectSidebarState: this.objectSidebarState,
		}
	},

	props: {
		/**
		 * Manifest object — passed from main.js bootstrap. CnAppRoot reads
		 * `manifest.dependencies` for the dependency-check phase and
		 * `manifest.menu` for the default CnAppNav.
		 */
		manifest: {
			type: Object,
			required: true,
		},
		/**
		 * Registry of consumer-injected components used by:
		 *   - `type: "custom"` pages (`page.component`)
		 *   - `headerComponent` / `actionsComponent` slot overrides
		 *   - `pages[].config.sidebarTabs[].component` (detail tab tabs)
		 *   - `pages[].config.sections[].component` (settings rich sections)
		 */
		customComponents: {
			type: Object,
			default: () => ({}),
		},
		/**
		 * Page-type registry — `{ index, detail, dashboard, settings, ... }`.
		 * Wired through to descendant `CnPageRenderer` instances via
		 * provide/inject.
		 */
		pageTypes: {
			type: Object,
			default: null,
		},
		/**
		 * v2 five-kind component registry — `{ "<key>": { kind, component, ...metadata } }`.
		 * Introduced by hydra ADR-036; passed through to CnAppRoot which provides
		 * it via `cnRegistry` for v2 manifest widget resolution.
		 * Both `customComponents` (v1) and `registry` (v2) can coexist during
		 * the transition period. Once fully migrated to v2, `customComponents`
		 * can be removed.
		 */
		registry: {
			type: Object,
			default: () => ({}),
		},
	},

	data() {
		return {
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
				tabs: undefined,
			}),
		}
	},

	computed: {
		permissions() {
			return window.OC?.currentUser?.permissions ?? []
		},
	},

	methods: {
		/**
		 * Translate function passed down to CnAppRoot / CnAppNav /
		 * CnPageRenderer. Closes over the Nextcloud `translate` import so
		 * the lib never has to know our app id.
		 *
		 * @param {string} key Translation key.
		 * @return {string} Translated string (or the key on miss).
		 */
		translateForApp(key) {
			return ncT('app-template', key)
		},
	},
}
</script>
