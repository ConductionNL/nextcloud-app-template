<p align="center">
  <img src="img/app-store.svg" alt="Nextcloud App Template logo" width="80" height="80">
</p>

<h1 align="center">Nextcloud App Template</h1>

<p align="center">
  <strong>A template for creating new Nextcloud apps</strong>
</p>

<p align="center">
  <a href="https://codeberg.org/Conduction/nextcloud-app-template/releases"><img src="https://img.shields.io/gitea/v/release/Conduction/nextcloud-app-template?gitea_url=https%3A%2F%2Fcodeberg.org" alt="Latest release"></a>
  <a href="https://codeberg.org/Conduction/nextcloud-app-template/src/branch/main/LICENSE"><img src="https://img.shields.io/badge/license-EUPL--1.2-blue" alt="License"></a>
  <a href="https://ci.codeberg.org/repos/Conduction/nextcloud-app-template"><img src="https://ci.codeberg.org/api/badges/Conduction/nextcloud-app-template/status.svg" alt="Code quality"></a>
</p>

---

A starting point for building Nextcloud apps following ConductionNL conventions.

> **Manifest-first** — pages, navigation, and dependencies are declared in `src/manifest.json`. The shell (CnAppRoot) reads the manifest at boot and renders index / detail / dashboard / settings pages without per-page Vue files. Reach for a custom Vue component only when the page is `type: "custom"`. See `openspec/architecture/` and hydra ADR-024 for the architectural rationale.

