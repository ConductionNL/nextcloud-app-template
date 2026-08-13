<!-- SPDX-License-Identifier: EUPL-1.2 -->
<!-- Copyright (C) 2026 Conduction B.V. -->

<!--
  EmailField — scaffold demo for kind: "form-field" registry entries.

  Registers with appliesTo: { format: "email" } so the form renderer
  automatically substitutes this component for any JSON Schema property
  with format: "email".

  Replace or delete when scaffolding a new app. To add your own
  form-field:

  1. Copy this file to src/formFields/<YourField>.vue.
  2. Register it in src/registry.js with kind: "form-field" and the
     appropriate appliesTo.format or appliesTo.property.
  3. The form renderer will auto-bind it to matching properties.

  @spec openspec/specs/scaffold-v2/spec.md#requirement-five-kind-registry-shipped
-->
<template>
	<div class="email-field">
		<label :for="fieldId" class="email-field__label">
			{{ label }}
		</label>
		<input
			:id="fieldId"
			type="email"
			class="email-field__input"
			:value="modelValue"
			:placeholder="placeholder"
			@input="$emit('update:modelValue', $event.target.value)" />
	</div>
</template>

<script>
let _counter = 0

export default {
	name: 'EmailField',

	props: {
		/**
		 * Current field value.
		 *
		 * Vue 3 renamed the default `v-model` contract from
		 * `value` + `@input` to `modelValue` + `@update:modelValue`. Keeping
		 * the Vue 2 names here would leave `v-model="x"` on this component
		 * silently dead — it would bind a prop the component does not declare
		 * and listen for an event it never emits, with no console error.
		 */
		modelValue: {
			type: String,
			default: '',
		},
		/** Field label. */
		label: {
			type: String,
			default: 'Email',
		},
		/** Placeholder text. */
		placeholder: {
			type: String,
			default: 'example@domain.com',
		},
	},

	emits: ['update:modelValue'],

	data() {
		_counter += 1
		return {
			fieldId: `email-field-${_counter}`,
		}
	},
}
</script>

<style scoped>
.email-field {
	display: flex;
	flex-direction: column;
	gap: var(--default-grid-baseline, 4px);
}

.email-field__label {
	font-weight: 600;
	font-size: 0.875rem;
}

.email-field__input {
	width: 100%;
	padding: var(--default-grid-baseline, 4px)
		calc(var(--default-grid-baseline, 4px) * 2);
	border: 1px solid var(--color-border-dark, #ccc);
	border-radius: var(--border-radius, 4px);
}
</style>
