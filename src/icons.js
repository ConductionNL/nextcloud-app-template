// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Conduction B.V.
//
// Icon registry for nextcloud-app-template (ADR-077 semantic icon vocabulary).
//
// CnAppNav, CnIcon, CnIndexPage / CnDetailPage headers and empty states resolve
// an `icon` by PascalCase name through the registry that `registerIcons()`
// populates. A name that is not registered renders NO icon in the navigation —
// not a fallback glyph — so this file must cover every `icon` the manifests and
// register files name. Keep it in sync when you add a menu entry.
//
// Generated from the app's own manifests; every name is verified to exist in
// vue-material-design-icons.

import BookOpenVariantOutline from 'vue-material-design-icons/BookOpenVariantOutline.vue'
import ClipboardTextOutline from 'vue-material-design-icons/ClipboardTextOutline.vue'
import FileDocumentOutline from 'vue-material-design-icons/FileDocumentOutline.vue'
import MapMarkerPath from 'vue-material-design-icons/MapMarkerPath.vue'
import ViewDashboardOutline from 'vue-material-design-icons/ViewDashboardOutline.vue'

export default {
	BookOpenVariantOutline,
	ClipboardTextOutline,
	FileDocumentOutline,
	MapMarkerPath,
	ViewDashboardOutline,
}
