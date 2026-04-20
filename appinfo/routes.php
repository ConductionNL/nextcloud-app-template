<?php

/**
 * AppTemplate route registration.
 *
 * Route ordering matters (ADR-003, project memory):
 *   1. Specific routes (dashboard `/`, API routes, metrics, health) come first.
 *   2. Wildcard SPA catch-all (`/{path}`) comes LAST — Symfony matches top-down.
 *
 * Public endpoints that need CORS (health check) register an explicit OPTIONS
 * route per ADR-002.
 *
 * SPDX-FileCopyrightText: 2026 Conduction B.V. <info@conduction.nl>
 * SPDX-License-Identifier: EUPL-1.2
 *
 * @spec openspec/changes/example-change/tasks.md#task-10
 */

declare(strict_types=1);

return [
    'routes' => [
        // Dashboard (SPA entry).
        ['name' => 'dashboard#page', 'url' => '/', 'verb' => 'GET'],

        // Settings API (ADR-002: /api/{resource}, lowercase plural, standard verbs).
        ['name' => 'settings#index', 'url' => '/api/settings', 'verb' => 'GET'],
        ['name' => 'settings#create', 'url' => '/api/settings', 'verb' => 'POST'],
        ['name' => 'settings#load', 'url' => '/api/settings/load', 'verb' => 'POST'],

        // Prometheus metrics endpoint (ADR-006) — admin auth.
        ['name' => 'metrics#index', 'url' => '/api/metrics', 'verb' => 'GET'],

        // Health check (ADR-006) — public, returns JSON. OPTIONS registered for CORS.
        ['name' => 'health#index', 'url' => '/api/health', 'verb' => 'GET'],
        ['name' => 'health#index', 'url' => '/api/health', 'verb' => 'OPTIONS'],

        // SPA catch-all — MUST remain last. Distinct route name from dashboard#page so
        // Symfony does not replace the GET `/` route (same names overwrite each other).
        ['name' => 'dashboard#catchAll', 'url' => '/{path}', 'verb' => 'GET', 'requirements' => ['path' => '.+'], 'defaults' => ['path' => '']],
    ],
];
