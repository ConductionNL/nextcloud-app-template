// SPDX-FileCopyrightText: 2024 Conduction B.V.
// SPDX-License-Identifier: EUPL-1.2

/**
 * Dashboard widget renderer.
 *
 * The first argument to `OCA.Dashboard.register(...)` MUST equal the string
 * returned by `ExampleWidget::getId()` in `lib/Dashboard/ExampleWidget.php`.
 * If they don't match, Nextcloud's registry silently ignores the callback
 * and the widget renders blank — check the browser console for
 * `No callback registered for widget '<id>'`.
 *
 * @see lib/Dashboard/ExampleWidget.php
 */

import { createApp } from 'vue'
import ExampleWidget from './views/widgets/ExampleWidget.vue'
import pinia from './pinia.js'

OCA.Dashboard.register('apptemplate_example_widget', (el, { widget }) => {
	// Vue 3: one app instance per widget mount. `Vue.extend` + `propsData` +
	// `$mount(el)` are all gone — root props are the second argument to
	// `createApp`, and `mount(el)` REPLACES the element's content rather than
	// replacing the element itself (Vue 2 swapped the node out).
	//
	// The `t` / `n` mixin must be registered on THIS app instance. Under Vue 2
	// the `Vue.mixin` call inside this callback was global and leaked one extra
	// copy of the mixin per widget mount; per-app registration scopes it.
	const app = createApp(ExampleWidget, { title: widget.title })
	app.mixin({ methods: { t, n } })
	app.use(pinia)
	app.mount(el)
})