> **Pre-wired for [OpenRegister](https://codeberg.org/Conduction/openregister)** — `manifest.dependencies` lists `openregister`, so CnAppRoot's dependency-check phase ensures the OR app is installed and enabled before the UI mounts. If your app does not need OpenRegister, remove the entry from `src/manifest.json`, `appinfo/info.xml`, and `openspec/app-config.json`.

> **Canonical root configs** — `phpcs.xml`, `phpmd.xml`, `psalm.xml`, `phpstan.neon`, and `phpstan-bootstrap.php` in this repo are the fleet canonical. All Conduction PHP apps are expected to mirror these files byte-for-byte; per-app deviations belong in baselines (`phpstan-baseline.neon`, `psalm-baseline.xml`) not in the canonical files. Submit changes here and they propagate to the fleet via the template-sync flow — do **not** diverge per-app.

## Screenshots

Screenshots are captured automatically from the tutorial flows, not pasted in by hand. The journeydoc scaffold (hydra ADR-030) ships two tutorial stories under [`docs/tutorials/`](docs/tutorials/) — a user "first launch" walkthrough (the Dashboard) and an admin "manage settings" walkthrough (Admin Settings) — and a Playwright `docs-capture` project that turns each documented step into a PNG under `docs/static/screenshots/tutorials/`.

- Add a tutorial story: `/journeydoc-add-story`
- Add stable `data-testid` hooks to a Vue component: `/journeydoc-instrument`
- (Re)capture screenshots against a running Nextcloud: `PLAYWRIGHT_BASE_URL=http://localhost:8096 npx playwright test --project docs-capture`

See the [Documentation](#documentation) section below for how the docs site itself is built and deployed.

## Features

Features are defined in [`openspec/specs/`](openspec/specs/). See the [roadmap](openspec/ROADMAP.md) for planned work.

### Core
- **Dashboard** — Personal overview page with key information at a glance
- **Admin Settings** — Configurable settings panel for administrators

### Supporting
- **OpenRegister Integration** — Pre-wired data layer using OpenRegister objects
- **Quality Pipeline** — PHPCS, PHPMD, Psalm, PHPStan, ESLint, Stylelint

## Architecture

```mermaid
graph TD
    A[Vue 3 Frontend] -->|REST API| B[OpenRegister API]
    B --> C[(PostgreSQL JSON store)]
    A --> D[Nextcloud Activity]
    A --> E[Nextcloud Search]
```

_Update this diagram during `/app-explore` sessions as the architecture evolves._

### Data Model

| Object | Description |
|--------|-------------|
| _(define your data objects here)_ | — |

_Data model is defined using OpenRegister schemas. See [`openspec/specs/`](openspec/specs/) for feature-level design decisions and [`openspec/architecture/`](openspec/architecture/) for architectural decisions._

### Directory Structure

```
apptemplate/
├── appinfo/                    # Nextcloud app manifest, routes, navigation
├── lib/                        # PHP backend
│   ├── AppInfo/Application.php
│   ├── Controller/             # DashboardController, SettingsController
│   ├── Dashboard/              # Nextcloud Dashboard widget classes (ExampleWidget)
│   ├── Mcp/ExampleToolProvider.php  # AI Chat Companion tools (hydra ADR-034/035)
│   ├── Service/SettingsService.php
│   ├── Listener/DeepLinkRegistrationListener.php
│   ├── Repair/InitializeSettings.php
│   └── Settings/               # AdminSettings, apptemplate_register.json
├── templates/                  # PHP templates (SPA shells)
├── src/                        # Vue 3 frontend
│   ├── manifest.json           # Pages + menu + dependencies (v2 — the source of truth)
│   ├── main.js                 # App entry — bootstraps CnAppRoot from manifest
│   ├── App.vue                 # Mounts CnAppRoot + #sidebar slot
│   ├── registry.js             # v2 five-kind component registry (widget/modal/page/form-field/cell-renderer)
│   ├── customComponents.js     # v1 registry (kept for backward-compat; remove once v2 migration complete)
│   ├── widgets/                # kind: "widget" components — none shipped (ADR-049: built-in manifest widgets first)
│   ├── modals/                 # kind: "modal" components (ExampleModal.vue)
│   ├── formFields/             # kind: "form-field" components (EmailField.vue)
│   ├── cellRenderers/          # kind: "cell-renderer" components (StatusBadge.vue)
│   ├── exampleWidget.js        # Sample Nextcloud Dashboard widget entry-point
│   ├── settings.js             # Nextcloud admin settings webpack entry-point
│   ├── store/                  # Pinia stores (used by AdminSettings)
│   ├── views/CustomExample.vue # Example custom component (registry demo)
│   └── views/widgets/          # Dashboard widget Vue components (ExampleWidget.vue)
├── openspec/                   # Specifications, decisions, and roadmap
│   ├── app-config.json         # Canonical app config (id, goal, dependencies, CI)
│   ├── config.yaml             # OpenSpec CLI configuration
│   ├── specs/                  # Feature specs (input for OpenSpec changes)
│   ├── architecture/           # App-specific Architectural Decision Records
│   ├── ROADMAP.md              # Product roadmap
│   └── changes/                # OpenSpec change directories (created on first change)
├── docs/                       # Docusaurus documentation site (@conduction/docusaurus-preset)
│   ├── docusaurus.config.js    # Site config — title, url, navbar, brand theme
│   ├── intro.md                # Docs landing page
│   ├── src/pages/index.js      # Marketing landing page (brand <DetailHero> / <WidgetShelf>)
│   ├── tutorials/              # journeydoc tutorial stories — user/ + admin/ tracks (ADR-030)
│   └── static/screenshots/     # Captured tutorial screenshots (populated by docs-capture)
├── tests/                      # Unit and integration tests
│   ├── e2e/app-shell.spec.ts    # app-shell regression suite (Playwright chromium project)
│   ├── e2e/auth.setup.ts        # one-time admin login -> storageState, shared by every project
│   ├── e2e/docs-screenshots.spec.ts # journeydoc screenshot capture suite (Playwright docs-capture project)
│   ├── validate-manifest.js    # Ajv schema validator for src/manifest.json (nc-vue manifest schema)
│   ├── validate-register.js    # Structural validator for lib/Settings/*_register.json (slugs, lifecycle requires→PHP, clobber heuristic)
│   └── validate-json-strict.js # Strict JSON parse — rejects duplicate keys + appendOnly nested in x-openregister
├── playwright.config.ts        # Playwright config — `chromium` (regression) + `docs-capture` (screenshots) projects
├── l10n/                       # Translations (en, en_US, nl)
├── .github/workflows/          # CI/CD pipelines (incl. documentation.yml — deploys docs/ from `development`)
├── Makefile                    # Dev helpers (make dev-link)
└── img/                        # App icons and screenshots
```

## Requirements

| Dependency | Version |
|-----------|---------|
| Nextcloud | 28 – 33 |
| PHP | 8.1+ |
| Node.js | 20+ |
| [OpenRegister](https://codeberg.org/Conduction/openregister) | latest |

## Installation

### From the Nextcloud App Store

1. Go to **Apps** in your Nextcloud instance
2. Search for **Nextcloud App Template**
3. Click **Download and enable**

> OpenRegister must be installed first. [Install OpenRegister →](https://apps.nextcloud.com/apps/openregister)

### From Source

```bash
cd /var/www/html/custom_apps
git clone https://codeberg.org/Conduction/nextcloud-app-template.git apptemplate
cd apptemplate
npm install && npm run build
php occ app:enable apptemplate
```

## Development

### Start the environment

```bash
docker compose -f ../openregister/docker-compose.yml up -d
```

### Frontend development

```bash
npm install
npm run dev              # Watch mode
npm run build            # Production build
npm run check:manifest   # Validate src/manifest.json against the nc-vue manifest schema
npm run check:register   # Validate lib/Settings/*_register.json (schema shape, slugs, lifecycle requires → PHP class exists)
npm run check:json-strict # Strict JSON parse of the config files — fails on duplicate keys (the silent-data-loss class of bug a bad git merge produces)
npm run check:specs      # All three of the above — run this before committing any register/manifest change
```

> **Why `check:specs`?** `git` merges JSON files line-by-line — two branches that both add an object at the same key but at different file positions produce **no textual conflict**, just a document with a duplicate key, and `json_decode()` keeps the *last* one (so the earlier, fuller definition is silently dropped). `check:json-strict` fails CI on that. `check:register` also catches a lifecycle `requires:` pointing at a PHP class that doesn't exist, and `appendOnly` nested in `x-openregister` (which OpenRegister silently ignores). The `Spec Validation` GitHub workflow runs `check:specs` on every push/PR; add it to your branch-protection ruleset's required checks to make it block merges.

### Settings menu / NcAppSettingsDialog

The `Settings` menu entry uses `action: "user-settings"` → opens `NcAppSettingsDialog` via CnAppRoot's `cnOpenUserSettings` inject; feed your settings sections into `App.vue`'s `#user-settings` slot.

### Adding a page (manifest-first)

Pages live in [`src/manifest.json`](src/manifest.json) — NOT in
`src/views/`. To add a page, edit the manifest:

1. **Add a menu entry** in `manifest.menu` (id, label, icon, route).
2. **Add a page** in `manifest.pages` (id matches the menu's `route`).
   Pick the `type`:

   | Type        | Use when                                                    |
   |-------------|-------------------------------------------------------------|
   | `dashboard` | Home / overview with KPI widgets                            |
   | `index`     | Schema-backed list view (CnDataTable + sidebar)             |
   | `detail`    | Single-object view at `/things/:id`                         |
   | `settings`  | Admin/user settings with `version-info` / `register-mapping`|
   | `logs`      | Tail-style audit log view                                   |
   | `chat`      | Conversation thread page                                    |
   | `files`     | Folder browser                                              |
   | `custom`    | Bespoke Vue component (last resort)                         |

3. **Run `npm run check:manifest`** to verify the manifest validates.

You only write a Vue file when the page is `type: "custom"`. In that
case, drop the component into `src/views/`, register it in
[`src/customComponents.js`](src/customComponents.js), and reference
its registry name in the manifest entry's `component` field. See
[`src/views/CustomExample.vue`](src/views/CustomExample.vue) for the
canonical example.

### Renaming the app

Search-and-replace `apptemplate` (the `<id>` from `appinfo/info.xml`)
in: `appinfo/info.xml` (`<id>`, the navigation `<id>`, and the navigation
`<route>` — the route name is `<app-id>.<controller>.<method>`),
`lib/AppInfo/Application.php` (`APP_ID`), `lib/Sections/SettingsSection.php`
(`getID()` and the `imagePath()` app name), `lib/Settings/AdminSettings.php`
(`getSection()`), `lib/Listener/DeepLinkRegistrationListener.php`,
`lib/Controller/MetricsController.php` (`METRIC_PREFIX`), `package.json`,
`composer.json`, `phpcs.xml`, `eslint.config.js`,
`openspec/app-config.json`, `openspec/config.yaml` (the mount path),
`src/main.js` (the `app-id` prop, the `loadTranslations` arg, and the
`generateUrl` base path), `src/App.vue` (the `app-id` prop and
`translateForApp` argument), the remaining `t('apptemplate', …)` call sites
and `/apps/apptemplate/…` URLs under `src/`, the `#apptemplate-settings`
mount id in `templates/settings/admin.php` + `src/settings.js`,
`src/exampleWidget.js` (the dashboard widget id), `webpack.config.js` (the
`appId` constant), `Makefile` (the `dev-link` symlink name), the
`app-name:` / `app-id:` inputs in `.github/workflows/*.yml` and
`.forgejo/workflows/app-tests.yml`, and `tests/` (`APP_ID`, the e2e URLs,
`tests/bootstrap.php`). Two files are named after the id and must be
renamed, not just edited: `lib/Settings/apptemplate_register.json` (the path
is built as `Application::APP_ID . '_register.json'`, so a stale name makes
the register import silently seed nothing) and
`tests/integration/apptemplate.postman_collection.json`.

Two things that are *not* the app id and must stay put: the repository name
`nextcloud-app-template` (clone paths, remotes, `ConductionNL/…` URLs) and
the PHP namespace `AppTemplate`, which `appinfo/info.xml` declares explicitly
via `<namespace>` and which is therefore independent of the id.

The app id must match `[a-z]+[a-z0-9_]*[a-z0-9]+` — the App Store's own
`info.xsd` pattern. Hyphens are rejected; the `info.xml lint` CI job is what
catches it. The manifest itself does not carry the app id.

### Manifest v2 ready

The scaffold ships a **v2 manifest** by default (`src/manifest.json` declares
`$schema` pointing to the v2 schema URL). V2 collapses the four v1 widget
shapes into a single uniform `widgets[]` array with grid coordinates on every
page type, and introduces a five-kind component registry.

**Design reference:** hydra
[ADR-036 (Universal Widget Manifest v2)](https://codeberg.org/Conduction/hydra/src/branch/development/openspec/architecture/adr-036-universal-widget-manifest.md)

**Migration guide** (for apps migrating from v1): `@conduction/nextcloud-vue`
docs `migrating-to-v2.md` covers the codemod CLI and manual migration steps.

#### Extending the app via the registry (`src/registry.js`)

The v2 way to add custom UI is `src/registry.js`. It has five kinds:

| kind | Use when |
|------|----------|
| `widget` | Custom placeable widget — ONLY for a genuine one-off no built-in widget can express (requires a `_note`; hydra ADR-049) |
| `modal` | Dialog opened by manifest actions with `type: "open-modal"` |
| `page` | Bespoke full-page component (`type: "custom"` in the manifest — use sparingly) |
| `form-field` | Custom form input auto-bound by JSON Schema `format` |
| `cell-renderer` | Custom table-cell rendering auto-bound by schema + property |

**Widgets are built-in-first (hydra ADR-049).** The scaffold ships ZERO
custom `kind: "widget"` components: dashboard lists and KPI cards are
declared entirely in `src/manifest.json` with the built-in `object-table`
and `stats-block` widgets. See the `recent-examples` widget on the Dashboard
page in `src/manifest.json` — it demonstrates the whole declarative list
contract: a token-resolved `source` (`register` / `schema` / `filter` with
`@today`-style tokens / `order` / `limit`), `columns` with `cnFormatters`
(e.g. `daysSince`) and `cn-cell--` classes, compact-list mode (`hideHeader`
+ `borderless`), `rowRoute` row-click navigation, `viewAllRoute`,
`emptyText`, and declarative row `actions[]` including `object-op`
mutations (`op: "patch" | "delete" | "create"`, dispatched via the shared
object store; OpenRegister RBAC is the only authority).

Steps to add a custom widget (only when no built-in fits):

1. Create `src/widgets/<YourWidget>.vue`.
2. Add an entry to `src/registry.js` with `kind: "widget"` + `defaultSize`, `minSize`, `maxSize`, `allowedSlots`, `propsSchema`, and a `_note` justifying why no built-in widget fits (hydra gate 29 fails the PR without it).
3. Add a `widgets[]` entry to the target page in `src/manifest.json` with `widgetKey: "<your-key>"`, `slot`, and grid coordinates.
4. Run `npm run check:manifest-v2 && npm run check:registry` to validate.

The scaffold ships one example per kind (except `widget` — see above) as a
starting point. Delete or replace the examples when you clone the template.

> **Backward compat:** `src/customComponents.js` is kept for the v1 → v2
> transition period. Both the `customComponents` and `registry` props coexist
> on `CnAppRoot`. Once fully migrated, `customComponents.js` and its import in
> `main.js` can be removed.

### Adding a NATIVE Nextcloud Dashboard widget

> This section is about the server-wide dashboard at `/apps/dashboard`
> (`OCA.Dashboard`) — NOT about widgets inside the app. In-app widgets are
> manifest config (built-in `object-table` / `stats-block`), see above.

The template ships with a working `ExampleWidget` you can copy. Each widget is
**three files plus two registration points**:

1. `lib/Dashboard/<Foo>Widget.php` — implements `OCP\Dashboard\IWidget`. The
   `load()` method MUST attach the two shared chunks (`-shared-vendor`,
   `-shared-nc-vue`) **before** the per-widget bundle. Order matters; see
   `ExampleWidget.php` for the reference.
2. `src/<foo>Widget.js` — webpack entry-point that registers the renderer via
   `OCA.Dashboard.register('<id>', (el, { widget }) => { ... })`. The id MUST
   equal `Widget::getId()` from PHP.
3. `src/views/widgets/<Foo>Widget.vue` — the renderer itself. Use the
   universal `CnDataTable` compact-list pattern (`:rows` + `cn-cell--`
   column classes, `hide-header`, `borderless`, `:empty-text`,
   `@row-click` same-tab navigation) — see `ExampleWidget.vue`.
4. Register in `lib/AppInfo/Application.php`: add
   `$context->registerDashboardWidget(<Foo>Widget::class);`.
5. Add a webpack entry in `webpack.config.js` so `npm run build` produces
   `<appId>-<foo>Widget.js`.

The `optimization.splitChunks` block in `webpack.config.js` extracts shared
framework code (Vue, `@nextcloud/vue`, pinia, icons) into two chunks loaded
once across the page. Without it every widget bundle would inline ~3 MB of
duplicated framework code per entry-point. See ADR-004 (Build / bundling)
in the hydra repo for the full rationale.

### AI Chat Companion / MCP tools

The template ships an example **MCP tool provider** so the in-app AI Chat
Companion (a floating assistant rendered by `CnAppRoot` from
`@conduction/nextcloud-vue`) can call your app's capabilities. See:

- `lib/Mcp/ExampleToolProvider.php` — the heavily-commented starting point. It
  implements `OCA\OpenRegister\Mcp\IMcpToolProvider` and exposes two trivial
  tools: `apptemplate.ping` (echoes a message) and `apptemplate.describeApp`
  (returns the app id, version, and name).
- `lib/AppInfo/Application.php` — registers the provider under the service
  alias `OCA\OpenRegister\Mcp\IMcpToolProvider::{appId}`; OpenRegister's
  `McpToolsService` discovers per-app providers by exactly that alias.
- `tests/Stubs/Mcp/IMcpToolProvider.php` — a stand-in for the interface until
  [openregister PR #1466](https://codeberg.org/Conduction/openregister/pulls/1466)
  merges; once the openregister app is installed alongside your app the real
  interface takes over transparently.
- `tests/Unit/Mcp/ExampleToolProviderTest.php` — the contract test.

**To wire up your app:**

1. Rename `ExampleToolProvider` → `{YourApp}ToolProvider` (update the alias in
   `Application.php` and the test).
2. Replace the two example tools with real ones — each descriptor needs
   `id` (`{appId}.{toolName}`), `name`, `description`, and an `inputSchema`
   (JSON Schema object).
3. In `invokeTool()`, **run per-object authorisation before any business logic
   or data access** — validate args, then authorise, then delegate, then
   return. `invokeTool()` MUST NOT throw — every failure path returns a
   structured `['error' => ['code' => ..., 'message' => ...]]` array.

References: hydra
[ADR-034 (AI Chat Companion)](https://codeberg.org/Conduction/hydra/src/branch/development/openspec/architecture/adr-034-ai-chat-companion.md)
and ADR-035; and decidesk's `OCA\Decidesk\Mcp\DecideskToolProvider` as the
production example (five real tools, deep links, source descriptors).

### Code quality

```bash
# PHP
composer check:strict   # All quality checks (PHPCS, PHPMD, Psalm, PHPStan, tests)
composer cs:fix         # Auto-fix PHPCS issues
composer phpmd          # Mess detection
composer phpmetrics     # HTML metrics report

# Frontend
npm run lint            # ESLint
npm run stylelint       # CSS linting
```

### Enable locally

Nextcloud requires the app directory name to match the `<id>` in `appinfo/info.xml` (`apptemplate`).
When this repo is cloned as `nextcloud-app-template`, create a relative symlink first.

> **Note:** The `js/` build output is not committed. You must build the frontend before enabling the app, or the UI will be blank.

```bash
make dev-link
npm install && npm run build
docker exec nextcloud php occ app:enable apptemplate
```

### End-to-end tests

```bash
PLAYWRIGHT_BASE_URL=http://localhost:8096 npx playwright test --project chromium
```

`PLAYWRIGHT_BASE_URL` is **required and has no default**, and the config
rejects a `:8080` base URL outright.

That is deliberate. `:8080` is the *shared* Nextcloud dev container: it bind-mounts
real host checkouts, so anything a suite writes lands in somebody's working tree,
and a login spec pointed at it fires failed logins and brute-force lockouts into an
instance other people are using. Two apps in this fleet were found doing exactly
that — one via a `NEXTCLOUD_URL ?? 'http://localhost:8080'` fallback, the other via
a `hostname: 'localhost', port: 8080` pair that no URL grep would ever find.

Run e2e against a **disposable** instance with its own port and a *named volume*
(never a bind mount) for `/var/www/html`. Verify isolation before trusting a run —
this must print `volume`, not `bind`:

```bash
docker inspect <your-e2e-container> --format '{{range .Mounts}}{{.Type}}{{end}}'
```

`npm install && npm run build` must happen *before* the app is copied into the
container, or the suite silently tests a stale bundle.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3.5, Pinia, @nextcloud/vue 9 |
| Build | Webpack 5, @nextcloud/webpack-vue-config |
| Backend | PHP 8.1+, Nextcloud App Framework |
| Data | OpenRegister (PostgreSQL JSON objects) |
| UX | @conduction/nextcloud-vue |
| Quality | PHPCS, PHPMD, Psalm, PHPStan, ESLint, Stylelint |

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Stable releases — triggers release workflow |
| `beta` | Beta / pre-release builds |
| `development` | Active development — merge target for feature branches |

## Documentation

The user-facing documentation site lives in [`docs/`](docs/) — a Docusaurus site built on [`@conduction/docusaurus-preset`](https://www.npmjs.com/package/@conduction/docusaurus-preset) with the brand `<DetailHero>` / `<WidgetShelf>` landing page, the journeydoc tutorial scaffold ([`docs/tutorials/`](docs/tutorials/) — user "first launch" + admin "manage settings"), and the Playwright `docs-capture` project for screenshots (hydra ADR-030).

`.github/workflows/documentation.yml` deploys the site on every push to `development`: it runs `cd docs && npm ci && npm run build` and publishes to `<slug>.conduction.nl`. That slug is the **documentation-site** slug, not the app id — it is carried by `docs/static/CNAME` (and mirrored in `docusaurus.config.js` and the `cname:` input of `documentation.yml`), and the template's placeholder value is `app-template`, so `app-template.conduction.nl`. Rewrite it to your own docs hostname during the renaming pass; renaming the *app id* does not move it. Build the site locally with:

```bash
cd docs
npm ci --legacy-peer-deps
npm run build      # → build/  ([SUCCESS] Generated static files)
npm run start      # local dev server with hot reload
```

Project / spec documentation:

| Resource | Description |
|----------|-------------|
| [`openspec/app-config.json`](openspec/app-config.json) | App identity, goals, dependencies, and CI configuration |
| [`openspec/specs/`](openspec/specs/) | Feature specs — what the app should do |
| [`openspec/architecture/`](openspec/architecture/) | App-specific Architectural Decision Records |
| [`openspec/ROADMAP.md`](openspec/ROADMAP.md) | Product roadmap |
| [`openspec/`](openspec/) | Implementation specifications and changes |

## Standards & Compliance

- **Accessibility:** WCAG AA (Dutch government requirement)
- **Authorization:** RBAC via OpenRegister
- **Audit trail:** Full change history on all objects
- **Localization:** English and Dutch

## Related Apps

- **[OpenRegister](https://codeberg.org/Conduction/openregister)** — Object storage layer (required dependency)

_Add related apps here as integrations are built._

## Troubleshooting

### App UI is blank after enabling

The `js/` build output is not committed to the repo. Run the frontend build before enabling the app:

```bash
npm install && npm run build
```

### "Could not download app apptemplate" when running `occ app:enable`

Nextcloud requires the app directory name to exactly match the `<id>` in `appinfo/info.xml`. When this repo is cloned as `nextcloud-app-template`, create a symlink first:

```bash
make dev-link   # creates apps-extra/apptemplate -> nextcloud-app-template
```

Then enable the app again:

```bash
docker exec nextcloud php occ app:enable apptemplate
```

## Support

For support, contact us at [support@conduction.nl](mailto:support@conduction.nl).

For a Service Level Agreement (SLA), contact [sales@conduction.nl](mailto:sales@conduction.nl).

## License

This project is licensed under the [EUPL-1.2](LICENSE).

### Dependency license policy

All dependencies (PHP and JavaScript) are automatically checked against an approved license allowlist during CI. The following SPDX license families are approved:

- **Permissive:** MIT, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, Apache-2.0, Unlicense, CC0-1.0, CC-BY-3.0, CC-BY-4.0, Zlib, BlueOak-1.0.0, Artistic-2.0, BSL-1.0
- **Copyleft (EUPL-compatible):** LGPL-2.0/2.1/3.0, GPL-2.0/3.0, AGPL-3.0, EUPL-1.1/1.2, MPL-2.0
- **Font licenses:** OFL-1.0, OFL-1.1

## Authors

Built by [Conduction](https://conduction.nl) — open-source software for Dutch government and public sector organizations.
