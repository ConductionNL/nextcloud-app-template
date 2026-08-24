// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Conduction B.V.
//
// v2 component registry for the manifest-driven app shell.
//
// This file is the v2 replacement for customComponents.js. Where
// customComponents.js only supported `type: "custom"` page components,
// this registry supports all five kinds defined in hydra ADR-036:
//
//   - widget       — placeable in any allowed slot via grid coords
//   - modal        — opened by action reference; not gridded externally
//   - page         — full-page custom component (escape hatch; keep near-zero)
//   - form-field   — custom property editor (auto-bound by format/property)
//   - cell-renderer — custom table-cell rendering (auto-bound by schema/property)
//
// Each entry: { kind, component, ...kindMetadata }
//
// Resolution at runtime:
//   1. Built-in widgets    (object-table, stats-block, form-renderer, …)
//   2. This registry       ← consumer-injected components
//
// How to add a new widget (built-in-first — hydra ADR-049):
//   The scaffold ships ZERO custom kind: "widget" components on purpose.
//   When a built-in widget can express your surface, you MUST use it —
//   declare it directly in src/manifest.json (no registry entry, no Vue
//   file). The enriched `object-table` built-in covers the whole
//   dashboard-list surface (declarative token-resolved `source`, columns
//   with formatters, compact hideHeader/borderless mode, rowRoute /
//   viewAllRoute / emptyText, and declarative row `actions[]` including
//   `object-op` mutations); `stats-block` covers single and grouped KPI
//   cards via `entries[]`. See the "recent-examples" widget entry on the
//   Dashboard page in src/manifest.json for a worked example.
//
//   Only for a genuine one-off no built-in can express (a real-time chat
//   panel, a bespoke analytics canvas):
//   1. Create src/widgets/<YourWidget>.vue.
//   2. Add an entry here with kind: "widget" + required metadata AND a
//      `_note` field justifying why no built-in widget fits (required —
//      hydra gate 29, hydra-gate-custom-widget-ratchet, fails the PR
//      without it).
//   3. Reference it in src/manifest.json via widgetKey: "<your-key>".
//
// How to add a new modal:
//   1. Create src/modals/<YourModal>.vue.
//   2. Add an entry here with kind: "modal" + propsSchema.
//   3. Trigger it in manifest actions via type: "open-modal", target: "<your-key>".
//
// How to add a custom page:
//   1. Create src/views/<YourPage>.vue.
//   2. Add an entry here with kind: "page".
//   3. Add a manifest page entry with type: "custom", component: "<your-key>",
//      and a _note explaining why a standard page type was not feasible.
//
// See: https://github.com/ConductionNL/hydra → openspec/architecture/adr-036-universal-widget-manifest.md

import StatusBadge from './cellRenderers/StatusBadge.vue'
import EmailField from './formFields/EmailField.vue'
import ExampleModal from './modals/ExampleModal.vue'
import CustomExample from './views/CustomExample.vue'

export default {
	// -------------------------------------------------------------------------
	// kind: "widget" — INTENTIONALLY EMPTY (hydra ADR-049, Decision 5)
	//
	// The scaffold ships zero custom widgets. Dashboard lists and KPI cards
	// are declared in src/manifest.json with the built-in `object-table` and
	// `stats-block` widgets — see the "recent-examples" entry on the
	// Dashboard page. If you add a genuine one-off here, it MUST carry a
	// `_note` justifying why no built-in fits (enforced by hydra gate 29).
	// -------------------------------------------------------------------------
	// kind: "modal" — opened via actions[].type: "open-modal"
	// -------------------------------------------------------------------------

	/**
	 * Example confirm-action modal. Keep or delete when scaffolding.
	 * Trigger via manifest action: { type: "open-modal", target: "example-modal" }.
	 */
	'example-modal': {
		kind: 'modal',
		component: ExampleModal,
		propsSchema: {
			type: 'object',
			properties: {
				title: { type: 'string' },
				message: { type: 'string' },
			},
		},
	},

	// -------------------------------------------------------------------------
	// kind: "page" — full-page custom components (escape hatch; keep near-zero)
	//
	// PascalCase keys match the manifest's `component` field so the v1
	// customComponents.js entries work unchanged during the v1 → v2 transition.
	// -------------------------------------------------------------------------

	/**
	 * Example custom page. The manifest does NOT reference this by default;
	 * it is included so the registry's role is visible to first-time cloners.
	 * Wire it up by adding a type: "custom" page entry to src/manifest.json
	 * with component: "CustomExample" and a _note field.
	 */
	CustomExample: {
		kind: 'page',
		component: CustomExample,
	},

	// -------------------------------------------------------------------------
	// kind: "form-field" — custom property editors
	// -------------------------------------------------------------------------

	/**
	 * Email address input. Auto-bound by the form renderer to any JSON Schema
	 * property with format: "email". Replace or extend for your app's fields.
	 */
	'email-field': {
		kind: 'form-field',
		component: EmailField,
		appliesTo: {
			format: 'email',
		},
	},

	// -------------------------------------------------------------------------
	// kind: "cell-renderer" — custom table-cell rendering
	// -------------------------------------------------------------------------

	/**
	 * Status badge renderer. Auto-bound by the object table to the "status"
	 * property column on "example" schema rows. Adjust appliesTo for your schema.
	 */
	'status-badge': {
		kind: 'cell-renderer',
		component: StatusBadge,
		appliesTo: {
			schema: 'example',
			property: 'status',
		},
	},
}
