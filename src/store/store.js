import { generateUrl } from '@nextcloud/router'
import { useObjectStore } from './modules/object.js'
import { useSettingsStore } from './modules/settings.js'

/**
 * Boot helper: point the object store at OpenRegister and prime settings.
 *
 * @spec openspec/specs/frontend-data-stores/spec.md#REQ-STORE-005
 * @return {Promise<{settingsStore: object, objectStore: object}>} Store handles.
 */
export async function initializeStores() {
	const settingsStore = useSettingsStore()
	const objectStore = useObjectStore()

	objectStore.configure({
		baseUrl: generateUrl('/apps/openregister/api/objects'),
		schemaBaseUrl: generateUrl('/apps/openregister/api/schemas'),
	})

	await settingsStore.fetchSettings()

	return { settingsStore, objectStore }
}

export { useObjectStore, useSettingsStore }
