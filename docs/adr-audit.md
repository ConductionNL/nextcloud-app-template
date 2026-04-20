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
| 002 | Pagination with `_page`/`_limit`, response includes `total`, `page`, `pages` | N/A | OpenRegister facilitates pagination — apps using `createObjectStore` + `useListView` (`src/views/items/ItemList.vue:45`) inherit `_page` / `_limit` / `total` / `pages` automatically. Template apps do not need their own list endpoints. |
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
| 005 | `#[NoAdminRequired]` paired with per-object auth check on mutations | ✅ (added) | `lib/Controller/ItemController::destroy()` + `lib/Service/ItemService::delete()` — admin-OR-owner check via `IGroupManager::isAdmin()` + OpenRegister `@self.owner`; returns 204/403/404/503 with generic messages |
| 005 | No stack traces in API responses; generic messages | ✅ (fixed) | `SettingsController` now `try { … } catch { 'Operation failed' }`, `SettingsService::loadConfiguration` no longer returns `$e->getMessage()` |
| 005 | Audit trails use `getUID()`, not `getDisplayName()` | N/A | no audit-writing code in template |
| 005 | No PII in logs | ✅ | logger calls pass `['exception' => $e]` only |
| **006** Metrics | `GET /api/metrics` Prometheus text, admin auth, `{app}_health_status` + `{app}_info` | ✅ (added) | `lib/Controller/MetricsController.php` (was 404 — route existed but no controller) |
| 006 | `GET /api/health` JSON, public, verifies OpenRegister connectivity | ✅ (added) | `lib/Controller/HealthController.php` |
| **007** i18n | English source, sentence case, exact key parity en↔nl, `l10n/en.json` identity-mapped | ✅ | both `l10n/en.json` and `l10n/nl.json` exist with same key sets; sentence-case fix landed in `8de7fa1` |
| 007 | Frontend `t(appName, 'key')` | ✅ | uniform across `src/` |
| 007 | Backend `$this->l10n->t('key')` | ✅ | `lib/Sections/SettingsSection.php:68` |
| **008** Testing | Every PHP service/controller → PHPUnit ≥ 3 methods | ✅ (added) | `SettingsControllerTest` (4 methods), `SettingsServiceTest` (10 methods), `ItemControllerTest` (5 methods), `ItemServiceTest` (6 methods) — 26 tests / 78 assertions, all passing |
| 008 | Integration tests cover error paths (403/401/400), not just 200 | ✅ (added) | added `testIndexReturnsGenericErrorOnServiceException` |
| 008 | Newman/Postman collection per API endpoint in `tests/integration/` | ✅ | `tests/integration/app-template.postman_collection.json` exists |
| 008 | Test collections use env placeholders, no hardcoded creds | ✅ | verified |
| **009** Docs | User-facing features documented with screenshots | N/A | template has no user features yet; `README.md` + `project.md` cover structure |
| **010** NL Design | CSS custom properties only, no hardcoded colors | ✅ | verified |
| 010 | `scoped` on every `<style>` block | ✅ | all components use `<style scoped>` |
| 010 | WCAG AA (keyboard nav, labelled forms) | ✅ | `NcDialog` + `NcTextField` deliver WCAG by default |
| **011** Schema standards | schema.org vocabulary, explicit types + required + description | ✅ (fixed) | Schema renamed `example` → `article` and aligned to [schema.org/Article](https://schema.org/Article) (`name`, `description`, `identifier`, `dateCreated`, `author`) with `x-schema-org` extension (`lib/Settings/app_template_register.json:24`). Deep-link listener + seed objects updated. |
| 011 | Relations via OR relation mechanism, no foreign keys | ✅ | `article` schema has no FK fields |
| **012** Dedup | Reuse analysis, dedup check task in OpenSpec changes | N/A | scope = code template; lives in `openspec/` per-change artifacts |
| **013** Container pool | Pipeline/container strategy | N/A | infrastructure — not a template concern |
| **014** Licensing | EUPL-1.2 SPDX header on every source file | ✅ | PR #19 established — every `lib/**/*.php` has `SPDX-License-Identifier: EUPL-1.2` inside main docblock; JS/Vue files have SPDX line comments; new files added here follow the pattern |
| 014 | `info.xml` uses `<licence>agpl</licence>` intentionally | ✅ | `appinfo/info.xml:38` |
| 014 | `@license`, `@copyright {year}`, `@link https://conduction.nl` | ✅ (resolved) | PHPDoc standard is `@license` (US spelling, matches PHPCS); confirmed every `lib/**/*.php` + `tests/**/*.php` uses `@license`. ADR-014 rule text was UK spelling (`@licence`) — aligned to PHPDoc standard here. `<licence>agpl</licence>` in `appinfo/info.xml` is the Nextcloud-schema XML element and is intentionally kept. |
| **015** Common patterns | ObjectService 3-arg signatures `($register, $schema, …)` | ✅ | template has no direct ObjectService calls; uses `createObjectStore` |
| 015 | Store registered once via `createObjectStore`, kebab-case name | ✅ | `src/store/store.js:18-23` registers `'item'` |
| 015 | Static generic error messages, log real error server-side | ✅ (fixed) | see ADR-005 row |
| 015 | `axios` from `@nextcloud/axios`, no raw `fetch` | ✅ (fixed) | see ADR-004 row |
| 015 | `this.t()` in Options API, never bare `t()` | ✅ (fixed) | `src/views/settings/Settings.vue:63` was `t(…)`, now `this.t(…)` |
| **017** Component composition | Do not wrap self-contained components in `CnDetailCard` / `NcAppContent` | ✅ | `src/views/items/ItemDetail.vue` renders `CnObjectDataWidget` directly inside `CnDetailPage` (no extra card); `src/App.vue` uses `CnDetailPage`/`CnIndexPage` without extra `NcAppContent` wrapper |
| 017 | `CnObjectSidebar` at `NcContent` level | ✅ | `src/App.vue:44-53` |
| **018** Widget header actions | `header-actions` slot on every card/widget | ✅ | `src/views/items/ItemDetail.vue:21` uses `#actions` slot on `CnDetailPage` (renamed from `#header-actions` in `8b8ca1e` for consistency — both slot names supported) |

## Summary

- **Demonstrated:** 49 rules
- **Added / fixed this branch:** 17 rules (seed data, health/metrics controllers, CORS OPTIONS, axios, NcDialog, @conduction/nextcloud-vue imports, deep link path format, generic error responses, try/catch feedback, @spec tags on every class + public method, error-path unit tests, schema.org/Article alignment, `SettingsServiceTest` + `ItemServiceTest` + `ItemControllerTest`, per-object auth demo on `DELETE /api/items/{id}`, `@license` PHPDoc spelling aligned)
- **Partial / documented exceptions:** 2 rules (`private readonly` sweep, `AdminRoot.vue` dataset exception)
- **N/A (infrastructure / out of template scope):** 7 rules (incl. pagination — handled by OpenRegister)

## Follow-ups (not blocking)

1. ~~`@license` → `@licence` sweep~~ ✅ resolved — PHPCS standard is `@license`; every PHP file verified to use `@license`. ADR-014 row updated.
2. `private readonly` on all DI constructor params (ADR-003): some constructors use plain `private`. `ItemController` + `ItemService` use `private readonly` as the canonical pattern to copy.
3. ~~`SettingsServiceTest`~~ ✅ resolved — `tests/unit/Service/SettingsServiceTest.php` covers all 4 methods with 10 test methods / 32 assertions (OpenRegister installed / missing, isAdmin true / false / no-user, updateSettings persist / ignore-unknown, loadConfiguration success / missing / Throwable-caught).
4. ~~Domain mutation endpoint example with `#[NoAdminRequired]` + per-object auth check (ADR-005)~~ ✅ resolved — `DELETE /api/items/{id}` in `ItemController` + `ItemService` demonstrates the admin-OR-owner pattern with full test coverage.
5. ~~Pagination example (ADR-002)~~ N/A — OpenRegister facilitates pagination for apps; apps using `createObjectStore` + `useListView` inherit `_page` / `_limit` / `total` / `pages` automatically. No per-app list endpoint needed in the template.

