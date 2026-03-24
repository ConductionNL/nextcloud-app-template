# Nextcloud App Template

A starting point for building Nextcloud apps following [ConductionNL](https://github.com/ConductionNL) conventions. Includes a full-stack scaffold with PHP backend, Vue 2 frontend, OpenRegister integration, quality tooling, CI/CD, and automated setup.

## Getting Started

There are two ways to set up a new app from this template:

### Option A: Automatic (GitHub Actions)

1. Click **Use this template** on GitHub
2. Name your repository (kebab-case, e.g. `my-cool-app`) and add a description
3. The **Template Setup** workflow runs automatically and:
   - Replaces all placeholders with your repo name
   - Renames the register JSON file
   - Creates `main`, `beta`, and `development` branches
   - Deletes the setup script and workflow

### Option B: Manual (setup script)

1. Clone or create from template
2. Run the interactive setup script:

```bash
bash setup.sh
```

The script asks for your app name, description, and author, then replaces all placeholders and renames files. Delete `setup.sh` when done.

### After Setup

```bash
composer install
npm install
npm run build
docker exec nextcloud php occ app:enable your-app-name
```

## What to Customize

After setup, these are the files you'll typically modify:

| File | What to change |
|------|---------------|
| `lib/Settings/*_register.json` | Define your schemas (object types) in OpenAPI 3.0.0 format |
| `lib/Service/SettingsService.php` | Add config keys for each schema in `CONFIG_KEYS` and `SLUG_TO_CONFIG_KEY` |
| `src/store/store.js` | Register object types from settings config |
| `src/router/index.js` | Add routes for your views (list + detail per object type) |
| `src/navigation/MainMenu.vue` | Add navigation items for your object types |
| `src/views/` | Add list and detail views for your object types |
| `lib/Listener/DeepLinkRegistrationListener.php` | Register deep links for your object types |
| `l10n/en.json` + `l10n/nl.json` | Add translation keys |
| `appinfo/info.xml` | Update descriptions, categories, screenshots |
| `openspec/config.yaml` | Update project context for spec-driven development |
| `project.md` | Document your app's architecture and features |

## Repository Structure

```
app-template/
|
|-- appinfo/                          # Nextcloud app metadata
|   |-- info.xml                      # App manifest (name, version, deps, navigation, settings, repair steps)
|   +-- routes.php                    # API routes + SPA catch-all
|
|-- lib/                              # PHP backend
|   |-- AppInfo/
|   |   +-- Application.php           # Main app class (IBootstrap), registers listeners
|   |-- Controller/
|   |   |-- DashboardController.php   # Renders the main SPA template
|   |   +-- SettingsController.php    # Settings API (GET/POST + load/reimport)
|   |-- Service/
|   |   +-- SettingsService.php       # Config management, OpenRegister import, auto-configure
|   |-- Listener/
|   |   +-- DeepLinkRegistrationListener.php  # Unified search deep links
|   |-- Repair/
|   |   +-- InitializeSettings.php    # Post-migration: auto-imports register JSON
|   |-- Settings/
|   |   |-- AdminSettings.php         # Admin settings page
|   |   +-- *_register.json           # OpenRegister schema definitions (OpenAPI 3.0.0)
|   +-- Sections/
|       +-- SettingsSection.php       # Admin settings section
|
|-- src/                              # Vue 2 frontend
|   |-- main.js                       # App entry point (Pinia, router, translations)
|   |-- settings.js                   # Admin settings entry point
|   |-- pinia.js                      # Pinia store instance
|   |-- App.vue                       # Root component (OpenRegister check, sidebar, loading)
|   |-- router/
|   |   +-- index.js                  # Hash-mode router with catch-all
|   |-- store/
|   |   |-- store.js                  # Store initializer (fetches settings, registers object types)
|   |   +-- modules/
|   |       |-- settings.js           # Settings Pinia store (fetch/save config)
|   |       +-- object.js             # Generic OpenRegister object store (CRUD by type)
|   |-- navigation/
|   |   +-- MainMenu.vue              # Left sidebar navigation
|   |-- views/
|   |   |-- Dashboard.vue             # Main dashboard view
|   |   +-- settings/
|   |       |-- AdminRoot.vue         # Admin settings with version card
|   |       |-- Settings.vue          # Admin config form
|   |       +-- UserSettings.vue      # Personal preferences dialog
|   +-- assets/
|       +-- app.css                   # Global styles (CSS variables only)
|
|-- templates/                        # PHP templates for SPA mounting
|   |-- index.php                     # Main app: loads JS, renders <div id="content">
|   +-- settings/
|       +-- admin.php                 # Admin: loads settings JS, renders mount point
|
|-- img/                              # Icons and screenshots
|   |-- app.svg                       # Light mode icon
|   |-- app-dark.svg                  # Dark mode icon
|   +-- app-store.svg                 # App store listing icon
|
|-- l10n/                             # Translations
|   |-- en.json                       # English
|   +-- nl.json                       # Dutch
|
|-- tests/                            # PHPUnit tests
|   |-- bootstrap.php                 # Test bootstrap (OCP autoloader)
|   +-- unit/
|       +-- Controller/
|           +-- SettingsControllerTest.php
|
|-- openspec/                         # Spec-driven development
|   +-- config.yaml                   # OpenSpec project configuration
|
|-- .github/workflows/               # CI/CD pipelines
|   |-- code-quality.yml              # PHPCS, PHPMD, Psalm, PHPStan, ESLint
|   |-- release-stable.yml            # Stable release (on main push)
|   |-- release-beta.yml              # Beta release (on beta push)
|   |-- branch-protection.yml         # PR check enforcement
|   |-- sync-to-beta.yml              # Auto-sync development -> beta
|   |-- openspec-sync.yml             # Sync specs to project management
|   |-- issue-triage.yml              # Auto-triage issues to project board
|   |-- documentation.yml             # Build docs site
|   +-- template-setup.yml            # One-time setup (deletes itself after run)
|
|-- phpcs-custom-sniffs/              # Custom PHPCS rules
|   +-- CustomSniffs/Sniffs/Functions/NamedParametersSniff.php
|
|-- setup.sh                          # Interactive setup script (delete after use)
|-- project.md                        # Project architecture documentation
|-- composer.json                     # PHP dependencies + quality scripts
|-- package.json                      # npm dependencies + build scripts
|-- webpack.config.js                 # Webpack 5 config (main + settings entries)
|-- phpcs.xml                         # PHPCS standard
|-- phpmd.xml                         # PHPMD ruleset
|-- phpstan.neon                      # PHPStan config (level 5)
|-- psalm.xml                         # Psalm config (error level 4)
|-- phpunit.xml                       # PHPUnit config
+-- LICENSE                           # EUPL-1.2
```

## Architecture

### Data Flow

```
User --> Vue Frontend (Pinia stores)
              |
              |--> OpenRegister API (object CRUD)
              |--> Settings API (/api/settings)

Admin --> Settings Page
              |
              |--> SettingsController --> SettingsService --> IAppConfig
              |--> Load/reimport --> ConfigurationService --> *_register.json
```

### Key Patterns

- **Thin client** — The app owns no database tables. All data is stored via OpenRegister.
- **Register JSON** — Schema definitions live in `lib/Settings/*_register.json` (OpenAPI 3.0.0 format). They are auto-imported on app install via the `InitializeSettings` repair step.
- **Deep links** — The `DeepLinkRegistrationListener` registers URL patterns so Nextcloud's unified search links directly to your detail views.
- **Sidebar state** — `App.vue` provides a reactive `sidebarState` object via Vue's `provide/inject` for the `CnIndexSidebar` component.
- **Hash-mode router** — All apps use hash-mode routing (`/#/path`) with a catch-all backend route.

### Placeholder Naming Convention

The template uses four naming variants that get replaced during setup:

| Variant | Template Value | Example |
|---------|---------------|---------|
| kebab-case | `app-template` | `my-cool-app` |
| snake_case | `app_template` | `my_cool_app` |
| PascalCase | `AppTemplate` | `MyCoolApp` |
| Display | `App Template` | `My Cool App` |

## Code Quality

```bash
# Full PHP quality suite (PHPCS + PHPMD + Psalm + PHPStan + tests)
composer check:strict

# Quick check (lint + PHPCS + Psalm + tests)
composer check

# Auto-fix PHP code style
composer cs:fix

# Frontend linting
npm run lint          # ESLint
npm run lint-fix      # ESLint auto-fix
npm run stylelint     # CSS/SCSS linting
```

## Branches

| Branch | Purpose | Trigger |
|--------|---------|---------|
| `main` | Stable releases | Push triggers release-stable workflow |
| `beta` | Beta releases | Push triggers release-beta workflow |
| `development` | Active development | Push auto-syncs to beta |
| `documentation` | Docs site | Push triggers GitHub Pages build |

## Requirements

- PHP 8.1+
- Nextcloud 28-33
- Node.js 20+, npm 10+
- [OpenRegister](https://github.com/ConductionNL/openregister) (runtime dependency)

## License

EUPL-1.2 — see [LICENSE](LICENSE).

Registered on the Nextcloud App Store as AGPL (the store does not recognize EUPL).

**Support:** support@conduction.nl | [conduction.nl](https://conduction.nl)
