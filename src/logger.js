/**
 * SPDX-License-Identifier: EUPL-1.2
 * SPDX-FileCopyrightText: 2026 Conduction B.V.
 *
 * App logger — use this instead of `console.*` anywhere under `src/`.
 *
 * `@nextcloud/eslint-config@9` enables `no-console` with NO allowances, not even
 * `console.error`, so an error path that logs to the console fails the lint job.
 * This is the logger Nextcloud's own apps use, and beyond satisfying the rule it
 * is the better instrument: the builder tags every line with the app id and the
 * acting user, so a report from a live instance says which app and whose session
 * produced it.
 *
 *   import logger from '../logger.js'
 *   logger.error('Fetching examples failed', { error })
 *
 * ⚠️ It reaches `window` at MODULE LOAD (via @nextcloud/auth →
 * @nextcloud/browser-storage), so any Vitest suite that runs with
 * `environment: 'node'` must alias it to a stub — see
 * `tests/vitest/stubs/` in the apps that do this.
 */
import { getLoggerBuilder } from '@nextcloud/logger'

export default getLoggerBuilder().setApp('apptemplate').detectUser().build()
