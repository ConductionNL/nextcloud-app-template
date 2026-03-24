# App Template

## Overview

A template for creating new Nextcloud apps following ConductionNL conventions. Replace this description with your app's purpose.

## Tech Stack

- **Backend:** PHP 8.1+, Nextcloud 28-33
- **Frontend:** Vue 2.7, Pinia 2.1, Vue Router 3.6, Webpack 5
- **UI Components:** @nextcloud/vue 8.x, @conduction/nextcloud-vue
- **Data Layer:** OpenRegister (JSON object storage with schema validation)
- **Quality:** PHPCS, PHPMD, Psalm, PHPStan, ESLint, Stylelint
- **CI/CD:** GitHub Actions (quality, release, branch protection)

## Architecture

**Pattern:** Thin client on OpenRegister — this app owns no database tables.

- Frontend Vue stores query the OpenRegister API directly
- Backend is minimal: settings controller + configuration import
- Register/schema definitions in `lib/Settings/app_template_register.json`
- Auto-imported via repair step on app install/enable

## Key Directories

```
appinfo/          — App metadata, routes
lib/              — PHP backend (controllers, services, listeners, repair)
src/              — Vue frontend (views, store, router, navigation)
templates/        — PHP template shells for SPA mounting
img/              — App icons and screenshots
l10n/             — Translations (en, nl)
tests/            — PHPUnit tests
openspec/         — OpenSpec configuration and specs
```

## Development

```bash
# Install dependencies
composer install
npm install

# Build frontend
npm run build        # production
npm run dev          # development
npm run watch        # watch mode

# Quality checks
composer check:strict   # Full PHP quality suite
npm run lint            # ESLint
npm run stylelint       # CSS linting

# Tests (inside Nextcloud container)
docker exec -w /var/www/html/custom_apps/app-template nextcloud php vendor/bin/phpunit -c phpunit.xml
```

## Features

- [ ] Dashboard
- [ ] Admin settings with OpenRegister configuration
- [ ] User settings
- [ ] Deep link search integration
- [ ] Example object type CRUD

## Standards

- NL Design System (CSS variables, WCAG AA)
- Schema.org type annotations
- OpenRegister data layer (no custom DB tables)
