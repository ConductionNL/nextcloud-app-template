---
example: true
capability: scaffold-components
status: example
built_by: openspec/changes/scaffold-v2
---

# Scaffold Components Specification

> ⚠️ **EXAMPLE SPEC** — This spec lives in the `nextcloud-app-template` repository
> as a demonstration of the OpenSpec format for the demo components the scaffold
> ships under `src/cellRenderers/`, `src/modals/`, and `src/views/widgets/`.
> Two are canonical starting points for registry kinds (hydra ADR-036): a
> cell-renderer and a modal; the third is the NATIVE Nextcloud Dashboard
> widget (OCA.Dashboard — not a registry kind; the scaffold ships zero custom
> `kind: "widget"` components per hydra ADR-049). Apps built
> from this template replace or delete these once they have their own; this spec
> documents the small but real runtime behaviour each demonstrates so the
> `@spec` references in the demo code resolve. The *registry-shape* requirements
> (how these get registered) live in `openspec/specs/scaffold-v2/` — confusingly
> the same change; this capability is specifically the **runtime behaviour**.

## Purpose

The five-kind registry (ADR-036) lets a manifest wire consumer-supplied
components into typed pages. The scaffold ships minimal, working examples so
a freshly-cloned template renders something real (deliberately WITHOUT a
custom `kind: "widget"` example — hydra ADR-049 Decision 5):

- `StatusBadge.vue` (`kind: cell-renderer`) — substitutes for a table column,
  rendering the cell value as a coloured badge whose CSS class is derived from
  the value.
- `ExampleModal.vue` (`kind: modal`) — a confirm/cancel dialog opened via a
  manifest `open-modal` action; it relays the user's choice to the parent via
  events and closes itself.
- `ExampleWidget.vue` (native Nextcloud Dashboard renderer, `src/views/widgets/`,
  NOT a registry `kind: widget` — the scaffold ships zero custom registry
  widgets per hydra ADR-049) — an OCA.Dashboard widget that loads its rows
  from an API on mount, renders them as a `CnDataTable` compact list, and
  degrades to an empty state on failure. In-app widgets are declared in
  `src/manifest.json` with the built-in `object-table` / `stats-block`
  widgets instead.

## Requirements

### REQ-COMP-001: Cell renderer derives a CSS-safe class from the value

The `StatusBadge` cell renderer MUST display the raw cell value and MUST derive
a CSS-safe modifier class from a normalised form of that value, so that the
object table can colour status cells without the schema dictating CSS. The
normalisation MUST lowercase the value and collapse every run of
non-alphanumeric characters into a single hyphen, falling back to `unknown`
when the value is empty.

#### Scenario: A status value is normalised

- GIVEN a `StatusBadge` rendered with `value="In Progress"`
- WHEN the `normalised` computed runs
- THEN it MUST return `in-progress`
- AND the badge MUST carry the class `status-badge--in-progress`

#### Scenario: Empty value falls back

- GIVEN a `StatusBadge` rendered with an empty `value`
- WHEN `normalised` runs
- THEN it MUST return `unknown`

### REQ-COMP-002: Confirm/cancel modal relays the choice and closes

The `ExampleModal` MUST, on confirm, emit a `confirm` event and request closure
(`update:open` with `false`); on cancel, it MUST emit a `cancel` event and
request closure. The modal MUST NOT close itself directly — it MUST defer the
open-state change to the parent via the `update:open` event (NcDialog
isolation, ADR-004).

#### Scenario: User confirms

- GIVEN an open `ExampleModal`
- WHEN the user activates the Confirm button (`onConfirm`)
- THEN the component MUST emit `confirm`
- AND it MUST emit `update:open` with `false`

#### Scenario: User cancels

- GIVEN an open `ExampleModal`
- WHEN the user activates the Cancel button (`onCancel`)
- THEN the component MUST emit `cancel`
- AND it MUST emit `update:open` with `false`

### REQ-COMP-003: Dashboard widget loads on mount and degrades gracefully

The `ExampleWidget` MUST fetch its row data from an API endpoint when it mounts,
map each returned record to the compact-list row shape
`{ id, mainText, subText, targetUrl }` rendered by `CnDataTable`
(hide-header + borderless + `cn-cell--` column classes, row click navigating
same-tab via `targetUrl`), and clear its loading flag when done. A failed
fetch MUST be logged client-side and resolve to an empty item list with an
empty-state message — a widget that throws on mount would break the whole
dashboard, which MUST NOT happen (ADR-005 client-side analogue).

#### Scenario: Widget loads data

- GIVEN the widget's API returns a `results` collection
- WHEN the widget's `mounted` hook runs
- THEN it MUST map each record to `{ id, mainText, subText, targetUrl }` (mainText preferring `title`, then `name`, then `#<id>`)
- AND it MUST set `loading` to `false`

#### Scenario: Widget fetch fails

- GIVEN the widget's API request rejects
- WHEN `mounted` handles the failure
- THEN it MUST log a client-side warning
- AND it MUST leave `items` empty and show the empty-state message
- AND it MUST set `loading` to `false`
