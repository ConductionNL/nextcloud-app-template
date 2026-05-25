import { defineStore } from 'pinia'

/**
 * Generic OpenRegister object store.
 * Configure it with baseUrl and schemaBaseUrl, then register object types.
 */
export const useObjectStore = defineStore('object', {
	state: () => ({
		baseUrl: '',
		schemaBaseUrl: '',
		objectTypes: {},
		objects: {},
		loading: {},
	}),

	actions: {
		/**
		 * Record the OpenRegister object/schema API base URLs.
		 *
		 * @spec openspec/specs/frontend-data-stores/spec.md#REQ-STORE-001
		 * @param {object} opts Configuration.
		 * @param {string} opts.baseUrl OpenRegister object-API base URL.
		 * @param {string} opts.schemaBaseUrl OpenRegister schema-API base URL.
		 * @return {void}
		 */
		configure({ baseUrl, schemaBaseUrl }) {
			this.baseUrl = baseUrl
			this.schemaBaseUrl = schemaBaseUrl
		},

		/**
		 * Map a logical type name to its OpenRegister schema + register.
		 *
		 * @spec openspec/specs/frontend-data-stores/spec.md#REQ-STORE-002
		 * @param {string} type Logical object-type name.
		 * @param {string} schema OpenRegister schema id.
		 * @param {string} register OpenRegister register id.
		 * @return {void}
		 */
		registerObjectType(type, schema, register) {
			this.objectTypes[type] = { schema, register }
			if (!this.objects[type]) {
				this.objects[type] = []
			}
		},

		/**
		 * Fetch a collection of objects of the given type from OpenRegister.
		 *
		 * @spec openspec/specs/frontend-data-stores/spec.md#REQ-STORE-003
		 * @param {string} type Registered object-type name.
		 * @param {object} [params] Extra query parameters.
		 * @return {Promise<Array>} The fetched objects (empty on miss/failure).
		 */
		async fetchObjects(type, params = {}) {
			if (!this.objectTypes[type]) {
				console.warn(`Object type "${type}" is not registered`)
				return []
			}

			this.loading[type] = true
			const { schema, register } = this.objectTypes[type]

			try {
				const url = new URL(this.baseUrl, window.location.origin)
				url.searchParams.set('register', register)
				url.searchParams.set('schema', schema)
				Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

				const response = await fetch(url.toString(), {
					headers: { requesttoken: OC.requestToken },
				})
				if (response.ok) {
					const data = await response.json()
					this.objects[type] = data.results || data
					return this.objects[type]
				}
			} catch (error) {
				console.error(`Failed to fetch ${type} objects:`, error)
			} finally {
				this.loading[type] = false
			}
			return []
		},
	},
})
