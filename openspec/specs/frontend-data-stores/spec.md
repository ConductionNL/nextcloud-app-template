---
example: true
capability: frontend-data-stores
status: example
built_by: openspec/changes/example-change
---

# Frontend Data Stores Specification

> ⚠️ **EXAMPLE SPEC** — This spec lives in the `nextcloud-app-template` repository
> as a demonstration of the OpenSpec format for the **frontend** layer. It
> describes the behaviour of the Pinia stores in `src/store/` (the generic
> OpenRegister object store, the app-settings store, and the boot-time store
> initializer). Apps built from this template will typically keep this
> capability almost unchanged; the substitutions are the schema/register names
> registered with the object store and the API base paths.

## Purpose

Per ADR-022, template-derived apps own no database of their own — the Vue SPA
talks to OpenRegister's object API directly through a thin Pinia store layer.
This capability defines that store layer:

- A **generic object store** obtained from `createObjectStore` in
  `@conduction/nextcloud-vue` and instantiated in `src/store/store.js`. The app
  does NOT define one of its own: per ADR-071 Decision 2 the library's factory
  is the only generic OpenRegister object store, and per ADR-026 an app-local
  copy drifts from the lib's action surface until a manifest-rendered page calls
  an action that no longer exists.
- An **app-settings store** (`src/store/modules/settings.js`) that reads and
  writes the app's own settings through the backend `GET`/`POST /api/settings`
  endpoints defined by the settings-management capability — it is the frontend
  half of REQ-CFG-001 / REQ-CFG-002.
- A **boot-time initializer** (`src/store/store.js`) that wires the object store
  to OpenRegister's URLs and primes the settings store before the SPA renders.

