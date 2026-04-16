// SPDX-License-Identifier: EUPL-1.2
//
// Store initialisation — called once from main.js after Vue mounts.
// Fetches settings, then registers each entity type with the object store.
// Add one registerObjectType() call per entity your app manages.

import { useObjectStore } from './modules/object.js'
import { useSettingsStore } from './modules/settings.js'

export async function initializeStores() {
	const settingsStore = useSettingsStore()
	const objectStore = useObjectStore()

	const config = await settingsStore.fetchSettings()

	if (config) {
		// Register each entity type: (typeName, schemaId, registerId)
		// The schema and register IDs come from the settings API.
		objectStore.registerObjectType(
			'item',
			config.item_schema || 'item',
			config.register || 'app-template',
		)

		// Add more entity types here as your app grows:
		// objectStore.registerObjectType('category', config.category_schema || 'category', config.register || 'app-template')
	}

	return { settingsStore, objectStore }
}

export { useObjectStore, useSettingsStore }
