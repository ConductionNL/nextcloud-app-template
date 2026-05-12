// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Conduction B.V.
//
// Custom-component registry for the manifest-driven app shell.
//
// Every entry here is the "escape hatch" — pages or sidebar tabs that
// don't fit one of the manifest's built-in types/widgets. Keep this
// file SHORT. The vast majority of pages should be expressible as
// `type: "index" | "detail" | "dashboard" | "settings"` with config;
// reach for `type: "custom"` only when none of those fit.
//
// Resolution order at runtime:
//   1. Built-in page types          (CnIndexPage, CnDetailPage, …)
//   2. Built-in widget types        (version-info, register-mapping, …)
//   3. customComponents (this file) ← consumer-injected components
//
// To add a custom page:
//   1. Add an entry to `pages[]` in `src/manifest.json` with
//      `"type": "custom"` and `"component": "MyComponentName"`.
//   2. Add a Vue file under `src/views/` (or wherever you prefer).
//   3. Register it in this object: `MyComponentName: MyComponent`.
//
// See: https://github.com/ConductionNL/nextcloud-vue → docs/migrating-to-manifest.md

import CustomExample from './views/CustomExample.vue'
// Features & Roadmap page — thin wrapper around the lib's
// CnFeaturesAndRoadmapView (in-product roadmap surface powered by
// OpenRegister's github-issue-proxy). Shipped wired-up so apps scaffolded
// from this template inherit the Settings-section "Features & roadmap"
// entry; change the repo fallback in views/FeaturesRoadmap.vue. See
// ConductionNL/hydra#251.
import FeaturesRoadmapView from './views/FeaturesRoadmap.vue'

export default {
	// Example custom component. Keep or delete when scaffolding a new
	// app. The manifest does NOT reference this by default; it is
	// included so the registry's role is visible to first-time
	// cloners. Wire it up by adding a `type: "custom"` page entry to
	// `src/manifest.json` with `"component": "CustomExample"`.
	CustomExample,
	// Features & Roadmap page (lib's CnFeaturesAndRoadmapView) — wired up
	// in src/manifest.json (the `FeaturesRoadmap` custom page + the
	// `FeaturesRoadmapMenu` settings entry).
	FeaturesRoadmap: FeaturesRoadmapView,
}