All store actions MUST degrade gracefully: a failed network request MUST NOT
throw out of the action, so a single failing fetch never breaks the SPA mount
(mirrors ADR-005's "log server-side, return safe fallback" rule on the client).

**Degrading is not the same as going quiet.** An action that resolves to
`null`/`[]` on failure MUST also record the failure where a caller can see it —
logged client-side AND exposed in store state. The earlier wording required only
the safe value, and `null` was simultaneously the legitimate "nothing yet"
value, so a settings endpoint returning 500 was indistinguishable from a fresh
install for as long as anyone cared to look.

## Requirements

### REQ-STORE-001: The object store comes from the library, not from the app

The app MUST obtain its generic OpenRegister object store from
`createObjectStore` in `@conduction/nextcloud-vue`, instantiated once in
`src/store/store.js` with the app's register and schema slugs. The app MUST NOT
define its own generic object store.

Per ADR-071 Decision 2 the library's factory is the only generic object store in
the fleet; per ADR-026 an app-local copy drifts from the lib's action surface,
and the observed failure mode is a manifest-rendered page calling an action the
local store never had (`fetchObject is not a function`, decidesk#162).

#### Scenario: The store is created from the library factory

- GIVEN an app scaffolded from this template
- WHEN `src/store/store.js` is loaded
- THEN it MUST call `createObjectStore` imported from `@conduction/nextcloud-vue`
- AND it MUST pass the app's `register` and `schema` slugs
- AND the module MUST export the resulting store as `useObjectStore`

#### Scenario: No app-local generic object store exists

- GIVEN the app's `src/store/` tree
- WHEN it is searched for a Pinia store defining generic OpenRegister CRUD
- THEN no module other than `store.js` MAY define one
- AND in particular `src/store/modules/object.js` MUST NOT exist

### REQ-STORE-002: Object types are registered through the library's surface

Registering a logical type name against a register + schema, fetching
collections, pagination, single-flight de-duplication and error surfacing are
all the library store's responsibility. The app MUST use that surface rather
than re-implementing any part of it.

This requirement deliberately does not restate the library's action names. The
previous version of this spec pinned `configure()`, `registerObjectType()` and
`fetchObjects()` — an API the app's own dead module had and the library store
does not — so the spec described a module nothing imported while the code used a
different one.

#### Scenario: The app needs a collection

- GIVEN a store created by `createObjectStore`
- WHEN the app needs a collection of objects
- THEN it MUST call the library store's own collection action
- AND it MUST NOT construct the OpenRegister request URL itself

### REQ-STORE-003: App code does not hand-set the request token

Any HTTP the app performs outside the object store MUST go through `cnFetch` or
`cnFetchJson` from `@conduction/nextcloud-vue`. A raw `fetch()` carrying a
hand-set `requesttoken` header is forbidden (ADR-071 Decision 1): the library
owns the one blessed CSRF idiom, URL prefixing and error normalisation, so a
Nextcloud-version or CSP change is one fix rather than one per app.

#### Scenario: The settings store reads the backend

- GIVEN the settings store issues `GET /api/settings`
- WHEN the request is constructed
- THEN it MUST be issued through `cnFetchJson`
- AND the app MUST NOT import `getRequestToken` to build the header itself
- AND the URL MUST be resolved with `generateUrl` so an instance served from a
  webroot subdirectory is addressed correctly

### REQ-STORE-004: Read and write app settings from the SPA

The settings store MUST expose an async `fetchSettings()` action that `GET`s
`/api/settings` and a `saveSettings(payload)` action that `POST`s a partial
settings payload to the same endpoint, both carrying the request token. These
are the client counterparts of the settings-management capability's REQ-CFG-001
and REQ-CFG-002. Both actions MUST be issued through `cnFetchJson`
(REQ-STORE-003). `fetchSettings()` MUST additionally derive the
`hasOpenRegisters` and `isAdmin` flags from the response so the UI can degrade
gracefully (ADR-005 / REQ-CFG-004). Both actions MUST return `null` on failure
rather than throwing, and MUST record the failure in the store's `error` state
so that "the request failed" is distinguishable from "there is nothing yet".

#### Scenario: Settings load

- GIVEN the backend `GET /api/settings` returns HTTP 200
- WHEN `fetchSettings()` runs
- THEN the store MUST store the returned settings object
- AND it MUST set `hasOpenRegisters` and `isAdmin` from the response payload
- AND it MUST return the settings object

#### Scenario: Settings save

- GIVEN an admin user changes a setting
- WHEN `saveSettings({ register: 'x' })` is called
- THEN the store MUST `POST` the payload as JSON with the `requesttoken` header
- AND on HTTP 200 it MUST replace its local settings with the freshly-returned config and return it

#### Scenario: Settings request fails

- GIVEN any settings request rejects or returns a non-OK status
- WHEN the action handles the failure
- THEN it MUST log the error client-side
- AND it MUST return `null`
- AND it MUST set `error` to the failure
- AND `loading` MUST be reset to `false`

#### Scenario: A failure is distinguishable from an empty result

- GIVEN `fetchSettings()` has returned `null`
- WHEN a caller needs to know whether the backend failed or simply had nothing
- THEN `error` MUST be non-null if and only if the request failed
- AND `error` MUST be cleared at the start of the next request

### REQ-STORE-005: Initialise the stores before the SPA renders

The system MUST expose an async `initializeStores()` boot helper that
instantiates the object store and primes the settings store with a first
`fetchSettings()` call, returning both store handles to the caller.

The library store is configured by the `register`/`schema` passed to
`createObjectStore` at module load, so there is no separate `configure()` step.
The previous wording required one, describing the app-local store this template
no longer ships.

#### Scenario: Boot sequence

- WHEN `initializeStores()` is awaited during SPA bootstrap
- THEN it MUST instantiate the object store created by `createObjectStore`
- AND it MUST await `settingsStore.fetchSettings()` so the first render has settings available
- AND it MUST return `{ settingsStore, objectStore }`
- AND it MUST NOT fail the boot when `fetchSettings()` resolves to `null`
