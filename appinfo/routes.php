<?php

declare(strict_types=1);

return [
    'routes' => [
        // Dashboard page.
        ['name' => 'dashboard#page', 'url' => '/', 'verb' => 'GET'],

        // Settings API.
        ['name' => 'settings#index', 'url' => '/api/settings', 'verb' => 'GET'],
        ['name' => 'settings#create', 'url' => '/api/settings', 'verb' => 'POST'],
        ['name' => 'settings#load', 'url' => '/api/settings/load', 'verb' => 'POST'],

        // SPA catch-all — serves the Vue app for any frontend route (hash mode fallback).
        ['name' => 'dashboard#page', 'url' => '/{path}', 'verb' => 'GET', 'requirements' => ['path' => '.+'], 'defaults' => ['path' => '']],
    ],
];
