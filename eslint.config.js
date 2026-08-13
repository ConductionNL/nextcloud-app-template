const {
	defineConfig,
} = require('@eslint/config-helpers')

const js = require('@eslint/js')

const {
	FlatCompat,
} = require('@eslint/eslintrc')

// Shared Vue 3 correction layer from @conduction/nextcloud-vue.
//
// `@nextcloud/eslint-config@8` (pulled in via FlatCompat below) resolves
// eslint-plugin-vue's **Vue 2** preset. That is not merely stale: several of
// its rules are INVERTED under Vue 3, and none of the 21
// `vue/no-deprecated-*` rules are active — so Vue 2 idioms survive a
// migration silently. `beforeDestroy` is the dangerous case: Vue 3 does not
// call that hook at all, so a component that cleans up an interval or a
// subscription there leaks with zero console output.
//
// `conductionVue3Fixes` is an ARRAY of three flat-config objects
// (language level, SFC parser, deprecation rules). It deliberately
// registers no plugins, so it must be spread **last** to win over the
// `@nextcloud` preset it is correcting.
//
// NOTE: it enables `vue/v-on-event-hyphenation` with
// `ignore: ['update:modelValue']`. That exception is load-bearing —
// Nextcloud Vue 3 field components read `onUpdate:modelValue` directly via
// `useModel`, so the hyphenated `@update:model-value` form is silently dead.
const {
	conductionVue3Fixes,
} = require('@conduction/nextcloud-vue/eslint')

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
})

module.exports = defineConfig([{
	extends: compat.extends('@nextcloud'),

	settings: {
		'import/resolver': {
			alias: {
				map: [
					['@', './src'],
					['@floating-ui/dom-actual', './node_modules/@floating-ui/dom'],
					['@conduction/nextcloud-vue', '../nextcloud-vue/src'],
				],
				extensions: ['.js', '.ts', '.vue', '.json', '.css'],
			},
		},
	},

	rules: {
		// Allow unused i18n functions (t, n) — imported for future translation wiring
		'no-unused-vars': ['error', { varsIgnorePattern: '^(t|n)$', argsIgnorePattern: '^_' }],
		'jsdoc/require-jsdoc': 'off',
		// @spec is the hydra gate-16 spec-traceability tag (ADR-020) — a
		// defined project tag, not a typo.
		'jsdoc/check-tag-names': ['warn', { definedTags: ['spec'] }],
		'vue/first-attribute-linebreak': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'n/no-missing-import': 'off',
		'import/namespace': 'off', // disable namespace checking to avoid parser requirement
		'import/default': 'off', // disable default import checking to avoid parser requirement
		'import/no-named-as-default': 'off', // disable named-as-default checking to avoid parser requirement
		'import/no-named-as-default-member': 'off', // disable named-as-default-member checking to avoid parser requirement
	},
}, {
	// Node-side CLI tools (build / validate scripts) legitimately use
	// console + process.exit and ship as plain JS (no shebang).
	//
	// This was an explicit file list, so every new checker added under
	// tests/ (e.g. tests/l10n/check-l10n-parity.js) silently fell outside it.
	// `npm run lint` only covered `src`, so nobody saw the resulting errors.
	// A glob keeps new checkers covered by default.
	files: ['tests/**/*.js'],
	rules: {
		'no-console': 'off',
		'n/no-process-exit': 'off',
		'n/shebang': 'off',
	},
}, {
	// Test sources import devDependencies by definition; `n/no-unpublished-import`
	// is about what ships in the published package, which tests/ never does.
	files: ['tests/**/*.js', 'tests/**/*.ts'],
	rules: {
		'n/no-unpublished-import': 'off',
	},
},

// ---------------------------------------------------------------------------
// Vue 3 correction layer — MUST stay last so it overrides the `@nextcloud`
// (Vue 2) preset above. See the require() at the top of this file.
// ---------------------------------------------------------------------------
...conductionVue3Fixes,

{
	// Two `@nextcloud`/eslint-plugin-vue Vue-2 rules that are INVERTED under
	// Vue 3 — they forbid the syntax Vue 3 requires. `conductionVue3Fixes`
	// does not currently switch these off, so they are handled here.
	// TODO(nc-vue): fold these into `conductionVue3Fixes` upstream; every
	// migrated app needs the same two lines.
	name: 'apptemplate/vue3-inverted-rules',
	files: ['**/*.vue'],
	rules: {
		// `v-model:open="x"` is the Vue 3 replacement for `:open.sync="x"`.
		'vue/no-v-model-argument': 'off',
		// `<template v-for>` MUST carry the `:key` in Vue 3 (it moved off the
		// child element), which is exactly what this Vue 2 rule forbids.
		'vue/no-v-for-template-key': 'off',
	},
}])
