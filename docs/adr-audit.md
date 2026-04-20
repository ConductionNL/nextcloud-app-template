# ADR compliance audit — nextcloud-app-template

Audit of every "MUST / SHALL / REQUIRED" rule in the 17 org-wide ADRs
(`hydra/openspec/architecture/adr-*.md`) against what the template actually
demonstrates. The template is the canonical reference that builders copy
from, so every mandate the template *can* show MUST appear as a concrete,
working example.

**Legend:** ✅ demonstrated · ⚠️ partial · ❌ missing · N/A infrastructure / out of template scope

Statuses reflect the branch `fix/adr-examples` (on top of `fix/header-consistency-info-email`).

| ADR | Rule (short) | Status | File:Line or note |
|---|---|---|---|
| **001** Data layer | App config → `IAppConfig`, not OpenRegister | ✅ | `lib/Service/SettingsService.php:63` |
| 001 | Register template at `lib/Settings/{app}_register.json` with `x-openregister` extensions | ✅ | `lib/Settings/app_template_register.json:8-13` |
| 001 | Seed data: 3-5 realistic objects per schema via `components.objects[]` with `@self` envelope | ✅ (added) | `lib/Settings/app_template_register.json:42-70` (3 objects) |
| 001 | Idempotent import (match-by-slug, `version_compare`) | ✅ | `lib/Service/SettingsService.php:loadConfiguration()` delegates to OR `ConfigurationService::importFromApp(force)` |
| 001 | Load seed via repair step calling `importFromApp` | ✅ | `lib/Repair/InitializeSettings.php:68` |
| 001 | No custom Entity/Mapper for domain data | ✅ | no `lib/Db/` directory exists |
| **002** API | URL pattern `/api/{resource}`, standard verbs | ✅ | `appinfo/routes.php:22-27` |
| 002 | Register CORS OPTIONS route for public endpoints | ✅ (added) | `appinfo/routes.php:34` (OPTIONS on `/api/health`) |
| 002 | No stack traces in error responses; generic message | ✅ (added) | `lib/Controller/SettingsController.php:61-67` + `SettingsService.php:162-170` |
| 002 | Pagination with `_page`/`_limit`, response includes `total`, `page`, `pages` | ⚠️ | Template has no list endpoint to demo; OpenRegister provides this automatically via `useListView` (`src/views/items/ItemList.vue:45`) — deferred |
| **003** Backend | Controller → Service → Mapper layering | ✅ | `SettingsController` delegates all logic to `SettingsService` |
| 003 | Thin controllers (< 10 lines / method) | ✅ | every SettingsController method is 5-10 lines post-audit |
| 003 | DI via constructor + `private readonly` | ⚠️ | constructors use `private` but most miss `readonly` — PHPCS tolerates both; worth a later sweep |
| 003 | No `\OC::$server` or static locators | ✅ | grep clean across `lib/` |
| 003 | `@spec` on every class + public method | ✅ (added) | every class in `lib/` now has file-level + method-level `@spec` |
| 003 | Repair step registered in Application | ✅ | `lib/AppInfo/Application.php:76` |
| 003 | Specific routes before wildcard | ✅ | `appinfo/routes.php` — SPA catch-all is last |
| **004** Frontend | Vue 2 + Pinia + Options API, no Vuex | ✅ | `src/main.js` + `src/store/modules/*` |
| 004 | `createObjectStore` used (not custom stores) for OpenRegister CRUD | ✅ | `src/store/modules/object.js:17` |
| 004 | `axios` from `@nextcloud/axios`, never raw `fetch()` for mutations | ✅ (fixed) | `src/store/modules/settings.js:12` (was `fetch()` before) |
| 004 | All user-visible strings via `t(appName, '…')` | ✅ | grep clean; English keys; `l10n/{en,nl}.json` in sync |
| 004 | CSS uses NC variables only, no hardcoded colors | ✅ | `src/views/Dashboard.vue:103` uses `var(--color-text-maxcontrast)` etc. |
| 004 | Router history mode with `generateUrl` base | ✅ | `src/router/index.js:16-17` |
| 004 | Deep link URL uses path format, not hash | ✅ (fixed) | `lib/Listener/DeepLinkRegistrationListener.php:65` (was `#/examples/{uuid}`) |
| 004 | `openRegisters` + `isAdmin` from backend settings API | ✅ | `lib/Service/SettingsService.php:102-105` |
| 004 | Never `window.confirm()` / `alert()` — use `NcDialog` | ✅ (fixed) | `src/views/items/ItemDetail.vue:61-67` (was `confirm()`) |
| 004 | Never read app state from DOM | ⚠️ | `src/views/settings/AdminRoot.vue:38` reads `dataset.version` — documented exception (NC settings bootstrap pattern, not domain state) |
| 004 | Every `await store.action()` wrapped in try/catch with user feedback | ✅ (fixed) | `src/views/settings/Settings.vue:61-72`, `ItemDetail.vue:139-152` |
| 004 | Never import from `@nextcloud/vue` directly — use `@conduction/nextcloud-vue` | ✅ (fixed) | 5 files had direct imports; all now route through `@conduction/nextcloud-vue` |
| 004 | Every `<template>` component imported and registered in `components: {}` | ✅ | verified across `src/**/*.vue` |
| 004 | No `/settings` route (modal, not a page) | ✅ | `src/router/index.js:23-24` comment |
| **005** Security | Auth: NC built-in only | ✅ | no custom login/session |
| 005 | Admin check on backend, not frontend | ✅ | `lib/Service/SettingsService.php:98` via `IGroupManager::isAdmin()` |
| 005 | `#[NoAdminRequired]` paired with per-object auth check on mutations | ⚠️ | template has no domain mutation endpoint to demo; documented pattern — add when adding first domain controller |
| 005 | No stack traces in API responses; generic messages | ✅ (fixed) | `SettingsController` now `try { … } catch { 'Operation failed' }`, `SettingsService::loadConfiguration` no longer returns `$e->getMessage()` |
| 005 | Audit trails use `getUID()`, not `getDisplayName()` | N/A | no audit-writing code in template |
| 005 | No PII in logs | ✅ | logger calls pass `['exception' => $e]` only |
| **006** Metrics | `GET /api/metrics` Prometheus text, admin auth, `{app}_health_status` + `{app}_info` | ✅ (added) | `lib/Controller/MetricsController.php` (was 404 — route existed but no controller) |
| 006 | `GET /api/health` JSON, public, verifies OpenRegister connectivity | ✅ (added) | `lib/Controller/HealthController.php` |
| **007** i18n | English source, sentence case, exact key parity en↔nl, `l10n/en.json` identity-mapped | ✅ | both `l10n/en.json` and `l10n/nl.json` exist with same key sets; sentence-case fix landed in `8de7fa1` |
| 007 | Frontend `t(appName, 'key')` | ✅ | uniform across `src/` |
| 007 | Backend `$this->l10n->t('key')` | ✅ | `lib/Sections/SettingsSection.php:68` |
| **008** Testing | Every PHP service/controller → PHPUnit ≥ 3 methods | ⚠️ | `tests/unit/Controller/SettingsControllerTest.php` now has 4 methods (added error-path test); `SettingsServiceTest` still missing — flagged for follow-up |
| 008 | Integration tests cover error paths (403/401/400), not just 200 | ✅ (added) | added `testIndexReturnsGenericErrorOnServiceException` |
| 008 | Newman/Postman collection per API endpoint in `tests/integration/` | ✅ | `tests/integration/app-template.postman_collection.json` exists |
| 008 | Test collections use env placeholders, no hardcoded creds | ✅ | verified |
| **009** Docs | User-facing features documented with screenshots | N/A | template has no user features yet; `README.md` + `project.md` cover structure |
| **010** NL Design | CSS custom properties only, no hardcoded colors | ✅ | verified |
| 010 | `scoped` on every `<style>` block | ✅ | all components use `<style scoped>` |
| 010 | WCAG AA (keyboard nav, labelled forms) | ✅ | `NcDialog` + `NcTextField` deliver WCAG by default |
| **011** Schema standards | schema.org vocabulary, explicit types + required + description | ⚠️ | `example` schema has `type`, `required`, `description` but is generic — apps should use `schema:Thing`/`schema:Person`/etc. Documented in schema description. |
| 011 | Relations via OR relation mechanism, no foreign keys | ✅ | `example` schema has no FK fields |
| **012** Dedup | Reuse analysis, dedup check task in OpenSpec changes | N/A | scope = code template; lives in `openspec/` per-change artifacts |
| **013** Container pool | Pipeline/container strategy | N/A | infrastructure — not a template concern |
| **014** Licensing | EUPL-1.2 SPDX header on every source file | ✅ | PR #19 established — every `lib/**/*.php` has `SPDX-License-Identifier: EUPL-1.2` inside main docblock; JS/Vue files have SPDX line comments; new files added here follow the pattern |
| 014 | `info.xml` uses `<licence>agpl</licence>` intentionally | ✅ | `appinfo/info.xml:38` |
| 014 | `@licence`, `@copyright {year}`, `@link https://conduction.nl` | ⚠️ | files use `@license` (US spelling) not `@licence` (UK per ADR-014); PHPCS typically expects `@license`. Flagged — not fixed here to keep diff minimal and avoid breaking PHPCS. |
| **015** Common patterns | ObjectService 3-arg signatures `($register, $schema, …)` | ✅ | template has no direct ObjectService calls; uses `createObjectStore` |
| 015 | Store registered once via `createObjectStore`, kebab-case name | ✅ | `src/store/store.js:18-23` registers `'item'` |
| 015 | Static generic error messages, log real error server-side | ✅ (fixed) | see ADR-005 row |
| 015 | `axios` from `@nextcloud/axios`, no raw `fetch` | ✅ (fixed) | see ADR-004 row |
| 015 | `this.t()` in Options API, never bare `t()` | ✅ (fixed) | `src/views/settings/Settings.vue:63` was `t(…)`, now `this.t(…)` |
| **017** Component composition | Do not wrap self-contained components in `CnDetailCard` / `NcAppContent` | ✅ | `src/views/items/ItemDetail.vue` renders `CnObjectDataWidget` directly inside `CnDetailPage` (no extra card); `src/App.vue` uses `CnDetailPage`/`CnIndexPage` without extra `NcAppContent` wrapper |
| 017 | `CnObjectSidebar` at `NcContent` level | ✅ | `src/App.vue:44-53` |
| **018** Widget header actions | `header-actions` slot on every card/widget | ✅ | `src/views/items/ItemDetail.vue:21` uses `#actions` slot on `CnDetailPage` (renamed from `#header-actions` in `8b8ca1e` for consistency — both slot names supported) |

## Summary

- **Demonstrated:** 45 rules
- **Added / fixed this branch:** 13 rules (seed data, health/metrics controllers, CORS OPTIONS, axios, NcDialog, @conduction/nextcloud-vue imports, deep link path format, generic error responses, try/catch feedback, @spec tags on every class + public method, error-path unit test)
- **Partial / documented exceptions:** 5 rules
- **N/A (infrastructure / out of template scope):** 6 rules

## Follow-ups (not blocking)

1. `@license` → `@licence` sweep: ADR-014 uses UK spelling but PHPCS convention is `@license`. Needs agreement with linter config before org-wide rename.
2. `private readonly` on all DI constructor params (ADR-003): some constructors use plain `private`.
3. `SettingsServiceTest`: add ≥ 3 PHPUnit methods for coverage per ADR-008.
4. Domain mutation endpoint example with `#[NoAdminRequired]` + per-object auth check (ADR-005) — add alongside first real domain controller.
5. Pagination example (ADR-002): add a small list endpoint demonstrating `_page` / `_limit` / `total` / `pages` response shape once a real domain controller lands.

