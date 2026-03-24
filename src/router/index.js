import Vue from 'vue'
import Router from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import AdminRoot from '../views/settings/AdminRoot.vue'

Vue.use(Router)

export default new Router({
	mode: 'hash',
	routes: [
		{ path: '/', name: 'Dashboard', component: Dashboard },
		{ path: '/settings', name: 'Settings', component: AdminRoot },
		// Add your routes here, for example:
		// { path: '/examples', name: 'Examples', component: ExampleList },
		// { path: '/examples/:id', name: 'ExampleDetail', component: ExampleDetail, props: route => ({ exampleId: route.params.id }) },
		{ path: '*', redirect: '/' },
	],
})
