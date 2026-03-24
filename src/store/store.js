import { useObjectStore } from './modules/object.js'
import { useSettingsStore } from './modules/settings.js'

export async function initializeStores() {
	const settingsStore = useSettingsStore()
	const objectStore = useObjectStore()

	const config = await settingsStore.fetchSettings()

	if (config) {
		// Register object types from settings.
		// Each object type maps a config key to an OpenRegister schema + register.
		if (config.register && config.example_schema) {
			objectStore.registerObjectType('example', config.example_schema, config.register)
		}
		// Add more object types here as you add schemas to your register JSON:
		// if (config.register && config.another_schema) {
		//     objectStore.registerObjectType('another', config.another_schema, config.register)
		// }
	}

	return { settingsStore, objectStore }
}

export { useObjectStore, useSettingsStore }
