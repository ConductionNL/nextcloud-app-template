// SPDX-License-Identifier: EUPL-1.2
//
// Vue Router — always use static imports (no lazy import()).
// Lazy imports cause ChunkLoadError in Nextcloud because chunks are
// served from /apps/<id>/js/ but files live at /custom_apps/<id>/js/.

import Vue from 'vue'
import Router from 'vue-router'
import { generateUrl } from '@nextcloud/router'
import Dashboard from '../views/Dashboard.vue'
import ItemList from '../views/items/ItemList.vue'
import ItemDetail from '../views/items/ItemDetail.vue'
Vue.use(Router)

export default new Router({
	mode: 'history',
	base: generateUrl('/apps/app-template'),
	routes: [
		{ path: '/', name: 'Dashboard', component: Dashboard },
		{ path: '/items', name: 'Items', component: ItemList },
		{ path: '/items/:id', name: 'ItemDetail', component: ItemDetail,
			props: route => ({ itemId: route.params.id }) },
		// No /settings route — settings opens as NcAppSettingsDialog modal
		// Admin settings live at /settings/admin/{appid} (managed by NC via AdminSettings.php)
		{ path: '*', redirect: '/' },
	],
})
