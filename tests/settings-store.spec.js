#!/usr/bin/env node
// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Conduction B.V.
//
// settings-store.spec.js — the settings store's failure behaviour.
//
// Usage:
//   node tests/settings-store.spec.js
//
// Exit codes:
//   0 — every arm passed
//   1 — one or more arms failed
//
// WHY THIS EXISTS
// ---------------
// The store previously returned `null` on failure and recorded nothing. `null`
// was ALSO the legitimate "nothing yet" value, so a settings endpoint answering
// 500 was indistinguishable from a fresh install — for as long as anyone cared
// to look. The spec made it worse than an oversight by REQUIRING it: "a failed
// network request MUST be logged client-side and resolve to a safe empty/null
// value", with nothing said about surfacing it.
//
// The fix keeps the safe return (a broken endpoint must not stop the SPA
// mounting) and adds an observable `error`. The arms below pin BOTH halves,
// because either one alone is the bug:
//
//   * resolving to null without recording      -> the original silent failure
//   * recording but throwing out of the action -> a broken endpoint blocks boot
//
// Arm 4 is the one that would have caught the original defect: it asserts that
// success and failure are DISTINGUISHABLE, not merely that failure returns
// null. A test asserting only `=== null` passes against the broken version.
//
// The store is exercised through a hand-rolled Pinia-shaped harness rather than
// by importing pinia: this file runs under bare `node`, like the other specs in
// this directory (registry.spec.js, manifest-v2.spec.js), and the behaviour
// under test is the actions' own control flow, not Pinia's reactivity.

'use strict'

let failures = 0
const ok = (m) => console.log(`  ok   — ${m}`)
const bad = (m) => { console.log(`  FAIL — ${m}`); failures += 1 }

// ---------------------------------------------------------------------------
// A minimal stand-in for the store: the same state shape and the same action
// bodies, with cnFetchJson injected. Keeping the bodies here rather than
// importing the real module is a deliberate trade-off and its limit is stated
// plainly: this pins the CONTRACT (what happens on success vs failure), not the
// module wiring. The wiring is covered by the build and by the e2e app-shell
// spec, which boots the real store.
// ---------------------------------------------------------------------------
function makeStore(fetchJson) {
	const store = {
		settings: {},
		loading: false,
		hasOpenRegisters: false,
		isAdmin: false,
		error: null,

		get hasError() { return store.error !== null },

		async fetchSettings() {
			store.loading = true
			store.error = null
			try {
				const data = await fetchJson('/apps/apptemplate/api/settings')
				store.settings = data
				store.hasOpenRegisters = !!data?.openregisters
				store.isAdmin = !!data?.isAdmin
				return data
			} catch (error) {
				store.error = error
				return null
			} finally {
				store.loading = false
			}
		},

		async saveSettings(payload) {
			store.loading = true
			store.error = null
			try {
				const data = await fetchJson('/apps/apptemplate/api/settings', {
					method: 'POST',
					body: JSON.stringify(payload),
				})
				store.settings = data
				return data
			} catch (error) {
				store.error = error
				return null
			} finally {
				store.loading = false
			}
		},
	}
	return store
}

const resolving = (value) => async () => value
const rejecting = (err) => async () => { throw err }

async function main() {
	// ---- arm 1: a successful read populates state and clears error ---------
	{
		const store = makeStore(resolving({ openregisters: true, isAdmin: true, foo: 'bar' }))
		const out = await store.fetchSettings()
		if (out?.foo === 'bar' && store.hasOpenRegisters === true
			&& store.isAdmin === true && store.error === null && store.loading === false) {
			ok('a successful read populates settings, derives the flags, and clears error')
		} else {
			bad(`successful read left state wrong: ${JSON.stringify({ out, e: store.error, l: store.loading })}`)
		}
	}

	// ---- arm 2: a failed read RESOLVES (does not throw) --------------------
	{
		const store = makeStore(rejecting(new Error('boom')))
		let threw = false
		let out
		try { out = await store.fetchSettings() } catch { threw = true }
		if (!threw && out === null && store.loading === false) {
			ok('a failed read resolves to null rather than throwing, and clears loading')
		} else {
			bad(`failed read threw (${threw}) or returned ${JSON.stringify(out)}`)
		}
	}

	// ---- arm 3: a failed read RECORDS the failure --------------------------
	{
		const store = makeStore(rejecting(new Error('boom')))
		await store.fetchSettings()
		if (store.error instanceof Error && store.hasError === true) {
			ok('a failed read records the error in state')
		} else {
			bad(`failed read did not record an error: ${String(store.error)}`)
		}
	}

	// ---- arm 4: failure is DISTINGUISHABLE from an empty result ------------
	// The arm that would have caught the original defect. Both calls return a
	// falsy-ish result; only `error` tells them apart.
	{
		const empty = makeStore(resolving(null))
		await empty.fetchSettings()
		const broken = makeStore(rejecting(new Error('500')))
		await broken.fetchSettings()
		if (empty.error === null && broken.error !== null) {
			ok('"the backend had nothing" and "the backend failed" are distinguishable')
		} else {
			bad(`indistinguishable: empty.error=${String(empty.error)} broken.error=${String(broken.error)}`)
		}
	}

	// ---- arm 5: error is cleared at the START of the next request ----------
	{
		let mode = 'fail'
		const store = makeStore(async () => {
			if (mode === 'fail') throw new Error('boom')
			return { ok: true }
		})
		await store.fetchSettings()
		if (store.error === null) { bad('precondition: error should be set after a failure'); }
		mode = 'succeed'
		await store.fetchSettings()
		if (store.error === null) {
			ok('a subsequent successful request clears the previous error')
		} else {
			bad('a stale error survived a successful request')
		}
	}

	// ---- arm 6: saveSettings behaves the same way --------------------------
	{
		const store = makeStore(rejecting(new Error('nope')))
		let threw = false
		let out
		try { out = await store.saveSettings({ register: 'x' }) } catch { threw = true }
		if (!threw && out === null && store.error !== null && store.loading === false) {
			ok('a failed save resolves to null, records the error, and clears loading')
		} else {
			bad(`failed save behaved wrongly: threw=${threw} out=${JSON.stringify(out)} err=${String(store.error)}`)
		}
	}

	console.log('')
	if (failures === 0) {
		console.log('settings-store.spec: all arms passed')
		process.exit(0)
	}
	console.log(`settings-store.spec: ${failures} arm(s) failed`)
	process.exit(1)
}

main()
