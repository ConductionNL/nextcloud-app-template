// SPDX-License-Identifier: EUPL-1.2
//
// Shared object store — provides full CRUD for all entity types.
// Do NOT create per-entity stores. Register entity types in store.js,
// then use this store everywhere:
//
//   objectStore.registerObjectType('item', schemaId, registerId)
//   objectStore.fetchCollection('item', { _limit: 25 })
//   objectStore.fetchObject('item', id)
//   objectStore.saveObject('item', data)
//   objectStore.deleteObject('item', id)
//   objectStore.getObject('item', id)     // sync getter from cache
//   objectStore.loading.item              // reactive loading boolean

import { createObjectStore } from '@conduction/nextcloud-vue'

export const useObjectStore = createObjectStore('object')
